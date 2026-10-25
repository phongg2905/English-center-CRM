import { query } from '../database/pool.js';
import {
  ClassWithCourse,
  CreateClassDto,
  UpdateClassDto,
  ClassStatus,
  ScheduleDays,
} from '../types/academic.types.js';

function mapRowToClassWithCourse(row: any): ClassWithCourse {
  const maxCapacity = Number(row.max_capacity);
  const currentEnrolled = Number(row.current_enrolled);
  const availableSeats = Math.max(0, maxCapacity - currentEnrolled);
  const isFull = row.status === 'FULL' || currentEnrolled >= maxCapacity;

  return {
    id: Number(row.id),
    courseId: Number(row.course_id),
    classCode: row.class_code,
    className: row.class_name,
    scheduleDays: row.schedule_days,
    timeSlot: row.time_slot,
    room: row.room,
    teacherName: row.teacher_name,
    startDate: row.start_date instanceof Date ? row.start_date.toISOString().split('T')[0] : row.start_date,
    maxCapacity,
    currentEnrolled,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    courseCode: row.course_code,
    courseName: row.course_name,
    standardTuition: Number(row.standard_tuition),
    targetOutput: row.target_output,
    availableSeats,
    isFull,
  };
}

export class ClassRepository {
  static async findAll(filter?: {
    courseId?: number;
    status?: ClassStatus;
    scheduleDays?: ScheduleDays;
    search?: string;
  }): Promise<ClassWithCourse[]> {
    let sql = `
      SELECT c.id, c.course_id, c.class_code, c.class_name, c.schedule_days,
             c.time_slot, c.room, c.teacher_name, c.start_date, c.max_capacity,
             c.current_enrolled, c.status, c.created_at, c.updated_at,
             co.course_code, co.course_name, co.standard_tuition, co.target_output
      FROM classes c
      JOIN courses co ON c.course_id = co.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter?.courseId) {
      params.push(filter.courseId);
      sql += ` AND c.course_id = $${params.length}`;
    }

    if (filter?.status) {
      params.push(filter.status);
      sql += ` AND c.status = $${params.length}`;
    }

    if (filter?.scheduleDays) {
      params.push(filter.scheduleDays);
      sql += ` AND c.schedule_days = $${params.length}`;
    }

    if (filter?.search) {
      params.push(`%${filter.search}%`);
      sql += ` AND (c.class_name ILIKE $${params.length} OR c.class_code ILIKE $${params.length} OR c.teacher_name ILIKE $${params.length})`;
    }

    sql += ` ORDER BY c.start_date ASC, c.id ASC`;

    const result = await query(sql, params);
    return result.rows.map(mapRowToClassWithCourse);
  }

  static async findById(id: number): Promise<ClassWithCourse | null> {
    const sql = `
      SELECT c.id, c.course_id, c.class_code, c.class_name, c.schedule_days,
             c.time_slot, c.room, c.teacher_name, c.start_date, c.max_capacity,
             c.current_enrolled, c.status, c.created_at, c.updated_at,
             co.course_code, co.course_name, co.standard_tuition, co.target_output
      FROM classes c
      JOIN courses co ON c.course_id = co.id
      WHERE c.id = $1
    `;
    const result = await query(sql, [id]);
    if (result.rows.length === 0) return null;
    return mapRowToClassWithCourse(result.rows[0]);
  }

  static async findByCode(code: string): Promise<ClassWithCourse | null> {
    const sql = `
      SELECT c.id, c.course_id, c.class_code, c.class_name, c.schedule_days,
             c.time_slot, c.room, c.teacher_name, c.start_date, c.max_capacity,
             c.current_enrolled, c.status, c.created_at, c.updated_at,
             co.course_code, co.course_name, co.standard_tuition, co.target_output
      FROM classes c
      JOIN courses co ON c.course_id = co.id
      WHERE LOWER(c.class_code) = LOWER($1)
    `;
    const result = await query(sql, [code]);
    if (result.rows.length === 0) return null;
    return mapRowToClassWithCourse(result.rows[0]);
  }

  static async create(dto: CreateClassDto): Promise<ClassWithCourse> {
    const sql = `
      INSERT INTO classes (
        course_id, class_code, class_name, schedule_days, time_slot,
        room, teacher_name, start_date, max_capacity, current_enrolled, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, 'OPEN')
      RETURNING id
    `;
    const maxCap = dto.maxCapacity ?? 15;
    const params = [
      dto.courseId,
      dto.classCode.trim().toUpperCase(),
      dto.className.trim(),
      dto.scheduleDays,
      dto.timeSlot.trim(),
      dto.room?.trim() ?? null,
      dto.teacherName?.trim() ?? null,
      dto.startDate,
      maxCap,
    ];
    const res = await query(sql, params);
    const createdId = res.rows[0].id;
    const full = await this.findById(createdId);
    if (!full) throw new Error('Không thể tải lớp học vừa tạo');
    return full;
  }

  static async update(id: number, dto: UpdateClassDto): Promise<ClassWithCourse | null> {
    const updates: string[] = [];
    const params: any[] = [id];

    if (dto.courseId !== undefined) {
      params.push(dto.courseId);
      updates.push(`course_id = $${params.length}`);
    }
    if (dto.classCode !== undefined) {
      params.push(dto.classCode.trim().toUpperCase());
      updates.push(`class_code = $${params.length}`);
    }
    if (dto.className !== undefined) {
      params.push(dto.className.trim());
      updates.push(`class_name = $${params.length}`);
    }
    if (dto.scheduleDays !== undefined) {
      params.push(dto.scheduleDays);
      updates.push(`schedule_days = $${params.length}`);
    }
    if (dto.timeSlot !== undefined) {
      params.push(dto.timeSlot.trim());
      updates.push(`time_slot = $${params.length}`);
    }
    if (dto.room !== undefined) {
      params.push(dto.room?.trim() ?? null);
      updates.push(`room = $${params.length}`);
    }
    if (dto.teacherName !== undefined) {
      params.push(dto.teacherName?.trim() ?? null);
      updates.push(`teacher_name = $${params.length}`);
    }
    if (dto.startDate !== undefined) {
      params.push(dto.startDate);
      updates.push(`start_date = $${params.length}`);
    }
    if (dto.maxCapacity !== undefined) {
      params.push(dto.maxCapacity);
      updates.push(`max_capacity = $${params.length}`);
    }
    if (dto.status !== undefined) {
      params.push(dto.status);
      updates.push(`status = $${params.length}`);
    }

    if (updates.length > 0) {
      const sql = `
        UPDATE classes
        SET ${updates.join(', ')}
        WHERE id = $1
      `;
      await query(sql, params);
    }

    return this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const sql = `DELETE FROM classes WHERE id = $1`;
    const result = await query(sql, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async updateCurrentEnrolled(classId: number, currentEnrolled: number, isFull: boolean): Promise<void> {
    const status = isFull ? 'FULL' : 'OPEN';
    const sql = `
      UPDATE classes
      SET current_enrolled = $1,
          status = CASE WHEN status IN ('PLANNING', 'IN_PROGRESS', 'COMPLETED') THEN status ELSE $2 END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `;
    await query(sql, [currentEnrolled, status, classId]);
  }
}
