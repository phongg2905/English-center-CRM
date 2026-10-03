import { query, pool, testDbConnection } from '../database/pool.js';
import { logger } from '../utils/logger.js';

async function runDatabaseDiagnostics(): Promise<void> {
  logger.info('====================================================');
  logger.info('   BẮT ĐẦU CHẨN ĐOÁN CƠ SỞ DỮ LIỆU POSTGRESQL');
  logger.info('====================================================');

  const health = await testDbConnection();
  if (!health.connected) {
    logger.error('❌ Kết nối PostgreSQL thất bại:', health.error);
    process.exit(1);
  }

  logger.info(`✅ Kết nối thành công tới Database: ${health.database} (Latency: ${health.latencyMs}ms)`);
  logger.info(`📌 Máy chủ CSDL: ${health.dbVersion?.split(' on ')[0]}`);
  logger.info(`⏰ Thời gian máy chủ: ${health.serverTime}`);

  logger.info('----------------------------------------------------');
  logger.info('Kiểm tra số lượng bản ghi trong 10 bảng dữ liệu cốt lõi:');
  logger.info('----------------------------------------------------');

  const tables = [
    'roles',
    'users',
    'leads',
    'interaction_logs',
    'courses',
    'placement_tests',
    'classes',
    'students',
    'enrollments',
    'payment_receipts',
  ];

  for (const table of tables) {
    try {
      const res = await query(`SELECT COUNT(*) as count FROM ${table}`);
      const count = res.rows[0].count;
      logger.info(`  • Bảng [${table.padEnd(18, ' ')}]: ${count} bản ghi`);
    } catch (err: any) {
      logger.error(`  • Bảng [${table}]: Lỗi - ${err.message}`);
    }
  }

  logger.info('====================================================');
  logger.info('✅ Chẩn đoán hoàn tất. Cơ sở dữ liệu đã sẵn sàng!');
  logger.info('====================================================');

  await pool.end();
  process.exit(0);
}

runDatabaseDiagnostics().catch((err) => {
  logger.error('Lỗi khi chẩn đoán database:', err);
  process.exit(1);
});
