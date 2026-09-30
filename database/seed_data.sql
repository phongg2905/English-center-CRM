-- ==============================================================================
-- DỰ ÁN: ENGLISH CENTER CRM - PHẦN MỀM CRM QUẢN LÝ TUYỂN SINH VÀ ĐÀO TẠO
-- MÃ CÔNG VIỆC: DB-02 (Seed Data Script)
-- TÁC GIẢ: Tam Minh (@tamminh6) - Database Engineer / Phân tích hệ thống
-- MỤC ĐÍCH: Nạp dữ liệu mẫu chuẩn với ID số nguyên (1, 2, 3...) siêu ngắn gọn, trực quan
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. BẢNG roles (3 Vai trò chuẩn RBAC: 1 = ADMIN, 2 = SALES, 3 = ACADEMIC)
-- ==============================================================================
INSERT INTO roles (id, role_code, role_name, description) VALUES
(1, 'ADMIN', 'Quản lý trung tâm', 'Toàn quyền cấu hình hệ thống, phân quyền nhân sự và xem Dashboard'),
(2, 'SALES', 'Tư vấn viên tuyển sinh', 'Tiếp nhận Lead, chăm sóc Pipeline, đặt lịch Test và làm thủ tục ghi danh'),
(3, 'ACADEMIC', 'Nhân viên giáo vụ', 'Quản lý lịch thi, ca thi, nhập điểm test, quản lý khóa học và lớp học');

