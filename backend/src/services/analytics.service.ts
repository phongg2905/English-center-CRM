/**
 * DỰ ÁN: ENGLISH CENTER CRM (EduFlow CRM)
 * MODULE: ANALYTICS & REPORTING (UC-04, TASK BE-06)
 * TÁC GIẢ: Long Phạm (@longphm11) - Backend Developer
 */

import { AnalyticsRepository } from '../repositories/analytics.repository.js';
import {
  DateRangeFilter,
  FunnelAnalyticsResponse,
  RevenueAnalyticsResponse,
  RevenuePeriod,
  SalesConsultantPerformance,
  MarketingChannelROI,
  CapacityAnalyticsResponse,
  ExecutiveOverviewResponse,
  ExportFilterQuery,
} from '../types/analytics.types.js';
import { AppError } from '../utils/AppError.js';

export class AnalyticsService {
  /**
   * Lấy thống kê tỷ lệ chuyển đổi phễu tuyển sinh
   */
  static async getFunnel(filter: DateRangeFilter & {
    sourceChannel?: string;
    assignedSalesId?: number;
  }): Promise<FunnelAnalyticsResponse> {
    this.validateDateRange(filter.startDate, filter.endDate);
    return AnalyticsRepository.getFunnelAnalytics(filter);
  }

  /**
   * Lấy báo cáo doanh thu theo chu kỳ (ngày / tuần / tháng / quý / năm)
   */
  static async getRevenue(filter: DateRangeFilter & {
    period?: RevenuePeriod;
    paymentMethod?: string;
  }): Promise<RevenueAnalyticsResponse> {
    this.validateDateRange(filter.startDate, filter.endDate);
    return AnalyticsRepository.getRevenueAnalytics(filter);
  }

  /**
   * Lấy bảng xếp hạng hiệu suất tư vấn viên
   */
  static async getLeaderboard(filter: DateRangeFilter & {
    limit?: number;
  }): Promise<SalesConsultantPerformance[]> {
    this.validateDateRange(filter.startDate, filter.endDate);
    return AnalyticsRepository.getSalesLeaderboard(filter);
  }

  /**
   * Lấy báo cáo hiệu quả và ROI từng kênh Marketing
   */
  static async getChannelROI(filter: DateRangeFilter): Promise<MarketingChannelROI[]> {
    this.validateDateRange(filter.startDate, filter.endDate);
    return AnalyticsRepository.getMarketingChannelROI(filter);
  }

  /**
   * Lấy thống kê tỷ lệ lấp đầy phòng học và danh sách lớp học
   */
  static async getClassOccupancy(filter: {
    courseId?: number;
    status?: string;
  }): Promise<CapacityAnalyticsResponse> {
    return AnalyticsRepository.getClassOccupancy(filter);
  }

  /**
   * Lấy tổng quan các chỉ số điều hành chính (Executive Overview)
   */
  static async getOverview(): Promise<ExecutiveOverviewResponse> {
    return AnalyticsRepository.getExecutiveOverview();
  }

  /**
   * Xuất báo cáo dữ liệu thô (JSON hoặc CSV)
   */
  static async exportData(query: ExportFilterQuery): Promise<{
    format: 'json' | 'csv';
    filename: string;
    data: any;
  }> {
    const { type, format = 'json', startDate, endDate } = query;
    this.validateDateRange(startDate, endDate);

    const validTypes = ['leads', 'revenue', 'sales-leaderboard', 'channel-roi', 'occupancy'];
    if (!validTypes.includes(type)) {
      throw new AppError(`Loại báo cáo '${type}' không hợp lệ. Các loại hỗ trợ: ${validTypes.join(', ')}`, 400);
    }

    const rawData = await AnalyticsRepository.getRawExportData(type, { startDate, endDate });
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `report_${type}_${timestamp}.${format}`;

    if (format === 'csv') {
      const csvString = this.convertToCSV(rawData);
      return { format: 'csv', filename, data: csvString };
    }

    return { format: 'json', filename, data: rawData };
  }

  /**
   * Helper: Chuyển mảng JSON object thành chuỗi CSV chuẩn RFC 4180 có UTF-8 BOM
   */
  private static convertToCSV(items: Record<string, any>[]): string {
    if (!items || items.length === 0) {
      return '\uFEFF';
    }

    const headers = Object.keys(items[0]);
    const escapeField = (val: any): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headerRow = headers.map(escapeField).join(',');
    const dataRows = items.map((row) =>
      headers.map((h) => escapeField(row[h])).join(',')
    );

    // Ký tự \uFEFF là UTF-8 Byte Order Mark giúp Microsoft Excel tự động nhận diện tiếng Việt có dấu
    return '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
  }

  /**
   * Helper: Kiểm tra tính hợp lệ của khoảng ngày
   */
  private static validateDateRange(startDate?: string, endDate?: string): void {
    if (startDate && isNaN(Date.parse(startDate))) {
      throw new AppError('Ngày bắt đầu (startDate) không đúng định dạng YYYY-MM-DD', 400);
    }
    if (endDate && isNaN(Date.parse(endDate))) {
      throw new AppError('Ngày kết thúc (endDate) không đúng định dạng YYYY-MM-DD', 400);
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new AppError('Ngày bắt đầu không được lớn hơn ngày kết thúc', 400);
    }
  }
}
