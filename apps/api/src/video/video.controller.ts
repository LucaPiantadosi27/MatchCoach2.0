import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { VideoService } from './services/video.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('videos')
@UseGuards(JwtAuthGuard)
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post()
  async create(
    @Body() dto: CreateVideoDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.videoService.create(userId, dto);
  }

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.videoService.findAllByUser(userId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.videoService.findOne(id, userId);
  }

  @Post(':id/analyze')
  async analyze(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const job = await this.videoService.requestAnalysis(id, userId);
    return {
      jobId: job.id,
      videoId: id,
      status: 'queued',
    };
  }
}
