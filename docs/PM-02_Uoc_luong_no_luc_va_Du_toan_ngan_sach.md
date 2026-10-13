# KẾ HOẠCH ƯỚC LƯỢNG NỖ LỰC (FPA, PERT) & DỰ TOÁN NGÂN SÁCH DỰ ÁN (COST BASELINE)
## HỆ THỐNG CRM QUẢN LÝ TUYỂN SINH VÀ ĐÀO TẠO TRUNG TÂM ANH NGỮ (EDUFLOW CRM)

---

### THÔNG TIN TỔNG QUAN TÀI LIỆU (DOCUMENT METADATA)

| Thuộc tính | Chi tiết định danh |
| :--- | :--- |
| **Mã tài liệu** | **PM-02** |
| **Tên tài liệu** | Kế hoạch Ước lượng Nỗ lực (FPA, PERT), Ma trận Story Points & Dự toán Ngân sách (Cost Baseline) |
| **Tên dự án** | Hệ thống CRM Quản lý Tuyển sinh và Đào tạo Trung tâm Anh ngữ (EduFlow CRM) |
| **Học phần** | Quản lý Dự án Phần mềm (Software Project Management) |
| **Đơn vị đào tạo** | Học viện Công nghệ Bưu chính Viễn thông (PTIT) - Khoa Công nghệ Thông tin |
| **Nhóm thực hiện** | Nhóm 8 |
| **Project Sponsor** | Giảng viên hướng dẫn học phần & Ban đánh giá chuyên môn |
| **Người thực hiện chính** | **Long Phạm** (`@longphm11`) - System Analyst (SA) & QA Lead |
| **Phối hợp & Phê duyệt** | **phong phạm** (`@phongphm2` / `phongg2905`) - Project Manager (Leader) |
| **Đồng kiểm thử** | **Minh Tâm** (`@tamminh6`) - Technical Architect & Frontend Lead |
| **Tiêu chuẩn đối sánh** | **PMBOK® Guide – 7th Edition (Planning & Measurement Domains)**, IFPUG CPM 4.3.1, Scrum Guide 2020, COCOMO II |
| **Phiên bản tài liệu** | **v1.0 (Ban hành chính thức)** |
| **Chu kỳ dự án** | 8 tuần (40 ngày làm việc: 28/09/2026 - 20/11/2026) |

---

## 1. MỤC ĐÍCH & PHƯƠNG PHÁP LUẬN ƯỚC LƯỢNG (PURPOSE & METHODOLOGY)

### 1.1. Bối cảnh và Mục tiêu Định lượng
Trong quản trị dự án phần mềm theo tiêu chuẩn quốc tế **PMBOK 7th Edition**, việc ước lượng nỗ lực và dự toán ngân sách là tiền đề sống còn nhằm thiết lập **Đường cơ sở Chi phí (Cost Baseline)** và **Đường cơ sở Tiến độ (Schedule Baseline)**. Đối với dự án EduFlow CRM, việc định lượng nhằm giải quyết 3 mục tiêu cốt lõi:
1. **Khách quan hóa quy mô phần mềm (Software Sizing):** Không dựa trên cảm tính chủ quan mà sử dụng phương pháp chuẩn hóa quốc tế Function Point Analysis (FPA - IFPUG standard) để đo lường độ lớn nghiệp vụ từ góc nhìn người dùng cuối.
2. **Kiểm soát rủi ro các thuật toán phức tạp:** Áp dụng phương pháp ước lượng xác suất 3 điểm PERT (Program Evaluation and Review Technique) cho các tác vụ tiềm ẩn bẫy kỹ thuật (xung đột dữ liệu đa luồng, khóa chống trùng ca thi, thuật toán phân bổ sĩ số theo thời gian thực).
3. **Quy đổi nhịp nhàng giữa Quản trị Dự đoán và Thực thi Linh hoạt (Hybrid Mapping):** Ánh xạ điểm chức năng FPA sang Agile Story Points, tính toán vận tốc nhóm (Team Velocity) và phân bổ ngân sách theo từng Sprint 2 tuần.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
   MÔ HÌNH ƯỚC LƯỢNG ĐA TẦNG DỰ ÁN EDUFLOW CRM (MULTI-TIER ESTIMATION MODEL)
├───────────────────────┬────────────────────────┬───────────────────────────────────────┤
│ PHƯƠNG PHÁP FPA IFPUG │ THỐNG KÊ 3 ĐIỂM PERT   │ AGILE PLANNING POKER                  │
│ (Top-Down Functional) │ (Statistical Risky)    │ (Bottom-Up Sprint Execution)          │
├───────────────────────┼────────────────────────┼───────────────────────────────────────┤
│ Đo lường 5 thành phần:│ Ước lượng 4 thuật toán:│ Đánh giá 25 User Stories Backlog:     │
│ ILF, EIF, EI, EO, EQ  │ Optimistic (O)         │ Fibonacci Scale (1, 2, 3, 5, 8, 13)   │
│ Hệ số phức tạp VAF    │ Most Likely (M)        │ Quy đổi Story Point ➔ Giờ công        │
│ Quy đổi SLOC & MM     │ Pessimistic (P)        │ Đo lường Sprint Velocity              │
└───────────────────────┴────────────────────────┴───────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   DỰ TOÁN NGÂN SÁCH CƠ SỞ (COST BASELINE & S-CURVE)                    │
│   Direct Labor Cost + Infrastructure & Tools + Contingency Reserve + Management Reserve│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. PHÂN TÍCH ĐIỂM CHỨC NĂNG (FUNCTION POINT ANALYSIS - FPA IFPUG)

Phương pháp FPA đo lường kích thước phần mềm bằng cách định lượng các chức năng mà hệ thống cung cấp cho người dùng, độc lập hoàn toàn với công nghệ lập trình. Quy chuẩn tính toán tuân thủ hướng dẫn thực hành **IFPUG Counting Practices Manual 4.3.1**.

### 2.1. Nhận diện và Phân loại 5 Thành phần Chức năng (5 Function Types)

#### A. Nhóm Tệp Dữ liệu Nội bộ (Internal Logical Files - ILF)
ILF là các nhóm dữ liệu logic được duy trì và lưu trữ trực tiếp bên trong ranh giới ứng dụng EduFlow CRM:

