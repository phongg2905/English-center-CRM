import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env file (supports running from root or backend directory)
const possibleEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend', '.env'),
];

for (const p of possibleEnvPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
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

const connectionString = process.env.DATABASE_URL || undefined;
const isCloudDb = Boolean(connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'));
const enableSsl = process.env.DB_SSL === 'true' || isCloudDb;

export const env: EnvironmentConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
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
    secret: process.env.JWT_SECRET || 'eduflow_crm_secret_jwt_token_key_2026_nhom8_ptit',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'eduflow_crm_refresh_secret_jwt_key_2026_ptit_nhom8',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
};

