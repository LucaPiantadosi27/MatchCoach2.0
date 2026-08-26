import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GeminiModule } from '../gemini/gemini.module';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './services/analysis.service';
import { AnalysisProcessor } from './processors/analysis.processor';

@Module({
  imports: [QueueModule, PrismaModule, GeminiModule],
  controllers: [AnalysisController],
  providers: [AnalysisService, AnalysisProcessor],
})
export class AnalysisModule {}
