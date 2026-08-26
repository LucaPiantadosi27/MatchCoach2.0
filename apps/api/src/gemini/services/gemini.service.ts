import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MovementAnalysisReport } from 'src/movement/interfaces';
import { FutsalPromptBuilder } from '../prompts/futsal-prompt.builder';
import { TacticalInterpretation } from '../interfaces/tactical-interpretation.interface';

interface GeminiCandidate {
  content?: {
    parts?: { text?: string }[];
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  usageMetadata?: { totalTokenCount?: number };
}

@Injectable()
export class GeminiService {
  private readonly model = 'gemini-1.5-flash';

  constructor(private readonly config: ConfigService) {}

  async interpret(report: MovementAnalysisReport): Promise<TacticalInterpretation> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      return this.fallbackInterpretation(report);
    }

    const prompt = FutsalPromptBuilder.build(report);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = (await response.json()) as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      return this.parseInterpretation(text, data);
    } catch (error) {
      return this.fallbackInterpretation(report, String(error));
    }
  }

  private parseInterpretation(
    text: string,
    data?: GeminiResponse,
  ): TacticalInterpretation {
    const cleaned = text.replace(/```json\n?|```/g, '').trim();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      return this.fallbackInterpretation(
        undefined,
        'Risposta Gemini non valida.',
      );
    }

    return {
      version: '1.0',
      summary: String(parsed['summary'] ?? 'Interpretazione non disponibile.'),
      tags: Array.isArray(parsed['tags']) ? parsed['tags'].map(String) : [],
      confidence: Number(parsed['confidence'] ?? 0.5),
      suggestedImprovements: Array.isArray(parsed['suggestedImprovements'])
        ? parsed['suggestedImprovements'].map(String)
        : [],
      rawResponse: text,
      modelName: this.model,
      tokenUsage: data?.usageMetadata?.totalTokenCount,
    };
  }

  private fallbackInterpretation(
    report?: MovementAnalysisReport,
    reason?: string,
  ): TacticalInterpretation {
    const tags = report
      ? this.deriveTagsFromReport(report)
      : ['fallback', 'nessuna-chiave-api'];
    const reasonText = reason ? ` (${reason})` : '';
    const summary = report
      ? `Schema con distanza totale ${report.summary.totalDistanceMeters}m. ` +
        `Il giocatore più attivo è ${report.summary.mostActivePlayerId ?? 'N/A'}.${reasonText}`
      : (reason || 'Nessuna chiave Gemini configurata.');

    return {
      version: '1.0',
      summary,
      tags,
      confidence: 0.4,
      suggestedImprovements: report
        ? ['Verificare la distribuzione delle pedine.', 'Controllare le transizioni difesa-attacco']
        : ['Configurare GEMINI_API_KEY per ottenere interpretazioni AI.'],
      modelName: 'fallback',
    };
  }

  private deriveTagsFromReport(report: MovementAnalysisReport): string[] {
    const tags = new Set<string>();
    const total = report.summary.totalDistanceMeters;
    if (total > 100) tags.add('alto-movimento');
    if (total < 30) tags.add('basso-movimento');

    report.teamMetrics.forEach((t) => {
      if (t.symmetryScore > 0.8) tags.add('simmetrico');
      if (t.averageSpreadMeters > 10) tags.add('spaziato');
      if (t.averageSpreadMeters < 5) tags.add('compatto');
    });

    return Array.from(tags).length ? Array.from(tags) : ['futsal', 'schema'];
  }
}
