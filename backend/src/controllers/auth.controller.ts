import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { UserRepository } from '../repositories/user.repository.js';
import { ApiResponse } from '../utils/response.js';

export class AuthController {
  /**
   * @route POST /api/auth/register
   * @desc  Đăng ký tài khoản người dùng mới
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      ApiResponse.created(res, result, 'Đăng ký tài khoản thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/auth/login
   * @desc  Đăng nhập hệ thống & cấp JWT Token
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      ApiResponse.success(res, result, 'Đăng nhập thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/auth/refresh
   * @desc  Làm mới Access Token bằng Refresh Token
   */
  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refresh(refreshToken);
      ApiResponse.success(res, result, 'Làm mới token thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/auth/logout
   * @desc  Đăng xuất khỏi hệ thống
   */
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      ApiResponse.success(res, null, 'Đăng xuất tài khoản thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/auth/me
   * @desc  Lấy thông tin người dùng hiện tại đang đăng nhập
   */
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return next(new Error('Không tìm thấy thông tin định danh'));
      }
      const user = await AuthService.getCurrentUser(userId);
      ApiResponse.success(res, user, 'Lấy thông tin tài khoản thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/auth/roles
   * @desc  Lấy danh mục các vai trò trong hệ thống
   */
  static async getRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await UserRepository.getAllRoles();
      ApiResponse.success(res, roles, 'Lấy danh mục vai trò thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/auth/forgot-password
   * @desc  Yêu cầu gửi mã OTP khôi phục mật khẩu qua Email
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.forgotPassword(req.body);
      ApiResponse.success(
        res,
        result,
        'Mã OTP khôi phục mật khẩu đã được gửi đến email của bạn (hiệu lực 15 phút)'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/auth/reset-password
   * @desc  Đặt lại mật khẩu mới thông qua mã OTP
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.resetPassword(req.body);
      ApiResponse.success(res, null, 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/auth/change-password
   * @desc  Đổi mật khẩu tài khoản cá nhân (Protected)
   */
  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return next(new Error('Chưa xác thực danh tính người dùng'));
      }
      await AuthService.changePassword(userId, req.body);
      ApiResponse.success(res, null, 'Đổi mật khẩu tài khoản thành công');
    } catch (error) {
      next(error);
    }
  }
}
