import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

// Load environment variables from backend/.env accurately
const possibleEnvPaths = [
  path.resolve(currentDir, '../../.env'),
  path.resolve(process.cwd(), 'backend', '.env'),
  path.resolve(process.cwd(), '.env'),
];

for (const p of possibleEnvPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p, override: true });
    break;
  }
}

export interface EnvironmentConfig {
  nodeEnv: string;
  port: number;
  corsOrigins: string[];
  db: {
    connectionString?: string;
    directUrl?: string;
    host: string;
    port: number;
    name: string;
    user: string;
    password?: string;
    ssl: boolean;
    maxConnections: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
}

const nodeEnv = process.env.NODE_ENV || 'development';
const connectionString = process.env.DATABASE_URL || undefined;
const isCloudDb = Boolean(connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'));
const enableSsl = process.env.DB_SSL === 'true' || isCloudDb;

/**
 * Xác thực biến môi trường bảo mật JWT (Bắt buộc khai báo tường minh trên môi trường Production)
 */
export function resolveJwtSecrets(
  currentEnv?: string,
  jwtSecretEnv?: string,
  jwtRefreshSecretEnv?: string
): { secret: string; refreshSecret: string } {
  const effectiveEnv = currentEnv !== undefined ? currentEnv : nodeEnv;
  const effectiveSecret = arguments.length >= 2 ? jwtSecretEnv : process.env.JWT_SECRET;
  const effectiveRefresh = arguments.length >= 3 ? jwtRefreshSecretEnv : process.env.JWT_REFRESH_SECRET;

  if (effectiveEnv === 'production') {
    if (!effectiveSecret || effectiveSecret.trim().length < 16) {
      throw new Error(
        '[SECURITY ERROR] Biến môi trường JWT_SECRET bắt buộc phải được cấu hình tường minh (tối thiểu 16 ký tự) trong môi trường production.'
      );
    }
    if (!effectiveRefresh || effectiveRefresh.trim().length < 16) {
      throw new Error(
        '[SECURITY ERROR] Biến môi trường JWT_REFRESH_SECRET bắt buộc phải được cấu hình tường minh (tối thiểu 16 ký tự) trong môi trường production.'
      );
    }
    return {
      secret: effectiveSecret.trim(),
      refreshSecret: effectiveRefresh.trim(),
    };
  }

  return {
    secret: effectiveSecret || 'eduflow_crm_dev_only_jwt_secret_key_2026',
    refreshSecret: effectiveRefresh || 'eduflow_crm_dev_only_refresh_secret_key_2026',
  };
}

const resolvedJwt = resolveJwtSecrets();

export const env: EnvironmentConfig = {
  nodeEnv,
  port: parseInt(process.env.PORT || '5000', 10),
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim()),
  db: {
    connectionString,
    directUrl: process.env.DIRECT_URL || undefined,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: enableSsl,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MILLIS || '120000', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MILLIS || '10000', 10),
  },
  jwt: {
    secret: resolvedJwt.secret,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: resolvedJwt.refreshSecret,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
};
