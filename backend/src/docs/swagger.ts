import swaggerUi from 'swagger-ui-express';
import { Router } from 'express';

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'English Center CRM (EduFlow) RESTful API',
    version: '1.0.0',
    description: `Hệ thống API Quản lý Tuyển sinh và Đào tạo Trung tâm Anh ngữ.
Dự án môn học: Quản lý Dự án Phần mềm - Nhóm 8 (PTIT).
Tài liệu hóa chuẩn xác các phân hệ Authentication & RBAC (Task [BE-02]).`,
    contact: {
      name: 'Nhóm 8 - PTIT',
      email: 'support@eduflow.vn',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Máy chủ Môi trường Phát triển (Local Dev Server)',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'Xác thực người dùng, cấp phát JWT Tokens và kiểm soát phân quyền RBAC',
    },
    {
      name: 'System Health',
      description: 'Kiểm tra trạng thái hoạt động máy chủ và cơ sở dữ liệu PostgreSQL',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Nhập Access Token được cấp sau khi đăng nhập thành công. Định dạng: Bearer <JWT_TOKEN>',
      },
    },
    schemas: {
      RegisterRequest: {
        type: 'object',
        required: ['username', 'password', 'fullName', 'email'],
        properties: {
          username: { type: 'string', example: 'sales_user01', description: 'Tên đăng nhập tối thiểu 3 ký tự' },
          password: { type: 'string', example: '123456', description: 'Mật khẩu tối thiểu 6 ký tự' },
          fullName: { type: 'string', example: 'Nguyễn Văn A', description: 'Họ và tên đầy đủ' },
          email: { type: 'string', format: 'email', example: 'nguyenvana@eduflow.vn' },
          phoneNumber: { type: 'string', example: '0987654321' },
          roleCode: {
            type: 'string',
            enum: ['ADMIN', 'SALES', 'ACADEMIC'],
            default: 'SALES',
            description: 'Vai trò người dùng trong hệ thống',
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'tamminh', description: 'Tên đăng nhập hoặc Email' },
          password: { type: 'string', example: '123456', description: 'Mật khẩu tài khoản' },
        },
      },
      RefreshRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', description: 'Mã Refresh Token được cấp khi đăng nhập' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Đăng nhập thành công' },
          data: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'integer', example: 1 },
                  username: { type: 'string', example: 'tamminh' },
                  fullName: { type: 'string', example: 'Tam Minh' },
                  email: { type: 'string', example: 'tamminh@eduflow.vn' },
                  role: { type: 'string', example: 'ADMIN' },
                  roleName: { type: 'string', example: 'Quản lý Trung tâm' },
                  isActive: { type: 'boolean', example: true },
                },
              },
              tokens: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                  refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                  tokenType: { type: 'string', example: 'Bearer' },
                  expiresIn: { type: 'string', example: '15m' },
                },
              },
            },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Thông báo lỗi chi tiết' },
          statusCode: { type: 'integer', example: 401 },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['System Health'],
        summary: 'Kiểm tra trạng thái máy chủ & kết nối PostgreSQL',
        responses: {
          200: { description: 'Hệ thống hoạt động ổn định' },
          503: { description: 'Không thể kết nối cơ sở dữ liệu' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Đăng ký tài khoản người dùng mới',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: { description: 'Đăng ký thành công', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: { description: 'Dữ liệu đầu vào không hợp lệ' },
          409: { description: 'Tên đăng nhập hoặc Email đã tồn tại' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Đăng nhập hệ thống & nhận JWT Tokens',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Đăng nhập thành công', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          401: { description: 'Sai tài khoản hoặc mật khẩu' },
          403: { description: 'Tài khoản đã bị khóa' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Làm mới Access Token bằng Refresh Token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Làm mới token thành công' },
          401: { description: 'Refresh Token không hợp lệ hoặc đã hết hạn' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Đăng xuất khỏi hệ thống',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Đăng xuất thành công' },
          401: { description: 'Chưa xác thực danh tính' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Lấy thông tin tài khoản hiện tại (Protected)',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Lấy thông tin thành công' },
          401: { description: 'Token không hợp lệ hoặc hết hạn' },
        },
      },
    },
    '/api/auth/roles': {
      get: {
        tags: ['Authentication'],
        summary: 'Lấy danh mục các vai trò trong hệ thống',
        responses: {
          200: { description: 'Thành công' },
        },
      },
    },
    '/api/auth/admin-only': {
      get: {
        tags: ['Authentication'],
        summary: 'Khu vực kiểm thử chỉ dành riêng cho Admin (RBAC)',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Truy cập thành công' },
          403: { description: 'Bị từ chối: Không đủ quyền ADMIN' },
        },
      },
    },
    '/api/auth/academic-only': {
      get: {
        tags: ['Authentication'],
        summary: 'Khu vực dành cho Giáo vụ và Quản lý (RBAC)',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Truy cập thành công' },
          403: { description: 'Bị từ chối: Không đủ quyền' },
        },
      },
    },
  },
};

const router = Router();
router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'English Center CRM API Docs' }));

export default router;
