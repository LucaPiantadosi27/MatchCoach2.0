import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlayerKeyframe, Keyframe, MovementRecording } from 'src/schemes/interfaces';
import { GenerateSchemeDto, MovementPlan, GeneratedSchemeResult, Waypoint } from '../interfaces/generation.interface';

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
export class GeminiGenerationService {
  private readonly model = 'gemini-1.5-flash';

  constructor(private readonly config: ConfigService) {}

  async generate(dto: GenerateSchemeDto): Promise<GeneratedSchemeResult> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      return this.fallbackPlan(dto);
    }

    const prompt = this.buildPrompt(dto);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      return this.fallbackPlan(dto);
    }

    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return this.parsePlan(text, dto);
  }

  private buildPrompt(dto: GenerateSchemeDto): string {
    const duration = dto.durationMs ?? 3000;
    return `Sei un assistente tattico espertodifutsal. Crea un piano di movimento per una pedina.

Intenzione: "${dto.intent}"
Durata: ${duration} ms

Restituisci un oggetto JSON con:
- version: "1.0"
- duration: numero in ms
- description: breve descrizione in italiano
- initialState: array di giocatori con { playerId, x, y, rotation }
- movements: array di { playerId, waypoints: [ { timestamp, x, y, rotation } ] }

Coordinate x,y devono essere float 0.0-1.0. Rotazione 0-360. I timestamp devono essere crescenti tra 0 e ${duration}.
Non aggiungere testo extra.`;
  }

  private parsePlan(text: string, dto: GenerateSchemeDto): GeneratedSchemeResult {
    const cleaned = text.replace(/```json\n?|```/g, '').trim();
    try {
      const plan = JSON.parse(cleaned) as MovementPlan;
      return this.convertToRecording(plan);
    } catch {
      return this.fallbackPlan(dto);
    }
  }

  private convertToRecording(plan: MovementPlan): GeneratedSchemeResult {
    const initialState = plan.initialState.length
      ? plan.initialState
      : this.fallbackInitialState();

    const timestamps = new Set<number>();
    plan.movements.forEach((m) =>
      m.waypoints.forEach((w) => timestamps.add(w.timestamp)),
    );
    timestamps.add(0);
    timestamps.add(plan.duration);

    const sortedTimestamps = Array.from(timestamps).sort((a, b) => a - b);

    const keyframes: Keyframe[] = sortedTimestamps
      .filter((ts) => ts > 0 && ts < plan.duration)
      .map((ts) => {
        const players: PlayerKeyframe[] = plan.movements.map((m) => {
          const before = this.findBefore(m.waypoints, ts);
          const after = this.findAfter(m.waypoints, ts);
          const pos = this.interpolate(before, after, ts);
          return {
            playerId: m.playerId,
            ...pos,
          };
        });
        return { timestamp: ts, players };
      });

    const recording: MovementRecording = {
      version: '1.0',
      duration: plan.duration,
      initialState,
      keyframes,
    };

    return {
      recording,
      description: plan.description || 'Schema generato',
      tags: ['gemini-generated'],
    };
  }

  private findBefore(waypoints: Waypoint[], ts: number): Waypoint | undefined {
    return waypoints
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp)
      .reverse()
      .find((w) => w.timestamp <= ts);
  }

  private findAfter(waypoints: Waypoint[], ts: number): Waypoint | undefined {
    return waypoints
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp)
      .find((w) => w.timestamp >= ts);
  }

  private interpolate(
    before?: Waypoint,
    after?: Waypoint,
    ts?: number,
  ): { x: number; y: number; rotation: number } {
    if (!before && !after) return { x: 0.5, y: 0.5, rotation: 0 };
    if (!before) return { x: after!.x, y: after!.y, rotation: after!.rotation };
    if (!after) return { x: before!.x, y: before!.y, rotation: before!.rotation };
    if (before.timestamp === after.timestamp) {
      return { x: before.x, y: before.y, rotation: before.rotation };
    }
    const t = (ts! - before.timestamp) / (after.timestamp - before.timestamp);
    const x = before.x + (after.x - before.x) * t;
    const y = before.y + (after.y - before.y) * t;
    const rotation = before.rotation + (after.rotation - before.rotation) * t;
    return { x, y, rotation };
  }

  private fallbackPlan(dto: GenerateSchemeDto): GeneratedSchemeResult {
    const duration = dto.durationMs ?? 3000;
    return {
      recording: {
        version: '1.0',
        duration,
        initialState: this.fallbackInitialState(),
        keyframes: [
          {
            timestamp: duration,
            players: [
              {
                playerId: 'p1',
                x: 0.5,
                y: 0.7,
                rotation: 0,
              },
            ],
          },
        ],
      },
      description: 'Schema fallback: avanzamento verticale',
      tags: ['fallback'],
    };
  }

  private fallbackInitialState(): PlayerKeyframe[] {
    return [
      {
        playerId: 'p1',
        x: 0.5,
        y: 0.3,
        rotation: 0,
      },
    ];
  }
}