| Mã ILF | Tên Tệp Logic Nội bộ | Bảng CSDL Tương ứng | Số loại phần tử dữ liệu (DET) | Số loại phần tử bản ghi (RET) | Mức độ phức tạp | Trọng số FP (IFPUG) |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| **ILF-01** | Quản lý Tài khoản & Phân quyền | `users`, `roles` | 12 | 2 | **Thấp (Low)** | 7 |
| **ILF-02** | Khách hàng Tiềm năng & Phễu Lead | `leads`, `lead_sources` | 18 | 2 | **Trung bình (Avg)** | 10 |
| **ILF-03** | Nhật ký Tương tác Chăm sóc Lead | `consultation_logs` | 9 | 1 | **Thấp (Low)** | 7 |
| **ILF-04** | Đợt thi & Ca thi Kiểm tra Đầu vào | `placement_tests` | 14 | 2 | **Trung bình (Avg)** | 10 |
| **ILF-05** | Kết quả Điểm thi 4 Kỹ năng & Nhận xét | `test_scores` | 22 | 3 | **Cao (High)** | 15 |
| **ILF-06** | Danh mục Khóa học & Lộ trình Đầu ra | `courses`, `target_bands` | 11 | 2 | **Thấp (Low)** | 7 |
| **ILF-07** | Lớp học, Thời khóa biểu & Giáo viên | `classes`, `rooms`, `schedules` | 24 | 3 | **Cao (High)** | 15 |
| **ILF-08** | Hồ sơ Ghi danh Học viên & Biên lai Học phí | `enrollments`, `tuition_receipts` | 26 | 3 | **Cao (High)** | 15 |
| **ILF-09** | Bảng Dữ liệu Tổng hợp Báo cáo & Thống kê | `analytics_aggregates`, `kpi_cache` | 16 | 2 | **Trung bình (Avg)** | 10 |
| **TỔNG** | **9 Nhóm Tệp Dữ liệu Logic Nội bộ** | | | | | **96 FP** |

#### B. Nhóm Tệp Giao diện Ngoài (External Interface Files - EIF)
EIF là các nhóm dữ liệu logic được tham chiếu hoặc tích hợp từ hệ thống bên ngoài ranh giới ứng dụng:

| Mã EIF | Tên Tệp Giao diện Ngoài | Nguồn Gốc Dữ liệu | DET | RET | Mức độ phức tạp | Trọng số FP |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| **EIF-01** | Supabase Cloud Database & Auth Metadata | Dịch vụ Supabase Cloud Platform | 8 | 1 | **Thấp (Low)** | 5 |
| **EIF-02** | Dịch vụ Cổng Mail Gateway (SMTP OTP) | Máy chủ Mail SendGrid / Google SMTP | 6 | 1 | **Thấp (Low)** | 5 |
| **EIF-03** | Lưu trữ Tệp Trực tuyến (Cloud File Store) | Supabase Storage Bucket | 7 | 1 | **Thấp (Low)** | 5 |
| **TỔNG** | **3 Tệp Giao diện Ngoài** | | | | | **15 FP** |

#### C. Nhóm Giao dịch Nhập Dữ liệu Ngoài (External Inputs - EI)
EI là quá trình xử lý tiếp nhận dữ liệu từ bên ngoài ranh giới hệ thống để cập nhật vào các tệp ILF:

| Mã EI | Tên Luồng Giao dịch Nhập | Thuộc Use Case | FTR | DET | Độ phức tạp | Trọng số FP |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **EI-01** | Đăng ký & Tạo mới tài khoản nhân sự (RBAC) | UC-05 | 2 | 8 | **Trung bình (Avg)** | 4 |
| **EI-02** | Đổi mật khẩu cá nhân & Xác thực mã OTP | UC-05 | 1 | 5 | **Thấp (Low)** | 3 |
| **EI-03** | Tiếp nhận Lead mới & Kích hoạt quét trùng SĐT | UC-01 | 3 | 12 | **Cao (High)** | 6 |
| **EI-04** | Kéo thả đổi chặng phễu Pipeline Kanban | UC-01 | 2 | 7 | **Trung bình (Avg)** | 4 |
| **EI-05** | Ghi nhật ký tư vấn cuộc gọi & popup lý do trượt | UC-01 | 2 | 6 | **Thấp (Low)** | 3 |
| **EI-06** | Đặt lịch hẹn ca thi Placement Test | UC-02 | 3 | 11 | **Cao (High)** | 6 |
| **EI-07** | Điểm danh trạng thái thí sinh có mặt ca thi | UC-02 | 2 | 4 | **Thấp (Low)** | 3 |
| **EI-08** | Nhập bảng điểm 4 kỹ năng & Nhận xét năng lực | UC-02 | 3 | 16 | **Cao (High)** | 6 |
| **EI-09** | Tạo mới khóa học & Cấu hình dải điểm đầu vào | UC-03 | 2 | 9 | **Thấp (Low)** | 3 |
| **EI-10** | Mở lớp học mới, gán giáo viên & phân phòng | UC-03 | 3 | 14 | **Cao (High)** | 6 |
| **EI-11** | Wizard ghi danh học viên & xác nhận thu học phí | UC-03 | 3 | 15 | **Cao (High)** | 6 |
| **EI-12** | Chuyển đổi lớp học & xử lý bảo lưu/hoàn phí | UC-03 | 3 | 13 | **Cao (High)** | 6 |
| **TỔNG** | **12 Giao dịch Nhập Ngoài (EI)** | | | | | **56 FP** |

#### D. Nhóm Giao dịch Xuất Dữ liệu Ngoài (External Outputs - EO)
EO là quá trình gửi dữ liệu ra bên ngoài hệ thống với các bước xử lý logic toán học hoặc thuật toán dẫn xuất:

| Mã EO | Tên Luồng Giao dịch Xuất | Thuộc Use Case | FTR | DET | Độ phức tạp | Trọng số FP |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **EO-01** | Xuất Phiếu điểm Đánh giá Năng lực PDF Cambridge | UC-02 | 3 | 18 | **Cao (High)** | 7 |
| **EO-02** | Xuất Biên lai Thu tiền Học phí Điện tử | UC-03 | 2 | 12 | **Trung bình (Avg)** | 5 |
| **EO-03** | Xuất Báo cáo Doanh thu & Tuyển sinh Excel UTF-8 BOM | UC-04 | 3 | 22 | **Cao (High)** | 7 |
| **EO-04** | Bảng xếp hạng Thi đua Tư vấn viên (Sales Leaderboard)| UC-04 | 2 | 10 | **Trung bình (Avg)** | 5 |
| **EO-05** | Biểu đồ Phễu Chuyển đổi Tuyển sinh & Tỷ lệ Rơi rụng | UC-04 | 3 | 14 | **Cao (High)** | 7 |
| **EO-06** | Cảnh báo Quá tải Sức chứa Phòng học & Phòng thi | UC-02/03 | 2 | 8 | **Trung bình (Avg)** | 5 |
| **TỔNG** | **6 Giao dịch Xuất Ngoài (EO)** | | | | | **36 FP** |

#### E. Nhóm Giao dịch Truy vấn Dữ liệu Ngoài (External Inquiries - EQ)
EQ là quá trình người dùng gửi yêu cầu truy xuất dữ liệu trực tiếp tức thời không qua bước tính toán dẫn xuất:

| Mã EQ | Tên Giao dịch Truy vấn | Thuộc Use Case | FTR | DET | Độ phức tạp | Trọng số FP |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **EQ-01** | Xem bảng điều hướng Kanban Pipeline trực quan | UC-01 | 2 | 11 | **Trung bình (Avg)** | 4 |
| **EQ-02** | Quét kiểm tra trùng số điện thoại & email Lead tức thì | UC-01 | 3 | 6 | **Cao (High)** | 6 |
| **EQ-03** | Kiểm tra lịch trống giáo viên & phòng thi trực tuyến | UC-02 | 3 | 8 | **Cao (High)** | 6 |
| **EQ-04** | Xem chi tiết hồ sơ Lead & Dòng thời gian tương tác | UC-01 | 2 | 14 | **Thấp (Low)** | 3 |
| **EQ-05** | Tra cứu danh mục khóa học & lớp sắp mở | UC-03 | 2 | 10 | **Thấp (Low)** | 3 |
| **EQ-06** | Giám sát sĩ số thực tế & chỗ trống lớp học thời gian thực | UC-03 | 2 | 9 | **Trung bình (Avg)** | 4 |
| **EQ-07** | Tra cứu danh sách nhân sự, phân quyền vai trò RBAC | UC-05 | 2 | 8 | **Thấp (Low)** | 3 |
| **TỔNG** | **7 Giao dịch Truy vấn Ngoài (EQ)** | | | | | **29 FP** |

---

### 2.2. Tính Điểm Chức năng Chưa Hiệu chỉnh (Unadjusted Function Points - UFP)

Tổng điểm chức năng chưa hiệu chỉnh được tính bằng tổng số điểm của 5 thành phần:

$$UFP = \sum \text{ILF} + \sum \text{EIF} + \sum \text{EI} + \sum \text{EO} + \sum \text{EQ}$$

$$UFP = 96 + 15 + 56 + 36 + 29 = \mathbf{232 \text{ FP}}$$

---

### 2.3. Đánh giá 14 Đặc trưng Kỹ thuật Tổng quát (GSC) & Hệ số Phức tạp (VAF)

Mỗi đặc trưng kỹ thuật tổng quát GSC (General System Characteristics) được chấm điểm từ 0 (Không áp dụng) đến 5 (Ảnh hưởng tối đa):

| STT | Đặc trưng Kỹ thuật Tổng quát (GSC) | Mức độ ảnh hưởng ($DI_i$) | Cơ sở đánh giá chi tiết trong EduFlow CRM |
| :---: | :--- | :---: | :--- |
| **1** | Truyền thông Dữ liệu (Data Communications) | **4** | Tương tác RESTful API JSON qua mạng WAN/Internet bảo mật SSL/TLS. |
| **2** | Xử lý Phân tán (Distributed Data Processing) | **3** | Phân tầng Client-Server độc lập: SPA Frontend trên Vite, API Node.js, DB Cloud Supabase. |
| **3** | Yêu cầu Hiệu năng (Performance Objectives) | **5** | Tiêu chuẩn NFR nghiêm ngặt: Tải trang $\le 1.5$s, độ trễ API $\le 200$ms, phản hồi tức thời. |
| **4** | Cấu hình Máy chủ Tải cao (Heavily Used Config) | **3** | Môi trường Cloud tài nguyên tối ưu, kiểm soát kết nối DB Connection Pool tối đa 20 clients. |
| **5** | Khối lượng Giao dịch (Transaction Rate) | **4** | Đội ngũ Sales kéo thả Kanban liên tục, cập nhật lead và nhật ký tư vấn cường độ cao. |
| **6** | Nhập liệu Trực tuyến (Online Data Entry) | **5** | 100% dữ liệu Lead, Điểm thi, Lớp học, Thu tiền đều nhập trực tiếp trên trình duyệt Web. |
| **7** | Hiệu quả Người dùng Cuối (End-User Efficiency)| **5** | Giao diện Vision Liquid Glass / Cosmic Sunset, hỗ trợ kéo thả Kanban, phím tắt và modal popup. |
| **8** | Cập nhật Trực tuyến (Online Update) | **4** | Cập nhật CSDL PostgreSQL ngay tức thời, khóa ràng buộc toàn vẹn ACID. |
| **9** | Xử lý Nghiệp vụ Phức tạp (Complex Processing) | **4** | Thuật toán quét trùng Lead, thuật toán phân lịch chống trùng 3 chiều, đối chiếu điểm thi gợi ý lớp. |
| **10**| Khả năng Tái sử dụng Mã nguồn (Reusability) | **4** | Hệ thống UI Component tái sử dụng (Design System), Repository Pattern và Auth Middleware RBAC. |
| **11**| Độ Thuận tiện Cài đặt (Installation Ease) | **2** | Ứng dụng Web chạy trên nền tảng Cloud, người dùng chỉ cần trình duyệt, không cần cài đặt client. |
| **12**| Độ Thuận tiện Vận hành (Operational Ease) | **3** | Hỗ trợ sao lưu tự động trên Cloud Supabase, health-check endpoint `/api/health`, log lỗi tập trung. |
| **13**| Hỗ trợ Đa Địa điểm (Multiple Sites) | **3** | Hệ thống sẵn sàng cho mô hình trung tâm Anh ngữ có từ 1 đến 3 chi nhánh cơ sở. |
| **14**| Tạo điều kiện Thay đổi (Facilitate Change) | **4** | Cấu trúc phân tầng linh hoạt, tài liệu API Swagger đầy đủ, dễ dàng mở rộng tính năng mới. |
| | **TỔNG MỨC ĐỘ ẢNH HƯỞNG (TDI = $\sum DI_i$)** | **48** | **TDI = 48 / 70 điểm tối đa** |

