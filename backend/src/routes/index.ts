import { Router, Request, Response } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import swaggerRoutes, { swaggerSpec } from '../docs/swagger.js';
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
      docsUrl: '/api/docs',
      endpoints: {
        health: '/api/health',
        docs: '/api/docs',
        auth: {
          register: 'POST /api/auth/register',
          login: 'POST /api/auth/login',
          refresh: 'POST /api/auth/refresh',
          forgotPassword: 'POST /api/auth/forgot-password',
          resetPassword: 'POST /api/auth/reset-password',
          changePassword: 'POST /api/auth/change-password',
          logout: 'POST /api/auth/logout',
          me: 'GET /api/auth/me',
          roles: 'GET /api/auth/roles',
          adminOnly: 'GET /api/auth/admin-only',
          academicOnly: 'GET /api/auth/academic-only',
        },
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

// Cung cấp file đặc tả JSON OpenAPI
router.get('/docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Gắn các router phân hệ
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/docs', swaggerRoutes);

export default router;
