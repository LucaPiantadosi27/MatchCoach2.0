import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiGenerationService } from './services/gemini-generation.service';
import { GenerationController } from './generation.controller';

@Module({
  imports: [ConfigModule],
  controllers: [GenerationController],
  providers: [GeminiGenerationService],
  exports: [GeminiGenerationService],
})
export class GenerationModule {}
