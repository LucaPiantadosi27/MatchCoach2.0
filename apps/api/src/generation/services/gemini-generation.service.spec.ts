import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GeminiGenerationService } from './gemini-generation.service';

describe('GeminiGenerationService', () => {
  let service: GeminiGenerationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiGenerationService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<GeminiGenerationService>(GeminiGenerationService);
  });

  it('should return a fallback plan when API key is missing', async () => {
    const result = await service.generate({ intent: 'attacco in verticale' });

    expect(result.recording.version).toBe('1.0');
    expect(result.recording.duration).toBe(3000);
    expect(result.recording.initialState).toHaveLength(1);
    expect(result.recording.keyframes.length).toBeGreaterThan(0);
    expect(result.description).toContain('fallback');
    expect(result.tags).toEqual(['fallback']);
  });

  it('should allow custom duration', async () => {
    const result = await service.generate({
      intent: 'prova',
      durationMs: 5000,
    });

    expect(result.recording.duration).toBe(5000);
  });

  it('should validate generated recording shape', async () => {
    const result = await service.generate({ intent: 'schema' });
    const keyframe = result.recording.keyframes[0];

    expect(keyframe).toHaveProperty('timestamp');
    expect(keyframe).toHaveProperty('players');
    expect(Array.isArray(keyframe.players)).toBe(true);
    expect(keyframe.players[0]).toHaveProperty('playerId');
    expect(keyframe.players[0]).toHaveProperty('x');
    expect(keyframe.players[0]).toHaveProperty('y');
    expect(keyframe.players[0]).toHaveProperty('rotation');
  });
});
