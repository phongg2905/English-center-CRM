import { apiClient } from './api';
import { dataCache } from '../utils/dataCache';

export interface SystemSettingsData {
  id?: number;
  centerName: string;
  slogan: string;
  centerCode: string;
  hotline: string;
  email: string;
  address: string;
  website: string;
  workingHours: string;
  logoUrl?: string | null;
  ieltsMinScore: string;
  toeicMinScore: string;
  slaLeadMinutes: number;
  maxClassCapacity: number;
  occupancyWarningRate: number;
  autoAssignLeads: boolean;
  autoSendPlacementResult: boolean;
  currency?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  receiptPrefix?: string;
  autoGenerateReceipt?: boolean;
  allowPartialPayment?: boolean;
  enableSmsPlacementReminder?: boolean;
  enableZnsNotification?: boolean;
  enableEmailTuitionReminder?: boolean;
  enableGoogleCalendarSync?: boolean;
  reminderBeforeHours?: number;
  sessionTimeoutHours: number;
  requireTwoFactorForAdmin: boolean;
  autoBackupDaily: boolean;
  updatedAt?: string;
}

export class SettingsService {
  /**
   * Lấy cấu hình hệ thống từ Backend / Database (có hỗ trợ Smart Cache)
   */
  static async getSettings(options?: { forceRefresh?: boolean }): Promise<SystemSettingsData> {
    return dataCache.getOrFetch(
      'settings:system',
      async () => {
        const res = await apiClient.get<{ success: boolean; data: SystemSettingsData }>(
          '/settings'
        );
        return res.data.data;
      },
      { forceRefresh: options?.forceRefresh }
    );
  }

  static peekSettings(): SystemSettingsData | undefined {
    return dataCache.peek<SystemSettingsData>('settings:system');
  }

  /**
   * Cập nhật cấu hình hệ thống
   */
  static async updateSettings(data: Partial<SystemSettingsData>): Promise<SystemSettingsData> {
    const res = await apiClient.put<{ success: boolean; data: SystemSettingsData }>(
      '/settings',
      data
    );
    dataCache.set('settings:system', res.data.data);
    dataCache.invalidate('audit-logs');
    return res.data.data;
  }
}
