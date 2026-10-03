import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/environment.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import apiRoutes from './routes/index.js';

export function createApp(): Application {
  const app = express();

  // 1. Bảo mật HTTP Headers với Helmet
  app.use(helmet());

  // 2. Cấu hình CORS an toàn (Hỗ trợ linh hoạt các port localhost trong dev)
  app.use(
    cors({
      origin: (origin, callback) => {
        const isLocalhost =
          Boolean(origin && (/^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)));

        if (!origin || isLocalhost || env.corsOrigins.includes(origin) || env.corsOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(new Error(`Origin '${origin}' bị từ chối bởi chính sách CORS`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // 3. Phân tích nội dung Body JSON & URL-encoded
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. Ghi nhận HTTP Request Log
  app.use(requestLogger);

  // 5. Đường dẫn chào mừng gốc
  app.get('/', (req: Request, res: Response) => {
    res.json({
      message: 'English Center CRM Backend API Server đang chạy!',
      version: '1.0.0',
      apiDocs: '/api',
      healthCheck: '/api/health',
    });
  });

  // 6. Gắn các tuyến API vào tiền tố /api
  app.use('/api', apiRoutes);

  // 7. Xử lý 404 Not Found khi không khớp route nào
  app.use(notFoundHandler);

  // 8. Middleware xử lý lỗi tập trung toàn hệ thống
  app.use(errorHandler);

  return app;
}

export const app = createApp();
