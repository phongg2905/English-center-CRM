# TÀI LIỆU ĐẶC TẢ HỆ THỐNG THIẾT KẾ UI/UX & KHO DỮ LIỆU 106 MÃ NGUỒN MỞ
## DỰ ÁN: PHẦN MỀM CRM QUẢN LÝ TUYỂN SINH VÀ ĐÀO TẠO TRUNG TÂM ANH NGỮ (EDUFLOW CRM)

---

| **Mã công việc** | **DES-01** |
| :--- | :--- |
| **Tên tài liệu** | Thiết kế UI/UX Multi-Palette Design System & Nghiên cứu tổng hợp 106 Kho Mã Nguồn Mở |
| **Dự án** | Quản lý dự án phần mềm - Nhóm 8 |
| **Người thực hiện** | **Tam Minh** (`@tamminh6`) - UI/UX Designer / Frontend Lead |
| **Người nghiệm thu** | **phong phạm** (`@phongphm2`) - Project Leader |
| **Ngày lập** | 05/10/2026 (Cập nhật quy chuẩn v3.6) |
| **Phiên bản** | **v3.6 (Clean Enterprise UI, Zero Noise Guidelines & Quicksand Typography)** |
| **Tài liệu căn cứ** | `SRS-01_Yeu_cau_chuc_nang_va_phi_chuc_nang.md`, `UML-01_Actors_va_So_do_Use_Case_tong_quan.md`, `UML-02_Dac_ta_kich_ban_Use_Case_chi_tiet_cho_3_luong_chinh.md` |
| **Sản phẩm bàn giao** | 1. File tài liệu đặc tả Design System này.<br>2. Bản mẫu tương tác sống chạy trên trình duyệt có tích hợp bộ chuyển đổi 9 bảng màu và tìm kiếm 106 repo: `prototype/index.html`. |

---

## 1. NGUYÊN TẮC THIẾT KẾ BẢN SẮC RIÊNG (BESPOKE DESIGN PRINCIPLES)

Nhận định các giao diện mẫu nghiệp dư thường mắc các lỗi cố hữu: lạm dụng emoji (🔥, ⚡, ❄️), nhồi nhét gradient neon chói gắt, phông chữ thô kệch, chắp vá giữa nền sáng và hộp đen lạc quẻ, cùng việc nhồi nhét quá nhiều câu chú thích phụ râu ria làm loãng dữ liệu. 

Phiên bản **v3.6** được nhóm thiết kế thủ công tinh xảo, tiến hành **khảo sát sâu rộng trên 106 dự án mã nguồn mở hàng đầu thế giới** (Twenty CRM, Plane, Radix Colors, Tailwind, GitHub Primer, Mantine, Cal.com, Supabase, Moodle, Canvas LMS...) nhằm định hình **Bản sắc nhận diện riêng biệt cho ngành Giáo dục Quốc tế**:
1. **Tinh giản & Chuyên nghiệp (Minimal & Purposeful):** Loại bỏ hoàn toàn emoji sến sẩm, thay thế bằng các nhãn trạng thái tinh tế (Subtle Status Badges) và chỉ báo vi mô (Micro-dots).
2. **Typography chuẩn mực & thân thiện (Quicksand Font Family):** Chuẩn hóa phông chữ **Quicksand** với nét bo tròn mềm mại, thân thiện, uốn lượn tự nhiên, chuẩn hóa dấu tiếng Việt.
3. **Đa Bảng Màu Động (Multi-Palette Theme Engine):** Cung cấp **9 bảng màu tuyển chọn**, cho phép người dùng hoặc trung tâm đào tạo chuyển đổi linh hoạt theo nhận diện thương hiệu chỉ với 1 cú click chuột.
4. **Bố cục thẻ Academic Certificate:** Phân hệ chấm điểm Placement Test được thiết kế như một **Phiếu báo điểm chuẩn học thuật (Academic Scorecard)** trên nền giấy trắng tinh khôi, viền kép Navy sang trọng.
5. **Kho tra cứu tương tác 106 Repos:** Bản mẫu tích hợp công cụ tìm kiếm và lọc thời gian thực toàn bộ 106 kho mã nguồn mở để đội ngũ lập trình tra cứu mẫu code và token CSS mọi lúc.
6. **Trải nghiệm Nghiệp vụ Thuần khiết (Zero Information Noise & High-Utility UI):** Loại bỏ hoàn toàn các văn bản chú thích râu ria, câu phụ đề rườm rà và các mã kỹ thuật thô (`UC-xx`, `FE-xx`). Mọi không gian trên màn hình đều ưu tiên hiển thị số liệu cốt lõi và công cụ tác nghiệp nhanh cho nhân sự.

---

## 2. HỆ THỐNG THIẾT KẾ CHÍNH THỨC: MANTINE & COSMIC SUNSET GRADIENT (CHỐT ĐỘC QUYỀN)

Sau khi khảo sát và đánh giá 106 kho mã nguồn mở cùng 9 bộ màu thử nghiệm, nhóm dự án đã **quyết định chốt độc quyền phong cách Mantine & Cosmic Sunset** và loại bỏ toàn bộ các màu còn lại để tạo nên bản sắc nhận diện thương hiệu nhất quán, cao cấp và khác biệt hoàn toàn:

