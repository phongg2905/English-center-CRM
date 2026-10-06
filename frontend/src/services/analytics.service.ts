/**
 * DỰ ÁN: ENGLISH CENTER CRM (EduFlow CRM)
 * MODULE: BÁO CÁO & THỐNG KÊ (FE-06 / UC-04)
 * TÁC GIẢ: Long Phạm (@longphm11) - Frontend Developer
 */

import { apiClient } from './api';
import type {
  ExecutiveOverview,
  FunnelData,
  RevenueData,
  SalesConsultant,
  MarketingChannel,
  CapacityData,
  ExportReportType,
  ExportFormat,
} from '../types/analytics';

export class AnalyticsService {
  /**
   * Lấy tổng quan các chỉ số điều hành chính (KPI Overview Cards)
   */
  static async getOverview(): Promise<ExecutiveOverview> {
    const res = await apiClient.get('/analytics/overview');
    return res.data.data;
  }

  /**
   * Lấy báo cáo phễu chuyển đổi tuyển sinh (Funnel Analytics)
   */
  static async getFunnel(params?: {
    startDate?: string;
    endDate?: string;
    sourceChannel?: string;
    assignedSalesId?: number;
  }): Promise<FunnelData> {
    const res = await apiClient.get('/analytics/funnel', { params });
    return res.data.data;
  }

  /**
   * Lấy báo cáo doanh thu thực thu theo chu kỳ & phương thức
   */
  static async getRevenue(params?: {
    period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
    startDate?: string;
    endDate?: string;
    paymentMethod?: string;
  }): Promise<RevenueData> {
    const res = await apiClient.get('/analytics/revenue', { params });
    return res.data.data;
  }

  /**
   * Lấy bảng xếp hạng hiệu suất tư vấn viên
   */
  static async getLeaderboard(params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<SalesConsultant[]> {
    const res = await apiClient.get('/analytics/sales-leaderboard', { params });
    return res.data.data;
  }

  /**
   * Lấy báo cáo hiệu quả từng kênh Marketing
   */
  static async getChannelROI(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<MarketingChannel[]> {
    const res = await apiClient.get('/analytics/channel-roi', { params });
    return res.data.data;
  }

  /**
   * Lấy thống kê tỷ lệ lấp đầy phòng học và danh sách lớp học
   */
  static async getClassOccupancy(params?: {
    courseId?: number;
    status?: string;
  }): Promise<CapacityData> {
    const res = await apiClient.get('/analytics/class-occupancy', { params });
    return res.data.data;
  }

  /**
   * Xuất file báo cáo thống kê trực tiếp ra định dạng CSV/Excel hoặc JSON
   */
  static async exportReport(params: {
    type: ExportReportType;
    format?: ExportFormat;
    startDate?: string;
    endDate?: string;
  }): Promise<void> {
    const format = params.format || 'csv';

    if (format === 'csv') {
      const response = await apiClient.get('/analytics/export', {
        params: { ...params, format: 'csv' },
        responseType: 'blob',
      });

      // Tạo Blob và kích hoạt tự động tải file trên trình duyệt
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `report_${params.type}_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else {
      const response = await apiClient.get('/analytics/export', {
        params: { ...params, format: 'json' },
      });
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(response.data.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `report_${params.type}_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  }
}
