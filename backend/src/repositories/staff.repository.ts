import { query } from '../database/pool.js';
import {
  StaffFilterDto,
  CreateStaffDto,
  UpdateStaffDto,
  StaffListItem,
  TeacherListItem,
  TeacherAssignedClass,
  StaffRoleSummary,
} from '../types/staff.types.js';
import { RoleCode } from '../types/auth.types.js';
import { logger } from '../utils/logger.js';

export class StaffRepository {
  /**
   * Lấy danh sách nhân viên kèm bộ lọc và phân trang
   */
  static async findAll(filter: StaffFilterDto): Promise<{ staffs: StaffListItem[]; total: number }> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (filter.search && filter.search.trim()) {
      const term = `%${filter.search.trim().toLowerCase()}%`;
      conditions.push(`(
        LOWER(u.full_name) LIKE $${paramIdx} 
        OR LOWER(u.email) LIKE $${paramIdx} 
        OR LOWER(u.username) LIKE $${paramIdx} 
        OR u.phone_number LIKE $${paramIdx}
      )`);
      params.push(term);
      paramIdx++;
    }

    if (filter.roleCode) {
      conditions.push(`r.role_code = $${paramIdx}`);
      params.push(filter.roleCode);
      paramIdx++;
    }

    if (filter.isActive !== undefined) {
      conditions.push(`u.is_active = $${paramIdx}`);
      params.push(filter.isActive);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sortBy = filter.sortBy === 'full_name' ? 'u.full_name' : filter.sortBy === 'username' ? 'u.username' : 'u.created_at';
    const sortOrder = filter.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    try {
      const countSql = `
        SELECT COUNT(u.id)::int as total
        FROM users u
        JOIN roles r ON u.role_id = r.id
        ${whereClause};
      `;
      const countRes = await query(countSql, params);
      const total = countRes.rows[0]?.total || 0;

      const dataSql = `
        SELECT 
          u.id, 
          u.username, 
          u.full_name, 
          u.email, 
          u.phone_number, 
          u.role_id, 
          u.avatar_url, 
          u.is_active, 
          u.specialization, 
          u.is_native, 
          u.created_at, 
          u.updated_at,
          r.role_code, 
          r.role_name,
          COALESCE(cls.classes_count, 0)::int as assigned_classes_count
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN (
          SELECT teacher_name, COUNT(id) as classes_count
          FROM classes
          GROUP BY teacher_name
        ) cls ON cls.teacher_name = u.full_name
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $${paramIdx} OFFSET $${paramIdx + 1};
      `;
      const dataRes = await query(dataSql, [...params, limit, offset]);

      const staffs: StaffListItem[] = dataRes.rows.map((row) => ({
        id: row.id,
        username: row.username,
        fullName: row.full_name,
        email: row.email,
        phoneNumber: row.phone_number || undefined,
        roleId: row.role_id,
        roleCode: row.role_code as RoleCode,
        roleName: row.role_name,
        avatarUrl: row.avatar_url || undefined,
        isActive: row.is_active,
        specialization: row.specialization || undefined,
        isNative: Boolean(row.is_native),
        assignedClassesCount: row.assigned_classes_count || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return { staffs, total };
    } catch (err: any) {
      logger.error('Lỗi truy vấn danh sách nhân viên từ CSDL:', err.message);
      throw err;
    }
  }

  /**
   * Lấy chi tiết nhân viên theo ID kèm danh sách lớp phụ trách
   */
  static async findById(id: number): Promise<any | null> {
    try {
      const sql = `
        SELECT 
          u.id, 
          u.username, 
          u.full_name, 
          u.email, 
          u.phone_number, 
          u.role_id, 
          u.avatar_url, 
          u.is_active, 
          u.specialization, 
          u.is_native, 
          u.bio,
          u.created_at, 
          u.updated_at,
          r.role_code, 
          r.role_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1
        LIMIT 1;
      `;
      const res = await query(sql, [id]);
      if (res.rows.length === 0) return null;

      const row = res.rows[0];

      // Lấy danh sách lớp nếu là giảng viên
      let assignedClasses: TeacherAssignedClass[] = [];
      const classSql = `
        SELECT 
          c.id, 
          c.class_code, 
          c.class_name, 
          co.course_name, 
          c.schedule_days, 
          c.time_slot, 
          c.room, 
          c.status, 
          c.current_enrolled, 
          c.max_capacity, 
          c.start_date
        FROM classes c
        JOIN courses co ON c.course_id = co.id
        WHERE c.teacher_name = $1
        ORDER BY c.start_date DESC;
      `;
      const classRes = await query(classSql, [row.full_name]);
      assignedClasses = classRes.rows.map((c) => ({
        id: c.id,
        classCode: c.class_code,
        className: c.class_name,
        courseName: c.course_name,
        scheduleDays: c.schedule_days,
        timeSlot: c.time_slot,
        room: c.room || undefined,
        status: c.status,
        currentEnrolled: c.current_enrolled,
        maxCapacity: c.max_capacity,
        startDate: c.start_date ? new Date(c.start_date).toISOString().split('T')[0] : '',
      }));

      return {
        id: row.id,
        username: row.username,
        fullName: row.full_name,
        email: row.email,
        phoneNumber: row.phone_number || undefined,
        roleId: row.role_id,
        roleCode: row.role_code as RoleCode,
        roleName: row.role_name,
        avatarUrl: row.avatar_url || undefined,
        isActive: row.is_active,
        specialization: row.specialization || undefined,
        isNative: Boolean(row.is_native),
        bio: row.bio || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        assignedClassesCount: assignedClasses.length,
        assignedClasses,
      };
    } catch (err: any) {
      logger.error(`Lỗi tìm nhân viên ID ${id}:`, err.message);
      throw err;
    }
  }

  /**
   * Kiểm tra trùng lặp username hoặc email (chuẩn DB-01 / schema.sql)
   */
  static async checkDuplicate(
    username?: string,
    email?: string,
    phoneNumber?: string,
    excludeId?: number
  ): Promise<{ field: string; value: string } | null> {
    if (username) {
      let uSql = 'SELECT id, username FROM users WHERE LOWER(username) = LOWER($1)';
      const uParams: any[] = [username.trim()];
      if (excludeId) {
        uSql += ' AND id != $2';
        uParams.push(excludeId);
      }
      const uRes = await query(uSql, uParams);
      if (uRes.rows.length > 0) return { field: 'username', value: username };
    }

    if (email) {
      let eSql = 'SELECT id, email FROM users WHERE LOWER(email) = LOWER($1)';
      const eParams: any[] = [email.trim()];
      if (excludeId) {
        eSql += ' AND id != $2';
        eParams.push(excludeId);
      }
      const eRes = await query(eSql, eParams);
      if (eRes.rows.length > 0) return { field: 'email', value: email };
    }

    return null;
  }

  /**
   * Tìm vai trò theo roleCode
   */
  static async findRoleByCode(roleCode: RoleCode): Promise<{ id: number; roleCode: RoleCode; roleName: string } | null> {
    const sql = 'SELECT id, role_code, role_name FROM roles WHERE role_code = $1 LIMIT 1;';
    const res = await query(sql, [roleCode]);
    if (res.rows.length > 0) {
      return {
        id: res.rows[0].id,
        roleCode: res.rows[0].role_code as RoleCode,
        roleName: res.rows[0].role_name,
      };
    }
    return null;
  }

  /**
   * Tạo tài khoản nhân viên mới
   */
  static async create(data: {
    username: string;
    passwordHash: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    roleId: number;
    avatarUrl?: string;
    specialization?: string;
    isNative?: boolean;
    bio?: string;
  }): Promise<any> {
    const sql = `
      INSERT INTO users (
        username, password_hash, full_name, email, phone_number,
        role_id, avatar_url, is_active, specialization, is_native, bio
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9, $10)
      RETURNING id, username, full_name, email, phone_number, role_id, avatar_url, is_active, specialization, is_native, bio, created_at, updated_at;
    `;
    const params = [
      data.username,
      data.passwordHash,
      data.fullName,
      data.email,
      data.phoneNumber || null,
      data.roleId,
      data.avatarUrl || null,
      data.specialization || null,
      data.isNative ?? false,
      data.bio || null,
    ];
    const res = await query(sql, params);
    return res.rows[0];
  }

  /**
   * Cập nhật thông tin nhân viên
   */
  static async update(
    id: number,
    data: {
      fullName?: string;
      email?: string;
      phoneNumber?: string;
      roleId?: number;
      avatarUrl?: string;
      specialization?: string;
      isNative?: boolean;
      bio?: string;
    }
  ): Promise<any> {
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (data.fullName !== undefined) {
      setClauses.push(`full_name = $${paramIdx++}`);
      params.push(data.fullName);
    }
    if (data.email !== undefined) {
      setClauses.push(`email = $${paramIdx++}`);
      params.push(data.email);
    }
    if (data.phoneNumber !== undefined) {
      setClauses.push(`phone_number = $${paramIdx++}`);
      params.push(data.phoneNumber || null);
    }
    if (data.roleId !== undefined) {
      setClauses.push(`role_id = $${paramIdx++}`);
      params.push(data.roleId);
    }
    if (data.avatarUrl !== undefined) {
      setClauses.push(`avatar_url = $${paramIdx++}`);
      params.push(data.avatarUrl || null);
    }
    if (data.specialization !== undefined) {
      setClauses.push(`specialization = $${paramIdx++}`);
      params.push(data.specialization || null);
    }
    if (data.isNative !== undefined) {
      setClauses.push(`is_native = $${paramIdx++}`);
      params.push(data.isNative);
    }
    if (data.bio !== undefined) {
      setClauses.push(`bio = $${paramIdx++}`);
      params.push(data.bio || null);
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const sql = `
      UPDATE users
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIdx}
      RETURNING id, username, full_name, email, phone_number, role_id, avatar_url, is_active, specialization, is_native, bio, created_at, updated_at;
    `;
    const res = await query(sql, params);
    return res.rows[0] || null;
  }

  /**
   * Cập nhật trạng thái kích hoạt / vô hiệu hóa
   */
  static async updateStatus(id: number, isActive: boolean): Promise<any> {
    const sql = `
      UPDATE users
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, username, full_name, email, role_id, is_active, updated_at;
    `;
    const res = await query(sql, [isActive, id]);
    return res.rows[0] || null;
  }

  /**
   * Đặt lại mật khẩu nhân viên
   */
  static async updatePassword(id: number, passwordHash: string): Promise<boolean> {
    const sql = `
      UPDATE users
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2;
    `;
    const res = await query(sql, [passwordHash, id]);
    return (res.rowCount ?? 0) > 0;
  }

  /**
   * Lấy danh sách giảng viên kèm thông tin chi tiết các lớp đang dạy
   */
  static async findTeachers(): Promise<TeacherListItem[]> {
    try {
      const sql = `
        SELECT 
          u.id, 
          u.username, 
          u.full_name, 
          u.email, 
          u.phone_number, 
          u.avatar_url, 
          u.is_active, 
          u.specialization, 
          u.is_native, 
          u.bio
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE r.role_code = 'TEACHER' OR u.specialization IS NOT NULL
        ORDER BY u.full_name ASC;
      `;
      const res = await query(sql);

      const teachers: TeacherListItem[] = [];

      for (const row of res.rows) {
        const classSql = `
          SELECT 
            c.id, 
            c.class_code, 
            c.class_name, 
            co.course_name, 
            c.schedule_days, 
            c.time_slot, 
            c.room, 
            c.status, 
            c.current_enrolled, 
            c.max_capacity, 
            c.start_date
          FROM classes c
          JOIN courses co ON c.course_id = co.id
          WHERE c.teacher_name = $1
          ORDER BY c.start_date DESC;
        `;
        const classRes = await query(classSql, [row.full_name]);
        const assignedClasses: TeacherAssignedClass[] = classRes.rows.map((c) => ({
          id: c.id,
          classCode: c.class_code,
          className: c.class_name,
          courseName: c.course_name,
          scheduleDays: c.schedule_days,
          timeSlot: c.time_slot,
          room: c.room || undefined,
          status: c.status,
          currentEnrolled: c.current_enrolled,
          maxCapacity: c.max_capacity,
          startDate: c.start_date ? new Date(c.start_date).toISOString().split('T')[0] : '',
        }));

        teachers.push({
          id: row.id,
          username: row.username,
          fullName: row.full_name,
          email: row.email,
          phoneNumber: row.phone_number || undefined,
          avatarUrl: row.avatar_url || undefined,
          isActive: row.is_active,
          specialization: row.specialization || undefined,
          isNative: Boolean(row.is_native),
          bio: row.bio || undefined,
          assignedClassesCount: assignedClasses.length,
          assignedClasses,
        });
      }

      return teachers;
    } catch (err: any) {
      logger.error('Lỗi truy vấn danh sách giảng viên:', err.message);
      throw err;
    }
  }

  /**
   * Lấy thống kê số lượng nhân sự theo từng vai trò
   */
  static async getSummary(): Promise<StaffRoleSummary> {
    try {
      const sql = `
        SELECT 
          COUNT(*)::int as total,
          COUNT(CASE WHEN r.role_code = 'SALES' THEN 1 END)::int as sales_count,
          COUNT(CASE WHEN r.role_code = 'ACADEMIC' THEN 1 END)::int as academic_count,
          COUNT(CASE WHEN r.role_code = 'TEACHER' THEN 1 END)::int as teacher_count,
          COUNT(CASE WHEN r.role_code = 'ADMIN' THEN 1 END)::int as admin_count
        FROM users u
        JOIN roles r ON u.role_id = r.id;
      `;
      const res = await query(sql);
      const row = res.rows[0] || {};
      return {
        total: Number(row.total) || 0,
        salesCount: Number(row.sales_count) || 0,
        academicCount: Number(row.academic_count) || 0,
        teacherCount: Number(row.teacher_count) || 0,
        adminCount: Number(row.admin_count) || 0,
      };
    } catch (err: any) {
      logger.error('Lỗi truy vấn tổng hợp nhân sự:', err.message);
      return {
        total: 0,
        salesCount: 0,
        academicCount: 0,
        teacherCount: 0,
        adminCount: 0,
      };
    }
  }

  /**
   * Xóa nhân viên (kiểm tra ràng buộc)
   */
  static async delete(id: number): Promise<boolean> {
    const sql = 'DELETE FROM users WHERE id = $1;';
    const res = await query(sql, [id]);
    return (res.rowCount ?? 0) > 0;
  }
}

