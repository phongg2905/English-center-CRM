/**
 * DỰ ÁN: ENGLISH CENTER CRM (EduFlow CRM)
 * MODULE: ANALYTICS & REPORTING (UC-04, TASK BE-06)
 * TÁC GIẢ: Long Phạm (@longphm11) - Backend Developer
 */

import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Yêu cầu xác thực JWT cho toàn bộ phân hệ Báo cáo & Thống kê
router.use(verifyToken);

/**
 * @route GET /api/analytics/overview
 * @desc  Lấy tổng quan các chỉ số KPI điều hành cốt lõi
 * @access ADMIN, SALES, ACADEMIC
 */
router.get(
  '/overview',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  AnalyticsController.getOverview
);

/**
 * @route GET /api/analytics/funnel
 * @desc  Thống kê tỷ lệ chuyển đổi phễu tuyển sinh (Lead -> Test -> Enrolled)
 * @access ADMIN, SALES, ACADEMIC
 */
router.get(
  '/funnel',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  AnalyticsController.getFunnel
);

/**
 * @route GET /api/analytics/revenue
 * @desc  Báo cáo doanh thu thực thu theo tuần/tháng/quý/năm & phương thức thanh toán
 * @access ADMIN, ACADEMIC
 */
router.get(
  '/revenue',
  authorizeRoles('ADMIN', 'ACADEMIC'),
  AnalyticsController.getRevenue
);

/**
 * @route GET /api/analytics/sales-leaderboard
 * @desc  Bảng xếp hạng hiệu suất tư vấn viên (Số lead chốt & doanh số đem về)
 * @access ADMIN, SALES, ACADEMIC
 */
router.get(
  '/sales-leaderboard',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  AnalyticsController.getLeaderboard
);

/**
 * @route GET /api/analytics/channel-roi
 * @desc  Thống kê hiệu quả và doanh thu từng kênh Marketing
 * @access ADMIN, SALES, ACADEMIC
 */
router.get(
  '/channel-roi',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  AnalyticsController.getChannelROI
);

/**
 * @route GET /api/analytics/class-occupancy
 * @desc  Thống kê tỷ lệ lấp đầy phòng học và danh sách lớp học
 * @access ADMIN, ACADEMIC, SALES
 */
router.get(
  '/class-occupancy',
  authorizeRoles('ADMIN', 'ACADEMIC', 'SALES'),
  AnalyticsController.getClassOccupancy
);

/**
 * @route GET /api/analytics/export
 * @desc  Hỗ trợ xuất dữ liệu thô báo cáo định dạng JSON/CSV
 * @access ADMIN, ACADEMIC, SALES
 */
router.get(
  '/export',
  authorizeRoles('ADMIN', 'ACADEMIC', 'SALES'),
  AnalyticsController.exportData
);

export default router;
