import pg from 'pg';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';

const { Client } = pg;

async function seedPlacementAndClasses(): Promise<void> {
  logger.info('================================================================');
  logger.info('  NẠP DỮ LIỆU MẪU PLACEMENT TEST & XẾP LỚP (FE-04A / BE-04)');
  logger.info('================================================================');

  const connectionString = env.db.directUrl || env.db.connectionString;
  const client = new Client({
    connectionString,
    ssl: env.db.ssl ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    logger.info('✅ Kết nối thành công tới PostgreSQL Cloud (Supabase)!');

    // 1. Kiểm tra và bổ sung danh sách Lead mẫu phong phú
    logger.info('1. Đang đồng bộ danh sách học viên tiềm năng (Leads)...');
    const sampleLeads = [
      { name: 'Nguyễn Thúy Hằng', phone: '0982345671', email: 'thuyhang.nguyen@gmail.com', interest: 'IELTS', source: 'FB_ADS', stage: 'TEST_SCHEDULED' },
      { name: 'Trần Văn Nam', phone: '0971234562', email: 'nam.tran@gmail.com', interest: 'IELTS', source: 'WEBSITE', stage: 'TEST_SCHEDULED' },
      { name: 'Lê Hoàng Long', phone: '0912345673', email: 'hoanglong.le@gmail.com', interest: 'IELTS', source: 'REFERRAL', stage: 'TEST_SCHEDULED' },
      { name: 'Phạm Quỳnh Nga', phone: '0963456784', email: 'quynhnga.pham@gmail.com', interest: 'TOEIC', source: 'HOTLINE', stage: 'TEST_SCHEDULED' },
      { name: 'Hoàng Minh Quân', phone: '0934567895', email: 'minhquan.hoang@gmail.com', interest: 'COMMUNICATION', source: 'WALK_IN', stage: 'TEST_SCHEDULED' },
      { name: 'Vũ Thảo Vy', phone: '0945678906', email: 'thaovy.vu@gmail.com', interest: 'IELTS', source: 'FB_ADS', stage: 'TEST_SCHEDULED' },
      { name: 'Đặng Quốc Huy', phone: '0923456787', email: 'quochuy.dang@gmail.com', interest: 'IELTS', source: 'WEBSITE', stage: 'TEST_SCHEDULED' },
      { name: 'Bùi Gia Linh', phone: '0919876548', email: 'gialinh.bui@gmail.com', interest: 'IELTS', source: 'REFERRAL', stage: 'TEST_SCHEDULED' },
      { name: 'Ngô Đức Thắng', phone: '0988776655', email: 'ducthang.ngo@gmail.com', interest: 'TOEIC', source: 'FB_ADS', stage: 'TEST_SCHEDULED' },
      { name: 'Đỗ Hải Đăng', phone: '0977665544', email: 'haidang.do@gmail.com', interest: 'COMMUNICATION', source: 'HOTLINE', stage: 'ENROLLED' },
      { name: 'Trịnh Bảo Châu', phone: '0933221199', email: 'baochau.trinh@gmail.com', interest: 'IELTS', source: 'FB_ADS', stage: 'TEST_SCHEDULED' },
      { name: 'Dương Tuấn Kiệt', phone: '0944332211', email: 'tuankiet.duong@gmail.com', interest: 'IELTS', source: 'WEBSITE', stage: 'TEST_SCHEDULED' },
      { name: 'Lý Mai Phương', phone: '0955443322', email: 'maiphuong.ly@gmail.com', interest: 'IELTS', source: 'REFERRAL', stage: 'TEST_SCHEDULED' },
      { name: 'Đoàn Kim Oanh', phone: '0966554433', email: 'kimoanh.doan@gmail.com', interest: 'IELTS', source: 'FB_ADS', stage: 'TEST_SCHEDULED' },
      { name: 'Phùng Gia Bảo', phone: '0977889900', email: 'giabao.phung@gmail.com', interest: 'IELTS', source: 'HOTLINE', stage: 'TEST_SCHEDULED' }
    ];

    for (const lead of sampleLeads) {
      await client.query(`
        INSERT INTO leads (full_name, phone_number, email, interest, source_channel, pipeline_stage, assigned_sales_id, notes)
        VALUES ($1, $2, $3, $4, $5, $6, 2, 'Lead quan tâm lộ trình thi thử đánh giá năng lực')
        ON CONFLICT (phone_number) DO UPDATE 
        SET pipeline_stage = EXCLUDED.pipeline_stage, email = EXCLUDED.email;
      `, [lead.name, lead.phone, lead.email, lead.interest, lead.source, lead.stage]);
    }
    logger.info('   ✓ Đã cập nhật 15 Lead tuyển sinh.');

    // 2. Lấy danh sách ID các Lead vừa tạo
    const leadsRes = await client.query('SELECT id, full_name, phone_number, interest FROM leads ORDER BY id ASC');
    const leadList = leadsRes.rows;

    // 3. Khởi tạo/Cập nhật các lớp học (classes)
    logger.info('2. Đang kiểm tra danh mục Lớp học xếp lớp (classes)...');
    const sampleClasses = [
      {
        courseId: 1, // IELTS Foundation
        code: 'IELTS-F26-T246',
        name: 'IELTS Foundation Nền Tảng K26',
        days: 'MON_WED_FRI',
        time: '18:00 - 19:30',
        room: 'Phòng 101 (Cơ sở Q.1)',
        teacher: 'Mr. David Trần (8.0 IELTS)',
        startDate: '2026-10-19',
        max: 15,
        status: 'OPEN'
      },
      {
        courseId: 2, // IELTS Pre-Master
        code: 'IELTS-PM26-T357',
        name: 'IELTS Pre-Master Bứt Phá K26',
        days: 'TUE_THU_SAT',
        time: '19:45 - 21:15',
        room: 'Phòng 202 (Cơ sở Bình Thạnh)',
        teacher: 'Ms. Sarah Lê (8.0 IELTS)',
        startDate: '2026-10-20',
        max: 15,
        status: 'OPEN'
      },
      {
        courseId: 3, // IELTS Master Intensive
        code: 'IELTS-M26-T246',
        name: 'IELTS Master Intensive Chuyên Sâu K26',
        days: 'MON_WED_FRI',
        time: '19:45 - 21:15',
        room: 'Phòng 301 (Cơ sở Tân Bình)',
        teacher: 'Mr. James Wilson (Cựu giám khảo IELTS)',
        startDate: '2026-10-21',
        max: 15,
        status: 'OPEN'
      },
      {
        courseId: 4, // TOEIC
        code: 'TOEIC-K26-T7CN',
        name: 'TOEIC Cấp Tốc 650+ K26',
        days: 'WEEKEND',
        time: '14:00 - 17:00',
        room: 'Phòng Lab 101 (Cơ sở Q.1)',
        teacher: 'Ms. Mai Phương (950 TOEIC)',
        startDate: '2026-10-25',
        max: 18,
        status: 'OPEN'
      },
      {
        courseId: 5, // Giao tiếp
        code: 'COMM-A26-T357',
        name: 'Tiếng Anh Giao Tiếp Phản Xạ Quốc Tế',
        days: 'TUE_THU_SAT',
        time: '18:00 - 19:30',
        room: 'Phòng 103 (Cơ sở Q.1)',
        teacher: 'Mr. Michael Smith (Bản xứ Mỹ)',
        startDate: '2026-10-22',
        max: 12,
        status: 'OPEN'
      }
    ];

    for (const c of sampleClasses) {
      await client.query(`
        INSERT INTO classes (course_id, class_code, class_name, schedule_days, time_slot, room, teacher_name, start_date, max_capacity, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (class_code) DO UPDATE
        SET class_name = EXCLUDED.class_name, teacher_name = EXCLUDED.teacher_name, room = EXCLUDED.room, status = EXCLUDED.status;
      `, [c.courseId, c.code, c.name, c.days, c.time, c.room, c.teacher, c.startDate, c.max, c.status]);
    }
    logger.info('   ✓ Đã cập nhật 5 lớp học đang mở tuyển sinh.');

    // 4. Xóa dữ liệu placement_tests cũ để tạo mới bộ dữ liệu chuẩn chỉnh
    logger.info('3. Đang nạp dữ liệu mẫu Placement Tests theo các ca thi thực tế...');
    await client.query('DELETE FROM placement_tests');

    // Dữ liệu Placement Tests đa dạng theo tuần
    const sampleTests = [
      // --- HÔM NAY (2026-10-04) ---
      {
        leadIndex: 0,
        date: '2026-10-04',
        timeSlot: '09:00 - 10:30',
        room: 'Phòng Lab 201',
        type: 'IELTS',
        status: 'PRESENT',
        l: 7.5, r: 7.0, w: 6.5, s: 7.0, overall: 7.0,
        suggestedCourseId: 3, // IELTS Master Intensive
        feedback: 'Kỹ năng phản xạ phỏng vấn rất trôi chảy, phát âm tự nhiên. Ngữ pháp viết câu phức chuẩn. Đủ điều kiện nhập học lớp chuyên sâu 7.5+.'
      },
      {
        leadIndex: 1,
        date: '2026-10-04',
        timeSlot: '09:00 - 10:30',
        room: 'Phòng Lab 201',
        type: 'IELTS',
        status: 'PRESENT',
        l: 5.0, r: 5.5, w: 4.5, s: 5.0, overall: 5.0,
        suggestedCourseId: 2, // IELTS Pre-Master
        feedback: 'Từ vựng nền tảng tốt, cần rèn luyện thêm kỹ năng triển khai ý tưởng Writing Task 2. Xếp vào lớp Bứt phá Pre-Master.'
      },
      {
        leadIndex: 2,
        date: '2026-10-04',
        timeSlot: '14:30 - 16:00',
        room: 'Phòng Lab 201',
        type: 'IELTS',
        status: 'SCHEDULED',
        l: null, r: null, w: null, s: null, overall: null,
        suggestedCourseId: null,
        feedback: 'Ca thi chiều nay, đã xác nhận qua điện thoại với thí sinh.'
      },
      {
        leadIndex: 3,
        date: '2026-10-04',
        timeSlot: '14:30 - 16:00',
        room: 'Phòng Lab 101',
        type: 'TOEIC',
        status: 'SCHEDULED',
        l: null, r: null, w: null, s: null, overall: null,
        suggestedCourseId: null,
        feedback: 'Thi TOEIC 2 kỹ năng Nghe & Đọc trên máy tính.'
      },
      {
        leadIndex: 4,
        date: '2026-10-04',
        timeSlot: '18:00 - 19:30',
        room: 'Phòng Lab 201',
        type: 'IELTS',
        status: 'SCHEDULED',
        l: null, r: null, w: null, s: null, overall: null,
        suggestedCourseId: null,
        feedback: 'Ca tối giờ cao điểm, học viên đang đi làm đăng ký.'
      },
      {
        leadIndex: 5,
        date: '2026-10-04',
        timeSlot: '18:00 - 19:30',
        room: 'Phòng 302',
        type: 'GENERAL',
        status: 'SCHEDULED',
        l: null, r: null, w: null, s: null, overall: null,
        suggestedCourseId: null,
        feedback: 'Kiểm tra giao tiếp phản xạ định hướng đi du học.'
      },

      // --- NGÀY MAI (2026-10-05) - Ca tối tạo 8 thí sinh để hiển thị cảnh báo sức chứa 8/10 ---
      {
        leadIndex: 6,
        date: '2026-10-05',
        timeSlot: '18:00 - 19:30',
        room: 'Phòng Lab 201',
        type: 'IELTS',
        status: 'SCHEDULED',
        l: null, r: null, w: null, s: null, overall: null,
        suggestedCourseId: null,
        feedback: 'Đã hẹn trước 2 ngày'
      },
      {
        leadIndex: 7,
        date: '2026-10-05',
        timeSlot: '18:00 - 19:30',
        room: 'Phòng Lab 201',
        type: 'IELTS',
        status: 'SCHEDULED',
        l: null, r: null, w: null, s: null, overall: null,
        suggestedCourseId: null,
        feedback: 'Đã nhắc lịch'
      },
      {
        leadIndex: 8,
        date: '2026-10-05',
        timeSlot: '18:00 - 19:30',
        room: 'Phòng Lab 201',
        type: 'IELTS',
        status: 'SCHEDULED',
        l: null, r: null, w: null, s: null, overall: null,
        suggestedCourseId: null,
        feedback: 'Hẹn thi chung nhóm'
      },
      {
        leadIndex: 9,
        date: '2026-10-05',
        timeSlot: '18:00 - 19:30',
        room: 'Phòng Lab 201',
        type: 'IELTS',
        status: 'SCHEDULED',
        l: null, r: null, w: null, s: null, overall: null,
        suggestedCourseId: null,
        feedback: 'Hẹn thi chung nhóm'
      },
      {
        leadIndex: 10,
        date: '2026-10-05',
        timeSlot: '18:00 - 19:30',
        room: 'Phòng Lab 201',
        type: 'IELTS',
        status: 'SCHEDULED',
        l: null, r: null, w: null, s: null, overall: null,
        suggestedCourseId: null,
        feedback: 'Cần tai nghe cách âm'
      },
      {
        leadIndex: 11,
        date: '2026-10-05',
        timeSlot: '18:00 - 19:30',
        room: 'Phòng Lab 201',
        type: 'IELTS',
        status: 'SCHEDULED',
        l: null, r: null, w: null, s: null, overall: null,
        suggestedCourseId: null,
        feedback: 'Đã gửi SMS xác nhận'
      },
      {
        leadIndex: 12,
        date: '2026-10-05',
        timeSlot: '18:00 - 19:30',
        room: 'Phòng Lab 201',
        type: 'IELTS',
        status: 'SCHEDULED',
        l: null, r: null, w: null, s: null, overall: null,
        suggestedCourseId: null,
        feedback: 'Đã gửi Email sơ đồ phòng'
      },
      {
        leadIndex: 13,
        date: '2026-10-05',
        timeSlot: '18:00 - 19:30',
        room: 'Phòng Lab 201',
        type: 'IELTS',
        status: 'SCHEDULED',
        l: null, r: null, w: null, s: null, overall: null,
        suggestedCourseId: null,
        feedback: 'Thí sinh thứ 8 trong phòng (8/10 chỗ)'
      },

      // --- CÁC NGÀY TRƯỚC TRONG TUẦN (2026-10-02, 2026-10-03) ---
      {
        leadIndex: 14,
        date: '2026-10-03',
        timeSlot: '14:30 - 16:00',
        room: 'Phòng Lab 201',
        type: 'IELTS',
        status: 'ABSENT',
        l: null, r: null, w: null, s: null, overall: null,
        suggestedCourseId: null,
        feedback: 'Thí sinh bận đột xuất, Sales đã gọi điện và xin dời lịch sang tuần sau.'
      },
      {
        leadIndex: 4,
        date: '2026-10-02',
        timeSlot: '09:00 - 10:30',
        room: 'Phòng Lab 201',
        type: 'GENERAL',
        status: 'PRESENT',
        l: 6.0, r: 6.0, w: 5.5, s: 6.5, overall: 6.0,
        suggestedCourseId: 5, // Giao tiếp
        feedback: 'Phản xạ tốt, tự tin khi nói chuyện với giáo viên nước ngoài. Gợi ý xếp lớp Giao Tiếp Phản Xạ.'
      }
    ];

    for (const test of sampleTests) {
      const targetLead = leadList[test.leadIndex % leadList.length];
      await client.query(`
        INSERT INTO placement_tests (
          lead_id, test_date, time_slot, room, test_type, attendance_status,
          listening_score, reading_score, writing_score, speaking_score, overall_score,
          suggested_course_id, examiner_feedback
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        targetLead.id,
        test.date,
        test.timeSlot,
        test.room,
        test.type,
        test.status,
        test.l,
        test.r,
        test.w,
        test.s,
        test.overall,
        test.suggestedCourseId,
        test.feedback
      ]);
    }

    logger.info(`   ✓ Đã nạp thành công ${sampleTests.length} ca thi mẫu phong phú.`);

    // 5. Cập nhật mẫu học viên đã nhập học và xếp vào lớp
    logger.info('4. Đồng bộ hồ sơ học viên chính thức & xếp lớp (students & enrollments)...');
    const enrolledLead = leadList[0];
    await client.query(`
      INSERT INTO students (student_code, lead_id, full_name, phone_number, email, date_of_birth, address)
      VALUES ('STU-2026-0004', $1, $2, $3, $4, '2004-06-15', 'Số 88 Cầu Giấy, Hà Nội')
      ON CONFLICT (student_code) DO NOTHING;
    `, [enrolledLead.id, enrolledLead.full_name, enrolledLead.phone_number, 'thuyhang.stu@gmail.com']);

    // Ghi danh vào lớp IELTS Master Intensive
    const studentRes = await client.query("SELECT id FROM students WHERE student_code = 'STU-2026-0004'");
    const classRes = await client.query("SELECT id FROM classes WHERE class_code = 'IELTS-M26-T246'");

    if (studentRes.rows.length > 0 && classRes.rows.length > 0) {
      const sId = studentRes.rows[0].id;
      const cId = classRes.rows[0].id;
      await client.query(`
        INSERT INTO enrollments (student_id, class_id, consultant_id, enrollment_date, original_tuition, discount_amount, final_amount, payment_status, status, notes)
        VALUES ($1, $2, 2, '2026-10-04', 12500000.00, 1000000.00, 11500000.00, 'FULLY_PAID', 'ENROLLED', 'Học viên đạt Band 7.0 thi thử sáng 04/10, đăng ký nhập học ngay lớp chuyên sâu.')
        ON CONFLICT DO NOTHING;
      `, [sId, cId]);
      logger.info('   ✓ Đã ghi danh học viên đạt điểm test vào lớp IELTS Master Intensive.');
    }

    logger.info('================================================================');
    logger.info('✅ NẠP DỮ LIỆU MẪU CHO TEST VÀ XẾP LỚP HOÀN TẤT THÀNH CÔNG!');
    logger.info('================================================================');
  } catch (error: any) {
    logger.error('❌ Lỗi khi nạp dữ liệu mẫu:', error.message);
    if (error.detail) {
      logger.error('Chi tiết:', error.detail);
    }
  } finally {
    await client.end();
  }
}

seedPlacementAndClasses().catch(console.error);