Hệ số điều chỉnh giá trị VAF (Value Adjustment Factor) được tính theo công thức IFPUG chuẩn:

$$VAF = 0.65 + (0.01 \times TDI) = 0.65 + (0.01 \times 48) = \mathbf{1.13}$$

---

### 2.4. Điểm Chức năng Hiệu chỉnh (Adjusted Function Points - AFP)

$$AFP = UFP \times VAF = 232 \times 1.13 = 262.16 \approx \mathbf{262 \text{ FP}}$$

---

### 2.5. Quy đổi sang Dòng lệnh (SLOC) & Nỗ lực Man-Months

#### A. Quy đổi Kích thước Mã nguồn (Source Lines of Code - SLOC)
Theo cơ sở dữ liệu đối sánh quốc tế **QSM (Quantitative Software Management)** và nghiên cứu của **Capers Jones** về năng suất ngôn ngữ lập trình thế hệ mới (Modern TypeScript, React SPA, Express.js, PostgreSQL):
* Hệ số trung bình của ngôn ngữ **TypeScript / Modern Full-stack Frameworks:** **$48 \text{ SLOC / FP}$**.

$$\text{Tổng SLOC Dự kiến} = AFP \times 48 = 262 \times 48 = \mathbf{12,576 \text{ Dòng lệnh (SLOC)}}$$

> **Đối chiếu thực tế dự án:** Tính đến thời điểm hiện tại, toàn bộ mã nguồn Backend TypeScript + Frontend React components của dự án EduFlow CRM đạt xấp xỉ **13,200 dòng lệnh** (độ sai lệch so với ước lượng FPA chỉ **$< 5\%$**, khẳng định tính chính xác cao của mô hình định lượng).

#### B. Quy đổi Nỗ lực Phát triển theo Mô hình COCOMO II
Theo mô hình COCOMO II (Constructive Cost Model - Early Design Model) đối với dự án phần mềm dạng **Organic / Small-team Agile:**
* Năng suất trung bình của lập trình viên Full-stack: **$14 \text{ FP / Man-Month}$**.

$$\text{Nỗ lực Lý thuyết} = \frac{AFP}{\text{Productivity}} = \frac{262 \text{ FP}}{14 \text{ FP/MM}} = \mathbf{18.71 \text{ Man-Months}}$$

* Với dự án đồ án học thuật tập trung (thành viên làm việc Part-time 25 giờ/tuần $\times$ 8 tuần = 200 giờ/người $\times$ 3 người = **600 giờ công**):
  - Quy chuẩn 1 Man-Month công nghiệp = 160 giờ làm việc.
  - Tổng số Man-Months quy đổi thực tế của nhóm: $\frac{600 \text{ giờ}}{160 \text{ giờ/MM}} = \mathbf{3.75 \text{ Man-Months}}$.
  - Năng suất tăng cường nhờ áp dụng thư viện UI hiện đại (Mantine/Lucide) và AI-assisted coding: $262 \text{ FP} / 3.75 \text{ MM} \approx 69.8 \text{ FP/MM}$, hoàn toàn khả thi và bảo đảm tiến độ bàn giao trong 8 tuần.

---

## 3. ƯỚC LƯỢNG 3 ĐIỂM PERT CHO 4 THUẬT TOÁN THEN CHỐT (PERT 3-POINT ESTIMATION)

Trong phân tích kỹ thuật, 4 thuật toán sau đây tiềm ẩn nguy cơ sai lệch tiến độ lớn nhất do liên quan trực tiếp đến tính toàn vẹn dữ liệu và kiểm soát tương tranh (Concurrency Control). Đội ngũ áp dụng phân phối xác suất Beta trong kỹ thuật **PERT (Program Evaluation and Review Technique)**.

### 3.1. Công thức Toán học PERT
* **Thời gian kỳ vọng (Expected Time - $T_e$):**
  $$T_e = \frac{O + 4M + P}{6}$$
* **Độ lệch chuẩn (Standard Deviation - $\sigma$):**
  $$\sigma = \frac{P - O}{6}$$
* **Phương sai (Variance - $V$):**
  $$V = \sigma^2 = \left(\frac{P - O}{6}\right)^2$$
* Trong đó:
  - $O$ (Optimistic): Thời gian ước tính lạc quan nhất (mọi việc diễn ra suôn sẻ, không phát sinh lỗi).
  - $M$ (Most Likely): Thời gian ước tính khả dĩ nhất (xảy ra trong điều kiện làm việc bình thường).
  - $P$ (Pessimistic): Thời gian ước tính bi quan nhất (gặp sự cố kỹ thuật phức tạp, deadlock, race condition).

---

### 3.2. Bảng Ước lượng Chi tiết 4 Thuật toán Then chốt

