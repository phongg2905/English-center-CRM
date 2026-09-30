import os from 'os';
import { testDbConnection, DbHealthResult } from '../database/pool.js';
import { env } from '../config/environment.js';

export interface HealthCheckData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  server: {
    name: string;
    version: string;
    environment: string;
    uptimeSeconds: number;
    uptimeFormatted: string;
    timestamp: string;
    nodeVersion: string;
    platform: string;
    memoryUsageMb: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
    };
  };
  database: DbHealthResult;
}

export class HealthService {
  static async getHealthStatus(): Promise<HealthCheckData> {
    const dbHealth = await testDbConnection();
    const uptimeSeconds = Math.floor(process.uptime());

    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    const uptimeFormatted = `${hours}h ${minutes}m ${seconds}s`;

    const memory = process.memoryUsage();
    const memoryUsageMb = {
      rss: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
      heapTotal: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
      heapUsed: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
    };

    const status = dbHealth.connected ? 'healthy' : 'unhealthy';

    return {
      status,
      server: {
        name: 'English Center CRM API Server',
        version: '1.0.0',
        environment: env.nodeEnv,
        uptimeSeconds,
        uptimeFormatted,
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: `${os.platform()} (${os.arch()})`,
        memoryUsageMb,
      },
      database: dbHealth,
    };
  }
}
