import { apiClient } from './api';
import { dataCache } from '../utils/dataCache';
import type {
  ClassItem,
  CourseItem,
  CreateCoursePayload,
  CreateClassPayload,
  UpdateClassPayload,
  ClassEnrollmentItem,
  EnrollmentResult,
  ClassAvailability,
  PaymentReceipt,
  RecordPaymentPayload,
  TransferClassPayload,
  EnrollStudentPayload,
  EnrollmentFilterQuery,
  EnrollmentStatus,
} from '../types/academic';

export type {
  ClassItem,
  CourseItem,
  CreateCoursePayload,
  CreateClassPayload,
  UpdateClassPayload,
  ClassEnrollmentItem,
  EnrollmentResult,
  ClassAvailability,
  PaymentReceipt,
  RecordPaymentPayload,
  TransferClassPayload,
  EnrollStudentPayload,
  EnrollmentFilterQuery,
  EnrollmentStatus,
};

export class AcademicService {
  /**
   * Lấy danh sách lớp học theo bộ lọc hoặc courseId (có hỗ trợ Smart Cache)
   */
  static async getClasses(
    paramsOrCourseId?:
      | number
      | {
          courseId?: number;
          status?: string;
          scheduleDays?: string;
          search?: string;
        },
    options?: { forceRefresh?: boolean }
  ): Promise<ClassItem[]> {
    let params: Record<string, any> = {};
    if (typeof paramsOrCourseId === 'number') {
      params = { courseId: paramsOrCourseId };
    } else if (paramsOrCourseId) {
      params = paramsOrCourseId;
    }
    const key = dataCache.buildKey('classes:list', params);
    return dataCache.getOrFetch(
      key,
      async () => {
        const res = await apiClient.get<any>('/classes', { params });
        return res.data?.data || [];
      },
      { forceRefresh: options?.forceRefresh }
    );
  }

  /**
   * Đọc nhanh danh sách lớp học từ cache (đồng bộ)
   */
  static peekClasses(
    params?: {
      courseId?: number;
      status?: string;
      scheduleDays?: string;
      search?: string;
    }
  ): ClassItem[] | undefined {
    const key = dataCache.buildKey('classes:list', params || {});
    return dataCache.peek<ClassItem[]>(key);
  }

  /**
   * Lấy thông tin chi tiết một lớp học
   */
  static async getClassById(id: number, options?: { forceRefresh?: boolean }): Promise<ClassItem> {
    const key = dataCache.buildKey('classes:detail', id);
    return dataCache.getOrFetch(
      key,
      async () => {
        const res = await apiClient.get<any>(`/classes/${id}`);
        return res.data?.data;
      },
      { forceRefresh: options?.forceRefresh }
    );
  }

  /**
   * Kiểm tra sĩ số khả dụng & trạng thái tự khóa ghi danh của lớp học (UC-SYS-02)
   */
  static async checkAvailability(id: number): Promise<ClassAvailability> {
    const res = await apiClient.get<any>(`/classes/${id}/availability`);
    return res.data?.data;
  }

  /**
   * Mở lớp học mới (phân bổ phòng, giờ học và chọn giáo viên phụ trách)
   */
  static async createClass(payload: CreateClassPayload): Promise<ClassItem> {
    const res = await apiClient.post<any>('/classes', payload);
    dataCache.invalidateMany(['classes', 'analytics', 'staff:teachers', 'audit-logs']);
    return res.data?.data;
  }

  /**
   * Cập nhật thông tin lớp học
   */
  static async updateClass(id: number, payload: UpdateClassPayload): Promise<ClassItem> {
    const res = await apiClient.put<any>(`/classes/${id}`, payload);
    dataCache.invalidateMany(['classes', 'enrollments', 'analytics', 'staff:teachers', 'audit-logs']);
    return res.data?.data;
  }

  /**
   * Xóa một lớp học
   */
  static async deleteClass(id: number): Promise<void> {
    await apiClient.delete(`/classes/${id}`);
    dataCache.invalidateMany(['classes', 'enrollments', 'analytics', 'staff:teachers', 'audit-logs']);
  }

  /**
   * Lấy danh mục tất cả khóa học (có hỗ trợ Smart Cache)
   */
  static async getCourses(
    params?: { isActive?: boolean; search?: string },
    options?: { forceRefresh?: boolean }
  ): Promise<CourseItem[]> {
    const queryParams = { isActive: true, ...params };
    const key = dataCache.buildKey('courses:list', queryParams);
    return dataCache.getOrFetch(
      key,
      async () => {
        const res = await apiClient.get<any>('/courses', { params: queryParams });
        return res.data?.data || [];
      },
      { forceRefresh: options?.forceRefresh }
    );
  }

  static peekCourses(params?: { isActive?: boolean; search?: string }): CourseItem[] | undefined {
    const queryParams = { isActive: true, ...params };
    return dataCache.peek<CourseItem[]>(dataCache.buildKey('courses:list', queryParams));
  }

  /**
   * Lấy chi tiết một khóa học
   */
  static async getCourseById(id: number): Promise<CourseItem> {
    const key = dataCache.buildKey('courses:detail', id);
    return dataCache.getOrFetch(key, async () => {
      const res = await apiClient.get<any>(`/courses/${id}`);
      return res.data?.data;
    });
  }

  /**
   * Tạo mới một khóa học trong danh mục đào tạo
   */
  static async createCourse(payload: CreateCoursePayload): Promise<CourseItem> {
    const res = await apiClient.post<any>('/courses', payload);
    dataCache.invalidateMany(['courses', 'classes', 'analytics', 'audit-logs']);
    return res.data?.data;
  }

