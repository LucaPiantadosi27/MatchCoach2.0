import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from 'src/prisma/prisma.service';
import { GeminiService } from 'src/gemini/services/gemini.service';
import { MovementAnalysisEngine } from 'src/movement/services/movement-analysis.engine';
import { AnalyzeJobData } from 'src/analysis/interfaces';
import { BoardState, MovementRecording } from 'src/schemes/interfaces';
import { PlayerState } from 'src/schemes/interfaces';

@Processor('scheme-insight')
export class AnalysisProcessor extends WorkerHost {
  private readonly movementEngine: MovementAnalysisEngine;

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
  ) {
    super();
    this.movementEngine = new MovementAnalysisEngine();
  }

  async process(job: Job<AnalyzeJobData>): Promise<{ schemeId: string; status: string }> {
    const { schemeId } = job.data;

    const scheme = await this.prisma.scheme.findUnique({
      where: { id: schemeId },
    });

    if (!scheme) {
      throw new Error(`Scheme ${schemeId} not found`);
    }

    const board = scheme.boardState as unknown as BoardState;
    const recording = (scheme.recording as unknown as MovementRecording | null) ?? {
      version: '1.0',
      duration: 0,
      initialState: board.players.map((p: PlayerState) => ({
        playerId: p.id,
        x: p.x,
        y: p.y,
        rotation: p.rotation,
      })),
      keyframes: [],
    };

    const report = this.movementEngine.analyze({ board, recording });
    const interpretation = await this.geminiService.interpret(report);

    await this.prisma.schemeInsight.upsert({
      where: { schemeId },
      create: {
        schemeId,
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

    return { schemeId, status: 'completed' };
  }
}