-- ==============================================================================
-- 2. BẢNG users (Nhân sự nòng cốt: 1 = Tam Minh, 2 = Long Phạm, 3 = phong phạm)
-- Mật khẩu mặc định: 'Password@123' (Mã băm Bcrypt)
-- ==============================================================================
INSERT INTO users (id, username, password_hash, full_name, email, phone_number, role_id, avatar_url, is_active) VALUES
(1, 'tamminh', '$2a$12$e8k6R4QzY7e1K2I3l7Zf4.7x3q5.K9Q6aLzM4B8N2p3e1v5b7y9u', 'Tam Minh', 'tamminh@crm.edu.vn', '0912345678', 1, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb', TRUE),
(2, 'longpham', '$2a$12$e8k6R4QzY7e1K2I3l7Zf4.7x3q5.K9Q6aLzM4B8N2p3e1v5b7y9u', 'Long Phạm', 'longpham@crm.edu.vn', '0987654321', 2, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', TRUE),
(3, 'phongpham', '$2a$12$e8k6R4QzY7e1K2I3l7Zf4.7x3q5.K9Q6aLzM4B8N2p3e1v5b7y9u', 'phong phạm', 'phongpham@crm.edu.vn', '0934567890', 3, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', TRUE);

-- ==============================================================================
-- 3. BẢNG courses (5 Khóa học: 1 -> 5)
-- ==============================================================================
INSERT INTO courses (id, course_code, course_name, total_lessons, standard_tuition, min_entry_score, max_entry_score, target_output, description, is_active) VALUES
(1, 'IELTS-FOUND', 'IELTS Nền tảng (Foundation)', 24, 6500000.00, 3.0, 4.5, 'IELTS 4.5 - 5.5', 'Xây dựng ngữ pháp cốt lõi, phát âm chuẩn IPA và từ vựng học thuật cơ bản.', TRUE),
(2, 'IELTS-FIGHT', 'IELTS Bứt phá (Target 6.5)', 30, 8500000.00, 5.0, 5.5, 'IELTS 6.0 - 6.5', 'Rèn luyện chiến thuật giải đề 4 kỹ năng, tối ưu hóa điểm Writing Task 2 & Speaking.', TRUE),
(3, 'IELTS-MAST', 'IELTS Chuyên sâu (Master 7.5+)', 36, 11500000.00, 6.5, 7.0, 'IELTS 7.5+', 'Nâng tầm tư duy biện luận, từ vựng C1-C2 và hoàn thiện tiêu chí Coherence & Lexical.', TRUE),
(4, 'TOEIC-500', 'TOEIC Cấp tốc 550+', 20, 4500000.00, 0.0, 4.0, 'TOEIC 550 - 650', 'Khóa học ôn thi TOEIC 2 kỹ năng Nghe - Đọc cho sinh viên chuẩn bị tốt nghiệp.', TRUE),
(5, 'COMM-PRO', 'Tiếng Anh Giao tiếp Đi làm', 24, 5200000.00, 0.0, 9.0, 'B1 CEFR Phản xạ', 'Giao tiếp tình huống công sở, thuyết trình, viết email chuyên nghiệp cho người đi làm.', TRUE);

-- ==============================================================================
-- 4. BẢNG classes (3 Lớp học mở: 1 = K26, 2 = K27, 3 = F20)
-- ==============================================================================
INSERT INTO classes (id, course_id, class_code, class_name, schedule_days, time_slot, room, teacher_name, start_date, max_capacity, current_enrolled, status) VALUES
(1, 2, 'IELTS-K26-T246', 'IELTS Bứt phá K26 (Tối 2-4-6)', 'MON_WED_FRI', '18:00 - 19:30', 'Phòng 302', 'Ms. Emily Nguyễn (8.5 IELTS)', '2026-10-15', 15, 0, 'OPEN'),
(2, 2, 'IELTS-K27-T357', 'IELTS Bứt phá K27 (Tối 3-5-7)', 'TUE_THU_SAT', '19:45 - 21:15', 'Phòng 201', 'Mr. David Trần (8.0 IELTS)', '2026-10-20', 12, 0, 'OPEN'),
(3, 1, 'IELTS-F20-T246', 'IELTS Nền tảng F20', 'MON_WED_FRI', '19:45 - 21:15', 'Phòng 101', 'Ms. Sarah Lê (8.0 IELTS)', '2026-10-18', 15, 0, 'OPEN');

-- ==============================================================================
-- 5. BẢNG leads (10 Leads phủ đủ 5 trạng thái vòng đời Kanban: 1 -> 10)
-- Phụ trách: Sales Long Phạm (user_id = 2)
-- ==============================================================================
INSERT INTO leads (id, full_name, phone_number, email, interest, source_channel, pipeline_stage, lost_reason, assigned_sales_id, notes) VALUES
-- Cột 1: Mới tiếp nhận (NEW)
(1, 'Nguyễn Thị Thuỳ Dung', '0912111001', 'thuydung.nguyen@gmail.com', 'IELTS', 'FB_ADS', 'NEW', NULL, 2, 'Đăng ký qua Form Facebook Ads lúc 08:30 sáng nay, muốn học cấp tốc tháng 11.'),
(2, 'Hoàng Minh Quân', '0912111002', 'quan.hoang@yahoo.com', 'TOEIC', 'WEBSITE', 'NEW', NULL, 2, 'Cần chứng chỉ TOEIC 600 để ra trường PTIT cuối năm.'),

-- Cột 2: Đang liên hệ chăm sóc (CONTACTING)
(3, 'Trần Bảo Ngọc', '0912111003', 'ngoc.tran@outlook.com', 'IELTS', 'HOTLINE', 'CONTACTING', NULL, 2, 'Đã gọi 1 cuộc, khách đang đi làm, hẹn gọi lại sau 17h30 chiều.'),
(4, 'Lê Tuấn Hưng', '0912111004', 'tuanhung.le@gmail.com', 'COMMUNICATION', 'WALK_IN', 'CONTACTING', NULL, 2, 'Khách vãng lai đến cơ sở, quan tâm lớp giao tiếp tối 2-4-6.'),

-- Cột 3: Đã hẹn lịch Test đầu vào (TEST_SCHEDULED)
(5, 'Nguyễn Hoàng Nam', '0912111005', 'nam.nguyenhoang@gmail.com', 'IELTS', 'REFERRAL', 'TEST_SCHEDULED', NULL, 2, 'Bạn học giới thiệu, đã hẹn lịch thi Placement Test ngày mai.'),
(6, 'Trần Thu Hà', '0912111006', 'thuha.tran@gmail.com', 'IELTS', 'FB_ADS', 'TEST_SCHEDULED', NULL, 2, 'Đã test xong chiều qua, đang đợi giáo vụ gửi phiếu phân tích điểm.'),

-- Cột 4: Đã chốt ghi danh & Nộp học phí (ENROLLED)
(7, 'Đặng Minh Khôi', '0912111007', 'khoi.dang@gmail.com', 'IELTS', 'FB_ADS', 'ENROLLED', NULL, 2, 'Test đầu vào 5.0, chốt học lớp K26, nộp đủ 100% học phí.'),
(8, 'Vũ Hoàng Yến', '0912111008', 'hoangyen.vu@gmail.com', 'IELTS', 'HOTLINE', 'ENROLLED', NULL, 2, 'Chốt học lớp K26, đã nộp đặt cọc giữ chỗ 3.000.000 VND.'),
(9, 'Phan Quốc Tuấn', '0912111009', 'quoctuan.phan@gmail.com', 'IELTS', 'WEBSITE', 'ENROLLED', NULL, 2, 'Chốt học lớp K27, chuyển khoản đủ học phí.'),

-- Cột 5: Hủy / Không tiềm năng (LOST)
(10, 'Bùi Văn Hậu', '0912111010', 'vanhau.bui@gmail.com', 'IELTS', 'FB_ADS', 'LOST', 'Học phí cao', 2, 'Khách phản hồi học phí vượt ngân sách dự kiến, hẹn dịp khác.');

-- ==============================================================================
-- 6. BẢNG interaction_logs (Nhật ký chăm sóc: 1 -> 3)
-- ==============================================================================
INSERT INTO interaction_logs (id, lead_id, user_id, interaction_type, potential_level, content, next_follow_up_at) VALUES
(1, 3, 2, 'PHONE_CALL', 'WARM', 'Gọi điện tư vấn lần 1: Khách đang ở công ty bận họp, hẹn gọi lại lúc 17:30.', CURRENT_TIMESTAMP + INTERVAL '4 hours'),
(2, 5, 2, 'PHONE_CALL', 'HOT', 'Tư vấn lộ trình IELTS: Học viên đã đồng ý đến làm bài test đầu vào chiều thứ 7 lúc 14:30.', CURRENT_TIMESTAMP + INTERVAL '1 day'),
(3, 7, 2, 'DIRECT_MEETING', 'HOT', 'Gặp trực tiếp tư vấn kết quả thi Overall 5.0, định hướng vào lớp K26 và hướng dẫn đóng học phí.', NULL);

-- ==============================================================================
-- 7. BẢNG placement_tests (Lịch test & Điểm 4 kỹ năng: 1 -> 3)
-- ==============================================================================
INSERT INTO placement_tests (id, lead_id, test_date, time_slot, room, test_type, attendance_status, listening_score, reading_score, writing_score, speaking_score, overall_score, suggested_course_id, examiner_feedback) VALUES
(1, 5, '2026-10-02', '14:30 - 16:00', 'Phòng Lab 201', 'IELTS', 'SCHEDULED', NULL, NULL, NULL, NULL, NULL, NULL, 'Ca thi ngày mai, đã chuẩn bị đề và tai nghe.'),
(2, 6, '2026-09-29', '09:00 - 10:30', 'Phòng Lab 201', 'IELTS', 'PRESENT', 4.0, 4.5, 3.5, 4.0, 4.0, 1, 'Phát âm chưa chuẩn âm đuôi, ngữ pháp viết câu đơn tốt nhưng chưa biết liên kết câu phức. Gợi ý học lớp Foundation.'),
(3, 7, '2026-09-28', '14:30 - 16:00', 'Phòng Lab 201', 'IELTS', 'PRESENT', 5.0, 5.5, 4.5, 5.0, 5.0, 2, 'Khả năng phản xạ nói khá tốt, phát âm rõ; cần trau dồi vốn từ vựng Task 2. Đủ tiêu chuẩn vào lớp Bứt phá Target 6.5.');

-- ==============================================================================
-- 8. BẢNG students (Hồ sơ học viên chính thức: 1 -> 3)
-- ==============================================================================
INSERT INTO students (id, student_code, lead_id, full_name, phone_number, email, date_of_birth, address, emergency_contact_name, emergency_contact_phone) VALUES
(1, 'STU-2026-0001', 7, 'Đặng Minh Khôi', '0912111007', 'khoi.dang@gmail.com', '2004-05-12', 'Số 45 Trần Phú, Hà Đông, Hà Nội', 'Bác Đặng Văn Cường (Bố)', '0988111222'),
(2, 'STU-2026-0002', 8, 'Vũ Hoàng Yến', '0912111008', 'hoangyen.vu@gmail.com', '2003-11-25', 'Tòa nhà S203 Vinhomes Smart City, Nam Từ Liêm', 'Cô Vũ Thị Lan (Mẹ)', '0977222333'),
(3, 'STU-2026-0003', 9, 'Phan Quốc Tuấn', '0912111009', 'quoctuan.phan@gmail.com', '2002-08-19', '182 Lương Thế Vinh, Thanh Xuân, Hà Nội', 'Anh Phan Minh Đức (Anh trai)', '0966333444');

-- ==============================================================================
-- 9. BẢNG enrollments (Ghi danh học viên vào lớp: 1 -> 3)
-- Kích hoạt Trigger tự động tăng current_enrolled trong classes
-- ==============================================================================
INSERT INTO enrollments (id, student_id, class_id, consultant_id, enrollment_date, original_tuition, discount_amount, final_amount, payment_status, status, notes) VALUES
(1, 1, 1, 2, '2026-09-28', 8500000.00, 500000.00, 8000000.00, 'FULLY_PAID', 'ENROLLED', 'Áp dụng voucher ưu đãi đăng ký sớm Early Bird 500k.'),
(2, 2, 1, 2, '2026-09-29', 8500000.00, 0.00, 8500000.00, 'PARTIAL', 'ENROLLED', 'Đặt cọc 3.000.000 VND trước, số còn lại 5.500.000 VND hoàn tất ngày khai giảng.'),
(3, 3, 2, 2, '2026-09-29', 8500000.00, 0.00, 8500000.00, 'FULLY_PAID', 'ENROLLED', 'Nộp học phí chuyển khoản trọn gói 1 đợt.');

-- ==============================================================================
-- 10. BẢNG payment_receipts (Biên lai thực thu tài chính: 1 -> 3)
-- ==============================================================================
INSERT INTO payment_receipts (id, enrollment_id, receipt_code, amount, payment_method, transaction_reference, receiver_id, paid_at, notes) VALUES
(1, 1, 'REC-20260928-001', 8000000.00, 'BANK_TRANSFER', 'VCB-20260928-888912', 2, '2026-09-28 15:30:00+07', 'Thu đủ học phí lớp IELTS K26 qua Vietcombank QR.'),
(2, 2, 'REC-20260929-002', 3000000.00, 'BANK_TRANSFER', 'MB-20260929-102945', 2, '2026-09-29 11:15:00+07', 'Thu tiền đặt cọc giữ chỗ lớp IELTS K26.'),
(3, 3, 'REC-20260929-003', 8500000.00, 'CASH', NULL, 2, '2026-09-29 16:45:00+07', 'Thu tiền mặt trực tiếp tại quầy tuyển sinh.');

-- ==============================================================================
-- 11. ĐỒNG BỘ LẠI BỘ ĐẾM SEQUENCE IDENTITY (Để các lần INSERT sau tự tăng tiếp)
-- ==============================================================================
SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE(MAX(id), 1)) FROM roles;
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users;
SELECT setval(pg_get_serial_sequence('courses', 'id'), COALESCE(MAX(id), 1)) FROM courses;
SELECT setval(pg_get_serial_sequence('classes', 'id'), COALESCE(MAX(id), 1)) FROM classes;
SELECT setval(pg_get_serial_sequence('leads', 'id'), COALESCE(MAX(id), 1)) FROM leads;
SELECT setval(pg_get_serial_sequence('interaction_logs', 'id'), COALESCE(MAX(id), 1)) FROM interaction_logs;
SELECT setval(pg_get_serial_sequence('placement_tests', 'id'), COALESCE(MAX(id), 1)) FROM placement_tests;
SELECT setval(pg_get_serial_sequence('students', 'id'), COALESCE(MAX(id), 1)) FROM students;
SELECT setval(pg_get_serial_sequence('enrollments', 'id'), COALESCE(MAX(id), 1)) FROM enrollments;
SELECT setval(pg_get_serial_sequence('payment_receipts', 'id'), COALESCE(MAX(id), 1)) FROM payment_receipts;

COMMIT;
