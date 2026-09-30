import { Router } from 'express';
import { HealthController } from '../controllers/health.controller.js';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    Kiểm tra trạng thái máy chủ và kết nối PostgreSQL
 * @access  Public
 */
router.get('/', HealthController.check);

export default router;
