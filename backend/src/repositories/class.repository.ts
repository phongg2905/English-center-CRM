import { query, isDbAvailable } from '../database/pool.js';
import {
  ClassModel,
  ClassWithCourse,
  CreateClassDto,
  UpdateClassDto,
  ClassStatus,
  ScheduleDays,
} from '../types/academic.types.js';
import { logger } from '../utils/logger.js';

let mockClasses: ClassWithCourse[] = [
  {
    id: 1,
    courseId: 2,
    classCode: 'IELTS-K26-T246',
    className: 'IELTS Bứt phá K26 (Tối 2-4-6)',
    scheduleDays: 'MON_WED_FRI',
    timeSlot: '18:00 - 19:30',
    room: 'Phòng 302',
    teacherName: 'Ms. Emily Nguyễn (8.5 IELTS)',
    startDate: '2026-10-15',
    maxCapacity: 15,
    currentEnrolled: 0,
    status: 'OPEN',
    courseCode: 'IELTS-FIGHT',
    courseName: 'IELTS Bứt phá (Target 6.5)',
    standardTuition: 8500000.0,
    targetOutput: 'IELTS 6.0 - 6.5',
    availableSeats: 15,
    isFull: false,
    createdAt: new Date('2026-09-10T08:00:00Z'),
    updatedAt: new Date('2026-09-10T08:00:00Z'),
  },
  {
    id: 2,
    courseId: 2,
    classCode: 'IELTS-K27-T357',
    className: 'IELTS Bứt phá K27 (Tối 3-5-7)',
    scheduleDays: 'TUE_THU_SAT',
    timeSlot: '19:45 - 21:15',
    room: 'Phòng 201',
    teacherName: 'Mr. David Trần (8.0 IELTS)',
    startDate: '2026-10-20',
    maxCapacity: 12,
    currentEnrolled: 0,
    status: 'OPEN',
    courseCode: 'IELTS-FIGHT',
    courseName: 'IELTS Bứt phá (Target 6.5)',
    standardTuition: 8500000.0,
    targetOutput: 'IELTS 6.0 - 6.5',
    availableSeats: 12,
    isFull: false,
    createdAt: new Date('2026-09-12T08:00:00Z'),
    updatedAt: new Date('2026-09-12T08:00:00Z'),
  },
  {
    id: 3,
    courseId: 1,
    classCode: 'IELTS-F20-T246',
    className: 'IELTS Nền tảng F20',
    scheduleDays: 'MON_WED_FRI',
    timeSlot: '19:45 - 21:15',
    room: 'Phòng 101',
    teacherName: 'Ms. Sarah Lê (8.0 IELTS)',
    startDate: '2026-10-18',
    maxCapacity: 15,
    currentEnrolled: 0,
    status: 'OPEN',
    courseCode: 'IELTS-FOUND',
    courseName: 'IELTS Nền tảng (Foundation)',
    standardTuition: 6500000.0,
    targetOutput: 'IELTS 4.5 - 5.5',
    availableSeats: 15,
    isFull: false,
    createdAt: new Date('2026-09-15T08:00:00Z'),
    updatedAt: new Date('2026-09-15T08:00:00Z'),
  },
];

let nextClassId = 4;

