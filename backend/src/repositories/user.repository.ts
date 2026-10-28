import { query } from '../database/pool.js';
import { User, Role, RoleCode, UserWithRole } from '../types/auth.types.js';

// In-Memory OTP Store cho chức năng Quên mật khẩu (hết hạn sau 15 phút)
interface OtpEntry {
  otp: string;
  expiresAt: Date;
  isUsed: boolean;
}
const passwordResetOtps = new Map<string, OtpEntry>();

export class UserRepository {
  /**
   * Tìm người dùng bằng username hoặc email (hỗ trợ xác thực đăng nhập)
   */
  static async findByUsernameOrEmail(identifier: string): Promise<(User & { roleCode: RoleCode; roleName: string }) | null> {
    let cleanId = identifier.trim().toLowerCase();
    // Hỗ trợ alias demo thuận tiện




    const sql = `
      SELECT u.id, u.username, u.password_hash, u.full_name, u.email, 
             u.phone_number, u.role_id, u.avatar_url, u.is_active, 
             u.created_at, u.updated_at,
             r.role_code, r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE LOWER(u.username) = LOWER($1) OR LOWER(u.email) = LOWER($1)
      LIMIT 1;
    `;
    const res = await query(sql, [cleanId]);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      fullName: row.full_name,
      email: row.email,
      phoneNumber: row.phone_number,
      roleId: row.role_id,
      avatarUrl: row.avatar_url,
      isActive: row.is_active,
      roleCode: row.role_code as RoleCode,
      roleName: row.role_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Tìm người dùng theo ID
   */
  static async findById(id: number): Promise<UserWithRole | null> {
    const sql = `
      SELECT u.id, u.username, u.full_name, u.email, u.phone_number, 
             u.role_id, u.avatar_url, u.is_active, u.created_at, u.updated_at,
             r.role_code, r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
      LIMIT 1;
    `;
    const res = await query(sql, [id]);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    return {
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      email: row.email,
      phoneNumber: row.phone_number,
      roleId: row.role_id,
      avatarUrl: row.avatar_url,
      isActive: row.is_active,
      role: row.role_code as RoleCode,
      roleName: row.role_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Tìm người dùng theo ID kèm passwordHash (hỗ trợ đổi mật khẩu)
   */
  static async findWithPasswordById(id: number): Promise<(User & { roleCode: RoleCode; roleName: string }) | null> {
    return this.findByIdWithPassword(id);
  }

  /**
   * Tìm vai trò theo mã code (ADMIN, SALES, ACADEMIC, TEACHER)
   */
  static async findRoleByCode(roleCode: RoleCode): Promise<Role | null> {
    const sql = `SELECT id, role_code, role_name, description, created_at, updated_at FROM roles WHERE role_code = $1 LIMIT 1;`;
    const res = await query(sql, [roleCode]);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    return {
      id: row.id,
      roleCode: row.role_code,
      roleName: row.role_name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Tạo người dùng mới
   */
  static async create(data: {
    username: string;
    passwordHash: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    roleId: number;
    avatarUrl?: string;
  }): Promise<UserWithRole> {
    const sql = `
      INSERT INTO users (username, password_hash, full_name, email, phone_number, role_id, avatar_url, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
      RETURNING id, username, full_name, email, phone_number, role_id, avatar_url, is_active, created_at, updated_at;
    `;
    const res = await query(sql, [
      data.username,
      data.passwordHash,
      data.fullName,
      data.email,
      data.phoneNumber || null,
      data.roleId,
      data.avatarUrl || null,
    ]);

    const row = res.rows[0];
    const roleRes = await query('SELECT role_code, role_name FROM roles WHERE id = $1', [data.roleId]);
    const role = roleRes.rows[0];

    return {
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      email: row.email,
      phoneNumber: row.phone_number,
      roleId: row.role_id,
      avatarUrl: row.avatar_url,
      isActive: row.is_active,
      role: role?.role_code || 'SALES',
      roleName: role?.role_name || 'Tư vấn viên',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Lấy danh sách toàn bộ vai trò
   */
  static async getAllRoles(): Promise<Role[]> {
    const sql = `SELECT id, role_code, role_name, description, created_at, updated_at FROM roles ORDER BY id ASC;`;
    const res = await query(sql);
    return res.rows.map((row) => ({
      id: row.id,
      roleCode: row.role_code,
      roleName: row.role_name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Lưu mã OTP đặt lại mật khẩu cho Email (hiệu lực 15 phút)
   */
  static savePasswordResetOtp(email: string, otp: string, expiresAt: Date): void {
    passwordResetOtps.set(email.trim().toLowerCase(), {
      otp: otp.trim(),
      expiresAt,
      isUsed: false,
    });
  }

  /**
   * Xác thực mã OTP còn hiệu lực hay không
   */
  static verifyPasswordResetOtp(email: string, otp: string): boolean {

    const entry = passwordResetOtps.get(email.trim().toLowerCase());
    if (!entry) return false;
    if (entry.isUsed) return false;
    if (entry.expiresAt.getTime() < Date.now()) return false;
    return entry.otp === otp.trim();
  }

  /**
   * Đánh dấu OTP đã được sử dụng
   */
  static markOtpUsed(email: string): void {
    const entry = passwordResetOtps.get(email.trim().toLowerCase());
    if (entry) {
      entry.isUsed = true;
    }
  }

  /**
   * Tìm người dùng theo ID bao gồm chuỗi passwordHash phục vụ đối soát mật khẩu cũ
   */
  static async findByIdWithPassword(id: number): Promise<(User & { roleCode: RoleCode; roleName: string }) | null> {
    const sql = `
      SELECT u.id, u.username, u.password_hash, u.full_name, u.email, 
             u.phone_number, u.role_id, u.avatar_url, u.is_active, 
             u.created_at, u.updated_at,
             r.role_code, r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
      LIMIT 1;
    `;
    const res = await query(sql, [id]);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      fullName: row.full_name,
      email: row.email,
      phoneNumber: row.phone_number,
      roleId: row.role_id,
      avatarUrl: row.avatar_url,
      isActive: row.is_active,
      roleCode: row.role_code as RoleCode,
      roleName: row.role_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Cập nhật mật khẩu mới cho người dùng
   */
  static async updatePassword(userId: number, newPasswordHash: string): Promise<boolean> {
    const sql = `
      UPDATE users
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2;
    `;
    const res = await query(sql, [newPasswordHash, userId]);
    return res.rowCount !== null && res.rowCount > 0;
  }
}
