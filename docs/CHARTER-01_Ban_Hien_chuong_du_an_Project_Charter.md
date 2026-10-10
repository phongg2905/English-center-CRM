# BẢN HIẾN CHƯƠNG DỰ ÁN (PROJECT CHARTER)
## HỆ THỐNG CRM QUẢN LÝ TUYỂN SINH VÀ ĐÀO TẠO TRUNG TÂM ANH NGỮ (EDUFLOW CRM)

---

### THÔNG TIN TỔNG QUAN TÀI LIỆU (DOCUMENT METADATA)

| Thuộc tính | Chi tiết định danh |
| :--- | :--- |
| **Mã tài liệu** | **CHARTER-01** |
| **Tên tài liệu** | Bản Hiến chương Dự án Phần mềm (Software Project Charter) |
| **Tên dự án** | Hệ thống CRM Quản lý Tuyển sinh và Đào tạo Trung tâm Anh ngữ (EduFlow CRM) |
| **Học phần** | Quản lý Dự án Phần mềm (Software Project Management) |
| **Đơn vị đào tạo** | Học viện Công nghệ Bưu chính Viễn thông (PTIT) - Khoa Công nghệ Thông tin |
| **Nhóm thực hiện** | Nhóm 8 |
| **Project Sponsor** | Giảng viên hướng dẫn học phần & Ban đánh giá chuyên môn |
| **Project Manager (Leader)** | **phong phạm** (`@phongphm2` / `phongg2905`) - Quản trị dự án & Kỹ sư Full-stack |
| **Đội ngũ kỹ thuật nòng cốt** | **Long Phạm** (`@longphm11`) - Phân tích nghiệp vụ & Trưởng nhóm QA<br>**Minh Tâm** (`@tamminh6`) - Kiến trúc kỹ thuật & Trưởng nhóm Frontend |
| **Ngày ban hành** | 30/09/2026 |
| **Phiên bản tài liệu** | **v2.0 (Bản chuẩn hóa toàn diện theo chuẩn PMBOK & Agile/Scrum)** |
| **Tiêu chuẩn đối sánh** | Hướng dẫn PMBOK 7th Edition (Project Management Institute - PMI) & Scrum Guide |

---

## 1. MỤC ĐÍCH THÀNH LẬP DỰ ÁN & LÝ DO KINH DOANH (PROJECT PURPOSE & BUSINESS CASE)

### 1.1. Bối cảnh thực tiễn ngành (Industry Context)
Trong xu thế hội nhập quốc tế, nhu cầu học tiếng Anh để phục vụ học tập, thi chứng chỉ chuẩn hóa (IELTS, TOEIC, CEFR, Cambridge) và thăng tiến nghề nghiệp tại Việt Nam liên tục tăng trưởng mạnh. Tuy nhiên, theo khảo sát thực tế tại tài liệu `[BA-01]`, đại đa số các trung tâm Anh ngữ có quy mô từ 500 đến 2.000 học viên hiện vẫn đang vận hành bằng phương thức phân mảnh truyền thống:
* **Thu thập dữ liệu thủ công:** Tiếp nhận thông tin học viên tiềm năng (Lead) qua biểu mẫu rời rạc, ghi nhận vào các file Google Sheets/Excel cá nhân của từng nhân viên tư vấn.
* **Quy trình kiểm tra năng lực rời rạc:** Tổ chức kỳ thi đánh giá năng lực đầu vào (Placement Test) thông qua giấy thi vật lý, đặt lịch thi thủ công qua các nhóm chat (Zalo/Messenger), dẫn đến tình trạng chồng chéo ca thi và trùng phòng.
* **Xếp lớp và theo dõi học vụ thiếu đồng bộ:** Việc kiểm tra sĩ số tối đa, phân bổ lớp học và ghi nhận học phí diễn ra phân tán, thiếu cơ chế khóa dữ liệu thời gian thực.

### 1.2. Vấn đề nghiệp vụ & Điểm nghẽn cốt lõi (Problem Statement & Pain Points)
Quy trình vận hành thủ công dẫn đến 4 vấn đề kinh doanh nghiêm trọng ảnh hưởng trực tiếp đến doanh thu và uy tín của trung tâm:
1. **Thất thoát khách hàng tiềm năng (Lead Leakage):** Thời gian phản hồi Lead mới trung bình vượt quá 120 phút; tỷ lệ thất thoát cơ hội lên đến 30 - 35% do khách hàng chuyển hướng sang trung tâm đối thủ khi không được liên hệ kịp thời.
2. **Xung đột tài nguyên học vụ (Resource Scheduling Conflicts):** Xảy ra liên tục tình trạng trùng lịch giáo viên chấm thi nói/viết, trùng phòng thi và tình trạng lớp vượt quá sĩ số tối đa (`max_students`), làm suy giảm nghiêm trọng chất lượng giảng dạy.
3. **Phân mảnh dữ liệu & Báo cáo trễ (Data Silo & Blind Reporting):** Ban giám đốc trung tâm không có góc nhìn tổng thể theo thời gian thực về hiệu suất tuyển sinh, tỷ lệ chuyển đổi qua các phễu và tỷ lệ lấp đầy của các lớp học.
4. **Chi phí vận hành nhân sự lãng phí:** Nhân sự tư vấn và giáo vụ phải tiêu tốn 15 - 20 giờ làm việc mỗi tuần chỉ để copy-paste dữ liệu, dò trùng và đối soát số liệu giữa các file bảng tính.

