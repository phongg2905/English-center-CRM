import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service.js';
import { AppError } from '../utils/AppError.js';
import { RoleCode } from '../types/auth.types.js';

/**
 * Middleware xác thực JSON Web Token (JWT)
 */
export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Vui lòng đăng nhập để truy cập tài nguyên này (Missing Bearer Token)', 401));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new AppError('Mã Access Token không hợp lệ', 401));
  }

  try {
    const payload = TokenService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware kiểm soát quyền truy cập dựa trên vai trò (Role-Based Access Control - RBAC)
 * @param allowedRoles Danh sách các vai trò được phép truy cập (vd: 'ADMIN', 'SALES', 'ACADEMIC')
 */
export function authorizeRoles(...allowedRoles: (RoleCode | string)[]): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Chưa xác thực danh tính người dùng', 401));
    }

    const userRole = req.user.role.toUpperCase();
    const normalizedAllowedRoles = allowedRoles.map((r) => r.toUpperCase());

    if (!normalizedAllowedRoles.includes(userRole)) {
      return next(
        new AppError(
          `Bạn không có quyền truy cập chức năng này. Quyền yêu cầu: [${normalizedAllowedRoles.join(', ')}], quyền hiện tại: [${userRole}]`,
          403
        )
      );
    }

    next();
  };
}
