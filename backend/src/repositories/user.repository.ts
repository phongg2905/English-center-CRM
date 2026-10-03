import { query, isDbAvailable } from '../database/pool.js';
import { User, Role, RoleCode, UserWithRole } from '../types/auth.types.js';
import { logger } from '../utils/logger.js';

// Mật khẩu băm bcrypt chuẩn cho chuỗi '123456'
const DEFAULT_PASSWORD_HASH = '$2b$10$UucQa8ESPaus0zK73UlUFuNY1Qam6UhDCtycjDTryib121tzbkugW';

// Dữ liệu mẫu ban đầu (Mock In-Memory Store khi chưa kết nối CSDL theo yêu cầu của user)
const mockRoles: Role[] = [
  { id: 1, roleCode: 'ADMIN', roleName: 'Quản lý Trung tâm', description: 'Toàn quyền quản trị hệ thống', createdAt: new Date(), updatedAt: new Date() },
  { id: 2, roleCode: 'SALES', roleName: 'Tư vấn viên Tuyển sinh', description: 'Chăm sóc Lead và ghi danh', createdAt: new Date(), updatedAt: new Date() },
  { id: 3, roleCode: 'ACADEMIC', roleName: 'Nhân viên Giáo vụ', description: 'Quản lý lớp học và ca thi', createdAt: new Date(), updatedAt: new Date() },
];

const mockUsers: (User & { roleCode: RoleCode; roleName: string })[] = [
  {
    id: 1,
    username: 'tamminh',
    passwordHash: DEFAULT_PASSWORD_HASH,
    fullName: 'Tam Minh',
    email: 'tamminh@eduflow.vn',
    phoneNumber: '0901000001',
    roleId: 1,
    roleCode: 'ADMIN',
    roleName: 'Quản lý Trung tâm',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    username: 'longpham',
    passwordHash: DEFAULT_PASSWORD_HASH,
    fullName: 'Long Phạm',
    email: 'longpham@eduflow.vn',
    phoneNumber: '0901000002',
    roleId: 2,
    roleCode: 'SALES',
    roleName: 'Tư vấn viên Tuyển sinh',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    username: 'phongpham',
    passwordHash: DEFAULT_PASSWORD_HASH,
    fullName: 'phong phạm',
    email: 'phongpham@eduflow.vn',
    phoneNumber: '0901000003',
    roleId: 3,
    roleCode: 'ACADEMIC',
    roleName: 'Nhân viên Giáo vụ',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

let nextUserId = 4;

export class UserRepository {
  /**
   * Tìm người dùng bằng username hoặc email (hỗ trợ xác thực đăng nhập)
   */
  static async findByUsernameOrEmail(identifier: string): Promise<(User & { roleCode: RoleCode; roleName: string }) | null> {
    if (isDbAvailable()) {
      try {
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
        const res = await query(sql, [identifier]);
        if (res.rows.length > 0) {
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
      } catch (err: any) {
        logger.debug('Lỗi truy vấn CSDL, chuyển sang In-Memory Store:', err.message);
      }
    }

    // In-Memory fallback
    const found = mockUsers.find(
      (u) => u.username.toLowerCase() === identifier.toLowerCase() || u.email.toLowerCase() === identifier.toLowerCase()
    );
    return found || null;
  }

  /**
   * Tìm người dùng theo ID
   */
  static async findById(id: number): Promise<UserWithRole | null> {
    if (isDbAvailable()) {
      try {
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
        if (res.rows.length > 0) {
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
      } catch (err: any) {
        logger.debug('Lỗi truy vấn CSDL theo ID, chuyển sang In-Memory Store:', err.message);
      }
    }

    const found = mockUsers.find((u) => u.id === id);
    if (!found) return null;
    return {
      id: found.id,
      username: found.username,
      fullName: found.fullName,
      email: found.email,
      phoneNumber: found.phoneNumber,
      roleId: found.roleId,
      avatarUrl: found.avatarUrl,
      isActive: found.isActive,
      role: found.roleCode,
      roleName: found.roleName,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
    };
  }

  /**
   * Tìm vai trò theo mã code (ADMIN, SALES, ACADEMIC)
   */
  static async findRoleByCode(roleCode: RoleCode): Promise<Role | null> {
    if (isDbAvailable()) {
      try {
        const sql = `SELECT id, role_code, role_name, description, created_at, updated_at FROM roles WHERE role_code = $1 LIMIT 1;`;
        const res = await query(sql, [roleCode]);
        if (res.rows.length > 0) {
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
      } catch (err: any) {
        logger.debug('Lỗi tìm role, chuyển sang In-Memory Store:', err.message);
      }
    }

    const found = mockRoles.find((r) => r.roleCode === roleCode);
    return found || null;
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
    if (isDbAvailable()) {
      try {
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
        const role = await this.findRoleByCode(
          data.roleId === 1 ? 'ADMIN' : data.roleId === 2 ? 'SALES' : 'ACADEMIC'
        );

        return {
          id: row.id,
          username: row.username,
          fullName: row.full_name,
          email: row.email,
          phoneNumber: row.phone_number,
          roleId: row.role_id,
          avatarUrl: row.avatar_url,
          isActive: row.is_active,
          role: role?.roleCode || 'SALES',
          roleName: role?.roleName || 'Tư vấn viên',
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      } catch (err: any) {
        logger.debug('Lỗi ghi CSDL, lưu tạm vào In-Memory Store:', err.message);
      }
    }

    // In-Memory Mock Store
    const role = mockRoles.find((r) => r.id === data.roleId) || mockRoles[1];
    const newUser: User & { roleCode: RoleCode; roleName: string } = {
      id: nextUserId++,
      username: data.username,
      passwordHash: data.passwordHash,
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      roleId: data.roleId,
      avatarUrl: data.avatarUrl,
      isActive: true,
      roleCode: role.roleCode,
      roleName: role.roleName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockUsers.push(newUser);

    return {
      id: newUser.id,
      username: newUser.username,
      fullName: newUser.fullName,
      email: newUser.email,
      phoneNumber: newUser.phoneNumber,
      roleId: newUser.roleId,
      avatarUrl: newUser.avatarUrl,
      isActive: newUser.isActive,
      role: newUser.roleCode,
      roleName: newUser.roleName,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };
  }

  /**
   * Lấy danh sách toàn bộ vai trò
   */
  static async getAllRoles(): Promise<Role[]> {
    if (isDbAvailable()) {
      try {
        const sql = `SELECT id, role_code, role_name, description, created_at, updated_at FROM roles ORDER BY id ASC;`;
        const res = await query(sql);
        if (res.rows.length > 0) {
          return res.rows.map((row) => ({
            id: row.id,
            roleCode: row.role_code,
            roleName: row.role_name,
            description: row.description,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));
        }
      } catch (err: any) {
        logger.debug('Lỗi đọc roles từ CSDL, trả về mock:', err.message);
      }
    }

    return [...mockRoles];
  }
}
