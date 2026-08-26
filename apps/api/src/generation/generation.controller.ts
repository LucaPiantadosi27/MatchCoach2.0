import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GeminiGenerationService } from './services/gemini-generation.service';
import { GenerateSchemeDto } from './interfaces';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('schemes')
@UseGuards(JwtAuthGuard)
export class GenerationController {
  constructor(private readonly generationService: GeminiGenerationService) {}

  @Post('generate')
  async generate(@Body() dto: GenerateSchemeDto) {
    const result = await this.generationService.generate(dto);
    return result;
  }
}