### 1.3. Giải pháp đề xuất & Mục đích dự án (Proposed Solution & Project Statement)
Dự án **EduFlow CRM** được chính thức phê chuẩn thành lập nhằm thiết kế, phát triển và chuyển giao một hệ thống Web Application CRM quản trị tập trung, chuyên biệt cho trung tâm ngoại ngữ. Hệ thống kết nối liền mạch quy trình nghiệp vụ từ khâu **Tiếp nhận & Chăm sóc Lead** $\rightarrow$ **Đặt lịch & Chấm điểm Placement Test** $\rightarrow$ **Tư vấn khóa học & Xếp lớp tự động**, mang lại môi trường vận hành minh bạch, chính xác và hiệu quả cao.

### 1.4. Phân tích Giá trị Kinh doanh & Lợi ích đầu tư (Business Value & Benefit Realization)
* **Lợi ích định tính:** Chuẩn hóa quy trình vận hành theo tiêu chuẩn chất lượng cao; nâng cao hình ảnh chuyên nghiệp của trung tâm trong mắt học viên và phụ huynh; tạo nền tảng vững chắc cho việc mở rộng quy mô chi nhánh.
* **Lợi ích định lượng:**
  * Giảm thời gian phản hồi Lead từ 120 phút xuống dưới 15 phút.
  * Tăng tỷ lệ chuyển đổi từ Lead sang Học viên chính thức lên tối thiểu 35%.
  * Triệt tiêu 100% rủi ro trùng lịch thi, trùng giáo viên và vượt sĩ số tối đa của lớp học nhờ cơ chế ràng buộc toàn vẹn cơ sở dữ liệu (ACID Transactions & Constraints).
  * Tiết kiệm 80% thời gian tổng hợp báo cáo quản trị học vụ định kỳ cho ban giám đốc.

---

## 2. MỤC TIÊU DỰ ÁN & TIÊU CHÍ THÀNH CÔNG (PROJECT OBJECTIVES & SUCCESS CRITERIA)

### 2.1. Mục tiêu theo tiêu chuẩn S.M.A.R.T
Dự án cam kết đạt được các mục tiêu được lượng hóa rõ ràng:

| Tiêu chí S.M.A.R.T | Nội dung cam kết cụ thể |
| :--- | :--- |
| **S (Specific - Cụ thể)** | Xây dựng hoàn chỉnh nền tảng Web CRM với 3 luồng Use Case trọng yếu đã được đặc tả tại `[UML-02]`: Quản lý Phễu Lead Kanban (UC-01), Đặt lịch & Chấm điểm Placement Test (UC-02), Quản lý Khóa học, Lớp học & Xếp lớp tự động (UC-03), tích hợp phân quyền RBAC 4 vai trò. |
| **M (Measurable - Đo lường được)** | - 100% các Use Case cốt lõi vượt qua bộ kịch bản kiểm thử chức năng và tích hợp.<br>- Tốc độ tải trang ban đầu $\le 1.5$ giây, thời gian phản hồi API trung bình $\le 200$ms trên môi trường máy chủ tiêu chuẩn.<br>- Độ bao phủ mã nguồn kiểm thử (Test Coverage) cho các luồng nghiệp vụ lõi đạt tối thiểu 80%. |
| **A (Achievable - Khả thi)** | Đội ngũ kỹ thuật sử dụng ngăn xếp công nghệ (Technology Stack) hiện đại, đồng bộ và giàu kinh nghiệm thực tế: PostgreSQL (CSDL quan hệ), Node.js/Express (RESTful Backend), React + TypeScript + Vite (Frontend SPA), áp dụng chặt chẽ Design System độc quyền Mantine & Cosmic Sunset. |
| **R (Relevant - Thực tiễn)** | Đáp ứng 100% các chuẩn đầu ra học thuật của đồ án môn học *Quản lý Dự án Phần mềm*; trực tiếp giải quyết trọn vẹn bài toán vận hành thực tế tại các cơ sở đào tạo ngoại ngữ. |
| **T (Time-bound - Thời hạn)** | Dự án được chia nhỏ thành 4 Sprint với tổng thời gian 8 tuần, nghiệm thu toàn bộ tài liệu kỹ thuật, mã nguồn đóng gói, video demo và slide bảo vệ trước hạn chót của học viện. |

