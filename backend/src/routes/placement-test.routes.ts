import { Router } from 'express';
import { PlacementTestController } from '../controllers/placement-test.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Tất cả các route /api/placement-tests đều yêu cầu đăng nhập (JWT Authentication)
router.use(verifyToken);

/**
 * @route POST /api/placement-tests/book
 * @desc  Đặt lịch thi Placement Test (chống trùng lịch & kiểm tra sức chứa phòng thi)
 */
router.post(
  '/book',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  PlacementTestController.bookTest
);

/**
 * @route GET /api/placement-tests/availability
 * @desc  Lấy thông tin sức chứa và các ca thi theo phòng (phục vụ Calendar View)
 */
router.get(
  '/availability',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  PlacementTestController.getAvailability
);

/**
 * @route GET /api/placement-tests/recommend-course
 * @desc  Thuật toán độc lập gợi ý khóa học phù hợp theo điểm Overall (UC-SYS-03)
 */
router.get(
  '/recommend-course',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  PlacementTestController.recommendCourse
);

/**
 * @route GET /api/placement-tests
 * @desc  Lấy danh sách các ca thi và thí sinh theo ngày/tuần có phân trang & lọc
 */
router.get(
  '/',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  PlacementTestController.getTests
);

/**
 * @route GET /api/placement-tests/:id
 * @desc  Lấy thông tin chi tiết một bài thi (kèm đề xuất lớp học mở)
 */
router.get(
  '/:id',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  PlacementTestController.getTestById
);

/**
 * @route PATCH /api/placement-tests/:id/attendance
 * @desc  Điểm danh thí sinh trong ca thi (PRESENT, ABSENT, CANCELLED, SCHEDULED)
 */
router.patch(
  '/:id/attendance',
  authorizeRoles('ADMIN', 'ACADEMIC', 'SALES'),
  PlacementTestController.updateAttendance
);

/**
 * @route POST /api/placement-tests/:id/score
 * @desc  Nhập điểm 4 kỹ năng & kích hoạt thuật toán đề xuất khóa học (UC-SYS-03)
 */
router.post(
  '/:id/score',
  authorizeRoles('ADMIN', 'ACADEMIC'),
  PlacementTestController.recordScore
);

/**
 * @route DELETE /api/placement-tests/shift/cancel
 * @desc  Hủy và xóa toàn bộ ca thi
 */
router.delete(
  '/shift/cancel',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  PlacementTestController.deleteShift
);

/**
 * @route DELETE /api/placement-tests/:id
 * @desc  Xóa hoàn toàn thí sinh khỏi ca thi
 */
router.delete(
  '/:id',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  PlacementTestController.deleteTest
);

/**
 * @route POST /api/placement-tests/:id/cancel
 * @desc  Hủy ca thi (chuyển trạng thái CANCELLED)
 */
router.post(
  '/:id/cancel',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  PlacementTestController.cancelTest
);

export default router;
