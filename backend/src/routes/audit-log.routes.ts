import { Router } from 'express';
import { AuditLogController } from '../controllers/audit-log.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken);

/**
 * @route GET /api/audit-logs
 * @desc  Lấy danh sách nhật ký hoạt động trên hệ thống (chỉ dành cho ADMIN)
 */
router.get('/', authorizeRoles('ADMIN'), AuditLogController.getLogs);

export default router;

