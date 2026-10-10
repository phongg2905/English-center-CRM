import { Request, Response, NextFunction } from 'express';
import { StaffService } from '../services/staff.service.js';
import { ApiResponse } from '../utils/response.js';
import { RoleCode } from '../types/auth.types.js';

export class StaffController {
  /**
   * @route GET /api/staff
   * @desc  Lấy danh sách nhân viên kèm tìm kiếm, lọc vai trò và phân trang
   */
  static async getStaffs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, role, status, page, limit, sortBy, sortOrder } = req.query;

      let isActive: boolean | undefined = undefined;
      if (status === 'active' || status === 'true') isActive = true;
      if (status === 'inactive' || status === 'false') isActive = false;

      const result = await StaffService.getStaffs({
        search: search ? String(search) : undefined,
        roleCode: role ? (String(role).toUpperCase() as RoleCode) : undefined,
        isActive,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      ApiResponse.success(res, result, 'Lấy danh sách nhân viên thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/staff/teachers
   * @desc  Lấy danh sách giảng viên kèm lịch dạy
   */
  static async getTeachers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teachers = await StaffService.getTeachers();
      ApiResponse.success(res, teachers, 'Lấy danh sách giảng viên thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/staff/:id
   * @desc  Lấy thông tin chi tiết một nhân viên
   */
  static async getStaffById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const staff = await StaffService.getStaffById(id);
      ApiResponse.success(res, staff, 'Lấy thông tin nhân viên thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/staff
   * @desc  Tạo mới tài khoản nhân viên (Admin Only)
   */
  static async createStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await StaffService.createStaff(req.body);
      ApiResponse.created(res, created, 'Tạo mới tài khoản nhân viên thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route PUT /api/staff/:id
   * @desc  Cập nhật thông tin nhân viên (Admin Only)
   */
  static async updateStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const currentUserId = (req as any).user?.userId || (req as any).user?.id;
      const updated = await StaffService.updateStaff(id, req.body, currentUserId);
      ApiResponse.success(res, updated, 'Cập nhật thông tin nhân viên thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route PATCH /api/staff/:id/status
   * @desc  Kích hoạt hoặc vô hiệu hóa tài khoản nhân viên
   */
  static async updateStaffStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const currentUserId = (req as any).user?.userId || (req as any).user?.id;
      const { isActive } = req.body;

      if (isActive === undefined) {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp trạng thái isActive (boolean)' });
        return;
      }

      const updated = await StaffService.updateStaffStatus(id, currentUserId, Boolean(isActive));
      const message = isActive ? 'Kích hoạt tài khoản thành công' : 'Đã vô hiệu hóa / khóa tài khoản nhân viên';
      ApiResponse.success(res, updated, message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/staff/:id/reset-password
   * @desc  Quản trị viên đặt lại mật khẩu cho nhân viên
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const currentUserId = (req as any).user?.userId || (req as any).user?.id;
      const { newPassword } = req.body;

      const result = await StaffService.resetPassword(id, currentUserId, newPassword);
      ApiResponse.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route DELETE /api/staff/:id
   * @desc  Xóa tài khoản nhân viên
   */
  static async deleteStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const currentUserId = (req as any).user?.userId || (req as any).user?.id;

      const result = await StaffService.deleteStaff(id, currentUserId);
      ApiResponse.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}
