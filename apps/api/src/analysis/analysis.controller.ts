import {
  Controller,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AnalysisService } from './services/analysis.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('schemes')
@UseGuards(JwtAuthGuard)
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post(':id/analyze')
  async analyze(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const job = await this.analysisService.requestAnalysis(id, userId);
    return {
      jobId: job.id,
      schemeId: id,
      status: 'queued',
    };
  }
}
