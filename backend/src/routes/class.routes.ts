import { Router } from 'express';
import { ClassController } from '../controllers/class.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Yêu cầu xác thực JWT cho tất cả routes
router.use(verifyToken);

/**
 * @route GET /api/classes
 * @desc  Lấy danh sách các lớp học
 */
router.get(
  '/',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  ClassController.getClasses
);

/**
 * @route GET /api/classes/:id/availability
 * @desc  Kiểm tra sĩ số khả dụng & trạng thái tự khóa ghi danh của lớp học (UC-SYS-02)
 */
router.get(
  '/:id/availability',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  ClassController.checkAvailability
);

/**
 * @route GET /api/classes/:id
 * @desc  Lấy thông tin chi tiết một lớp học
 */
router.get(
  '/:id',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  ClassController.getClassById
);

/**
 * @route POST /api/classes
 * @desc  Tạo mới một lớp học
 */
router.post(
  '/',
  authorizeRoles('ADMIN', 'ACADEMIC'),
  ClassController.createClass
);

/**
 * @route PUT /api/classes/:id
 * @desc  Cập nhật thông tin lớp học
 */
router.put(
  '/:id',
  authorizeRoles('ADMIN', 'ACADEMIC'),
  ClassController.updateClass
);

/**
 * @route DELETE /api/classes/:id
 * @desc  Xóa một lớp học
 */
router.delete(
  '/:id',
  authorizeRoles('ADMIN', 'ACADEMIC'),
  ClassController.deleteClass
);

export default router;