### 2.2. Tiêu chí thành công của dự án (Project Success Criteria)
1. **Tiêu chí Nghiệp vụ & Khách hàng:** Hệ thống đáp ứng trọn vẹn quy trình nghiệp vụ đã khảo sát tại `[BA-01]` và quy trình BPMN tại `[BA-02]`, giúp nhân viên thao tác trực quan, không mất thời gian đào tạo phức tạp.
2. **Tiêu chí Kỹ thuật:** Kiến trúc phần mềm phân tầng rõ ràng (Controller - Service - Repository), cơ sở dữ liệu đạt chuẩn hóa 3NF (`[DB-01]`, `[DB-02]`), bảo mật bằng JWT và mã hóa bcrypt.
3. **Tiêu chí Tiến độ:** Toàn bộ 4 cột mốc quan trọng (Milestones M1 đến M4) hoàn thành đúng thời hạn cam kết, không phát sinh chậm trễ tiến độ bảo vệ.
4. **Tiêu chí Học thuật & Kỷ luật Kỹ thuật:** Toàn bộ tài liệu nộp đồ án, thông điệp cam kết (commit message), cấu trúc mã nguồn đạt chuẩn mực công nghiệp quốc tế, tuân thủ 100% tính liêm chính học thuật và quy chuẩn phát triển phần mềm của nhóm.

---

## 3. PHẠM VI DỰ ÁN & SẢN PHẨM BÀN GIAO (PROJECT SCOPE & DELIVERABLES)

