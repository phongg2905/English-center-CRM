import { Request, Response, NextFunction } from 'express';
import { EnrollmentService } from '../services/enrollment.service.js';
import { ApiResponse } from '../utils/response.js';

export class EnrollmentController {
  /**
   * @route POST /api/enrollments
   * @desc  Xếp lớp học viên (sinh mã STU-xxx, chuyển Lead sang ENROLLED, kiểm tra khóa sĩ số UC-SYS-02)
   */
  static async enrollStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const consultantId = (req as any).user?.id || 2;
      const enrollment = await EnrollmentService.enrollStudent(req.body, consultantId);
      ApiResponse.success(res, enrollment, 'Xếp lớp cho học viên thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/enrollments/:id/payments
   * @desc  Ghi nhận thanh toán học phí & cấp biên lai (REC-xxx)
   */
  static async recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enrollmentId = parseInt(req.params.id, 10);
      const receiverId = (req as any).user?.id || 1;
      const result = await EnrollmentService.recordPayment(enrollmentId, req.body, receiverId);
      ApiResponse.success(res, result, 'Ghi nhận thanh toán học phí thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/enrollments/:id/transfer
   * @desc  Chuyển lớp học cho học viên (kiểm tra sĩ số lớp mới)
   */
  static async transferClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enrollmentId = parseInt(req.params.id, 10);
      const userId = (req as any).user?.id || 1;
      const result = await EnrollmentService.transferClass(enrollmentId, req.body, userId);
      ApiResponse.success(res, result, 'Chuyển lớp học viên thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/enrollments
   * @desc  Lấy danh sách các hồ sơ ghi danh / xếp lớp
   */
  static async getEnrollments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { classId, studentId, paymentStatus, status, search } = req.query;
      const filter: {
        classId?: number;
        studentId?: number;
        paymentStatus?: string;
        status?: string;
        search?: string;
      } = {};

      if (classId) filter.classId = Number(classId);
      if (studentId) filter.studentId = Number(studentId);
      if (paymentStatus) filter.paymentStatus = String(paymentStatus);
      if (status) filter.status = String(status);
      if (search) filter.search = String(search);

      const enrollments = await EnrollmentService.getEnrollments(filter);
      ApiResponse.success(res, enrollments, 'Lấy danh sách hồ sơ ghi danh thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/enrollments/:id
   * @desc  Lấy chi tiết hồ sơ ghi danh
   */
  static async getEnrollmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const en = await EnrollmentService.getEnrollmentById(id);
      ApiResponse.success(res, en, 'Lấy chi tiết hồ sơ ghi danh thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/enrollments/:id/receipts
   * @desc  Lấy danh sách các biên lai thu tiền của hồ sơ ghi danh
   */
  static async getPaymentReceipts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const receipts = await EnrollmentService.getPaymentReceipts(id);
      ApiResponse.success(res, receipts, 'Lấy danh sách biên lai thu tiền thành công');
    } catch (error) {
      next(error);
    }
  }
}
