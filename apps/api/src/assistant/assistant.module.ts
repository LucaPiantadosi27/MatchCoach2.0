import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './services/assistant.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AssistantController],
  providers: [AssistantService],
  exports: [AssistantService],
})
export class AssistantModule {}
