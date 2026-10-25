import { Request, Response } from 'express';
import { SettingsRepository } from '../repositories/settings.repository.js';
import { ApiResponse } from '../utils/response.js';

export class SettingsController {
  /**
   * Lấy cấu hình hệ thống
   * GET /api/settings
   */
  static async getSettings(req: Request, res: Response) {
    try {
      const settings = await SettingsRepository.getSettings();
      return ApiResponse.success(res, settings, 'Lấy cấu hình hệ thống thành công');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Lỗi khi lấy cấu hình hệ thống', 500);
    }
  }

  /**
   * Cập nhật cấu hình hệ thống
   * PUT /api/settings
   */
  static async updateSettings(req: Request, res: Response) {
    try {
      const updated = await SettingsRepository.updateSettings(req.body);
      return ApiResponse.success(res, updated, 'Cập nhật cấu hình hệ thống thành công');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Lỗi khi cập nhật cấu hình hệ thống', 500);
    }
  }
}
