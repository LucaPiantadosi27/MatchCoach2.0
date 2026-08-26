import 'package:dio/dio.dart';

class AssistantClient {
  late final Dio _dio;

  AssistantClient({Dio? dio, String? baseUrl}) {
    _dio = dio ??
        Dio(
          BaseOptions(
            baseUrl: baseUrl ?? 'http://localhost:3000/api',
            headers: {'Content-Type': 'application/json'},
          ),
        );
  }

  Future<Map<String, dynamic>> ask({
    required String channel,
    required String question,
    String? schemeId,
    String? matchContext,
  }) async {
    final body = {
      'channel': channel,
      'question': question,
      if (schemeId != null) 'schemeId': schemeId,
      if (matchContext != null) 'matchContext': matchContext,
    };

    final response = await _dio.post<Map<String, dynamic>>(
      '/assistant/ask',
      data: body,
    );

    return response.data ?? {'answer': 'Nessuna risposta'};
  }
}
