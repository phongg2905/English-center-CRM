import { Router } from 'express';
import { CourseController } from '../controllers/course.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Yêu cầu xác thực JWT cho tất cả routes
router.use(verifyToken);

/**
 * @route GET /api/courses
 * @desc  Lấy danh sách khóa học
 */
router.get(
  '/',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC', 'TEACHER'), // TEACHER: chỉ xem (lọc theo lớp phụ trách, ẩn học phí)
  CourseController.getCourses
);

/**
 * @route GET /api/courses/:id
 * @desc  Lấy thông tin chi tiết một khóa học
 */
router.get(
  '/:id',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC', 'TEACHER'), // TEACHER: chỉ xem (lọc theo lớp phụ trách, ẩn học phí)
  CourseController.getCourseById
);

/**
 * @route POST /api/courses
 * @desc  Tạo mới khóa học
 */
router.post(
  '/',
  authorizeRoles('ADMIN', 'ACADEMIC'),
  CourseController.createCourse
);

/**
 * @route PUT /api/courses/:id
 * @desc  Cập nhật khóa học
 */
router.put(
  '/:id',
  authorizeRoles('ADMIN', 'ACADEMIC'),
  CourseController.updateCourse
);

/**
 * @route DELETE /api/courses/:id
 * @desc  Xóa khóa học (Chỉ ADMIN được phép xóa danh mục khóa học theo ma trận RBAC)
 */
router.delete(
  '/:id',
  authorizeRoles('ADMIN'),
  CourseController.deleteCourse
);

export default router;
