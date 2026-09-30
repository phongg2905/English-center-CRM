export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(message, 400, details);
  }

  static unauthorized(message = 'Chưa được xác thực danh tính'): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Không có quyền truy cập tài nguyên này'): AppError {
    return new AppError(message, 403);
  }

  static notFound(message = 'Tài nguyên yêu cầu không tồn tại'): AppError {
    return new AppError(message, 404);
  }

  static conflict(message: string, details?: unknown): AppError {
    return new AppError(message, 409, details);
  }

  static internal(message = 'Lỗi hệ thống nội bộ'): AppError {
    return new AppError(message, 500);
  }
}
