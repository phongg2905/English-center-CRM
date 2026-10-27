import type { UserRole } from '../types/auth';

/**
 * Ma trận phân quyền theo tuyến đường (Route Permissions Matrix)
 * Định nghĩa danh sách các vai trò được phép truy cập từng màn hình trong ứng dụng.
 */
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  // Bảng điều khiển tổng quan
  dashboard: ['ADMIN', 'SALES', 'ACADEMIC', 'TEACHER'],

  // Quản lý Khách hàng tiềm năng & Tuyển sinh
  leads: ['ADMIN', 'SALES', 'ACADEMIC'],

  // Khảo thí & Lịch thi Placement Test
  tests: ['ADMIN', 'SALES', 'ACADEMIC', 'TEACHER'],

  // Quản lý Học viên & Ghi danh
  students: ['ADMIN', 'SALES', 'ACADEMIC', 'TEACHER'],

  // Quản lý Lớp học & Khóa học đào tạo
  classes: ['ADMIN', 'SALES', 'ACADEMIC', 'TEACHER'],

  // Báo cáo & Thống kê số liệu
  reports: ['ADMIN', 'SALES', 'ACADEMIC'],

  // Quản lý Tài khoản Nhân sự & Giảng viên (Admin Only)
  staff: ['ADMIN'],

  // Cấu hình trung tâm & Thiết lập hệ thống (Admin Only)
  settings: ['ADMIN'],

  // Hồ sơ cá nhân người dùng (All Authenticated Staff)
  profile: ['ADMIN', 'SALES', 'ACADEMIC', 'TEACHER'],
};

/**
 * Ma trận phân quyền theo hành động cụ thể (Action Permissions Matrix)
 * Kiểm soát quyền thao tác trên từng nút bấm, modal và tính năng nhạy cảm.
 */
export const ACTION_PERMISSIONS = {
  // Khảo thí
  TEST_SCORE: ['ADMIN', 'ACADEMIC'] as UserRole[],
  TEST_CANCEL_SHIFT: ['ADMIN', 'ACADEMIC'] as UserRole[],
  TEST_DELETE_CANDIDATE: ['ADMIN', 'ACADEMIC'] as UserRole[],

  // Khóa học & Lớp học
  COURSE_CREATE: ['ADMIN', 'ACADEMIC'] as UserRole[],
  COURSE_EDIT: ['ADMIN', 'ACADEMIC'] as UserRole[],
  COURSE_DELETE: ['ADMIN', 'ACADEMIC'] as UserRole[],
  CLASS_CREATE: ['ADMIN', 'ACADEMIC'] as UserRole[],
  CLASS_EDIT: ['ADMIN', 'ACADEMIC'] as UserRole[],
  CLASS_DELETE: ['ADMIN', 'ACADEMIC'] as UserRole[],
  CLASS_TRANSFER: ['ADMIN', 'ACADEMIC'] as UserRole[],

  // Ghi danh & Học phí
  ENROLL_STUDENT: ['ADMIN', 'SALES', 'ACADEMIC'] as UserRole[],
  RECORD_PAYMENT: ['ADMIN', 'SALES', 'ACADEMIC'] as UserRole[],

  // Tuyển sinh & Lead
  LEAD_CREATE: ['ADMIN', 'SALES'] as UserRole[],
  LEAD_EDIT: ['ADMIN', 'SALES'] as UserRole[],
  LEAD_ASSIGN: ['ADMIN', 'SALES'] as UserRole[],
  LEAD_DELETE: ['ADMIN'] as UserRole[],

  // Báo cáo & Tài chính
  REVENUE_REPORT: ['ADMIN', 'ACADEMIC'] as UserRole[],
  EXPORT_REPORT: ['ADMIN', 'ACADEMIC'] as UserRole[],

  // Quản trị Nhân sự
  STAFF_MANAGE: ['ADMIN'] as UserRole[],
  STAFF_RESET_PASSWORD: ['ADMIN'] as UserRole[],
  STAFF_UPDATE_STATUS: ['ADMIN'] as UserRole[],
};

export type ActionPermissionKey = keyof typeof ACTION_PERMISSIONS;

/**
 * Kiểm tra xem vai trò hiện tại của người dùng có thuộc danh sách vai trò cho phép hay không
 */
export function hasRequiredRole(
  userRole?: UserRole | string | null,
  allowedRoles?: (UserRole | string)[]
): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!userRole) return false;

  const normalizedUserRole = userRole.toUpperCase();
  return allowedRoles.some((r) => r.toUpperCase() === normalizedUserRole);
}

/**
 * Kiểm tra xem vai trò hiện tại có được phép thực hiện hành động nghiệp vụ hay không
 */
export function canPerformAction(
  userRole?: UserRole | string | null,
  action?: ActionPermissionKey
): boolean {
  if (!action || !ACTION_PERMISSIONS[action]) return true;
  return hasRequiredRole(userRole, ACTION_PERMISSIONS[action]);
}
