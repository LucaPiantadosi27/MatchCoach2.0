import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto, CreatePlayerDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateTeamDto) {
    return this.teamsService.createTeam(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.teamsService.findTeamsByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.teamsService.findTeam(id, userId);
  }

  @Post(':id/players')
  addPlayer(
    @Param('id') teamId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePlayerDto,
  ) {
    return this.teamsService.addPlayer(teamId, userId, dto);
  }

  @Delete(':id/players/:playerId')
  removePlayer(
    @Param('id') teamId: string,
    @Param('playerId') playerId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamsService.removePlayer(teamId, playerId, userId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.teamsService.deleteTeam(id, userId);
  }
}
