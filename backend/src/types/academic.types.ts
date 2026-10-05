/**
 * Định nghĩa Type & Interface cho phân hệ Quản lý Đào tạo, Khóa học, Lớp học, Xếp lớp & Thu học phí (BE-05 / UC-03)
 */

export interface Course {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCourseDto {
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

export interface UpdateCourseDto extends Partial<CreateCourseDto> {}

export type ScheduleDays = 'MON_WED_FRI' | 'TUE_THU_SAT' | 'WEEKEND';
export type ClassStatus = 'PLANNING' | 'OPEN' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED';

export interface ClassModel {
  id: number;
  courseId: number;
  classCode: string;
  className: string;
  scheduleDays: ScheduleDays;
  timeSlot: string;
  room: string | null;
  teacherName: string | null;
  startDate: string; // YYYY-MM-DD
  maxCapacity: number;
  currentEnrolled: number;
  status: ClassStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassWithCourse extends ClassModel {
  courseCode: string;
  courseName: string;
  standardTuition: number;
  targetOutput?: string | null;
  availableSeats: number;
  isFull: boolean;
}

export interface CreateClassDto {
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

export interface UpdateClassDto extends Partial<CreateClassDto> {
  status?: ClassStatus;
}

export interface Student {
  id: number;
  studentCode: string;
  leadId: number | null;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  dateOfBirth: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'FULLY_PAID';
export type EnrollmentStatus = 'ENROLLED' | 'TRANSFERRED' | 'DROPPED' | 'COMPLETED';

export interface Enrollment {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface EnrollmentWithDetails extends Enrollment {
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
}

export interface EnrollStudentDto {
  leadId?: number;
  studentId?: number;
  classId: number;
  discountAmount?: number;
  notes?: string;
  candidateInfo?: {
    fullName: string;
    phoneNumber: string;
    email?: string;
    dateOfBirth?: string;
    address?: string;
  };
}

export interface TransferClassDto {
  newClassId: number;
  reason?: string;
}

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER';

export interface PaymentReceipt {
  id: number;
  enrollmentId: number;
  receiptCode: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference: string | null;
  receiverId: number;
  paidAt: Date;
  notes: string | null;
  receiverName?: string;
}

export interface RecordPaymentDto {
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  notes?: string;
}
