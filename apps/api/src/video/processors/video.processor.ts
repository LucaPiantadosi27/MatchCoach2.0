import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiService } from '../../gemini/services/gemini.service';
import { MovementAnalysisEngine } from '../../movement/services/movement-analysis.engine';
import { AnalyzeVideoJobData } from '../interfaces';
import { BoardState, MovementRecording, PlayerKeyframe } from '../../schemes/interfaces';

interface FrameDetection {
  timestamp: number;
  players: PlayerKeyframe[];
}

@Processor('video-analysis')
export class VideoProcessor extends WorkerHost {
  private readonly movementEngine: MovementAnalysisEngine;

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
  ) {
    super();
    this.movementEngine = new MovementAnalysisEngine();
  }

  async process(job: Job<AnalyzeVideoJobData>): Promise<{ videoId: string; status: string }> {
    const { videoId } = job.data;

    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: { scheme: true },
    });

    if (!video) {
      throw new Error(`Video ${videoId} not found`);
    }

    await this.prisma.video.update({
      where: { id: videoId },
      data: { status: 'PROCESSING' },
    });

    try {
      const recording = this.buildRecording(video.frames as unknown, video.scheme?.boardState as unknown);
      const board = (video.scheme?.boardState as unknown as BoardState) ?? { version: '2.0', players: [], paths: [] };

      const report = this.movementEngine.analyze({ board, recording });
      const interpretation = await this.geminiService.interpret(report);

      await this.prisma.videoInsight.upsert({
        where: { videoId },
        create: {
          videoId,
          description: interpretation.summary,
          tags: interpretation.tags,
          movementMetrics: report as any,
          modelName: interpretation.modelName,
          tokenUsage: interpretation.tokenUsage,
        },
        update: {
          description: interpretation.summary,
          tags: interpretation.tags,
          movementMetrics: report as any,
          modelName: interpretation.modelName,
          tokenUsage: interpretation.tokenUsage,
        },
      });

      await this.prisma.video.update({
        where: { id: videoId },
        data: { status: 'COMPLETED' },
      });

      return { videoId, status: 'completed' };
    } catch (error) {
      await this.prisma.video.update({
        where: { id: videoId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }

  private buildRecording(frames: unknown, boardState: unknown): MovementRecording {
    const detectedFrames = (frames as unknown as FrameDetection[] | null) ?? [];

    if (detectedFrames.length > 1) {
      const first = detectedFrames[0].players;
      const keyframes = detectedFrames
        .slice(1)
        .map((f) => ({ timestamp: f.timestamp, players: f.players }));
      return {
        version: '1.0',
        duration: detectedFrames[detectedFrames.length - 1].timestamp,
        initialState: first,
        keyframes,
      };
    }

    const board = (boardState as unknown as BoardState | null) ?? { version: '2.0', players: [], paths: [] };
    const initial = board.players.map((p) => ({
      playerId: p.id,
      x: p.x,
      y: p.y,
      rotation: p.rotation,
    }));

    return {
      version: '1.0',
      duration: 3000,
      initialState: initial,
      keyframes: [
        {
          timestamp: 3000,
          players: initial.map((p) => ({
            ...p,
            x: Math.min(1, Math.max(0, p.x + 0.1)),
            y: Math.min(1, Math.max(0, p.y + 0.1)),
          })),
        },
      ],
    };
  }
}
