import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';

const { Client } = pg;

async function runInit(): Promise<void> {
  logger.info('========================================================');
  logger.info('  KHỞI TẠO CƠ SỞ DỮ LIỆU POSTGRESQL (SUPABASE / LOCAL)');
  logger.info('========================================================');

  const connString = env.db.directUrl || env.db.connectionString;
  const isCloud = Boolean(connString && !connString.includes('localhost') && !connString.includes('127.0.0.1'));

  let client: pg.Client;

  if (isCloud && connString) {
    logger.info('Đang kết nối tới Supabase Cloud PostgreSQL...');
    client = new Client({
      connectionString: connString,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();
    logger.info('✅ Đã kết nối thành công tới Supabase Cloud!');
  } else {
    const dbHost = env.db.host || 'localhost';
    const dbPort = env.db.port || 5432;
    const dbUser = env.db.user || 'postgres';
    const dbPassword = env.db.password || undefined;
    const targetDbName = env.db.name || 'english_center_crm';

    logger.info(`Đang kiểm tra CSDL '${targetDbName}' trên ${dbHost}:${dbPort}...`);
    const rootClient = new Client({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: 'postgres',
    });

    await rootClient.connect();
    try {
      const checkDb = await rootClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetDbName]);
      if (checkDb.rows.length === 0) {
        logger.info(`Tạo mới CSDL '${targetDbName}' chuẩn mã hóa UTF-8...`);
        await rootClient.query(`CREATE DATABASE "${targetDbName}" WITH ENCODING 'UTF8';`);
        logger.info(`✅ Đã tạo CSDL '${targetDbName}' thành công!`);
      }
    } finally {
      await rootClient.end();
    }

    client = new Client({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: targetDbName,
    });
    await client.connect();
  }

  await client.query("SET client_encoding = 'UTF8';");

  try {
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

    logger.info(`Đọc Schema UTF-8: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    logger.info('Đang tạo cấu trúc bảng, functions, triggers và views (schema.sql)...');
    await client.query(schemaSql);
    logger.info('✅ Đã tạo thành công 10 bảng dữ liệu cốt lõi!');

    logger.info(`Đọc Seed Data UTF-8: ${seedPath}`);
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    logger.info('Đang nạp dữ liệu mẫu ban đầu (seed_data.sql)...');
    await client.query(seedSql);
    logger.info('✅ Đã nạp thành công toàn bộ dữ liệu mẫu chuẩn UTF-8!');

    // Cập nhật mở rộng vai trò TEACHER
    logger.info('Đang áp dụng migration vai trò TEACHER và trường chuyên môn...');
    await client.query('ALTER TABLE roles DROP CONSTRAINT IF EXISTS chk_role_code;');
    await client.query(`ALTER TABLE roles ADD CONSTRAINT chk_role_code CHECK (role_code IN ('ADMIN', 'SALES', 'ACADEMIC', 'TEACHER'));`);
    await client.query(`
      INSERT INTO roles (role_code, role_name, description)
      VALUES ('TEACHER', 'Giảng viên', 'Giảng dạy các lớp học, chấm thi và quản lý học viên')
      ON CONFLICT (role_code) DO NOTHING;
    `);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS specialization VARCHAR(150);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_native BOOLEAN DEFAULT FALSE;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;`);
    logger.info('✅ Đã cập nhật vai trò TEACHER và các cột bổ trợ!');

    // Kiểm tra mẫu dữ liệu thực tế
    const sample = await client.query('SELECT role_name FROM roles ORDER BY id ASC;');
    logger.info('========================================================');
    logger.info('✅ KẾT QUẢ ĐỐI SOÁT MÃ HÓA TIẾNG VIỆT (ENCODING CHECK):');
    sample.rows.forEach((r) => logger.info(`  • ${r.role_name}`));
    logger.info('========================================================');
    logger.info('🎉 CƠ SỞ DỮ LIỆU ĐÃ SẴN SÀNG 100%!');
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
