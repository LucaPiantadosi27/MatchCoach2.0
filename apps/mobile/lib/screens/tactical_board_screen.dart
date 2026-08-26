import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/board_state.dart';
import '../painters/futsal_court_painter.dart';
import '../providers/board_provider.dart';

class TacticalBoardScreen extends ConsumerStatefulWidget {
  const TacticalBoardScreen({super.key});

  @override
  ConsumerState<TacticalBoardScreen> createState() => _TacticalBoardScreenState();
}

class _TacticalBoardScreenState extends ConsumerState<TacticalBoardScreen> {
  String? _draggedPlayerId;
  bool _isDrawing = false;

  double get _playerHitRadius => 0.04; // normalized

  String? _findPlayerAt(Point norm) {
    final players = ref.read(boardProvider).players;
    for (final p in players) {
      final dx = p.x - norm.x;
      final dy = p.y - norm.y;
      if (sqrt(dx * dx + dy * dy) <= _playerHitRadius) {
        return p.id;
      }
    }
    return null;
  }

  Point _toNorm(Offset local, Size size) {
    return Point(
      (local.dx / size.width).clamp(0.0, 1.0),
      (local.dy / size.height).clamp(0.0, 1.0),
    );
  }

  void _onPanStart(DragStartDetails details, Size size) {
    final tool = ref.read(drawToolProvider);
    final norm = _toNorm(details.localPosition, size);

    if (tool == 'select') {
      final id = _findPlayerAt(norm);
      if (id != null) {
        ref.read(selectedPlayerProvider.notifier).state = id;
        _draggedPlayerId = id;
      } else {
        ref.read(selectedPlayerProvider.notifier).state = null;
      }
    } else {
      _isDrawing = true;
      ref.read(boardProvider.notifier).startPath(tool, norm);
    }
  }

  void _onPanUpdate(DragUpdateDetails details, Size size) {
    final norm = _toNorm(details.localPosition, size);

    if (_draggedPlayerId != null) {
      ref.read(boardProvider.notifier).movePlayer(_draggedPlayerId!, norm.x, norm.y);
      return;
    }

    if (_isDrawing) {
      ref.read(boardProvider.notifier).addPointToLastPath(norm);
    }
  }

  void _onPanEnd(DragEndDetails _) {
    _draggedPlayerId = null;
    _isDrawing = false;
  }

  void _rotateSelected(int delta) {
    final id = ref.read(selectedPlayerProvider);
    if (id == null) return;
    final player = ref.read(boardProvider).players.firstWhere((p) => p.id == id);
    ref.read(boardProvider.notifier).rotatePlayer(id, player.rotation + delta);
  }

  @override
  Widget build(BuildContext context) {
    final board = ref.watch(boardProvider);
    final tool = ref.watch(drawToolProvider);
    final selectedId = ref.watch(selectedPlayerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('MatchCoach — Lavagna tattica'),
        actions: [
          IconButton(
            icon: const Icon(Icons.save),
            tooltip: 'Salva schema',
            onPressed: () => _saveScheme(context, board),
          ),
          IconButton(
            icon: const Icon(Icons.undo),
            tooltip: 'Annulla disegno',
            onPressed: () => ref.read(boardProvider.notifier).undo(),
          ),
          IconButton(
            icon: const Icon(Icons.clear),
            tooltip: 'Cancella disegni',
            onPressed: () => ref.read(boardProvider.notifier).clearPaths(),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final maxWidth = constraints.maxWidth;
                final maxHeight = constraints.maxHeight;
                // Futsal aspect: 20m x 40m => width/height = 0.5
                double width = maxWidth;
                double height = width / 0.5;
                if (height > maxHeight) {
                  height = maxHeight;
                  width = height * 0.5;
                }
                final size = Size(width, height);

                return Center(
                  child: SizedBox(
                    width: width,
                    height: height,
                    child: ClipRect(
                      child: GestureDetector(
                        onPanStart: (d) => _onPanStart(d, size),
                        onPanUpdate: (d) => _onPanUpdate(d, size),
                        onPanEnd: _onPanEnd,
                        child: CustomPaint(
                          painter: FutsalCourtPainter(
                            board,
                            selectedPlayerId: selectedId,
                          ),
                          size: size,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          _buildControls(context, tool, selectedId),
        ],
      ),
    );
  }

  Widget _buildControls(BuildContext context, String tool, String? selectedId) {
    final playerSelected = selectedId != null;
    return Container(
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _ToolButton(
                    icon: Icons.pan_tool,
                    label: 'Seleziona',
                    selected: tool == 'select',
                    onPressed: () => ref.read(drawToolProvider.notifier).state = 'select',
                  ),
                  _ToolButton(
                    icon: Icons.show_chart,
                    label: 'Linea',
                    selected: tool == 'line',
                    onPressed: () => ref.read(drawToolProvider.notifier).state = 'line',
                  ),
                  _ToolButton(
                    icon: Icons.arrow_forward,
                    label: 'Freccia',
                    selected: tool == 'arrow',
                    onPressed: () => ref.read(drawToolProvider.notifier).state = 'arrow',
                  ),
                  _ToolButton(
                    icon: Icons.gesture,
                    label: 'Freehand',
                    selected: tool == 'freehand',
                    onPressed: () => ref.read(drawToolProvider.notifier).state = 'freehand',
                  ),
                ],
              ),
            ),
            if (playerSelected) ...[
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  TextButton.icon(
                    icon: const Icon(Icons.rotate_left),
                    label: const Text('-45°'),
                    onPressed: () => _rotateSelected(-45),
                  ),
                  TextButton.icon(
                    icon: const Icon(Icons.rotate_right),
                    label: const Text('+45°'),
                    onPressed: () => _rotateSelected(45),
                  ),
                  TextButton.icon(
                    icon: const Icon(Icons.delete),
                    label: const Text('Rimuovi'),
                    onPressed: () {
                      ref.read(boardProvider.notifier).removePlayer(selectedId);
                      ref.read(selectedPlayerProvider.notifier).state = null;
                    },
                  ),
                ],
              ),
            ],
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                FilledButton.icon(
                  onPressed: () => _addPlayer('A'),
                  icon: const Icon(Icons.person_add),
                  label: const Text('A'),
                ),
                const SizedBox(width: 8),
                FilledButton.icon(
                  onPressed: () => _addPlayer('B'),
                  icon: const Icon(Icons.person_add),
                  label: const Text('B'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _addPlayer(String team) {
    final number = ref.read(boardProvider).players
        .where((p) => p.team == team)
        .length + 1;
    ref.read(boardProvider.notifier).addPlayer(team, number);
  }

  void _saveScheme(BuildContext context, BoardState board) {
    // TODO: integrate with API service when Auth flow is wired (Macrostep 9/10)
    final json = board.toJson();
    debugPrint('BoardState JSON: $json');
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Schema esportato in console (API in MS9)')),
    );
  }
}

class _ToolButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onPressed;

  const _ToolButton({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            icon: Icon(icon),
            color: selected ? Theme.of(context).colorScheme.primary : null,
            onPressed: onPressed,
          ),
          Text(label, style: TextStyle(fontSize: 10, color: selected ? Theme.of(context).colorScheme.primary : null)),
        ],
      ),
    );
  }
}