function mapRowToClassWithCourse(row: any): ClassWithCourse {
  const maxCapacity = Number(row.max_capacity);
  const currentEnrolled = Number(row.current_enrolled);
  const availableSeats = Math.max(0, maxCapacity - currentEnrolled);
  const isFull = currentEnrolled >= maxCapacity || row.status === 'FULL';

  return {
    id: Number(row.id),
    courseId: Number(row.course_id),
    classCode: row.class_code,
    className: row.class_name,
    scheduleDays: row.schedule_days as ScheduleDays,
    timeSlot: row.time_slot,
    room: row.room,
    teacherName: row.teacher_name,
    startDate: row.start_date ? String(row.start_date).split('T')[0] : '',
    maxCapacity,
    currentEnrolled,
    status: row.status as ClassStatus,
    courseCode: row.course_code || '',
    courseName: row.course_name || '',
    standardTuition: Number(row.standard_tuition || 0),
    targetOutput: row.target_output || null,
    availableSeats,
    isFull,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class ClassRepository {
  static async findAll(filter?: {
    courseId?: number;
    status?: ClassStatus;
    scheduleDays?: ScheduleDays;
    search?: string;
  }): Promise<ClassWithCourse[]> {
    try {
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
    } catch (err) {
      logger.warn('ClassRepository.findAll: Fallback sang Mock Store');
      let classes = [...mockClasses];
      if (filter?.courseId) {
        classes = classes.filter((c) => c.courseId === filter.courseId);
      }
      if (filter?.status) {
        classes = classes.filter((c) => c.status === filter.status);
      }
      if (filter?.scheduleDays) {
        classes = classes.filter((c) => c.scheduleDays === filter.scheduleDays);
      }
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        classes = classes.filter(
          (c) =>
            c.className.toLowerCase().includes(q) ||
            c.classCode.toLowerCase().includes(q) ||
            (c.teacherName && c.teacherName.toLowerCase().includes(q))
        );
      }
      return classes;
    }
  }

  static async findById(id: number): Promise<ClassWithCourse | null> {
    try {
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
    } catch (err) {
      logger.warn('ClassRepository.findById: Fallback sang Mock Store');
      return mockClasses.find((c) => c.id === id) || null;
    }
  }

  static async findByCode(code: string): Promise<ClassWithCourse | null> {
    try {
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
    } catch (err) {
      logger.warn('ClassRepository.findByCode: Fallback sang Mock Store');
      return mockClasses.find((c) => c.classCode.toLowerCase() === code.toLowerCase()) || null;
    }
  }

  static async create(dto: CreateClassDto): Promise<ClassWithCourse> {
    try {
      const sql = `
        INSERT INTO classes (
          course_id, class_code, class_name, schedule_days, time_slot,
          room, teacher_name, start_date, max_capacity, current_enrolled, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, 'OPEN')
        RETURNING *
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
    } catch (err) {
      logger.warn('ClassRepository.create: Fallback sang Mock Store');
      const now = new Date();
      const maxCap = dto.maxCapacity ?? 15;
      const newClass: ClassWithCourse = {
        id: nextClassId++,
        courseId: dto.courseId,
        classCode: dto.classCode.trim().toUpperCase(),
        className: dto.className.trim(),
        scheduleDays: dto.scheduleDays,
        timeSlot: dto.timeSlot.trim(),
        room: dto.room?.trim() ?? null,
        teacherName: dto.teacherName?.trim() ?? null,
        startDate: dto.startDate,
        maxCapacity: maxCap,
        currentEnrolled: 0,
        status: 'OPEN',
        courseCode: `COURSE-${dto.courseId}`,
        courseName: 'Khóa học',
        standardTuition: 0,
        availableSeats: maxCap,
        isFull: false,
        createdAt: now,
        updatedAt: now,
      };
      mockClasses.push(newClass);
      return newClass;
    }
  }

  static async update(id: number, dto: UpdateClassDto): Promise<ClassWithCourse | null> {
    try {
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
    } catch (err) {
      logger.warn('ClassRepository.update: Fallback sang Mock Store');
      const idx = mockClasses.findIndex((c) => c.id === id);
      if (idx === -1) return null;

      mockClasses[idx] = {
        ...mockClasses[idx],
        ...dto,
        classCode: dto.classCode ? dto.classCode.trim().toUpperCase() : mockClasses[idx].classCode,
        className: dto.className ? dto.className.trim() : mockClasses[idx].className,
        updatedAt: new Date(),
      };
      mockClasses[idx].availableSeats = Math.max(
        0,
        mockClasses[idx].maxCapacity - mockClasses[idx].currentEnrolled
      );
      mockClasses[idx].isFull = mockClasses[idx].availableSeats === 0;
      return mockClasses[idx];
    }
  }

  static async delete(id: number): Promise<boolean> {
    try {
      const sql = `DELETE FROM classes WHERE id = $1`;
      const result = await query(sql, [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (err) {
      logger.warn('ClassRepository.delete: Fallback sang Mock Store');
      const initLen = mockClasses.length;
      mockClasses = mockClasses.filter((c) => c.id !== id);
      return mockClasses.length < initLen;
    }
  }

  static async updateCurrentEnrolled(classId: number, currentEnrolled: number, isFull: boolean): Promise<void> {
    try {
      const status = isFull ? 'FULL' : 'OPEN';
      const sql = `
        UPDATE classes
        SET current_enrolled = $1,
            status = CASE WHEN status IN ('PLANNING', 'IN_PROGRESS', 'COMPLETED') THEN status ELSE $2 END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `;
      await query(sql, [currentEnrolled, status, classId]);
    } catch (err) {
      const c = mockClasses.find((item) => item.id === classId);
      if (c) {
        c.currentEnrolled = currentEnrolled;
        c.availableSeats = Math.max(0, c.maxCapacity - currentEnrolled);
        c.isFull = isFull;
        if (c.status === 'OPEN' || c.status === 'FULL') {
          c.status = isFull ? 'FULL' : 'OPEN';
        }
      }
    }
  }
}
