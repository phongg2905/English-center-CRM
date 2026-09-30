# English Center CRM - Backend API Server

Mã công việc: `[BE-01]` | Đồ án môn học: Quản lý Dự án Phần mềm  
Hệ thống: CRM Quản lý Tuyển sinh và Đào tạo cho Trung tâm Anh ngữ (EduFlow CRM)  
Đơn vị thực hiện: **Nhóm 8 - PTIT**  
Phụ trách: **Long Phạm** (`@longphm11`) - Backend Developer / QA Lead  

---

## 1. Tổng quan & Kiến trúc

Dự án Backend được xây dựng bằng **Node.js + Express** với **TypeScript**, tuân thủ kiến trúc phân tầng chuẩn (**Layered Architecture**):
- **Routes / Controllers:** Tiếp nhận HTTP Request, xác thực đầu vào, gọi Service và trả về kết quả chuẩn hóa (`ApiResponse`).
- **Services:** Chứa toàn bộ Business Logic và luồng xử lý nghiệp vụ.
- **Database / Pool:** Quản lý Connection Pool với PostgreSQL, hỗ trợ Database Transaction (ACID) chống Overbooking sĩ số theo `[UML-02]`.
- **Middlewares:** Xử lý bảo mật (`helmet`, `cors`), ghi log HTTP (`morgan` + `winston`), và xử lý lỗi tập trung (`errorHandler`).

---

## 2. Cấu trúc thư mục

```
backend/
├── src/
│   ├── config/             # Cấu hình môi trường (.env) và biến hệ thống
│   │   └── environment.ts
│   ├── database/           # PostgreSQL Connection Pool & Transaction Helper
│   │   └── pool.ts
│   ├── utils/              # Tiện ích chung (Logger, AppError, ApiResponse)
│   │   ├── logger.ts
│   │   ├── AppError.ts
│   │   └── response.ts
│   ├── middlewares/        # Middlewares (Request Logger, Error Handler)
│   │   ├── requestLogger.ts
│   │   └── errorHandler.ts
│   ├── controllers/        # Điều khiển phản hồi API
│   │   └── health.controller.ts
│   ├── services/           # Nghiệp vụ xử lý dữ liệu
│   │   └── health.service.ts
│   ├── routes/             # Định nghĩa tuyến API
│   │   ├── index.ts
│   │   └── health.routes.ts
│   ├── scripts/            # Script kiểm thử & tiện ích
│   │   └── test-db.ts
│   ├── app.ts              # Khởi tạo Express Application
│   └── server.ts           # Khởi động máy chủ & Graceful Shutdown
├── .env.example            # Bản mẫu cấu hình biến môi trường
├── .env                    # Biến môi trường cục bộ (không commit)
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
DB_PASSWORD=your_password
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT_MILLIS=30000
DB_CONNECTION_TIMEOUT_MILLIS=5000

CORS_ORIGIN=http://localhost:5173,http://localhost:3000
JWT_SECRET=eduflow_crm_secret_jwt_token_key_2026_nhom8_ptit
JWT_EXPIRES_IN=8h
```

### 3.3. Kiểm tra chẩn đoán kết nối Cơ sở dữ liệu
```bash
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

## 4. Danh mục API Endpoints hiện tại

| Method | Endpoint | Mô tả | Trạng thái |
| :---: | :--- | :--- | :---: |
| `GET` | `/` | Thông tin server đang chạy | 200 OK |
| `GET` | `/api` | Mục lục danh sách các API của hệ thống | 200 OK |
| `GET` | `/api/health` | Kiểm tra trạng thái máy chủ và kết nối PostgreSQL | 200 OK / 503 |
