import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'screens/tactical_board_screen.dart';

void main() {
  runApp(
    const ProviderScope(
      child: MatchCoachApp(),
    ),
  );
}

class MatchCoachApp extends StatelessWidget {
  const MatchCoachApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MatchCoach-AI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
        useMaterial3: true,
      ),
      home: const TacticalBoardScreen(),
    );
  }
}
