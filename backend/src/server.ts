import http from 'http';
import { app } from './app.js';
import { env } from './config/environment.js';
import { logger } from './utils/logger.js';
import { testDbConnection, pool, warmPool } from './database/pool.js';

const server = http.createServer(app);

async function startServer(): Promise<void> {
  try {
    logger.info('----------------------------------------------------------');
    logger.info(`Đang khởi động English Center CRM Backend Server [${env.nodeEnv}]...`);

    // 1. Kiểm tra kết nối tới cơ sở dữ liệu PostgreSQL
    logger.info(`Đang kiểm tra kết nối PostgreSQL tại ${env.db.host}:${env.db.port}/${env.db.name}...`);
    const dbStatus = await testDbConnection();

    if (dbStatus.connected) {
      logger.info(`Kết nối PostgreSQL thành công! (Độ trễ: ${dbStatus.latencyMs}ms)`);
      logger.info(`Phiên bản Database: ${dbStatus.dbVersion?.split(' on ')[0]}`);
      // Pre-warm connections để các request đầu tiên không bị cold-start latency
      await warmPool(2);
      logger.info(`Đã khởi tạo và làm ấm sẵn Connection Pool (2 connections).`);
    } else {
      logger.error(`CẢNH BÁO: Không thể kết nối PostgreSQL (${dbStatus.error}). Server vẫn khởi chạy nhưng các chức năng DB sẽ lỗi.`);
    }

    // 2. Khởi chạy HTTP Server
    server.listen(env.port, () => {
      logger.info(`==========================================================`);
      logger.info(`🚀 Server đang lắng nghe tại: http://localhost:${env.port}`);
      logger.info(`🏥 Health Check API:         http://localhost:${env.port}/api/health`);
      logger.info(`📋 API Overview:             http://localhost:${env.port}/api`);
      logger.info(`==========================================================`);
    });
  } catch (error) {
    logger.error('Lỗi nghiêm trọng khi khởi động server:', error);
    process.exit(1);
  }
}

// Xử lý dừng máy chủ an toàn (Graceful Shutdown)
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Nhận tín hiệu ${signal}. Đang tiến hành đóng máy chủ an toàn...`);

  server.close(async () => {
    logger.info('HTTP Server đã đóng các kết nối đang chờ.');
    try {
      await pool.end();
      logger.info('PostgreSQL Connection Pool đã giải phóng toàn bộ kết nối.');
      logger.info('Máy chủ đã dừng an toàn.');
      process.exit(0);
    } catch (err) {
      logger.error('Lỗi khi giải phóng Database Pool:', err);
      process.exit(1);
    }
  });

  // Hẹn giờ buộc dừng sau 10 giây nếu các tiến trình không kết thúc
  setTimeout(() => {
    logger.error('Buộc dừng tiến trình sau 10 giây chờ đợi.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();
