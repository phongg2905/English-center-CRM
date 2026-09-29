# ĐẶC TẢ YÊU CẦU PHẦN MỀM: YÊU CẦU CHỨC NĂNG (FR) VÀ PHI CHỨC NĂNG (NFR)
## DỰ ÁN: PHẦN MỀM CRM QUẢN LÝ TUYỂN SINH VÀ ĐÀO TẠO TRUNG TÂM ANH NGỮ (ENGLISH CENTER CRM)

---

| **Mã công việc** | **SRS-01** |
| :--- | :--- |
| **Tên tài liệu** | Lập bảng danh mục Yêu cầu chức năng (FR) và Phi chức năng (NFR) |
| **Dự án** | Quản lý dự án phần mềm - Nhóm 8 |
| **Người thực hiện** | **Long Phạm** (`@longphm11`) - System Analyst (SA) / QA Lead |
| **Người nghiệm thu** | **phong phạm** (`@phongphm2`) - Project Leader |
| **Ngày hoàn thành** | 29/09/2026 |
| **Trạng thái** | **Hoàn thành (Review & Deliverable Ready)** |
| **Tiêu chuẩn tham chiếu** | IEEE 830-1998 (Software Requirements Specifications) & MoSCoW Prioritization |

---

## 1. TỔNG QUAN & NGUYÊN TẮC XẾP HẠNG YÊU CẦU

Tài liệu này chuẩn hóa toàn bộ các **Yêu cầu chức năng (Functional Requirements - FR)** và **Yêu cầu phi chức năng (Non-Functional Requirements - NFR)** cho sản phẩm Web Application CRM của Trung tâm Anh ngữ.

