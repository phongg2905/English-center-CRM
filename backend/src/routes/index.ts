import { Router, Request, Response } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import leadRoutes from './lead.routes.js';
import placementTestRoutes from './placement-test.routes.js';
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
        leads: {
          list: 'GET /api/leads',
          kanban: 'GET /api/leads/kanban',
          stats: 'GET /api/leads/stats',
          detail: 'GET /api/leads/:id',
          create: 'POST /api/leads',
          update: 'PUT /api/leads/:id',
          updateStatus: 'PATCH /api/leads/:id/status',
          assign: 'PATCH /api/leads/:id/assign',
          delete: 'DELETE /api/leads/:id',
          consultations: 'GET, POST /api/leads/:id/consultations',
        },
        placementTests: {
          book: 'POST /api/placement-tests/book',
          list: 'GET /api/placement-tests',
          detail: 'GET /api/placement-tests/:id',
          attendance: 'PATCH /api/placement-tests/:id/attendance',
          score: 'POST /api/placement-tests/:id/score',
          recommendCourse: 'GET /api/placement-tests/recommend-course',
          availability: 'GET /api/placement-tests/availability',
          cancel: 'DELETE /api/placement-tests/:id',
        },
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
router.use('/leads', leadRoutes);
router.use('/placement-tests', placementTestRoutes);
router.use('/docs', swaggerRoutes);

export default router;
