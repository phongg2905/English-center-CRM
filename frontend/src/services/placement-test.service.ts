import { apiClient } from './api';
import type {
  PlacementTestWithDetails,
  PaginatedPlacementTestsResponse,
  PlacementTestFilterQuery,
  BookTestDto,
  UpdateAttendanceDto,
  ShiftSlotAvailability,
  LeadSimple,
} from '../types/placement-test';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export class PlacementTestService {
  /**
   * Lấy danh sách ca thi & thí sinh có phân trang và bộ lọc
   */
  static async getTests(query?: PlacementTestFilterQuery): Promise<PaginatedPlacementTestsResponse> {
    const params = new URLSearchParams();
    if (query?.date) params.append('date', query.date);
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.timeSlot) params.append('timeSlot', query.timeSlot);
    if (query?.room) params.append('room', query.room);
    if (query?.testType) params.append('testType', query.testType);
    if (query?.attendanceStatus) params.append('attendanceStatus', query.attendanceStatus);
    if (query?.search) params.append('search', query.search);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.sortOrder) params.append('sortOrder', query.sortOrder);

    const res = await apiClient.get<ApiResponse<PaginatedPlacementTestsResponse>>(
      `/placement-tests?${params.toString()}`
    );
    return res.data.data;
  }

  /**
   * Lấy ma trận tình trạng sức chứa ca thi (Available slots vs Full)
   */
  static async getAvailability(
    startDate: string,
    endDate: string,
    room?: string
  ): Promise<ShiftSlotAvailability[]> {
    const params = new URLSearchParams({ startDate, endDate });
    if (room) params.append('room', room);

    const res = await apiClient.get<ApiResponse<ShiftSlotAvailability[]>>(
      `/placement-tests/availability?${params.toString()}`
    );
    return res.data.data;
  }

  /**
   * Đặt lịch hẹn test mới cho Lead
   */
  static async bookTest(dto: BookTestDto): Promise<PlacementTestWithDetails> {
    const res = await apiClient.post<ApiResponse<PlacementTestWithDetails>>(
      '/placement-tests/book',
      dto
    );
    return res.data.data;
  }

  /**
   * Cập nhật trạng thái điểm danh một chạm (PRESENT / ABSENT / CANCELLED / SCHEDULED)
   */
  static async updateAttendance(
    id: number,
    dto: UpdateAttendanceDto
  ): Promise<PlacementTestWithDetails> {
    const res = await apiClient.patch<ApiResponse<PlacementTestWithDetails>>(
      `/placement-tests/${id}/attendance`,
      dto
    );
    return res.data.data;
  }

  /**
   * Lấy chi tiết một lịch thi theo ID
   */
  static async getTestById(id: number): Promise<PlacementTestWithDetails> {
    const res = await apiClient.get<ApiResponse<PlacementTestWithDetails>>(
      `/placement-tests/${id}`
    );
    return res.data.data;
  }

  /**
   * Lấy danh sách Leads tiềm năng để chọn trong modal đặt lịch
   */
  static async getAvailableLeads(search?: string): Promise<LeadSimple[]> {
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (search) params.append('search', search);
      const res = await apiClient.get<any>(`/leads?${params.toString()}`);
      
      const leads = res.data?.data?.leads || res.data?.data || [];
      return leads.map((item: any) => ({
        id: item.id,
        fullName: item.fullName || item.name || `Lead #${item.id}`,
        phoneNumber: item.phoneNumber || item.phone || '',
        email: item.email || null,
        status: item.status || item.stage || 'NEW',
        targetSubject: item.targetSubject || item.interestCourse || '',
        assignedTo: item.assignedTo || item.assignedSalesName || null,
      }));
    } catch {
      // Return empty array if leads endpoint has issue or mock fallback
      return [];
    }
  }
}
