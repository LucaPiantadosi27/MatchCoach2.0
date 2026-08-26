import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AssistantService } from './services/assistant.service';
import { AskDto } from './dto/ask.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('assistant')
@UseGuards(JwtAuthGuard)
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('ask')
  async ask(
    @Body() dto: AskDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.assistantService.ask(dto, userId);
  }
}