| Mã thuật toán | Tên Thuật toán & Bản chất Kỹ thuật | $O$ (giờ) | $M$ (giờ) | $P$ (giờ) | Thời gian Kỳ vọng $T_e$ (giờ) | Độ lệch chuẩn $\sigma$ (giờ) | Phương sai $V$ |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **ALG-01** | **Thuật toán Quét trùng & Phân giải Xung đột Lead Đa kênh (`BR-01`)**<br>*Chuẩn hóa Regex số điện thoại Việt Nam, truy vấn song song Index B-Tree, cảnh báo thời gian thực khi tạo Lead.* | 8.0 | 14.0 | 26.0 | **15.0** | **3.00** | 9.00 |
| **ALG-02** | **Thuật toán Khóa Phân bổ Ca thi, Chống trùng 3 Chiều (`BR-02`)**<br>*Ràng buộc kiểm tra giao nhau khoảng thời gian (Interval Overlap), khóa dòng PostgreSQL `FOR UPDATE` chống race condition giữa Phòng thi và Giảng viên chấm.* | 12.0 | 22.0 | 38.0 | **23.0** | **4.33** | 18.78 |
| **ALG-03** | **Thuật toán Phân tích Điểm thi 4 Kỹ năng & Gợi ý Khóa học (`BR-03`)**<br>*Tính Overall Band Score theo quy tắc làm tròn Cambridge IELTS (.25, .75), đối chiếu ma trận chuẩn đầu ra khóa học để đề xuất lộ trình tối ưu.* | 10.0 | 18.0 | 32.0 | **19.0** | **3.67** | 13.44 |
| **ALG-04** | **Thuật toán Kiểm soát Sĩ số Trần, Khóa Ghi danh & Chuyển lớp (`BR-04`)**<br>*Giao dịch ACID kiểm tra `current_enrolled < max_capacity`, tự động đổi trạng thái lớp `FULL`, hoàn công nợ và chuyển dời hồ sơ an toàn.* | 14.0 | 24.0 | 40.0 | **25.0** | **4.33** | 18.78 |
| **TỔNG** | **Tổng chuỗi thuật toán cốt lõi trên đường găng kỹ thuật** | **44.0** | **78.0** | **136.0** | **82.0** | **7.75** | **60.00** |

---

### 3.3. Phân tích Thống kê Xác suất Hoàn thành Chuỗi Thuật toán
* **Tổng thời gian kỳ vọng:**
  $$T_E = \sum T_e = 15.0 + 23.0 + 19.0 + 25.0 = \mathbf{82.0 \text{ giờ công}}$$
* **Phương sai tích lũy:**
  $$V_{\text{total}} = \sum V = 9.00 + 18.78 + 13.44 + 18.78 = \mathbf{60.00}$$
* **Độ lệch chuẩn tổng thể:**
  $$\sigma_{\text{total}} = \sqrt{V_{\text{total}}} = \sqrt{60.00} \approx \mathbf{7.75 \text{ giờ}}$$

#### Xác định Khoảng tin cậy theo Định luật Phân phối Chuẩn:
* **Khoảng tin cậy 68.27% ($T_E \pm 1\sigma$):**
  $$82.0 - 7.75 \le T \le 82.0 + 7.75 \iff [74.25 \text{ giờ} \div 89.75 \text{ giờ}]$$
* **Khoảng tin cậy 95.45% ($T_E \pm 2\sigma$):**
  $$82.0 - 2(7.75) \le T \le 82.0 + 2(7.75) \iff \mathbf{[66.50 \text{ giờ} \div 97.50 \text{ giờ}]}$$
* **Khoảng tin cậy 99.73% ($T_E \pm 3\sigma$):**
  $$82.0 - 3(7.75) \le T \le 82.0 + 3(7.75) \iff [58.75 \text{ giờ} \div 105.25 \text{ giờ}]$$

> **Ý nghĩa Quản trị Dự án:** Đội ngũ có thể cam kết với **độ tin cậy 95.45%** rằng cụm 4 thuật toán then chốt sẽ hoàn thành trong khoảng tối đa **97.5 giờ công** (tương đương xấp xỉ 12 ngày làm việc của 1 kỹ sư chuyên trách), hoàn toàn nằm trọn trong ngân sách thời gian 2 tuần của Sprint 3.

---

## 4. MA TRẬN PLANNING POKER STORY POINTS CHO TOÀN BỘ PRODUCT BACKLOG

### 4.1. Quy chuẩn Thang đo Fibonacci & Định nghĩa Điểm Cơ sở (Baseline Point)
* Nhóm áp dụng dãy số Fibonacci tiêu chuẩn trong Scrum: **$1, 2, 3, 5, 8, 13, 21$**.
* **Tiêu chí định giá Story Point:** Đánh giá đồng thời 3 tham số:
  1. **Khối lượng công việc (Work Effort):** Khối lượng mã nguồn cần viết.
  2. **Độ phức tạp kỹ thuật (Technical Complexity):** Độ phức tạp giải thuật và kiến trúc CSDL.
  3. **Mức độ bất định (Risk & Uncertainty):** Mức độ rõ ràng của yêu cầu và rủi ro phát sinh bug.
* **Điểm Cơ sở chuẩn (1 Story Point Baseline):** Tác vụ đổi mật khẩu người dùng (`FR-AUTH-04`) hoặc tạo khung giao diện tĩnh một Card hiển thị đơn giản.

---

### 4.2. Bảng Phân rã Story Points Chi tiết theo 4 Sprint

#### SPRINT 1: Khởi tạo Dự án, Đặc tả Yêu cầu & Cấu trúc Dữ liệu Nền tảng (55 Story Points)
| Mã Tác vụ | Tên User Story / Công việc | Thành phần Phụ trách | Complexity | Effort | Risk | Story Points |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| `SP1-01` | Lập Bản Hiến chương Dự án `[CHARTER-01]` | Long / phong | Medium | Medium | Low | **5** |
| `SP1-02` | Kế hoạch Quản lý Tiến độ WBS & CPM `[PM-01]` | phong | High | High | Low | **8** |
| `SP1-03` | Kế hoạch Ước lượng Nỗ lực & Ngân sách `[PM-02]` | Long / phong | High | High | Medium | **8** |
| `SP1-04` | Khảo sát nghiệp vụ & Sơ đồ BPMN `[BA-01/02]` | Long | Medium | High | Low | **8** |
| `SP1-05` | Đặc tả yêu cầu phần mềm SRS chi tiết `[SRS-01]` | Long | High | High | Low | **8** |
| `SP1-06` | Mô hình hóa Actors & Kịch bản Use Case `[UML-01/02]` | Long | High | High | Low | **8** |
| `SP1-07` | Thiết kế Kiến trúc CSDL Conceptual & Physical `[DB-01/02]`| Minh Tâm / phong | High | High | Medium | **10** |
| **TỔNG** | **Sprint 1 Backlog Total** | | | | | **55 SP** |

