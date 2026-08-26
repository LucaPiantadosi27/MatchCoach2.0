import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../models/board_state.dart';

final uuid = Uuid();

// provider for the current board state
final boardProvider = StateNotifierProvider<BoardNotifier, BoardState>((ref) {
  return BoardNotifier();
});

// selected tool: select, line, arrow, freehand
final drawToolProvider = StateProvider<String>((ref) => 'select');

// id of the currently dragged/selected player
final selectedPlayerProvider = StateProvider<String?>((ref) => null);

class BoardNotifier extends StateNotifier<BoardState> {
  BoardNotifier() : super(_initialBoard());

  static BoardState _initialBoard() {
    return const BoardState(
      version: '2.0',
      players: [
        PlayerState(id: 'p1', team: 'A', number: 1, x: 0.5, y: 0.9, rotation: 0),
        PlayerState(id: 'p2', team: 'A', number: 2, x: 0.2, y: 0.7, rotation: 0),
        PlayerState(id: 'p3', team: 'A', number: 3, x: 0.5, y: 0.7, rotation: 0),
        PlayerState(id: 'p4', team: 'A', number: 4, x: 0.8, y: 0.7, rotation: 0),
        PlayerState(id: 'p5', team: 'B', number: 1, x: 0.5, y: 0.1, rotation: 180),
      ],
    );
  }

  void movePlayer(String id, double nx, double ny) {
    final clampedX = nx.clamp(0.0, 1.0);
    final clampedY = ny.clamp(0.0, 1.0);
    state = state.copyWith(
      players: state.players.map((p) {
        return p.id == id
            ? p.copyWith(x: clampedX, y: clampedY)
            : p;
      }).toList(),
    );
  }

  void rotatePlayer(String id, double degrees) {
    state = state.copyWith(
      players: state.players.map((p) {
        return p.id == id ? p.copyWith(rotation: degrees % 360) : p;
      }).toList(),
    );
  }

  void addPlayer(String team, int number, {double x = 0.5, double y = 0.5}) {
    final id = 'p${DateTime.now().millisecondsSinceEpoch}';
    state = state.copyWith(
      players: [...state.players, PlayerState(
        id: id,
        team: team,
        number: number,
        x: x,
        y: y,
      )],
    );
  }

  void removePlayer(String id) {
    state = state.copyWith(
      players: state.players.where((p) => p.id != id).toList(),
    );
  }

  void startPath(String type, Point point) {
    final path = DrawingPath(
      id: uuid.v4(),
      type: type,
      points: [point],
    );
    state = state.copyWith(paths: [...state.paths, path]);
  }

  void addPointToLastPath(Point point) {
    if (state.paths.isEmpty) return;
    final last = state.paths.last;
    if (last.type == 'line' || last.type == 'arrow') {
      // keep only first and current point
      final updated = last.copyWith(points: [last.points.first, point]);
      state = state.copyWith(
        paths: [...state.paths.sublist(0, state.paths.length - 1), updated],
      );
    } else {
      // freehand
      final updated = last.copyWith(points: [...last.points, point]);
      state = state.copyWith(
        paths: [...state.paths.sublist(0, state.paths.length - 1), updated],
      );
    }
  }

  void undo() {
    if (state.paths.isEmpty) return;
    state = state.copyWith(paths: state.paths.sublist(0, state.paths.length - 1));
  }

  void clearPaths() {
    state = state.copyWith(paths: []);
  }

  void updateMeta({String? title, String? notes}) {
    state = state.copyWith(
      meta: BoardStateMeta(
        title: title ?? state.meta?.title,
        notes: notes ?? state.meta?.notes,
      ),
    );
  }

  void reset() {
    state = _initialBoard();
  }
}
