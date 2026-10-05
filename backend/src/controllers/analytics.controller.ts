/**
 * DỰ ÁN: ENGLISH CENTER CRM (EduFlow CRM)
 * MODULE: ANALYTICS & REPORTING (UC-04, TASK BE-06)
 * TÁC GIẢ: Long Phạm (@longphm11) - Backend Developer
 */

import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';
import { ApiResponse } from '../utils/response.js';
import { RevenuePeriod, ExportReportType, ExportFormat } from '../types/analytics.types.js';

export class AnalyticsController {
  /**
   * @route GET /api/analytics/overview
   * @desc  Lấy tổng quan các chỉ số KPI điều hành cốt lõi
   */
  static async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AnalyticsService.getOverview();
      ApiResponse.success(res, data, 'Lấy tổng quan chỉ số điều hành thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/analytics/funnel
   * @desc  Lấy báo cáo tỷ lệ chuyển đổi phễu tuyển sinh (Lead -> Test -> Enrolled)
   */
  static async getFunnel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate, sourceChannel, assignedSalesId } = req.query;

      const data = await AnalyticsService.getFunnel({
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        sourceChannel: sourceChannel as string | undefined,
        assignedSalesId: assignedSalesId ? Number(assignedSalesId) : undefined,
      });

      ApiResponse.success(res, data, 'Lấy báo cáo phễu chuyển đổi thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/analytics/revenue
   * @desc  Lấy báo cáo doanh thu thực thu theo tuần/tháng/quý/năm
   */
  static async getRevenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate, period, paymentMethod } = req.query;

      const data = await AnalyticsService.getRevenue({
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        period: period as RevenuePeriod | undefined,
        paymentMethod: paymentMethod as string | undefined,
      });

      ApiResponse.success(res, data, 'Lấy báo cáo doanh thu thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/analytics/sales-leaderboard
   * @desc  Lấy bảng xếp hạng hiệu suất tư vấn viên (Lead chốt, Win rate, Doanh số)
   */
  static async getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate, limit } = req.query;

      const data = await AnalyticsService.getLeaderboard({
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        limit: limit ? Number(limit) : undefined,
      });

      ApiResponse.success(res, data, 'Lấy bảng xếp hạng tư vấn viên thành công', 200, {
        totalConsultants: data.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/analytics/channel-roi
   * @desc  Lấy thống kê hiệu quả từng kênh Marketing
   */
  static async getChannelROI(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const data = await AnalyticsService.getChannelROI({
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
      });

      ApiResponse.success(res, data, 'Lấy báo cáo hiệu quả kênh tuyển sinh thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/analytics/class-occupancy
   * @desc  Lấy thống kê tỷ lệ lấp đầy phòng học và danh sách lớp
   */
  static async getClassOccupancy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId, status } = req.query;

      const data = await AnalyticsService.getClassOccupancy({
        courseId: courseId ? Number(courseId) : undefined,
        status: status as string | undefined,
      });

      ApiResponse.success(res, data, 'Lấy thống kê tỷ lệ lấp đầy phòng học thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/analytics/export
   * @desc  Xuất dữ liệu thô phục vụ báo cáo định dạng JSON hoặc CSV
   */
  static async exportData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, format, startDate, endDate } = req.query;

      const result = await AnalyticsService.exportData({
        type: type as ExportReportType,
        format: format as ExportFormat | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
      });

      if (result.format === 'csv') {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.status(200).send(result.data);
        return;
      }

      ApiResponse.success(res, result.data, 'Xuất dữ liệu báo cáo JSON thành công', 200, {
        filename: result.filename,
        count: Array.isArray(result.data) ? result.data.length : 1,
      });
    } catch (error) {
      next(error);
    }
  }
}
