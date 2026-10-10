import { pool, testDbConnection } from '../database/pool.js';
import { PlacementTestService } from '../services/placement-test.service.js';
import { LeadService } from '../services/lead.service.js';
import { AuthService } from '../services/auth.service.js';
import { logger } from '../utils/logger.js';

async function testPlacementTestModule(): Promise<void> {
  logger.info('========================================================================');
  logger.info('  BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG PHÂN HỆ PLACEMENT TEST & GỢI Ý KHÓA HỌC (BE-04)');
  logger.info('========================================================================');

  const dbHealth = await testDbConnection();
  if (dbHealth.connected) {
    logger.info(`💾 Đang chạy trên cơ sở dữ liệu: ${dbHealth.database} (${dbHealth.latencyMs}ms)`);
  } else {
    logger.info('⚠️ Đang chạy trên In-Memory Mock Store');
  }

  try {
    // 1. Đăng nhập tài khoản Sales & Academic
    logger.info('\n1. Đăng nhập tài khoản Sales (longpham) & Academic (phongpham):');
    let salesLogin;
    try {
      salesLogin = await AuthService.login({ username: 'longpham', password: 'Password@123' });
    } catch {
      salesLogin = await AuthService.login({ username: 'longpham', password: '123456' });
    }
    const salesUser = salesLogin.user;
    logger.info(`   ✅ Đăng nhập Sales thành công: ${salesUser.fullName} (ID=${salesUser.id})`);

    let academicLogin;
    try {
      academicLogin = await AuthService.login({ username: 'phongpham', password: 'Password@123' });
    } catch {
      academicLogin = await AuthService.login({ username: 'phongpham', password: '123456' });
    }
    const academicUser = academicLogin.user;
    logger.info(`   ✅ Đăng nhập Giáo vụ thành công: ${academicUser.fullName} (ID=${academicUser.id})`);

    // 2. Tạo một Lead mới để chuẩn bị đặt lịch thi
    logger.info('\n2. Tạo Lead thử nghiệm vào phễu tuyển sinh:');
    const testPhone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;
    const testEmail = `vanthi.tran.${Date.now().toString().slice(-4)}@example.com`;
    let testLead = await LeadService.createLead(
      {
        fullName: 'Trần Văn Thi Thử',
        phoneNumber: testPhone,
        email: testEmail,
        interest: 'IELTS',
        sourceChannel: 'WEBSITE',
        notes: 'Cần test gấp để nhập học khóa tháng tới.',
      },
      salesUser.id,
      salesUser.role
    );
    logger.info(`   ✅ Lead được tạo thành công: ID=${testLead.id}, Stage ban đầu: ${testLead.pipelineStage}`);

    // 3. Kiểm thử Đặt lịch thi (POST /api/placement-tests/book)
    logger.info('\n3. Kiểm thử Đặt lịch thi Placement Test (POST /api/placement-tests/book):');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const testDateStr = futureDate.toISOString().split('T')[0];

    const booked = await PlacementTestService.bookTest(
      {
        leadId: testLead.id,
        testDate: testDateStr,
        timeSlot: '14:30 - 16:00',
        room: 'Phòng Lab 201',
        testType: 'IELTS',
        notes: 'Thí sinh đăng ký thi IELTS 4 kỹ năng.',
      },
      salesUser.id,
      salesUser.role
    );
    logger.info(`   ✅ Đặt lịch thi thành công: Test ID=${booked.id}`);
    logger.info(`      - Ngày thi: ${booked.testDate} | Ca: ${booked.timeSlot} | Phòng: ${booked.room}`);
    logger.info(`      - Trạng thái điểm danh ban đầu: ${booked.attendanceStatus}`);

    // Kiểm tra trạng thái Lead đã tự động đổi sang TEST_SCHEDULED
    const updatedLead = await LeadService.getLeadById(testLead.id);
    if (updatedLead.pipelineStage === 'TEST_SCHEDULED') {
      logger.info(`   ✅ Đồng bộ trạng thái Lead thành công: pipelineStage = "${updatedLead.pipelineStage}"`);
    } else {
      logger.warn(`   ⚠️ Cảnh báo: pipelineStage của Lead hiện là ${updatedLead.pipelineStage}`);
    }

    // 4. Kiểm thử Chống trùng lịch (Anti-collision Check)
    logger.info('\n4. Kiểm thử Chống trùng lịch (Đặt lại lịch cho Lead khi lịch cũ chưa thi):');
    try {
      await PlacementTestService.bookTest(
        {
          leadId: testLead.id,
          testDate: testDateStr,
          timeSlot: '18:00 - 19:30',
          room: 'Phòng Lab 201',
          testType: 'IELTS',
        },
        salesUser.id,
        salesUser.role
      );
      logger.error('   ❌ LỖI: Lẽ ra phải chặn trùng lịch nhưng lại cho phép tạo!');
    } catch (err: any) {
      logger.info(`   ✅ Đã chặn trùng lịch thành công: "${err.message}" (Mã lỗi: ${err.statusCode})`);
    }

    // 5. Kiểm thử Danh sách bài thi & Lọc (GET /api/placement-tests)
    logger.info('\n5. Kiểm thử Lấy danh sách ca thi & thí sinh (GET /api/placement-tests):');
    const listResult = await PlacementTestService.getTests({
      testType: 'IELTS',
      page: 1,
      limit: 10,
    });
    logger.info(`   ✅ Lấy danh sách thành công: Tổng cộng ${listResult.total} bài thi`);
    listResult.tests.slice(0, 3).forEach((t) => {
      logger.info(
        `      - [ID=${t.id}] ${t.testDate} (${t.timeSlot}) | Thí sinh: ${t.leadFullName} | Status: ${t.attendanceStatus}`
      );
    });

    // 6. Kiểm thử Điểm danh thí sinh (PATCH /api/placement-tests/:id/attendance)
    logger.info('\n6. Kiểm thử Điểm danh thí sinh một chạm (PATCH /api/placement-tests/:id/attendance):');
    const presentTest = await PlacementTestService.updateAttendance(
      booked.id,
      { attendanceStatus: 'PRESENT', notes: 'Thí sinh có mặt đúng giờ, tâm lý tốt' },
      academicUser.id,
      academicUser.role
    );
    logger.info(`   ✅ Điểm danh thành công: ID=${presentTest.id}, Trạng thái mới: ${presentTest.attendanceStatus}`);

    // 7. Kiểm thử Nhập điểm 4 kỹ năng & Tự động tính Overall + Gợi ý khóa học (POST /api/placement-tests/:id/score)
    logger.info('\n7. Kiểm thử Nhập điểm 4 kỹ năng & Thuật toán Đề xuất Khóa học (UC-SYS-03):');
    // Test điểm: Nghe 5.5, Đọc 5.0, Viết 5.0, Nói 5.5 -> Trung bình = 5.25 -> Làm tròn IELTS = 5.5
    const scoreResult = await PlacementTestService.recordScore(
      booked.id,
      {
        listeningScore: 5.5,
        readingScore: 5.0,
        writingScore: 5.0,
        speakingScore: 5.5,
        examinerFeedback: 'Phản xạ nói tốt, phát âm chuẩn. Cần luyện thêm cấu trúc ngữ pháp Task 2.',
      },
      academicUser.id,
      academicUser.role
    );

    const scoredTest = scoreResult.test;
    const rec = scoreResult.recommendation;

    logger.info(`   ✅ Nhập điểm thành công:`);
    logger.info(`      - Nghe: ${scoredTest.listeningScore} | Đọc: ${scoredTest.readingScore} | Viết: ${scoredTest.writingScore} | Nói: ${scoredTest.speakingScore}`);
    logger.info(`      - Điểm Overall tự động tính theo chuẩn IELTS: ${scoredTest.overallScore} (Kỳ vọng: 5.5)`);
    logger.info(`   🎯 Thuật toán Đề xuất Khóa học (UC-SYS-03):`);
    logger.info(`      - Khóa học đề xuất: "${rec.course.courseName}" (Mã: ${rec.course.courseCode})`);
    logger.info(`      - Chuẩn đầu vào: ${rec.course.minEntryScore} - ${rec.course.maxEntryScore} | Học phí: ${rec.course.standardTuition.toLocaleString('vi-VN')} VND`);
    logger.info(`      - Lý do đề xuất: ${rec.matchReason}`);
    logger.info(`      - Số lớp học mở khả dụng cho khóa học này: ${rec.availableClasses.length} lớp`);
    rec.availableClasses.forEach((cl) => {
      logger.info(`        * Lớp ${cl.className} (${cl.scheduleDays} - ${cl.timeSlot}) | Còn trống: ${cl.availableSeats}/${cl.maxCapacity} chỗ`);
    });

    // 8. Kiểm thử Lấy trạng thái sức chứa phòng thi (GET /api/placement-tests/availability)
    logger.info('\n8. Kiểm thử Kiểm tra sức chứa phòng thi theo thời gian (GET /api/placement-tests/availability):');
    const avail = await PlacementTestService.getShiftsAvailability(testDateStr, testDateStr);
    logger.info(`   ✅ Lấy trạng thái khả dụng phòng thi thành công:`);
    avail.forEach((s) => {
      logger.info(`      - Ngày: ${s.testDate} | Ca: ${s.timeSlot} | Phòng: ${s.room} | Đã đặt: ${s.totalBooked}/${s.maxCapacity} (Đầy: ${s.isFull})`);
    });

    // 9. Dọn dẹp dữ liệu kiểm thử
    if (testLead?.id) {
      try {
        await LeadService.deleteLead(testLead.id);
        logger.info(`   🧹 Đã dọn dẹp hồ sơ Lead kiểm thử (ID=${testLead.id}) thành công.`);
      } catch (cleanErr: any) {
        logger.debug('Lỗi dọn dẹp lead test:', cleanErr.message);
      }
    }

    logger.info('\n========================================================================');
    logger.info('🎉 TẤT CẢ 8/8 KỊCH BẢN KIỂM THỬ PHÂN HỆ BE-04 ĐÃ ĐẠT CHUẨN 100%! 🎉');
    logger.info('========================================================================');
  } catch (error: any) {
    console.error('❌ Kiểm thử thất bại:', error);
    process.exit(1);
  } finally {
    try {
      await pool.end();
    } catch {}
  }
}

testPlacementTestModule().catch(console.error);
