import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { PrismaService } from 'src/prisma/prisma.service';
import { AnalyzeJobData } from 'src/analysis/interfaces';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectQueue('scheme-insight')
    private readonly analysisQueue: Queue<AnalyzeJobData, unknown>,
    private readonly prisma: PrismaService,
  ) {}

  async requestAnalysis(schemeId: string, userId: string): Promise<Job<AnalyzeJobData, unknown>> {
    const scheme = await this.prisma.scheme.findUnique({
      where: { id: schemeId },
      select: { id: true, userId: true },
    });

    if (!scheme) {
      throw new NotFoundException('Scheme not found');
    }

    if (scheme.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.analysisQueue.add(
      'analyze',
      { schemeId, userId },
      {
        jobId: `analyze-${schemeId}`,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}
