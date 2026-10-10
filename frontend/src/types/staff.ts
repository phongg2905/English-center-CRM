export type StaffRole = 'ADMIN' | 'SALES' | 'ACADEMIC' | 'TEACHER';

export interface TeacherAssignedClass {
  id: number;
  classCode: string;
  className: string;
  courseName: string;
  scheduleDays: string;
  timeSlot: string;
  room?: string;
  status: string;
  currentEnrolled: number;
  maxCapacity: number;
  startDate: string;
}

export interface StaffMember {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  roleId: number;
  roleCode: StaffRole;
  roleName: string;
  avatarUrl?: string;
  isActive: boolean;
  specialization?: string;
  isNative?: boolean;
  bio?: string;
  assignedClassesCount: number;
  assignedClasses?: TeacherAssignedClass[];
  createdAt: string;
  updatedAt: string;
}

export interface TeacherItem {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  isActive: boolean;
  specialization?: string;
  isNative: boolean;
  bio?: string;
  assignedClassesCount: number;
  assignedClasses: TeacherAssignedClass[];
}

export interface StaffPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StaffRoleSummary {
  total: number;
  salesCount: number;
  academicCount: number;
  teacherCount: number;
  adminCount: number;
}

export interface StaffListResponse {
  staffs: StaffMember[];
  pagination: StaffPagination;
  summary?: StaffRoleSummary;
}

export interface StaffFilterParams {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreateStaffPayload {
  username: string;
  password?: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  roleCode: StaffRole;
  avatarUrl?: string;
  specialization?: string;
  isNative?: boolean;
  bio?: string;
}

export interface UpdateStaffPayload {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  roleCode?: StaffRole;
  avatarUrl?: string;
  specialization?: string;
  isNative?: boolean;
  bio?: string;
}
