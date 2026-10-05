import { CourseRepository } from '../repositories/course.repository.js';
import { Course, CreateCourseDto, UpdateCourseDto } from '../types/academic.types.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export class CourseService {
  static async getAllCourses(filter?: { isActive?: boolean; search?: string }): Promise<Course[]> {
    return CourseRepository.findAll(filter);
  }

  static async getCourseById(id: number): Promise<Course> {
    const course = await CourseRepository.findById(id);
    if (!course) {
      throw AppError.notFound(`Không tìm thấy khóa học với ID = ${id}`);
    }
    return course;
  }

  static async createCourse(dto: CreateCourseDto): Promise<Course> {
    if (!dto.courseCode || !dto.courseCode.trim()) {
      throw AppError.badRequest('Mã khóa học (courseCode) là bắt buộc');
    }
    if (!dto.courseName || !dto.courseName.trim()) {
      throw AppError.badRequest('Tên khóa học (courseName) là bắt buộc');
    }
    if (typeof dto.totalLessons !== 'number' || dto.totalLessons <= 0) {
      throw AppError.badRequest('Tổng số buổi học (totalLessons) phải là số nguyên dương lớn hơn 0');
    }
    if (typeof dto.standardTuition !== 'number' || dto.standardTuition < 0) {
      throw AppError.badRequest('Học phí chuẩn (standardTuition) không được âm');
    }

    // Kiểm tra trùng mã khóa học
    const existing = await CourseRepository.findByCode(dto.courseCode);
    if (existing) {
      throw AppError.conflict(`Mã khóa học '${dto.courseCode}' đã tồn tại trong hệ thống`);
    }

    if (
      dto.minEntryScore !== undefined &&
      dto.minEntryScore !== null &&
      (dto.minEntryScore < 0 || dto.minEntryScore > 9.0)
    ) {
      throw AppError.badRequest('Điểm chuẩn đầu vào tối thiểu phải nằm trong thang 0.0 - 9.0');
    }

    if (
      dto.maxEntryScore !== undefined &&
      dto.maxEntryScore !== null &&
      (dto.maxEntryScore < 0 || dto.maxEntryScore > 9.0)
    ) {
      throw AppError.badRequest('Điểm chuẩn đầu vào tối đa phải nằm trong thang 0.0 - 9.0');
    }

    logger.info(`Tạo mới khóa học: ${dto.courseCode} - ${dto.courseName}`);
    return CourseRepository.create(dto);
  }

  static async updateCourse(id: number, dto: UpdateCourseDto): Promise<Course> {
    const course = await CourseRepository.findById(id);
    if (!course) {
      throw AppError.notFound(`Không tìm thấy khóa học với ID = ${id}`);
    }

    if (dto.courseCode && dto.courseCode.toLowerCase() !== course.courseCode.toLowerCase()) {
      const existing = await CourseRepository.findByCode(dto.courseCode);
      if (existing && existing.id !== id) {
        throw AppError.conflict(`Mã khóa học '${dto.courseCode}' đã thuộc về khóa học khác`);
      }
    }

    if (dto.totalLessons !== undefined && dto.totalLessons <= 0) {
      throw AppError.badRequest('Tổng số buổi học phải lớn hơn 0');
    }
    if (dto.standardTuition !== undefined && dto.standardTuition < 0) {
      throw AppError.badRequest('Học phí không được âm');
    }

    const updated = await CourseRepository.update(id, dto);
    if (!updated) {
      throw AppError.internal('Cập nhật khóa học không thành công');
    }
    return updated;
  }

  static async deleteCourse(id: number): Promise<void> {
    const course = await CourseRepository.findById(id);
    if (!course) {
      throw AppError.notFound(`Không tìm thấy khóa học với ID = ${id}`);
    }

    const success = await CourseRepository.delete(id);
    if (!success) {
      throw AppError.badRequest('Không thể xóa khóa học này (có thể đang có lớp học tham chiếu)');
    }
  }
}
