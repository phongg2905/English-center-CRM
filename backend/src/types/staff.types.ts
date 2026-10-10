import { RoleCode, User } from './auth.types.js';

export interface StaffFilterDto {
  search?: string;
  roleCode?: RoleCode;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'full_name' | 'username';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateStaffDto {
  username: string;
  password?: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  roleCode: RoleCode;
  avatarUrl?: string;
  specialization?: string;
  isNative?: boolean;
  bio?: string;
}

export interface UpdateStaffDto {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  roleCode?: RoleCode;
  avatarUrl?: string;
  specialization?: string;
  isNative?: boolean;
  bio?: string;
}

export interface UpdateStaffStatusDto {
  isActive: boolean;
}

export interface ResetStaffPasswordDto {
  newPassword?: string;
}

export interface StaffListItem {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  roleId: number;
  roleCode: RoleCode;
  roleName: string;
  avatarUrl?: string;
  isActive: boolean;
  specialization?: string;
  isNative?: boolean;
  assignedClassesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

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

export interface TeacherListItem {
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

export interface StaffRoleSummary {
  total: number;
  salesCount: number;
  academicCount: number;
  teacherCount: number;
  adminCount: number;
}

export interface StaffListResponse {
  staffs: StaffListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary?: StaffRoleSummary;
}

