import { Request, Response, NextFunction } from 'express';
import { CourseService } from '../services/course.service.js';
import { ApiResponse } from '../utils/response.js';

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
      ApiResponse.success(res, courses, 'Lấy danh sách khóa học thành công');
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
      ApiResponse.success(res, course, 'Lấy chi tiết khóa học thành công');
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
      await CourseService.deleteCourse(id);
      ApiResponse.success(res, null, 'Xóa khóa học thành công');
    } catch (error) {
      next(error);
    }
  }
}