#### SPRINT 2: Khung Kỹ thuật Nền tảng, UI/UX Design System & Auth RBAC (62 Story Points)
| Mã Tác vụ | Tên User Story / Công việc | Thành phần Phụ trách | Complexity | Effort | Risk | Story Points |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| `SP2-01` | UI/UX Design System Mantine & Prototype `[DES-01]` | Minh Tâm | High | High | Low | **8** |
| `SP2-02` | Khởi tạo Base Server Node/Express & PostgreSQL Pool `[BE-01]`| phong | Medium | High | Low | **8** |
| `SP2-03` | Khung Frontend AppShell, Navigation & Routing `[FE-01]` | Minh Tâm | Medium | High | Low | **8** |
| `SP2-04` | Module Xác thực JWT & Phân quyền RBAC Middleware `[BE-02]`| phong | High | High | Medium | **8** |
| `SP2-05` | Giao diện Đăng nhập, Đăng ký & Quên mật khẩu `[FE-02]` | Minh Tâm | Medium | Medium | Low | **5** |
| `SP2-06` | RESTful API Phân hệ Placement Test Cơ bản `[BE-04]` | phong / Long | High | High | Medium | **13** |
| `SP2-07` | Giao diện Lịch thi (Calendar View) & Điểm danh `[FE-04A]` | Long / phong | High | High | Medium | **12** |
| **TỔNG** | **Sprint 2 Backlog Total** | | | | | **62 SP** |

#### SPRINT 3: Phát triển 3 Luồng Nghiệp vụ Cốt lõi & Báo cáo Quản trị (68 Story Points)
| Mã Tác vụ | Tên User Story / Công việc | Thành phần Phụ trách | Complexity | Effort | Risk | Story Points |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| `SP3-01` | RESTful API Tuyển sinh & Kanban Lead Pipeline `[BE-03]` | phong | High | High | Medium | **10** |
| `SP3-02` | Bảng Kanban Kéo thả Chống rung giật & Drawer Lead `[FE-03]`| Minh Tâm | High | High | Medium | **13** |
| `SP3-03` | Form Chấm điểm 4 Kỹ năng & Xuất Phiếu điểm PDF `[FE-04B]`| phong | High | High | Low | **8** |
| `SP3-04` | RESTful API Khóa học, Lớp học & Xếp lớp tự động `[BE-05]` | phong | High | High | High | **13** |
| `SP3-05` | Giao diện Quản lý Khóa học & Giám sát Sĩ số `[FE-05A]` | Minh Tâm | Medium | High | Low | **8** |
| `SP3-06` | RESTful API Báo cáo Doanh thu & Phễu Tuyển sinh `[BE-06]` | Long / phong | High | High | Low | **8** |
| `SP3-07` | Dashboard Báo cáo Doanh thu & Xuất Excel CSV `[FE-06]` | Long / phong | Medium | High | Low | **8** |
| **TỔNG** | **Sprint 3 Backlog Total** | | | | | **68 SP** |

#### SPRINT 4: Quản trị Nhân sự, Kiểm thử Tích hợp & Đóng gói Bàn giao (45 Story Points)
| Mã Tác vụ | Tên User Story / Công việc | Thành phần Phụ trách | Complexity | Effort | Risk | Story Points |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| `SP4-01` | RESTful API Quản trị Tài khoản Nhân sự & RBAC `[BE-07]` | phong | Medium | Medium | Low | **5** |
| `SP4-02` | Giao diện Quản lý Đội ngũ Giảng viên & Phân quyền `[FE-07]`| Minh Tâm | Medium | High | Low | **8** |
| `SP4-03` | Xây dựng Bộ kịch bản Kiểm thử Tích hợp End-to-End `[TEST-01]`| Long | High | High | Medium | **13** |
| `SP4-04` | Soạn thảo Báo cáo Tổng kết Đồ án 80 trang `[DOC-FINAL]` | Cả nhóm | High | High | Low | **11** |
| `SP4-05` | Slide Thuyết trình Chuyên nghiệp & Quay Video Demo `[DEMO-01]`| Cả nhóm | Medium | Medium | Low | **8** |
| **TỔNG** | **Sprint 4 Backlog Total** | | | | | **45 SP** |

---

### 4.3. Tổng Hợp Chỉ số Agile Velocity & Tỷ lệ Quy đổi Giờ công
* **Tổng số Story Points toàn dự án:**
  $$\text{Total SP} = 55 + 62 + 68 + 45 = \mathbf{230 \text{ Story Points}}$$
* **Vận tốc Sprint Trung bình (Sprint Velocity):**
  $$\text{Velocity} = \frac{230 \text{ SP}}{4 \text{ Sprints}} = \mathbf{57.5 \text{ SP / Sprint}}$$
* **Tỷ lệ quy đổi trung bình:**
  $$\text{Tỷ lệ Quy đổi} = \frac{600 \text{ Giờ công}}{230 \text{ SP}} \approx \mathbf{2.61 \text{ Giờ công / Story Point}}$$

---

## 5. DỰ TOÁN NGÂN SÁCH DỰ ÁN & ĐƯỜNG CƠ SỞ CHI PHÍ (COST BASELINE)

