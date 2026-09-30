# BẢN HIẾN CHƯƠNG DỰ ÁN (PROJECT CHARTER)
## HỆ THỐNG CRM QUẢN LÝ TUYỂN SINH VÀ ĐÀO TẠO TRUNG TÂM ANH NGỮ (EDUFLOW CRM)

---

| **Mã tài liệu** | **CHARTER-01** |
| :--- | :--- |
| **Tên tài liệu** | Bản Hiến chương Dự án (Project Charter) |
| **Dự án** | Quản lý dự án phần mềm - Nhóm 8 |
| **Đơn vị phát triển** | Sinh viên Khóa D21 - Học viện Công nghệ Bưu chính Viễn thông (PTIT) |
| **Project Leader & Core Dev** | **phong phạm** (`@phongphm2` / `phongg2905`) - Quản trị dự án & Kỹ sư phát triển kỹ thuật |
| **Đội ngũ thực hiện chính** | **phong phạm**, **Long Phạm** (`@longphm11`), **Minh Tâm** (`@tamminh6`) |
| **Phân công chuyên trách** | **phong phạm** (Project Leader & Full-stack Dev) \| **Long Phạm** (System Analyst & QA Lead) \| **Minh Tâm** (Technical & Frontend Lead) |
| **Ngày ban hành** | 30/09/2026 |
| **Phiên bản** | **v1.0 (Chính thức ban hành & Ký duyệt)** |
| **Tiêu chuẩn áp dụng** | PMBOK Guide 7th Edition (Project Management Body of Knowledge) & Agile/Scrum Framework |

---

## 1. MỤC ĐÍCH THÀNH LẬP DỰ ÁN & LÝ DO KINH DOANH (PROJECT PURPOSE & BUSINESS CASE)

### 1.1. Bối cảnh thực tiễn (Context)
Thị trường đào tạo ngoại ngữ tại Việt Nam đang phát triển mạnh mẽ với hàng nghìn trung tâm Anh ngữ lớn nhỏ. Tuy nhiên, theo kết quả khảo sát thực tế tại tài liệu `[BA-01]`, đại đa số các trung tâm vừa và nhỏ (quy mô 500 – 2000 học viên) vẫn đang vận hành dựa trên các công cụ thủ công rời rạc:
- Tiếp nhận và theo dõi khách hàng tiềm năng (Leads) qua file Google Sheets / Excel cá nhân.
- Trao đổi, đặt lịch thi và xếp lớp thông qua nhóm chat Zalo / Messenger nội bộ.
- Ghi nhận điểm số kiểm tra trình độ (Placement Test) trên giấy phiếu và nhập liệu thủ công nhiều lần.

### 1.2. Lý do kinh doanh (Business Case & Pain Points)
Phương thức quản lý thủ công trên gây ra 4 điểm nghẽn nghiêm trọng:
1. **Thất thoát cơ hội kinh doanh (Lead Leakage):** Tỉ lệ phản hồi chậm > 2 giờ khiến 30% khách hàng tiềm năng chuyển sang trung tâm đối thủ; không có quy trình phân bổ lead minh bạch.
2. **Xung đột tài nguyên đào tạo (Resource Conflicts):** Xảy ra tình trạng trùng phòng thi, trùng lịch giáo viên chấm thi và tranh chấp sĩ số giữa các tư vấn viên khi xếp lớp.
3. **Phân mảnh dữ liệu học vụ (Data Silos):** Lịch sử học viên, điểm thi và tình trạng học phí bị phân tán, khiến lãnh đạo trung tâm không thể nắm bắt báo cáo thời gian thực.
4. **Lãng phí chi phí nhân sự:** Nhân viên tư vấn và giáo vụ mất từ 15 – 20 giờ mỗi tuần chỉ cho các thao tác sao chép dữ liệu, đối soát thủ công.

### 1.3. Mục đích dự án (Project Statement)
Dự án **EduFlow CRM** được thành lập nhằm số hóa toàn diện quy trình vận hành khép kín từ khâu tiếp nhận khách hàng tiềm năng, tổ chức kiểm tra trình độ, xếp lớp học viên cho đến quản trị đào tạo; tạo lập nền tảng Web Application hiện đại, tin cậy, tối ưu hóa tỷ lệ chuyển đổi và nâng cao chất lượng dịch vụ giáo dục.

