# KẾ HOẠCH QUẢN LÝ RỦI RO (RISK MANAGEMENT PLAN) & BẢNG NHẬT KÝ RỦI RO (RISK REGISTER)
## HỆ THỐNG CRM QUẢN LÝ TUYỂN SINH VÀ ĐÀO TẠO TRUNG TÂM ANH NGỮ (EDUFLOW CRM)

---

### THÔNG TIN TỔNG QUAN TÀI LIỆU (DOCUMENT METADATA)

| Thuộc tính | Chi tiết định danh |
| :--- | :--- |
| **Mã tài liệu** | **PM-03** |
| **Tên tài liệu** | Kế hoạch Quản lý Rủi ro, Cấu trúc Phân rã Rủi ro (RBS) & Bảng Nhật ký Rủi ro Chi tiết (Risk Register) |
| **Tên dự án** | Hệ thống CRM Quản lý Tuyển sinh và Đào tạo Trung tâm Anh ngữ (EduFlow CRM) |
| **Học phần** | Quản lý Dự án Phần mềm (Software Project Management) |
| **Đơn vị đào tạo** | Học viện Công nghệ Bưu chính Viễn thông (PTIT) - Khoa Công nghệ Thông tin |
| **Nhóm thực hiện** | Nhóm 8 |
| **Project Sponsor** | Giảng viên hướng dẫn học phần & Ban đánh giá chuyên môn |
| **Người thực hiện chính** | **Long Phạm** (`@longphm11`) - System Analyst (SA) & QA/Testing Lead |
| **Phối hợp & Phê duyệt** | **phong phạm** (`@phongphm2` / `phongg2905`) - Project Manager (Leader) |
| **Đồng kiểm duyệt** | **Minh Tâm** (`@tamminh6`) - Technical Architect & Frontend Lead |
| **Tiêu chuẩn đối sánh** | **PMBOK® Guide – 7th Edition (Uncertainty Performance Domain)**, ISO 31000:2018 & IEEE 16085 |
| **Phiên bản tài liệu** | **v1.0 (Ban hành chính thức)** |
| **Chu kỳ dự án** | 8 tuần (40 ngày làm việc: 28/09/2026 - 20/11/2026) |

---

## 1. MỤC ĐÍCH & PHƯƠNG PHÁP LUẬN QUẢN TRỊ RỦI RO (RISK MANAGEMENT APPROACH)

### 1.1. Mục tiêu Quản trị Bất định (Uncertainty Performance Domain)
Theo tiêu chuẩn **PMBOK® Guide – 7th Edition**, miền hiệu suất Bất định (Uncertainty Performance Domain) đòi hỏi đội ngũ dự án không chỉ phản ứng thụ động khi sự cố đã xảy ra mà phải thiết lập hệ thống **nhận diện sớm, phân tích định lượng và ứng phó chủ động**. Đối với dự án phát triển phần mềm **EduFlow CRM**, kế hoạch quản lý rủi ro hướng tới 4 mục tiêu trọng tâm:
1. **Bảo vệ Đường găng Tiến độ (Critical Path Protection):** Ngăn ngừa nguy cơ trễ hạn tại các cột mốc bàn giao M1 $\rightarrow$ M4 trong chu kỳ 8 tuần (40 ngày làm việc).
2. **Đảm bảo Toàn vẹn Nghiệp vụ & Dữ liệu (ACID & Business Integrity):** Kiểm soát triệt để các rủi ro kỹ thuật đặc thù của bài toán CRM trung tâm ngoại ngữ (xung đột lịch thi Placement Test, quá tải sĩ số trần của lớp học, trùng lặp dữ liệu Lead đa kênh).
3. **Ổn định Phạm vi & Chất lượng (Scope & Quality Assurance):** Phòng chống hiện tượng phình to phạm vi (Scope Creep) và suy giảm hiệu năng khi ghép nối Full-stack.
4. **Định lượng Quỹ Dự phòng Khoa học (Quantitative Reserve Sizing):** Sử dụng phương pháp Giá trị Kỳ vọng (Expected Monetary/Effort Value - EMV) để tính toán chính xác quỹ giờ công và ngân sách dự phòng rủi ro, liên kết đồng bộ với tài liệu `PM-02`.

