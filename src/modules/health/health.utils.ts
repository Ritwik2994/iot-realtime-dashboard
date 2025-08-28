import { Logger } from '@nestjs/common';

export interface MemoryInfo {
  readonly heapUsed: number;
  readonly heapTotal: number;
  readonly rss: number;
  readonly external: number;
  readonly arrayBuffers: number;
}

export interface MemoryUsage {
  readonly heapUsedMB: number;
  readonly heapTotalMB: number;
  readonly rssMB: number;
  readonly externalMB: number;
  readonly arrayBuffersMB: number;
}

export class HealthUtils {
  private static readonly logger = new Logger(HealthUtils.name);

  /**
   * Get current memory usage information
   */
  static getMemoryInfo(): MemoryInfo {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      rss: memUsage.rss,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
    };
  }

  /**
   * Get memory usage in MB for easier reading
   */
  static getMemoryUsageMB(): MemoryUsage {
    const memInfo = this.getMemoryInfo();
    return {
      heapUsedMB: Math.round(memInfo.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memInfo.heapTotal / 1024 / 1024),
      rssMB: Math.round(memInfo.rss / 1024 / 1024),
      externalMB: Math.round(memInfo.external / 1024 / 1024),
      arrayBuffersMB: Math.round(memInfo.arrayBuffers / 1024 / 1024),
    };
  }

  /**
   * Check if memory usage is within acceptable limits
   */
  static isMemoryUsageAcceptable(
    heapThresholdMB: number,
    rssThresholdMB: number,
  ): { readonly isAcceptable: boolean; readonly details: MemoryUsage } {
    const memUsage = this.getMemoryUsageMB();
    const isAcceptable = memUsage.heapUsedMB <= heapThresholdMB && memUsage.rssMB <= rssThresholdMB;

    return {
      isAcceptable,
      details: memUsage,
    };
  }

  /**
   * Format bytes to human readable format
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
