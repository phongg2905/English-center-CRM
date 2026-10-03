import pg, { PoolClient, QueryResult, QueryResultRow } from 'pg';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

const poolConfig: pg.PoolConfig = env.db.connectionString
  ? {
      connectionString: env.db.connectionString,
      ssl: env.db.ssl ? { rejectUnauthorized: false } : undefined,
      max: env.db.maxConnections,
      idleTimeoutMillis: env.db.idleTimeoutMillis,
      connectionTimeoutMillis: env.db.connectionTimeoutMillis,
    }
  : {
      host: env.db.host,
      port: env.db.port,
      database: env.db.name,
      user: env.db.user,
      password: env.db.password,
      ssl: env.db.ssl ? { rejectUnauthorized: false } : undefined,
      max: env.db.maxConnections,
      idleTimeoutMillis: env.db.idleTimeoutMillis,
      connectionTimeoutMillis: env.db.connectionTimeoutMillis,
    };

export const pool = new Pool(poolConfig);

let dbConnectionState = false;

export function isDbAvailable(): boolean {
  return dbConnectionState;
}

export function setDbAvailable(state: boolean): void {
  dbConnectionState = state;
}

pool.on('connect', () => {
  dbConnectionState = true;
  logger.debug('Đã kết nối một client mới trong PostgreSQL Connection Pool');
});

pool.on('error', (err) => {
  dbConnectionState = false;
  logger.debug('PostgreSQL client error (có thể do CSDL chưa khởi chạy):', err.message);
});

/**
 * Thực thi câu lệnh SQL đơn với Connection Pool
 */
export async function query<R extends QueryResultRow = any, I extends any[] = any[]>(
  text: string,
  params?: I
): Promise<QueryResult<R>> {
  const start = Date.now();
  try {
    const res = await pool.query<R>(text, params);
    dbConnectionState = true;
    const duration = Date.now() - start;
    if (duration > 500) {
      logger.warn(`Truy vấn chậm (${duration}ms): ${text.substring(0, 100)}...`);
    }
    return res;
  } catch (error: any) {
    dbConnectionState = false;
    throw error;
  }
}

/**
 * Lấy một client từ Pool phục vụ các thao tác Transaction phức tạp
 */
export async function getClient(): Promise<PoolClient> {
  const client = await pool.connect();
  dbConnectionState = true;
  return client;
}

/**
 * Thực thi logic nghiệp vụ bọc trong Database Transaction ACID (chống Overbooking)
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export interface DbHealthResult {
  connected: boolean;
  database: string;
  latencyMs: number;
  serverTime?: string;
  dbVersion?: string;
  error?: string;
}

/**
 * Kiểm tra kết nối tới cơ sở dữ liệu PostgreSQL
 */
export async function testDbConnection(): Promise<DbHealthResult> {
  const start = Date.now();
  try {
    const res = await pool.query('SELECT current_database() as current_db, NOW() as server_time, version() as db_version');
    const latencyMs = Date.now() - start;
    dbConnectionState = true;
    return {
      connected: true,
      database: res.rows[0]?.current_db || env.db.name,
      latencyMs,
      serverTime: res.rows[0]?.server_time,
      dbVersion: res.rows[0]?.db_version,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    dbConnectionState = false;
    return {
      connected: false,
      database: env.db.name,
      latencyMs,
      error: err.message || 'Không thể kết nối đến PostgreSQL',
    };
  }
}
