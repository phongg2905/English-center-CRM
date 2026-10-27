import { apiClient } from './api';
import { dataCache } from '../utils/dataCache';
import type {
  StaffMember,
  TeacherItem,
  StaffListResponse,
  StaffFilterParams,
  CreateStaffPayload,
  UpdateStaffPayload,
} from '../types/staff';

export class StaffService {
  /**
   * Lấy danh sách nhân viên kèm tìm kiếm, bộ lọc vai trò và phân trang (có hỗ trợ Smart Cache)
   */
  static async getStaffs(
    params?: StaffFilterParams,
    options?: { forceRefresh?: boolean }
  ): Promise<StaffListResponse> {
    const key = dataCache.buildKey('staff:list', params || {});
    return dataCache.getOrFetch(
      key,
      async () => {
        const res = await apiClient.get('/staff', { params });
        return res.data?.data;
      },
      { forceRefresh: options?.forceRefresh }
    );
  }

  static peekStaffs(params?: StaffFilterParams): StaffListResponse | undefined {
    return dataCache.peek<StaffListResponse>(dataCache.buildKey('staff:list', params || {}));
  }

  /**
   * Lấy danh sách đội ngũ giảng viên kèm lịch dạy
   */
  static async getTeachers(options?: { forceRefresh?: boolean }): Promise<TeacherItem[]> {
    return dataCache.getOrFetch(
      'staff:teachers',
      async () => {
        const res = await apiClient.get('/staff/teachers');
        return res.data?.data || [];
      },
      { forceRefresh: options?.forceRefresh }
    );
  }

  static peekTeachers(): TeacherItem[] | undefined {
    return dataCache.peek<TeacherItem[]>('staff:teachers');
  }

  /**
   * Lấy danh sách chuyên viên tư vấn (SALES) đang hoạt động
   */
  static async getConsultants(options?: { forceRefresh?: boolean }): Promise<StaffMember[]> {
    return dataCache.getOrFetch(
      'staff:consultants',
      async () => {
        const res = await apiClient.get('/staff/consultants');
        return res.data?.data || [];
      },
      { forceRefresh: options?.forceRefresh }
    );
  }

  /**
   * Lấy chi tiết thông tin một nhân viên
   */
  static async getStaffById(id: number): Promise<StaffMember> {
    const key = dataCache.buildKey('staff:detail', id);
    return dataCache.getOrFetch(key, async () => {
      const res = await apiClient.get(`/staff/${id}`);
      return res.data?.data;
    });
  }

  /**
   * Tạo mới tài khoản nhân viên (Admin Only)
   */
  static async createStaff(payload: CreateStaffPayload): Promise<StaffMember> {
    const res = await apiClient.post('/staff', payload);
    dataCache.invalidateMany(['staff', 'audit-logs']);
    return res.data?.data;
  }

  /**
   * Cập nhật thông tin nhân viên
   */
  static async updateStaff(id: number, payload: UpdateStaffPayload): Promise<StaffMember> {
    const res = await apiClient.put(`/staff/${id}`, payload);
    dataCache.invalidateMany(['staff', 'classes', 'audit-logs']);
    return res.data?.data;
  }

  /**
   * Khóa hoặc mở khóa tài khoản nhân viên
   */
  static async updateStaffStatus(id: number, isActive: boolean): Promise<StaffMember> {
    const res = await apiClient.patch(`/staff/${id}/status`, { isActive });
    dataCache.invalidateMany(['staff', 'audit-logs']);
    return res.data?.data;
  }

  /**
   * Đặt lại mật khẩu tạm thời cho nhân viên
   */
  static async resetPassword(
    id: number,
    newPassword?: string
  ): Promise<{ message: string; temporaryPassword?: string }> {
    const res = await apiClient.post(`/staff/${id}/reset-password`, { newPassword });
    dataCache.invalidate('audit-logs');
    return res.data?.data;
  }

  /**
   * Xóa tài khoản nhân viên
   */
  static async deleteStaff(id: number): Promise<{ message: string }> {
    const res = await apiClient.delete(`/staff/${id}`);
    dataCache.invalidateMany(['staff', 'audit-logs']);
    return res.data;
  }

  static invalidateCache(): void {
    dataCache.invalidate('staff');
  }
}
