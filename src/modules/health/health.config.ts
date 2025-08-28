export interface HealthConfig {
  readonly memory: {
    readonly heapThreshold: number;
    readonly rssThreshold: number;
  };
  readonly disk: {
    readonly thresholdPercent: number;
    readonly path: string;
  };
  readonly http: {
    readonly pingUrl: string;
    readonly timeout: number;
  };
}

export const healthConfig: HealthConfig = {
  memory: {
    heapThreshold: parseInt(process.env.HEALTH_MEMORY_HEAP_THRESHOLD || '200', 10) * 1024 * 1024, // Default: 200MB
    rssThreshold: parseInt(process.env.HEALTH_MEMORY_RSS_THRESHOLD || '500', 10) * 1024 * 1024, // Default: 500MB
  },
  disk: {
    thresholdPercent: parseFloat(process.env.HEALTH_DISK_THRESHOLD_PERCENT || '0.85'), // Default: 85%
    path: process.env.HEALTH_DISK_PATH || '/',
  },
  http: {
    pingUrl: process.env.HEALTH_HTTP_PING_URL || 'https://google.com',
    timeout: parseInt(process.env.HEALTH_HTTP_TIMEOUT || '5000', 10), // Default: 5 seconds
  },
};
