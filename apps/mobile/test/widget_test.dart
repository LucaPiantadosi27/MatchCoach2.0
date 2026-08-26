import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:matchcoach_mobile/main.dart';

void main() {
  testWidgets('Tactical board renders', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(child: MatchCoachApp()),
    );
    expect(find.text('MatchCoach — Lavagna tattica'), findsOneWidget);
  });
}
