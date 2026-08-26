import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/chat_message.dart';
import '../providers/chat_provider.dart';

class TacticalChatScreen extends ConsumerWidget {
  final String? schemeId;
  final String? matchContext;

  const TacticalChatScreen({
    super.key,
    this.schemeId,
    this.matchContext,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(chatProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Assistente tattico'),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline),
            onPressed: () => ref.read(chatProvider.notifier).clear(),
          ),
        ],
      ),
      body: Column(
        children: [
          if (schemeId != null || matchContext != null)
            _ContextBar(schemeId: schemeId, matchContext: matchContext),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(8),
              itemCount: session.messages.length,
              itemBuilder: (context, index) {
                final message = session.messages[index];
                return _ChatBubble(message: message);
              },
            ),
          ),
          _ChatInput(
            onSend: (text) {
              ref.read(chatProvider.notifier).send(text);
            },
          ),
        ],
      ),
    );
  }
}

class _ContextBar extends StatelessWidget {
  final String? schemeId;
  final String? matchContext;

  const _ContextBar({this.schemeId, this.matchContext});

  @override
  Widget build(BuildContext context) {
    final chips = <Widget>[];
    if (schemeId != null) {
      chips.add(Chip(label: Text('Schema: $schemeId')));
    }
    if (matchContext != null && matchContext!.isNotEmpty) {
      chips.add(Chip(label: Text('Partita: $matchContext')));
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: Wrap(
        spacing: 8,
        children: chips,
      ),
    );
  }
}

class _ChatBubble extends StatelessWidget {
  final ChatMessage message;

  const _ChatBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final isUser = message.role == ChatRole.user;
    final color = isUser ? Colors.blue.shade100 : Colors.grey.shade200;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(12),
        ),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.8,
        ),
        child: Column(
          crossAxisAlignment:
              isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Text(message.text),
            if (message.sources != null && message.sources!.isNotEmpty)
              Text(
                'Fonti: ${message.sources!.join(', ')}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
          ],
        ),
      ),
    );
  }
}

class _ChatInput extends StatefulWidget {
  final ValueChanged<String> onSend;

  const _ChatInput({required this.onSend});

  @override
  State<_ChatInput> createState() => _ChatInputState();
}

class _ChatInputState extends State<_ChatInput> {
  final _controller = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _controller,
                decoration: const InputDecoration(
                  hintText: 'Chiedi qualcosa...',
                  border: OutlineInputBorder(),
                ),
                onSubmitted: (text) => _send(),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.send),
              onPressed: _send,
            ),
            IconButton(
              icon: const Icon(Icons.mic),
              onPressed: () {
                widget.onSend('Input vocale non ancora implementato');
              },
            ),
          ],
        ),
      ),
    );
  }

  void _send() {
    final text = _controller.text;
    if (text.isNotEmpty) {
      widget.onSend(text);
      _controller.clear();
    }
  }
}