### 1.2. Chu trình Quản trị Rủi ro Khép kín 6 Bước
Đội ngũ Nhóm 8 vận hành quy trình quản lý rủi ro xuyên suốt 4 Sprint theo chu trình 6 bước chuẩn PMI:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│              CHU TRÌNH QUẢN TRỊ RỦI RO KHÉP KÍN DỰ ÁN EDUFLOW CRM (PMBOK 7)            │
├────────────────────────┬───────────────────────────┬───────────────────────────────────┤
│ BƯỚC 1: LẬP KẾ HOẠCH   │ BƯỚC 2: NHẬN DIỆN RỦI RO  │ BƯỚC 3: PHÂN TÍCH ĐỊNH TÍNH       │
│ Thiết lập khung RBS,   │ Rà soát WBS, kiến trúc DB,│ Đánh giá Xác suất (P) & Tác động  │
│ thang đo 5x5 & quy chế │ thuật toán & lịch học tập │ (I) trên ma trận nhiệt độ 5x5     │
├────────────────────────┼───────────────────────────┼───────────────────────────────────┤
│ BƯỚC 6: GIÁM SÁT SPRINT│ BƯỚC 5: KẾ HOẠCH ỨNG PHÓ  │ BƯỚC 4: PHÂN TÍCH ĐỊNH LƯỢNG      │
│ Rà soát tại Daily Scrum│ Chiến lược Avoid, Mitigate│ Tính toán chỉ số EMV (Giờ công &  │
│ & Sprint Retrospective │ Transfer, Accept & Trigger│ VNĐ), lập quỹ dự phòng Contingency│
└────────────────────────┴───────────────────────────┴───────────────────────────────────┘
```

---

## 2. CẤU TRÚC PHÂN RÃ RỦI RO 4 NHÓM (RISK BREAKDOWN STRUCTURE - RBS)

Để đảm bảo không bỏ sót bất kỳ nguồn phát sinh rủi ro nào trong suốt vòng đời phát triển, toàn bộ rủi ro của dự án EduFlow CRM được phân loại theo **Cấu trúc Phân rã Rủi ro (RBS)** gồm 4 nhóm chính: **(1) Kỹ thuật**, **(2) Quản trị**, **(3) Nhân sự**, và **(4) Môi trường**.

### 2.1. Sơ đồ Cây Phân rã Rủi ro (Hierarchical RBS Tree)

```
RBS 0.0: TỔNG THỂ RỦI RO DỰ ÁN EDUFLOW CRM
│
├── 1.0 RỦI RO KỸ THUẬT & CÔNG NGHỆ (TECHNICAL RISKS)
│   ├── 1.1 Tích hợp Mã nguồn & Kiến trúc: [RSK-01] Xung đột ghép nối nhánh Git Full-stack
│   ├── 1.2 Thuật toán & Toàn vẹn CSDL:    [RSK-03] Lỗi Race Condition trùng lịch thi & vượt sĩ số lớp
│   ├── 1.3 Hiệu năng & Khả năng chịu tải: [RSK-06] Nghẽn kết nối DB Pool & trễ API báo cáo (> 200ms)
│   └── 1.4 An toàn & Bảo mật Thông tin:   [RSK-07] Lỗ hổng phân quyền RBAC & rò rỉ dữ liệu SĐT Lead
│
├── 2.0 RỦI RO QUẢN TRỊ DỰ ÁN & PHẠM VI (MANAGEMENT & SCOPE RISKS)
│   ├── 2.1 Tiến độ & Đường găng CPM:      [RSK-02] Trễ hạn cột mốc Sprint do quá tải khối lượng 8 tuần
│   ├── 2.2 Kiểm soát Phạm vi (Scope):     [RSK-04] Phình to phạm vi yêu cầu ngoài 3 Use Case cốt lõi
│   └── 2.3 Ước lượng & Phân bổ Nỗ lực:    [RSK-08] Sai lệch ước lượng độ phức tạp thuật toán nghiệp vụ
│
├── 3.0 RỦI RO NHÂN SỰ & TỔ CHỨC ĐỘI NGŨ (HUMAN RESOURCE RISKS)
│   ├── 3.1 Lịch trình & Quỹ thời gian:    [RSK-09] Giao thoa lịch thi giữa kỳ/cuối kỳ tại Học viện PTIT
│   └── 3.2 Tri thức & Phối hợp Nhóm:      [RSK-10] Phụ thuộc kiến thức cục bộ (Bus Factor / Silo)
│
└── 4.0 RỦI RO MÔI TRƯỜNG & HẠ TẦNG NGOÀI (ENVIRONMENTAL & EXTERNAL RISKS)
    ├── 4.1 Môi trường Phát triển Cục bộ:  [RSK-05] Hỏng môi trường máy cá nhân hoặc lệch Schema SQL
    ├── 4.2 Dịch vụ Đám mây Bên thứ ba:    [RSK-11] Gián đoạn kết nối Supabase Cloud hoặc giới hạn SMTP
    └── 4.3 Yêu cầu Học thuật & Nghiệm thu:[RSK-12] Thay đổi tiêu chí đánh giá hoặc kịch bản hỏi đáp Hội đồng
