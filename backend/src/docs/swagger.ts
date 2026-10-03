import swaggerUi from 'swagger-ui-express';
import { Router } from 'express';

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'English Center CRM (EduFlow) RESTful API',
    version: '1.0.0',
    description: `Hệ thống API Quản lý Tuyển sinh và Đào tạo Trung tâm Anh ngữ.
Dự án môn học: Quản lý Dự án Phần mềm - Nhóm 8 (PTIT).
Tài liệu hóa chi tiết phân hệ Authentication & RBAC (Task [BE-02]) và Quản lý & Tiếp nhận Lead UC-01 (Task [BE-03]).`,
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
      name: 'Leads (UC-01)',
      description: 'Tiếp nhận, quản lý phân luồng Lead theo Kanban, ghi nhận tương tác chăm sóc và báo cáo thống kê tuyển sinh',
    },
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
      CreateLeadRequest: {
        type: 'object',
        required: ['fullName', 'phoneNumber', 'interest', 'sourceChannel'],
        properties: {
          fullName: { type: 'string', example: 'Đỗ Hải Đăng', description: 'Họ và tên khách hàng' },
          phoneNumber: { type: 'string', example: '0981234567', description: 'Số điện thoại chuẩn 10 số bắt đầu bằng 0' },
          email: { type: 'string', format: 'email', example: 'haidang.do@gmail.com', description: 'Email liên hệ (nếu có)' },
          interest: {
            type: 'string',
            enum: ['IELTS', 'TOEIC', 'COMMUNICATION'],
            example: 'IELTS',
            description: 'Khóa học học viên quan tâm',
          },
          sourceChannel: {
            type: 'string',
            enum: ['FB_ADS', 'WEBSITE', 'HOTLINE', 'WALK_IN', 'REFERRAL'],
            example: 'FB_ADS',
            description: 'Kênh tiếp cận khách hàng',
          },
          assignedSalesId: { type: 'integer', example: 2, description: 'ID tư vấn viên phụ trách (tùy chọn)' },
          notes: { type: 'string', example: 'Muốn học khóa luyện thi IELTS 6.5 cấp tốc', description: 'Ghi chú ban đầu' },
        },
      },
      UpdateLeadRequest: {
        type: 'object',
        properties: {
          fullName: { type: 'string', example: 'Đỗ Hải Đăng' },
          phoneNumber: { type: 'string', example: '0981234567' },
          email: { type: 'string', format: 'email', example: 'haidang.do@gmail.com' },
          interest: { type: 'string', enum: ['IELTS', 'TOEIC', 'COMMUNICATION'] },
          sourceChannel: { type: 'string', enum: ['FB_ADS', 'WEBSITE', 'HOTLINE', 'WALK_IN', 'REFERRAL'] },
          pipelineStage: { type: 'string', enum: ['NEW', 'CONTACTING', 'TEST_SCHEDULED', 'ENROLLED', 'LOST'] },
          lostReason: { type: 'string', example: 'Học phí vượt quá ngân sách' },
          assignedSalesId: { type: 'integer', example: 2 },
          notes: { type: 'string', example: 'Cập nhật ghi chú tư vấn' },
        },
      },
      UpdateLeadStatusRequest: {
        type: 'object',
        required: ['pipelineStage'],
        properties: {
          pipelineStage: {
            type: 'string',
            enum: ['NEW', 'CONTACTING', 'TEST_SCHEDULED', 'ENROLLED', 'LOST'],
            example: 'CONTACTING',
            description: 'Trạng thái giai đoạn mới trên Kanban',
          },
          lostReason: {
            type: 'string',
            example: 'Học phí quá cao',
            description: 'Bắt buộc nhập nếu pipelineStage = LOST',
          },
        },
      },
      AssignLeadRequest: {
        type: 'object',
        required: ['assignedSalesId'],
        properties: {
          assignedSalesId: {
            type: 'integer',
            example: 2,
            description: 'ID người dùng tư vấn viên phụ trách',
          },
        },
      },
      CreateConsultationRequest: {
        type: 'object',
        required: ['interactionType', 'potentialLevel', 'content'],
        properties: {
          interactionType: {
            type: 'string',
            enum: ['PHONE_CALL', 'SMS', 'DIRECT_MEETING', 'SYSTEM_NOTE'],
            example: 'PHONE_CALL',
            description: 'Hình thức tương tác',
          },
          potentialLevel: {
            type: 'string',
            enum: ['HOT', 'WARM', 'COLD'],
            example: 'HOT',
            description: 'Đánh giá mức độ tiềm năng',
          },
          content: {
            type: 'string',
            example: 'Khách hàng quan tâm khóa học tối thứ 2-4-6, hẹn làm bài test đầu vào chiều thứ 7.',
            description: 'Nội dung chi tiết cuộc trao đổi',
          },
          nextFollowUpAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-10-05T14:00:00Z',
            description: 'Thời điểm hẹn liên hệ lại (nếu có)',
          },
        },
      },
      LeadItem: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          fullName: { type: 'string', example: 'Nguyễn Thị Thuỳ Dung' },
          phoneNumber: { type: 'string', example: '0912111001' },
          email: { type: 'string', example: 'thuydung.nguyen@gmail.com' },
          interest: { type: 'string', example: 'IELTS' },
          sourceChannel: { type: 'string', example: 'FB_ADS' },
          pipelineStage: { type: 'string', example: 'NEW' },
          lostReason: { type: 'string', nullable: true, example: null },
          assignedSalesId: { type: 'integer', nullable: true, example: 2 },
          assignedSalesName: { type: 'string', nullable: true, example: 'Long Phạm' },
          notes: { type: 'string', nullable: true, example: 'Đăng ký qua Form Facebook Ads' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          lastContactedAt: { type: 'string', format: 'date-time', nullable: true },
          totalInteractions: { type: 'integer', example: 1 },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['System Health'],
        summary: 'Kiểm tra trạng thái máy chủ Backend và kết nối PostgreSQL',
        responses: {
          200: { description: 'Hệ thống hoạt động bình thường' },
          503: { description: 'Dịch vụ gặp sự cố' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Đăng ký tài khoản người dùng nội bộ mới',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: { description: 'Đăng ký tài khoản thành công' },
          400: { description: 'Dữ liệu đầu vào không hợp lệ' },
          409: { description: 'Tên đăng nhập hoặc Email đã tồn tại' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Đăng nhập hệ thống và nhận JWT Access Token & Refresh Token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Đăng nhập thành công' },
          400: { description: 'Thiếu tên đăng nhập hoặc mật khẩu' },
          401: { description: 'Tên đăng nhập hoặc mật khẩu không chính xác' },
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
          200: { description: 'Cấp mới token thành công' },
          401: { description: 'Refresh token không hợp lệ hoặc hết hạn' },
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
    '/api/leads': {
      get: {
        tags: ['Leads (UC-01)'],
        summary: 'Lấy danh sách Lead có hỗ trợ lọc, tìm kiếm và phân trang',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'pipelineStage', in: 'query', schema: { type: 'string', enum: ['NEW', 'CONTACTING', 'TEST_SCHEDULED', 'ENROLLED', 'LOST'] } },
          { name: 'interest', in: 'query', schema: { type: 'string', enum: ['IELTS', 'TOEIC', 'COMMUNICATION'] } },
          { name: 'sourceChannel', in: 'query', schema: { type: 'string', enum: ['FB_ADS', 'WEBSITE', 'HOTLINE', 'WALK_IN', 'REFERRAL'] } },
          { name: 'assignedSalesId', in: 'query', schema: { type: 'integer' } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Tìm theo họ tên, SĐT, hoặc email' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['created_at', 'updated_at', 'full_name'] } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['ASC', 'DESC'] } },
        ],
        responses: {
          200: { description: 'Lấy danh sách Lead thành công' },
          401: { description: 'Chưa đăng nhập' },
          403: { description: 'Không có quyền truy cập' },
        },
      },
      post: {
        tags: ['Leads (UC-01)'],
        summary: 'Tiếp nhận hồ sơ Lead mới vào phễu tuyển sinh (Kiểm tra trùng BR-01)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateLeadRequest' },
            },
          },
        },
        responses: {
          201: { description: 'Tạo Lead mới thành công' },
          400: { description: 'Dữ liệu không hợp lệ (sai SĐT, email...)' },
          409: { description: 'Xung đột: Số điện thoại hoặc Email đã tồn tại' },
        },
      },
    },
    '/api/leads/kanban': {
      get: {
        tags: ['Leads (UC-01)'],
        summary: 'Lấy dữ liệu Lead phân theo 5 cột trên Bảng Kanban Pipeline',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'assignedSalesId', in: 'query', schema: { type: 'integer' }, description: 'Lọc theo tư vấn viên phụ trách' },
        ],
        responses: {
          200: { description: 'Lấy dữ liệu Kanban thành công' },
        },
      },
    },
    '/api/leads/stats': {
      get: {
        tags: ['Leads (UC-01)'],
        summary: 'Thống kê tổng hợp số liệu Lead (theo Stage, Kênh tiếp thị, Khóa học và Tỷ lệ chuyển đổi)',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Lấy thống kê thành công' },
        },
      },
    },
    '/api/leads/{id}': {
      get: {
        tags: ['Leads (UC-01)'],
        summary: 'Xem chi tiết hồ sơ Lead theo ID',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Thành công' },
          404: { description: 'Không tìm thấy Lead' },
        },
      },
      put: {
        tags: ['Leads (UC-01)'],
        summary: 'Cập nhật thông tin chi tiết của Lead',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateLeadRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Cập nhật thành công' },
          400: { description: 'Dữ liệu không hợp lệ' },
          404: { description: 'Không tìm thấy Lead' },
          409: { description: 'SĐT hoặc Email bị trùng lặp' },
        },
      },
      delete: {
        tags: ['Leads (UC-01)'],
        summary: 'Xóa hồ sơ Lead khỏi hệ thống (Chỉ dành cho ADMIN)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Xóa thành công' },
          403: { description: 'Từ chối: Yêu cầu quyền ADMIN' },
          404: { description: 'Không tìm thấy Lead' },
        },
      },
    },
    '/api/leads/{id}/status': {
      patch: {
        tags: ['Leads (UC-01)'],
        summary: 'Cập nhật nhanh trạng thái giai đoạn Pipeline (Kanban Drag & Drop)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateLeadStatusRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Cập nhật trạng thái thành công' },
          400: { description: 'Trạng thái không hợp lệ hoặc thiếu lostReason khi chuyển sang LOST' },
          404: { description: 'Không tìm thấy Lead' },
        },
      },
    },
    '/api/leads/{id}/assign': {
      patch: {
        tags: ['Leads (UC-01)'],
        summary: 'Phân bổ hoặc thay đổi tư vấn viên phụ trách Lead',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AssignLeadRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Phân bổ tư vấn viên thành công' },
          404: { description: 'Không tìm thấy Lead hoặc Tư vấn viên' },
        },
      },
    },
    '/api/leads/{id}/consultations': {
      get: {
        tags: ['Leads (UC-01)'],
        summary: 'Lấy dòng thời gian lịch sử tương tác / tư vấn của Lead',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Lấy lịch sử thành công' },
          404: { description: 'Không tìm thấy Lead' },
        },
      },
      post: {
        tags: ['Leads (UC-01)'],
        summary: 'Thêm mới nhật ký cuộc gọi / tương tác tư vấn (Tự động đổi stage NEW -> CONTACTING)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateConsultationRequest' },
            },
          },
        },
        responses: {
          201: { description: 'Ghi nhật ký tương tác thành công' },
          400: { description: 'Dữ liệu không hợp lệ' },
          404: { description: 'Không tìm thấy Lead' },
        },
      },
    },
  },
};

const router = Router();
router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'English Center CRM API Docs' }));

export default router;
