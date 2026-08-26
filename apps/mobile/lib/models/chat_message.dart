enum ChatRole { user, assistant, system }

class ChatMessage {
  final String id;
  final ChatRole role;
  final String text;
  final DateTime timestamp;
  final List<String>? sources;

  const ChatMessage({
    required this.id,
    required this.role,
    required this.text,
    required this.timestamp,
    this.sources,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'role': role.name,
        'text': text,
        'timestamp': timestamp.toIso8601String(),
        'sources': sources,
      };

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
        id: json['id'] as String,
        role: ChatRole.values.byName(json['role'] as String),
        text: json['text'] as String,
        timestamp: DateTime.parse(json['timestamp'] as String),
        sources: json['sources'] != null
            ? List<String>.from(json['sources'] as List)
            : null,
      );
}

class ChatSession {
  final String id;
  final String? schemeId;
  final String? matchContext;
  final List<ChatMessage> messages;

  const ChatSession({
    required this.id,
    this.schemeId,
    this.matchContext,
    this.messages = const [],
  });

  ChatSession copyWith({
    String? id,
    String? schemeId,
    String? matchContext,
    List<ChatMessage>? messages,
  }) =>
      ChatSession(
        id: id ?? this.id,
        schemeId: schemeId ?? this.schemeId,
        matchContext: matchContext ?? this.matchContext,
        messages: messages ?? this.messages,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'schemeId': schemeId,
        'matchContext': matchContext,
        'messages': messages.map((m) => m.toJson()).toList(),
      };

  factory ChatSession.fromJson(Map<String, dynamic> json) => ChatSession(
        id: json['id'] as String,
        schemeId: json['schemeId'] as String?,
        matchContext: json['matchContext'] as String?,
        messages: (json['messages'] as List?)
                ?.map((m) => ChatMessage.fromJson(m as Map<String, dynamic>))
                .toList() ??
            [],
      );
}