```

### 2.2. Bảng Đặc tả Danh mục 4 Nhóm RBS

| Mã Nhóm RBS | Tên Nhóm Rủi ro | Phạm vi Kiểm soát Trọng tâm | Người Chịu Trách nhiệm Chính | Mã Rủi ro Trực thuộc |
| :---: | :--- | :--- | :---: | :---: |
| **RBS-1.0** | **Rủi ro Kỹ thuật (Technical)** | Kiến trúc Client-Server, ràng buộc ACID PostgreSQL, thuật toán xếp lịch, hiệu năng API, bảo mật JWT/RBAC. | **Minh Tâm** (Tech Lead) & **phong phạm** | `RSK-01`, `RSK-03`, `RSK-06`, `RSK-07` |
| **RBS-2.0** | **Rủi ro Quản trị (Management)** | Tiến độ đường găng CPM, kiểm soát phạm vi MoSCoW, quản lý backlog Trello, cân đối giờ công Story Points. | **phong phạm** (Project Manager) | `RSK-02`, `RSK-04`, `RSK-08` |
| **RBS-3.0** | **Rủi ro Nhân sự (Human Resource)** | Quỹ thời gian 25h/tuần của các thành viên, chia sẻ kiến thức chéo (Cross-training), đánh giá code chéo. | **phong phạm** & **Long Phạm** | `RSK-09`, `RSK-10` |
| **RBS-4.0** | **Rủi ro Môi trường (Environmental)** | Hạ tầng Supabase Cloud, cấu hình `.env`, quy trình sao lưu SQL, tiêu chuẩn nghiệm thu đồ án PTIT. | **Long Phạm** (SA / QA Lead) | `RSK-05`, `RSK-11`, `RSK-12` |

---

## 3. MA TRẬN ĐÁNH GIÁ RỦI RO 5×5 & THANG ĐIỂM NGHIÊM TRỌNG (PROBABILITY & IMPACT MATRIX)

### 3.1. Thang Đo Xác suất Xảy ra Rủi ro (Probability Scale - $P$)

| Điểm ($P$) | Mức Xác suất | Tỷ lệ Xác suất Định lượng | Tiêu chí Định nghĩa Thực tiễn trong Dự án |
| :---: | :---: | :---: | :--- |
| **1** | **Rất Thấp (Very Low)** | $1\% - 10\%$ | Rất hiếm khi xảy ra; chỉ xuất hiện trong điều kiện cực đoan bất khả kháng. |
| **2** | **Thấp (Low)** | $11\% - 30\%$ | Ít có khả năng xảy ra; đã có các hàng rào kỹ thuật cơ bản ngăn chặn. |
| **3** | **Trung bình (Medium)** | $31\% - 50\%$ | Khả năng xảy ra 50/50 trong quá trình lập trình và tích hợp các Sprint. |
| **4** | **Cao (High)** | $51\% - 70\%$ | Nhiều khả năng xảy ra nếu không áp dụng quy trình kiểm soát chặt chẽ hàng ngày. |
| **5** | **Rất Cao (Very High)** | $71\% - 90\%$ | Gần như chắc chắn xảy ra trong các dự án phần mềm Full-stack nếu thiếu cơ chế khóa. |

### 3.2. Thang Đo Mức độ Tác động Đa Chiều (Impact Scale - $I$)

| Điểm ($I$) | Mức Tác động | Tác động Tiến độ (Schedule) | Tác động Nỗ lực (Effort/Cost) | Tác động Chất lượng & Nghiệp vụ (Quality) |
| :---: | :---: | :--- | :--- | :--- |
| **1** | **Không đáng kể (Negligible)**| Trễ $< 0.5$ ngày | Phát sinh $< 4$ giờ công | Lỗi giao diện nhỏ (Cosmetic UI), không ảnh hưởng luồng. |
| **2** | **Nhỏ (Minor)** | Trễ $0.5 - 1$ ngày | Phát sinh $4 - 10$ giờ công | Lỗi chức năng phụ (Could-have), có cách xử lý tạm (Workaround). |
| **3** | **Trung bình (Moderate)** | Trễ $2 - 3$ ngày | Phát sinh $11 - 24$ giờ công | Ảnh hưởng 1 chức năng Should-have; cần refactor cục bộ. |
| **4** | **Lớn (Major)** | Trễ $4 - 5$ ngày (Lệch Sprint)| Phát sinh $25 - 45$ giờ công | Lỗi luồng Use Case cốt lõi (Must-have) hoặc sai lệch dữ liệu. |
| **5** | **Thảm họa (Catastrophic)** | Trễ $> 5$ ngày (Vỡ Milestone)| Phát sinh $> 45$ giờ công | Sập hệ thống, mất dữ liệu CSDL, không thể demo bảo vệ đồ án. |

### 3.3. Ma trận Nhiệt độ Rủi ro 5×5 (5×5 Risk Scoring Matrix)

Điểm mức độ nghiêm trọng của rủi ro được tính theo công thức:

$$\text{Risk Score } (S) = \text{Probability } (P) \times \text{Impact } (I) \quad (S \in [1, 25])$$

| Xác suất ($P$) \ Tác động ($I$) | **1 - Không đáng kể** | **2 - Nhỏ** | **3 - Trung bình** | **4 - Lớn** | **5 - Thảm họa** |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **5 - Rất Cao ($71-90\%$)** | 5 (Vàng) | 10 (Cam) | 15 (Đỏ) | 20 (Đỏ) | **25 (Đỏ)** |
| **4 - Cao ($51-70\%$)** | 4 (Xanh) | 8 (Vàng) | 12 (Cam) | **16 (Đỏ)** `[RSK-03]` | **20 (Đỏ)** |
| **3 - Trung bình ($31-50\%$)** | 3 (Xanh) | 6 (Vàng) | **9 (Vàng)** `[RSK-06, 08]` | **12 (Cam)** `[RSK-01, 02, 09]`| 15 (Đỏ) |
| **2 - Thấp ($11-30\%$)** | 2 (Xanh) | 4 (Xanh) | **6 (Vàng)** `[RSK-04, 10, 11, 12]`| **8 (Vàng)** `[RSK-07]` | **10 (Cam)** `[RSK-05]` |
| **1 - Rất Thấp ($1-10\%$)** | **1 (Xanh)** | 2 (Xanh) | 3 (Xanh) | 4 (Xanh) | 5 (Vàng) |

### 3.4. Quy tắc Phân hạng Mức độ Nghiêm trọng & Ngưỡng Hành động

| Phân hạng Mức độ | Dải điểm ($S = P \times I$) | Mã màu | Ngưỡng Hành động Quản trị Bắt buộc |
| :--- | :---: | :---: | :--- |
| **NGHIÊM TRỌNG (Critical)** | **$15 - 25$ điểm** | 🔴 **Đỏ** | **Ưu tiên Tối cao:** Bắt buộc thiết kế giải pháp kiến trúc triệt tiêu nguyên nhân gốc ngay từ Sprint 1-2; giám sát hàng ngày tại Daily Standup. |
| **CAO (High)** | **$10 - 14$ điểm** | 🟠 **Cam** | **Ưu tiên Cao:** Lập kế hoạch giảm thiểu chi tiết, phân công Risk Owner trực tiếp kiểm tra trong mỗi Pull Request và cuối mỗi tuần. |
| **TRUNG BÌNH (Medium)** | **$5 - 9$ điểm** | 🟡 **Vàng** | **Ưu tiên Trung bình:** Thiết lập dấu hiệu cảnh báo sớm (Trigger) và chuẩn bị sẵn kịch bản dự phòng (Contingency Plan) khi cần kích hoạt. |
| **THẤP (Low)** | **$1 - 4$ điểm** | 🟢 **Xanh** | **Chấp nhận có giám sát:** Theo dõi định kỳ vào cuối mỗi Sprint; xử lý bằng quy trình vận hành tiêu chuẩn của nhóm. |

---

## 4. BẢNG NHẬT KÝ RỦI RO TOÀN DIỆN (COMPREHENSIVE RISK REGISTER - 12 RỦI RO)

Dưới đây là bảng nhật ký 12 rủi ro thực tế đã được nhận diện, định lượng và gán chiến lược phản ứng xuyên suốt quá trình phát triển hệ thống **EduFlow CRM** (mở rộng và kế thừa đầy đủ 5 rủi ro gốc `RSK-01` $\rightarrow$ `RSK-05` từ `CHARTER-01`):

### 4.1. Bảng Định lượng & Phân hạng 12 Rủi ro Dự án

| Mã Rủi ro | Nhóm RBS | Tên Rủi ro & Mô tả Chi tiết Nguyên nhân / Hệ quả | $P$ (1-5) | $I$ (1-5) | Điểm Gốc ($S=P\times I$) | Phân hạng Ban đầu | Chiến lược Phản ứng (PMBOK) | Điểm Dư ($S_{\text{res}}$) |
| :---: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **RSK-01** | `RBS-1.1` Kỹ thuật | **Xung đột mã nguồn (Merge Conflicts) khi ghép nối các phân hệ Full-stack**<br>*Nguyên nhân:* 3 thành viên cùng chỉnh sửa các tệp điều hướng trung tâm (`AppRoutes.tsx`, `routes/index.ts`, types).<br>*Hệ quả:* Lỗi biên dịch TypeScript, mất tính năng khi gộp nhánh vào `main`. | 3 | 4 | **12** | 🟠 **Cao** | **Giảm thiểu (Mitigate)** | **3** (Xanh) |
| **RSK-02** | `RBS-2.1` Quản trị | **Trễ tiến độ đường găng CPM do khối lượng công việc lớn trong 8 tuần**<br>*Nguyên nhân:* Dự án bao gồm cả bộ tài liệu PMBOK/BA/SRS/UML đồ sộ lẫn ứng dụng Web Full-stack 6 phân hệ.<br>*Hệ quả:* Không kịp đóng gói sản phẩm ở Sprint 4. | 3 | 4 | **12** | 🟠 **Cao** | **Giảm thiểu (Mitigate)** | **4** (Xanh) |
| **RSK-03** | `RBS-1.2` Kỹ thuật | **Lỗi logic tương tranh (Race Condition) gây trùng lịch phòng thi & vượt sĩ số lớp**<br>*Nguyên nhân:* Nhiều Sales/Academic thao tác đặt lịch test hoặc xếp lớp cùng lúc cho 1 ca thi/lớp học chỉ còn 1 chỗ trống.<br>*Hệ quả:* Vỡ quy tắc nghiệp vụ cốt lõi (`BR-02`, `BR-04`), mất tính toàn vẹn CSDL. | 4 | 4 | **16** | 🔴 **Nghiêm trọng** | **Né tránh (Avoid)** | **2** (Xanh) |
| **RSK-04** | `RBS-2.2` Quản trị | **Phình to phạm vi yêu cầu (Scope Creep) ngoài 3 Use Case hạt nhân**<br>*Nguyên nhân:* Phát sinh ý tưởng thêm cổng thanh toán ngân hàng thực tế, chat realtime hoặc app mobile trong lúc code.<br>*Hệ quả:* Phân tán nguồn lực, làm chậm các tính năng Must-have. | 2 | 3 | **6** | 🟡 **Trung bình** | **Né tránh (Avoid)** | **2** (Xanh) |
| **RSK-05** | `RBS-4.1` Môi trường| **Sự cố thất lạc dữ liệu mã nguồn, hỏng môi trường local hoặc lỗi Schema SQL**<br>*Nguyên nhân:* Lỗi ổ cứng máy cá nhân, xung đột phiên bản Node.js/PostgreSQL hoặc chạy nhầm lệnh xóa bảng.<br>*Hệ quả:* Gián đoạn lập trình, mất dữ liệu kiểm thử. | 2 | 5 | **10** | 🟠 **Cao** | **Giảm thiểu & Chuyển giao** | **2** (Xanh) |
| **RSK-06** | `RBS-1.3` Kỹ thuật | **Suy giảm hiệu năng truy vấn API Báo cáo Thống kê & nghẽn DB Connection Pool**<br>*Nguyên nhân:* Các truy vấn gom nhóm (Aggregation) phễu tuyển sinh, doanh thu theo tháng và xuất CSV chạy không có Index.<br>*Hệ quả:* Vi phạm `NFR-01` (độ trễ API $> 200\text{ms}$), treo kết nối Supabase. | 3 | 3 | **9** | 🟡 **Trung bình** | **Giảm thiểu (Mitigate)** | **3** (Xanh) |
| **RSK-07** | `RBS-1.4` Kỹ thuật | **Lỗ hổng phân quyền RBAC giữa các vai trò & rò rỉ dữ liệu SĐT học viên**<br>*Nguyên nhân:* Thiếu kiểm tra role ở tầng API middleware hoặc lộ thông tin nhạy cảm giữa các tư vấn viên Sales.<br>*Hệ quả:* Vi phạm yêu cầu bảo mật `FR-AUTH-03` và `NFR-SEC-03`. | 2 | 4 | **8** | 🟡 **Trung bình** | **Né tránh (Avoid)** | **2** (Xanh) |
| **RSK-08** | `RBS-2.3` Quản trị | **Sai lệch ước lượng nỗ lực (Effort Underestimation) ở các UI phức tạp**<br>*Nguyên nhân:* Bảng kéo thả Kanban 5 bước chống giật, lịch Calendar View và xuất phiếu điểm PDF tốn nhiều giờ CSS/DOM hơn dự tính.<br>*Hệ quả:* Trễ hạn bàn giao các thẻ Frontend trong Sprint 3. | 3 | 3 | **9** | 🟡 **Trung bình** | **Giảm thiểu (Mitigate)** | **3** (Xanh) |
| **RSK-09** | `RBS-3.1` Nhân sự | **Giao thoa lịch thi giữa kỳ / bài tập lớn các môn học khác tại PTIT**<br>*Nguyên nhân:* Cả 3 thành viên đều là sinh viên chính quy, lịch thi các học phần khác dồn vào tuần 5 - tuần 7.<br>*Hệ quả:* Sụt giảm vận tốc nhóm (Sprint Velocity) tạm thời trong Sprint 3. | 3 | 4 | **12** | 🟠 **Cao** | **Giảm thiểu (Mitigate)** | **4** (Xanh) |
| **RSK-10** | `RBS-3.2` Nhân sự | **Phụ thuộc kiến thức cục bộ (Knowledge Silo / Bus Factor)**<br>*Nguyên nhân:* Chuyên môn hóa sâu (người chuyên viết Backend SQL, người chuyên làm UI Mantine, người chuyên viết tài liệu BA/PM).<br>*Hệ quả:* Khó hỗ trợ chéo ngay lập tức khi 1 thành viên bận đột xuất. | 2 | 3 | **6** | 🟡 **Trung bình** | **Giảm thiểu (Mitigate)** | **2** (Xanh) |
| **RSK-11** | `RBS-4.2` Môi trường| **Gián đoạn kết nối Supabase Cloud DB hoặc giới hạn Rate Limit dịch vụ SMTP OTP**<br>*Nguyên nhân:* Đứt cáp quang biển làm tăng ping tới Supabase Singapore hoặc dịch vụ gửi email OTP bị chặn spam.<br>*Hệ quả:* Chậm phản hồi khi demo trực tiếp hoặc không nhận được mã khôi phục mật khẩu. | 2 | 3 | **6** | 🟡 **Trung bình** | **Chấp nhận Chủ động (Accept)**| **2** (Xanh) |
| **RSK-12** | `RBS-4.3` Môi trường| **Thay đổi hoặc bổ sung yêu cầu kiểm tra thực nghiệm từ Hội đồng Bảo vệ**<br>*Nguyên nhân:* Giảng viên phản biện yêu cầu giải trình sâu về công thức EVM/FPA hoặc test trực tiếp các ca biên (Edge Cases).<br>*Hệ quả:* Lúng túng khi bảo vệ nếu không chuẩn bị trước dữ liệu và kịch bản. | 2 | 3 | **6** | 🟡 **Trung bình** | **Chấp nhận Chủ động (Accept)**| **1** (Xanh) |

---

## 5. CHIẾN LƯỢC PHẢN ỨNG, DẤU HIỆU KÍCH HOẠT (TRIGGERS) & PHÂN CÔNG RISK OWNER

Theo chuẩn **PMBOK 7**, mỗi rủi ro trong Risk Register đều phải được gán một **Người sở hữu rủi ro (Risk Owner)** chịu trách nhiệm theo dõi **Dấu hiệu kích hoạt sớm (Trigger Event)** và thực thi ngay **Kế hoạch hành động dự phòng (Contingency Plan)** khi sự cố xảy ra.

### 5.1. Ma trận Kế hoạch Ứng phó Chi tiết và Phân công Trách nhiệm

| Mã Rủi ro | Chiến lược Ứng phó | Dấu hiệu Kích hoạt Sớm (Trigger Event) | Biện pháp Phòng ngừa Chủ động (Prevention Plan) | Kế hoạch Kích hoạt Khi Xảy ra (Contingency Action Plan) | Risk Owner (Người sở hữu) |
| :---: | :---: | :--- | :--- | :--- | :---: |
| **RSK-01**<br>*(Merge Conflict)* | **Mitigate**<br>(Giảm thiểu) | Git báo `CONFLICT` tại `AppRoutes.tsx` hoặc `routes/index.ts`; lệnh `npm run build` báo lỗi TS. | - Áp dụng quy tắc Feature Branching (`feat/*`, `docs/*`).<br>- Thiết kế kiến trúc Module hóa tách riêng từng thư mục trang/controller.<br>- Luôn `git fetch origin` & `git merge main` trước khi tạo PR. | - Chủ nhánh phối hợp cùng PM giải quyết xung đột cục bộ, giữ nguyên đầy đủ import của cả hai nhánh.<br>- Chạy `tsc -b && vite build` ở cả FE & BE đạt 0 lỗi mới được phép merge. | **Minh Tâm** & **phong phạm** |
| **RSK-02**<br>*(Trễ tiến độ 8 tuần)* | **Mitigate**<br>(Giảm thiểu) | Tỷ lệ hoàn thành thẻ Trello vào chiều Thứ 5 của tuần cuối Sprint đạt $< 80\%$ kế hoạch; chỉ số $SPI < 0.90$. | - Áp dụng nghiêm ngặt phân loại **MoSCoW** (`SRS-01`).<br>- Ưu tiên hoàn tất 100% các gói công việc nằm trên đường găng CPM (`PM-01`).<br>- Họp Daily Standup 15 phút mỗi tối qua Discord/Zalo. | - Kích hoạt kỹ thuật **Fast-tracking** (lập trình FE song song với BE dựa trên Swagger Mock) và **Crashing** (huy động quỹ dự phòng giờ công cuối tuần). | **phong phạm**<br>*(Project Manager)* |
| **RSK-03**<br>*(Trùng lịch & Quá sĩ số)* | **Avoid**<br>(Né tránh triệt để) | Xuất hiện 2 bản ghi trùng `(room, test_date, shift)` hoặc `current_enrolled > max_capacity` khi bắn request đồng thời. | - Thiết kế ràng buộc cứng ở tầng CSDL PostgreSQL (`CHECK (current_enrolled <= max_capacity)`).<br>- Sử dụng `BEGIN ... SELECT FOR UPDATE ... COMMIT` (ACID Transaction Lock) trong `placement-test` và `enrollment` service. | - Rollback tức thời giao dịch lỗi, trả về mã HTTP `409 Conflict` kèm thông báo rõ ràng trên UI (`ShiftCapacityAlert`), gợi ý ca thi/lớp học thay thế còn chỗ. | **phong phạm** & **Long Phạm** |
| **RSK-04**<br>*(Scope Creep)* | **Avoid**<br>(Né tránh) | Thành viên đề xuất thêm tính năng ngoài danh mục 25 User Stories đã chốt trong `PM-02`. | - Khóa chặt ranh giới *Out-of-Scope* tại mục 3.2 của `CHARTER-01`.<br>- Mọi thay đổi phải qua quy trình Change Request trong `PM-05`. | - Từ chối đưa vào Sprint hiện tại; ghi nhận vào danh mục *Future Enhancements (Hướng phát triển mở rộng)* trong báo cáo tổng kết. | **phong phạm**<br>*(Project Manager)* |
| **RSK-05**<br>*(Mất code / Lỗi DB)* | **Mitigate & Transfer** | Máy cá nhân không khởi động được hoặc CSDL local/cloud bị lỗi cấu trúc bảng. | - Lưu trữ 100% mã nguồn trên GitHub Cloud (commit & push hàng ngày).<br>- Chuẩn hóa script khởi tạo CSDL và dữ liệu mẫu (`database/schema.sql`, `seed.sql`) kèm file `.env.example`. | - Kéo lại toàn bộ mã nguồn từ `origin/main` sang máy dự phòng trong vòng 10 phút; chạy script khôi phục CSDL tự động từ bản sao lưu Supabase. | **Long Phạm**<br>*(SA / QA Lead)* |
| **RSK-06**<br>*(Nghẽn hiệu năng API)* | **Mitigate**<br>(Giảm thiểu) | Thời gian phản hồi API `/api/analytics/*` hoặc `/api/leads/kanban` vượt quá $200\text{ms}$ trên Swagger/DevTools. | - Đánh chỉ mục B-Tree Index cho các cột tìm kiếm thường xuyên (`phone_number`, `status`, `assigned_sales_id`, `test_date`).<br>- Giới hạn `max: 20` kết nối trong PostgreSQL Pool. | - Tối ưu hóa câu lệnh SQL bằng `CTE (WITH ...)` và chạy `Promise.all()` song song cho các truy vấn thống kê độc lập. | **phong phạm** & **Long Phạm** |
| **RSK-07**<br>*(Lỗ hổng RBAC / Bảo mật)* | **Avoid**<br>(Né tránh) | Tài khoản role `SALES` gọi được API quản trị nhân sự hoặc xem được mật khẩu/thông tin nhạy cảm trái quyền. | - Tích hợp Middleware `verifyToken` và `authorizeRoles('ADMIN', ...)` trên toàn bộ các cụm routes nhạy cảm.<br>- Mã hóa mật khẩu bằng `bcrypt` (10 salt rounds). | - Khóa ngay endpoint bị hở, bổ sung bộ kịch bản kiểm thử phân quyền tự động (`test-auth.ts`, `test-staff-flow.ts`) chặn mã `403 Forbidden`. | **phong phạm** & **Long Phạm** |
| **RSK-08**<br>*(Sai lệch ước lượng UI)* | **Mitigate**<br>(Giảm thiểu) | Một thẻ giao diện Frontend (`FE-03`, `FE-05B`, `FE-06`) tiêu tốn vượt quá $120\%$ số giờ ước lượng ban đầu. | - Xây dựng bộ UI Component dùng chung (`Card`, `Badge`, `Button`, `StatCard`, `Modal`) ngay từ Sprint 2.<br>- Áp dụng ước lượng 3 điểm PERT đã tính ở `PM-02`. | - Phân tách thẻ lớn thành 2 thẻ nhỏ (ví dụ tách `FE-04A` Lịch thi và `FE-04B` Chấm điểm; `FE-05A` Lớp học và `FE-05B` Ghi danh) để chia tải thực hiện. | **Minh Tâm**<br>*(Frontend Lead)* |
| **RSK-09**<br>*(Trùng lịch thi PTIT)* | **Mitigate**<br>(Giảm thiểu) | Thành viên thông báo có lịch thi hoặc bảo vệ môn học khác trùng vào tuần cao điểm của Sprint. | - Lập bảng lịch bận cá nhân của cả 3 thành viên ngay đầu mỗi Sprint Planning.<br>- Chủ động đẩy sớm tiến độ (Front-loading) các task quan trọng vào đầu tuần. | - Điều phối lại thẻ việc trên Trello: Thành viên đang rảnh hơn sẽ nhận hỗ trợ review/test hoặc code phụ phần giao diện/tài liệu. | **phong phạm** & **Cả nhóm** |
| **RSK-10**<br>*(Knowledge Silo)* | **Mitigate**<br>(Giảm thiểu) | Một thành viên gặp vướng mắc khi cần chỉnh sửa phần code hoặc tài liệu do thành viên khác viết. | - Viết tài liệu đặc tả Swagger OpenAPI (`/api/docs`) và chú thích TypeScript Interface đầy đủ.<br>- Thực hiện Code Review chéo giữa 3 thành viên. | - Tổ chức phiên Pair Programming ngắn (30 phút) qua màn hình chia sẻ Discord để chuyển giao logic ngay lập tức. | **Minh Tâm** & **Long Phạm** |
| **RSK-11**<br>*(Sự cố Cloud / SMTP)* | **Accept**<br>(Chấp nhận chủ động) | Kết nối tới Supabase Cloud bị chập chờn hoặc email OTP về hộp thư chậm quá 60 giây. | - Thiết lập cơ chế Retry kết nối DB tự động và fallback hiển thị mã OTP trong Console Log ở môi trường Development/Demo. | - Chuyển đổi tức thời chuỗi kết nối `DATABASE_URL` trong `.env` sang PostgreSQL Local Docker dự phòng khi thuyết trình nếu mạng hội trường yếu. | **Long Phạm**<br>*(QA Lead)* |
| **RSK-12**<br>*(Phản biện Hội đồng)* | **Accept**<br>(Chấp nhận chủ động) | Giảng viên đặt câu hỏi xoáy sâu vào tính liên kết giữa tài liệu PMBOK và sản phẩm phần mềm thực tế. | - Đồng bộ hóa 100% số liệu giữa các tài liệu (`CHARTER-01`, `PM-01`..`05`, `SRS-01`) và mã nguồn thực tế.<br>- Chuẩn bị sẵn bộ tài khoản mẫu cho 4 vai trò. | - Sử dụng bộ kịch bản hỏi đáp phản biện đã chuẩn bị trong `[DEMO-01]` và mở trực tiếp màn hình Swagger + Web App để chứng minh trực quan. | **Cả nhóm**<br>*(Nhóm 8)* |

---

## 6. PHÂN TÍCH ĐỊNH LƯỢNG EMV & TÍNH TOÁN QUỸ DỰ PHÒNG (CONTINGENCY & MANAGEMENT RESERVES)

Để liên kết chặt chẽ giữa **Kế hoạch Quản lý Rủi ro (`PM-03`)** và **Dự toán Ngân sách (`PM-02`)**, nhóm áp dụng phương pháp **Phân tích Giá trị Kỳ vọng (Expected Monetary / Effort Value - EMV)** nhằm định lượng chính xác quy mô quỹ dự phòng.

### 6.1. Công thức Toán học EMV (Expected Monetary Value)

Đối với mỗi rủi ro đã nhận diện $i$, giá trị tổn thất kỳ vọng được tính bằng tích số giữa xác suất xảy ra thực tế ($P_i\%$) và mức độ thiệt hại quy đổi ra giờ công hoặc chi phí khắc phục ($I_i$):

$$\text{EMV}_i = P_i (\%) \times I_i (\text{Giờ công hoặc VNĐ})$$

$$\text{Tổng Quỹ Dự phòng Rủi ro (Contingency Reserve)} = \sum_{i=1}^{12} \text{EMV}_i$$

### 6.2. Bảng Tính Toán Định lượng EMV cho 12 Rủi ro Dự án

*(Đơn giá giờ công định mức tham chiếu từ `PM-02`: **$60,000 \text{ VNĐ / giờ}$**)*

| Mã Rủi ro | Tên Rủi ro Tóm tắt | Xác suất Định lượng ($P_i\%$) | Tổn thất Nếu Xảy ra ($I_i$ - Giờ công) | Tổn thất Quy đổi Tiền ($I_i$ - VNĐ) | EMV Nỗ lực ($P_i \times I_i$ Giờ) | EMV Tài chính ($P_i \times I_i$ VNĐ) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **RSK-01** | Xung đột ghép nhánh mã nguồn Full-stack | $35\%$ | 20.0 giờ | 1,200,000 VNĐ | **7.00 giờ** | **420,000 VNĐ** |
| **RSK-02** | Trễ tiến độ đường găng do khối lượng lớn | $40\%$ | 30.0 giờ | 1,800,000 VNĐ | **12.00 giờ** | **720,000 VNĐ** |
| **RSK-03** | Lỗi Race Condition lịch thi & sĩ số lớp | $50\%$ | 28.0 giờ | 1,680,000 VNĐ | **14.00 giờ** | **840,000 VNĐ** |
| **RSK-04** | Phình to phạm vi yêu cầu (Scope Creep) | $20\%$ | 15.0 giờ | 900,000 VNĐ | **3.00 giờ** | **180,000 VNĐ** |
| **RSK-05** | Sự cố mất dữ liệu local / lỗi Schema SQL | $15\%$ | 30.0 giờ | 1,800,000 VNĐ | **4.50 giờ** | **270,000 VNĐ** |
| **RSK-06** | Nghẽn hiệu năng API Báo cáo & DB Pool | $35\%$ | 16.0 giờ | 960,000 VNĐ | **5.60 giờ** | **336,000 VNĐ** |
| **RSK-07** | Lỗ hổng phân quyền RBAC & lộ SĐT Lead | $25\%$ | 18.0 giờ | 1,080,000 VNĐ | **4.50 giờ** | **270,000 VNĐ** |
| **RSK-08** | Sai lệch ước lượng độ phức tạp UI Kanban/PDF| $40\%$ | 20.0 giờ | 1,200,000 VNĐ | **8.00 giờ** | **480,000 VNĐ** |
| **RSK-09** | Giao thoa lịch thi học kỳ tại Học viện PTIT | $40\%$ | 22.0 giờ | 1,320,000 VNĐ | **8.80 giờ** | **528,000 VNĐ** |
| **RSK-10** | Phụ thuộc kiến thức cục bộ (Knowledge Silo) | $20\%$ | 14.0 giờ | 840,000 VNĐ | **2.80 giờ** | **168,000 VNĐ** |
| **RSK-11** | Gián đoạn kết nối Supabase Cloud / SMTP | $20\%$ | 12.0 giờ | 720,000 VNĐ | **2.40 giờ** | **144,000 VNĐ** |
| **RSK-12** | Phát sinh yêu cầu kiểm nghiệm từ Hội đồng | $20\%$ | 12.0 giờ | 720,000 VNĐ | **2.40 giờ** | **144,000 VNĐ** |
| **TỔNG** | **TỔNG GIÁ TRỊ KỲ VỌNG RỦI RO ($\sum \text{EMV}$)** | — | **237.0 giờ** | **14,220,000 VNĐ** | **75.00 giờ** | **4,500,000 VNĐ** |

---

### 6.3. Cơ cấu Quỹ Dự phòng Khẩn cấp (Contingency Reserve vs. Management Reserve)

Kết quả định lượng EMV ở Bảng 6.2 khớp tuyệt đối với bảng dự toán ngân sách cơ sở tại tài liệu **`PM-02`**:

| Loại Quỹ Dự phòng | Đối tượng Rủi ro Mục tiêu | Quy mô Giờ công | Quy mô Ngân sách Định mức | Tỷ lệ trên Chi phí Trực tiếp | Thẩm quyền Phê duyệt Sử dụng |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **1. Quỹ Dự phòng Rủi ro Kỹ thuật**<br>*(Contingency Reserve)* | Xử lý **Known-Unknowns** (12 rủi ro đã nhận diện từ `RSK-01` đến `RSK-12` trong bảng Risk Register). | **75.0 giờ công**<br>*(25 giờ/thành viên)* | **4,500,000 VNĐ** | **12.5%**<br>*(Tính trong Cost Baseline)* | **Project Manager**<br>(`phong phạm` chủ động kích hoạt khi Trigger xuất hiện). |
| **2. Quỹ Dự phòng Quản trị**<br>*(Management Reserve)* | Xử lý **Unknown-Unknowns** (Các sự cố bất khả kháng chưa từng được dự báo trước). | **33.3 giờ công**<br>*(~11 giờ/thành viên)*| **2,000,000 VNĐ** | **5.0%**<br>*(Nằm ngoài Cost Baseline)* | **Project Sponsor / Hội đồng**<br>(Cần phê duyệt chính thức trước khi bổ sung vào Baseline). |
| **TỔNG QUỸ DỰ PHÒNG DỰ ÁN** | **Toàn bộ rủi ro trong & ngoài dự kiến** | **108.3 giờ công** | **6,500,000 VNĐ** | **17.5%** | |

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│            CƠ CẤU PHÂN BỔ QUỸ DỰ PHÒNG RỦI RO THEO 4 SPRINT (75 GIỜ / 4.5M VNĐ)        │
├────────────────────┬────────────────────┬─────────────────────────┬────────────────────┤
│ SPRINT 1 (Tuần 1-2)│ SPRINT 2 (Tuần 3-4)│ SPRINT 3 (Tuần 5-6)     │ SPRINT 4 (Tuần 7-8)│
│ Dự phòng: 10.0 giờ │ Dự phòng: 18.0 giờ │ Dự phòng: 32.0 giờ      │ Dự phòng: 15.0 giờ │
│ (600,000 VNĐ)      │ (1,080,000 VNĐ)    │ (1,920,000 VNĐ - Đỉnh)  │ (900,000 VNĐ)      │
├────────────────────┼────────────────────┼─────────────────────────┼────────────────────┤
│ Rủi ro trọng tâm:  │ Rủi ro trọng tâm:  │ Rủi ro trọng tâm:       │ Rủi ro trọng tâm:  │
│ RSK-04 (Phạm vi)   │ RSK-05 (Schema DB) │ RSK-01 (Merge Conflict) │ RSK-06 (Hiệu năng) │
│ RSK-10 (Tri thức)  │ RSK-07 (Auth RBAC) │ RSK-03 (ACID Lock)      │ RSK-11, RSK-12     │
│                    │                    │ RSK-08, RSK-09 (Lịch thi│ (Demo & Nghiệm thu)│
└────────────────────┴────────────────────┴─────────────────────────┴────────────────────┘
```

---

## 7. NHẬT KÝ GIÁM SÁT & KIỂM SOÁT RỦI RO THỰC TẾ (LIVE RISK AUDIT LOG)

Trong quá trình thực thi từ Sprint 1 đến Sprint 3, đội ngũ Nhóm 8 đã giám sát chặt chẽ bảng Risk Register và ghi nhận kết quả kích hoạt/xử lý thành công các rủi ro thực tế như sau:

| Thời điểm | Mã Rủi ro Kích hoạt | Sự kiện Thực tế Xảy ra trong Dự án | Hành động Ứng phó Đã Thực thi | Kết quả Nghiệm thu |
| :---: | :---: | :--- | :--- | :---: |
| **Sprint 2**<br>*(Tuần 4)* | **RSK-03**<br>*(Xung đột lịch & sĩ số)* | Khi kiểm thử đặt lịch Placement Test và xếp lớp học viên, phát hiện nguy cơ trùng ca thi của giáo viên và vượt sĩ số tối đa. | Đã cài đặt Transaction Lock (`SELECT FOR UPDATE`) và kiểm tra ràng buộc sức chứa trong `placement-test.service.ts` & `enrollment.service.ts`; xây dựng component `ShiftCapacityAlert.tsx`. | ✅ **Đã triệt tiêu 100%** (8/8 test cases tự động đạt Pass). |
| **Sprint 3**<br>*(Tuần 6)* | **RSK-08**<br>*(Độ phức tạp UI)* | Khối lượng giao diện Quản lý Lớp học và Báo cáo khá lớn nếu gộp chung vào 1 task đơn lẻ. | Đã chủ động tách nhỏ thẻ việc thành `FE-04A`/`FE-04B` và `FE-05A`/`FE-05B`, phân bổ song song cho các thành viên. | ✅ **Đúng hạn 100%** (Không bị lố giờ Sprint). |
| **Sprint 3**<br>*(Tuần 6)* | **RSK-01**<br>*(Merge Conflict)* | Khi đồng bộ nhánh `feat/fe-06-dashboard-reporting` và `feat/fe-05b` với `main`, xuất hiện xung đột tại `AppRoutes.tsx` và `backend/src/routes/index.ts`. | Đã thực hiện quy trình merge chuẩn mực, hợp nhất đầy đủ các route (`ClassesPage`, `StaffPage`, `ReportsPage`, `/api/staff`, `/api/analytics`) và kiểm tra `npm run build` đạt 0 lỗi. | ✅ **Đã giải quyết sạch sẽ** (PR #23, #24, #25 đã gộp vào `main`). |

---

## 8. KẾT LUẬN & PHÊ DUYỆT (DOCUMENT SIGNOFF)

Bản **Kế hoạch Quản lý Rủi ro & Bảng Nhật ký Risk Register (`PM-03`)** đã được thiết lập đầy đủ, khoa học theo đúng chuẩn mực của **PMBOK® Guide – 7th Edition (Uncertainty Performance Domain)**. Toàn bộ 12 rủi ro cốt lõi thuộc 4 nhóm RBS đã có phương án phòng ngừa, kịch bản kích hoạt và quỹ dự phòng EMV định lượng rõ ràng, đảm bảo dự án **EduFlow CRM** về đích an toàn, đúng tiến độ và đạt chất lượng cao nhất.

| ĐẠI DIỆN PHÂN TÍCH & ĐẢM BẢO CHẤT LƯỢNG (SA / QA LEAD) | ĐẠI DIỆN QUẢN TRỊ DỰ ÁN (PROJECT MANAGER) |
| :---: | :---: |
| *(Đã ký duyệt)* | *(Đã ký duyệt)* |
| **Long Phạm** (`@longphm11`) | **phong phạm** (`@phongphm2`) |
| Ngày phê duyệt: 14/10/2026 | Ngày phê duyệt: 14/10/2026 |
