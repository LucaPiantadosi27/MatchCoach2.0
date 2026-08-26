import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyzeVideoJobData } from '../interfaces';

@Injectable()
export class VideoService {
  constructor(
    @InjectQueue('video-analysis')
    private readonly videoQueue: Queue<AnalyzeVideoJobData, unknown>,
    private readonly prisma: PrismaService,
  ) {}

  async create(userId: string, dto: { name: string; schemeId?: string; filename?: string }) {
    return this.prisma.video.create({
      data: {
        userId,
        name: dto.name,
        schemeId: dto.schemeId,
        filename: dto.filename,
        status: 'PENDING',
      },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.video.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        schemeId: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string, userId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
      include: { insight: true },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return video;
  }

  async requestAnalysis(videoId: string, userId: string): Promise<Job<AnalyzeVideoJobData, unknown>> {
    const video = await this.findOne(videoId, userId);

    await this.prisma.video.update({
      where: { id: videoId },
      data: { status: 'PENDING' },
    });

    return this.videoQueue.add(
      'analyze',
      { videoId, userId },
      {
        jobId: `video-analyze-${videoId}`,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}
