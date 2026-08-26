import { ConfigService } from '@nestjs/config';
import { GeminiService } from './gemini.service';
import { MovementAnalysisReport } from 'src/movement/interfaces';

describe('GeminiService', () => {
  const sampleReport: MovementAnalysisReport = {
    version: '1.0',
    durationMs: 2000,
    fieldWidthMeters: 20,
    fieldHeightMeters: 40,
    playerMetrics: [
      {
        playerId: 'p1',
        team: 'A',
        number: 1,
        totalDistanceMeters: 10,
        averageSpeedMetersPerSecond: 5,
        maxSpeedMetersPerSecond: 6,
        displacementMeters: 8,
        startX: 0.5,
        startY: 0.5,
        endX: 0.5,
        endY: 0.7,
        timeInZones: {
          attackMs: 2000,
          midfieldMs: 0,
          defenseMs: 0,
          attackPct: 1,
          midfieldPct: 0,
          defensePct: 0,
        },
      },
    ],
    teamMetrics: [
      {
        team: 'A',
        averagePlayerDistanceMeters: 5,
        averageSpreadMeters: 3,
        centroidX: 0.5,
        centroidY: 0.6,
        symmetryScore: 0.9,
      },
    ],
    summary: {
      totalDistanceMeters: 10,
      highestAverageSpeedMetersPerSecond: 5,
      mostActivePlayerId: 'p1',
    },
  };

  it('returns a fallback when no API key is configured', async () => {
    const config = { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService;
    const service = new GeminiService(config);

    const result = await service.interpret(sampleReport);

    expect(result.summary).toContain('Schema con distanza totale 10m');
    expect(result.confidence).toBe(0.4);
    expect(result.modelName).toBe('fallback');
    expect(result.tags.length).toBeGreaterThan(0);
  });

  it('parses a valid Gemini JSON response', async () => {
    const config = { get: jest.fn().mockReturnValue('fake-key') } as unknown as ConfigService;
    const service = new GeminiService(config);

    const fakeResponse = {
      summary: 'Movimento offensivo rapido sulla fascia.',
      tags: ['fascia', 'transizione'],
      confidence: 0.85,
      suggestedImprovements: ['Coprire la fascia opposta'],
    };

    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(fakeResponse) }],
            },
          },
        ],
        usageMetadata: { totalTokenCount: 120 },
      }),
    } as any);

    const result = await service.interpret(sampleReport);

    expect(result.summary).toBe(fakeResponse.summary);
    expect(result.tags).toEqual(fakeResponse.tags);
    expect(result.confidence).toBe(fakeResponse.confidence);
    expect(result.suggestedImprovements).toEqual(fakeResponse.suggestedImprovements);
    expect(result.tokenUsage).toBe(120);

    fetchSpy.mockRestore();
  });

  it('falls back on a malformed JSON response', async () => {
    const config = { get: jest.fn().mockReturnValue('fake-key') } as unknown as ConfigService;
    const service = new GeminiService(config);

    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: 'non è un json' }],
            },
          },
        ],
      }),
    } as any);

    const result = await service.interpret(sampleReport);

    expect(result.confidence).toBeLessThan(1);
    expect(result.modelName).toBe('fallback');

    fetchSpy.mockRestore();
  });
});
