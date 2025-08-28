import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthUtils } from './health.utils';
import { healthConfig } from './health.config';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Performs comprehensive health checks including HTTP, disk, memory, and database connectivity',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: { type: 'object' },
        error: { type: 'object' },
        details: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service is unhealthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        info: { type: 'object' },
        error: { type: 'object' },
        details: { type: 'object' },
      },
    },
  })
  async check() {
    return this.healthService.check();
  }

  @Get('ping')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simple ping endpoint',
    description: 'Returns a simple ping response to verify the service is running',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is running',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2025-08-28T11:54:27.638Z' },
        uptime: { type: 'number', example: 12345 },
      },
    },
  })
  async ping() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('memory')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Memory usage endpoint',
    description: 'Returns detailed memory usage information for debugging',
  })
  @ApiResponse({
    status: 200,
    description: 'Memory usage information',
    schema: {
      type: 'object',
      properties: {
        timestamp: { type: 'string' },
        memory: {
          type: 'object',
          properties: {
            heapUsedMB: { type: 'number' },
            heapTotalMB: { type: 'number' },
            rssMB: { type: 'number' },
            externalMB: { type: 'number' },
            arrayBuffersMB: { type: 'number' },
          },
        },
        thresholds: {
          type: 'object',
          properties: {
            heapThresholdMB: { type: 'number' },
            rssThresholdMB: { type: 'number' },
          },
        },
        status: {
          type: 'object',
          properties: {
            heapStatus: { type: 'string' },
            rssStatus: { type: 'string' },
          },
        },
      },
    },
  })
  async getMemoryInfo() {
    const memUsage = HealthUtils.getMemoryUsageMB();
    const heapThresholdMB = healthConfig.memory.heapThreshold / 1024 / 1024;
    const rssThresholdMB = healthConfig.memory.rssThreshold / 1024 / 1024;

    const heapStatus = memUsage.heapUsedMB <= heapThresholdMB ? 'ok' : 'warning';
    const rssStatus = memUsage.rssMB <= rssThresholdMB ? 'ok' : 'warning';

    return {
      timestamp: new Date().toISOString(),
      memory: memUsage,
      thresholds: {
        heapThresholdMB: Math.round(heapThresholdMB),
        rssThresholdMB: Math.round(rssThresholdMB),
      },
      status: {
        heapStatus,
        rssStatus,
      },
    };
  }
}
