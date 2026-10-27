import { apiClient } from './api';
import { dataCache } from '../utils/dataCache';
import type {
  PlacementTestWithDetails,
  PaginatedPlacementTestsResponse,
  PlacementTestFilterQuery,
  BookTestDto,
  UpdateAttendanceDto,
  ShiftSlotAvailability,
  LeadSimple,
  RecordScoreDto,
  CourseRecommendation,
} from '../types/placement-test';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export class PlacementTestService {
  /**
   * Lấy danh sách ca thi & thí sinh có phân trang và bộ lọc (có hỗ trợ Smart Cache)
   */
  static async getTests(
    query?: PlacementTestFilterQuery,
    options?: { forceRefresh?: boolean }
  ): Promise<PaginatedPlacementTestsResponse> {
    const key = dataCache.buildKey('tests:list', query || {});
    return dataCache.getOrFetch(
      key,
      async () => {
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

        const res = await apiClient.get<any>(`/placement-tests?${params.toString()}`);
        const data = res.data?.data;
        const meta = res.data?.meta;

        if (Array.isArray(data)) {
          return {
            tests: data,
            total: meta?.total ?? data.length,
            page: meta?.page ?? 1,
            limit: meta?.limit ?? data.length,
            totalPages: meta?.totalPages ?? 1,
          };
        }

        if (data?.tests && Array.isArray(data.tests)) {
          return data;
        }

        return {
          tests: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 1,
        };
      },
      { forceRefresh: options?.forceRefresh }
    );
  }

  static peekTests(query?: PlacementTestFilterQuery): PaginatedPlacementTestsResponse | undefined {
    return dataCache.peek<PaginatedPlacementTestsResponse>(
      dataCache.buildKey('tests:list', query || {})
    );
  }

  /**
   * Lấy ma trận tình trạng sức chứa ca thi (Available slots vs Full)
   */
  static async getAvailability(
    startDate: string,
    endDate: string,
    room?: string,
    options?: { forceRefresh?: boolean }
  ): Promise<ShiftSlotAvailability[]> {
    const key = dataCache.buildKey('tests:availability', { startDate, endDate, room });
    return dataCache.getOrFetch(
      key,
      async () => {
        const params = new URLSearchParams({ startDate, endDate });
        if (room) params.append('room', room);

        const res = await apiClient.get<ApiResponse<ShiftSlotAvailability[]>>(
          `/placement-tests/availability?${params.toString()}`
        );
        return res.data.data;
      },
      { forceRefresh: options?.forceRefresh }
    );
  }

  /**
   * Đặt lịch hẹn test mới cho Lead
   */
  static async bookTest(dto: BookTestDto): Promise<PlacementTestWithDetails> {
    const res = await apiClient.post<ApiResponse<PlacementTestWithDetails>>(
      '/placement-tests/book',
      dto
    );
    dataCache.invalidateMany(['tests', 'leads', 'analytics', 'audit-logs']);
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
    dataCache.invalidateMany(['tests', 'leads', 'analytics', 'audit-logs']);
    return res.data.data;
  }

  /**
   * Lấy chi tiết một lịch thi theo ID
   */
  static async getTestById(
    id: number,
    options?: { forceRefresh?: boolean }
  ): Promise<PlacementTestWithDetails> {
    const key = dataCache.buildKey('tests:detail', id);
    return dataCache.getOrFetch(
      key,
      async () => {
        const res = await apiClient.get<ApiResponse<PlacementTestWithDetails>>(
          `/placement-tests/${id}`
        );
        return res.data.data;
      },
      { forceRefresh: options?.forceRefresh }
    );
  }

  /**
   * Lấy danh sách Leads tiềm năng để chọn trong modal đặt lịch
   */
  static async getAvailableLeads(search?: string): Promise<LeadSimple[]> {
    const key = dataCache.buildKey('leads:available-for-test', { search });
    return dataCache.getOrFetch(key, async () => {
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
          status: item.pipelineStage || item.status || item.stage || 'NEW',
          targetSubject: item.interest || item.targetSubject || item.interestCourse || '',
          assignedTo: item.assignedSalesName || item.assignedTo || null,
        }));
      } catch {
        return [];
      }
    });
  }

  /**
   * Tạo nhanh Lead mới từ thông tin nhập trực tiếp
   */
  static async createLead(data: {
    fullName: string;
    phoneNumber: string;
    email?: string;
    interest?: string;
  }): Promise<LeadSimple> {
    const res = await apiClient.post<any>('/leads', {
      fullName: data.fullName.trim(),
      phoneNumber: data.phoneNumber.trim(),
      email: data.email?.trim() || undefined,
      interest: data.interest || 'IELTS',
      sourceChannel: 'WALK_IN',
      notes: 'Thí sinh đăng ký trực tiếp lịch thi Placement Test',
    });
    dataCache.invalidateMany(['leads', 'analytics', 'audit-logs']);
    const created = res.data?.data;
    return {
      id: created.id,
      fullName: created.fullName,
      phoneNumber: created.phoneNumber,
      email: created.email || null,
      status: created.pipelineStage || 'NEW',
    };
  }

  /**
   * Xóa hoàn toàn một thí sinh khỏi ca thi
   */
  static async deleteTest(id: number): Promise<void> {
    await apiClient.delete(`/placement-tests/${id}`);
    dataCache.invalidateMany(['tests', 'leads', 'analytics', 'audit-logs']);
  }

  /**
   * Hủy và xóa toàn bộ một ca thi theo Ngày, Khung giờ và Phòng
   */
  static async deleteShift(
    date: string,
    timeSlot: string,
    room?: string
  ): Promise<{ count: number }> {
    const params = new URLSearchParams({ date, timeSlot });
    if (room && room !== 'ALL') params.append('room', room);
    const res = await apiClient.delete<ApiResponse<{ count: number }>>(
      `/placement-tests/shift/cancel?${params.toString()}`
    );
    dataCache.invalidateMany(['tests', 'leads', 'analytics', 'audit-logs']);
    return res.data.data;
  }

  /**
   * Nhập điểm 4 kỹ năng & nhận đề xuất khóa học phù hợp (UC-SYS-03)
   */
  static async recordScore(
    id: number,
    data: RecordScoreDto
  ): Promise<{ test: PlacementTestWithDetails; recommendation: CourseRecommendation }> {
    const res = await apiClient.post<
      ApiResponse<{ test: PlacementTestWithDetails; recommendation: CourseRecommendation }>
    >(`/placement-tests/${id}/score`, data);
    dataCache.invalidateMany(['tests', 'leads', 'analytics', 'audit-logs']);
    return res.data.data;
  }

  /**
   * Thuật toán độc lập gợi ý khóa học theo điểm thi và nguyện vọng
   */
  static async recommendCourse(
    overallScore: number,
    testType?: string,
    interest?: string
  ): Promise<CourseRecommendation> {
    const key = dataCache.buildKey('tests:recommend', { overallScore, testType, interest });
    return dataCache.getOrFetch(key, async () => {
      const params = new URLSearchParams({ overallScore: overallScore.toString() });
      if (testType) params.append('testType', testType);
      if (interest) params.append('interest', interest);
      const res = await apiClient.get<ApiResponse<CourseRecommendation>>(
        `/placement-tests/recommend-course?${params.toString()}`
      );
      return res.data.data;
    });
  }

  static invalidateCache(): void {
    dataCache.invalidate('tests');
  }
}
