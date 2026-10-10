import { apiClient } from './api';
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
   * Lấy danh sách nhân viên kèm tìm kiếm, bộ lọc vai trò và phân trang
   */
  static async getStaffs(params?: StaffFilterParams): Promise<StaffListResponse> {
    const res = await apiClient.get('/staff', { params });
    return res.data?.data;
  }

  /**
   * Lấy danh sách đội ngũ giảng viên kèm lịch dạy
   */
  static async getTeachers(): Promise<TeacherItem[]> {
    const res = await apiClient.get('/staff/teachers');
    return res.data?.data || [];
  }

  /**
   * Lấy chi tiết thông tin một nhân viên
   */
  static async getStaffById(id: number): Promise<StaffMember> {
    const res = await apiClient.get(`/staff/${id}`);
    return res.data?.data;
  }

  /**
   * Tạo mới tài khoản nhân viên (Admin Only)
   */
  static async createStaff(payload: CreateStaffPayload): Promise<StaffMember> {
    const res = await apiClient.post('/staff', payload);
    return res.data?.data;
  }

  /**
   * Cập nhật thông tin nhân viên
   */
  static async updateStaff(id: number, payload: UpdateStaffPayload): Promise<StaffMember> {
    const res = await apiClient.put(`/staff/${id}`, payload);
    return res.data?.data;
  }

  /**
   * Khóa hoặc mở khóa tài khoản nhân viên
   */
  static async updateStaffStatus(id: number, isActive: boolean): Promise<StaffMember> {
    const res = await apiClient.patch(`/staff/${id}/status`, { isActive });
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
    return res.data?.data;
  }

  /**
   * Xóa tài khoản nhân viên
   */
  static async deleteStaff(id: number): Promise<{ message: string }> {
    const res = await apiClient.delete(`/staff/${id}`);
    return res.data;
  }
}