---

## 2. MỤC TIÊU DỰ ÁN THEO CHUẨN S.M.A.R.T (PROJECT OBJECTIVES)

Dự án xác định các mục tiêu cốt lõi theo nguyên tắc S.M.A.R.T:

| Tiêu chí | Nội dung cam kết thực hiện |
| :--- | :--- |
| **S (Specific - Cụ thể)** | Xây dựng hoàn chỉnh hệ sinh thái Web CRM tích hợp 3 luồng nghiệp vụ cốt lõi: Tiếp nhận & Pipeline Lead (UC-01), Đặt lịch & Chấm điểm Placement Test (UC-02), Quản lý Khóa học, Lớp học & Xếp lớp tự động (UC-03). |
| **M (Measurable - Đo lường được)** | - Rút ngắn thời gian xử lý Lead từ 120 phút xuống dưới 15 phút.<br>- Loại bỏ 100% rủi ro trùng lịch thi, trùng giáo viên và vượt sĩ số tối đa của lớp học.<br>- Tốc độ tải trang < 1.5s, độ trễ API < 200ms đối với các tác vụ thông thường. |
| **A (Achievable - Khả thi)** | Đội ngũ dự án làm chủ công nghệ Full-stack hiện đại: PostgreSQL (Cơ sở dữ liệu), Node.js / Express (Backend REST API), React + Vite + TypeScript (Frontend), áp dụng Design System chuẩn Mantine & Cosmic Sunset. |
| **R (Relevant - Thực tế)** | Giải quyết trực tiếp các bài toán sống còn của trung tâm Anh ngữ; đồng thời đáp ứng toàn bộ yêu cầu học thuật của đồ án môn học *Quản lý dự án phần mềm*. |
| **T (Time-bound - Thời hạn)** | Dự án được tổ chức thành 4 Sprint trong vòng 8 tuần, hoàn thành đầy đủ sản phẩm, tài liệu kiểm thử và slide bảo vệ trước hội đồng chấm thi. |

---

## 3. PHẠM VI DỰ ÁN (PROJECT SCOPE)

### 3.1. Các hạng mục thuộc phạm vi (In-Scope)

1. **Phân hệ Quản trị Hệ thống & Phân quyền (RBAC & Auth):**
   - Đăng nhập, làm mới token (JWT Access & Refresh Token), mã hóa mật khẩu an toàn.
   - Phân quyền theo 4 vai trò: Admin (Quản trị viên), Academic Manager (Giáo vụ), Teacher (Giáo viên), Consultant/Sales (Tư vấn viên).
2. **Phân hệ Tuyển sinh & Kanban Lead Pipeline (UC-01):**
   - Thu thập Lead từ đa kênh (Form đăng ký, Hotline, Facebook Ads).
   - Bảng kéo thả Kanban trực quan theo các trạng thái: `New`, `Contacted`, `Test Scheduled`, `Enrolled`, `Lost`.
   - Phân bổ tư vấn viên tự động hoặc thủ công; nhật ký tương tác (Consultation Logs).
3. **Phân hệ Đặt lịch & Chấm điểm Placement Test (UC-02):**
   - Đặt lịch thi đánh giá năng lực 4 kỹ năng (Nghe, Nói, Đọc, Viết).
   - Thuật toán tự động phát hiện và ngăn ngừa xung đột lịch phòng thi & giáo viên chấm thi.
   - Bảng nhập điểm và thuật toán tự động quy đổi thang điểm (IELTS / TOEIC / CEFR) sang khóa học đề xuất tương ứng.
4. **Phân hệ Quản lý Khóa học, Lớp học & Xếp lớp tự động (UC-03):**
   - Quản lý danh mục Khóa học (Course), Lớp học (Class), Phòng học (Room).
   - Wizard xếp lớp thông minh: kiểm tra sĩ số tối đa (`max_students`), chuyển đổi trạng thái học viên sang chính thức (`Enrolled`) và giảm chỉ tiêu lớp.