Theo chuẩn **PMBOK 7 (Project Budgeting)**, ngân sách dự án phần mềm bao gồm Chi phí Trực tiếp, Chi phí Gián tiếp, Quỹ dự phòng rủi ro đã nhận diện (Contingency Reserve) và Quỹ dự phòng quản trị (Management Reserve).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CẤU TRÚC NGÂN SÁCH DỰ ÁN (PROJECT BUDGET)                       │
├───────────────────────────────────────────────────────────────────┬────────────────────┤
│                    ĐƯỜNG CƠ SỞ CHI PHÍ (COST BASELINE)            │ DỰ PHÒNG QUẢN TRỊ  │
├─────────────────────────────────────────┬─────────────────────────┤(Management Reserve)│
│       CHI PHÍ DỰ ÁN DỰ TOÁN             │    DỰ PHÒNG RỦI RO      │      5.0%          │
│ (Direct Labor + Cloud Infrastructure)   │  (Contingency Reserve)  │                    │
│                 80.7%                   │          14.3%          │                    │
└─────────────────────────────────────────┴─────────────────────────┴────────────────────┘
```

### 5.1. Bảng Dự toán Chi tiết Các Hạng mục Chi phí

#### A. Chi phí Nhân sự Trực tiếp (Direct Labor Cost)
Dự án được thực hiện bởi 3 kỹ sư sinh viên năm cuối (tương đương trình độ Junior Software Engineer / QA Analyst). Đơn giá giờ công tham chiếu định mức thị trường năm 2026: **60,000 VNĐ / giờ**.

| Thành viên | Vai trò Trách nhiệm | Tổng Giờ công | Đơn giá / giờ | Thành tiền Định mức | Thực chi Sinh viên |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **phong phạm** | Project Manager & Full-stack Engineer | 200 giờ | 60,000 VNĐ | 12,000,000 VNĐ | 0 VNĐ |
| **Long Phạm** | System Analyst & QA Lead Engineer | 200 giờ | 60,000 VNĐ | 12,000,000 VNĐ | 0 VNĐ |
| **Minh Tâm** | Technical Lead & Frontend Lead Engineer | 200 giờ | 60,000 VNĐ | 12,000,000 VNĐ | 0 VNĐ |
| **TỔNG CỘNG (A)**| **3 Thành viên Nòng cốt** | **600 giờ** | | **36,000,000 VNĐ**| **0 VNĐ** |

#### B. Chi phí Công cụ & Cơ sở Hạ tầng Kỹ thuật (Tools & Cloud Infrastructure)
Nhóm tận dụng tối đa chương trình **GitHub Student Developer Pack** và các gói tài trợ giáo dục để đưa chi phí thực tế về 0 VNĐ, song vẫn phản ánh đầy đủ giá trị kinh tế thương mại tương đương:

| Khoản mục Hạ tầng | Đơn vị Cung cấp | Thông số Kỹ thuật & Băng thông | Giá trị Thị trường | Chi phí Thực tế của Nhóm |
| :--- | :--- | :--- | :---: | :---: |
| **Cloud Database** | Supabase Platform | PostgreSQL 17, 500MB Storage, 5GB Bandwidth | 750,000 VNĐ | **0 VNĐ** (Student Plan) |
| **Cloud Web Server** | Render / Railway | Node.js Runtime, 512MB RAM, 0.1 CPU core | 600,000 VNĐ | **0 VNĐ** (Free Tier) |
| **Frontend CDN Hosting**| Vercel Cloud | Edge Network Global, SSL tự động | 500,000 VNĐ | **0 VNĐ** (Hobby Plan) |
| **Thiết kế UI/UX** | Figma Professional | License giáo dục cho sinh viên PTIT | 900,000 VNĐ | **0 VNĐ** (Figma Student) |
| **Tên miền Định danh** | Namecheap / GitHub | Domain quốc tế `.me` / `.tech` (1 năm) | 250,000 VNĐ | **0 VNĐ** (GitHub Pack) |
| **Quản trị Mã nguồn & CI**| GitHub Team | Unlimited Private Repos & GitHub Actions | 1,000,000 VNĐ | **0 VNĐ** (GitHub Free) |
| **TỔNG CỘNG (B)** | | | **4,000,000 VNĐ** | **0 VNĐ** |

#### C. Chi phí Hành chính, Đóng gói Hồ sơ & Bảo vệ Đồ án
Khoản chi tiêu tiền mặt thực tế bắt buộc phục vụ công tác in ấn, nghiệm thu và thuyết trình trước Hội đồng:

| Khoản mục Chi tiêu | Số lượng | Đơn giá | Thành tiền Thực chi |
| :--- | :---: | :---: | :---: |
| In ấn Báo cáo Tổng kết Đồ án bìa cứng mạ vàng (Word/PDF 80 trang) | 3 cuốn | 250,000 VNĐ | 750,000 VNĐ |
| In ấn Phiếu điểm mẫu, Bảng mã màu UI và Tài liệu tóm tắt (Executive Summary) | 5 bộ | 50,000 VNĐ | 250,000 VNĐ |
| Chuẩn bị phòng lab, máy chiếu & nước uống buổi bảo vệ hội đồng | Trọn gói | 500,000 VNĐ | 500,000 VNĐ |
| **TỔNG CỘNG (C)** | | | **1,500,000 VNĐ** |

#### D. Quỹ Dự phòng Rủi ro (Contingency Reserve) & Dự phòng Quản trị (Management Reserve)
* **Quỹ dự phòng rủi ro kỹ thuật (Contingency Reserve - 12%):** Bù đắp cho rủi ro tăng thời gian debug thuật toán hoặc chi phí nâng gói server nếu quá tải: **$4,500,000 \text{ VNĐ}$**.
* **Quỹ dự phòng quản trị bất khả kháng (Management Reserve - 5%):** Do Project Sponsor / Leader nắm quyền phê duyệt khi có thay đổi phạm vi lớn: **$2,000,000 \text{ VNĐ}$**.

---

### 5.2. Bảng Tổng hợp Cơ cấu Ngân sách & Đường cơ sở Chi phí (Cost Baseline)

| Khoản mục Ngân sách | Giá trị Thị trường Định mức | Tỷ lệ (%) | Chi phí Tiền mặt Thực chi | Ghi chú Hạch toán |
| :--- | :---: | :---: | :---: | :--- |
| **1. Chi phí Nhân sự (Labor)** | 36,000,000 VNĐ | 81.8% | 0 VNĐ | Công sức 3 thành viên đóng góp |
| **2. Cơ sở Hạ tầng Cloud (Tools)** | 4,000,000 VNĐ | 9.1% | 0 VNĐ | Tận dụng GitHub Student Pack |
| **3. Vật phẩm & Nghiệm thu (Admin)** | 1,500,000 VNĐ | 3.4% | 1,500,000 VNĐ | Chi phí tiền mặt thực tế của nhóm |
| **4. Dự phòng Rủi ro (Contingency)** | 4,500,000 VNĐ | 10.2% | 0 VNĐ | Dự phòng nỗ lực kỹ thuật |
| **ĐƯỜNG CƠ SỞ CHI PHÍ (COST BASELINE)**| **46,000,000 VNĐ**| **104.5%**| **1,500,000 VNĐ** | **Cơ sở đo lường tiến độ EVM** |
| **5. Dự phòng Quản lý (Management)** | 2,000,000 VNĐ | 4.5% | 0 VNĐ | Quyền kiểm soát của Sponsor |
| **TỔNG NGÂN SÁCH DỰ ÁN (BUDGET)** | **48,000,000 VNĐ** | **100.0%**| **1,500,000 VNĐ** | |

---

### 5.3. Bảng Phân bổ Ngân sách Tích lũy theo Sprint (Đường cong S-Curve)

Theo khuyến nghị của PMBOK 7, đường cơ sở chi phí được phân bổ tích lũy theo 4 Sprint để phục vụ phương pháp Quản lý Giá trị Thu được (Earned Value Management - EVM) tại tài liệu `PM-04`:

| Giai đoạn Dự án | Sprint | Thời lượng | Ngân sách Sprint (PV) | Ngân sách Tích lũy (Cumulative PV) | Tỷ lệ Hoàn thành Kế hoạch |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Sprint 1: Phân tích & Khảo sát** | Tuần 1-2 | 10 ngày | 11,000,000 VNĐ | 11,000,000 VNĐ | **23.9%** |
| **Sprint 2: Thiết kế & Khung Base** | Tuần 3-4 | 10 ngày | 12,500,000 VNĐ | 23,500,000 VNĐ | **51.1%** |
| **Sprint 3: Phát triển 3 Luồng Core**| Tuần 5-6 | 10 ngày | 14,000,000 VNĐ | 37,500,000 VNĐ | **81.5%** |
| **Sprint 4: Kiểm thử & Đóng gói** | Tuần 7-8 | 10 ngày | 8,500,000 VNĐ | 46,000,000 VNĐ | **100.0%** |

```
Chi phí Tích lũy (VNĐ)
 46M ┼                                                ╭────── [M4: Nghiệm thu]
     │                                         ╭──────╯ (46M VNĐ - 100%)
 37M ┼                                  ╭──────╯
     │                           ╭──────╯ [M3: Hoàn thành Core] (37.5M VNĐ - 81.5%)
 23M ┼                    ╭──────╯ [M2: Xong Khung Base] (23.5M VNĐ - 51.1%)
     │             ╭──────╯
 11M ┼──────╭──────╯ [M1: Xong Đặc tả] (11M VNĐ - 23.9%)
     │╭─────╯
  0M ┼┴──────────────┴──────────────┴──────────────┴──────────────► Thời gian
     Sprint 1       Sprint 2       Sprint 3       Sprint 4
