import { Router, Request, Response } from 'express';
import healthRoutes from './health.routes.js';
import { ApiResponse } from '../utils/response.js';

const router = Router();

// Endpoint thông tin API gốc
router.get('/', (req: Request, res: Response) => {
  ApiResponse.success(
    res,
    {
      name: 'English Center CRM (EduFlow) RESTful API',
      version: '1.0.0',
      description: 'Hệ thống Quản lý Tuyển sinh và Đào tạo Trung tâm Anh ngữ',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth (Upcoming - BE-02)',
        leads: '/api/leads (Upcoming - BE-03)',
        tests: '/api/placement-tests (Upcoming - BE-04)',
        courses: '/api/courses (Upcoming - BE-05)',
        classes: '/api/classes (Upcoming - BE-05)',
        enrollments: '/api/enrollments (Upcoming - BE-05)',
      },
    },
    'Chào mừng đến với API English Center CRM'
  );
});

// Gắn các router phân hệ
router.use('/health', healthRoutes);

export default router;
