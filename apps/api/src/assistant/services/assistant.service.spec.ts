import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AssistantService } from './assistant.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AssistantService', () => {
  let service: AssistantService;

  const mockPrisma = {
    scheme: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssistantService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AssistantService>(AssistantService);
    jest.clearAllMocks();
  });

  it('should return fallback for channel A without API key', async () => {
    const result = await service.ask(
      { channel: 'A', question: 'Come si difende il basso?' },
      'u1',
    );

    expect(result.answer).toContain('fallback');
  });

  it('should throw for channel B without schemeId', async () => {
    await expect(
      service.ask({ channel: 'B', question: 'Analizza' }, 'u1'),
    ).rejects.toThrow('schemeId is required');
  });
});
