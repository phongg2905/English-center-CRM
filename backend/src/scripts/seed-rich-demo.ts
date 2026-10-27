import bcrypt from 'bcryptjs';
import { query, pool } from '../database/pool.js';
import { AuditLogService } from '../services/audit-log.service.js';

async function seedRichDemoData() {
  console.log('🚀 Bắt đầu bổ sung dữ liệu mẫu phong phú cho hệ thống EduFlow CRM...');

  await AuditLogService.ensureTable();

  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Đảm bảo bảng roles đầy đủ 4 vai trò
  await query(`
    INSERT INTO roles (role_code, role_name, description) VALUES
      ('ADMIN', 'Quản trị viên (Center Director)', 'Toàn quyền quản trị hệ thống, cấu hình tham số, nhân sự và xem báo cáo doanh thu'),
      ('SALES', 'Nhân viên Tư vấn (Sales / Consultant)', 'Quản lý phễu khách hàng tiềm năng (Leads), lịch sử cuộc gọi và đặt lịch thi thử'),
      ('ACADEMIC', 'Nhân viên Giáo vụ (Academic Staff)', 'Quản lý lịch thi đầu vào, chấm điểm, đề xuất khóa học, xếp lớp và quản lý lớp học'),
      ('TEACHER', 'Giảng viên (Teacher / Instructor)', 'Xem lịch giảng dạy, lớp học phụ trách và danh sách học viên trong lớp')
    ON CONFLICT (role_code) DO NOTHING
  `);

  const rolesRes = await query<{ id: number; role_code: string }>(`SELECT id, role_code FROM roles`);
  const roleMap: Record<string, number> = {};
  for (const r of rolesRes.rows) {
    roleMap[r.role_code] = r.id;
  }

  // 2. Bổ sung tài khoản Nhân sự & Giảng viên
  const staffSeeds = [
    {
      username: 'admin',
      email: 'admin@eduflow.vn',
      fullName: 'Phạm Hoàng Long (Giám đốc TT)',
      phone: '0901000001',
      roleCode: 'ADMIN',
    },
    {
      username: 'sale',
      email: 'lananh.sale@eduflow.vn',
      fullName: 'Nguyễn Thị Lan Anh',
      phone: '0901000002',
      roleCode: 'SALES',
    },
    {
      username: 'maianh',
      email: 'maianh.sale@eduflow.vn',
      fullName: 'Trần Mai Anh',
      phone: '0901000005',
      roleCode: 'SALES',
    },
    {
      username: 'minhkhoa',
      email: 'minhkhoa.sale@eduflow.vn',
      fullName: 'Lê Minh Khoa',
      phone: '0901000006',
      roleCode: 'SALES',
    },
    {
      username: 'academic',
      email: 'minhtuan.academic@eduflow.vn',
      fullName: 'Trần Minh Tuấn',
      phone: '0901000003',
      roleCode: 'ACADEMIC',
    },
    {
      username: 'thanhha',
      email: 'thanhha.academic@eduflow.vn',
      fullName: 'Vũ Thanh Hà',
      phone: '0901000007',
      roleCode: 'ACADEMIC',
    },
    {
      username: 'teacher',
      email: 'emily.teacher@eduflow.vn',
      fullName: 'ThS. Nguyễn Thị Thu Hà (Ms. Emily)',
      phone: '0901000004',
      roleCode: 'TEACHER',
      specialization: 'IELTS 8.5 Academic & Writing',
      isNative: false,
      bio: 'Thạc sĩ TESOL Đại học Melbourne, 8 năm kinh nghiệm luyện thi IELTS 7.0+ và chấm chữa Writing chuyên sâu.',
    },
    {
      username: 'david_tran',
      email: 'david.teacher@eduflow.vn',
      fullName: 'Thầy Trần Minh Đức (Mr. David)',
      phone: '0901000008',
      roleCode: 'TEACHER',
      specialization: 'IELTS 8.0 Overall & Speaking Master',
      isNative: false,
      bio: 'Chuyên gia huấn luyện phát âm chuẩn IPA và phản xạ IELTS Speaking Part 2-3 thực chiến.',
    },
    {
      username: 'sarah_le',
      email: 'sarah.teacher@eduflow.vn',
      fullName: 'Cô Lê Hoàng Yến (Ms. Sarah)',
      phone: '0901000009',
      roleCode: 'TEACHER',
      specialization: 'TOEIC 990/990 & Business English',
      isNative: false,
      bio: '6 năm đào tạo TOEIC 4 kỹ năng và tiếng Anh thương mại cho nhân sự các tập đoàn đa quốc gia.',
    },
    {
      username: 'michael_pham',
      email: 'michael.teacher@eduflow.vn',
      fullName: 'Thầy Phạm Quốc Bảo (Mr. Michael)',
      phone: '0901000010',
      roleCode: 'TEACHER',
      specialization: 'IELTS 8.5 Reading/Listening & TOEIC 975',
      isNative: false,
      bio: 'Tác giả bộ tài liệu giải đề IELTS Reading & Listening tốc độ cao dành cho học viên mất gốc.',
    },
    {
      username: 'oliver_smith',
      email: 'oliver.native@eduflow.vn',
      fullName: 'Mr. Oliver Smith (Native Speaker)',
      phone: '0901000011',
      roleCode: 'TEACHER',
      specialization: 'Cambridge CELTA & Native Communication',
      isNative: true,
      bio: 'Giảng viên bản ngữ Anh Quốc (UK), chứng chỉ CELTA quốc tế, phụ trách các lớp Giao tiếp Phản xạ & IELTS Speaking.',
    },
  ];

  const userIdsByUsername: Record<string, number> = {};
  for (const s of staffSeeds as any[]) {
    const res = await query<{ id: number }>(
      `INSERT INTO users (username, email, password_hash, full_name, phone_number, role_id, is_active, specialization, is_native, bio)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, $8, $9)
       ON CONFLICT (username) DO UPDATE
         SET full_name = EXCLUDED.full_name,
             phone_number = EXCLUDED.phone_number,
             role_id = EXCLUDED.role_id,
             is_active = TRUE,
             specialization = COALESCE(EXCLUDED.specialization, users.specialization),
             is_native = COALESCE(EXCLUDED.is_native, users.is_native),
             bio = COALESCE(EXCLUDED.bio, users.bio)
       RETURNING id`,
      [
        s.username,
        s.email,
        passwordHash,
        s.fullName,
        s.phone,
        roleMap[s.roleCode],
        s.specialization || null,
        Boolean(s.isNative),
        s.bio || null,
      ]
    );
    userIdsByUsername[s.username] = res.rows[0].id;
  }
  console.log(`✅ Đã đồng bộ ${Object.keys(userIdsByUsername).length} tài khoản nhân sự & giảng viên.`);

  const salesIds = [
    userIdsByUsername['sale'],
    userIdsByUsername['maianh'],
    userIdsByUsername['minhkhoa'],
  ].filter(Boolean);
  const academicIds = [
    userIdsByUsername['academic'],
    userIdsByUsername['thanhha'],
  ].filter(Boolean);
  const adminId = userIdsByUsername['admin'] || 1;

  // 3. Đồng bộ 6 Khóa học tiêu chuẩn
  const coursesSeeds = [
    {
      code: 'IELTS-FD',
      name: 'IELTS Foundation (Nền tảng 4.0 - 5.0)',
      minScore: 3.5,
      maxScore: 5.0,
      tuition: 6500000,
      lessons: 24,
      desc: 'Xây dựng nền tảng từ vựng học thuật, ngữ pháp trọng tâm và làm quen 4 kỹ năng IELTS chuẩn quốc tế.',
    },
    {
      code: 'IELTS-65',
      name: 'IELTS Fighter (Bứt phá 5.5 - 6.5)',
      minScore: 5.0,
      maxScore: 6.5,
      tuition: 9800000,
      lessons: 36,
      desc: 'Luyện chuyên sâu chiến thuật xử lý các dạng bài Reading/Listening khó, nâng cấp Writing Task 1 & 2 và Speaking Part 2-3.',
    },
    {
      code: 'IELTS-75',
      name: 'IELTS Master (Chinh phục 7.0 - 8.0+)',
      minScore: 6.5,
      maxScore: 9.0,
      tuition: 12500000,
      lessons: 40,
      desc: 'Khóa học chuyên sâu dành cho học viên mục tiêu 7.0+, chấm chữa bài 1-1 cùng cựu giám khảo và giảng viên IELTS 8.5.',
    },
    {
      code: 'TOEIC-650',
      name: 'TOEIC Express 2 Kỹ Năng (500 - 650+)',
      minScore: 0.0,
      maxScore: 4.9,
      tuition: 4500000,
      lessons: 24,
      desc: 'Chinh phục mục tiêu TOEIC 650+ nhanh chóng cho sinh viên chuẩn đầu ra đại học và người đi làm.',
    },
    {
      code: 'TOEIC-800',
      name: 'TOEIC Elite 4 Kỹ Năng (750 - 850+)',
      minScore: 5.0,
      maxScore: 9.0,
      tuition: 6800000,
      lessons: 30,
      desc: 'Luyện đề TOEIC ETS thực chiến kết hợp giao tiếp thương mại trong môi trường doanh nghiệp đa quốc gia.',
    },
    {
      code: 'COMM-PRO',
      name: 'Giao Tiếp Phản Xạ Thực Chiến (Pro Communication)',
      minScore: 0.0,
      maxScore: 4.5,
      tuition: 5200000,
      lessons: 24,
      desc: 'Chuẩn hóa phát âm IPA, phản xạ nghe nói tự nhiên theo chủ đề đời sống và công sở.',
    },
  ];

  const courseIdsByCode: Record<string, { id: number; tuition: number }> = {};
  for (const c of coursesSeeds) {
    const res = await query<{ id: number }>(
      `INSERT INTO courses (course_code, course_name, min_entry_score, max_entry_score, standard_tuition, total_lessons, description, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
       ON CONFLICT (course_code) DO UPDATE
         SET course_name = EXCLUDED.course_name,
             min_entry_score = EXCLUDED.min_entry_score,
             max_entry_score = EXCLUDED.max_entry_score,
             standard_tuition = EXCLUDED.standard_tuition,
             total_lessons = EXCLUDED.total_lessons,
             description = EXCLUDED.description,
             is_active = TRUE
       RETURNING id`,
      [c.code, c.name, c.minScore, c.maxScore, c.tuition, c.lessons, c.desc]
    );
    courseIdsByCode[c.code] = { id: res.rows[0].id, tuition: c.tuition };
  }
  console.log(`✅ Đã đồng bộ ${Object.keys(courseIdsByCode).length} khóa học đào tạo.`);

  // 4. Đồng bộ 8 Lớp học thuộc nhiều trạng thái khác nhau (OPEN, IN_PROGRESS, FULL, PLANNING, COMPLETED)
  await query(`
    UPDATE classes
    SET teacher_name = 'ThS. Nguyễn Thị Thu Hà (Ms. Emily)'
    WHERE teacher_name ILIKE '%Emily%' OR teacher_name ILIKE '%Thu Hà%'
  `);
  await query(`
    UPDATE classes
    SET teacher_name = 'Thầy Trần Minh Đức (Mr. David)'
    WHERE teacher_name ILIKE '%David%' OR teacher_name ILIKE '%Minh Đức%'
  `);
  await query(`
    UPDATE classes
    SET teacher_name = 'Cô Lê Hoàng Yến (Ms. Sarah)'
    WHERE teacher_name ILIKE '%Sarah%' OR teacher_name ILIKE '%Hoàng Yến%'
  `);

  const classesSeeds = [
    {
      code: 'IELTS-FD-K12',
      name: 'IELTS Foundation K12 - Tối 2-4-6',
      courseCode: 'IELTS-FD',
      teacher: 'ThS. Nguyễn Thị Thu Hà (Ms. Emily)',
      room: 'Room 101 - Tầng 1',
      schedule: 'MON_WED_FRI',
      slot: '18:00-19:30',
      startDate: '2026-03-02',
      maxCap: 15,
      status: 'IN_PROGRESS',
    },
    {
      code: 'IELTS-65-K08',
      name: 'IELTS Fighter 6.5 K08 - Tối 3-5-7',
      courseCode: 'IELTS-65',
      teacher: 'ThS. Nguyễn Thị Thu Hà (Ms. Emily)',
      room: 'Room 201 - Tầng 2',
      schedule: 'TUE_THU_SAT',
      slot: '19:45-21:15',
      startDate: '2026-04-06',
      maxCap: 15,
      status: 'OPEN',
    },
    {
      code: 'IELTS-75-M03',
      name: 'IELTS Master 7.5+ M03 - Cuối tuần',
      courseCode: 'IELTS-75',
      teacher: 'Thầy Trần Minh Đức (Mr. David)',
      room: 'Room VIP 301 - Tầng 3',
      schedule: 'WEEKEND',
      slot: '09:00-11:00',
      startDate: '2026-03-14',
      maxCap: 10,
      status: 'IN_PROGRESS',
    },
    {
      code: 'TOEIC-650-T15',
      name: 'TOEIC Express 650+ T15 - Ca tối 2-4-6 (Lớp đầy)',
      courseCode: 'TOEIC-650',
      teacher: 'Cô Lê Hoàng Yến (Ms. Sarah)',
      room: 'Room 102 - Tầng 1',
      schedule: 'MON_WED_FRI',
      slot: '19:45-21:15',
      startDate: '2026-03-16',
      maxCap: 8,
      status: 'FULL',
    },
    {
      code: 'TOEIC-800-E04',
      name: 'TOEIC Elite 800+ E04 - Tối 3-5-7',
      courseCode: 'TOEIC-800',
      teacher: 'Cô Lê Hoàng Yến (Ms. Sarah)',
      room: 'Room 202 - Tầng 2',
      schedule: 'TUE_THU_SAT',
      slot: '18:00-19:30',
      startDate: '2026-04-14',
      maxCap: 15,
      status: 'OPEN',
    },
    {
      code: 'COMM-PRO-C09',
      name: 'Giao Tiếp Phản Xạ C09 - Tối 2-4-6',
      courseCode: 'COMM-PRO',
      teacher: 'Thầy Phạm Quốc Bảo (Mr. Michael)',
      room: 'Room 103 - Tầng 1',
      schedule: 'MON_WED_FRI',
      slot: '18:00-19:30',
      startDate: '2026-04-10',
      maxCap: 16,
      status: 'OPEN',
    },
    {
      code: 'IELTS-FD-K14',
      name: 'IELTS Foundation K14 - Dự kiến khai giảng',
      courseCode: 'IELTS-FD',
      teacher: 'Thầy Trần Minh Đức (Mr. David)',
      room: 'Room 203 - Tầng 2',
      schedule: 'TUE_THU_SAT',
      slot: '18:00-19:30',
      startDate: '2026-05-05',
      maxCap: 15,
      status: 'PLANNING',
    },
    {
      code: 'IELTS-65-K05',
      name: 'IELTS Fighter 6.5 K05 - Đã tốt nghiệp',
      courseCode: 'IELTS-65',
      teacher: 'ThS. Nguyễn Thị Thu Hà (Ms. Emily)',
      room: 'Room 201 - Tầng 2',
      schedule: 'MON_WED_FRI',
      slot: '18:00-19:30',
      startDate: '2025-11-10',
      maxCap: 15,
      status: 'COMPLETED',
    },
  ];

  const classMapByCode: Record<string, { id: number; courseCode: string; tuition: number; maxCap: number; targetStatus: string }> = {};
  for (const cl of classesSeeds) {
    const courseInfo = courseIdsByCode[cl.courseCode];
    const res = await query<{ id: number }>(
      `INSERT INTO classes (class_code, class_name, course_id, teacher_name, room, schedule_days, time_slot, start_date, max_capacity, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (class_code) DO UPDATE
         SET class_name = EXCLUDED.class_name,
             course_id = EXCLUDED.course_id,
             teacher_name = EXCLUDED.teacher_name,
             room = EXCLUDED.room,
             schedule_days = EXCLUDED.schedule_days,
             time_slot = EXCLUDED.time_slot,
             start_date = EXCLUDED.start_date,
             max_capacity = EXCLUDED.max_capacity
       RETURNING id`,
      [
        cl.code,
        cl.name,
        courseInfo.id,
        cl.teacher,
        cl.room,
        cl.schedule,
        cl.slot,
        cl.startDate,
        cl.maxCap,
        cl.status,
      ]
    );
    classMapByCode[cl.code] = {
      id: res.rows[0].id,
      courseCode: cl.courseCode,
      tuition: courseInfo.tuition,
      maxCap: cl.maxCap,
      targetStatus: cl.status,
    };
  }

  const allExistingClassesRes = await query<{
    id: number;
    class_code: string;
    course_id: number;
    max_capacity: number;
    status: string;
  }>(`SELECT id, class_code, course_id, max_capacity, status FROM classes ORDER BY id ASC`);
  console.log(`✅ Hiện có tổng cộng ${allExistingClassesRes.rows.length} lớp học trong hệ thống.`);

  // 5. Đồng bộ 32 Leads phong phú ở cả 5 giai đoạn + Lịch sử tư vấn + Placement Tests
  const leadsSeeds = [
    // ENROLLED leads (12 leads đã chuyển đổi thành học viên)
    { name: 'Nguyễn Minh Quân', phone: '0912300101', email: 'minhquan.ng@gmail.com', interest: 'IELTS', source: 'FB_ADS', stage: 'ENROLLED', notes: 'Sinh viên năm 3 ĐH Kinh tế Quốc dân, cần IELTS 6.5 xét tốt nghiệp.' },
    { name: 'Trần Bảo Ngọc', phone: '0912300102', email: 'baongoc.tran@gmail.com', interest: 'IELTS', source: 'WEBSITE', stage: 'ENROLLED', notes: 'Học sinh lớp 11 chuyên Anh, mục tiêu IELTS 7.5 săn học bổng.' },
    { name: 'Lê Hoàng Nam', phone: '0912300103', email: 'hoangnam.le@gmail.com', interest: 'IELTS', source: 'REFERRAL', stage: 'ENROLLED', notes: 'Bạn của Bảo Ngọc giới thiệu, đăng ký học IELTS Foundation.' },
    { name: 'Phạm Thùy Dương', phone: '0912300104', email: 'thuyduong.pham@gmail.com', interest: 'IELTS', source: 'WALK_IN', stage: 'ENROLLED', notes: 'Đến trực tiếp cơ sở test đầu vào và đóng học phí luôn.' },
    { name: 'Vũ Đức Anh', phone: '0912300105', email: 'ducanh.vu@gmail.com', interest: 'TOEIC', source: 'HOTLINE', stage: 'ENROLLED', notes: 'Cần bằng TOEIC 650 gấp trong 3 tháng để ra trường.' },
    { name: 'Đặng Khánh Linh', phone: '0912300106', email: 'khanhlinh.dang@gmail.com', interest: 'TOEIC', source: 'FB_ADS', stage: 'ENROLLED', notes: 'Nhân viên ngân hàng, học TOEIC Elite 800+ để thăng tiến.' },
    { name: 'Hoàng Gia Bảo', phone: '0912300107', email: 'giabao.hoang@gmail.com', interest: 'IELTS', source: 'WEBSITE', stage: 'ENROLLED', notes: 'Đã thi thử đạt 5.5, xếp vào lớp IELTS Fighter 6.5.' },
    { name: 'Bùi Phương Thảo', phone: '0912300108', email: 'phuongthao.bui@gmail.com', interest: 'COMMUNICATION', source: 'REFERRAL', stage: 'ENROLLED', notes: 'Kỹ sư IT muốn cải thiện giao tiếp phản xạ với khách hàng nước ngoài.' },
    { name: 'Đỗ Tuấn Kiệt', phone: '0912300109', email: 'tuankiet.do@gmail.com', interest: 'TOEIC', source: 'FB_ADS', stage: 'ENROLLED', notes: 'Sinh viên Bách Khoa đăng ký combo TOEIC 650.' },
    { name: 'Ngô Thanh Trúc', phone: '0912300110', email: 'thanhtruc.ngo@gmail.com', interest: 'IELTS', source: 'WALK_IN', stage: 'ENROLLED', notes: 'Phụ huynh dẫn đến đăng ký lớp IELTS Foundation K12.' },
    { name: 'Dương Minh Triết', phone: '0912300111', email: 'minhtriet.duong@gmail.com', interest: 'IELTS', source: 'WEBSITE', stage: 'ENROLLED', notes: 'Đạt 6.5 đầu vào, đăng ký lớp IELTS Master 7.5+ cuối tuần.' },
    { name: 'Lý Ngọc Hân', phone: '0912300112', email: 'ngochan.ly@gmail.com', interest: 'COMMUNICATION', source: 'HOTLINE', stage: 'ENROLLED', notes: 'Đăng ký lớp Giao tiếp thực chiến buổi tối.' },

    // TEST_SCHEDULED leads (8 leads đang có lịch thi hoặc vừa thi xong)
    { name: 'Trịnh Quốc Khánh', phone: '0912300201', email: 'quockhanh.trinh@gmail.com', interest: 'IELTS', source: 'FB_ADS', stage: 'TEST_SCHEDULED', notes: 'Quan tâm khóa IELTS 6.5, hẹn lịch test chiều nay.' },
    { name: 'Phan Mỹ Tâm', phone: '0912300202', email: 'mytam.phan@gmail.com', interest: 'IELTS', source: 'WEBSITE', stage: 'TEST_SCHEDULED', notes: 'Muốn kiểm tra trình độ IELTS 4 kỹ năng với giảng viên.' },
    { name: 'Châu Gia Huy', phone: '0912300203', email: 'giahuy.chau@gmail.com', interest: 'TOEIC', source: 'HOTLINE', stage: 'TEST_SCHEDULED', notes: 'Sinh viên năm cuối cần test TOEIC đầu vào.' },
    { name: 'Tạ Bích Ngọc', phone: '0912300204', email: 'bichngoc.ta@gmail.com', interest: 'IELTS', source: 'REFERRAL', stage: 'TEST_SCHEDULED', notes: 'Được học viên cũ giới thiệu, đã có mặt tại phòng thi chờ chấm điểm.' },
    { name: 'Lương Thế Vinh', phone: '0912300205', email: 'thevinh.luong@gmail.com', interest: 'IELTS', source: 'FB_ADS', stage: 'TEST_SCHEDULED', notes: 'Đã hoàn thành bài test IELTS đạt 5.5, đang tư vấn chọn ca học.' },
    { name: 'Mai Phương Thúy', phone: '0912300206', email: 'phuongthuy.mai@gmail.com', interest: 'IELTS', source: 'WALK_IN', stage: 'TEST_SCHEDULED', notes: 'Đã chấm điểm test đầu vào 4.5, hẹn cuối tuần qua đóng học phí.' },
    { name: 'Hà Anh Tuấn', phone: '0912300207', email: 'anhtuan.ha@gmail.com', interest: 'TOEIC', source: 'WEBSITE', stage: 'TEST_SCHEDULED', notes: 'Hẹn lịch thi thử sáng mai tại Room 101.' },
    { name: 'Võ Hoàng Yến', phone: '0912300208', email: 'hoangyen.vo@gmail.com', interest: 'COMMUNICATION', source: 'FB_ADS', stage: 'TEST_SCHEDULED', notes: 'Đăng ký thi thử đánh giá năng lực giao tiếp & IELTS.' },

    // CONTACTING leads (6 leads đang chăm sóc)
    { name: 'Nguyễn Quang Hải', phone: '0912300301', email: 'quanghai.ng@gmail.com', interest: 'IELTS', source: 'FB_ADS', stage: 'CONTACTING', notes: 'Đã gọi lần 1, khách đang cân nhắc lịch học tối 2-4-6 hoặc 3-5-7.' },
    { name: 'Đoàn Văn Hậu', phone: '0912300302', email: 'vanhau.doan@gmail.com', interest: 'IELTS', source: 'HOTLINE', stage: 'CONTACTING', notes: 'Cần gửi lộ trình chi tiết và bảng học phí ưu đãi nhóm 2 người qua Zalo.' },
    { name: 'Nguyễn Tiến Linh', phone: '0912300303', email: 'tienlinh.ng@gmail.com', interest: 'TOEIC', source: 'WEBSITE', stage: 'CONTACTING', notes: 'Quan tâm lớp TOEIC cấp tốc, hẹn gọi lại sau 18h00.' },
    { name: 'Quế Ngọc Hải', phone: '0912300304', email: 'ngochai.que@gmail.com', interest: 'IELTS', source: 'REFERRAL', stage: 'CONTACTING', notes: 'Đang hỏi thêm về chính sách cam kết đầu ra bằng văn bản.' },
    { name: 'Bùi Tiến Dũng', phone: '0912300305', email: 'tiendung.bui@gmail.com', interest: 'TOEIC', source: 'WALK_IN', stage: 'CONTACTING', notes: 'Đã ghé trung tâm nhận tài liệu, đang xin ý kiến phụ huynh.' },
    { name: 'Nguyễn Công Phượng', phone: '0912300306', email: 'congphuong.ng@gmail.com', interest: 'COMMUNICATION', source: 'FB_ADS', stage: 'CONTACTING', notes: 'Muốn học lớp giao tiếp phản xạ cho người đi làm bận rộn.' },

    // NEW leads (5 leads mới tinh vừa đổ về)
    { name: 'Trần Tiểu Vy', phone: '0912300401', email: 'tieuvy.tran@gmail.com', interest: 'IELTS', source: 'FB_ADS', stage: 'NEW', notes: 'Để lại SĐT từ chiến dịch quảng cáo Fanpage IELTS Mùa Hè.' },
    { name: 'Lương Thùy Linh', phone: '0912300402', email: 'thuylinh.luong@gmail.com', interest: 'IELTS', source: 'WEBSITE', stage: 'NEW', notes: 'Điền form đăng ký nhận tư vấn lộ trình IELTS từ 0 lên 6.5.' },
    { name: 'Đỗ Thị Hà', phone: '0912300403', email: 'dothiha@gmail.com', interest: 'TOEIC', source: 'HOTLINE', stage: 'NEW', notes: 'Gọi nhỡ hotline, cần tư vấn viên gọi lại ngay.' },
    { name: 'Nguyễn Thúc Thùy Tiên', phone: '0912300404', email: 'thuytien.ng@gmail.com', interest: 'IELTS', source: 'REFERRAL', stage: 'NEW', notes: 'Bạn học lớp IELTS-FD-K12 giới thiệu.' },
    { name: 'Huỳnh Nguyễn Mai Phương', phone: '0912300405', email: 'maiphuong.huynh@gmail.com', interest: 'IELTS', source: 'WEBSITE', stage: 'NEW', notes: 'Đăng ký nhận học bổng 20% và thi thử miễn phí.' },

    // LOST leads (3 leads từ chối / ngừng chăm sóc)
    { name: 'Phạm Hồng Phước', phone: '0912300501', email: 'hongphuoc.pham@gmail.com', interest: 'IELTS', source: 'FB_ADS', stage: 'LOST', lostReason: 'Nhà xa cơ sở đào tạo, muốn tìm lớp học 100% online', notes: 'Khách ở ngoại thành.' },
    { name: 'Trương Thế Vinh', phone: '0912300502', email: 'thevinh.truong@gmail.com', interest: 'TOEIC', source: 'WEBSITE', stage: 'LOST', lostReason: 'Đã chuyển sang đi du học sớm hơn dự kiến', notes: 'Hẹn giới thiệu em trai vào kỳ tới.' },
    { name: 'Lê Cát Trọng Lý', phone: '0912300503', email: 'trongly.le@gmail.com', interest: 'COMMUNICATION', source: 'HOTLINE', stage: 'LOST', lostReason: 'Bận lịch công tác dài hạn 6 tháng', notes: 'Liên hệ lại vào quý sau.' },
  ];

  const leadIdsByPhone: Record<string, number> = {};
  for (let i = 0; i < leadsSeeds.length; i++) {
    const l = leadsSeeds[i];
    const assignedSaleId = salesIds[i % salesIds.length] || 2;
    const existingLead = await query<{ id: number }>(
      `SELECT id FROM leads WHERE phone_number = $1 LIMIT 1`,
      [l.phone]
    );

    let leadId: number;
    if (existingLead.rows[0]) {
      leadId = existingLead.rows[0].id;
      await query(
        `UPDATE leads
         SET full_name = $1, email = $2, interest = $3, source_channel = $4, pipeline_stage = $5,
             lost_reason = $6, assigned_sales_id = $7, notes = $8
         WHERE id = $9`,
        [l.name, l.email, l.interest, l.source, l.stage, (l as any).lostReason || null, assignedSaleId, l.notes, leadId]
      );
    } else {
      const ins = await query<{ id: number }>(
        `INSERT INTO leads (full_name, phone_number, email, interest, source_channel, pipeline_stage, lost_reason, assigned_sales_id, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [l.name, l.phone, l.email, l.interest, l.source, l.stage, (l as any).lostReason || null, assignedSaleId, l.notes]
      );
      leadId = ins.rows[0].id;
    }
    leadIdsByPhone[l.phone] = leadId;
  }
  console.log(`✅ Đã đồng bộ ${Object.keys(leadIdsByPhone).length} hồ sơ khách hàng tiềm năng (Leads).`);

  // Thêm lịch sử chăm sóc (interaction_logs)
  const existingLogsCount = await query<{ cnt: string }>(`SELECT COUNT(*) AS cnt FROM interaction_logs`);
  if (Number(existingLogsCount.rows[0]?.cnt || 0) < 15) {
    const sampleConsultations = [
      { phone: '0912300301', type: 'CALL', level: 'HIGH', summary: 'Gọi tư vấn lần 1 (8 phút): Khách hàng rất quan tâm khóa IELTS Fighter 6.5, hỏi kỹ về giáo trình Cambridge và sĩ số tối đa 15 bạn/lớp.' },
      { phone: '0912300301', type: 'ZALO', level: 'HIGH', summary: 'Đã kết bạn Zalo và gửi brochure lộ trình IELTS 6.5 kèm lịch khai giảng tháng này.' },
      { phone: '0912300302', type: 'CALL', level: 'HIGH', summary: 'Tư vấn gói ưu đãi đăng ký đôi giảm 1.000.000đ/học viên. Khách hẹn bàn với bạn cùng phòng tối nay.' },
      { phone: '0912300303', type: 'CALL', level: 'MEDIUM', summary: 'Tư vấn khóa TOEIC Express 650+. Khách cần học ca 19:45-21:15 vì đi làm về muộn.' },
      { phone: '0912300201', type: 'CALL', level: 'HIGH', summary: 'Đã chốt lịch hẹn Placement Test tại trung tâm. Đã gửi tin nhắn SMS xác nhận phòng thi.' },
      { phone: '0912300205', type: 'MEETING', level: 'HIGH', summary: 'Tư vấn trực tiếp tại quầy sau khi có điểm thi đầu vào 5.5 Overall. Đề xuất lớp IELTS-65-K08.' },
      { phone: '0912300101', type: 'MEETING', level: 'HIGH', summary: 'Hoàn tất thủ tục nhập học và thu học phí đợt 1 tại quầy Giáo vụ.' },
      { phone: '0912300102', type: 'CALL', level: 'HIGH', summary: 'Gọi điện thông báo lịch khai giảng và dặn dò chuẩn bị tài liệu buổi học đầu tiên.' },
    ];
    for (let i = 0; i < sampleConsultations.length; i++) {
      const c = sampleConsultations[i];
      const leadId = leadIdsByPhone[c.phone];
      const userId = salesIds[i % salesIds.length] || 2;
      if (leadId) {
        await query(
          `INSERT INTO interaction_logs (lead_id, user_id, interaction_type, potential_level, content)
           VALUES ($1, $2, $3, $4, $5)`,
          [leadId, userId, c.type, c.level, c.summary]
        );
      }
    }
  }

  // 6. Đồng bộ Placement Tests (lịch thi hôm nay, ngày mai, đã có mặt chờ chấm, đã chấm điểm)
  const today = new Date();
  const fmtDate = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  const placementTestSeeds = [
    {
      phone: '0912300201',
      testDate: fmtDate(0),
      slot: '14:00-15:30',
      room: 'Room 101 - Tầng 1',
      testType: 'IELTS',
      status: 'SCHEDULED',
      l: null, r: null, w: null, s: null, overall: null,
      courseCode: null,
      feedback: 'Thí sinh hẹn tới sớm 15 phút để làm thủ tục.',
    },
    {
      phone: '0912300202',
      testDate: fmtDate(0),
      slot: '18:00-19:30',
      room: 'Room 101 - Tầng 1',
      testType: 'IELTS',
      status: 'SCHEDULED',
      l: null, r: null, w: null, s: null, overall: null,
      courseCode: null,
      feedback: 'Kiểm tra 4 kỹ năng IELTS đầu vào.',
    },
    {
      phone: '0912300203',
      testDate: fmtDate(1),
      slot: '09:00-10:30',
      room: 'Room 102 - Tầng 1',
      testType: 'TOEIC',
      status: 'SCHEDULED',
      l: null, r: null, w: null, s: null, overall: null,
      courseCode: null,
      feedback: 'Thi thử TOEIC rút gọn 60 phút.',
    },
    {
      phone: '0912300207',
      testDate: fmtDate(1),
      slot: '09:00-10:30',
      room: 'Room 102 - Tầng 1',
      testType: 'TOEIC',
      status: 'SCHEDULED',
      l: null, r: null, w: null, s: null, overall: null,
      courseCode: null,
      feedback: null,
    },
    {
      phone: '0912300204',
      testDate: fmtDate(0),
      slot: '09:00-10:30',
      room: 'Room 101 - Tầng 1',
      testType: 'IELTS',
      status: 'PRESENT', // Đã có mặt, chờ chấm điểm!
      l: null, r: null, w: null, s: null, overall: null,
      courseCode: null,
      feedback: 'Thí sinh đã nộp bài viết, đang chờ chấm Speaking.',
    },
    {
      phone: '0912300205',
      testDate: fmtDate(-1),
      slot: '18:00-19:30',
      room: 'Room 201 - Tầng 2',
      testType: 'IELTS',
      status: 'PRESENT',
      l: 6.0, r: 6.0, w: 5.0, s: 5.0, overall: 5.5,
      courseCode: 'IELTS-65',
      feedback: 'Nền tảng đọc nghe khá tốt, cần cải thiện cấu trúc câu phức trong Writing Task 2 và độ trôi chảy Speaking.',
    },
    {
      phone: '0912300206',
      testDate: fmtDate(-2),
      slot: '14:00-15:30',
      room: 'Room 101 - Tầng 1',
      testType: 'IELTS',
      status: 'PRESENT',
      l: 4.5, r: 5.0, w: 4.0, s: 4.5, overall: 4.5,
      courseCode: 'IELTS-FD',
      feedback: 'Từ vựng cơ bản ổn nhưng còn nhầm lẫn ngữ pháp thì hiện tại hoàn thành và phát âm âm cuối.',
    },
    {
      phone: '0912300208',
      testDate: fmtDate(-2),
      slot: '09:00-10:30',
      room: 'Room 102 - Tầng 1',
      testType: 'IELTS',
      status: 'ABSENT',
      l: null, r: null, w: null, s: null, overall: null,
      courseCode: null,
      feedback: 'Thí sinh báo bận đột xuất, cần Sales liên hệ xếp lại ca thi.',
    },
    {
      phone: '0912300102',
      testDate: fmtDate(-10),
      slot: '09:00-10:30',
      room: 'Room VIP 301 - Tầng 3',
      testType: 'IELTS',
      status: 'PRESENT',
      l: 7.5, r: 7.0, w: 6.5, s: 6.5, overall: 7.0,
      courseCode: 'IELTS-75',
      feedback: 'Khả năng ngôn ngữ xuất sắc, phản xạ tự nhiên, hoàn toàn đủ điều kiện vào lớp IELTS Master 7.5+.',
    },
  ];

  for (const pt of placementTestSeeds) {
    const leadId = leadIdsByPhone[pt.phone];
    if (!leadId) continue;

    const existingPt = await query<{ id: number }>(
      `SELECT id FROM placement_tests WHERE lead_id = $1 LIMIT 1`,
      [leadId]
    );
    const suggestedCourseId = pt.courseCode ? courseIdsByCode[pt.courseCode]?.id || null : null;

    if (existingPt.rows[0]) {
      await query(
        `UPDATE placement_tests
         SET test_date = $1, time_slot = $2, room = $3, test_type = $4, attendance_status = $5,
             listening_score = $6, reading_score = $7, writing_score = $8, speaking_score = $9,
             overall_score = $10, suggested_course_id = $11, examiner_feedback = $12
         WHERE id = $13`,
        [
          pt.testDate, pt.slot, pt.room, pt.testType, pt.status,
          pt.l, pt.r, pt.w, pt.s, pt.overall,
          suggestedCourseId, pt.feedback,
          existingPt.rows[0].id,
        ]
      );
    } else {
      await query(
        `INSERT INTO placement_tests
           (lead_id, test_date, time_slot, room, test_type, attendance_status,
            listening_score, reading_score, writing_score, speaking_score,
            overall_score, suggested_course_id, examiner_feedback)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          leadId, pt.testDate, pt.slot, pt.room, pt.testType, pt.status,
          pt.l, pt.r, pt.w, pt.s, pt.overall,
          suggestedCourseId, pt.feedback,
        ]
      );
    }
  }
  console.log(`✅ Đã đồng bộ dữ liệu lịch thi thử & kết quả Placement Test.`);

  // 7. Đồng bộ danh sách Học viên (Students) & Ghi danh (Enrollments) + Biên lai thu tiền (Payment Receipts)
  const studentRosterSeeds = [
    // Lớp 1: IELTS-FD-K12 (IN_PROGRESS - Ms. Emily) -> 7 học viên
    { code: 'STU-202603-0001', name: 'Nguyễn Minh Quân', phone: '0912300101', email: 'minhquan.ng@gmail.com', dob: '2005-04-12', addr: 'Cầu Giấy, Hà Nội', classCode: 'IELTS-FD-K12', discount: 500000, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 1 },
    { code: 'STU-202603-0002', name: 'Lê Hoàng Nam', phone: '0912300103', email: 'hoangnam.le@gmail.com', dob: '2006-08-21', addr: 'Đống Đa, Hà Nội', classCode: 'IELTS-FD-K12', discount: 0, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 1 },
    { code: 'STU-202603-0003', name: 'Ngô Thanh Trúc', phone: '0912300110', email: 'thanhtruc.ngo@gmail.com', dob: '2007-01-15', addr: 'Thanh Xuân, Hà Nội', classCode: 'IELTS-FD-K12', discount: 500000, paidRatio: 0.6, status: 'ENROLLED', monthsAgo: 1 },
    { code: 'STU-202603-0004', name: 'Trần Quốc Tuấn', phone: '0988100201', email: 'quoctuan.tran@gmail.com', dob: '2004-11-03', addr: 'Ba Đình, Hà Nội', classCode: 'IELTS-FD-K12', discount: 0, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 1 },
    { code: 'STU-202603-0005', name: 'Phạm Khánh Vy', phone: '0988100202', email: 'khanhvy.pham@gmail.com', dob: '2005-06-19', addr: 'Nam Từ Liêm, Hà Nội', classCode: 'IELTS-FD-K12', discount: 300000, paidRatio: 0.5, status: 'ENROLLED', monthsAgo: 1 },
    { code: 'STU-202603-0006', name: 'Hoàng Minh Châu', phone: '0988100203', email: 'minhchau.hoang@gmail.com', dob: '2006-02-28', addr: 'Hoàng Mai, Hà Nội', classCode: 'IELTS-FD-K12', discount: 0, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 1 },
    { code: 'STU-202603-0007', name: 'Đinh Tuấn Anh', phone: '0988100204', email: 'tuananh.dinh@gmail.com', dob: '2003-09-10', addr: 'Hai Bà Trưng, Hà Nội', classCode: 'IELTS-FD-K12', discount: 0, paidRatio: 0.4, status: 'DROPPED', monthsAgo: 1 },

    // Lớp 2: IELTS-65-K08 (OPEN - Ms. Emily) -> 6 học viên
    { code: 'STU-202604-0008', name: 'Phạm Thùy Dương', phone: '0912300104', email: 'thuyduong.pham@gmail.com', dob: '2004-05-14', addr: 'Cầu Giấy, Hà Nội', classCode: 'IELTS-65-K08', discount: 800000, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 0 },
    { code: 'STU-202604-0009', name: 'Hoàng Gia Bảo', phone: '0912300107', email: 'giabao.hoang@gmail.com', dob: '2005-12-01', addr: 'Tây Hồ, Hà Nội', classCode: 'IELTS-65-K08', discount: 500000, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 0 },
    { code: 'STU-202604-0010', name: 'Nguyễn Hà My', phone: '0988100205', email: 'hamy.nguyen@gmail.com', dob: '2004-07-22', addr: 'Đống Đa, Hà Nội', classCode: 'IELTS-65-K08', discount: 0, paidRatio: 0.5, status: 'ENROLLED', monthsAgo: 0 },
    { code: 'STU-202604-0011', name: 'Vũ Quang Huy', phone: '0988100206', email: 'quanghuy.vu@gmail.com', dob: '2003-03-17', addr: 'Thanh Xuân, Hà Nội', classCode: 'IELTS-65-K08', discount: 500000, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 0 },
    { code: 'STU-202604-0012', name: 'Lê Bảo Trâm', phone: '0988100207', email: 'baotram.le@gmail.com', dob: '2006-10-08', addr: 'Hà Đông, Hà Nội', classCode: 'IELTS-65-K08', discount: 0, paidRatio: 0.0, status: 'ENROLLED', monthsAgo: 0 },
    { code: 'STU-202604-0013', name: 'Trương Minh Nhật', phone: '0988100208', email: 'minhnhat.truong@gmail.com', dob: '2005-01-30', addr: 'Bắc Từ Liêm, Hà Nội', classCode: 'IELTS-65-K08', discount: 1000000, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 0 },

    // Lớp 3: IELTS-75-M03 (IN_PROGRESS - Mr. David) -> 5 học viên
    { code: 'STU-202603-0014', name: 'Trần Bảo Ngọc', phone: '0912300102', email: 'baongoc.tran@gmail.com', dob: '2008-03-25', addr: 'Ba Đình, Hà Nội', classCode: 'IELTS-75-M03', discount: 1000000, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 1 },
    { code: 'STU-202603-0015', name: 'Dương Minh Triết', phone: '0912300111', email: 'minhtriet.duong@gmail.com', dob: '2004-09-12', addr: 'Cầu Giấy, Hà Nội', classCode: 'IELTS-75-M03', discount: 500000, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 1 },
    { code: 'STU-202603-0016', name: 'Phan Thanh Hằng', phone: '0988100209', email: 'thanhhang.phan@gmail.com', dob: '2002-11-19', addr: 'Hoàn Kiếm, Hà Nội', classCode: 'IELTS-75-M03', discount: 0, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 1 },
    { code: 'STU-202603-0017', name: 'Đặng Quốc Việt', phone: '0988100210', email: 'quocviet.dang@gmail.com', dob: '2003-05-06', addr: 'Đống Đa, Hà Nội', classCode: 'IELTS-75-M03', discount: 500000, paidRatio: 0.7, status: 'ENROLLED', monthsAgo: 1 },
    { code: 'STU-202603-0018', name: 'Bùi Ngọc Ánh', phone: '0988100211', email: 'ngocanh.bui@gmail.com', dob: '2005-08-14', addr: 'Tây Hồ, Hà Nội', classCode: 'IELTS-75-M03', discount: 0, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 1 },

    // Lớp 4: TOEIC-650-T15 (FULL 8/8 - Ms. Sarah) -> 8 học viên (Full 100%)
    { code: 'STU-202603-0019', name: 'Vũ Đức Anh', phone: '0912300105', email: 'ducanh.vu@gmail.com', dob: '2004-02-18', addr: 'Hai Bà Trưng, Hà Nội', classCode: 'TOEIC-650-T15', discount: 300000, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 1 },
    { code: 'STU-202603-0020', name: 'Đỗ Tuấn Kiệt', phone: '0912300109', email: 'tuankiet.do@gmail.com', dob: '2004-07-07', addr: 'Hoàng Mai, Hà Nội', classCode: 'TOEIC-650-T15', discount: 0, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 1 },
    { code: 'STU-202603-0021', name: 'Nguyễn Văn Toàn', phone: '0988100212', email: 'vantoan.ng@gmail.com', dob: '2003-10-12', addr: 'Thanh Xuân, Hà Nội', classCode: 'TOEIC-650-T15', discount: 200000, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 1 },
    { code: 'STU-202603-0022', name: 'Trần Đình Trọng', phone: '0988100213', email: 'dinhtrong.tran@gmail.com', dob: '2003-04-25', addr: 'Gia Lâm, Hà Nội', classCode: 'TOEIC-650-T15', discount: 0, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 1 },
    { code: 'STU-202603-0023', name: 'Lê Thu Trang', phone: '0988100214', email: 'thutrang.le@gmail.com', dob: '2004-12-09', addr: 'Cầu Giấy, Hà Nội', classCode: 'TOEIC-650-T15', discount: 500000, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 2 },
    { code: 'STU-202603-0024', name: 'Hoàng Đức Thịnh', phone: '0988100215', email: 'ducthinh.hoang@gmail.com', dob: '2004-01-20', addr: 'Đống Đa, Hà Nội', classCode: 'TOEIC-650-T15', discount: 0, paidRatio: 0.6, status: 'ENROLLED', monthsAgo: 2 },
    { code: 'STU-202603-0025', name: 'Phạm Tuấn Hải', phone: '0988100216', email: 'tuanhai.pham@gmail.com', dob: '2002-05-19', addr: 'Hà Đông, Hà Nội', classCode: 'TOEIC-650-T15', discount: 0, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 2 },
    { code: 'STU-202603-0026', name: 'Võ Minh Trọng', phone: '0988100217', email: 'minhtrong.vo@gmail.com', dob: '2004-06-30', addr: 'Nam Từ Liêm, Hà Nội', classCode: 'TOEIC-650-T15', discount: 300000, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 2 },

    // Lớp 5: TOEIC-800-E04 (OPEN - Ms. Sarah) -> 4 học viên
    { code: 'STU-202604-0027', name: 'Đặng Khánh Linh', phone: '0912300106', email: 'khanhlinh.dang@gmail.com', dob: '2001-09-15', addr: 'Cầu Giấy, Hà Nội', classCode: 'TOEIC-800-E04', discount: 500000, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 0 },
    { code: 'STU-202604-0028', name: 'Nguyễn Hoàng Đức', phone: '0988100218', email: 'hoangduc.ng@gmail.com', dob: '2000-01-11', addr: 'Thanh Xuân, Hà Nội', classCode: 'TOEIC-800-E04', discount: 0, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 0 },
    { code: 'STU-202604-0029', name: 'Trần Minh Vương', phone: '0988100219', email: 'minhvuong.tran@gmail.com', dob: '1999-03-28', addr: 'Ba Đình, Hà Nội', classCode: 'TOEIC-800-E04', discount: 400000, paidRatio: 0.5, status: 'ENROLLED', monthsAgo: 0 },
    { code: 'STU-202604-0030', name: 'Lê Văn Xuân', phone: '0988100220', email: 'vanxuan.le@gmail.com', dob: '2002-08-04', addr: 'Hà Đông, Hà Nội', classCode: 'TOEIC-800-E04', discount: 0, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 0 },

    // Lớp 6: COMM-PRO-C09 (OPEN - Mr. Michael) -> 4 học viên
    { code: 'STU-202604-0031', name: 'Bùi Phương Thảo', phone: '0912300108', email: 'phuongthao.bui@gmail.com', dob: '1998-11-23', addr: 'Đống Đa, Hà Nội', classCode: 'COMM-PRO-C09', discount: 200000, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 0 },
    { code: 'STU-202604-0032', name: 'Lý Ngọc Hân', phone: '0912300112', email: 'ngochan.ly@gmail.com', dob: '2000-04-17', addr: 'Tây Hồ, Hà Nội', classCode: 'COMM-PRO-C09', discount: 0, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 0 },
    { code: 'STU-202604-0033', name: 'Phan Văn Đức', phone: '0988100221', email: 'vanduc.phan@gmail.com', dob: '1999-07-11', addr: 'Cầu Giấy, Hà Nội', classCode: 'COMM-PRO-C09', discount: 0, paidRatio: 0.5, status: 'ENROLLED', monthsAgo: 0 },
    { code: 'STU-202604-0034', name: 'Hồ Tấn Tài', phone: '0988100222', email: 'tantai.ho@gmail.com', dob: '2001-11-06', addr: 'Nam Từ Liêm, Hà Nội', classCode: 'COMM-PRO-C09', discount: 300000, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 0 },

    // Lớp 7: IELTS-FD-K14 (PLANNING - Mr. David) -> 3 học viên giữ chỗ sớm
    { code: 'STU-202604-0035', name: 'Nhâm Mạnh Dũng', phone: '0988100223', email: 'manhdung.nham@gmail.com', dob: '2005-04-12', addr: 'Thanh Xuân, Hà Nội', classCode: 'IELTS-FD-K14', discount: 500000, paidRatio: 0.5, status: 'ENROLLED', monthsAgo: 0 },
    { code: 'STU-202604-0036', name: 'Khuất Văn Khang', phone: '0988100224', email: 'vankhang.khuat@gmail.com', dob: '2006-05-11', addr: 'Hà Đông, Hà Nội', classCode: 'IELTS-FD-K14', discount: 500000, paidRatio: 1.0, status: 'ENROLLED', monthsAgo: 0 },
    { code: 'STU-202604-0037', name: 'Nguyễn Đình Bắc', phone: '0988100225', email: 'dinhbac.ng@gmail.com', dob: '2007-08-19', addr: 'Cầu Giấy, Hà Nội', classCode: 'IELTS-FD-K14', discount: 0, paidRatio: 0.0, status: 'ENROLLED', monthsAgo: 0 },

    // Lớp 8: IELTS-65-K05 (COMPLETED - Ms. Emily) -> 5 học viên đã hoàn thành khóa học
    { code: 'STU-202511-0038', name: 'Vũ Văn Thanh', phone: '0988100226', email: 'vanthanh.vu@gmail.com', dob: '2001-04-14', addr: 'Đống Đa, Hà Nội', classCode: 'IELTS-65-K05', discount: 500000, paidRatio: 1.0, status: 'COMPLETED', monthsAgo: 4 },
    { code: 'STU-202511-0039', name: 'Nguyễn Phong Hồng Duy', phone: '0988100227', email: 'hongduy.ng@gmail.com', dob: '2001-06-13', addr: 'Cầu Giấy, Hà Nội', classCode: 'IELTS-65-K05', discount: 0, paidRatio: 1.0, status: 'COMPLETED', monthsAgo: 4 },
    { code: 'STU-202511-0040', name: 'Lương Xuân Trường', phone: '0988100228', email: 'xuantruong.luong@gmail.com', dob: '2000-04-28', addr: 'Ba Đình, Hà Nội', classCode: 'IELTS-65-K05', discount: 800000, paidRatio: 1.0, status: 'COMPLETED', monthsAgo: 3 },
    { code: 'STU-202511-0041', name: 'Nguyễn Tuấn Anh', phone: '0988100229', email: 'tuananh.ng@gmail.com', dob: '2000-05-16', addr: 'Tây Hồ, Hà Nội', classCode: 'IELTS-65-K05', discount: 0, paidRatio: 1.0, status: 'COMPLETED', monthsAgo: 3 },
    { code: 'STU-202511-0042', name: 'Hà Đức Chinh', phone: '0988100230', email: 'ducchinh.ha@gmail.com', dob: '2002-09-22', addr: 'Thanh Xuân, Hà Nội', classCode: 'IELTS-65-K05', discount: 500000, paidRatio: 1.0, status: 'TRANSFERRED', monthsAgo: 3 },
  ];

  let receiptCounter = 100;
  for (let i = 0; i < studentRosterSeeds.length; i++) {
    const st = studentRosterSeeds[i];
    const classInfo = classMapByCode[st.classCode];
    if (!classInfo) continue;

    const linkedLeadId = leadIdsByPhone[st.phone] || null;

    let studentId: number;
    const existingStu = await query<{ id: number }>(
      `SELECT id FROM students WHERE phone_number = $1 OR student_code = $2 LIMIT 1`,
      [st.phone, st.code]
    );
    if (existingStu.rows[0]) {
      studentId = existingStu.rows[0].id;
      await query(
        `UPDATE students
         SET full_name = $1, email = $2, date_of_birth = $3, address = $4, lead_id = COALESCE(lead_id, $5)
         WHERE id = $6`,
        [st.name, st.email, st.dob, st.addr, linkedLeadId, studentId]
      );
    } else {
      const insStu = await query<{ id: number }>(
        `INSERT INTO students (student_code, lead_id, full_name, phone_number, email, date_of_birth, address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [st.code, linkedLeadId, st.name, st.phone, st.email, st.dob, st.addr]
      );
      studentId = insStu.rows[0].id;
    }

    const originalTuition = classInfo.tuition;
    const discountAmount = st.discount;
    const finalAmount = Math.max(0, originalTuition - discountAmount);
    const paidAmount = Math.round((finalAmount * st.paidRatio) / 1000) * 1000;
    const paymentStatus =
      paidAmount >= finalAmount ? 'FULLY_PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID';
    const consultantId = salesIds[i % salesIds.length] || 2;

    const existingEnr = await query<{ id: number }>(
      `SELECT id FROM enrollments WHERE student_id = $1 AND class_id = $2 LIMIT 1`,
      [studentId, classInfo.id]
    );

    let enrollmentId: number;
    if (existingEnr.rows[0]) {
      enrollmentId = existingEnr.rows[0].id;
      await query(
        `UPDATE enrollments
         SET original_tuition = $1, discount_amount = $2, final_amount = $3,
             payment_status = $4, status = $5, consultant_id = $6
         WHERE id = $7`,
        [originalTuition, discountAmount, finalAmount, paymentStatus, st.status, consultantId, enrollmentId]
      );
    } else {
      const insEnr = await query<{ id: number }>(
        `INSERT INTO enrollments
           (student_id, class_id, consultant_id, original_tuition, discount_amount, final_amount, payment_status, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          studentId,
          classInfo.id,
          consultantId,
          originalTuition,
          discountAmount,
          finalAmount,
          paymentStatus,
          st.status,
          st.status === 'COMPLETED'
            ? 'Đã hoàn thành khóa học đạt chuẩn đầu ra'
            : st.status === 'DROPPED'
            ? 'Xin bảo lưu kết quả do lịch thi học kỳ tại trường ĐH'
            : st.status === 'TRANSFERRED'
            ? 'Đã chuyển sang ca học cuối tuần'
            : 'Học viên đi học đầy đủ, tích cực trên lớp',
        ]
      );
      enrollmentId = insEnr.rows[0].id;
    }

    if (paidAmount > 0) {
      const existingRec = await query<{ id: number }>(
        `SELECT id FROM payment_receipts WHERE enrollment_id = $1 LIMIT 1`,
        [enrollmentId]
      );
      if (!existingRec.rows[0]) {
        receiptCounter++;
        const paymentDate = new Date(today);
        paymentDate.setMonth(paymentDate.getMonth() - st.monthsAgo);
        paymentDate.setDate(Math.max(1, Math.min(28, (i % 25) + 1)));
        const ym = `${paymentDate.getFullYear()}${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
        const receiptCode = `REC-${ym}-${String(receiptCounter).padStart(4, '0')}`;
        const method = i % 3 === 0 ? 'CASH' : 'BANK_TRANSFER';

        await query(
          `INSERT INTO payment_receipts
             (enrollment_id, receipt_code, amount, paid_at, payment_method, transaction_reference, receiver_id, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (receipt_code) DO NOTHING`,
          [
            enrollmentId,
            receiptCode,
            paidAmount,
            paymentDate.toISOString(),
            method,
            method === 'BANK_TRANSFER' ? `FT26${receiptCounter}9821` : null,
            academicIds[i % academicIds.length] || 3,
            paymentStatus === 'FULLY_PAID'
              ? `Thu 100% học phí lớp ${st.classCode}`
              : `Thu học phí đợt 1 lớp ${st.classCode}`,
          ]
        );
      }
    }
  }

  // Bổ sung học viên cho các lớp học cũ đang có < 3 học viên để mọi lớp đều có danh sách học viên
  const sparseClassesRes = await query<{
    id: number;
    class_code: string;
    max_capacity: number;
    standard_tuition: string;
  }>(`
    SELECT c.id, c.class_code, c.max_capacity, COALESCE(co.standard_tuition, 6000000) AS standard_tuition
    FROM classes c
    LEFT JOIN courses co ON co.id = c.course_id
    LEFT JOIN enrollments e ON e.class_id = c.id
    GROUP BY c.id, c.class_code, c.max_capacity, co.standard_tuition
    HAVING COUNT(e.id) < 3
  `);

  const extraStudentsRes = await query<{ id: number }>(`SELECT id FROM students ORDER BY id ASC LIMIT 10`);
  for (const sc of sparseClassesRes.rows) {
    const tuition = Number(sc.standard_tuition) || 6000000;
    for (let k = 0; k < Math.min(4, extraStudentsRes.rows.length); k++) {
      const stuId = extraStudentsRes.rows[k].id;
      const checkEnr = await query<{ id: number }>(
        `SELECT id FROM enrollments WHERE student_id = $1 AND class_id = $2 LIMIT 1`,
        [stuId, sc.id]
      );
      if (!checkEnr.rows[0]) {
        const enrIns = await query<{ id: number }>(
          `INSERT INTO enrollments
             (student_id, class_id, consultant_id, original_tuition, discount_amount, final_amount, payment_status, status, notes)
           VALUES ($1, $2, $3, $4, 0, $4, 'FULLY_PAID', 'ENROLLED', 'Học viên đăng ký khóa bổ trợ')
           RETURNING id`,
          [stuId, sc.id, salesIds[0] || 2, tuition]
        );
        receiptCounter++;
        const recCode = `REC-202604-${String(receiptCounter).padStart(4, '0')}`;
        await query(
          `INSERT INTO payment_receipts
             (enrollment_id, receipt_code, amount, payment_method, receiver_id, notes)
           VALUES ($1, $2, $3, 'BANK_TRANSFER', $4, $5)
           ON CONFLICT (receipt_code) DO NOTHING`,
          [enrIns.rows[0].id, recCode, tuition, academicIds[0] || 3, `Thu học phí lớp ${sc.class_code}`]
        );
      }
    }
  }

  // Đồng bộ lại chính xác current_enrolled và status của tất cả các lớp học
  await query(`
    UPDATE classes c
    SET current_enrolled = COALESCE((
      SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status = 'ENROLLED'
    ), 0)
  `);

  for (const [code, info] of Object.entries(classMapByCode)) {
    await query(
      `UPDATE classes
       SET status = CASE
         WHEN current_enrolled >= max_capacity THEN 'FULL'
         ELSE $1
       END
       WHERE class_code = $2`,
      [info.targetStatus === 'FULL' ? 'FULL' : info.targetStatus, code]
    );
  }

  console.log(`✅ Đã đồng bộ danh sách học viên, hồ sơ ghi danh và biên lai thu tiền cho toàn bộ các lớp học.`);

  // 8. Khởi tạo Nhật ký hoạt động (Audit Logs) mẫu cho Quản trị viên
  const existingAuditCount = await query<{ cnt: string }>(`SELECT COUNT(*) AS cnt FROM audit_logs`);
  if (Number(existingAuditCount.rows[0]?.cnt || 0) < 15) {
    const auditSeeds = [
      {
        userId: adminId,
        username: 'admin',
        fullName: 'Phạm Hoàng Long (Giám đốc TT)',
        role: 'ADMIN',
        action: 'LOGIN',
        module: 'AUTH',
        target: 'admin',
        desc: 'Quản trị viên Phạm Hoàng Long đăng nhập hệ thống quản trị EduFlow CRM',
        method: 'POST',
        path: '/api/auth/login',
        minutesAgo: 240,
      },
      {
        userId: adminId,
        username: 'admin',
        fullName: 'Phạm Hoàng Long (Giám đốc TT)',
        role: 'ADMIN',
        action: 'CREATE',
        module: 'STAFF',
        target: 'david_tran',
        desc: 'Tạo mới tài khoản giảng viên Thầy Trần Minh Đức (Mr. David) - Vai trò TEACHER',
        method: 'POST',
        path: '/api/staff',
        minutesAgo: 215,
      },
      {
        userId: adminId,
        username: 'admin',
        fullName: 'Phạm Hoàng Long (Giám đốc TT)',
        role: 'ADMIN',
        action: 'UPDATE',
        module: 'SETTINGS',
        target: 'Cấu hình hệ thống',
        desc: 'Cập nhật cấu hình quy tắc tự động phân bổ Lead (Round-Robin) và định mức sĩ số lớp học',
        method: 'PUT',
        path: '/api/settings',
        minutesAgo: 195,
      },
      {
        userId: salesIds[0] || 2,
        username: 'sale',
        fullName: 'Nguyễn Thị Lan Anh',
        role: 'SALES',
        action: 'LOGIN',
        module: 'AUTH',
        target: 'sale',
        desc: 'Nhân viên tư vấn Nguyễn Thị Lan Anh đăng nhập hệ thống',
        method: 'POST',
        path: '/api/auth/login',
        minutesAgo: 180,
      },
      {
        userId: salesIds[0] || 2,
        username: 'sale',
        fullName: 'Nguyễn Thị Lan Anh',
        role: 'SALES',
        action: 'CREATE',
        module: 'LEADS',
        target: 'Trần Tiểu Vy',
        desc: 'Tiếp nhận khách hàng tiềm năng mới: Trần Tiểu Vy (0912300401) từ kênh Facebook Ads',
        method: 'POST',
        path: '/api/leads',
        minutesAgo: 165,
      },
      {
        userId: salesIds[1] || 2,
        username: 'maianh',
        fullName: 'Trần Mai Anh',
        role: 'SALES',
        action: 'STATUS_CHANGE',
        module: 'LEADS',
        target: 'Nguyễn Quang Hải',
        desc: 'Chuyển trạng thái Lead Nguyễn Quang Hải từ NEW sang CONTACTING sau cuộc gọi tư vấn',
        method: 'PATCH',
        path: '/api/leads/15/stage',
        minutesAgo: 145,
      },
      {
        userId: salesIds[0] || 2,
        username: 'sale',
        fullName: 'Nguyễn Thị Lan Anh',
        role: 'SALES',
        action: 'BOOK_TEST',
        module: 'TESTS',
        target: 'Trịnh Quốc Khánh',
        desc: 'Đặt lịch hẹn Placement Test cho thí sinh Trịnh Quốc Khánh (Ca 14:00-15:30 - Room 101)',
        method: 'POST',
        path: '/api/placement-tests/book',
        minutesAgo: 120,
      },
      {
        userId: academicIds[0] || 3,
        username: 'academic',
        fullName: 'Trần Minh Tuấn',
        role: 'ACADEMIC',
        action: 'LOGIN',
        module: 'AUTH',
        target: 'academic',
        desc: 'Nhân viên giáo vụ Trần Minh Tuấn đăng nhập hệ thống',
        method: 'POST',
        path: '/api/auth/login',
        minutesAgo: 110,
      },
      {
        userId: academicIds[0] || 3,
        username: 'academic',
        fullName: 'Trần Minh Tuấn',
        role: 'ACADEMIC',
        action: 'STATUS_CHANGE',
        module: 'TESTS',
        target: 'Tạ Bích Ngọc',
        desc: 'Cập nhật điểm danh thí sinh Tạ Bích Ngọc -> Có mặt (PRESENT) tại phòng Room 101',
        method: 'PATCH',
        path: '/api/placement-tests/5/attendance',
        minutesAgo: 95,
      },
      {
        userId: academicIds[0] || 3,
        username: 'academic',
        fullName: 'Trần Minh Tuấn',
        role: 'ACADEMIC',
        action: 'SCORE',
        module: 'TESTS',
        target: 'Lương Thế Vinh (5.5)',
        desc: 'Nhập điểm Placement Test cho Lương Thế Vinh (Overall 5.5) -> Hệ thống gợi ý khóa IELTS Fighter 6.5',
        method: 'POST',
        path: '/api/placement-tests/6/score',
        minutesAgo: 80,
      },
      {
        userId: academicIds[0] || 3,
        username: 'academic',
        fullName: 'Trần Minh Tuấn',
        role: 'ACADEMIC',
        action: 'CREATE',
        module: 'CLASSES',
        target: 'IELTS-65-K08',
        desc: 'Khởi tạo lớp học mới IELTS-65-K08 (Giảng viên: ThS. Nguyễn Thị Thu Hà - Ms. Emily)',
        method: 'POST',
        path: '/api/classes',
        minutesAgo: 65,
      },
      {
        userId: academicIds[1] || 3,
        username: 'thanhha',
        fullName: 'Vũ Thanh Hà',
        role: 'ACADEMIC',
        action: 'ENROLL',
        module: 'STUDENTS',
        target: 'STU-202604-0008',
        desc: 'Xếp lớp học viên Phạm Thùy Dương (STU-202604-0008) vào lớp IELTS-65-K08',
        method: 'POST',
        path: '/api/enrollments',
        minutesAgo: 50,
      },
      {
        userId: academicIds[1] || 3,
        username: 'thanhha',
        fullName: 'Vũ Thanh Hà',
        role: 'ACADEMIC',
        action: 'PAYMENT',
        module: 'PAYMENTS',
        target: '9.000.000 đ',
        desc: 'Ghi nhận thanh toán học phí 9.000.000 VNĐ (Chuyển khoản) cho học viên Phạm Thùy Dương',
        method: 'POST',
        path: '/api/enrollments/8/payments',
        minutesAgo: 45,
      },
      {
        userId: academicIds[0] || 3,
        username: 'academic',
        fullName: 'Trần Minh Tuấn',
        role: 'ACADEMIC',
        action: 'ENROLL',
        module: 'STUDENTS',
        target: 'STU-202603-0026',
        desc: 'Xếp lớp học viên Võ Minh Trọng vào lớp TOEIC-650-T15 -> Lớp đạt sĩ số tối đa 8/8 và tự động khóa (FULL)',
        method: 'POST',
        path: '/api/enrollments',
        minutesAgo: 30,
      },
      {
        userId: userIdsByUsername['teacher'] || 4,
        username: 'teacher',
        fullName: 'ThS. Nguyễn Thị Thu Hà (Ms. Emily)',
        role: 'TEACHER',
        action: 'LOGIN',
        module: 'AUTH',
        target: 'teacher',
        desc: 'Giảng viên ThS. Nguyễn Thị Thu Hà (Ms. Emily) đăng nhập tra cứu lịch dạy và danh sách học viên',
        method: 'POST',
        path: '/api/auth/login',
        minutesAgo: 15,
      },
    ];

    for (const a of auditSeeds) {
      const createdAt = new Date(Date.now() - a.minutesAgo * 60 * 1000).toISOString();
      await query(
        `INSERT INTO audit_logs
           (user_id, username, user_full_name, user_role, action, module, target_id, target_label, description, ip_address, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, '127.0.0.1', $9, $10)`,
        [
          a.userId,
          a.username,
          a.fullName,
          a.role,
          a.action,
          a.module,
          a.target,
          a.desc,
          JSON.stringify({ method: a.method, path: a.path, statusCode: 200, target: a.target }),
          createdAt,
        ]
      );
    }
    console.log(`✅ Đã khởi tạo ${auditSeeds.length} bản ghi nhật ký hoạt động (audit_logs) mẫu.`);
  }

  console.log('🎉 Hoàn tất bổ sung dữ liệu demo phong phú cho EduFlow CRM!');
}

seedRichDemoData()
  .catch((err) => {
    console.error('❌ Lỗi khi seed dữ liệu mẫu:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