  /**
   * Cập nhật thông tin một khóa học đào tạo
   */
  static async updateCourse(id: number, payload: Partial<CreateCoursePayload>): Promise<CourseItem> {
    const res = await apiClient.put<any>(`/courses/${id}`, payload);
    dataCache.invalidateMany(['courses', 'classes', 'analytics', 'audit-logs']);
    return res.data?.data;
  }

  /**
   * Xóa một khóa học khỏi danh mục đào tạo (Admin Only)
   */
  static async deleteCourse(id: number): Promise<void> {
    await apiClient.delete(`/courses/${id}`);
    dataCache.invalidateMany(['courses', 'classes', 'analytics', 'audit-logs']);
  }

  /**
   * Lấy danh sách hồ sơ học viên đã ghi danh vào lớp (có hỗ trợ Smart Cache)
   */
  static async getClassEnrollments(
    classId: number,
    options?: { forceRefresh?: boolean }
  ): Promise<ClassEnrollmentItem[]> {
    const key = dataCache.buildKey('enrollments:class', classId);
    return dataCache.getOrFetch(
      key,
      async () => {
        const res = await apiClient.get<any>('/enrollments', { params: { classId } });
        return res.data?.data || [];
      },
      { forceRefresh: options?.forceRefresh }
    );
  }

  static peekClassEnrollments(classId: number): ClassEnrollmentItem[] | undefined {
    return dataCache.peek<ClassEnrollmentItem[]>(dataCache.buildKey('enrollments:class', classId));
  }

  /**
   * Lấy danh sách ghi danh theo bộ lọc (toàn hệ thống hoặc theo lớp)
   */
  static async getEnrollments(
    params?: EnrollmentFilterQuery,
    options?: { forceRefresh?: boolean }
  ): Promise<ClassEnrollmentItem[]> {
    const key = dataCache.buildKey('enrollments:list', params || {});
    return dataCache.getOrFetch(
      key,
      async () => {
        const res = await apiClient.get<any>('/enrollments', { params });
        return res.data?.data || [];
      },
      { forceRefresh: options?.forceRefresh }
    );
  }

  static peekEnrollments(params?: EnrollmentFilterQuery): ClassEnrollmentItem[] | undefined {
    return dataCache.peek<ClassEnrollmentItem[]>(dataCache.buildKey('enrollments:list', params || {}));
  }

  /**
   * Lấy thông tin chi tiết một hồ sơ ghi danh
   */
  static async getEnrollmentById(id: number): Promise<ClassEnrollmentItem> {
    const key = dataCache.buildKey('enrollments:detail', id);
    return dataCache.getOrFetch(key, async () => {
      const res = await apiClient.get<any>(`/enrollments/${id}`);
      return res.data?.data;
    });
  }

  /**
   * Thao tác Xếp học viên vào lớp học (sinh mã STU-xxx, kiểm tra khóa sĩ số UC-SYS-02)
   */
  static async enrollStudent(data: EnrollStudentPayload): Promise<ClassEnrollmentItem> {
    const res = await apiClient.post<any>('/enrollments', data);
    dataCache.invalidateMany(['enrollments', 'classes', 'leads', 'analytics', 'audit-logs']);
    return res.data?.data;
  }

  /**
   * Ghi nhận thanh toán học phí & cấp biên lai (REC-xxx)
   */
  static async recordPayment(
    enrollmentId: number,
    payload: RecordPaymentPayload
  ): Promise<{ receipt: PaymentReceipt; enrollment: ClassEnrollmentItem }> {
    const res = await apiClient.post<any>(`/enrollments/${enrollmentId}/payments`, payload);
    dataCache.invalidateMany(['enrollments', 'receipts', 'analytics', 'audit-logs']);
    return res.data?.data;
  }

  /**
   * Lấy danh sách biên lai thu học phí của hồ sơ ghi danh
   */
  static async getPaymentReceipts(
    enrollmentId: number,
    options?: { forceRefresh?: boolean }
  ): Promise<PaymentReceipt[]> {
    const key = dataCache.buildKey('receipts:enrollment', enrollmentId);
    return dataCache.getOrFetch(
      key,
      async () => {
        const res = await apiClient.get<any>(`/enrollments/${enrollmentId}/receipts`);
        return res.data?.data || [];
      },
      { forceRefresh: options?.forceRefresh }
    );
  }

  /**
   * Chuyển lớp học cho học viên (kiểm tra sĩ số khả dụng lớp mới)
   */
  static async transferClass(
    enrollmentId: number,
    payload: TransferClassPayload
  ): Promise<ClassEnrollmentItem> {
    const res = await apiClient.post<any>(`/enrollments/${enrollmentId}/transfer`, payload);
    dataCache.invalidateMany(['enrollments', 'classes', 'analytics', 'audit-logs']);
    return res.data?.data;
  }

  /**
   * Cập nhật trạng thái đào tạo của học viên (ENROLLED | TRANSFERRED | DROPPED | COMPLETED)
   */
  static async updateEnrollmentStatus(
    enrollmentId: number,
    status: EnrollmentStatus,
    notes?: string
  ): Promise<ClassEnrollmentItem> {
    const res = await apiClient.patch<any>(`/enrollments/${enrollmentId}/status`, {
      status,
      notes,
    });
    dataCache.invalidateMany(['enrollments', 'classes', 'analytics', 'audit-logs']);
    return res.data?.data;
  }

  static invalidateCache(): void {
    dataCache.invalidateMany(['classes', 'courses', 'enrollments', 'receipts']);
  }
}