### Định nghĩa mức độ ưu tiên theo chuẩn MoSCoW:
* **M (Must have - Bắt buộc):** Các yêu cầu cốt lõi bắt buộc phải có để hệ thống vận hành tối thiểu (Core MVP). Thiếu các chức năng này dự án bị coi là thất bại.
* **S (Should have - Nên có):** Các yêu cầu nghiệp vụ quan trọng, mang lại giá trị cao nhưng có thể hoàn thiện ở các Sprint sau nếu thời gian eo hẹp.
* **C (Could have - Có thể có):** Các tiện ích nâng cao trải nghiệm người dùng, chỉ thực hiện khi còn dư dả tài nguyên.
* **W (Won't have - Ngoài phạm vi):** Các tính năng đã được thống nhất nằm ngoài phạm vi đồ án (Scope Out) để tránh phình to phạm vi (Scope Creep).

---

## 2. MA TRẬN PHÂN QUYỀN TRUY CẬP (ROLE-PERMISSION MATRIX)

Hệ thống phục vụ 3 nhóm đối tượng người dùng chính (Actors):
1. **Sales / Consultant (Tư vấn viên):** Trực tiếp tiếp nhận, chăm sóc lead, đặt lịch test và chốt ghi danh.
2. **Academic Staff (Giáo vụ):** Quản lý ca thi, nhập kết quả test, quản lý khóa học, tạo lớp học và duyệt xếp lớp.
3. **Admin / Manager (Quản lý trung tâm):** Toàn quyền quản trị tài khoản, cấu hình hệ thống và xem toàn bộ Dashboard báo cáo tài chính/KPI.

| Phân hệ chức năng | Tư vấn viên (Sales) | Giáo vụ (Academic) | Quản lý (Admin) |
| :--- | :---: | :---: | :---: |
| **Xác thực & Tài khoản cá nhân** | Đăng nhập, Đổi MK | Đăng nhập, Đổi MK | Toàn quyền tạo/khóa TK |
| **Quản trị Lead & Pipeline** | Toàn quyền tạo, sửa, đổi trạng thái | Chỉ xem (Read-only) | Toàn quyền kiểm soát |
| **Nhật ký tư vấn (Interaction Log)** | Tạo & Xem log do mình phụ trách | Không xem | Xem toàn bộ log của các Sales |
| **Đặt lịch Placement Test** | Đặt lịch cho Lead | Xem lịch, duyệt phòng thi | Xem toàn bộ |
| **Nhập điểm & Đánh giá năng lực** | Chỉ xem kết quả | Toàn quyền chấm & nhập điểm | Xem & Điều chỉnh nếu cần |
| **Quản lý Khóa học & Lớp học** | Xem thông tin lớp & sĩ số | Toàn quyền thêm, sửa, gán GV | Toàn quyền |
| **Xếp lớp & Ghi danh (Enrollment)** | Đề xuất xếp lớp, ghi nhận phí | Xác nhận sĩ số, gán lớp | Toàn quyền can thiệp |
| **Báo cáo & Dashboard** | Dashboard cá nhân (KPI riêng) | Báo cáo sĩ số các lớp | Toàn quyền xem Dashboard tổng |

---

## 3. DANH MỤC YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS - FR)

### 3.1. Phân hệ 1: Xác thực & Quản trị Hệ thống (Authentication & RBAC)

| Mã FR | Tên chức năng | Mô tả chi tiết yêu cầu | Actor | Ưu tiên |
| :---: | :--- | :--- | :---: | :---: |
| **FR-AUTH-01** | Đăng nhập hệ thống | Người dùng đăng nhập bằng Email và Mật khẩu. Hệ thống xác thực và cấp mã JWT Token phiên làm việc. | Tất cả | **Must** |
| **FR-AUTH-02** | Đăng xuất hệ thống | Người dùng bấm Đăng xuất; hệ thống hủy Token và xóa phiên làm việc trên trình duyệt. | Tất cả | **Must** |
| **FR-AUTH-03** | Phân quyền vai trò (RBAC) | Kiểm soát quyền truy cập API và giao diện Web dựa trên 3 vai trò: Sales, Academic Staff, Admin. Chặn truy cập trái quyền (403 Forbidden). | Hệ thống | **Must** |
| **FR-AUTH-04** | Đổi mật khẩu cá nhân | Cho phép người dùng tự đổi mật khẩu sau khi nhập đúng mật khẩu hiện tại và mật khẩu mới đạt chuẩn bảo mật (tối thiểu 8 ký tự). | Tất cả | **Should** |
| **FR-AUTH-05** | Quản lý tài khoản nhân sự | Quản lý (Admin) có quyền tạo tài khoản mới cho nhân viên, gán vai trò tương ứng, kích hoạt hoặc khóa tài khoản khi nhân viên nghỉ việc. | Admin | **Must** |

---

### 3.2. Phân hệ 2: Quản lý Phễu Khách hàng tiềm năng (Lead Management)

| Mã FR | Tên chức năng | Mô tả chi tiết yêu cầu | Actor | Ưu tiên |
| :---: | :--- | :--- | :---: | :---: |
| **FR-LEAD-01** | Tạo mới Lead thủ công | Tư vấn viên nhập thông tin Lead: Họ tên, Số điện thoại, Email, Nhu cầu học (IELTS/Giao tiếp/TOEIC), Kênh tiếp cận (FB Ads/Web/Hotline/Vãng lai/Giới thiệu). | Sales, Admin | **Must** |
| **FR-LEAD-02** | Kiểm tra trùng lặp tự động (Deduplication) | Hệ thống tự động quét trùng Số điện thoại hoặc Email khi tạo Lead. Nếu đã tồn tại, cảnh báo màn hình và dẫn tới hồ sơ Lead cũ, ngăn chặn việc tạo trùng dữ liệu. | Hệ thống | **Must** |
| **FR-LEAD-03** | Phân bổ Lead cho Tư vấn viên | Admin hoặc Sales Leader có thể phân bổ danh sách Lead mới cho từng Tư vấn viên phụ trách; hoặc hệ thống gán mặc định cho người tạo. | Admin, Sales | **Must** |
| **FR-LEAD-04** | Quản lý Pipeline dạng Kanban | Hiển thị Lead dưới dạng các cột Kanban theo 5 trạng thái vòng đời: <br>1. *Mới* (New) $\rightarrow$ 2. *Đang liên hệ* (Contacting) $\rightarrow$ 3. *Đã hẹn test* (Test Scheduled) $\rightarrow$ 4. *Đã chốt* (Won/Enrolled) $\rightarrow$ 5. *Hủy/Không tiềm năng* (Lost). <br>Cho phép kéo-thả Lead giữa các cột. | Sales, Admin | **Must** |
| **FR-LEAD-05** | Ghi nhận nhật ký tương tác (Interaction Log) | Tư vấn viên ghi lại lịch sử mỗi lần liên hệ: Ngày giờ gọi, Hình thức (Gọi điện/Nhắn tin/Gặp trực tiếp), Mức độ tiềm năng (Nóng/Ấm/Lạnh), Tóm tắt nội dung trao đổi, Lịch hẹn gọi lại tiếp theo. | Sales, Admin | **Must** |
| **FR-LEAD-06** | Tìm kiếm & Bộ lọc Lead | Tìm kiếm Lead theo Tên, Số điện thoại. Bộ lọc đa tiêu chí theo: Trạng thái Pipeline, Nguồn kênh tiếp cận, Tư vấn viên phụ trách, Khoảng thời gian tiếp nhận. | Sales, Admin | **Should** |
| **FR-LEAD-07** | Cập nhật lý do thất bại (Lost Reason) | Khi kéo Lead sang trạng thái "Hủy", hệ thống bắt buộc chọn lý do: *Học phí cao*, *Không phù hợp lịch*, *Khoảng cách xa*, *Đã học nơi khác*, *Sai số điện thoại*. | Sales | **Should** |

---

### 3.3. Phân hệ 3: Lịch hẹn & Kết quả Đánh giá trình độ (Placement Test Management)

| Mã FR | Tên chức năng | Mô tả chi tiết yêu cầu | Actor | Ưu tiên |
| :---: | :--- | :--- | :---: | :---: |
| **FR-TEST-01** | Đặt lịch hẹn Placement Test | Tư vấn viên tạo lịch hẹn test cho Lead: Chọn Ngày thi, Khung giờ/Ca thi, Loại bài thi (IELTS / TOEIC / Tiếng Anh giao tiếp). Trạng thái Lead tự động chuyển sang "Đã hẹn test". | Sales | **Must** |
| **FR-TEST-02** | Quản lý Lịch thi & Phòng thi | Giáo vụ theo dõi danh sách các ca thi theo ngày/tuần, số lượng thí sinh đăng ký trong mỗi ca, kiểm tra khả năng đáp ứng của phòng thi. | Giáo vụ, Admin | **Must** |
| **FR-TEST-03** | Cập nhật trạng thái tham dự | Giáo vụ cập nhật tình trạng thi của thí sinh: *Chưa đến*, *Đã có mặt*, *Vắng mặt/Hủy lịch*. | Giáo vụ | **Must** |
| **FR-TEST-04** | Nhập kết quả bài Placement Test | Giáo vụ/Giáo viên nhập điểm chi tiết: <br>- Kỹ năng Listening, Reading, Writing, Speaking.<br>- Tổng điểm (Overall Band Score).<br>- Nhận xét ưu/nhược điểm và trình độ tương đương (ví dụ: CEFR B1, IELTS 4.5). | Giáo vụ | **Must** |
| **FR-TEST-05** | Tự động gợi ý khóa học phù hợp | Căn cứ vào điểm Overall đầu vào và mục tiêu của học viên, hệ thống tự động đưa ra danh sách các Khóa học và Lớp học mở phù hợp nhất để Tư vấn viên sử dụng tư vấn tiếp. | Hệ thống | **Should** |
| **FR-TEST-06** | Xuất/In phiếu kết quả thi đầu vào | Hệ thống hỗ trợ xuất phiếu kết quả đánh giá năng lực dạng PDF hoặc in trực tiếp có logo trung tâm để gửi cho phụ huynh/học viên. | Sales, Giáo vụ | **Could** |

---

### 3.4. Phân hệ 4: Khóa học, Lớp học & Xếp lớp Ghi danh (Course, Class & Enrollment)

| Mã FR | Tên chức năng | Mô tả chi tiết yêu cầu | Actor | Ưu tiên |
| :---: | :--- | :--- | :---: | :---: |
| **FR-CLASS-01** | Quản lý danh mục Khóa học | Giáo vụ tạo và chỉnh sửa thông tin Khóa học: Mã khóa, Tên khóa (vd: IELTS Foundation, IELTS Fighter), Tổng số buổi, Học phí chuẩn, Trình độ đầu vào yêu cầu, Mục tiêu đầu ra. | Giáo vụ, Admin | **Must** |
| **FR-CLASS-02** | Quản lý Lớp học mở mới | Giáo vụ thiết lập Lớp học: Tên lớp, Khóa học trực thuộc, Lịch học trong tuần (2-4-6 hoặc 3-5-7), Khung giờ học, Phòng học, Giáo viên phụ trách, Ngày khai giảng dự kiến, Sĩ số tối đa (Max Capacity). | Giáo vụ, Admin | **Must** |
| **FR-CLASS-03** | Giám sát sĩ số lớp thời gian thực | Hệ thống hiển thị số lượng học viên thực tế đã ghi danh trên tổng sĩ số tối đa (ví dụ: `12/15`). Tự động cảnh báo khi lớp sắp đầy và tự động khóa ghi danh khi đạt sĩ số tối đa. | Tất cả | **Must** |
| **FR-CLASS-04** | Xếp lớp & Chuyển đổi thành Học viên chính thức | Tư vấn viên/Giáo vụ thực hiện thao tác gán Lead vào lớp học mong muốn: <br>- Hệ thống tạo bản ghi Học viên chính thức (Student Profile) với Mã học viên duy nhất.<br>- Trạng thái Lead được chuyển sang "Đã chốt (Enrolled)". | Sales, Giáo vụ | **Must** |
| **FR-CLASS-05** | Ghi nhận thanh toán học phí thủ công | Ghi nhận giao dịch học phí: Số tiền nộp, Hình thức thanh toán (Tiền mặt / Chuyển khoản), Mã tham chiếu giao dịch ngân hàng, Ngày nộp, Tư vấn viên hưởng hoa hồng. Cập nhật trạng thái "Đã hoàn thành học phí" hoặc "Nộp một phần". | Sales, Admin | **Must** |
| **FR-CLASS-06** | Quản lý Danh sách học viên của lớp | Giáo vụ và Giáo viên xem danh sách học viên chính thức trong từng lớp, thông tin liên hệ khẩn cấp của phụ huynh. | Giáo vụ, Admin | **Should** |
| **FR-CLASS-07** | Hỗ trợ chuyển lớp (Class Transfer) | Cho phép chuyển học viên từ lớp này sang lớp khác nếu phát sinh xung đột lịch học của học viên; hệ thống tự động giải phóng sĩ số ở lớp cũ và tăng sĩ số ở lớp mới. | Giáo vụ, Admin | **Could** |

---

### 3.5. Phân hệ 5: Báo cáo Thống kê & Dashboard Tổng quan (Dashboard & Analytics)

| Mã FR | Tên chức năng | Mô tả chi tiết yêu cầu | Actor | Ưu tiên |
| :---: | :--- | :--- | :---: | :---: |
| **FR-DASH-01** | Báo cáo Phễu chuyển đổi tuyển sinh | Dashboard trực quan hóa tỷ lệ chuyển đổi qua các giai đoạn: Tổng số Lead $\rightarrow$ Số Lead đã hẹn test $\rightarrow$ Số Lead đã thi $\rightarrow$ Số Lead đã chốt học phí (Conversion Rate %). | Admin, Sales | **Must** |
| **FR-DASH-02** | Báo cáo Doanh số & Hiệu suất Tư vấn viên | Bảng xếp hạng doanh số thực thu và số học viên chốt được trong tháng theo từng Tư vấn viên, hỗ trợ tính KPI và hoa hồng. | Admin | **Must** |
| **FR-DASH-03** | Thống kê Tỷ lệ lấp đầy sĩ số lớp học | Báo cáo thống kê phần trăm lấp đầy phòng học/lớp học của các lớp sắp khai giảng, giúp Giáo vụ quyết định chốt ngày mở lớp hoặc dồn lớp. | Admin, Giáo vụ | **Should** |
| **FR-DASH-04** | Thống kê Hiệu quả Kênh Marketing | Biểu đồ phân tích nguồn Lead (Facebook Ads, Google, Website, Khách vãng lai, Giới thiệu) mang lại số lượng lead và tỷ lệ chốt cao nhất. | Admin | **Should** |
| **FR-DASH-05** | Xuất báo cáo dữ liệu (Export Excel/CSV) | Cho phép Quản lý (Admin) xuất dữ liệu danh sách học viên, báo cáo doanh thu ra file Excel để lưu trữ hoặc gửi Ban Giám đốc. | Admin | **Could** |

---

### 3.6. Các tính năng NẰM NGOÀI PHẠM VI (Scope Out / Won't Have)

| Mã FR | Tên tính năng loại trừ | Lý do loại trừ khỏi phạm vi đồ án |
| :---: | :--- | :--- |
| **FR-WONT-01** | Cổng thanh toán trực tuyến tự động (VNPay/Momo/ZaloPay) | Phức tạp trong thủ tục tích hợp pháp lý ngân hàng; chỉ ghi nhận ủy nhiệm chi và xác nhận nộp tiền thủ công. |
| **FR-WONT-02** | Hệ thống học tập trực tuyến (LMS / E-Learning) | Phần mềm tập trung giải quyết bài toán Tuyển sinh và Quản lý đào tạo (CRM), không kiêm nhiệm việc nộp/chấm bài tập về nhà online. |
| **FR-WONT-03** | Tích hợp Tổng đài ảo VoIP tự động bấm gọi trên Web | Chi phí duy trì đầu số tổng đài tốn kém; nhân viên thực hiện gọi điện thoại bàn/di động ngoài và ghi log thủ công vào CRM. |

---

## 4. DANH MỤC YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)

Bộ yêu cầu phi chức năng được xây dựng dựa trên tiêu chuẩn chất lượng phần mềm quốc tế **ISO/IEC 25010**:

### 4.1. Hiệu năng & Khả năng đáp ứng (Performance & Efficiency - `NFR-PERF`)
* **NFR-PERF-01 (Thời gian phản hồi API):** Các thao tác tra cứu, kéo thả Kanban, thêm mới Lead phải có thời gian phản hồi máy chủ $\le 1.0$ giây trong điều kiện mạng bình thường.
* **NFR-PERF-02 (Tải trang Web):** Thời gian tải trang ban đầu (First Contentful Paint) trên trình duyệt không vượt quá 2.5 giây.
* **NFR-PERF-03 (Khả năng chịu tải):** Hệ thống đáp ứng hoạt động ổn định đồng thời cho tối thiểu **50 người dùng nội bộ** truy cập cùng lúc mà không xảy ra hiện tượng nghẽn hoặc sập ứng dụng.

### 4.2. Bảo mật & An toàn dữ liệu (Security & Privacy - `NFR-SEC`)
* **NFR-SEC-01 (Mã hóa mật khẩu):** Mật khẩu người dùng trong CSDL bắt buộc phải được băm bằng thuật toán an toàn một chiều (ví dụ: `bcrypt` với cost factor $\ge 10$), tuyệt đối không lưu plaintext.
* **NFR-SEC-02 (Cơ chế Token JWT):** Phiên làm việc sử dụng JSON Web Token có thời hạn hợp lệ (Access Token hết hạn sau 8 tiếng hoặc 1 ngày), tự động đăng xuất khi hết hạn.
* **NFR-SEC-03 (Bảo vệ dữ liệu khách hàng):** Tư vấn viên chỉ xem được số điện thoại đầy đủ của các Lead do chính mình phụ trách; các Lead chưa phân bổ hoặc thuộc người khác sẽ được làm mờ 3 số cuối (ví dụ: `0987***321`) để phòng ngừa rò rỉ tệp data.
* **NFR-SEC-04 (Chống tấn công phổ biến):** Backend áp dụng cơ chế chống SQL Injection (sử dụng ORM/Parameterized queries) và làm sạch dữ liệu đầu vào chống tấn công XSS (Cross-Site Scripting).

### 4.3. Độ khả dụng & Trải nghiệm người dùng (Usability & UX - `NFR-USE`)
* **NFR-USE-01 (Giao diện trực quan):** Hệ thống xây dựng trên layout Admin hiện đại; các nghiệp vụ trọng tâm (kéo trạng thái Lead, đặt lịch test, xếp lớp) được thực hiện không quá 3 bước nhấp chuột (3-click rule).
* **NFR-USE-02 (Tương thích thiết bị):** Giao diện Web được thiết kế tối ưu Responsive cho màn hình máy tính để bàn và Laptop (từ độ phân giải tiêu chuẩn $1366 \times 768$ đến $1920 \times 1080$), tương thích tốt trên các trình duyệt phổ biến: Chrome, Edge, Safari, Firefox.
* **NFR-USE-03 (Thông báo & Cảnh báo người dùng):** Mọi hành động thao tác (thêm mới, chỉnh sửa, xóa, báo lỗi kết nối) đều có thông báo Toast message trực quan hiển thị trong vòng 3 giây.

### 4.4. Tính tin cậy & Toàn vẹn dữ liệu (Reliability & Data Integrity - `NFR-REL`)
* **NFR-REL-01 (Ràng buộc toàn vẹn CSDL):** Thiết lập chặt chẽ các khóa ngoại (Foreign Keys) và ràng buộc Unique (Số điện thoại, Email, Mã học viên, Mã lớp) để ngăn chặn dữ liệu "rác" hoặc xung đột logic.
* **NFR-REL-02 (Giao dịch ACID khi xếp lớp):** Quá trình đăng ký xếp lớp và cập nhật sĩ số bắt buộc phải được thực thi trong một Database Transaction nhằm loại bỏ hoàn toàn rủi ro **Overbooking** khi 2 tư vấn viên cùng bấm nút ghi danh học viên vào chỗ trống cuối cùng tại cùng một thời điểm.

### 4.5. Khả năng bảo trì & Mở rộng (Maintainability & Scalability - `NFR-MAINT`)
* **NFR-MAINT-01 (Kiến trúc phân tầng):** Source code được tách biệt rõ ràng giữa Frontend (Client SPA) và Backend RESTful API theo kiến trúc phân lớp chuẩn (Controller - Service - Repository/DAO).
* **NFR-MAINT-02 (Tài liệu hóa API):** Toàn bộ API Endpoints được chuẩn hóa tài liệu thông qua công cụ Swagger / OpenAPI để dễ dàng kiểm thử và bàn giao giữa các thành viên.

---

## 5. MA TRẬN TRUY VẾT YÊU CẦU (REQUIREMENTS TRACEABILITY MATRIX - RTM)

Bảng đối chiếu kiểm tra tính toàn vẹn: Đảm bảo 100% các điểm nghẽn thực tế đã khảo sát ở tài liệu `[BA-01]` đều được giải quyết triệt để bằng các yêu cầu chức năng `FR`:

| Điểm nghẽn ở Task `[BA-01]` | Vấn đề thực tế | Yêu cầu Chức năng giải quyết (FR Mapping) |
| :--- | :--- | :--- |
| **PP-01** | Thất thoát & Trùng lặp dữ liệu Lead | `FR-LEAD-01` (Tạo tập trung), `FR-LEAD-02` (Check trùng SĐT/Email), `FR-LEAD-03` (Phân bổ Lead) |
| **PP-02** | Mất dấu lịch sử tương tác chăm sóc | `FR-LEAD-04` (Pipeline Kanban), `FR-LEAD-05` (Interaction Timeline Log) |
| **PP-03** | Xung đột lịch & Rời rạc Placement Test | `FR-TEST-01` (Đặt lịch hẹn), `FR-TEST-02` (Quản lý ca thi), `FR-TEST-04` (Nhập điểm 4 kỹ năng), `FR-TEST-05` (Gợi ý lộ trình) |
| **PP-04** | Xếp lớp thủ công, vượt sĩ số Overbooking | `FR-CLASS-02` (Quản lý lớp), `FR-CLASS-03` (Giám sát sĩ số real-time & tự động khóa), `FR-CLASS-04` (Xếp lớp 1-click), `NFR-REL-02` (Transaction an toàn) |
| **PP-05** | Báo cáo phân tán, chậm trễ, thiếu số liệu | `FR-DASH-01` (Phễu chuyển đổi tuyển sinh), `FR-DASH-02` (Hiệu suất & Doanh số Sales), `FR-DASH-03` (Tỷ lệ lấp đầy sĩ số) |
| **PP-06** | Rủi ro rò rỉ dữ liệu học viên | `FR-AUTH-03` (Phân quyền RBAC), `NFR-SEC-03` (Che số điện thoại khách hàng) |

---

## 6. KẾT LUẬN & BƯỚC TIẾP THEO

Tài liệu `[SRS-01]` đã định nghĩa đầy đủ:
- **26 Yêu cầu chức năng (FR)** thuộc 5 phân hệ cốt lõi.
- **3 Yêu cầu ngoài phạm vi (Scope Out)**.
- **11 Yêu cầu phi chức năng (NFR)** bao quát toàn diện về Hiệu năng, Bảo mật, Trải nghiệm, Toàn vẹn dữ liệu và Kiến trúc.
- **Ma trận truy vết RTM** chứng minh tính gắn kết 100% với phân tích thực trạng nghiệp vụ.

*Đây là cơ sở dữ liệu đầu vào chuẩn xác để thực hiện tiếp Task `[UML-01] Sơ đồ Use Case tổng quan`, `[UML-02] Đặc tả Use Case chi tiết` và `[DB-01] Thiết kế CSDL khái niệm`.*
