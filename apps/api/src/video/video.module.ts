import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GeminiModule } from '../gemini/gemini.module';
import { VideoController } from './video.controller';
import { VideoService } from './services/video.service';
import { VideoProcessor } from './processors/video.processor';

@Module({
  imports: [QueueModule, PrismaModule, GeminiModule],
  controllers: [VideoController],
  providers: [VideoService, VideoProcessor],
})
export class VideoModule {}