5. **Dashboard Thống kê & Báo cáo:**
   - Biểu đồ phễu tuyển sinh, thống kê tỉ lệ chuyển đổi lead và báo cáo lấp đầy sĩ số các lớp.
6. **Kiểm thử & Bàn giao:**
   - Kịch bản kiểm thử tích hợp (Integration Test), hồ sơ báo cáo lỗi (Bug Report) và bộ tài liệu đồ án tổng kết.

### 3.2. Các hạng mục ngoài phạm vi (Out-of-Scope)

Nhằm đảm bảo dự án không bị phình to phạm vi (Scope Creep) trong giới hạn thời gian đồ án môn học, các tính năng sau được xác nhận nằm ngoài phạm vi thực hiện:
- **Cổng thanh toán trực tuyến tự động qua ngân hàng (Payment Gateway Live API):** Hệ thống chỉ mô phỏng và ghi nhận biên lai thu học phí nội bộ.
- **Phòng học ảo tích hợp Video Call (LMS Live Streaming / Zoom SDK):** Hệ thống chỉ tập trung vào quản lý lịch học và nghiệp vụ CRM.
- **Ứng dụng di động Native (iOS/Android App):** Tập trung phát triển Web Application tối ưu Responsive toàn diện trên trình duyệt di động và máy tính bảng.

---

## 4. CƠ CẤU TỔ CHỨC DỰ ÁN & MA TRẬN RACI (PROJECT ROLES & GOVERNANCE)

### 4.1. Cơ cấu nhân sự dự án (Team Structure)

```
                       ┌─────────────────────────────────────────┐
                       │    PROJECT LEADER & CORE DEVELOPER      │
                       │    phong phạm (@phongphm2)              │
                       │ (Chỉ đạo dự án, Duyệt PR & Code Chung)  │
                       └────────────────────┬────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    │                                               │
┌───────────────────▼───────────────────┐       ┌───────────────────▼───────────────────┐
│     SYSTEM ANALYST & QA LEAD          │       │     TECHNICAL & FRONTEND LEAD         │
│     Long Phạm (@longphm11)            │       │     Minh Tâm (@tamminh6)              │
│ (Khảo sát nghiệp vụ, SRS, Test & Code)│       │ (Kiến trúc hệ thống, UI/UX & Code FE) │
└───────────────────────────────────────┘       └───────────────────────────────────────┘
```

> **Đặc thù tổ chức nhóm:** Toàn bộ 3 thành viên (**Phong, Long, Tâm**) đều trực tiếp bắt tay vào thực hiện mã nguồn (Hands-on Development), kiểm thử và hoàn thiện hồ sơ đồ án. Leader **phong phạm** vừa đảm nhận vai trò quản trị chung, điều phối tiến độ, nghiệm thu PR, vừa trực tiếp tham gia lập trình các module kỹ thuật cốt lõi cùng các thành viên.

### 4.2. Ma trận phân công trách nhiệm (RACI Matrix)
*(R: Responsible - Người trực tiếp thực hiện/lập trình chính, A: Accountable - Người phê duyệt cuối cùng, C: Consulted - Người được tham vấn, I: Informed - Người nhận thông tin)*

| Gói công việc (Work Package) | Project Leader & Dev (phong phạm) | SA & QA Lead (Long Phạm) | Tech & FE Lead (Minh Tâm) |
| :--- | :---: | :---: | :---: |
| **Khởi động dự án & Lập Project Charter** | **A / R** | **R** | **R** |
| **Khảo sát nghiệp vụ & Yêu cầu (BA, SRS, UML)** | **A / R** | **R** | C |
| **Thiết kế CSDL (Conceptual ERD, Physical DB)** | **A / R** | C | **R** |
| **Thiết kế UI/UX & Interactive Prototype** | **A / R** | C | **R** |
| **Phát triển Backend Base Server, DB Pool & Auth**| **A / R** | I | **R** |
| **Phát triển Frontend Base Layout & Design System**| **A / R** | I | **R** |
| **Phát triển Phân hệ Lead Pipeline (UC-01)** | **A / R** | C | **R** |
| **Phát triển Phân hệ Placement Test (UC-02)** | **A / R** | C | **R** |
| **Phát triển Phân hệ Khóa học & Xếp lớp (UC-03)** | **A / R** | C | **R** |
| **Kiểm thử tích hợp & Báo cáo Lỗi (Integration Test)**| **A / R** | **R** | C |
| **Báo cáo tổng kết đồ án, Slide & Video Demo** | **A / R** | **R** | **R** |

