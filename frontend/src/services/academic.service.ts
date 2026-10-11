import { apiClient } from './api';
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
};


export class AcademicService {
  /**
   * Lấy danh sách lớp học theo bộ lọc hoặc courseId
   */
  static async getClasses(
    paramsOrCourseId?:
      | number
      | {
          courseId?: number;
          status?: string;
          scheduleDays?: string;
          search?: string;
        }
  ): Promise<ClassItem[]> {
    let params: Record<string, any> = {};
    if (typeof paramsOrCourseId === 'number') {
      params = { courseId: paramsOrCourseId };
    } else if (paramsOrCourseId) {
      params = paramsOrCourseId;
    }
    const res = await apiClient.get<any>('/classes', { params });
    return res.data?.data || [];
  }

  /**
   * Lấy thông tin chi tiết một lớp học
   */
  static async getClassById(id: number): Promise<ClassItem> {
    const res = await apiClient.get<any>(`/classes/${id}`);
    return res.data?.data;
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
    return res.data?.data;
  }

  /**
   * Cập nhật thông tin lớp học
   */
  static async updateClass(id: number, payload: UpdateClassPayload): Promise<ClassItem> {
    const res = await apiClient.put<any>(`/classes/${id}`, payload);
    return res.data?.data;
  }

  /**
   * Xóa một lớp học
   */
  static async deleteClass(id: number): Promise<void> {
    await apiClient.delete(`/classes/${id}`);
  }

  /**
   * Lấy danh mục tất cả khóa học
   */
  static async getCourses(params?: { isActive?: boolean; search?: string }): Promise<CourseItem[]> {
    const queryParams = { isActive: true, ...params };
    const res = await apiClient.get<any>('/courses', { params: queryParams });
    return res.data?.data || [];
  }

  /**
   * Lấy chi tiết một khóa học
   */
  static async getCourseById(id: number): Promise<CourseItem> {
    const res = await apiClient.get<any>(`/courses/${id}`);
    return res.data?.data;
  }

  /**
   * Tạo mới một khóa học trong danh mục đào tạo
   */
  static async createCourse(payload: CreateCoursePayload): Promise<CourseItem> {
    const res = await apiClient.post<any>('/courses', payload);
    return res.data?.data;
  }

  /**
   * Lấy danh sách hồ sơ học viên đã ghi danh vào lớp
   */
  static async getClassEnrollments(classId: number): Promise<ClassEnrollmentItem[]> {
    const res = await apiClient.get<any>('/enrollments', { params: { classId } });
    return res.data?.data || [];
  }

  /**
   * Lấy danh sách ghi danh theo bộ lọc (toàn hệ thống hoặc theo lớp)
   */
  static async getEnrollments(params?: EnrollmentFilterQuery): Promise<ClassEnrollmentItem[]> {
    const res = await apiClient.get<any>('/enrollments', { params });
    return res.data?.data || [];
  }

  /**
   * Lấy thông tin chi tiết một hồ sơ ghi danh
   */
  static async getEnrollmentById(id: number): Promise<ClassEnrollmentItem> {
    const res = await apiClient.get<any>(`/enrollments/${id}`);
    return res.data?.data;
  }

  /**
   * Thao tác Xếp học viên vào lớp học (sinh mã STU-xxx, kiểm tra khóa sĩ số UC-SYS-02)
   */
  static async enrollStudent(data: EnrollStudentPayload): Promise<ClassEnrollmentItem> {
    const res = await apiClient.post<any>('/enrollments', data);
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
    return res.data?.data;
  }

  /**
   * Lấy danh sách biên lai thu học phí của hồ sơ ghi danh
   */
  static async getPaymentReceipts(enrollmentId: number): Promise<PaymentReceipt[]> {
    const res = await apiClient.get<any>(`/enrollments/${enrollmentId}/receipts`);
    return res.data?.data || [];
  }

  /**
   * Chuyển lớp học cho học viên (kiểm tra sĩ số khả dụng lớp mới)
   */
  static async transferClass(
    enrollmentId: number,
    payload: TransferClassPayload
  ): Promise<ClassEnrollmentItem> {
    const res = await apiClient.post<any>(`/enrollments/${enrollmentId}/transfer`, payload);
    return res.data?.data;
  }
}

