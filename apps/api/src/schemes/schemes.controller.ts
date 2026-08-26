import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SchemesService } from './schemes.service';
import { CreateSchemeDto, UpdateSchemeDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('schemes')
@UseGuards(JwtAuthGuard)
export class SchemesController {
  constructor(private schemesService: SchemesService) {}

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSchemeDto,
  ) {
    return this.schemesService.create(userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('teamId') teamId?: string,
    @Query('seasonId') seasonId?: string,
    @Query('tags') tags?: string,
  ) {
    const tagArray = tags ? tags.split(',').map((t) => t.trim()) : undefined;
    return this.schemesService.findAllByUser(userId, { teamId, seasonId, tags: tagArray });
  }

  @Get('count')
  count(@CurrentUser('id') userId: string) {
    return this.schemesService.countByUser(userId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.schemesService.findOne(id, userId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateSchemeDto,
  ) {
    return this.schemesService.update(id, userId, dto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.schemesService.remove(id, userId);
  }
}
