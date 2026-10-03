import { Request, Response, NextFunction } from 'express';
import { HealthService } from '../services/health.service.js';
import { ApiResponse } from '../utils/response.js';

export class HealthController {
  static async check(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const healthData = await HealthService.getHealthStatus();
      const statusCode = healthData.database.connected ? 200 : 503;
      const message = healthData.database.connected
        ? 'Hệ thống hoạt động bình thường, cơ sở dữ liệu PostgreSQL đã kết nối thành công'
        : 'Hệ thống đang gặp sự cố: Không thể kết nối cơ sở dữ liệu PostgreSQL';

      ApiResponse.success(res, healthData, message, statusCode);
    } catch (error) {
      next(error);
    }
  }
}
