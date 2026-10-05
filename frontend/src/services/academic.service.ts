import { apiClient } from './api';

export interface ClassItem {
  id: number;
  courseId: number;
  classCode: string;
  className: string;
  scheduleDays: string;
  timeSlot: string;
  room: string | null;
  teacherName: string | null;
  startDate: string;
  maxCapacity: number;
  currentEnrolled: number;
  availableSeats: number;
  isFull: boolean;
  status: string;
  courseCode: string;
  courseName: string;
  standardTuition: number;
  targetOutput?: string | null;
}

export interface CourseItem {
  id: number;
  courseCode: string;
  courseName: string;
  totalLessons: number;
  standardTuition: number;
  minEntryScore: number | null;
  maxEntryScore: number | null;
  targetOutput: string | null;
  description: string | null;
  isActive: boolean;
}

export interface EnrollmentResult {
  id: number;
  studentId: number;
  studentCode: string;
  fullName: string;
  classId: number;
  classCode: string;
  className: string;
  finalAmount: number;
  paymentStatus: string;
  status: string;
}

export class AcademicService {
  /**
   * Lấy danh sách lớp học theo Khóa học hoặc tất cả
   */
  static async getClasses(courseId?: number): Promise<ClassItem[]> {
    const params = new URLSearchParams();
    if (courseId) params.append('courseId', courseId.toString());
    const res = await apiClient.get<any>(`/classes?${params.toString()}`);
    return res.data?.data || [];
  }

  /**
   * Lấy danh mục tất cả khóa học
   */
  static async getCourses(): Promise<CourseItem[]> {
    const res = await apiClient.get<any>('/courses?isActive=true');
    return res.data?.data || [];
  }

  /**
   * Thao tác một chạm: Xếp học viên vào lớp học
   */
  static async enrollStudent(data: {
    leadId?: number;
    studentId?: number;
    classId: number;
    discountAmount?: number;
    notes?: string;
  }): Promise<EnrollmentResult> {
    const res = await apiClient.post<any>('/enrollments', data);
    return res.data?.data;
  }
}
