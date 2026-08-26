import 'board_state.dart';

class MovementRecording {
  final String version;
  final int duration;
  final List<PlayerKeyframe> initialState;
  final List<Keyframe> keyframes;

  const MovementRecording({
    this.version = '1.0',
    this.duration = 0,
    this.initialState = const [],
    this.keyframes = const [],
  });

  MovementRecording copyWith({
    String? version,
    int? duration,
    List<PlayerKeyframe>? initialState,
    List<Keyframe>? keyframes,
  }) {
    return MovementRecording(
      version: version ?? this.version,
      duration: duration ?? this.duration,
      initialState: initialState ?? this.initialState,
      keyframes: keyframes ?? this.keyframes,
    );
  }

  Map<String, dynamic> toJson() => {
        'version': version,
        'duration': duration,
        'initialState': initialState.map((p) => p.toJson()).toList(),
        'keyframes': keyframes.map((k) => k.toJson()).toList(),
      };

  factory MovementRecording.fromJson(Map<String, dynamic> json) =>
      MovementRecording(
        version: json['version'] as String? ?? '1.0',
        duration: json['duration'] as int? ?? 0,
        initialState: (json['initialState'] as List<dynamic>?)
                ?.map((e) => PlayerKeyframe.fromJson(e as Map<String, dynamic>))
                .toList() ??
            const [],
        keyframes: (json['keyframes'] as List<dynamic>?)
                ?.map((e) => Keyframe.fromJson(e as Map<String, dynamic>))
                .toList() ??
            const [],
      );

  /// Builds an interpolated board for the given [time] in milliseconds.
  BoardState interpolateAt(BoardState base, int time) {
    if (keyframes.isEmpty) return base;
    final clamped = time.clamp(0, duration);

    final players = base.players.map((player) {
      final track = _buildTrack(player.id);
      final pos = _interpolate(track, clamped);
      return player.copyWith(x: pos.x, y: pos.y, rotation: pos.rotation);
    }).toList();

    return base.copyWith(players: players);
  }

  List<_TrackPoint> _buildTrack(String playerId) {
    final track = <_TrackPoint>[];
    final initial = initialState.where((p) => p.playerId == playerId);
    if (initial.isNotEmpty) {
      final p = initial.first;
      track.add(_TrackPoint(0, p.x, p.y, p.rotation));
    }
    for (final keyframe in keyframes) {
      final p = keyframe.players.where((p) => p.playerId == playerId);
      if (p.isNotEmpty) {
        track.add(_TrackPoint(
          keyframe.timestamp,
          p.first.x,
          p.first.y,
          p.first.rotation,
        ));
      }
    }
    track.sort((a, b) => a.timestamp.compareTo(b.timestamp));
    return track;
  }

  _TrackPoint _interpolate(List<_TrackPoint> track, int time) {
    if (track.isEmpty) return _TrackPoint(0, 0.5, 0.5, 0);
    if (time <= track.first.timestamp) return track.first;
    if (time >= track.last.timestamp) return track.last;

    for (var i = 0; i < track.length - 1; i++) {
      final a = track[i];
      final b = track[i + 1];
      if (time >= a.timestamp && time <= b.timestamp) {
        final t = b.timestamp == a.timestamp
            ? 0.0
            : (time - a.timestamp) / (b.timestamp - a.timestamp);
        final x = _lerp(a.x, b.x, t);
        final y = _lerp(a.y, b.y, t);
        final rot = _lerpAngle(a.rotation, b.rotation, t);
        return _TrackPoint(time, x, y, rot);
      }
    }
    return track.last;
  }

  static double _lerp(double a, double b, double t) => a + (b - a) * t;

  static double _lerpAngle(double a, double b, double t) {
    // Keep the shortest rotation path
    final diff = (b - a) % 360;
    final shortest = diff > 180 ? diff - 360 : (diff < -180 ? diff + 360 : diff);
    return (a + shortest * t) % 360;
  }
}

class PlayerKeyframe {
  final String playerId;
  final double x;
  final double y;
  final double rotation;

  const PlayerKeyframe({
    required this.playerId,
    this.x = 0.5,
    this.y = 0.5,
    this.rotation = 0,
  });

  PlayerKeyframe copyWith({
    String? playerId,
    double? x,
    double? y,
    double? rotation,
  }) {
    return PlayerKeyframe(
      playerId: playerId ?? this.playerId,
      x: x ?? this.x,
      y: y ?? this.y,
      rotation: rotation ?? this.rotation,
    );
  }

  Map<String, dynamic> toJson() => {
        'playerId': playerId,
        'x': x,
        'y': y,
        'rotation': rotation,
      };

  factory PlayerKeyframe.fromJson(Map<String, dynamic> json) => PlayerKeyframe(
        playerId: json['playerId'] as String,
        x: (json['x'] as num).toDouble(),
        y: (json['y'] as num).toDouble(),
        rotation: (json['rotation'] as num?)?.toDouble() ?? 0,
      );

  factory PlayerKeyframe.fromPlayerState(PlayerState p) => PlayerKeyframe(
        playerId: p.id,
        x: p.x,
        y: p.y,
        rotation: p.rotation,
      );
}

class Keyframe {
  final int timestamp;
  final List<PlayerKeyframe> players;

  const Keyframe({
    required this.timestamp,
    this.players = const [],
  });

  Keyframe copyWith({int? timestamp, List<PlayerKeyframe>? players}) {
    return Keyframe(
      timestamp: timestamp ?? this.timestamp,
      players: players ?? this.players,
    );
  }

  Map<String, dynamic> toJson() => {
        'timestamp': timestamp,
        'players': players.map((p) => p.toJson()).toList(),
      };

  factory Keyframe.fromJson(Map<String, dynamic> json) => Keyframe(
        timestamp: json['timestamp'] as int,
        players: (json['players'] as List<dynamic>)
            .map((e) => PlayerKeyframe.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class _TrackPoint {
  final int timestamp;
  final double x;
  final double y;
  final double rotation;

  const _TrackPoint(this.timestamp, this.x, this.y, this.rotation);
}
