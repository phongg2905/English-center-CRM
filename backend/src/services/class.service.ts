import { ClassRepository } from '../repositories/class.repository.js';
import { CourseRepository } from '../repositories/course.repository.js';
import {
  ClassWithCourse,
  CreateClassDto,
  UpdateClassDto,
  ClassStatus,
  ScheduleDays,
} from '../types/academic.types.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export class ClassService {
  static async getAllClasses(filter?: {
    courseId?: number;
    status?: ClassStatus;
    scheduleDays?: ScheduleDays;
    search?: string;
  }): Promise<ClassWithCourse[]> {
    return ClassRepository.findAll(filter);
  }

  static async getClassById(id: number): Promise<ClassWithCourse> {
    const cls = await ClassRepository.findById(id);
    if (!cls) {
      throw AppError.notFound(`Không tìm thấy lớp học với ID = ${id}`);
    }
    return cls;
  }

  static async createClass(dto: CreateClassDto): Promise<ClassWithCourse> {
    if (!dto.courseId) {
      throw AppError.badRequest('courseId là bắt buộc');
    }
    if (!dto.classCode || !dto.classCode.trim()) {
      throw AppError.badRequest('Mã lớp học (classCode) là bắt buộc');
    }
    if (!dto.className || !dto.className.trim()) {
      throw AppError.badRequest('Tên lớp học (className) là bắt buộc');
    }
    if (!dto.scheduleDays || !['MON_WED_FRI', 'TUE_THU_SAT', 'WEEKEND'].includes(dto.scheduleDays)) {
      throw AppError.badRequest(
        "Lịch học (scheduleDays) phải là một trong các giá trị: 'MON_WED_FRI', 'TUE_THU_SAT', 'WEEKEND'"
      );
    }
    if (!dto.timeSlot || !dto.timeSlot.trim()) {
      throw AppError.badRequest('Ca học (timeSlot) là bắt buộc (ví dụ: 18:00 - 19:30)');
    }
    if (!dto.startDate) {
      throw AppError.badRequest('Ngày khai giảng (startDate) là bắt buộc');
    }

    const course = await CourseRepository.findById(dto.courseId);
    if (!course) {
      throw AppError.notFound(`Khóa học với ID = ${dto.courseId} không tồn tại`);
    }

    const existing = await ClassRepository.findByCode(dto.classCode);
    if (existing) {
      throw AppError.conflict(`Mã lớp học '${dto.classCode}' đã tồn tại trong hệ thống`);
    }

    if (dto.maxCapacity !== undefined && dto.maxCapacity <= 0) {
      throw AppError.badRequest('Sĩ số tối đa (maxCapacity) phải lớn hơn 0');
    }

    logger.info(`Tạo mới lớp học: ${dto.classCode} (${course.courseName})`);
    return ClassRepository.create(dto);
  }

  static async updateClass(id: number, dto: UpdateClassDto): Promise<ClassWithCourse> {
    const cls = await ClassRepository.findById(id);
    if (!cls) {
      throw AppError.notFound(`Không tìm thấy lớp học với ID = ${id}`);
    }

    if (dto.courseId && dto.courseId !== cls.courseId) {
      const course = await CourseRepository.findById(dto.courseId);
      if (!course) {
        throw AppError.notFound(`Khóa học với ID = ${dto.courseId} không tồn tại`);
      }
    }

    if (dto.classCode && dto.classCode.toLowerCase() !== cls.classCode.toLowerCase()) {
      const existing = await ClassRepository.findByCode(dto.classCode);
      if (existing && existing.id !== id) {
        throw AppError.conflict(`Mã lớp học '${dto.classCode}' đã thuộc về lớp học khác`);
      }
    }

    if (dto.scheduleDays && !['MON_WED_FRI', 'TUE_THU_SAT', 'WEEKEND'].includes(dto.scheduleDays)) {
      throw AppError.badRequest('Lịch học không hợp lệ');
    }

    if (dto.maxCapacity !== undefined) {
      if (dto.maxCapacity <= 0) {
        throw AppError.badRequest('Sĩ số tối đa phải lớn hơn 0');
      }
      if (dto.maxCapacity < cls.currentEnrolled) {
        throw AppError.badRequest(
          `Không thể giảm sĩ số tối đa xuống ${dto.maxCapacity} vì lớp hiện đã có ${cls.currentEnrolled} học viên đang học`
        );
      }
    }

    const updated = await ClassRepository.update(id, dto);
    if (!updated) {
      throw AppError.internal('Cập nhật lớp học không thành công');
    }
    return updated;
  }

  static async deleteClass(id: number): Promise<void> {
    const cls = await ClassRepository.findById(id);
    if (!cls) {
      throw AppError.notFound(`Không tìm thấy lớp học với ID = ${id}`);
    }

    if (cls.currentEnrolled > 0) {
      throw AppError.badRequest(
        `Không thể xóa lớp học '${cls.classCode}' vì đang có ${cls.currentEnrolled} học viên đã ghi danh. Vui lòng chuyển lớp cho học viên trước.`
      );
    }

    const success = await ClassRepository.delete(id);
    if (!success) {
      throw AppError.internal('Xóa lớp học không thành công');
    }
  }

  /**
   * Thuật toán kiểm tra sĩ số khả dụng & trạng thái tự khóa ghi danh (UC-SYS-02)
   */
  static async checkClassAvailability(id: number): Promise<{
    classId: number;
    className: string;
    classCode: string;
    currentEnrolled: number;
    maxCapacity: number;
    availableSeats: number;
    isFull: boolean;
    status: ClassStatus;
  }> {
    const cls = await this.getClassById(id);
    return {
      classId: cls.id,
      className: cls.className,
      classCode: cls.classCode,
      currentEnrolled: cls.currentEnrolled,
      maxCapacity: cls.maxCapacity,
      availableSeats: cls.availableSeats,
      isFull: cls.isFull,
      status: cls.status,
    };
  }
}
