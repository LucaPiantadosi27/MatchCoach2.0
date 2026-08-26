import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto, CreatePlayerDto } from './dto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async createTeam(userId: string, dto: CreateTeamDto) {
    return this.prisma.team.create({
      data: {
        name: dto.name,
        ownerId: userId,
        members: {
          create: { userId, role: 'owner' },
        },
      },
      include: { members: true },
    });
  }

  async findTeamsByUser(userId: string) {
    return this.prisma.team.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        players: { where: { active: true }, orderBy: { number: 'asc' } },
        _count: { select: { schemes: true } },
      },
    });
  }

  async findTeam(id: string, userId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        players: { orderBy: { number: 'asc' } },
        members: { include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } } },
      },
    });

    if (!team) throw new NotFoundException('Team not found');

    const isMember = team.members.some((m) => m.userId === userId);
    if (!isMember && team.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return team;
  }

  async addPlayer(teamId: string, userId: string, dto: CreatePlayerDto) {
    await this.verifyOwnership(teamId, userId);

    return this.prisma.teamPlayer.create({
      data: {
        teamId,
        name: dto.name,
        number: dto.number,
        position: dto.position,
      },
    });
  }

  async removePlayer(teamId: string, playerId: string, userId: string) {
    await this.verifyOwnership(teamId, userId);

    return this.prisma.teamPlayer.update({
      where: { id: playerId },
      data: { active: false },
    });
  }

  async deleteTeam(id: string, userId: string) {
    await this.verifyOwnership(id, userId);

    await this.prisma.team.delete({ where: { id } });
    return { deleted: true };
  }

  private async verifyOwnership(teamId: string, userId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');
    if (team.ownerId !== userId) throw new ForbiddenException('Only owner can modify team');
  }
}