```

---

## 6. QUY TRÌNH KIỂM SOÁT TIẾN ĐỘ & CHI PHÍ (COST & EFFORT CONTROL)

### 6.1. Ngưỡng Cảnh báo Sai lệch Nỗ lực (Effort Variance Threshold)
* **Ngưỡng An toàn (Green Zone):** Độ lệch giờ công thực tế so với kế hoạch $\le \pm 5\%$.
* **Ngưỡng Cảnh báo (Yellow Zone):** Độ lệch từ $\pm 5\%$ đến $\pm 10\%$. Project Manager tổ chức họp Daily Scrum khẩn để điều chỉnh phân công hoặc cắt giảm các tác vụ thứ yếu (MoSCoW Could-have).
* **Ngưỡng Nguy hiểm (Red Zone):** Độ lệch $> \pm 10\%$. Kích hoạt Quỹ dự phòng rủi ro (Contingency Reserve), áp dụng kỹ thuật Fast-tracking (chạy song song) hoặc Crashing (tập trung toàn lực).

### 6.2. Cơ chế Đồng bộ với Phân hệ Đo lường EVM (`[PM-04]`)
Bảng ngân sách cơ sở và ma trận Story Points tại tài liệu này là dữ liệu đầu vào trực tiếp cho hệ thống đo lường hiệu suất dự án tại tài liệu `docs/PM-04_Do_luong_hieu_suat_EVM_va_Agile_Metrics.md`, thông qua 4 chỉ số cốt lõi:
1. **Giá trị Kế hoạch (Planned Value - PV):** Ngân sách tích lũy phân bổ theo S-Curve.
2. **Giá trị Thu được (Earned Value - EV):** Quy đổi theo tỷ lệ hoàn thành Story Points thực tế.
3. **Chi phí Thực tế (Actual Cost - AC):** Giờ công thực tế nhân với đơn giá định mức.
4. **Các chỉ số Hiệu suất:** Chỉ số hiệu suất chi phí $CPI = EV / AC$ và Chỉ số hiệu suất tiến độ $SPI = EV / PV$.

---

## 7. KẾT LUẬN & PHÊ DUYỆT (DOCUMENT SIGNOFF)

Bản kế hoạch Ước lượng Nỗ lực (FPA, PERT) và Dự toán Ngân sách (Cost Baseline) mã hiệu **`PM-02`** đã được tính toán khoa học, định lượng chặt chẽ theo các tiêu chuẩn quốc tế uy tín. Toàn bộ các tham số định lượng hoàn toàn đồng bộ với Kế hoạch Tiến độ WBS (`PM-01`) và Danh mục Yêu cầu Nghiệp vụ (`SRS-01`).

| ĐẠI DIỆN PHÂN TÍCH HỆ THỐNG (SA / QA LEAD) | ĐẠI DIỆN QUẢN TRỊ DỰ ÁN (PROJECT MANAGER) |
| :---: | :---: |
| *(Đã ký duyệt)* | *(Đã ký duyệt)* |
| **Long Phạm** (`@longphm11`) | **phong phạm** (`@phongphm2`) |
| Ngày phê duyệt: 13/10/2026 | Ngày phê duyệt: 13/10/2026 |
