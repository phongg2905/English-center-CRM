import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/environment.js';

export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  next(new AppError(`Đường dẫn API '${req.originalUrl}' không tồn tại trên hệ thống`, 404));
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Lỗi máy chủ nội bộ';
  let details = err.details;

  // Xử lý mã lỗi từ PostgreSQL Database
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        statusCode = 409;
        message = 'Dữ liệu đã tồn tại trong hệ thống (vi phạm ràng buộc duy nhất)';
        if (err.detail) details = { pgDetail: err.detail };
        break;
      case '23503': // foreign_key_violation
        statusCode = 400;
        message = 'Không tìm thấy dữ liệu liên kết tham chiếu (vi phạm ràng buộc khóa ngoại)';
        if (err.detail) details = { pgDetail: err.detail };
        break;
      case '23502': // not_null_violation
        statusCode = 400;
        message = `Thiếu trường dữ liệu bắt buộc: ${err.column || 'không xác định'}`;
        break;
      case '22P02': // invalid_text_representation
        statusCode = 400;
        message = 'Định dạng dữ liệu không hợp lệ';
        break;
      case 'ECONNREFUSED':
      case '57P01':
        statusCode = 503;
        message = 'Không thể kết nối đến cơ sở dữ liệu PostgreSQL';
        break;
    }
  }

  // Ghi log lỗi
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} - ${statusCode} - ${message}`, {
      stack: err.stack,
      body: req.body,
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} - ${statusCode} - ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    details: details || undefined,
    ...(env.nodeEnv === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
}
