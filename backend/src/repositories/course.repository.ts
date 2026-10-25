import { query } from '../database/pool.js';
import { Course, CreateCourseDto, UpdateCourseDto } from '../types/academic.types.js';

function mapRowToCourse(row: any): Course {
  return {
    id: Number(row.id),
    courseCode: row.course_code,
    courseName: row.course_name,
    totalLessons: Number(row.total_lessons),
    standardTuition: Number(row.standard_tuition),
    minEntryScore: row.min_entry_score !== null ? Number(row.min_entry_score) : null,
    maxEntryScore: row.max_entry_score !== null ? Number(row.max_entry_score) : null,
    targetOutput: row.target_output,
    description: row.description,
    isActive: Boolean(row.is_active),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class CourseRepository {
  static async findAll(filter?: { isActive?: boolean; search?: string }): Promise<Course[]> {
    let sql = `
      SELECT id, course_code, course_name, total_lessons, standard_tuition,
             min_entry_score, max_entry_score, target_output, description, is_active,
             created_at, updated_at
      FROM courses
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter?.isActive !== undefined) {
      params.push(filter.isActive);
      sql += ` AND is_active = $${params.length}`;
    }

    if (filter?.search) {
      params.push(`%${filter.search}%`);
      sql += ` AND (course_name ILIKE $${params.length} OR course_code ILIKE $${params.length})`;
    }

    sql += ` ORDER BY id ASC`;

    const result = await query(sql, params);
    return result.rows.map(mapRowToCourse);
  }

  static async findById(id: number): Promise<Course | null> {
    const sql = `
      SELECT id, course_code, course_name, total_lessons, standard_tuition,
             min_entry_score, max_entry_score, target_output, description, is_active,
             created_at, updated_at
      FROM courses
      WHERE id = $1
    `;
    const result = await query(sql, [id]);
    if (result.rows.length === 0) return null;
    return mapRowToCourse(result.rows[0]);
  }

  static async findByCode(code: string): Promise<Course | null> {
    const sql = `
      SELECT id, course_code, course_name, total_lessons, standard_tuition,
             min_entry_score, max_entry_score, target_output, description, is_active,
             created_at, updated_at
      FROM courses
      WHERE LOWER(course_code) = LOWER($1)
    `;
    const result = await query(sql, [code]);
    if (result.rows.length === 0) return null;
    return mapRowToCourse(result.rows[0]);
  }

  static async create(dto: CreateCourseDto): Promise<Course> {
    const sql = `
      INSERT INTO courses (
        course_code, course_name, total_lessons, standard_tuition,
        min_entry_score, max_entry_score, target_output, description, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const params = [
      dto.courseCode.trim().toUpperCase(),
      dto.courseName.trim(),
      dto.totalLessons,
      dto.standardTuition,
      dto.minEntryScore ?? null,
      dto.maxEntryScore ?? null,
      dto.targetOutput ?? null,
      dto.description ?? null,
      dto.isActive ?? true,
    ];
    const result = await query(sql, params);
    return mapRowToCourse(result.rows[0]);
  }

  static async update(id: number, dto: UpdateCourseDto): Promise<Course | null> {
    const updates: string[] = [];
    const params: any[] = [id];

    if (dto.courseCode !== undefined) {
      params.push(dto.courseCode.trim().toUpperCase());
      updates.push(`course_code = $${params.length}`);
    }
    if (dto.courseName !== undefined) {
      params.push(dto.courseName.trim());
      updates.push(`course_name = $${params.length}`);
    }
    if (dto.totalLessons !== undefined) {
      params.push(dto.totalLessons);
      updates.push(`total_lessons = $${params.length}`);
    }
    if (dto.standardTuition !== undefined) {
      params.push(dto.standardTuition);
      updates.push(`standard_tuition = $${params.length}`);
    }
    if (dto.minEntryScore !== undefined) {
      params.push(dto.minEntryScore);
      updates.push(`min_entry_score = $${params.length}`);
    }
    if (dto.maxEntryScore !== undefined) {
      params.push(dto.maxEntryScore);
      updates.push(`max_entry_score = $${params.length}`);
    }
    if (dto.targetOutput !== undefined) {
      params.push(dto.targetOutput);
      updates.push(`target_output = $${params.length}`);
    }
    if (dto.description !== undefined) {
      params.push(dto.description);
      updates.push(`description = $${params.length}`);
    }
    if (dto.isActive !== undefined) {
      params.push(dto.isActive);
      updates.push(`is_active = $${params.length}`);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    const sql = `
      UPDATE courses
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `;
    const result = await query(sql, params);
    if (result.rows.length === 0) return null;
    return mapRowToCourse(result.rows[0]);
  }

  static async delete(id: number): Promise<boolean> {
    const sql = `DELETE FROM courses WHERE id = $1`;
    const result = await query(sql, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