---

## 5. KẾ HOẠCH LỘ TRÌNH & CỘT MỐC CHÍNH (MILESTONES & SPRINT ROADMAP)

Dự án áp dụng mô hình phát triển linh hoạt **Scrum** với chu kỳ 4 Sprint:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    SPRINT 1     │ ──> │    SPRINT 2     │ ──> │    SPRINT 3     │ ──> │    SPRINT 4     │
│ Khảo sát & Phân │     │ Thiết kế & Dựng │     │ Phát triển tính │     │ Kiểm thử, Báo   │
│ tích Yêu cầu    │     │ Kiến trúc Base  │     │ năng nghiệp vụ  │     │ cáo & Bảo vệ    │
│  (6/6 Done ✅)  │     │ (Đang chạy 🔄)  │     │  (Backlog 📋)   │     │  (Backlog 📋)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

| Cột mốc (Milestone) | Nội dung công việc chính | Sản phẩm đầu ra (Deliverables) | Tình trạng |
| :--- | :--- | :--- | :---: |
| **M1: Hoàn thành Phân tích & Đặc tả** | Khảo sát điểm nghẽn, vẽ BPMN, viết SRS, sơ đồ Use Case và Conceptual ERD. | `BA-01`, `BA-02`, `SRS-01`, `UML-01`, `UML-02`, `DB-01`. | **ĐÃ HOÀN THÀNH (Done)** |
| **M2: Khóa Design System & Nền tảng Kỹ thuật** | Khóa giao diện Mantine Theme, sinh mã DDL PostgreSQL, dựng khung Server BE và Layout Admin FE. | `DES-01`, `DB-02`, `BE-01`, `FE-01`. | **ĐANG TIẾN HÀNH (In Progress)** |
| **M3: Hoàn thành 3 Phân hệ Nghiệp vụ Cốt lõi** | Phát triển Full-stack 3 Use Case: Lead Kanban, Placement Test, Quản lý Khóa học & Xếp lớp. | `BE-02 -> BE-05`, `FE-02 -> FE-05`. | **KẾ HOẠCH (Sprint 3)** |
| **M4: Kiểm thử, Nghiệm thu & Bảo vệ Đồ án** | Chạy kiểm thử tích hợp toàn diện, lập báo cáo đồ án, thiết kế slide và video demo thực tế. | `TEST-01`, `DOC-FINAL`, `DEMO-01`. | **KẾ HOẠCH (Sprint 4)** |

---

## 6. QUY TẮC RÀNG BUỘC KỶ LUẬT & QUẢN TRỊ DỰ ÁN (PROJECT BINDING RULES)

Dự án tuân thủ nghiêm ngặt **Bản quy tắc kỷ luật ràng buộc** đã được thiết lập tại file `AGENTS.md`:

1. **Kỷ luật nhánh Git (Branch Discipline):**
   - **Tuyệt đối 100% công việc phải thực hiện trên Feature / Docs Branch riêng biệt** (ví dụ: `feat/be-base-server-postgres`, `feat/fe-base-design-system`).
   - Quy trình Git chỉ dừng lại ở bước: `git checkout -b <branch>` $\rightarrow$ `git add` $\rightarrow$ `git commit` $\rightarrow$ `git push -u origin <branch>` và soạn mô tả Pull Request (PR).
   - **Nghiêm cấm tuyệt đối:** `git checkout main`, `git merge`, hoặc `git push origin main`.
   - **Quyền hạn duy nhất:** Chỉ có Leader (`@phongphm2`) mới có quyền thực hiện thao tác Merge vào nhánh `main` trên GitHub sau khi kiểm thử và nghiệm thu thực tế.