### 2.1. Bảng màu phối hợp cốt lõi (Core Color Harmony)
* **🔮 Deep Violet (`#5b21b6`):** Màu tím sâu thẳm tượng trưng cho chiều sâu học thuật, uy tín giáo dục và sự tập trung trí tuệ cao độ (kế thừa từ `mantinedev/mantine`).
* **👑 Royal Purple (`#7c3aed`):** Màu tím hoàng gia rực rỡ dùng làm điểm nhấn tương tác, thẻ chuyển đổi trạng thái và icon điều hành (kế thừa từ `raycast/extensions`).
* **🌅 Neon Sunset Pink (`#ec4899`):** Sắc hồng hoàng hôn rực sáng tạo điểm kết thúc đầy năng lượng, sự trẻ trung và bứt phá của học viên (kế thừa từ `infisical` và `novu`).

### 2.2. Dải chuyển màu Gradient chuẩn (Official Brand Gradient Flow)
* **`--brand-gradient`:** `linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #ec4899 100%)`
* **`--brand-gradient-hover`:** `linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #db2777 100%)`
* **`--brand-gradient-subtle`:** `linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(236, 72, 153, 0.04) 100%)`
* **`--glow-color`:** `rgba(124, 58, 237, 0.38)` (Đổ bóng phát quang tím cho nút bấm và thẻ card)

### 2.3. Màu nền, viền và kiểu chữ tương phản cao
* **Nền trang (`--bg-page`):** `#faf5ff` (Sắc tím lavender cực nhạt, êm dịu, loại bỏ cảm giác trắng bệch khô khan).
* **Nền thẻ / Panel (`--bg-surface`):** `#ffffff` với viền mỏng `#e9d5ff` tạo khối vi mô tinh xảo.
* **Tiêu đề chính (`--text-heading`):** `#2e1065` (Tím đen siêu tương phản chuẩn WCAG AAA).
* **Văn bản nội dung (`--text-body`):** `#4c1d95` (Dịu mắt, phân biệt rõ ràng với chú thích).

### 2.4. Biểu tượng Thương hiệu Chính thức (Official Brand Logo: Edu Cap & Flow)
* **Ý tưởng thiết kế:** Kết hợp giữa hình khối **Mũ Cử Nhân 3D vát cạnh hoàng gia (Edu)** và **Làn Sóng Năng Lượng Tri Thức (Flow)** cuộn mượt mà phía dưới. Biểu trưng cho sự chuẩn mực học thuật quốc tế song hành cùng luồng dữ liệu CRM tự động hóa và phễu tuyển sinh thông suốt.
* **Màu sắc chủ đạo:** Cosmic Sunset Gradient (`#4c1d95` -> `#7c3aed` -> `#ec4899`) với ánh phản quang đa chiều.
* **Định dạng tài nguyên:**
  * Master 4x Retina PNG: `frontend/src/assets/brand/eduflow-logo.png` (1092 x 632)
  * Square Icon 1:1: `frontend/src/assets/brand/eduflow-logo-square.png` (512 x 512)
  * Favicon chuẩn trình duyệt: `frontend/public/favicon.svg` & `frontend/public/favicon.png`
  * React Component dùng chung: `<EduFlowLogo size={...} variant="mark" | "square" showText={...} />`
* **Vị trí áp dụng đồng bộ:** Thanh Sidebar điều hướng, Màn hình đăng nhập/đăng ký, Màn hình tải phiên khởi tạo hệ thống, và Phiếu Báo Điểm A4 Diagnostic Scorecard.

### 2.5. Quy chuẩn Phiếu Báo Điểm Đơn Sắc Học Thuật (Diagnostic Placement Test Scorecard - Design 4: Oxford Ivy League Classic)
* **Ý tưởng thiết kế:** Chuẩn hóa theo trường phái bảng điểm học thuật cổ điển của các viện đại học danh tiếng thế giới (Oxford / Ivy League). Loại bỏ hoàn toàn khung viền bao ngoài rối rắm, sử dụng lề mở trang nhã, kiểu chữ có chân serif tương phản cao cùng các chi tiết dập chìm bảo chứng giá trị học thuật.
* **Bảng màu đơn sắc cốt lõi:**
  * **Nền giấy kem ngà sang trọng (Parchment Ivory):** `#fbf9f4` (Khi in ấn PDF tự động tối ưu phông nền trắng `#ffffff` tiết kiệm mực tối đa).
  * **Màu mực than học thuật:** `#1c1917` / `#111827` (Tương phản cao tuyệt đối chuẩn WCAG AAA cho tiêu đề và nội dung khảo thí).
  * **Đầu bảng màu đá ấm (Warm Stone Gray Header):** `#eae8e1` (Tạo điểm tựa thị giác trang nhã cho ma trận chẩn đoán 4 kỹ năng).
  * **Đường phân cách sắc nét:** Đường kẻ đơn/kép `1.5px solid #292524` và hairline `#d6d3d1`.
* **Cấu trúc hình thái đặc trưng:**
  * **Con dấu chìm Watermark:** Dập chìm góc trên bên phải `University of Excellence • Academic Examination` với độ trong suốt tinh tế.
  * **Thanh thông tin thí sinh 2 cột gạch chân kép:** `Candidate Profile` (Tên thí sinh in hoa) & `ID` (Mã hồ sơ PT).
  * **Ma trận điểm 4 kỹ năng chuẩn CEFR:** Phân định rõ ràng Listening, Reading, Writing, Speaking, điểm số, cấp độ và nhận xét chuyên môn.
  * **Khối tổng kết:** Overall Band Score, cấp độ CEFR và lộ trình khóa học đề xuất.
  * **Chân trang bảo chứng 3 cột:** Chữ ký đôi viết tay nghệ thuật `EduFlow Registrar` và con dấu mộc tròn đen chính thức ở chính giữa.
  * **Chuẩn in ấn A4 1 trang tuyệt đối:** Tự động loại bỏ hoàn toàn các thành phần giao diện nền, bắt đầu ngay đỉnh Trang 1, không tràn trang, không dư trang trắng.

