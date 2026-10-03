import { Request, Response, NextFunction } from 'express';
import { PlacementTestService } from '../services/placement-test.service.js';
import { ApiResponse } from '../utils/response.js';
import { AppError } from '../utils/AppError.js';
import {
  TestType,
  AttendanceStatus,
  PlacementTestFilterQuery,
} from '../types/placement-test.types.js';

export class PlacementTestController {
  /**
   * @route POST /api/placement-tests/book
   * @desc  Đặt lịch hẹn Placement Test cho Lead (chống trùng & kiểm tra sức chứa phòng)
   */
  static async bookTest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { leadId, testDate, timeSlot, room, testType, notes } = req.body;

      if (!leadId) {
        throw AppError.badRequest('Vui lòng cung cấp mã Lead (leadId)');
      }
      if (!testDate) {
        throw AppError.badRequest('Vui lòng chọn ngày thi (testDate: YYYY-MM-DD)');
      }
      if (!timeSlot) {
        throw AppError.badRequest('Vui lòng chọn khung giờ thi (timeSlot)');
      }

      const userId = (req as any).user?.id || 1;
      const userRole = (req as any).user?.role || 'SALES';

      const result = await PlacementTestService.bookTest(
        {
          leadId: Number(leadId),
          testDate,
          timeSlot,
          room,
          testType,
          notes,
        },
        userId,
        userRole
      );

      ApiResponse.created(res, result, 'Đặt lịch hẹn kiểm tra trình độ thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/placement-tests
   * @desc  Lấy danh sách các ca thi và thí sinh theo ngày/tuần có phân trang & lọc
   */
  static async getTests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        date,
        startDate,
        endDate,
        timeSlot,
        room,
        testType,
        attendanceStatus,
        search,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const filters: PlacementTestFilterQuery = {
        date: date as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        timeSlot: timeSlot as string | undefined,
        room: room as string | undefined,
        testType: testType as TestType | undefined,
        attendanceStatus: attendanceStatus as AttendanceStatus | undefined,
        search: search as string | undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        sortBy: sortBy as 'test_date' | 'created_at' | 'overall_score' | undefined,
        sortOrder: sortOrder as 'ASC' | 'DESC' | undefined,
      };

      const result = await PlacementTestService.getTests(filters);

      ApiResponse.success(
        res,
        result.tests,
        'Lấy danh sách bài kiểm tra trình độ thành công',
        200,
        {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/placement-tests/availability
   * @desc  Lấy thông tin sức chứa và các ca thi theo phòng (phục vụ Calendar View)
   */
  static async getAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate, room } = req.query;

      const result = await PlacementTestService.getShiftsAvailability(
        startDate as string,
        endDate as string,
        room as string | undefined
      );

      ApiResponse.success(res, result, 'Lấy trạng thái khả dụng của ca thi thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/placement-tests/recommend-course
   * @desc  Thuật toán độc lập gợi ý khóa học phù hợp theo điểm Overall (UC-SYS-03)
   */
  static async recommendCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { overallScore, testType, interest } = req.query;

      if (overallScore === undefined) {
        throw AppError.badRequest('Vui lòng cung cấp điểm Overall Score để nhận đề xuất khóa học');
      }

      const scoreNum = Number(overallScore);
      if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 9.0) {
        throw AppError.badRequest('Điểm Overall Score phải là số từ 0.0 đến 9.0');
      }

      const recommendation = await PlacementTestService.recommendCourse(
        scoreNum,
        (testType as string) || 'IELTS',
        interest as string | undefined
      );

      ApiResponse.success(res, recommendation, 'Gợi ý khóa học phù hợp thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/placement-tests/:id
   * @desc  Lấy thông tin chi tiết một bài thi (kèm đề xuất lớp học mở)
   */
  static async getTestById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await PlacementTestService.getTestById(Number(id));
      ApiResponse.success(res, result, 'Lấy chi tiết bài thi thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route PATCH /api/placement-tests/:id/attendance
   * @desc  Điểm danh thí sinh trong ca thi (PRESENT / ABSENT / CANCELLED / SCHEDULED)
   */
  static async updateAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { attendanceStatus, notes } = req.body;

      if (!attendanceStatus) {
        throw AppError.badRequest(
          'Vui lòng cung cấp trạng thái điểm danh (attendanceStatus: PRESENT | ABSENT | CANCELLED | SCHEDULED)'
        );
      }

      const userId = (req as any).user?.id || 1;
      const userRole = (req as any).user?.role || 'ACADEMIC';

      const updated = await PlacementTestService.updateAttendance(
        Number(id),
        { attendanceStatus, notes },
        userId,
        userRole
      );

      ApiResponse.success(res, updated, 'Cập nhật trạng thái điểm danh thí sinh thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/placement-tests/:id/score
   * @desc  Nhập điểm 4 kỹ năng, tự động tính Overall Score và kích hoạt thuật toán đề xuất khóa học (UC-SYS-03)
   */
  static async recordScore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const {
        listeningScore,
        readingScore,
        writingScore,
        speakingScore,
        overallScore,
        examinerFeedback,
        suggestedCourseId,
      } = req.body;

      const userId = (req as any).user?.id || 1;
      const userRole = (req as any).user?.role || 'ACADEMIC';

      const result = await PlacementTestService.recordScore(
        Number(id),
        {
          listeningScore: listeningScore !== undefined ? Number(listeningScore) : undefined,
          readingScore: readingScore !== undefined ? Number(readingScore) : undefined,
          writingScore: writingScore !== undefined ? Number(writingScore) : undefined,
          speakingScore: speakingScore !== undefined ? Number(speakingScore) : undefined,
          overallScore: overallScore !== undefined ? Number(overallScore) : undefined,
          examinerFeedback,
          suggestedCourseId: suggestedCourseId ? Number(suggestedCourseId) : undefined,
        },
        userId,
        userRole
      );

      ApiResponse.success(res, result, 'Nhập điểm và sinh đề xuất lộ trình khóa học thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route DELETE /api/placement-tests/:id
   * @desc  Hủy ca thi
   */
  static async cancelTest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || 1;

      await PlacementTestService.cancelTest(Number(id), userId);
      ApiResponse.success(res, null, 'Hủy lịch thi thành công');
    } catch (error) {
      next(error);
    }
  }
}
