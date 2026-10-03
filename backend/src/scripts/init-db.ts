import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';

const { Client } = pg;

async function runInit(): Promise<void> {
  logger.info('========================================================');
  logger.info('  KHỞI TẠO CƠ SỞ DỮ LIỆU CLOUD POSTGRESQL (SUPABASE)');
  logger.info('========================================================');

  // Ưu tiên DIRECT_URL cho các tác vụ DDL / Migration
  const connectionString = env.db.directUrl || env.db.connectionString;

  const clientConfig: pg.ClientConfig = connectionString
    ? {
        connectionString,
        ssl: env.db.ssl ? { rejectUnauthorized: false } : undefined,
      }
    : {
        host: env.db.host,
        port: env.db.port,
        database: env.db.name,
        user: env.db.user,
        password: env.db.password,
        ssl: env.db.ssl ? { rejectUnauthorized: false } : undefined,
      };

  const client = new Client(clientConfig);

  try {
    logger.info('Đang kết nối tới Supabase PostgreSQL qua Session Pooler...');
    await client.connect();
    logger.info('✅ Kết nối thành công tới Supabase!');

    // Xác định đường dẫn file schema.sql và seed_data.sql
    const possibleSchemaPaths = [
      path.resolve(process.cwd(), '..', 'database', 'schema.sql'),
      path.resolve(process.cwd(), 'database', 'schema.sql'),
    ];
    const possibleSeedPaths = [
      path.resolve(process.cwd(), '..', 'database', 'seed_data.sql'),
      path.resolve(process.cwd(), 'database', 'seed_data.sql'),
    ];

    const schemaPath = possibleSchemaPaths.find((p) => fs.existsSync(p));
    const seedPath = possibleSeedPaths.find((p) => fs.existsSync(p));

    if (!schemaPath || !seedPath) {
      throw new Error('Không tìm thấy file schema.sql hoặc seed_data.sql trong thư mục database!');
    }

    logger.info(`Đọc file Schema: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    logger.info('Đang thực thi tạo 10 bảng dữ liệu cốt lõi (schema.sql)...');
    await client.query(schemaSql);
    logger.info('✅ Đã tạo thành công 10 bảng, cấu trúc khóa chính, khóa ngoại, indexes và triggers!');

    logger.info(`Đọc file Seed Data: ${seedPath}`);
    const seedSql = fs.readFileSync(seedPath, 'utf-8');

    logger.info('Đang nạp dữ liệu mẫu thực tế (seed_data.sql)...');
    await client.query(seedSql);
    logger.info('✅ Đã nạp thành công toàn bộ dữ liệu mẫu chuẩn!');

    logger.info('========================================================');
    logger.info('✅ KHỞI TẠO CSDL TRÊN SUPABASE THÀNH CÔNG VÀ HOÀN TẤT!');
    logger.info('========================================================');
  } catch (error: any) {
    logger.error('❌ Lỗi khi khởi tạo CSDL:', error.message);
    if (error.detail) {
      logger.error('Chi tiết lỗi:', error.detail);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runInit().catch((err) => {
  logger.error('Lỗi không xác định:', err);
  process.exit(1);
});
