import { Request } from 'express';
import { UserRepository } from '../repositories/user.repository.js';
import { ClassService } from '../services/class.service.js';

/**
 * Phạm vi dữ liệu cho vai trò Giảng viên (TEACHER) - chế độ CHỈ XEM:
 * - Chỉ thấy các lớp mình phụ trách (khớp theo tên giảng viên vì bảng classes chỉ lưu teacher_name)
 * - Không thấy bất kỳ thông tin học phí / thanh toán nào
 */

const FINANCE_FIELDS = [
  'standardTuition',
  'originalTuition',
  'discountAmount',
  'finalAmount',
  'paymentStatus',
  'paidAmount',
  'balanceDue',
] as const;

/** Chuẩn hóa chuỗi: chữ thường, bỏ dấu tiếng Việt, gộp khoảng trắng */
const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

export const isTeacher = (req: Request): boolean => (req as any).user?.role === 'TEACHER';

/** Kiểm tra tên giảng viên của lớp có khớp với họ tên của tài khoản giảng viên không */
export const isTeacherNameMatch = (classTeacherName: string | null | undefined, fullName: string): boolean => {
  if (!classTeacherName || !fullName) return false;
  const teacher = normalize(classTeacherName);
  const me = normalize(fullName);
  return me.length > 0 && teacher.includes(me);
};

/** Lấy danh sách ID lớp học mà giảng viên đang đăng nhập phụ trách */
export const getTeacherClassIds = async (req: Request): Promise<Set<number>> => {
  // TokenPayload (token.service.ts) lưu ID người dùng ở trường `userId`
  const userId = (req as any).user?.userId ?? (req as any).user?.id;
  if (!userId) return new Set();
  const user = await UserRepository.findById(Number(userId));
  if (!user?.fullName) return new Set();

  const classes = await ClassService.getAllClasses({});
  return new Set(
    classes
      .filter((c: any) => isTeacherNameMatch(c.teacherName, user.fullName))
      .map((c: any) => Number(c.id))
  );
};

/** Loại bỏ toàn bộ trường tài chính khỏi object (không làm thay đổi object gốc) */
export const stripFinance = <T extends object>(item: T): T => {
  const copy: Record<string, unknown> = { ...(item as Record<string, unknown>) };
  for (const field of FINANCE_FIELDS) {
    delete copy[field];
  }
  return copy as T;
};