### 3.1. Phạm vi thực hiện (In-Scope)
Hệ thống EduFlow CRM tập trung phát triển 6 phân hệ chức năng cấp cao:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   HỆ THỐNG EDUFLOW CRM (IN-SCOPE)                      │
├───────────────────────────────────┬────────────────────────────────────┤
│ 1. Xác thực & Phân quyền (RBAC)   │ 4. Đặt lịch & Chấm điểm Test (UC-02)│
│    - JWT Access & Refresh Token   │    - Đặt lịch thi 4 kỹ năng        │
│    - 4 Vai trò: Admin, Academic,  │    - Phát hiện & khóa trùng lịch   │
│      Teacher, Consultant/Sales    │    - Quy đổi điểm sang khóa học    │
├───────────────────────────────────┼────────────────────────────────────┤
│ 2. Quản lý Danh mục Đào tạo       │ 5. Quản lý Lớp học & Xếp lớp (UC-03│
│    - Danh mục Khóa học & Cấp độ   │    - Quản lý Lớp, Sĩ số, Giáo viên │
│    - Danh mục Phòng học & Cơ sở   │    - Wizard xếp lớp tự động        │
├───────────────────────────────────┼────────────────────────────────────┤
│ 3. Tuyển sinh & Lead Kanban (UC-01│ 6. Báo cáo & Dashboard Thống kê    │
│    - Thu thập Lead đa kênh        │    - Phễu chuyển đổi tuyển sinh    │
│    - Bảng Kanban kéo thả 5 bước   │    - Tỷ lệ lấp đầy sĩ số các lớp   │
│    - Lịch sử tương tác tư vấn     │    - Báo cáo kết quả đầu vào       │
└───────────────────────────────────┴────────────────────────────────────┘
```

### 3.2. Phạm vi không thực hiện (Out-of-Scope & Scope Boundaries)
Nhằm tập trung tối đa nguồn lực vào giải quyết triệt để các bài toán cốt lõi và phòng ngừa rủi ro phình to phạm vi (Scope Creep) trong phạm vi đồ án học kỳ, các hạng mục sau được loại trừ rõ ràng:
* **Tích hợp Cổng thanh toán trực tuyến (Payment Gateway Live API):** Hệ thống chỉ quản lý biên lai và trạng thái thu nộp học phí nội bộ (Cash/Transfer), không kết nối API trực tiếp với ngân hàng hay ví điện tử bên ngoài.
* **Hệ thống Lớp học ảo tương tác thời gian thực (LMS Video Streaming):** Dự án không nhúng WebRTC/Zoom SDK để học online; chỉ tập trung vào nghiệp vụ quản trị tuyển sinh, xếp lịch và đào tạo (CRM/ERP).
* **Ứng dụng di động độc lập (Native iOS/Android App):** Tập trung tối ưu hóa 100% Responsive trên Web Application (hỗ trợ toàn diện từ Desktop, Tablet đến Smartphone qua trình duyệt hiện đại).

### 3.3. Các sản phẩm bàn giao chính (Key Deliverables)
1. **Bộ Hồ sơ Thiết kế & Phân tích Hoàn chỉnh:**
   * `[BA-01]`: Báo cáo khảo sát nghiệp vụ thực tế & xác định điểm nghẽn.
   * `[BA-02]`: Sơ đồ quy trình nghiệp vụ tổng quan BPMN 2.0.
   * `[SRS-01]`: Đặc tả yêu cầu phần mềm chi tiết (Chức năng & Phi chức năng).
   * `[UML-01]`: Xác định Actors và Sơ đồ Use Case tổng quan hệ thống.
   * `[UML-02]`: Đặc tả kịch bản Use Case chi tiết cho 3 luồng chính.
   * `[DB-01]`: Từ điển dữ liệu và Mô hình Thực thể Quan hệ (Conceptual ERD).
   * `[DB-02]`: Lược đồ CSDL vật lý (Physical Schema) và Script DDL PostgreSQL.
   * `[DES-01]`: Bộ tiêu chuẩn UI/UX Design System & Prototype tương tác.
2. **Bộ Mã nguồn Ứng dụng (Application Source Code):**
   * Mã nguồn Backend REST API (Node.js/Express, TypeScript, Prisma/pg-pool).
   * Mã nguồn Frontend SPA (React, TypeScript, Vite, Mantine Design System).
3. **Bộ Tài liệu Kiểm thử & Nghiệm thu:**
   * Kịch bản kiểm thử tích hợp (Integration Test Cases & Test Runs).
   * Báo cáo tổng kết dự án, Slide thuyết trình bảo vệ và Video kịch bản demo hệ thống.

---

## 4. PHÂN TÍCH CÁC BÊN LIÊN QUAN (STAKEHOLDER ANALYSIS & REGISTER)

| Bên liên quan (Stakeholder) | Đại diện / Thành phần | Mức độ Ảnh hưởng (Power) | Mức độ Quan tâm (Interest) | Kỳ vọng cốt lõi | Chiến lược tương tác (Engagement Strategy) |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **Giảng viên hướng dẫn (Project Sponsor)** | Giảng viên bộ môn Quản lý Dự án Phần mềm (PTIT) | **Cao (High)** | **Cao (High)** | Đồ án bám sát tiến độ học phần, tài liệu chuẩn mực PMBOK, sản phẩm hoàn thiện, liêm chính học thuật. | Báo cáo tiến độ qua từng Sprint Milestone, trình nộp tài liệu đúng định dạng và hạn nộp. |
| **Project Manager & Core Dev** | **phong phạm** (`@phongphm2`) | **Cao (High)** | **Cao (High)** | Kiểm soát toàn diện chất lượng, tiến độ, kiến trúc, kỷ luật Git và bảo vệ thành công đồ án. | Chủ trì điều phối công việc hàng ngày, trực tiếp kiểm thử và ký duyệt code vào nhánh chính. |
| **System Analyst & QA Lead** | **Long Phạm** (`@longphm11`) | Trung bình | **Cao (High)** | Nghiệp vụ chuẩn xác, kịch bản use case mạch lạc, kiểm thử bao phủ toàn bộ các kịch bản ngoại lệ. | Rà soát chéo tài liệu nghiệp vụ, viết kịch bản test và phối hợp lập trình module. |
| **Technical & Frontend Lead** | **Minh Tâm** (`@tamminh6`) | Trung bình | **Cao (High)** | Giao diện hiện đại, trải nghiệm mượt mà, cấu trúc code sạch, tuân thủ nghiêm ngặt Design System. | Thiết kế UI/UX, tối ưu component, tích hợp API và đảm bảo hiệu năng client. |
| **Nhân viên Tuyển sinh (Consultant/Sales)** | Người dùng cuối giả định (End-User) | Thấp | **Cao (High)** | Dễ dàng quản lý Lead, không bị sót khách hàng, kéo thả trạng thái nhanh chóng. | Cung cấp giao diện Kanban trực quan, tự động hóa nhắc lịch chăm sóc. |
| **Bộ phận Giáo vụ & Quản lý (Academic Staff)** | Người dùng cuối giả định (End-User) | Trung bình | **Cao (High)** | Không còn xung đột ca thi, phòng học; quy đổi điểm số chính xác; xếp lớp minh bạch. | Tự động hóa thuật toán kiểm tra ràng buộc lịch thi và chỉ tiêu sĩ số. |

---

## 5. CƠ CẤU TỔ CHỨC DỰ ÁN, QUYỀN HẠN PM & MA TRẬN RACI

### 5.1. Sơ đồ cơ cấu tổ chức nhóm (Project Organization Hierarchy)

```
                            ┌───────────────────────────────────────────────┐
                            │               PROJECT SPONSOR                 │
                            │    Giảng viên Hướng dẫn & Bộ môn QLDA (PTIT)  │
                            └───────────────────────┬───────────────────────┘
                                                    │ (Định hướng & Đánh giá)
                                                    ▼
                            ┌───────────────────────────────────────────────┐
                            │        PROJECT MANAGER & CORE DEVELOPER       │
                            │             phong phạm (@phongphm2)           │
                            │ (Chỉ huy tổng thể, Duyệt Kiến trúc & Ký Duyệt)│
                            └───────────────────────┬───────────────────────┘
                                                    │
                                ┌───────────────────┴───────────────────┐
                                │                                       │
    ┌───────────────────────────▼───────────────────┐       ┌───────────▼───────────────────────────┐
    │          SYSTEM ANALYST & QA LEAD             │       │       TECHNICAL & FRONTEND LEAD       │
    │           Long Phạm (@longphm11)              │       │          Minh Tâm (@tamminh6)         │
    │  - Khảo sát BA & Đặc tả Yêu cầu SRS, UML     │       │  - Kiến trúc Kỹ thuật & Design System  │
    │  - Thiết kế Kịch bản Kiểm thử & QA Lead       │       │  - Xây dựng Giao diện & Tích hợp FE    │
    │  - Trực tiếp tham gia Lập trình Tính năng     │       │  - Trực tiếp tham gia Lập trình BE/FE  │
    └───────────────────────────────────────────────┘       └───────────────────────────────────────┘
```

### 5.2. Thẩm quyền và Trách nhiệm của Project Manager (PM Authority & Roles)
Leader **phong phạm** được trao toàn quyền quản trị và điều phối dự án, bao gồm:
1. **Thẩm quyền Kiểm soát Phiên bản & Kỹ thuật:** Là người duy nhất có quyền duyệt và thực hiện thao tác Merge Pull Request vào nhánh `main` trên GitHub; có quyền yêu cầu tái cấu trúc mã nguồn nếu không đạt chuẩn chất lượng.
2. **Thẩm quyền Quản lý Tiến độ & Tác vụ:** Toàn quyền giao việc, điều chỉnh mức độ ưu tiên của thẻ việc trên bảng Trello; là người duy nhất xác nhận nghiệm thu để chuyển thẻ việc sang trạng thái `Done`.
3. **Thẩm quyền Kiểm soát Phạm vi & Thay đổi:** Phê duyệt hoặc từ chối mọi yêu cầu thay đổi (Change Request) phát sinh trong suốt chu kỳ dự án để đảm bảo tiến độ bảo vệ.
4. **Trách nhiệm Hands-on:** Vừa quản trị dự án, vừa trực tiếp tham gia lập trình các module cốt lõi (Core Engine, CSDL, API lõi).

### 5.3. Ma trận Phân công Trách nhiệm RACI (RACI Responsibility Assignment Matrix)
*Chú thích ký hiệu chuẩn PMI:*
* **R (Responsible):** Người trực tiếp thực hiện công việc / viết mã / soạn thảo.
* **A (Accountable):** Người chịu trách nhiệm phê duyệt cuối cùng và nghiệm thu sản phẩm.
* **C (Consulted):** Người được tham vấn chuyên môn và đóng góp ý kiến.
* **I (Informed):** Người nhận thông tin cập nhật về tiến độ và kết quả.

| Nhóm Gói công việc (WBS Deliverables) | Project Leader & Full-stack Dev<br>*(phong phạm)* | System Analyst & QA Lead<br>*(Long Phạm)* | Technical & Frontend Lead<br>*(Minh Tâm)* |
| :--- | :---: | :---: | :---: |
| **1. Khởi động dự án & Lập Project Charter [CHARTER-01]** | **A / R** | **R** | **R** |
| **2. Khảo sát nghiệp vụ, Quy trình BPMN & SRS [BA-01, BA-02, SRS-01]** | **A / R** | **R** | C |
| **3. Mô hình hóa Use Case & Đặc tả kịch bản [UML-01, UML-02]** | **A / R** | **R** | C |
| **4. Thiết kế CSDL (Conceptual ERD & DDL PostgreSQL) [DB-01, DB-02]** | **A / R** | C | **R** |
| **5. Thiết kế UI/UX Design System & Prototype [DES-01]** | **A / R** | C | **R** |
| **6. Thiết lập Khung Server REST API, DB Pool & Auth JWT [BE-01]** | **A / R** | I | **R** |
| **7. Thiết lập Khung Frontend AppShell & Layout chuẩn [FE-01]** | **A / R** | I | **R** |
| **8. Phát triển Phân hệ Lead Kanban Pipeline (UC-01) [BE/FE-02]** | **A / R** | C | **R** |
| **9. Phát triển Phân hệ Placement Test & Chấm điểm (UC-02) [BE/FE-03]** | **A / R** | C | **R** |
| **10. Phát triển Phân hệ Quản lý Lớp & Xếp lớp tự động (UC-03) [BE/FE-04]**| **A / R** | C | **R** |
| **11. Kiểm thử Tích hợp & Lập Hồ sơ Báo cáo Lỗi [TEST-01]** | **A / R** | **R** | C |
| **12. Tổng hợp Báo cáo Đồ án, Slide Thuyết minh & Video Demo** | **A / R** | **R** | **R** |

---

## 6. KẾ HOẠCH LỘ TRÌNH, TIẾN ĐỘ & CỘT MỐC CHÍNH (MILESTONES & SPRINT ROADMAP)

Dự án áp dụng mô hình phát triển phần mềm linh hoạt **Scrum** trong khuôn khổ 8 tuần, chia thành 4 Sprint chuyên trách:

```
┌───────────────────────────┐     ┌───────────────────────────┐
│         SPRINT 1          │     │         SPRINT 2          │
│   Khảo sát, Phân tích     │ ──> │   Thiết kế CSDL, UI/UX    │
│  & Đặc tả Yêu cầu Hệ thống │     │   & Khung Nền tảng Base   │
│   (Tuần 1 - 2) [HOÀN TẤT] │     │   (Tuần 3 - 4) [ĐANG CHẠY]│
└───────────────────────────┘     └───────────────────────────┘
              │                                 │
              ▼                                 ▼
┌───────────────────────────┐     ┌───────────────────────────┐
│         SPRINT 3          │     │         SPRINT 4          │
│    Phát triển Full-stack  │ ──> │    Kiểm thử Tích hợp,     │
│   3 Phân hệ Nghiệp vụ Cốt lõi│   │    Báo cáo & Bảo vệ Đồ án │
│   (Tuần 5 - 6) [KẾ HOẠCH] │     │   (Tuần 7 - 8) [KẾ HOẠCH] │
└───────────────────────────┘     └───────────────────────────┘
```

### Chi tiết các Cột mốc Quan trọng (Major Project Milestones):

| Mã Cột mốc | Tên Cột mốc (Milestone) | Thời lượng | Sản phẩm bàn giao chính (Deliverables) | Tiêu chí nghiệm thu cột mốc | Tình trạng |
| :---: | :--- | :---: | :--- | :--- | :---: |
| **M1** | **Hoàn thành Phân tích & Đặc tả Yêu cầu** | Tuần 1 - 2 | `CHARTER-01`, `BA-01`, `BA-02`, `SRS-01`, `UML-01`, `UML-02`. | Toàn bộ tài liệu nghiệp vụ được nghiệm thu; Use Case rõ ràng, thống nhất với hội đồng. | **ĐÃ HOÀN THÀNH (Done ✅)** |
| **M2** | **Hoàn thành Thiết kế & Dựng Khung Kỹ thuật** | Tuần 3 - 4 | `DB-01`, `DB-02` (DDL Script), `DES-01` (Prototype), Khung `BE-01`, `FE-01`. | Cơ sở dữ liệu khởi tạo thành công; Layout FE chuẩn Mantine; Server BE kết nối PostgreSQL an toàn. | **ĐANG THỰC HIỆN (In Progress 🔄)** |
| **M3** | **Hoàn thành 3 Luồng Nghiệp vụ Cốt lõi** | Tuần 5 - 6 | Mã nguồn 3 Use Case: Lead Kanban, Placement Test, Xếp lớp tự động (`BE/FE-02, 03, 04`). | Vận hành trơn tru luồng dữ liệu khép kín từ Lead mới tới xếp lớp chính thức; API trả dữ liệu chuẩn. | **KẾ HOẠCH (Backlog 📋)** |
| **M4** | **Kiểm thử Toàn diện, Bàn giao & Bảo vệ** | Tuần 7 - 8 | Hồ sơ kiểm thử `TEST-01`, Báo cáo tổng kết đồ án, Slide thuyết minh, Video Demo. | Vượt qua 100% test cases tích hợp; chuẩn bị đầy đủ hồ sơ bảo vệ trước hội đồng chấm thi. | **KẾ HOẠCH (Backlog 📋)** |

---

## 7. NGUỒN LỰC VÀ HẠ TẦNG KỸ THUẬT (PROJECT RESOURCES & INFRASTRUCTURE)

### 7.1. Kế hoạch phân bổ nhân lực (Human Resources Effort)
Dự án được thực hiện bởi nhóm gồm 3 thành viên trong thời gian 8 tuần. Khối lượng công việc và thời gian được phân bổ đồng đều giữa các thành viên nhằm đảm bảo tính công bằng và tinh thần trách nhiệm tập thể:
* **Định mức làm việc cá nhân:** Mỗi thành viên cam kết dành trung bình 25 giờ/tuần trong suốt 8 tuần (tương đương 200 giờ công mỗi người).
* **Tổng thời gian nỗ lực toàn dự án:** $3 \text{ người} \times 25 \text{ giờ/tuần} \times 8 \text{ tuần} = \mathbf{600 \text{ giờ công (Man-Hours)}}$.
* **Quy đổi định mức chuẩn PMI (160 giờ/người-tháng):** Tương đương **3.75 người-tháng (Man-Months)**, trung bình mỗi thành viên đóng góp 1.25 người-tháng.
* **Phân bổ công việc đồng đều (mỗi thành viên 200 giờ - đóng góp 33.3%):**
  * **phong phạm (Trưởng nhóm & Full-stack Dev):** 200 giờ – Quản trị tổng thể tiến độ, thiết kế kiến trúc hệ thống, phát triển Backend API cốt lõi, cơ sở dữ liệu và duyệt Pull Request.
  * **Long Phạm (System Analyst & QA Lead):** 200 giờ – Khảo sát nghiệp vụ thực tế, mô hình hóa BPMN, viết đặc tả yêu cầu (SRS, Use Case) và thiết kế kịch bản kiểm thử tích hợp.
  * **Minh Tâm (Technical & Frontend Lead):** 200 giờ – Thiết kế giao diện trên Figma, xây dựng hệ thống Design System, lập trình Frontend SPA và tích hợp API.

### 7.2. Hạ tầng và công cụ phát triển (Tools & Infrastructure)
Là đồ án học phần phi thương mại phục vụ mục đích nghiên cứu và học tập, dự án không sử dụng ngân sách tài chính (chi phí tài chính 0 VNĐ). Toàn bộ hạ tầng kỹ thuật và công cụ quản trị được tối ưu hóa thông qua các nền tảng miễn phí và các gói tài trợ giáo dục dành riêng cho sinh viên:

| Hạng mục hạ tầng / Công cụ | Nền tảng sử dụng | Chi phí tài chính | Cơ chế tài trợ & Phương thức triển khai |
| :--- | :--- | :---: | :--- |
| **Máy chủ Cơ sở dữ liệu (PostgreSQL)** | Supabase Cloud / Docker Local | 0 VNĐ | Hạn mức Free Tier của Supabase & môi trường container cục bộ |
| **Hạ tầng Web Hosting (Backend & Frontend)** | Render Cloud / Vercel Edge Network | 0 VNĐ | Gói sinh viên và Free Tier tối ưu cho Web Application |
| **Quản trị Dự án & Quản lý Mã nguồn** | GitHub Team, Trello Cloud Workspace | 0 VNĐ | Gói tài trợ GitHub Student Developer Pack |
| **Thiết kế Giao diện UI/UX & Prototype** | Figma Desktop & Web Editor | 0 VNĐ | Gói tài khoản Figma Education dành cho sinh viên CNTT |
| **TỔNG KINH PHÍ TÀI CHÍNH DỰ KIẾN** | | **0 VNĐ** | **Tối ưu 100% tài nguyên học thuật sẵn có** |

---

## 8. CÁC GIẢ ĐỊNH VÀ RÀNG BUỘC DỰ ÁN (ASSUMPTIONS & CONSTRAINTS)

### 8.1. Các Giả định Dự án (Project Assumptions)
1. **Năng lực kỹ thuật:** Các thành viên trong nhóm làm chủ vững chắc kiến thức lập trình Web Full-stack, cơ sở dữ liệu quan hệ và nguyên lý quản lý dự án Agile/Scrum.
2. **Sự sẵn sàng của môi trường phát triển:** Mọi thành viên đều được trang bị máy trạm phát triển đáp ứng chuẩn môi trường Node.js v20+, PostgreSQL v16+ và Git CLI.
3. **Tính ổn định của yêu cầu:** Nghiệp vụ cốt lõi đã được khảo sát tại `[BA-01]` và chốt tại `[SRS-01]` sẽ không có thay đổi mang tính đảo lộn vượt quá 15% tổng khối lượng công việc.

### 8.2. Các Ràng buộc Dự án (Project Constraints)
1. **Ràng buộc Thời gian (Time Constraint):** Hạn chót bảo vệ đồ án là mốc cố định do học viện quy định (cuối tuần thứ 8); dự án không có quyền gia hạn thời gian bàn giao.
2. **Ràng buộc Kỹ thuật & Công nghệ:** 
   * Cơ sở dữ liệu bắt buộc sử dụng PostgreSQL nhằm đảm bảo tính toàn vẹn dữ liệu quan hệ (Relational ACID).
   * Giao diện bắt buộc tuân thủ chặt chẽ Design System độc quyền Mantine & Cosmic Sunset đã phê duyệt tại `[DES-01]`.
3. **Ràng buộc Quản trị Cấu hình & Quy chuẩn Kỹ thuật (Engineering Governance):**
   * **Chiến lược phân nhánh Git (Branching Strategy):** Áp dụng mô hình Feature Branching chuẩn mực; mọi thành viên phát triển tính năng và tài liệu trên các nhánh riêng biệt (`feat/*`, `docs/*`, `fix/*`).
   * **Bảo vệ nhánh chính (Protected Branch Policy):** Nhánh `main` đại diện cho sản phẩm ổn định cao nhất; việc tích hợp mã nguồn bắt buộc phải thông qua GitHub Pull Request (PR) và nhận được sự kiểm duyệt (Code Review) cùng phê duyệt chính thức từ Project Leader.
   * **Quy chuẩn thông điệp Commit:** Tuân thủ chuẩn Conventional Commits quốc tế (`feat:`, `docs:`, `fix:`, `refactor:`, `test:`, `chore:`) nhằm đảm bảo tính truy vết minh bạch xuyên suốt vòng đời phần mềm.
   * **Liêm chính Học thuật (Academic Integrity):** Toàn bộ sản phẩm bàn giao, mã nguồn và tài liệu thiết kế thuộc quyền sở hữu trí tuệ của Nhóm 8, bảo đảm tính trung thực tuyệt đối theo quy chế đồ án học viện.

---

## 9. QUẢN TRỊ RỦI RO DỰ ÁN (INITIAL RISK MANAGEMENT LOG)

| Mã Rủi ro | Tên Rủi ro & Mô tả Tiềm ẩn | Xác suất (P) | Mức tác động (I) | Điểm rủi ro (P×I) | Biện pháp Phòng ngừa & Kế hoạch Ứng phó (Mitigation Strategy) | Người phụ trách |
| :---: | :--- | :---: | :---: | :---: | :--- | :---: |
| **RSK-01** | **Xung đột mã nguồn khi ghép các phân hệ Full-stack** | Trung bình | Cao | **Cao** | Phân tách rành mạch tầng Controller/Service; thống nhất trước cấu trúc JSON Payload qua tài liệu đặc tả API; rà soát kỹ lưỡng qua Pull Request độc lập. | Minh Tâm & phong phạm |
| **RSK-02** | **Trễ tiến độ do khối lượng công việc lớn trong 8 tuần** | Trung bình | Cao | **Cao** | Áp dụng triệt để nguyên lý phân loại MoSCoW: Ưu tiên tuyệt đối 100% nguồn lực cho nhóm Must-have (3 Use Case cốt lõi); cắt giảm các tính năng thứ yếu sang giai đoạn mở rộng. | phong phạm (PM) |
| **RSK-03** | **Lỗi logic xung đột lịch phòng thi & vượt sĩ số lớp** | Cao | Cao | **Nghiêm trọng** | Thiết lập các ràng buộc toàn vẹn cứng ở tầng CSDL (Unique Constraint, Check Constraint) kết hợp khóa giao dịch (Transaction Locking) trước khi lưu dữ liệu. | phong phạm & Long Phạm |
| **RSK-04** | **Phình to phạm vi yêu cầu (Scope Creep)** | Thấp | Trung bình | **Trung bình** | Bám sát ranh giới Out-of-Scope đã quy định tại Mục 3.2; mọi đề xuất tính năng mới đều phải được đánh giá tác động và có sự phê duyệt bằng văn bản của PM. | phong phạm (PM) |
| **RSK-05** | **Sự cố thất lạc dữ liệu mã nguồn hoặc hỏng môi trường local** | Thấp | Rất Cao | **Trung bình** | Thực hiện backup định kỳ cơ sở dữ liệu qua file script SQL; đồng bộ cấu hình môi trường bằng file `.env.example` và quy trình setup chuẩn mực. | Long Phạm |

---

## 10. TIÊU CHUẨN NGHIỆM THU TỔNG THỂ & PHÊ DUYỆT BAN HÀNH (PROJECT ACCEPTANCE & SIGN-OFF)

### 10.1. Tiêu chuẩn Nghiệm thu Toàn diện (Project Acceptance Criteria)
Dự án được đánh giá hoàn thành xuất sắc và đủ điều kiện bảo vệ khi thỏa mãn đồng thời 4 điều kiện:
* [x] **Hồ sơ thiết kế hoàn chỉnh:** Hoàn tất 100% các tài liệu nghiệp vụ, kiến trúc, CSDL và UI/UX theo đúng định dạng học thuật.
* [ ] **Phần mềm vận hành thực tế:** Vượt qua toàn bộ các bài kiểm thử tích hợp cho 3 luồng nghiệp vụ: Lead Kanban (UC-01), Placement Test (UC-02), Quản lý Lớp & Xếp lớp (UC-03).
* [ ] **Chất lượng mã nguồn:** Không còn lỗi nghiêm trọng (Critical Bugs); giao diện mượt mà, đồng nhất theo Design System Cosmic Sunset.
* [ ] **Báo cáo & Phương tiện bảo vệ:** Bộ slide báo cáo chuyên nghiệp, video demo kịch bản nghiệp vụ sống động và cuốn báo cáo đồ án được đóng quyển hoàn chỉnh.

---

### 10.2. BẢNG PHÊ DUYỆT BAN HÀNH CHÍNH THỨC HIẾN CHƯƠNG DỰ ÁN

Bản Hiến chương này có hiệu lực chính thức kể từ ngày ký. Mọi thành viên trong dự án có trách nhiệm tuân thủ tuyệt đối các mục tiêu, phạm vi, kế hoạch và quy tắc kỷ luật đã được xác lập.

| ĐẠI DIỆN HỘI ĐỒNG / GIẢNG VIÊN HƯỚNG DẪN<br>*(Project Sponsor)* | TRƯỞNG NHÓM PHÂN TÍCH & QA<br>*(System Analyst & QA Lead)* | TRƯỞNG NHÓM KỸ THUẬT & FRONTEND<br>*(Technical & Frontend Lead)* | CHỦ NHIỆM DỰ ÁN / PROJECT LEADER<br>*(Project Manager & Full-stack Dev)* |
| :---: | :---: | :---: | :---: |
| *(Đã xem xét & Định hướng)* | *(Đã thống nhất & Cam kết)* | *(Đã thống nhất & Cam kết)* | *(Đã ký duyệt & Ban hành)* |
| <br><br>_______________________<br>**Bộ môn QLDA Phần mềm** | <br><br>_______________________<br>**Long Phạm** (`@longphm11`) | <br><br>_______________________<br>**Minh Tâm** (`@tamminh6`) | <br><br>_______________________<br>**phong phạm** (`@phongphm2`) |
| Ngày: 30/09/2026 | Ngày: 30/09/2026 | Ngày: 30/09/2026 | Ngày: 30/09/2026 |
