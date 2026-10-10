import { Router } from 'express';
import { StaffController } from '../controllers/staff.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Yêu cầu xác thực JWT cho toàn bộ routes nhân sự
router.use(verifyToken);

/**
 * @route GET /api/staff/teachers
 * @desc  Lấy danh sách giảng viên kèm lịch dạy (cho phép cả ADMIN & ACADEMIC)
 */
router.get(
  '/teachers',
  authorizeRoles('ADMIN', 'ACADEMIC'),
  StaffController.getTeachers
);

/**
 * @route GET /api/staff
 * @desc  Lấy danh sách nhân viên kèm bộ lọc, tìm kiếm và phân trang (Admin Only)
 */
router.get(
  '/',
  authorizeRoles('ADMIN'),
  StaffController.getStaffs
);

/**
 * @route GET /api/staff/:id
 * @desc  Lấy thông tin chi tiết một nhân viên (Admin Only)
 */
router.get(
  '/:id',
  authorizeRoles('ADMIN'),
  StaffController.getStaffById
);

/**
 * @route POST /api/staff
 * @desc  Tạo mới tài khoản nhân viên (Admin Only)
 */
router.post(
  '/',
  authorizeRoles('ADMIN'),
  StaffController.createStaff
);

/**
 * @route PUT /api/staff/:id
 * @desc  Cập nhật thông tin nhân viên (Admin Only)
 */
router.put(
  '/:id',
  authorizeRoles('ADMIN'),
  StaffController.updateStaff
);

/**
 * @route PATCH /api/staff/:id/status
 * @desc  Kích hoạt hoặc vô hiệu hóa / khóa tài khoản nhân viên (Admin Only)
 */
router.patch(
  '/:id/status',
  authorizeRoles('ADMIN'),
  StaffController.updateStaffStatus
);

/**
 * @route POST /api/staff/:id/reset-password
 * @desc  Đặt lại mật khẩu cho nhân viên (Admin Only)
 */
router.post(
  '/:id/reset-password',
  authorizeRoles('ADMIN'),
  StaffController.resetPassword
);

/**
 * @route DELETE /api/staff/:id
 * @desc  Xóa tài khoản nhân viên (Admin Only)
 */
router.delete(
  '/:id',
  authorizeRoles('ADMIN'),
  StaffController.deleteStaff
);

export default router;
