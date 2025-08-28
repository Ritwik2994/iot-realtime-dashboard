import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DatabaseModule } from '@/db/database.module';
import { healthConfig } from './health.config';

@Module({
  imports: [
    TerminusModule.forRoot({
      errorLogStyle: 'pretty',
      logger: true,
    }),
    HttpModule,
    DatabaseModule,
  ],
  controllers: [HealthController],
  providers: [
    HealthService,
    {
      provide: 'HEALTH_CONFIG',
      useValue: healthConfig,
    },
  ],
  exports: [HealthService],
})
export class HealthModule {}
