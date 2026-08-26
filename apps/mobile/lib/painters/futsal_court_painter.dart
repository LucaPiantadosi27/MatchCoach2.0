import 'dart:math';
import 'dart:ui';
import 'package:flutter/material.dart';
import '../models/board_state.dart';

class FutsalCourtPainter extends CustomPainter {
  final BoardState board;
  final String? selectedPlayerId;
  final double playerRadiusNorm;

  FutsalCourtPainter(
    this.board, {
    this.selectedPlayerId,
    this.playerRadiusNorm = 0.025,
  });

  @override
  void paint(Canvas canvas, Size size) {
    _drawCourt(canvas, size);
    for (final path in board.paths) {
      _drawPath(canvas, size, path);
    }
    for (final player in board.players) {
      _drawPlayer(canvas, size, player);
    }
  }

  void _drawCourt(Canvas canvas, Size size) {
    final pitchPaint = Paint()
      ..color = const Color(0xFF2E7D32)
      ..style = PaintingStyle.fill;
    canvas.drawRect(Offset.zero & size, pitchPaint);

    final linePaint = Paint()
      ..color = Colors.white70
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;

    final w = size.width;
    final h = size.height;

    // Outline
    canvas.drawRect(Offset.zero & size, linePaint);

    // Halfway line
    canvas.drawLine(Offset(0, h / 2), Offset(w, h / 2), linePaint);

    // Center circle
    final center = Offset(w / 2, h / 2);
    final radius = h * 0.10;
    canvas.drawCircle(center, radius, linePaint);
    canvas.drawCircle(center, 3, linePaint..style = PaintingStyle.fill);

    // Penalty areas (top and bottom)
    final boxWidth = w * 0.5;
    final boxHeight = h * 0.18;
    canvas.drawRect(
      Rect.fromCenter(center: Offset(w / 2, boxHeight / 2), width: boxWidth, height: boxHeight),
      linePaint..style = PaintingStyle.stroke,
    );
    canvas.drawRect(
      Rect.fromCenter(center: Offset(w / 2, h - boxHeight / 2), width: boxWidth, height: boxHeight),
      linePaint,
    );

    // Goals
    final goalWidth = w * 0.25;
    canvas.drawLine(
      Offset((w - goalWidth) / 2, 0),
      Offset((w + goalWidth) / 2, 0),
      linePaint..strokeWidth = 4.0,
    );
    canvas.drawLine(
      Offset((w - goalWidth) / 2, h),
      Offset((w + goalWidth) / 2, h),
      linePaint..strokeWidth = 4.0,
    );

    // Corner arcs
    final cornerRadius = w * 0.04;
    canvas.drawArc(
      Rect.fromCircle(center: Offset(0, 0), radius: cornerRadius),
      0,
      pi / 2,
      false,
      linePaint..strokeWidth = 2.0,
    );
    canvas.drawArc(
      Rect.fromCircle(center: Offset(w, 0), radius: cornerRadius),
      pi / 2,
      pi / 2,
      false,
      linePaint,
    );
    canvas.drawArc(
      Rect.fromCircle(center: Offset(0, h), radius: cornerRadius),
      -pi / 2,
      pi / 2,
      false,
      linePaint,
    );
    canvas.drawArc(
      Rect.fromCircle(center: Offset(w, h), radius: cornerRadius),
      pi,
      pi / 2,
      false,
      linePaint,
    );
  }

  void _drawPlayer(Canvas canvas, Size size, PlayerState p) {
    final center = Offset(p.x * size.width, p.y * size.height);
    final radius = playerRadiusNorm * size.width;
    final teamColor = p.team == 'A' ? const Color(0xFFE53935) : const Color(0xFF1E88E5);

    // Body
    final bodyPaint = Paint()
      ..color = teamColor
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, radius, bodyPaint);

    // Selection ring
    final isSelected = p.id == selectedPlayerId;
    final strokePaint = Paint()
      ..color = isSelected ? Colors.yellow : Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = isSelected ? 3.0 : 2.0;
    canvas.drawCircle(center, radius, strokePaint);

    // Number
    final textPainter = TextPainter(
      text: TextSpan(
        text: '${p.number}',
        style: TextStyle(
          color: Colors.white,
          fontSize: radius,
          fontWeight: FontWeight.bold,
        ),
      ),
      textDirection: TextDirection.ltr,
      textAlign: TextAlign.center,
    );
    textPainter.layout();
    textPainter.paint(
      canvas,
      center - Offset(textPainter.width / 2, textPainter.height / 2),
    );

    // Rotation indicator
    final angle = p.rotation * pi / 180;
    final arrowEnd = center + Offset(cos(angle), sin(angle)) * radius * 1.4;
    canvas.drawLine(center, arrowEnd, Paint()..color = Colors.white..strokeWidth = 2.0);
  }

  void _drawPath(Canvas canvas, Size size, DrawingPath path) {
    if (path.points.length < 2) return;
    final paint = Paint()
      ..color = _colorFromString(path.color) ?? Colors.yellowAccent
      ..strokeWidth = (path.strokeWidth ?? 3.0)
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final offsets = path.points
        .map((pt) => Offset(pt.x * size.width, pt.y * size.height))
        .toList();

    if (path.type == 'freehand') {
      canvas.drawPoints(PointMode.polygon, offsets, paint);
    } else {
      canvas.drawLine(offsets.first, offsets.last, paint);
      if (path.type == 'arrow' && path.points.length >= 2) {
        _drawArrowHead(canvas, offsets.first, offsets.last, paint);
      }
    }
  }

  void _drawArrowHead(Canvas canvas, Offset start, Offset end, Paint paint) {
    const arrowLength = 12.0;
    const arrowAngle = pi / 6;
    final angle = atan2(end.dy - start.dy, end.dx - start.dx);
    final path = Path()
      ..moveTo(end.dx, end.dy)
      ..lineTo(
        end.dx - arrowLength * cos(angle - arrowAngle),
        end.dy - arrowLength * sin(angle - arrowAngle),
      )
      ..moveTo(end.dx, end.dy)
      ..lineTo(
        end.dx - arrowLength * cos(angle + arrowAngle),
        end.dy - arrowLength * sin(angle + arrowAngle),
      );
    canvas.drawPath(path, paint..strokeWidth = paint.strokeWidth);
  }

  Color? _colorFromString(String? color) {
    if (color == null || color.isEmpty) return null;
    try {
      return Color(int.parse(color, radix: 16) | 0xFF000000);
    } catch (_) {
      return null;
    }
  }

  @override
  bool shouldRepaint(covariant FutsalCourtPainter oldDelegate) {
    return true;
  }
}
