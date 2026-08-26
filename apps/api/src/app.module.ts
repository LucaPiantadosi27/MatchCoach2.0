import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { StorageModule } from './storage/storage.module';
import { QueueModule } from './queue/queue.module';
import { SchemesModule } from './schemes/schemes.module';
import { TeamsModule } from './teams/teams.module';
import { AnalysisModule } from './analysis/analysis.module';
import { GenerationModule } from './generation/generation.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    AuthModule,
    HealthModule,
    StorageModule,
    QueueModule,
    SchemesModule,
    TeamsModule,
    AnalysisModule,
    GenerationModule,
  ],
})
export class AppModule {}
