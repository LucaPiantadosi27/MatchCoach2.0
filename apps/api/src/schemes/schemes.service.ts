import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSchemeDto, UpdateSchemeDto } from './dto';
import { validateBoardState } from './validators/board-state.validator';
import { validateMovementRecording } from './validators/movement-recording.validator';

@Injectable()
export class SchemesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateSchemeDto) {
    // Validate boardState
    const bsValidation = validateBoardState(dto.boardState);
    if (!bsValidation.valid) {
      throw new BadRequestException({
        message: 'Invalid boardState',
        errors: bsValidation.errors,
      });
    }

    // Validate recording if present
    if (dto.recording) {
      const recValidation = validateMovementRecording(dto.recording);
      if (!recValidation.valid) {
        throw new BadRequestException({
          message: 'Invalid recording',
          errors: recValidation.errors,
        });
      }
    }

    // Determine type
    const type = dto.recording ? 'RECORDING' : (dto.type || 'STATIC');

    return this.prisma.scheme.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        type,
        boardState: dto.boardState as any,
        recording: dto.recording ? (dto.recording as any) : undefined,
        teamId: dto.teamId,
        seasonId: dto.seasonId,
        tags: dto.tags || [],
      },
    });
  }

  async findAllByUser(userId: string, options?: { teamId?: string; seasonId?: string; tags?: string[] }) {
    const where: Record<string, unknown> = { userId };

    if (options?.teamId) where.teamId = options.teamId;
    if (options?.seasonId) where.seasonId = options.seasonId;
    if (options?.tags && options.tags.length > 0) {
      where.tags = { hasSome: options.tags };
    }

    return this.prisma.scheme.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        tags: true,
        snapshotKey: true,
        contractVersion: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string, userId: string) {
    const scheme = await this.prisma.scheme.findUnique({
      where: { id },
      include: { insight: true },
    });

    if (!scheme) {
      throw new NotFoundException('Scheme not found');
    }

    if (scheme.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return scheme;
  }

  async update(id: string, userId: string, dto: UpdateSchemeDto) {
    const scheme = await this.prisma.scheme.findUnique({ where: { id } });

    if (!scheme) {
      throw new NotFoundException('Scheme not found');
    }

    if (scheme.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Validate boardState if provided
    if (dto.boardState) {
      const bsValidation = validateBoardState(dto.boardState);
      if (!bsValidation.valid) {
        throw new BadRequestException({
          message: 'Invalid boardState',
          errors: bsValidation.errors,
        });
      }
    }

    // Validate recording if provided
    if (dto.recording) {
      const recValidation = validateMovementRecording(dto.recording);
      if (!recValidation.valid) {
        throw new BadRequestException({
          message: 'Invalid recording',
          errors: recValidation.errors,
        });
      }
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.boardState !== undefined) data.boardState = dto.boardState;
    if (dto.recording !== undefined) {
      data.recording = dto.recording;
      data.type = 'RECORDING';
    }
    if (dto.tags !== undefined) data.tags = dto.tags;

    return this.prisma.scheme.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    const scheme = await this.prisma.scheme.findUnique({ where: { id } });

    if (!scheme) {
      throw new NotFoundException('Scheme not found');
    }

    if (scheme.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.scheme.delete({ where: { id } });

    return { deleted: true };
  }

  async countByUser(userId: string): Promise<number> {
    return this.prisma.scheme.count({ where: { userId } });
  }
}
