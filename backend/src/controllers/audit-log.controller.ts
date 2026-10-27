import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '../services/audit-log.service.js';
import { ApiResponse } from '../utils/response.js';

export class AuditLogController {
  /**
   * @route GET /api/audit-logs
   * @desc  Lấy danh sách nhật ký hoạt động trên hệ thống (chỉ dành cho ADMIN)
   */
  static async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        module,
        action,
        userId,
        userRole,
        search,
        startDate,
        endDate,
        page,
        limit,
      } = req.query;

      const result = await AuditLogService.getLogs({
        module: module ? String(module) : undefined,
        action: action ? String(action) : undefined,
        userId: userId ? Number(userId) : undefined,
        userRole: userRole ? String(userRole) : undefined,
        search: search ? String(search) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 40,
      });

      ApiResponse.success(
        res,
        result,
        'Lấy danh sách nhật ký hoạt động hệ thống thành công',
        200,
        {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        }
      );
    } catch (error) {
      next(error);
    }
  }
}