---

## 3. QUY CHUẨN DESIGN TOKENS CHUNG

### 3.1. Phân cấp Kiểu chữ (Typography Scale - Quicksand Font)
* **Font Family:** `'Quicksand', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` (Nét chữ bo tròn mềm mại, thân thiện, uốn lượn tự nhiên, chuẩn hóa dấu tiếng Việt).
* **Monospace Font:** `'JetBrains Mono', Consolas, monospace` (Dùng cho mã học viên, điểm số, mã màu hex).
* **Letter-spacing:** `-0.005em` (Đảm bảo độ thoáng mắt, mượt mà và tròn trịa).
* **Quy chuẩn kích thước:**
  * **H1 / Page Title:** `17px - 18px`, Weight `700`, Letter-spacing `-0.02em`.
  * **H2 / Section Title:** `15px`, Weight `700`.
  * **Card Title / Lead Name:** `13.5px`, Weight `600`.
  * **Body Text:** `13px - 14px`, Weight `400` / `500`, Line-height `1.5`.
  * **Caption / Timestamps / Hint:** `11px` - `12px`, Weight `500`.
  * **Band Score Big Number:** `48px`, Weight `800`.

### 3.2. Quy chuẩn Bo góc (Border Radius) & Khoảng cách (Spacing)
* **Grid Spacing:** Dựa trên hệ số $4	ext{px}$ ($4	ext{px}, 8	ext{px}, 12	ext{px}, 16	ext{px}, 24	ext{px}, 32	ext{px}$).
* **Radius Tokens:**
  * `radius-sm`: $6	ext{px}$ (Dùng cho input, nút nhỏ, badge).
  * `radius-md`: $8	ext{px}$ (Dùng cho thẻ card, menu item, dropdown).
  * `radius-lg`: $12	ext{px}$ (Dùng cho bảng tổng hợp, panel điều hành).
  * `radius-xl`: $16	ext{px}$ (Dùng cho modal dialog popup).
  * `radius-pill`: 9999px (Dùng cho status pills, badge tròn, avatar).

### 3.3. Quy chuẩn Tối giản Thông tin & Chống Rác Giao diện (Zero Information Noise Standards)
Nhằm đảm bảo sản phẩm đạt tiêu chuẩn thương mại cao cấp, đáp ứng tối đa hiệu suất vận hành của đội ngũ tư vấn, học vụ và quản lý, toàn bộ giao diện tuân thủ nghiêm ngặt 4 quy tắc chống rác thông tin:
1. **Cấm hiển thị mã kỹ thuật & nhãn học thuật trên UI:**
   * Cấm tuyệt đối đưa các mã Use Case (`UC-01`, `UC-02`), mã công việc (`FE-01`, `FE-04A`, `BE-04`), nhãn Sprint hay thuật ngữ đồ án vào giao diện người dùng thực tế (tiêu đề trang, thẻ badge, tab bar, modal).
   * Toàn bộ nhãn màn hình phải dùng từ ngữ nghiệp vụ chuẩn mực doanh nghiệp (ví dụ: *Lịch Thi & Khảo Thí Đầu Vào*, *Phễu Tuyển Sinh (Kanban)*, *Phiếu Báo Điểm Học Viên*).
2. **Cấm chèn thành phần thử nghiệm nội bộ vào màn hình nghiệp vụ:**
   * Không đặt các tab "Thư viện component / Playground", khối nút bấm demo tài khoản thử nghiệm trên các màn hình chức năng chính (Dashboard, Login). Mọi màn hình phải là sản phẩm hoàn thiện phục vụ tác nghiệp thực tế.
3. **Loại bỏ triệt để phụ đề giải thích & chú thích râu ria (Zero Filler Microcopy):**
   * Tiêu đề trang (H1) và tiêu đề thẻ (Card Title) phải tự thân truyền đạt ý nghĩa rõ ràng; cấm chèn các dòng phụ đề (`<p>`, `subtitle`) giải thích lại những điều hiển nhiên.
   * Thẻ chỉ số (Stat Cards / KPI) chỉ gồm Icon nhận diện + Tiêu đề ngắn gọn + Con số dữ liệu to rõ ràng; cấm chèn các câu văn chú thích râu ria (`pt-stat-hint`) như *"Trong khoảng thời gian đã chọn"*, *"Chưa điểm danh hoặc đang diễn ra"*, *"Tất cả các ca đều còn chỗ trống"*.
4. **Nội dung Placeholder chuẩn sản phẩm thương mại:**
   * Các màn hình đang phát triển phải sử dụng thông điệp chuẩn mực SaaS (*"Đang phát triển"*, *"Tính năng này đang được đồng bộ dữ liệu và chuẩn bị ra mắt trong phiên bản sắp tới"*); cấm tuyệt đối sử dụng các câu từ mang tính chất đồ án (*"Hệ thống routing đã kích hoạt theo User Story..."*).

---

## 4. BẢNG TỔNG HỢP 106 KHO MÃ NGUỒN MỞ ĐÃ KHẢO SÁT & KẾ THỪA

Dưới đây là danh mục 106 kho mã nguồn mở thực tế đã được khảo sát chi tiết, phân chia thành 6 nhóm nghiệp vụ then chốt:

