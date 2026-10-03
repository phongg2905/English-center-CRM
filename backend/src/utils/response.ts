import { Response } from 'express';

export interface ApiResponsePayload<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
  timestamp: string;
}

export class ApiResponse {
  static success<T>(
    res: Response,
    data?: T,
    message = 'Thành công',
    statusCode = 200,
    meta?: Record<string, unknown>
  ): Response {
    const payload: ApiResponsePayload<T> = {
      success: true,
      message,
      data,
      meta,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(payload);
  }

  static created<T>(
    res: Response,
    data?: T,
    message = 'Tạo mới thành công',
    meta?: Record<string, unknown>
  ): Response {
    return this.success(res, data, message, 201, meta);
  }

  static error(
    res: Response,
    message = 'Đã có lỗi xảy ra',
    statusCode = 500,
    details?: unknown
  ): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}
