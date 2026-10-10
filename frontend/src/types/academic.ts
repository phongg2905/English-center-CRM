/**
 * Academic & Course/Class Management Types for Frontend (FE-05A)
 */

export type ScheduleDays = 'MON_WED_FRI' | 'TUE_THU_SAT' | 'WEEKEND';
export type ClassStatus = 'PLANNING' | 'OPEN' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ClassItem {
  id: number;
  courseId: number;
  classCode: string;
  className: string;
  scheduleDays: ScheduleDays;
  timeSlot: string;
  room: string | null;
  teacherName: string | null;
  startDate: string;
  maxCapacity: number;
  currentEnrolled: number;
  availableSeats: number;
  isFull: boolean;
  status: ClassStatus;
  courseCode: string;
  courseName: string;
  standardTuition: number;
  targetOutput?: string | null;
  createdAt?: string;
  updatedAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCoursePayload {
  courseCode: string;
  courseName: string;
  totalLessons: number;
  standardTuition: number;
  minEntryScore?: number | null;
  maxEntryScore?: number | null;
  targetOutput?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateClassPayload {
  courseId: number;
  classCode: string;
  className: string;
  scheduleDays: ScheduleDays;
  timeSlot: string;
  room?: string | null;
  teacherName?: string | null;
  startDate: string;
  maxCapacity?: number;
}

export interface UpdateClassPayload {
  courseId?: number;
  classCode?: string;
  className?: string;
  scheduleDays?: ScheduleDays;
  timeSlot?: string;
  room?: string | null;
  teacherName?: string | null;
  startDate?: string;
  maxCapacity?: number;
  status?: ClassStatus;
}

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'FULLY_PAID';
export type EnrollmentStatus = 'ENROLLED' | 'TRANSFERRED' | 'DROPPED' | 'COMPLETED';

export interface ClassEnrollmentItem {
  id: number;
  studentId: number;
  classId: number;
  consultantId: number | null;
  enrollmentDate: string;
  originalTuition: number;
  discountAmount: number;
  finalAmount: number;
  paymentStatus: PaymentStatus;
  status: EnrollmentStatus;
  notes: string | null;
  studentCode: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  classCode: string;
  className: string;
  courseId: number;
  courseCode: string;
  courseName: string;
  consultantName: string | null;
  paidAmount: number;
  balanceDue: number;
  createdAt: string;
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

export interface ClassAvailability {
  classId: number;
  className: string;
  classCode: string;
  currentEnrolled: number;
  maxCapacity: number;
  availableSeats: number;
  isFull: boolean;
  status: ClassStatus;
}
