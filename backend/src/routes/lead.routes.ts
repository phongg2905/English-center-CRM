import { Router } from 'express';
import { LeadController } from '../controllers/lead.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Tất cả các route /api/leads đều yêu cầu đăng nhập (JWT Authentication)
router.use(verifyToken);

/**
 * @route GET /api/leads/kanban
 * @desc  Lấy danh sách Lead hiển thị theo 5 cột trên Bảng Kanban
 */
router.get(
  '/kanban',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  LeadController.getKanban
);

/**
 * @route GET /api/leads/stats
 * @desc  Lấy báo cáo thống kê Lead (theo stage, nguồn tiếp thị, nhu cầu)
 */
router.get(
  '/stats',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  LeadController.getStats
);

/**
 * @route GET /api/leads
 * @desc  Lấy danh sách Lead dạng bảng có lọc, tìm kiếm và phân trang
 */
router.get(
  '/',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  LeadController.getLeads
);

/**
 * @route GET /api/leads/:id
 * @desc  Lấy thông tin chi tiết một Lead theo ID
 */
router.get(
  '/:id',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  LeadController.getLeadById
);

/**
 * @route POST /api/leads
 * @desc  Tiếp nhận Lead mới vào phễu tuyển sinh
 */
router.post(
  '/',
  authorizeRoles('ADMIN', 'SALES'),
  LeadController.createLead
);

/**
 * @route PUT /api/leads/:id
 * @desc  Cập nhật toàn bộ thông tin chi tiết Lead
 */
router.put(
  '/:id',
  authorizeRoles('ADMIN', 'SALES'),
  LeadController.updateLead
);

/**
 * @route PATCH /api/leads/:id/status & PATCH /api/leads/:id/stage
 * @desc  Cập nhật trạng thái giai đoạn Pipeline (Kanban Drag & Drop)
 */
router.patch(
  '/:id/status',
  authorizeRoles('ADMIN', 'SALES'),
  LeadController.updateStatus
);
router.patch(
  '/:id/stage',
  authorizeRoles('ADMIN', 'SALES'),
  LeadController.updateStatus
);

/**
 * @route PATCH /api/leads/:id/assign
 * @desc  Phân công người phụ trách Lead (Tư vấn viên)
 */
router.patch(
  '/:id/assign',
  authorizeRoles('ADMIN', 'SALES'),
  LeadController.assignLead
);

/**
 * @route DELETE /api/leads/:id
 * @desc  Xóa Lead (Chỉ ADMIN được quyền xóa)
 */
router.delete(
  '/:id',
  authorizeRoles('ADMIN'),
  LeadController.deleteLead
);

/**
 * @route GET /api/leads/:id/consultations, /:id/timeline, /:id/logs
 * @desc  Lấy lịch sử nhật ký tương tác / cuộc gọi của Lead (Timeline)
 */
router.get(
  '/:id/consultations',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  LeadController.getConsultations
);
router.get(
  '/:id/timeline',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  LeadController.getConsultations
);
router.get(
  '/:id/logs',
  authorizeRoles('ADMIN', 'SALES', 'ACADEMIC'),
  LeadController.getConsultations
);

/**
 * @route POST /api/leads/:id/consultations, /:id/logs
 * @desc  Thêm mới nhật ký tương tác / cuộc gọi tư vấn
 */
router.post(
  '/:id/consultations',
  authorizeRoles('ADMIN', 'SALES'),
  LeadController.addConsultation
);
router.post(
  '/:id/logs',
  authorizeRoles('ADMIN', 'SALES'),
  LeadController.addConsultation
);

export default router;
