import { query, isDbAvailable } from '../database/pool.js';
import { Course, CreateCourseDto, UpdateCourseDto } from '../types/academic.types.js';
import { logger } from '../utils/logger.js';

let mockCourses: Course[] = [
  {
    id: 1,
    courseCode: 'IELTS-FOUND',
    courseName: 'IELTS Nền tảng (Foundation)',
    totalLessons: 24,
    standardTuition: 6500000.0,
    minEntryScore: 3.0,
    maxEntryScore: 4.5,
    targetOutput: 'IELTS 4.5 - 5.5',
    description: 'Xây dựng ngữ pháp cốt lõi, phát âm chuẩn IPA và từ vựng học thuật cơ bản.',
    isActive: true,
    createdAt: new Date('2026-09-01T08:00:00Z'),
    updatedAt: new Date('2026-09-01T08:00:00Z'),
  },
  {
    id: 2,
    courseCode: 'IELTS-FIGHT',
    courseName: 'IELTS Bứt phá (Target 6.5)',
    totalLessons: 30,
    standardTuition: 8500000.0,
    minEntryScore: 5.0,
    maxEntryScore: 5.5,
    targetOutput: 'IELTS 6.0 - 6.5',
    description: 'Rèn luyện chiến thuật giải đề 4 kỹ năng, tối ưu hóa điểm Writing Task 2 & Speaking.',
    isActive: true,
    createdAt: new Date('2026-09-01T08:00:00Z'),
    updatedAt: new Date('2026-09-01T08:00:00Z'),
  },
  {
    id: 3,
    courseCode: 'IELTS-MAST',
    courseName: 'IELTS Chuyên sâu (Master 7.5+)',
    totalLessons: 36,
    standardTuition: 11500000.0,
    minEntryScore: 6.5,
    maxEntryScore: 7.0,
    targetOutput: 'IELTS 7.5+',
    description: 'Nâng tầm tư duy biện luận, từ vựng C1-C2 và hoàn thiện tiêu chí Coherence & Lexical.',
    isActive: true,
    createdAt: new Date('2026-09-01T08:00:00Z'),
    updatedAt: new Date('2026-09-01T08:00:00Z'),
  },
  {
    id: 4,
    courseCode: 'TOEIC-500',
    courseName: 'TOEIC Cấp tốc 550+',
    totalLessons: 20,
    standardTuition: 4500000.0,
    minEntryScore: 0.0,
    maxEntryScore: 4.0,
    targetOutput: 'TOEIC 550 - 650',
    description: 'Khóa học ôn thi TOEIC 2 kỹ năng Nghe - Đọc cho sinh viên chuẩn bị tốt nghiệp.',
    isActive: true,
    createdAt: new Date('2026-09-01T08:00:00Z'),
    updatedAt: new Date('2026-09-01T08:00:00Z'),
  },
  {
    id: 5,
    courseCode: 'COMM-PRO',
    courseName: 'Tiếng Anh Giao tiếp Đi làm',
    totalLessons: 24,
    standardTuition: 5200000.0,
    minEntryScore: 0.0,
    maxEntryScore: 9.0,
    targetOutput: 'B1 CEFR Phản xạ',
    description: 'Giao tiếp tình huống công sở, thuyết trình, viết email chuyên nghiệp cho người đi làm.',
    isActive: true,
    createdAt: new Date('2026-09-01T08:00:00Z'),
    updatedAt: new Date('2026-09-01T08:00:00Z'),
  },
];

let nextCourseId = 6;

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
    try {
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
    } catch (err) {
      logger.warn('CourseRepository.findAll: Fallback sang Mock Store');
      let courses = [...mockCourses];
      if (filter?.isActive !== undefined) {
        courses = courses.filter((c) => c.isActive === filter.isActive);
      }
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        courses = courses.filter(
          (c) => c.courseName.toLowerCase().includes(q) || c.courseCode.toLowerCase().includes(q)
        );
      }
      return courses;
    }
  }

  static async findById(id: number): Promise<Course | null> {
    try {
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
    } catch (err) {
      logger.warn('CourseRepository.findById: Fallback sang Mock Store');
      return mockCourses.find((c) => c.id === id) || null;
    }
  }

  static async findByCode(code: string): Promise<Course | null> {
    try {
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
    } catch (err) {
      logger.warn('CourseRepository.findByCode: Fallback sang Mock Store');
      return mockCourses.find((c) => c.courseCode.toLowerCase() === code.toLowerCase()) || null;
    }
  }

  static async create(dto: CreateCourseDto): Promise<Course> {
    try {
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
    } catch (err) {
      logger.warn('CourseRepository.create: Fallback sang Mock Store');
      const now = new Date();
      const newCourse: Course = {
        id: nextCourseId++,
        courseCode: dto.courseCode.trim().toUpperCase(),
        courseName: dto.courseName.trim(),
        totalLessons: dto.totalLessons,
        standardTuition: dto.standardTuition,
        minEntryScore: dto.minEntryScore ?? null,
        maxEntryScore: dto.maxEntryScore ?? null,
        targetOutput: dto.targetOutput ?? null,
        description: dto.description ?? null,
        isActive: dto.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      };
      mockCourses.push(newCourse);
      return newCourse;
    }
  }

  static async update(id: number, dto: UpdateCourseDto): Promise<Course | null> {
    try {
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
    } catch (err) {
      logger.warn('CourseRepository.update: Fallback sang Mock Store');
      const idx = mockCourses.findIndex((c) => c.id === id);
      if (idx === -1) return null;

      mockCourses[idx] = {
        ...mockCourses[idx],
        ...dto,
        courseCode: dto.courseCode ? dto.courseCode.trim().toUpperCase() : mockCourses[idx].courseCode,
        courseName: dto.courseName ? dto.courseName.trim() : mockCourses[idx].courseName,
        updatedAt: new Date(),
      };
      return mockCourses[idx];
    }
  }

  static async delete(id: number): Promise<boolean> {
    try {
      const sql = `DELETE FROM courses WHERE id = $1`;
      const result = await query(sql, [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (err) {
      logger.warn('CourseRepository.delete: Fallback sang Mock Store');
      const initLen = mockCourses.length;
      mockCourses = mockCourses.filter((c) => c.id !== id);
      return mockCourses.length < initLen;
    }
  }
}
