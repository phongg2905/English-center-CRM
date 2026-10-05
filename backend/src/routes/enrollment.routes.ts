import { Router } from 'express';
import { EnrollmentController } from '../controllers/enrollment.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Yêu cầu xác thực JWT cho tất cả routes
router.use(verifyToken);

/**
 * @route POST /api/enrollments
 * @desc  Xếp lớp học viên (tự động sinh mã STU-xxx, chuyển Lead sang ENROLLED, kiểm tra khóa sĩ số UC-SYS-02)
 */
router.post(
  '/',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  EnrollmentController.enrollStudent
);

/**
 * @route GET /api/enrollments
 * @desc  Lấy danh sách các hồ sơ ghi danh / xếp lớp
 */
router.get(
  '/',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  EnrollmentController.getEnrollments
);

/**
 * @route GET /api/enrollments/:id
 * @desc  Lấy chi tiết một hồ sơ ghi danh
 */
router.get(
  '/:id',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  EnrollmentController.getEnrollmentById
);

/**
 * @route POST /api/enrollments/:id/payments
 * @desc  Ghi nhận thu học phí & cấp biên lai (REC-xxx)
 */
router.post(
  '/:id/payments',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  EnrollmentController.recordPayment
);

/**
 * @route GET /api/enrollments/:id/receipts
 * @desc  Lấy danh sách biên lai thu học phí của hồ sơ ghi danh
 */
router.get(
  '/:id/receipts',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  EnrollmentController.getPaymentReceipts
);

/**
 * @route POST /api/enrollments/:id/transfer
 * @desc  Chuyển lớp học cho học viên
 */
router.post(
  '/:id/transfer',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  EnrollmentController.transferClass
);

export default router;
