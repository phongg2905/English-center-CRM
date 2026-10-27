import { Request, Response, NextFunction } from 'express';
import { CourseService } from '../services/course.service.js';
import { AuditLogService } from '../services/audit-log.service.js';
import { ApiResponse } from '../utils/response.js';
import { isTeacher, stripFinance } from '../utils/teacher-scope.js';

export class CourseController {
  /**
   * @route GET /api/courses
   * @desc  Lấy danh sách tất cả khóa học đào tạo (có lọc theo isActive và search)
   */
  static async getCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isActive, search } = req.query;
      const filter: { isActive?: boolean; search?: string } = {};

      if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }
      if (search) {
        filter.search = String(search);
      }

      const courses = await CourseService.getAllCourses(filter);
      const data = isTeacher(req) ? courses.map((c) => stripFinance(c)) : courses;
      ApiResponse.success(res, data, 'Lấy danh sách khóa học thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/courses/:id
   * @desc  Lấy thông tin chi tiết một khóa học
   */
  static async getCourseById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const course = await CourseService.getCourseById(id);
      const data = isTeacher(req) ? stripFinance(course) : course;
      ApiResponse.success(res, data, 'Lấy chi tiết khóa học thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/courses
   * @desc  Tạo mới một khóa học trong danh mục đào tạo
   */
  static async createCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const course = await CourseService.createCourse(req.body);
      const user = (req as any).user;
      await AuditLogService.log({
        userId: user?.userId ?? user?.id ?? null,
        username: user?.username ?? 'system',
        userRole: user?.role ?? 'SYSTEM',
        ipAddress: req.ip ?? null,
        module: 'COURSES',
        action: 'CREATE',
        targetId: String(course.id),
        targetLabel: `${course.courseCode} - ${course.courseName}`,
        description: `Tạo khóa học đào tạo mới: ${course.courseName} (${course.courseCode})`,
        metadata: {
          courseCode: course.courseCode,
          standardTuition: course.standardTuition,
          totalLessons: course.totalLessons,
        },
      });
      ApiResponse.success(res, course, 'Tạo mới khóa học thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route PUT /api/courses/:id
   * @desc  Cập nhật thông tin khóa học
   */
  static async updateCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await CourseService.updateCourse(id, req.body);
      const user = (req as any).user;
      await AuditLogService.log({
        userId: user?.userId ?? user?.id ?? null,
        username: user?.username ?? 'system',
        userRole: user?.role ?? 'SYSTEM',
        ipAddress: req.ip ?? null,
        module: 'COURSES',
        action: 'UPDATE',
        targetId: String(updated.id),
        targetLabel: `${updated.courseCode} - ${updated.courseName}`,
        description: `Cập nhật khóa học đào tạo: ${updated.courseName} (${updated.courseCode})`,
        metadata: req.body,
      });
      ApiResponse.success(res, updated, 'Cập nhật khóa học thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route DELETE /api/courses/:id
   * @desc  Xóa một khóa học
   */
  static async deleteCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = await CourseService.getCourseById(id).catch(() => null);
      await CourseService.deleteCourse(id);
      const user = (req as any).user;
      await AuditLogService.log({
        userId: user?.userId ?? user?.id ?? null,
        username: user?.username ?? 'system',
        userRole: user?.role ?? 'SYSTEM',
        ipAddress: req.ip ?? null,
        module: 'COURSES',
        action: 'DELETE',
        targetId: String(id),
        targetLabel: existing ? `${existing.courseCode} - ${existing.courseName}` : `Course #${id}`,
        description: `Xóa khóa học đào tạo: ${existing?.courseName || `#${id}`}`,
      });
      ApiResponse.success(res, null, 'Xóa khóa học thành công');
    } catch (error) {
      next(error);
    }
  }
}
