import { apiClient } from './api';
import { dataCache } from '../utils/dataCache';

export type AuditModule =
  | 'AUTH'
  | 'LEADS'
  | 'TESTS'
  | 'CLASSES'
  | 'COURSES'
  | 'STUDENTS'
  | 'PAYMENTS'
  | 'STAFF'
  | 'SETTINGS';

export type AuditAction =
  | 'LOGIN'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'STATUS_CHANGE'
  | 'ENROLL'
  | 'PAYMENT'
  | 'TRANSFER'
  | 'SCORE'
  | 'BOOK_TEST';

export interface AuditLogItem {
  id: number;
  userId: number | null;
  username: string;
  userFullName: string;
  userRole: string;
  action: AuditAction;
  module: AuditModule;
  targetId: string | null;
  targetLabel: string | null;
  description: string;
  ipAddress: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export interface AuditLogFilterParams {
  module?: string;
  action?: string;
  userRole?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogListResponse {
  logs: AuditLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalLogs: number;
    todayLogs: number;
    byModule: Record<string, number>;
    byAction: Record<string, number>;
  };
}

export class AuditLogService {
  static async getLogs(
    params?: AuditLogFilterParams,
    options?: { forceRefresh?: boolean }
  ): Promise<AuditLogListResponse> {
    const key = dataCache.buildKey('audit-logs', params || {});
    return dataCache.getOrFetch(
      key,
      async () => {
        const res = await apiClient.get<{ success: boolean; data: AuditLogListResponse }>(
          '/audit-logs',
          { params }
        );
        return res.data.data;
      },
      { ttlMs: 30 * 1000, forceRefresh: options?.forceRefresh }
    );
  }

  static peekLogs(params?: AuditLogFilterParams): AuditLogListResponse | undefined {
    return dataCache.peek<AuditLogListResponse>(
      dataCache.buildKey('audit-logs', params || {}),
      30 * 1000
    );
  }

  static invalidateCache(): void {
    dataCache.invalidate('audit-logs');
  }
}