2. **Kỷ luật quản trị thẻ việc Trello:**
   - Tuyệt đối không tự ý di chuyển thẻ sang cột `Done` hoặc tích đóng checklist khi chưa có xác nhận bằng lời từ Leader.
   - Thẻ hoàn thành kỹ thuật chỉ được phép đặt ở cột `In Progress` để chờ kiểm tra và nghiệm thu.
3. **Quy chuẩn Liêm chính Học thuật (Academic Integrity):**
   - Tên nhánh và commit message viết bằng tiếng Anh chuẩn theo Conventional Commits (`feat:`, `docs:`, `fix:`, `refactor:`).
   - Bảo mật tuyệt đối: Không đề cập các từ ngữ trí tuệ nhân tạo sinh tự động trong code, tài liệu nộp và commit message.

---

## 7. QUẢN LÝ RỦI RO DỰ ÁN (RISK MANAGEMENT & MITIGATION)

| STT | Rủi ro tiềm ẩn (Risk Description) | Mức độ | Biện pháp phòng ngừa & Kế hoạch ứng phó (Mitigation Strategy) |
| :-: | :--- | :---: | :--- |
| **R1** | **Xung đột mã nguồn khi ghép các phân hệ** | Cao | Phân rã rành mạch các task độc lập giữa Backend API và Frontend UI; quy định chuẩn OpenAPI Swagger trước khi viết mã giao diện; kiểm tra mã chéo qua Pull Request. |
| **R2** | **Trễ tiến độ do khối lượng công việc lớn** | Trung bình | Áp dụng triệt để nguyên tắc MoSCoW: tập trung tối đa nguồn lực vào nhóm chức năng Bắt buộc (Must-have - 3 Use Case chính), dời các tiện ích phụ sang giai đoạn nâng cấp sau. |
| **R3** | **Lỗi xung đột lịch phòng thi & quá sĩ số lớp** | Cao | Ràng buộc chặt chẽ từ tầng Cơ sở dữ liệu (Unique Constraint, Check Constraint) kết hợp với Transaction Lock ở tầng Backend Service trước khi ghi nhận bản ghi. |
| **R4** | **Phình to phạm vi (Scope Creep)** | Trung bình | Kiểm soát nghiêm ngặt ranh giới đã quy định tại Mục 3.2 (Out-of-Scope); mọi yêu cầu phát sinh phải được Leader phê duyệt đánh giá tác động trước khi thực hiện. |

---

## 8. TIÊU CHÍ NGHIỆM THU DỰ ÁN & PHÊ DUYỆT (PROJECT ACCEPTANCE & SIGN-OFF)

Dự án được nghiệm thu chính thức khi đạt đủ các tiêu chuẩn sau:
- [x] Đầy đủ hồ sơ tài liệu kỹ thuật chuẩn mực: Khảo sát nghiệp vụ, Đặc tả yêu cầu SRS, Sơ đồ Use Case UML, Mô hình CSDL ERD & Physical Schema, Tài liệu UI/UX Design System.
- [ ] Phần mềm CRM vận hành trơn tru trên môi trường thực tế, vượt qua toàn bộ các ca kiểm thử tích hợp cho 3 luồng nghiệp vụ cốt lõi.
- [ ] Báo cáo tổng kết đồ án trình bày chuyên nghiệp, đúng quy cách học viện; Slide bảo vệ súc tích và Video Demo phần mềm chân thực.

### KÝ DUYỆT BAN HÀNH HIẾN CHƯƠNG DỰ ÁN

| Đội ngũ phát triển (Đồng thực hiện chính) | Project Leader & Core Developer duyệt |
| :---: | :---: |
| *(Đã cùng thống nhất & ký xác nhận)* | *(Đã ký duyệt & cùng thực hiện)* |
| **Long Phạm & Minh Tâm** | **phong phạm** (`@phongphm2`) |
| Ngày: 30/09/2026 | Ngày: 30/09/2026 |
