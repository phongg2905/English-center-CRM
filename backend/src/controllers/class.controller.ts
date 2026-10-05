import { Request, Response, NextFunction } from 'express';
import { ClassService } from '../services/class.service.js';
import { ApiResponse } from '../utils/response.js';
import { ClassStatus, ScheduleDays } from '../types/academic.types.js';

export class ClassController {
  /**
   * @route GET /api/classes
   * @desc  Lấy danh sách các lớp học (lọc theo courseId, status, scheduleDays, search)
   */
  static async getClasses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId, status, scheduleDays, search } = req.query;
      const filter: {
        courseId?: number;
        status?: ClassStatus;
        scheduleDays?: ScheduleDays;
        search?: string;
      } = {};

      if (courseId) filter.courseId = Number(courseId);
      if (status) filter.status = status as ClassStatus;
      if (scheduleDays) filter.scheduleDays = scheduleDays as ScheduleDays;
      if (search) filter.search = String(search);

      const classes = await ClassService.getAllClasses(filter);
      ApiResponse.success(res, classes, 'Lấy danh sách lớp học thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/classes/:id
   * @desc  Lấy thông tin chi tiết một lớp học
   */
  static async getClassById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const cls = await ClassService.getClassById(id);
      ApiResponse.success(res, cls, 'Lấy chi tiết lớp học thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/classes/:id/availability
   * @desc  Kiểm tra sĩ số khả dụng & trạng thái tự khóa ghi danh của lớp học (UC-SYS-02)
   */
  static async checkAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const avail = await ClassService.checkClassAvailability(id);
      ApiResponse.success(res, avail, 'Kiểm tra sĩ số khả dụng thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/classes
   * @desc  Mở một lớp học mới
   */
  static async createClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newClass = await ClassService.createClass(req.body);
      ApiResponse.success(res, newClass, 'Tạo mới lớp học thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route PUT /api/classes/:id
   * @desc  Cập nhật thông tin lớp học
   */
  static async updateClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await ClassService.updateClass(id, req.body);
      ApiResponse.success(res, updated, 'Cập nhật lớp học thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route DELETE /api/classes/:id
   * @desc  Xóa một lớp học
   */
  static async deleteClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await ClassService.deleteClass(id);
      ApiResponse.success(res, null, 'Xóa lớp học thành công');
    } catch (error) {
      next(error);
    }
  }
}
