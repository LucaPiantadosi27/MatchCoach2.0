import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { VideoService } from './video.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('VideoService', () => {
  let service: VideoService;
  let prisma: PrismaService;
  let queue: Queue;

  const mockPrisma = {
    video: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: getQueueToken('video-analysis'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<VideoService>(VideoService);
    prisma = module.get<PrismaService>(PrismaService);
    queue = module.get<Queue>(getQueueToken('video-analysis'));
    jest.clearAllMocks();
  });

  it('should create a video', async () => {
    const mockVideo = {
      id: 'v1',
      userId: 'u1',
      name: 'Partita',
      schemeId: 's1',
      status: 'PENDING',
    };
    mockPrisma.video.create.mockResolvedValue(mockVideo);

    const result = await service.create('u1', {
      name: 'Partita',
      schemeId: 's1',
    });

    expect(mockPrisma.video.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        name: 'Partita',
        schemeId: 's1',
        filename: undefined,
        status: 'PENDING',
      },
    });
    expect(result).toEqual(mockVideo);
  });

  it('should queue analysis', async () => {
    const mockVideo = {
      id: 'v1',
      userId: 'u1',
      status: 'PENDING',
    };
    mockPrisma.video.findUnique.mockResolvedValue(mockVideo);
    mockPrisma.video.update.mockResolvedValue({ ...mockVideo, status: 'PENDING' });

    const result = await service.requestAnalysis('v1', 'u1');

    expect(mockPrisma.video.update).toHaveBeenCalledWith({
      where: { id: 'v1' },
      data: { status: 'PENDING' },
    });
    expect(queue.add).toHaveBeenCalledWith(
      'analyze',
      { videoId: 'v1', userId: 'u1' },
      expect.any(Object),
    );
    expect(result).toEqual({ id: 'job-1' });
  });
});
