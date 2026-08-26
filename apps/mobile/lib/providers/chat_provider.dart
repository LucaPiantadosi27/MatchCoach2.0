import 'dart:math' show Random;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../models/chat_message.dart';
import '../services/assistant_client.dart';

final assistantClientProvider = Provider<AssistantClient>((ref) {
  return AssistantClient();
});

final chatProvider =
    StateNotifierProvider<ChatNotifier, ChatSession>((ref) => ChatNotifier(ref));

class ChatNotifier extends StateNotifier<ChatSession> {
  final Ref _ref;
  final _uuid = const Uuid();

  ChatNotifier(this._ref)
      : super(ChatSession(
          id: 'session-${DateTime.now().millisecondsSinceEpoch}',
          messages: const [],
        ));

  void setContext({String? schemeId, String? matchContext}) {
    state = state.copyWith(
      schemeId: schemeId,
      matchContext: matchContext,
    );
  }

  void clear() {
    state = ChatSession(id: _uuid.v4(), messages: const []);
  }

  Future<void> send(String text) async {
    if (text.trim().isEmpty) return;

    final userMessage = ChatMessage(
      id: _uuid.v4(),
      role: ChatRole.user,
      text: text.trim(),
      timestamp: DateTime.now(),
    );

    state = state.copyWith(messages: [...state.messages, userMessage]);

    try {
      final client = _ref.read(assistantClientProvider);
      final answer = await client.ask(
        channel: state.schemeId == null ? 'A' : 'B',
        question: text.trim(),
        schemeId: state.schemeId,
        matchContext: state.matchContext,
      );

      final assistantMessage = ChatMessage(
        id: _uuid.v4(),
        role: ChatRole.assistant,
        text: answer['answer'] as String,
        timestamp: DateTime.now(),
        sources: (answer['sources'] as List?)?.cast<String>(),
      );

      state = state.copyWith(messages: [...state.messages, assistantMessage]);
    } catch (e) {
      final errorMessage = ChatMessage(
        id: _uuid.v4(),
        role: ChatRole.assistant,
        text: 'Non sono riuscito a contattare l\'assistente. Riprova.',
        timestamp: DateTime.now(),
      );
      state = state.copyWith(messages: [...state.messages, errorMessage]);
    }
  }
}
