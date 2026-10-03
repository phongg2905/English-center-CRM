# English Center CRM - Backend API Server

Mã công việc: `[BE-01]` & `[BE-02]` | Đồ án môn học: Quản lý Dự án Phần mềm  
Hệ thống: CRM Quản lý Tuyển sinh và Đào tạo cho Trung tâm Anh ngữ (EduFlow CRM)  
Đơn vị thực hiện: **Nhóm 8 - PTIT**  
Phụ trách: **Long Phạm** (`@longphm11`) - Backend Developer / QA Lead  

---

## 1. Tổng quan & Kiến trúc

Dự án Backend được xây dựng bằng **Node.js + Express** với **TypeScript**, tuân thủ kiến trúc phân tầng chuẩn (**Layered Architecture**):
- **Routes / Controllers:** Tiếp nhận HTTP Request, xác thực đầu vào, gọi Service và trả về kết quả chuẩn hóa (`ApiResponse`).
- **Services:** Chứa toàn bộ Business Logic và luồng xử lý nghiệp vụ (Xác thực JWT, băm mật khẩu `bcrypt`, cấp phát token).
- **Repositories:** Lớp truy xuất dữ liệu (Data Access Layer) kết nối PostgreSQL, hỗ trợ cơ chế chuyển đổi tự động (In-memory Fallback) khi chưa có CSDL.
- **Database / Pool:** Quản lý Connection Pool với PostgreSQL, hỗ trợ Database Transaction (ACID) chống Overbooking sĩ số theo `[UML-02]`.
- **Middlewares:** Xử lý bảo mật (`helmet`, `cors`), ghi log HTTP (`morgan` + `winston`), xác thực JWT (`verifyToken`), phân quyền vai trò (`authorizeRoles`) và xử lý lỗi tập trung (`errorHandler`).
- **Swagger Documentation:** Tích hợp Swagger UI trực quan tại `/api/docs`.

---

## 2. Cấu trúc thư mục

```
backend/
├── src/
│   ├── config/             # Cấu hình môi trường (.env) và biến hệ thống
│   │   └── environment.ts
│   ├── database/           # PostgreSQL Connection Pool & Transaction Helper
│   │   └── pool.ts
│   ├── docs/               # OpenAPI 3.0 Specification & Swagger UI
│   │   └── swagger.ts
│   ├── types/              # Định nghĩa kiểu dữ liệu TypeScript (Auth, User, Role)
│   │   └── auth.types.ts
│   ├── repositories/       # Data Access Layer (Users & Roles)
│   │   └── user.repository.ts
│   ├── services/           # Nghiệp vụ (AuthService, TokenService, HealthService)
│   │   ├── auth.service.ts
│   │   ├── token.service.ts
│   │   └── health.service.ts
│   ├── controllers/        # Điều khiển phản hồi API (AuthController, HealthController)
│   │   ├── auth.controller.ts
│   │   └── health.controller.ts
│   ├── middlewares/        # Middlewares (Auth, RBAC, Request Logger, Error Handler)
│   │   ├── auth.middleware.ts
│   │   ├── requestLogger.ts
│   │   └── errorHandler.ts
│   ├── routes/             # Định nghĩa tuyến API
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   └── health.routes.ts
│   ├── utils/              # Tiện ích chung (Logger, AppError, ApiResponse)
│   │   ├── logger.ts
│   │   ├── AppError.ts
│   │   └── response.ts
│   ├── scripts/            # Script kiểm thử & chẩn đoán
│   │   ├── test-db.ts
│   │   └── test-auth.ts
│   ├── app.ts              # Khởi tạo Express Application & Security Middlewares
│   └── server.ts           # Khởi động máy chủ & Graceful Shutdown
├── .env.example            # Bản mẫu cấu hình biến môi trường
├── .env                    # Biến môi trường cục bộ (được gitignore an toàn)
├── package.json
└── tsconfig.json
```

---

## 3. Cài đặt & Khởi chạy

### 3.1. Cài đặt thư viện
```bash
cd backend
npm install
```

### 3.2. Cấu hình biến môi trường
Tạo file `.env` từ `.env.example`:
```ini
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=english_center_crm
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT_MILLIS=30000
DB_CONNECTION_TIMEOUT_MILLIS=5000

CORS_ORIGIN=http://localhost:5173,http://localhost:3000
JWT_SECRET=eduflow_crm_secret_jwt_token_key_2026_nhom8_ptit
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=eduflow_crm_refresh_secret_jwt_key_2026_ptit_nhom8
JWT_REFRESH_EXPIRES_IN=7d
```

### 3.3. Kiểm thử tự động (Unit / Integration Tests)
```bash
# Kiểm thử toàn diện hệ thống Authentication & Phân quyền RBAC (BE-02)
npm run test:auth

# Chẩn đoán kết nối cơ sở dữ liệu PostgreSQL (BE-01)
npm run db:test
```

### 3.4. Khởi chạy môi trường phát triển (Hot-reload)
```bash
npm run dev
```

### 3.5. Biên dịch TypeScript & Chạy Production
```bash
npm run build
npm start
```

---

## 4. Danh mục API Endpoints & Phân quyền

### 4.1. Hệ thống & Tài liệu
| Method | Endpoint | Quyền hạn | Mô tả |
| :---: | :--- | :---: | :--- |
| `GET` | `/` | Public | Thông tin máy chủ đang chạy |
| `GET` | `/api` | Public | Mục lục các API |
| `GET` | `/api/docs` | Public | **Tài liệu Swagger UI tương tác trực tiếp** |
| `GET` | `/api/docs.json` | Public | Tải file đặc tả OpenAPI 3.0.0 JSON |
| `GET` | `/api/health` | Public | Kiểm tra trạng thái máy chủ & kết nối PostgreSQL |

### 4.2. Phân hệ Xác thực & Phân quyền (Authentication & RBAC - `[BE-02]`)
| Method | Endpoint | Quyền hạn | Mô tả |
| :---: | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | Public | Đăng ký tài khoản người dùng mới (Mã hóa bcrypt) |
| `POST` | `/api/auth/login` | Public | Đăng nhập và nhận cặp Access Token (15p) & Refresh Token (7d) |
| `POST` | `/api/auth/refresh` | Public | Cấp lại Access Token mới bằng Refresh Token hợp lệ |
| `GET` | `/api/auth/roles` | Public | Lấy danh mục các vai trò người dùng trong hệ thống |
| `POST` | `/api/auth/logout` | Bearer Token | Đăng xuất tài khoản |
| `GET` | `/api/auth/me` | Bearer Token | Lấy thông tin tài khoản hiện tại từ Token |
| `GET` | `/api/auth/admin-only` | Bearer (`ADMIN`) | Khu vực kiểm thử chỉ dành riêng cho Quản trị viên |
| `GET` | `/api/auth/academic-only`| Bearer (`ADMIN`, `ACADEMIC`) | Khu vực dành cho Giáo vụ và Quản trị viên |

---

## 5. Tài khoản dùng thử mặc định (Mock & Seed Data)

| Username | Password | Vai trò (Role) | Chức danh hiển thị |
| :--- | :---: | :---: | :--- |
| `tamminh` | `123456` | `ADMIN` | Quản lý Trung tâm |
| `longpham` | `123456` | `SALES` | Tư vấn viên Tuyển sinh |
| `phongpham` | `123456` | `ACADEMIC` | Nhân viên Giáo vụ |
