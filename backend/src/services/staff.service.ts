import bcrypt from 'bcryptjs';
import { StaffRepository } from '../repositories/staff.repository.js';
import {
  StaffFilterDto,
  CreateStaffDto,
  UpdateStaffDto,
  StaffListResponse,
  TeacherListItem,
} from '../types/staff.types.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export class StaffService {
  /**
   * Lấy danh sách nhân viên có phân trang & lọc
   */
  static async getStaffs(filter: StaffFilterDto): Promise<StaffListResponse> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 10));

    const [{ staffs, total }, summary] = await Promise.all([
      StaffRepository.findAll({
        ...filter,
        page,
        limit,
      }),
      StaffRepository.getSummary(),
    ]);

    return {
      staffs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      summary,
    };
  }

  /**
   * Lấy thông tin chi tiết một nhân viên
   */
  static async getStaffById(id: number): Promise<any> {
    const staff = await StaffRepository.findById(id);
    if (!staff) {
      throw AppError.notFound(`Không tìm thấy nhân sự với ID ${id}`);
    }
    return staff;
  }

  /**
   * Tạo mới tài khoản nhân viên (Admin thực hiện)
   */
  static async createStaff(dto: CreateStaffDto): Promise<any> {
    // 1. Kiểm tra tính hợp lệ dữ liệu
    if (!dto.username || !dto.fullName || !dto.email || !dto.roleCode) {
      throw AppError.badRequest('Vui lòng cung cấp đầy đủ: Tên đăng nhập, Họ và tên, Email và Vai trò');
    }

    const cleanUsername = dto.username.trim();
    if (!/^[a-zA-Z0-9_\.]+$/.test(cleanUsername)) {
      throw AppError.badRequest('Tên đăng nhập chỉ được chứa chữ cái, số, dấu gạch dưới và dấu chấm');
    }

    const cleanEmail = dto.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw AppError.badRequest('Địa chỉ Email không đúng định dạng');
    }

    const cleanPhone = dto.phoneNumber?.trim().replace(/[\s.-]/g, '');
    if (cleanPhone && !/^[0-9]{9,15}$/.test(cleanPhone)) {
      throw AppError.badRequest('Số điện thoại không hợp lệ (từ 9 đến 15 chữ số)');
    }

    // 2. Kiểm tra trùng lặp (username, email)
    const dupCheck = await StaffRepository.checkDuplicate(cleanUsername, cleanEmail);
    if (dupCheck) {
      if (dupCheck.field === 'username') throw AppError.conflict('Tên đăng nhập này đã được sử dụng');
      if (dupCheck.field === 'email') throw AppError.conflict('Địa chỉ Email này đã được đăng ký');
    }

    // 3. Tìm vai trò tương ứng
    const role = await StaffRepository.findRoleByCode(dto.roleCode);
    if (!role) {
      throw AppError.badRequest(`Vai trò '${dto.roleCode}' không hợp lệ hoặc chưa được định nghĩa`);
    }

    // 4. Băm mật khẩu (mặc định nếu không truyền: EduFlow@2026)
    const rawPassword = dto.password && dto.password.length >= 6 ? dto.password : 'EduFlow@2026';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    // 5. Lưu vào CSDL
    const created = await StaffRepository.create({
      username: cleanUsername,
      passwordHash,
      fullName: dto.fullName.trim(),
      email: cleanEmail,
      phoneNumber: cleanPhone,
      roleId: role.id,
      avatarUrl: dto.avatarUrl?.trim(),
      specialization: dto.specialization?.trim(),
      isNative: dto.isNative ?? false,
      bio: dto.bio?.trim(),
    });

    logger.info(`Đã tạo tài khoản nhân sự mới: ${created.username} (Vai trò: ${role.roleCode})`);

    return {
      ...created,
      roleCode: role.roleCode,
      roleName: role.roleName,
      defaultPasswordUsed: !dto.password,
    };
  }

  /**
   * Cập nhật thông tin nhân viên
   */
  static async updateStaff(id: number, dto: UpdateStaffDto, currentUserId?: number): Promise<any> {
    const existing = await StaffRepository.findById(id);
    if (!existing) {
      throw AppError.notFound(`Không tìm thấy nhân sự với ID ${id}`);
    }

    // Chặn người dùng tự giáng cấp hoặc đổi vai trò của chính mình
    if (currentUserId && id === currentUserId && dto.roleCode && dto.roleCode !== existing.roleCode) {
      throw AppError.badRequest('Bạn không thể tự thay đổi vai trò của chính tài khoản đang đăng nhập!');
    }

    let roleId: number | undefined;
    if (dto.roleCode) {
      const role = await StaffRepository.findRoleByCode(dto.roleCode);
      if (!role) {
        throw AppError.badRequest(`Vai trò '${dto.roleCode}' không hợp lệ`);
      }
      roleId = role.id;
    }

    // Validate email format if provided
    if (dto.email) {
      const cleanEmail = dto.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        throw AppError.badRequest('Địa chỉ Email không đúng định dạng');
      }

      // Kiểm tra trùng email nếu có cập nhật email mới
      if (cleanEmail !== existing.email.toLowerCase()) {
        const dupCheck = await StaffRepository.checkDuplicate(
          undefined,
          cleanEmail,
          undefined,
          id
        );
        if (dupCheck && dupCheck.field === 'email') {
          throw AppError.conflict('Địa chỉ Email này đã được đăng ký bởi tài khoản khác');
        }
      }
    }

    // Làm sạch và validate số điện thoại nếu có cập nhật
    let cleanPhone: string | undefined = undefined;
    if (dto.phoneNumber !== undefined) {
      const trimmed = dto.phoneNumber.trim().replace(/[\s.-]/g, '');
      if (trimmed) {
        if (!/^[0-9]{9,15}$/.test(trimmed)) {
          throw AppError.badRequest('Số điện thoại không hợp lệ (từ 9 đến 15 chữ số)');
        }
        cleanPhone = trimmed;
      } else {
        cleanPhone = ''; // Cho phép reset về null trong repository
      }
    }

    const updated = await StaffRepository.update(id, {
      fullName: dto.fullName?.trim(),
      email: dto.email?.trim().toLowerCase(),
      phoneNumber: cleanPhone,
      roleId,
      avatarUrl: dto.avatarUrl !== undefined ? dto.avatarUrl.trim() : undefined,
      specialization: dto.specialization !== undefined ? dto.specialization.trim() : undefined,
      isNative: dto.isNative,
      bio: dto.bio !== undefined ? dto.bio.trim() : undefined,
    });

    logger.info(`Đã cập nhật thông tin nhân sự ID ${id}`);
    return updated;
  }

  /**
   * Kích hoạt hoặc vô hiệu hóa tài khoản (Khóa tài khoản khi nghỉ việc)
   */
  static async updateStaffStatus(id: number, currentUserId: number, isActive: boolean): Promise<any> {
    if (id === currentUserId && !isActive) {
      throw AppError.badRequest('Bạn không thể tự vô hiệu hóa tài khoản Quản trị viên của chính mình!');
    }

    const existing = await StaffRepository.findById(id);
    if (!existing) {
      throw AppError.notFound(`Không tìm thấy nhân sự với ID ${id}`);
    }

    const updated = await StaffRepository.updateStatus(id, isActive);
    const actionText = isActive ? 'kích hoạt' : 'vô hiệu hóa/khóa';
    logger.info(`Admin (ID ${currentUserId}) đã ${actionText} tài khoản ID ${id} (${existing.username})`);

    return updated;
  }

  /**
   * Đặt lại mật khẩu nhân viên
   */
  static async resetPassword(id: number, currentUserId: number, newPassword?: string): Promise<{ message: string; temporaryPassword?: string }> {
    const existing = await StaffRepository.findById(id);
    if (!existing) {
      throw AppError.notFound(`Không tìm thấy nhân sự với ID ${id}`);
    }

    const passwordToSet = newPassword && newPassword.length >= 6 ? newPassword : `EduFlow@${Math.floor(1000 + Math.random() * 9000)}`;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordToSet, salt);

    await StaffRepository.updatePassword(id, passwordHash);
    logger.info(`Admin (ID ${currentUserId}) đã đặt lại mật khẩu cho nhân sự ID ${id} (${existing.username})`);

    return {
      message: `Đã đặt lại mật khẩu thành công cho tài khoản ${existing.username}`,
      temporaryPassword: passwordToSet,
    };
  }

  /**
   * Lấy danh sách giảng viên kèm lịch dạy
   */
  static async getTeachers(): Promise<TeacherListItem[]> {
    return await StaffRepository.findTeachers();
  }

  /**
   * Xóa nhân viên khỏi hệ thống (kiểm tra an toàn)
   */
  static async deleteStaff(id: number, currentUserId: number): Promise<{ message: string }> {
    if (id === currentUserId) {
      throw AppError.badRequest('Bạn không thể tự xóa tài khoản của chính mình!');
    }

    const existing = await StaffRepository.findById(id);
    if (!existing) {
      throw AppError.notFound(`Không tìm thấy nhân sự với ID ${id}`);
    }

    if (existing.assignedClassesCount > 0) {
      throw AppError.badRequest(
        `Không thể xóa giảng viên đang phụ trách ${existing.assignedClassesCount} lớp học. Vui lòng chuyển lớp hoặc vô hiệu hóa tài khoản thay vì xóa!`
      );
    }

    await StaffRepository.delete(id);
    logger.info(`Admin (ID ${currentUserId}) đã xóa tài khoản nhân sự ID ${id} (${existing.username})`);

    return {
      message: `Đã xóa tài khoản nhân viên ${existing.fullName} (${existing.username}) thành công`,
    };
  }
}
