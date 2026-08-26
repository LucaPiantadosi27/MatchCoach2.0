import 'package:flutter_test/flutter_test.dart';
import 'package:matchcoach_mobile/models/board_state.dart';
import 'package:matchcoach_mobile/models/recording.dart';

void main() {
  group('MovementRecording interpolation', () {
    final base = BoardState(
      players: [
        PlayerState(id: 'p1', team: 'A', number: 1, x: 0.0, y: 0.0, rotation: 0),
      ],
    );

    final recording = MovementRecording(
      duration: 1000,
      initialState: [
        PlayerKeyframe(playerId: 'p1', x: 0.0, y: 0.0, rotation: 0),
      ],
      keyframes: [
        Keyframe(
          timestamp: 1000,
          players: [PlayerKeyframe(playerId: 'p1', x: 1.0, y: 1.0, rotation: 180)],
        ),
      ],
    );

    test('returns start position at time 0', () {
      final interpolated = recording.interpolateAt(base, 0);
      final p = interpolated.players.first;
      expect(p.x, 0.0);
      expect(p.y, 0.0);
      expect(p.rotation, 0.0);
    });

    test('returns end position at time 1000', () {
      final interpolated = recording.interpolateAt(base, 1000);
      final p = interpolated.players.first;
      expect(p.x, 1.0);
      expect(p.y, 1.0);
      expect(p.rotation, 180.0);
    });

    test('interpolates at halfway', () {
      final interpolated = recording.interpolateAt(base, 500);
      final p = interpolated.players.first;
      expect(p.x, closeTo(0.5, 0.001));
      expect(p.y, closeTo(0.5, 0.001));
    });

    test('clamps time outside duration', () {
      final early = recording.interpolateAt(base, -100);
      final late = recording.interpolateAt(base, 2000);
      expect(early.players.first.x, 0.0);
      expect(late.players.first.x, 1.0);
    });
  });
}
