import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:matchcoach_mobile/models/chat_message.dart';
import 'package:matchcoach_mobile/providers/chat_provider.dart';
import 'package:matchcoach_mobile/services/assistant_client.dart';

class FakeAssistantClient implements AssistantClient {
  @override
  Future<Map<String, dynamic>> ask({
    required String channel,
    required String question,
    String? schemeId,
    String? matchContext,
  }) async {
    return {
      'answer': 'Risposta: $question',
      'sources': ['scheme:test'],
    };
  }
}

void main() {
  test('ChatProvider adds user and assistant messages', () async {
    final container = ProviderContainer(
      overrides: [
        assistantClientProvider.overrideWithValue(FakeAssistantClient()),
      ],
    );

    final notifier = container.read(chatProvider.notifier);

    await notifier.send('Come difendo?');

    final session = container.read(chatProvider);
    expect(session.messages.length, 2);
    expect(session.messages[0].role, ChatRole.user);
    expect(session.messages[1].role, ChatRole.assistant);
    expect(session.messages[1].text, 'Risposta: Come difendo?');
  });

  test('ChatProvider does not add empty messages', () async {
    final container = ProviderContainer();
    final notifier = container.read(chatProvider.notifier);

    await notifier.send('   ');

    final session = container.read(chatProvider);
    expect(session.messages.length, 0);
  });
}
