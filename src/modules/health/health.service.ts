import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HealthIndicatorResult,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { Connection } from 'mongoose';
import { healthConfig } from './health.config';
import { HealthUtils } from './health.utils';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly mongoose: MongooseHealthIndicator,

    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.checkHttpHealth(),
      () => this.checkDiskHealth(),
      () => this.checkMemoryHeap(),
      () => this.checkMemoryRSS(),
      () => this.checkMongoDB(),
      () => this.checkMongoConnection('mongo_connection'),
    ]);
  }

  private async checkHttpHealth(): Promise<HealthIndicatorResult> {
    try {
      return await this.http.pingCheck('https', healthConfig.http.pingUrl, {
        timeout: healthConfig.http.timeout,
      });
    } catch (error) {
      this.logger.error('HTTP health check failed', error);
      throw error;
    }
  }

  private async checkDiskHealth(): Promise<HealthIndicatorResult> {
    try {
      return await this.disk.checkStorage('storage', {
        path: healthConfig.disk.path,
        thresholdPercent: healthConfig.disk.thresholdPercent,
      });
    } catch (error) {
      this.logger.error('Disk health check failed', error);
      throw error;
    }
  }

  private async checkMemoryHeap(): Promise<HealthIndicatorResult> {
    try {
      const memUsage = HealthUtils.getMemoryUsageMB();

      return await this.memory.checkHeap('memory_heap', healthConfig.memory.heapThreshold);
    } catch (error) {
      this.logger.error('Memory heap health check failed', error);
      throw error;
    }
  }

  private async checkMemoryRSS(): Promise<HealthIndicatorResult> {
    try {
      const memUsage = HealthUtils.getMemoryUsageMB();

      return await this.memory.checkRSS('memory_rss', healthConfig.memory.rssThreshold);
    } catch (error) {
      this.logger.error('Memory RSS health check failed', error);
      throw error;
    }
  }

  private async checkMongoDB(): Promise<HealthIndicatorResult> {
    try {
      return await this.mongoose.pingCheck('mongodb');
    } catch (error) {
      this.logger.error('MongoDB health check failed', error);
      throw error;
    }
  }

  private async checkMongoConnection(key: string): Promise<HealthIndicatorResult> {
    try {
      const isReady = this.mongoConnection.readyState === 1;

      if (!isReady) {
        this.logger.warn('MongoDB connection is not ready', {
          readyState: this.mongoConnection.readyState,
        });
      }

      return isReady
        ? {
            [key]: {
              status: 'up',
            },
          }
        : {
            [key]: {
              status: 'down',
              message: 'MongoDB connection is not ready',
            },
          };
    } catch (error) {
      this.logger.error('MongoDB connection check failed', error);
      return {
        [key]: {
          status: 'down',
          message: error.message,
        },
      };
    }
  }
}