### Nhóm 1: CRM & Quản lý Quan hệ Khách hàng (18 Dự án)
| STT | Repository | Stars | Mã Màu | Đặc Trưng UI/UX & Đóng Góp Vào EduFlow CRM |
|:---:|:---|:---:|:---:|:---|
| 1 | [twentyhq/twenty](https://github.com/twentyhq/twenty) | 24.5k | `#4f46e5` | CRM số 1 GitHub hiện nay, kiến trúc bảng dữ liệu tối giản, bộ màu Indigo hiện đại. |
| 2 | [espocrm/espocrm](https://github.com/espocrm/espocrm) | 3.7k | `#337ab7` | Quy trình chuyển đổi Lead sang Học viên và nhật ký liên hệ (Interaction Logs). |
| 3 | [suitecrm/suitecrm](https://github.com/suitecrm/suitecrm) | 4.3k | `#d9230f` | Quy trình phễu tuyển sinh theo từng giai đoạn Deal Stage. |
| 4 | [chatwoot/chatwoot](https://github.com/chatwoot/chatwoot) | 21.2k | `#1f93ff` | Giao diện chat tương tác đa kênh tại cột phải của chi tiết hồ sơ Lead. |
| 5 | [papercups-io/papercups](https://github.com/papercups-io/papercups) | 5.5k | `#1890ff` | Widget phản hồi tư vấn nhanh và thông báo tức thời cho tư vấn viên. |
| 6 | [erpnext/erpnext](https://github.com/erpnext/erpnext) | 19.8k | `#0089ff` | Cấu trúc hóa dữ liệu học phí, phiếu thu hóa đơn và trạng thái công nợ học viên. |
| 7 | [odoo/odoo](https://github.com/odoo/odoo) | 38.2k | `#714b67` | Tư duy kéo thả Kanban phân đoạn tuyển sinh (Mới -> Đã liên hệ -> Test -> Nhập học). |
| 8 | [nocodb/nocodb](https://github.com/nocodb/nocodb) | 46.1k | `#1890ff` | Chế độ xem bảng dữ liệu Grid View lọc động, sắp xếp đa trường và ẩn hiện cột. |
| 9 | [baserow/baserow](https://github.com/baserow/baserow) | 12.4k | `#5932ea` | Cơ chế quản lý danh sách học viên dự thính và lọc theo trình độ đầu vào. |
| 10 | [budibase/budibase](https://github.com/budibase/budibase) | 22.6k | `#111827` | Biểu mẫu nhập liệu Modal tư vấn nhanh với tính năng kiểm tra lỗi tức thì. |
| 11 | [cortezaproject/corteza](https://github.com/cortezaproject/corteza) | 1.3k | `#137cbd` | Mô hình bảo mật phân quyền RBAC đa chi nhánh cho Trung tâm Anh ngữ. |
| 12 | [crater-invoice/crater](https://github.com/crater-invoice/crater) | 8.1k | `#2563eb` | Bảng chi tiết biên lai thu học phí, chính sách học bổng và lịch sử giao dịch. |
| 13 | [formbricks/formbricks](https://github.com/formbricks/formbricks) | 8.9k | `#00e699` | Form đăng ký Placement Test trực tuyến với trải nghiệm micro-survey thân thiện. |
| 14 | [documenso/documenso](https://github.com/documenso/documenso) | 8.2k | `#0f172a` | Quy trình ký hợp đồng cam kết đầu ra (IELTS 6.5+) bằng chữ ký số minh bạch. |
| 15 | [posthog/posthog](https://github.com/posthog/posthog) | 22.5k | `#f54e00` | Biểu đồ tỷ lệ rớt (drop-off) từ giai đoạn Test đến lúc nộp học phí hoàn tất. |
| 16 | [plausible/analytics](https://github.com/plausible/analytics) | 19.4k | `#6366f1` | Báo cáo cơ cấu nguồn Lead (Facebook Ads, Google Search, Bạn bè giới thiệu). |
| 17 | [umami-software/umami](https://github.com/umami-software/umami) | 22.1k | `#2563eb` | Widget KPI trực quan gọn gàng trên thanh tiêu đề báo cáo tuyển sinh. |
| 18 | [infisical/infisical](https://github.com/infisical/infisical) | 15.7k | `#84cc16` | Cơ chế bảo mật API và mã hóa thông tin liên lạc cá nhân của học sinh. |

### Nhóm 2: Quản lý Dự án & Kanban (18 Dự án)
| STT | Repository | Stars | Mã Màu | Đặc Trưng UI/UX & Đóng Góp Vào EduFlow CRM |
|:---:|:---|:---:|:---:|:---|
| 19 | [makeplane/plane](https://github.com/makeplane/plane) | 31.8k | `#3f75fe` | Thẻ Kanban học viên với độ tương phản cao, badge trạng thái bo góc tinh tế. |
| 20 | [focalboard/focalboard](https://github.com/mattermost/focalboard) | 19.5k | `#2389d7` | Chuyển đổi góc nhìn linh hoạt giữa bảng Kanban Pipeline và bảng dữ liệu Grid. |
| 21 | [vikunja/vikunja](https://github.com/go-vikunja/vikunja) | 6.1k | `#1973ff` | Danh sách nhắc lịch tư vấn gọi điện cho phụ huynh kèm cờ hạn chót gọi lại. |
| 22 | [taigaio/taiga-front](https://github.com/taigaio/taiga-front) | 6.2k | `#27ae60` | Bộ chỉ số tiến độ hoàn thành chỉ tiêu tuyển sinh theo từng Sprint/Tháng. |
| 23 | [wekan/wekan](https://github.com/wekan/wekan) | 19.2k | `#0079bf` | Cơ chế kéo thả thẻ học viên mượt mà với hiệu ứng phản hồi xúc giác nhẹ nhàng. |
| 24 | [leantime/leantime](https://github.com/leantime/leantime) | 5.4k | `#104f55` | Thước đo tỷ lệ chốt khóa học (Win Rate) theo từng nhân sự tư vấn. |
| 25 | [openproject/openproject](https://github.com/opf/openproject) | 8.7k | `#1763a6` | Sơ đồ xếp lớp và lịch học tuần học viên theo từng phòng học. |
| 26 | [kanboard/kanboard](https://github.com/kanboard/kanboard) | 8.3k | `#333333` | Triết lý tối giản hóa các biểu tượng rác, loại bỏ hoàn toàn emoji cợt nhả. |
| 27 | [planka/planka](https://github.com/plankanban/planka) | 7.4k | `#0079bf` | Đồng bộ hóa dữ liệu thời gian thực khi nhiều tư vấn viên cùng thao tác hồ sơ. |
| 28 | [redmine/redmine](https://github.com/redmine/redmine) | 5.1k | `#b32d2e` | Nhật ký kiểm toán (Audit Trail) ghi lại mọi thao tác sửa đổi điểm Placement Test. |
| 29 | [super-productivity/super-productivity](https://github.com/johannesjo/super-productivity) | 11.5k | `#e11d48` | Bộ đếm thời gian gọi điện tư vấn chăm sóc khách hàng chất lượng cao. |
| 30 | [tasking-manager/tasking-manager](https://github.com/hotosm/tasking-manager) | 1.1k | `#cf2e2e` | Phân chia khu vực thị trường tuyển sinh theo trường học và quận huyện. |
| 31 | [trilium/trilium](https://github.com/zadam/trilium) | 26.4k | `#455a64` | Cây thư mục phân cấp chương trình đào tạo từ Mầm non đến IELTS Master. |
| 32 | [logseq/logseq](https://github.com/logseq/logseq) | 31.5k | `#106ba3` | Liên kết chéo giữa kết quả kiểm tra đầu vào và lộ trình học tập đề xuất. |
| 33 | [appflowy-io/appflowy](https://github.com/AppFlowy-IO/AppFlowy) | 55.8k | `#5c479d` | Thiết kế tài liệu đặc tả khóa học và giáo án lớp học dạng khối nội dung. |
| 34 | [affine-designer/affine](https://github.com/toeverything/AFFiNE) | 43.2k | `#3b82f6` | Khung vẽ sơ đồ xếp lớp học viên tương tác trực quan kéo thả. |
| 35 | [standardnotes/app](https://github.com/standardnotes/app) | 5.3k | `#087df1` | Mã hóa điểm thi đánh giá và phản hồi nhạy cảm của học viên. |
| 36 | [joplin/joplin](https://github.com/laurent22/joplin) | 45.3k | `#1b4fd8` | Đồng bộ tài liệu bài giảng và bài tập về nhà giữa giảng viên và trung tâm. |

### Nhóm 3: Design Systems & Nền Tảng Màu Sắc UI (24 Dự án)
| STT | Repository | Stars | Mã Màu | Đặc Trưng UI/UX & Đóng Góp Vào EduFlow CRM |
|:---:|:---|:---:|:---:|:---|
| 37 | [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) | 82.4k | `#38bdf8` | Hệ thống khoảng cách 4px-grid, bo góc 6px-12px và thang màu nền Slate/Stone. |
| 38 | [radix-ui/colors](https://github.com/radix-ui/colors) | 4.8k | `#0091ff` | Cấu trúc thang màu 12 bước chuẩn P3 cho trạng thái hover, focus, border và text. |
| 39 | [primer/primitives](https://github.com/primer/primitives) | 1.6k | `#0969da` | Theme GitHub Primer Enterprise với tỷ lệ tương phản xanh dương chuẩn mực. |
| 40 | [carbon-design-system/carbon](https://github.com/carbon-design-system/carbon) | 8.3k | `#0f62fe` | Cấu trúc lưới số liệu dày đặc (Data Density) và hệ thống phân cấp font chữ chuẩn. |
| 41 | [shopify/polaris](https://github.com/Shopify/polaris) | 6.2k | `#008060` | Thiết kế thẻ tóm tắt số liệu (Metric Banner) và thông báo Toast xác nhận. |
| 42 | [adobe/spectrum-css](https://github.com/adobe/spectrum-css) | 1.5k | `#eb1000` | Thanh trượt Gauge lấp đầy chỉ số sĩ số lớp học với màu sắc chuyển tiếp mượt. |
| 43 | [ant-design/ant-design](https://github.com/ant-design/ant-design) | 92.8k | `#1677ff` | Bố cục chia màn hình Header + Fixed Sidebar + Main Content tiêu chuẩn. |
| 44 | [chakra-ui/chakra-ui](https://github.com/chakra-ui/chakra-ui) | 36.5k | `#319795` | Bảng màu Campfire & Warm Amber lấy cảm hứng từ thang màu Teal/Orange. |
| 45 | [mantinedev/mantine](https://github.com/mantinedev/mantine) | 26.3k | `#339af0` | Theme Mantine Violet & Raycast với sắc tím học viện sáng tạo, hiện đại. |
| 46 | [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | 76.4k | `#18181b` | Phong cách thiết kế phẳng, viền xám mỏng 1px sắc nét không viền đậm thô kệch. |
| 47 | [tremorlabs/tremor](https://github.com/tremorlabs/tremor) | 15.6k | `#3b82f6` | Thẻ chỉ số KPI doanh thu tuyển sinh, tỷ lệ lấp đầy lớp và biểu đồ phễu. |
| 48 | [atlassian/atlassian-frontend](https://github.com/atlassian/atlassian-frontend) | 2.1k | `#0052cc` | Quy ước đặt tên mã lớp học, huy hiệu cấp độ (Level Pills) và Avatar nhân sự. |
| 49 | [salesforce/design-system](https://github.com/salesforce-ux/design-system) | 4.7k | `#0176d3` | Thước đo trạng thái tiến trình tuyển sinh (Lead Status Progress Tracker). |
| 50 | [uber/baseweb](https://github.com/uber/baseweb) | 8.7k | `#000000` | Hộp thoại Modal nhập liệu mở nhanh với phím tắt Esc và tự động bắt nét. |
| 51 | [palantir/blueprint](https://github.com/palantir/blueprint) | 20.5k | `#137cbd` | Chế độ xem bảng thông tin học viên dày đặc dữ liệu (Dense Data Mode). |
| 52 | [microsoft/fluentui](https://github.com/microsoft/fluentui) | 18.3k | `#0078d4` | Các biểu tượng SVG thanh mảnh độ nét cao và bố cục thanh điều hướng phụ. |
| 53 | [elastic/eui](https://github.com/elastic/eui) | 5.3k | `#0079a5` | Thanh tìm kiếm tức thì với icon kính lúp và phím tắt tìm kiếm toàn hệ thống. |
| 54 | [nordtheme/nord](https://github.com/nordtheme/nord) | 7.7k | `#88c0d0` | Theme Nordic Frost & Canvas Teal với tông xanh ngọc thanh thoát, dễ chịu. |
| 55 | [dracula/dracula-theme](https://github.com/dracula/dracula-theme) | 21.4k | `#bd93f9` | Thang màu tím và xanh dạ quang cho chế độ OLED Midnight Dark. |
| 56 | [catppuccin/catppuccin](https://github.com/catppuccin/catppuccin) | 18.9k | `#cba6f7` | Các nhãn trạng thái pastel nhạt (Status Pills) thân thiện, không chói gắt. |
| 57 | [lucide-icons/lucide](https://github.com/lucide-icons/lucide) | 14.5k | `#f59e0b` | Bộ icon SVG 100% đồng nhất độ dày nét (stroke-width 1.75px) toàn ứng dụng. |
| 58 | [feathericons/feather](https://github.com/feathericons/feather) | 24.2k | `#3b82f6` | Các biểu tượng điều hướng tinh gọn ở thanh Sidebar điều hành. |
| 59 | [tabler/tabler](https://github.com/tabler/tabler) | 37.5k | `#206bc4` | Cấu trúc container thẻ nội dung trắng trên nền xám nhạt chống mỏi mắt. |
| 60 | [coreui/coreui-free-bootstrap-admin-template](https://github.com/coreui/coreui-free-bootstrap-admin-template) | 12.7k | `#321fdb` | Khả năng co giãn giao diện tự thích ứng trên màn hình máy tính bảng và laptop. |

### Nhóm 4: EdTech, LMS & Học Thuật (18 Dự án)
| STT | Repository | Stars | Mã Màu | Đặc Trưng UI/UX & Đóng Góp Vào EduFlow CRM |
|:---:|:---|:---:|:---:|:---|
| 61 | [moodle/moodle](https://github.com/moodle/moodle) | 11.2k | `#f98012` | Cấu trúc quản lý khóa học nhiều cấp độ (Pre-IELTS -> IELTS Fighter -> IELTS Master). |
| 62 | [instructure/canvas-lms](https://github.com/instructure/canvas-lms) | 6.4k | `#e02424` | Phiếu đánh giá năng lực học viên theo 4 kỹ năng Nghe - Nói - Đọc - Viết. |
| 63 | [openedx/edx-platform](https://github.com/openedx/edx-platform) | 7.1k | `#00262b` | Theme Oxford Academic & Royal Navy chuẩn học thuật đại học danh giá. |
| 64 | [chamilo/chamilo-lms](https://github.com/chamilo/chamilo-lms) | 1.3k | `#a94442` | Quy trình phân lớp tự động dựa trên phổ điểm kiểm tra đầu vào (Placement Score). |
| 65 | [ilias-e-learning/ilias](https://github.com/ILIAS-eLearning/ILIAS) | 0.8k | `#0a3d62` | Báo cáo chuyên cần và tỷ lệ chuyển tiếp khóa học giữa các kỳ tuyển sinh. |
| 66 | [frappe/lms](https://github.com/frappe/lms) | 1.6k | `#171717` | Bảng điểm điện tử Oxford Scorecard sang trọng thay thế các card tối màu lạc lõng. |
| 67 | [bigbluebutton/bigbluebutton](https://github.com/bigbluebutton/bigbluebutton) | 9.3k | `#0c3383` | Chỉ số trạng thái phòng học ảo và tích hợp lịch phỏng vấn Speaking 1-on-1. |
| 68 | [opencast/opencast](https://github.com/opencast/opencast) | 0.4k | `#2a75a0` | Kho tài liệu mẫu đề thi Cambridge Practice Tests đính kèm theo từng bài thi. |
| 69 | [kolibri/kolibri](https://github.com/learningequality/kolibri) | 2.6k | `#0d6efd` | Cơ chế lưu trữ tạm thời LocalStorage cho phép chạy Offline 100% không cần Internet. |
| 70 | [exercism/exercism](https://github.com/exercism/exercism) | 4.2k | `#2e1065` | Ô nhận xét đánh giá chi tiết của giáo viên sau buổi phỏng vấn kiểm tra đầu vào. |
| 71 | [freeCodeCamp/freeCodeCamp](https://github.com/freeCodeCamp/freeCodeCamp) | 402k | `#0a0a23` | Thanh lộ trình từng bước (Step-by-step roadmap) từ người mất gốc đến mục tiêu. |
| 72 | [the-odin-project/theodinproject](https://github.com/TheOdinProject/theodinproject) | 6.8k | `#c59b27` | Thiết kế thẻ khóa học hiển thị thời lượng (60 giờ), học phí và lịch khai giảng. |
| 73 | [habitica/habitica](https://github.com/HabitRPG/habitica) | 10.4k | `#4f2a58` | Huy hiệu mức độ ưu tiên nhẹ nhàng nhắc nhở tư vấn viên liên hệ kịp thời. |
| 74 | [open-learning-exchange/planet](https://github.com/open-learning-exchange/planet) | 0.3k | `#008080` | Cơ chế quản lý danh sách học sinh theo khối lớp và ca học sáng/tối. |
| 75 | [omeka/omeka-s](https://github.com/omeka/omeka-s) | 0.5k | `#2b3e50` | Trình bày danh mục khóa học chuẩn chỉnh, thông số minh bạch, tạo dựng niềm tin. |
| 76 | [pkp/ojs](https://github.com/pkp/ojs) | 1.2k | `#007ab8` | Định dạng font chữ Inter thanh lịch với letter-spacing -0.011em chuẩn học thuật. |
| 77 | [zulip/zulip](https://github.com/zulip/zulip) | 21.6k | `#5276a7` | Nhật ký trao đổi nội bộ giữa tư vấn viên và giảng viên về từng học viên. |
| 78 | [matrix-org/matrix-spec](https://github.com/matrix-org/matrix-spec) | 4.7k | `#0dbd8b` | Cơ chế thông báo tự động cho phụ huynh học sinh qua cổng liên lạc trung tâm. |

### Nhóm 5: Modern SaaS & Hạ Tầng (16 Dự án)
| STT | Repository | Stars | Mã Màu | Đặc Trưng UI/UX & Đóng Góp Vào EduFlow CRM |
|:---:|:---|:---:|:---:|:---|
| 79 | [calcom/cal.com](https://github.com/calcom/cal.com) | 32.4k | `#111827` | Theme Cal.com & Warm Stone với màu đá ấm tinh tế, trải nghiệm đặt lịch Test. |
| 80 | [dubinc/dub](https://github.com/dubinc/dub) | 19.8k | `#000000` | Tích hợp mã nguồn tuyển sinh chiến dịch (UTM Campaign Tracking) vào Lead. |
| 81 | [supabase/supabase](https://github.com/supabase/supabase) | 73.9k | `#3ecf8e` | Cấu trúc Schema cơ sở dữ liệu quan hệ chặt chẽ giữa Leads, Classes, Enrollments. |
| 82 | [medusajs/medusa](https://github.com/medusajs/medusa) | 26.5k | `#7c3aed` | Quy trình thanh toán học phí nhiều đợt, kiểm soát đặt cọc giữ chỗ và hoàn phí. |
| 83 | [strapi/strapi](https://github.com/strapi/strapi) | 64.2k | `#4945ff` | Khả năng cấu hình nội dung các buổi học và tiêu chí chấm điểm linh hoạt. |
| 84 | [directus/directus](https://github.com/directus/directus) | 28.4k | `#6644ff` | Thanh tìm kiếm bộ lọc đa tiêu chí (Chi nhánh, Trạng thái, Trình độ mục tiêu). |
| 85 | [payloadcms/payload](https://github.com/payloadcms/payload) | 26.7k | `#000000` | Định dạng thẻ giao diện tối giản, phân chia khoảng trắng khoa học không rối mắt. |
| 86 | [ghost/ghost](https://github.com/TryGhost/Ghost) | 47.1k | `#15171a` | Phân cấp tiêu đề H1/H2/H3 rõ ràng, độ cao dòng 1.5 tạo cảm giác thoải mái khi đọc. |
| 87 | [keycloak/keycloak](https://github.com/keycloak/keycloak) | 22.3k | `#0088ce` | Mô hình phân quyền người dùng (Sales, Academic Officer, Center Manager). |
| 88 | [auth0/samples](https://github.com/auth0-samples) | 1.2k | `#eb5424` | Khu vực hồ sơ nhân sự ở góc phải Header với Avatar và chức danh làm việc. |
| 89 | [casbin/casbin](https://github.com/casbin/casbin) | 17.4k | `#337ab7` | Kiểm soát nút hành động: chỉ Quản lý mới được duyệt hủy ghi danh lớp. |
| 90 | [glitchtip/glitchtip](https://github.com/glitchtip/glitchtip) | 3.2k | `#f35454` | Xử lý thông báo lỗi người dùng dạng Toast nhẹ nhàng không chặn giao diện. |
| 91 | [novu/novu](https://github.com/novuhq/novu) | 35.8k | `#ff4081` | Hệ thống gửi tin nhắn SMS tự động nhắc lịch thi và thư chào mừng nhập học. |
| 92 | [courier-api/courier](https://github.com/trycourier/courier-node) | 1.4k | `#673ab7` | Mẫu thông báo thông tin lớp học, phòng học, giáo viên phụ trách qua Email. |
| 93 | [typebot-io/typebot.io](https://github.com/baptisteArno/typebot.io) | 8.7k | `#0042da` | Form trắc nghiệm trực quan cho học viên đăng ký hẹn giờ làm bài thi đầu vào. |
| 94 | [botpress/botpress](https://github.com/botpress/botpress) | 12.8k | `#2c3e50` | Khu vực ghi chú tự động từ các câu hỏi thường gặp của học viên. |

### Nhóm 6: Data Visualization, Tables & UI Component Toolkits (12 Dự án)
| STT | Repository | Stars | Mã Màu | Đặc Trưng UI/UX & Đóng Góp Vào EduFlow CRM |
|:---:|:---|:---:|:---:|:---|
| 95 | [apache/echarts](https://github.com/apache/echarts) | 59.4k | `#5470c6` | Biểu đồ cột doanh thu tuyển sinh và biểu đồ tròn cơ cấu nguồn ứng viên. |
| 96 | [chartjs/Chart.js](https://github.com/chartjs/Chart.js) | 63.2k | `#ff6384` | Biểu đồ đường theo dõi chỉ tiêu tuyển sinh theo tuần của từng chi nhánh. |
| 97 | [recharts/recharts](https://github.com/recharts/recharts) | 24.1k | `#8884d8` | Màu sắc biểu đồ đồng bộ hoàn toàn theo Palette đang được kích hoạt. |
| 98 | [tanstack/table](https://github.com/TanStack/table) | 25.6k | `#000000` | Cấu trúc cột dữ liệu bảng học viên với tính năng sắp xếp và lọc tức thì. |
| 99 | [ag-grid/ag-grid](https://github.com/ag-grid/ag-grid) | 11.3k | `#2196f3` | Độ rộng cột dữ liệu tối ưu, phân trang nhanh và cố định tiêu đề bảng (Sticky). |
| 100 | [handsontable/handsontable](https://github.com/handsontable/handsontable) | 19.5k | `#0073a8` | Bảng chấm điểm chi tiết 4 kỹ năng trong giao diện UC-02 Placement Test. |
| 101 | [visgl/deck.gl](https://github.com/visgl/deck.gl) | 12.6k | `#0f172a` | Hiệu ứng chuyển cảnh mượt mà giữa các Tab nghiệp vụ không giật lag. |
| 102 | [mermaid-js/mermaid](https://github.com/mermaid-js/mermaid) | 71.3k | `#ff3670` | Vẽ sơ đồ quy trình nghiệp vụ BPMN và sơ đồ quan hệ thực thể Conceptual ERD. |
| 103 | [highlightjs/highlight.js](https://github.com/highlightjs/highlight.js) | 23.4k | `#e28935` | Khối hiển thị mã màu HEX và token CSS rõ ràng trong tài liệu hướng dẫn. |
| 104 | [craftzdog/inkdrop](https://github.com/craftzdog/inkdrop) | 4.1k | `#2b2d42` | Độ thẩm mỹ tối giản, tập trung vào nội dung văn bản và số liệu nghiệp vụ. |
| 105 | [d3/d3](https://github.com/d3/d3) | 108k | `#f9a03f` | Tỷ lệ chuẩn mực trong thang đo năng lực tiếng Anh từ 0 đến 9.0 IELTS. |
| 106 | [nivo-labs/nivo](https://github.com/plouc/nivo) | 13.2k | `#e8c1a0` | Các thẻ chỉ số thống kê tỷ lệ phần trăm lấp đầy lớp học sinh động. |

---

## 5. CÁC TÍNH NĂNG TƯƠNG TÁC ĐẮT GIÁ TRÊN BẢN MẪU WEB (`prototype/index.html`)

1. **Bộ chuyển đổi Đa Bảng Màu (Multi-Palette Switcher):**
   - Hỗ trợ đổi nhanh 9 bảng màu bằng thanh chấm tròn (Swatch Dots) ở Header hoặc Dropdown ở Sidebar.
   - Khi chọn bảng màu mới, toàn bộ giao diện (Sidebar, Header, Nút bấm, Badge, Thẻ Kanban, Bảng điểm) đổi màu đồng bộ tức thì không cần load lại trang.
2. **Tab 5 - Thư viện 106 Kho Mã Nguồn Mở Tương Tác:**
   - **Tìm kiếm tức thì (Live Search):** Cho phép gõ tên repo, từ khóa nghiệp vụ hoặc mã màu `#hex` để lọc tức thì.
   - **Lọc theo 6 chuyên mục:** Bấm các nút danh mục để xem nhanh nhóm CRM, Dự án, Design Systems, LMS, SaaS, Data Viz.
   - **Nút "Thử Palette":** Trên mỗi thẻ repo có nút bấm giúp kích hoạt ngay bảng màu CRM tương ứng với mã nguồn mở đó.
3. **Phân hệ Quản lý Lead (UC-01):**
   - Bảng Kanban 5 cột tiêu chuẩn với nhãn mức độ ưu tiên pastel nhẹ nhàng (`Ưu tiên cao`, `Trung bình`, `Tiêu chuẩn`).
   - Slide-over Drawer mở rộng hiển thị thông tin học viên, lịch sử cuộc gọi và Form thêm ghi chú chăm sóc.
4. **Phân hệ Placement Test (UC-02):**
   - Thẻ báo điểm chuẩn học thuật (Academic Scorecard) trên nền trắng trang nhã, Band điểm to `48px`.
   - Tính điểm trung bình 4 kỹ năng tự động theo Quy tắc làm tròn Cambridge (nấc $0.25$ và $0.75$) và tự đề xuất lộ trình khóa học.
5. **Phân hệ Lớp học & Xếp lớp (UC-03):**
   - Thước đo sĩ số tự đổi màu theo độ lấp đầy ($<70\%$ Xanh lá, $70-95\%$ Vàng, $100\%$ Đỏ khóa sĩ số).
   - Modal xếp lớp thao tác trực tiếp và cập nhật sĩ số thời gian thực.
6. **Mô phỏng Phân quyền (RBAC Switcher):**
   - Chuyển đổi qua lại giữa *Tư vấn viên (Sales)*, *Giáo vụ (Academic Staff)* và *Quản lý (Admin)* để kiểm tra giao diện phân quyền.

---
*Tài liệu thuộc hồ sơ đồ án Quản lý dự án phần mềm - Sprint 2 (Web App Foundation) - Nhóm 8.*
