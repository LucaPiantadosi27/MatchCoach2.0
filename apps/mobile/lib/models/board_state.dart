import 'dart:ui';

class BoardState {
  final String version;
  final List<PlayerState> players;
  final List<DrawingPath> paths;
  final BoardStateMeta? meta;

  const BoardState({
    this.version = '2.0',
    this.players = const [],
    this.paths = const [],
    this.meta,
  });

  BoardState copyWith({
    String? version,
    List<PlayerState>? players,
    List<DrawingPath>? paths,
    BoardStateMeta? meta,
  }) {
    return BoardState(
      version: version ?? this.version,
      players: players ?? this.players,
      paths: paths ?? this.paths,
      meta: meta ?? this.meta,
    );
  }

  Map<String, dynamic> toJson() => {
        'version': version,
        'players': players.map((p) => p.toJson()).toList(),
        'paths': paths.map((p) => p.toJson()).toList(),
        if (meta != null) 'meta': meta!.toJson(),
      };

  factory BoardState.fromJson(Map<String, dynamic> json) => BoardState(
        version: json['version'] as String? ?? '2.0',
        players: (json['players'] as List<dynamic>?)
                ?.map((e) => PlayerState.fromJson(e as Map<String, dynamic>))
                .toList() ??
            const [],
        paths: (json['paths'] as List<dynamic>?)
                ?.map((e) => DrawingPath.fromJson(e as Map<String, dynamic>))
                .toList() ??
            const [],
        meta: json['meta'] != null
            ? BoardStateMeta.fromJson(json['meta'] as Map<String, dynamic>)
            : null,
      );
}

class PlayerState {
  final String id;
  final String team;
  final int number;
  final double x;
  final double y;
  final double rotation;
  final String? label;

  const PlayerState({
    required this.id,
    required this.team,
    required this.number,
    this.x = 0.5,
    this.y = 0.5,
    this.rotation = 0,
    this.label,
  });

  PlayerState copyWith({
    String? id,
    String? team,
    int? number,
    double? x,
    double? y,
    double? rotation,
    String? label,
  }) {
    return PlayerState(
      id: id ?? this.id,
      team: team ?? this.team,
      number: number ?? this.number,
      x: x ?? this.x,
      y: y ?? this.y,
      rotation: rotation ?? this.rotation,
      label: label ?? this.label,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'team': team,
        'number': number,
        'x': x,
        'y': y,
        'rotation': rotation,
        if (label != null) 'label': label,
      };

  factory PlayerState.fromJson(Map<String, dynamic> json) => PlayerState(
        id: json['id'] as String,
        team: json['team'] as String,
        number: json['number'] as int,
        x: (json['x'] as num).toDouble(),
        y: (json['y'] as num).toDouble(),
        rotation: (json['rotation'] as num?)?.toDouble() ?? 0,
        label: json['label'] as String?,
      );
}

class DrawingPath {
  final String id;
  final String type; // line | arrow | freehand
  final List<Point> points;
  final String? color;
  final double? strokeWidth;

  const DrawingPath({
    required this.id,
    required this.type,
    required this.points,
    this.color,
    this.strokeWidth,
  });

  DrawingPath copyWith({
    String? id,
    String? type,
    List<Point>? points,
    String? color,
    double? strokeWidth,
  }) {
    return DrawingPath(
      id: id ?? this.id,
      type: type ?? this.type,
      points: points ?? this.points,
      color: color ?? this.color,
      strokeWidth: strokeWidth ?? this.strokeWidth,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'points': points.map((p) => p.toJson()).toList(),
        if (color != null) 'color': color,
        if (strokeWidth != null) 'strokeWidth': strokeWidth,
      };

  factory DrawingPath.fromJson(Map<String, dynamic> json) => DrawingPath(
        id: json['id'] as String,
        type: json['type'] as String,
        points: (json['points'] as List<dynamic>)
            .map((e) => Point.fromJson(e as Map<String, dynamic>))
            .toList(),
        color: json['color'] as String?,
        strokeWidth: (json['strokeWidth'] as num?)?.toDouble(),
      );
}

class Point {
  final double x;
  final double y;

  const Point(this.x, this.y);

  Map<String, dynamic> toJson() => {'x': x, 'y': y};

  factory Point.fromJson(Map<String, dynamic> json) => Point(
        (json['x'] as num).toDouble(),
        (json['y'] as num).toDouble(),
      );

  Offset toOffset(double width, double height) => Offset(x * width, y * height);
}

class BoardStateMeta {
  final String? title;
  final String? notes;

  const BoardStateMeta({this.title, this.notes});

  Map<String, dynamic> toJson() => {
        if (title != null) 'title': title,
        if (notes != null) 'notes': notes,
      };

  factory BoardStateMeta.fromJson(Map<String, dynamic> json) => BoardStateMeta(
        title: json['title'] as String?,
        notes: json['notes'] as String?,
      );
}
