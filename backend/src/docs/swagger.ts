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
      name: 'Placement Tests (UC-02)',
      description: 'Quản lý ca thi, đặt lịch test, điểm danh thí sinh, nhập điểm 4 kỹ năng và thuật toán tự động đề xuất khóa học (UC-SYS-03)',
    },
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
      ForgotPasswordRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'tamminh@eduflow.vn', description: 'Địa chỉ Email đăng ký tài khoản cần khôi phục' },
        },
      },
      ResetPasswordRequest: {
        type: 'object',
        required: ['email', 'otp', 'newPassword'],
        properties: {
          email: { type: 'string', format: 'email', example: 'tamminh@eduflow.vn', description: 'Địa chỉ Email đã nhận mã OTP' },
          otp: { type: 'string', example: '123456', description: 'Mã OTP 6 chữ số gửi qua email (hiệu lực 15 phút)' },
          newPassword: { type: 'string', example: 'NewPassword@123', description: 'Mật khẩu mới tối thiểu 6 ký tự' },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', example: '123456', description: 'Mật khẩu hiện tại của tài khoản' },
          newPassword: { type: 'string', example: 'MyNewSecurePass@2026', description: 'Mật khẩu mới tối thiểu 6 ký tự' },
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
      BookTestRequest: {
        type: 'object',
        required: ['leadId', 'testDate', 'timeSlot'],
        properties: {
          leadId: { type: 'integer', example: 5, description: 'Mã ID của Lead cần đặt lịch thi' },
          testDate: { type: 'string', format: 'date', example: '2026-10-15', description: 'Ngày thi (YYYY-MM-DD)' },
          timeSlot: { type: 'string', example: '14:30 - 16:00', description: 'Khung giờ / Ca thi' },
          room: { type: 'string', example: 'Phòng Lab 201', description: 'Tên phòng thi (mặc định: Phòng Lab 201)' },
          testType: { type: 'string', enum: ['IELTS', 'TOEIC', 'GENERAL'], example: 'IELTS', description: 'Loại bài thi' },
          notes: { type: 'string', example: 'Thí sinh yêu cầu bài thi thử IELTS Academic 4 kỹ năng', description: 'Ghi chú đặc biệt' },
        },
      },
      UpdateAttendanceRequest: {
        type: 'object',
        required: ['attendanceStatus'],
        properties: {
          attendanceStatus: {
            type: 'string',
            enum: ['SCHEDULED', 'PRESENT', 'ABSENT', 'CANCELLED'],
            example: 'PRESENT',
            description: 'Trạng thái điểm danh thí sinh',
          },
          notes: { type: 'string', example: 'Thí sinh đến đúng giờ, làm bài nghiêm túc', description: 'Ghi chú' },
        },
      },
      RecordScoreRequest: {
        type: 'object',
        properties: {
          listeningScore: { type: 'number', minimum: 0, maximum: 9, example: 5.5, description: 'Điểm Nghe (0.0 - 9.0)' },
          readingScore: { type: 'number', minimum: 0, maximum: 9, example: 5.0, description: 'Điểm Đọc (0.0 - 9.0)' },
          writingScore: { type: 'number', minimum: 0, maximum: 9, example: 5.0, description: 'Điểm Viết (0.0 - 9.0)' },
          speakingScore: { type: 'number', minimum: 0, maximum: 9, example: 5.5, description: 'Điểm Nói (0.0 - 9.0)' },
          overallScore: { type: 'number', minimum: 0, maximum: 9, example: 5.5, description: 'Điểm Overall (tự tính nếu bỏ trống)' },
          examinerFeedback: { type: 'string', example: 'Phát âm rõ ràng, phản xạ tốt; cần trau dồi thêm từ vựng học thuật.' },
          suggestedCourseId: { type: 'integer', example: 2, description: 'Mã khóa học chỉ định (tự động đề xuất nếu bỏ trống)' },
        },
      },
      PlacementTestItem: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          leadId: { type: 'integer', example: 5 },
          testDate: { type: 'string', format: 'date', example: '2026-10-15' },
          timeSlot: { type: 'string', example: '14:30 - 16:00' },
          room: { type: 'string', example: 'Phòng Lab 201' },
          testType: { type: 'string', example: 'IELTS' },
          attendanceStatus: { type: 'string', example: 'SCHEDULED' },
          listeningScore: { type: 'number', nullable: true, example: 5.5 },
          readingScore: { type: 'number', nullable: true, example: 5.0 },
          writingScore: { type: 'number', nullable: true, example: 5.0 },
          speakingScore: { type: 'number', nullable: true, example: 5.5 },
          overallScore: { type: 'number', nullable: true, example: 5.5 },
          suggestedCourseId: { type: 'integer', nullable: true, example: 2 },
          suggestedCourseCode: { type: 'string', nullable: true, example: 'IELTS-FIGHT' },
          suggestedCourseName: { type: 'string', nullable: true, example: 'IELTS Bứt phá (Target 6.5)' },
          examinerFeedback: { type: 'string', nullable: true, example: 'Phản xạ tốt, cần bổ sung từ vựng Task 2' },
          leadFullName: { type: 'string', example: 'Nguyễn Hoàng Nam' },
          leadPhoneNumber: { type: 'string', example: '0912111005' },
          leadEmail: { type: 'string', nullable: true, example: 'nam.nguyenhoang@gmail.com' },
          assignedSalesName: { type: 'string', nullable: true, example: 'Long Phạm' },
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
    '/api/auth/forgot-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Yêu cầu gửi mã OTP khôi phục mật khẩu qua Email (Hiệu lực 15 phút)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ForgotPasswordRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Đã gửi mã OTP thành công' },
          400: { description: 'Địa chỉ email không hợp lệ' },
          404: { description: 'Không tìm thấy tài khoản người dùng' },
        },
      },
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Đặt lại mật khẩu mới bằng mã xác thực OTP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ResetPasswordRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Đặt lại mật khẩu thành công' },
          400: { description: 'Mã OTP không chính xác, hết hạn hoặc mật khẩu quá ngắn' },
          404: { description: 'Không tìm thấy tài khoản' },
        },
      },
    },
    '/api/auth/change-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Đổi mật khẩu tài khoản cá nhân (Yêu cầu đăng nhập & đối soát mật khẩu cũ)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChangePasswordRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Đổi mật khẩu thành công' },
          400: { description: 'Mật khẩu hiện tại không đúng hoặc mật khẩu mới trùng mật khẩu cũ' },
          401: { description: 'Chưa đăng nhập' },
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
    '/api/placement-tests/book': {
      post: {
        tags: ['Placement Tests (UC-02)'],
        summary: 'Đặt lịch hẹn kiểm tra trình độ đầu vào (Chống trùng lịch & kiểm tra sức chứa phòng)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BookTestRequest' },
            },
          },
        },
        responses: {
          201: { description: 'Đặt lịch thi thành công, tự động chuyển Lead sang TEST_SCHEDULED' },
          400: { description: 'Dữ liệu không hợp lệ hoặc phòng thi đã kín chỗ' },
          409: { description: 'Lead đã có lịch thi chưa hoàn thành (trùng lịch)' },
        },
      },
    },
    '/api/placement-tests': {
      get: {
        tags: ['Placement Tests (UC-02)'],
        summary: 'Lấy danh sách bài thi và thí sinh theo ngày/tuần có phân trang & lọc',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Lọc theo ngày thi' },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'timeSlot', in: 'query', schema: { type: 'string' } },
          { name: 'room', in: 'query', schema: { type: 'string' } },
          { name: 'attendanceStatus', in: 'query', schema: { type: 'string', enum: ['SCHEDULED', 'PRESENT', 'ABSENT', 'CANCELLED'] } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Tìm theo họ tên hoặc SĐT thí sinh' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Lấy danh sách bài thi thành công' },
        },
      },
    },
    '/api/placement-tests/availability': {
      get: {
        tags: ['Placement Tests (UC-02)'],
        summary: 'Kiểm tra trạng thái sức chứa và lịch ca thi theo phòng (phục vụ Calendar View)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'room', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Lấy thông tin sức chứa ca thi thành công' },
        },
      },
    },
    '/api/placement-tests/recommend-course': {
      get: {
        tags: ['Placement Tests (UC-02)'],
        summary: 'Thuật toán độc lập gợi ý khóa học phù hợp dựa trên điểm thi và mục tiêu (UC-SYS-03)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'overallScore', in: 'query', required: true, schema: { type: 'number' }, example: 5.5 },
          { name: 'testType', in: 'query', schema: { type: 'string', default: 'IELTS' } },
          { name: 'interest', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Gợi ý khóa học phù hợp và danh sách lớp học mở thành công' },
          400: { description: 'Điểm Overall không hợp lệ' },
        },
      },
    },
    '/api/placement-tests/{id}': {
      get: {
        tags: ['Placement Tests (UC-02)'],
        summary: 'Lấy chi tiết một bài thi (kèm đề xuất lớp học mở tương ứng)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Lấy chi tiết bài thi thành công' },
          404: { description: 'Không tìm thấy bài thi' },
        },
      },
      delete: {
        tags: ['Placement Tests (UC-02)'],
        summary: 'Hủy lịch thi',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Hủy lịch thi thành công' },
          404: { description: 'Không tìm thấy bài thi' },
        },
      },
    },
    '/api/placement-tests/{id}/attendance': {
      patch: {
        tags: ['Placement Tests (UC-02)'],
        summary: 'Điểm danh thí sinh một chạm (PRESENT / ABSENT / CANCELLED / SCHEDULED)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateAttendanceRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Điểm danh thành công' },
          400: { description: 'Trạng thái điểm danh không hợp lệ' },
          404: { description: 'Không tìm thấy bài thi' },
        },
      },
    },
    '/api/placement-tests/{id}/score': {
      post: {
        tags: ['Placement Tests (UC-02)'],
        summary: 'Nhập điểm 4 kỹ năng & tự động tính Overall và kích hoạt thuật toán gợi ý khóa học (UC-SYS-03)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RecordScoreRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Nhập điểm và sinh đề xuất lộ trình thành công' },
          400: { description: 'Thang điểm không hợp lệ (phải từ 0.0 đến 9.0)' },
          404: { description: 'Không tìm thấy bài thi' },
        },
      },
    },
  },
};

const router = Router();
router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'English Center CRM API Docs' }));

export default router;
