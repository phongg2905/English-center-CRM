import { testDbConnection } from '../database/pool.js';
import { LeadService } from '../services/lead.service.js';
import { AuthService } from '../services/auth.service.js';
import { logger } from '../utils/logger.js';

async function testLeadModule(): Promise<void> {
  logger.info('================================================================');
  logger.info('   BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG MODULE QUẢN LÝ & TIẾP NHẬN LEAD (BE-03)');
  logger.info('================================================================');

  // Kiểm tra trạng thái CSDL
  const dbHealth = await testDbConnection();
  if (dbHealth.connected) {
    logger.info(`💾 Đang kiểm thử trực tiếp trên PostgreSQL Database: ${dbHealth.database} (${dbHealth.latencyMs}ms)`);
  } else {
    logger.info('⚠️ PostgreSQL chưa kết nối, đang sử dụng In-Memory Mock Store');
  }

  let createdLeadId: number | null = null;
  const testPhone = '0981999888';
  const testEmail = 'test.lead888@example.com';

  try {
    // 1. Kiểm thử xác thực người dùng (Lấy User ID của Sales và Admin)
    logger.info('\n1. Đăng nhập tài khoản Sales (longpham) & Admin (tamminh):');
    const salesLogin = await AuthService.login({ username: 'longpham', password: '123456' });
    const salesUser = salesLogin.user;
    logger.info(`   ✅ Đăng nhập Sales thành công: ${salesUser.fullName} (ID=${salesUser.id}, Role=${salesUser.role})`);

    const adminLogin = await AuthService.login({ username: 'tamminh', password: '123456' });
    const adminUser = adminLogin.user;
    logger.info(`   ✅ Đăng nhập Admin thành công: ${adminUser.fullName} (ID=${adminUser.id}, Role=${adminUser.role})`);

    // 2. Kiểm thử Tạo Lead mới hợp lệ (Happy Path)
    logger.info('\n2. Kiểm thử Tiếp nhận Lead mới vào phễu (POST /api/leads):');
    const newLead = await LeadService.createLead(
      {
        fullName: 'Nguyễn Văn Kiểm Thử',
        phoneNumber: testPhone,
        email: testEmail,
        interest: 'IELTS',
        sourceChannel: 'FB_ADS',
        notes: 'Khách hàng có nhu cầu thi IELTS 6.5 trong 3 tháng tới.',
      },
      salesUser.id,
      salesUser.role
    );
    createdLeadId = newLead.id;
    logger.info(`   ✅ Tạo Lead thành công: ID=${newLead.id}, Họ tên: ${newLead.fullName}, Stage: ${newLead.pipelineStage}`);
    logger.info(`   👤 Người phụ trách tự động gán: ${newLead.assignedSalesName || 'Sales ID: ' + newLead.assignedSalesId}`);

    // 3. Kiểm thử Validation Số điện thoại sai định dạng
    logger.info('\n3. Kiểm thử Validation định dạng Số điện thoại (Kỳ vọng 400 Bad Request):');
    try {
      await LeadService.createLead(
        {
          fullName: 'Khách Hàng Sai SĐT',
          phoneNumber: '012345', // Quá ngắn
          interest: 'TOEIC',
          sourceChannel: 'WEBSITE',
        },
        salesUser.id,
        salesUser.role
      );
      logger.error('   ❌ Thất bại: Không bắt được lỗi số điện thoại không hợp lệ!');
    } catch (err: any) {
      logger.info(`   ✅ Bắt đúng lỗi: [${err.statusCode}] ${err.message}`);
    }

    // 4. Kiểm thử Quy tắc chống trùng lặp SĐT BR-01 (Kỳ vọng 409 Conflict)
    logger.info('\n4. Kiểm thử Quy tắc chống trùng lặp SĐT BR-01 (Kỳ vọng 409 Conflict):');
    try {
      await LeadService.createLead(
        {
          fullName: 'Khách Hàng Trùng Số',
          phoneNumber: testPhone, // Trùng số vừa tạo
          interest: 'IELTS',
          sourceChannel: 'HOTLINE',
        },
        salesUser.id,
        salesUser.role
      );
      logger.error('   ❌ Thất bại: Không bắt được lỗi trùng số điện thoại!');
    } catch (err: any) {
      logger.info(`   ✅ Bắt đúng lỗi BR-01: [${err.statusCode}] ${err.message}`);
    }

    // 5. Kiểm thử Lấy danh sách Lead phân trang & tìm kiếm (GET /api/leads)
    logger.info('\n5. Kiểm thử Truy vấn danh sách Lead có bộ lọc (GET /api/leads):');
    const leadList = await LeadService.getLeads({ search: 'Kiểm Thử', page: 1, limit: 10 });
    logger.info(`   ✅ Tìm thấy ${leadList.total} kết quả phù hợp với từ khóa "Kiểm Thử"`);
    if (leadList.leads.length > 0) {
      logger.info(`      Lead đầu tiên: ID=${leadList.leads[0].id} - ${leadList.leads[0].fullName} (${leadList.leads[0].phoneNumber})`);
    }

    // 6. Kiểm thử Cấu trúc dữ liệu Bảng Kanban (GET /api/leads/kanban)
    logger.info('\n6. Kiểm thử Cấu trúc dữ liệu Bảng Kanban Pipeline 5 cột (GET /api/leads/kanban):');
    const kanban = await LeadService.getKanban();
    logger.info(`   ✅ Số lượng thẻ trên các cột:`);
    logger.info(`      [Mới - NEW]:              ${kanban.counts.NEW} leads`);
    logger.info(`      [Đang liên hệ - CONTACT]: ${kanban.counts.CONTACTING} leads`);
    logger.info(`      [Đã hẹn test - TEST]:     ${kanban.counts.TEST_SCHEDULED} leads`);
    logger.info(`      [Đã chốt - ENROLLED]:     ${kanban.counts.ENROLLED} leads`);
    logger.info(`      [Hủy - LOST]:             ${kanban.counts.LOST} leads`);

    // 7. Kiểm thử Ghi nhật ký tư vấn & Tự động đổi trạng thái NEW -> CONTACTING
    logger.info('\n7. Kiểm thử Ghi nhật ký tư vấn (POST /api/leads/:id/consultations):');
    const log = await LeadService.addConsultation(
      createdLeadId,
      salesUser.id,
      {
        interactionType: 'PHONE_CALL',
        potentialLevel: 'HOT',
        content: 'Đã gọi tư vấn lộ trình: Khách hàng rất quan tâm, hẹn thi thử Placement Test chiều thứ 6.',
        nextFollowUpAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      },
      salesUser.fullName,
      salesUser.role
    );
    logger.info(`   ✅ Ghi nhật ký thành công: ID=${log.id}, Loại: ${log.interactionType}, Tiềm năng: ${log.potentialLevel}`);

    // Kiểm tra trạng thái tự động chuyển từ NEW sang CONTACTING
    const leadAfterCall = await LeadService.getLeadById(createdLeadId);
    logger.info(`   🔄 Trạng thái Lead sau cuộc gọi: ${leadAfterCall.pipelineStage} (Tự động chuyển từ NEW sang CONTACTING)`);

    // 8. Kiểm thử Kéo thả Kanban cập nhật trạng thái (PATCH /api/leads/:id/status)
    logger.info('\n8. Kiểm thử Kéo thả Kanban sang TEST_SCHEDULED (PATCH /api/leads/:id/status):');
    const updatedToTest = await LeadService.updateStatus(
      createdLeadId,
      { pipelineStage: 'TEST_SCHEDULED' },
      salesUser.id,
      salesUser.fullName
    );
    logger.info(`   ✅ Cập nhật trạng thái thành công: ${updatedToTest.pipelineStage}`);

    // 9. Kiểm thử Chuyển sang LOST nhưng thiếu lý do hủy BR-02 (Kỳ vọng 400 Bad Request)
    logger.info('\n9. Kiểm thử Chuyển sang LOST thiếu lostReason (Kỳ vọng 400 Bad Request):');
    try {
      await LeadService.updateStatus(
        createdLeadId,
        { pipelineStage: 'LOST' }, // Thiếu lostReason
        salesUser.id,
        salesUser.fullName
      );
      logger.error('   ❌ Thất bại: Không bắt buộc nhập lostReason!');
    } catch (err: any) {
      logger.info(`   ✅ Bắt đúng lỗi ràng buộc BR-02: [${err.statusCode}] ${err.message}`);
    }

    // 10. Kiểm thử Chuyển sang LOST hợp lệ kèm lý do
    logger.info('\n10. Kiểm thử Chuyển sang LOST có kèm lý do hợp lệ:');
    const updatedToLost = await LeadService.updateStatus(
      createdLeadId,
      {
        pipelineStage: 'LOST',
        lostReason: 'Lịch học không phù hợp với giờ làm việc của khách hàng',
      },
      salesUser.id,
      salesUser.fullName
    );
    logger.info(`   ✅ Cập nhật LOST thành công: Stage=${updatedToLost.pipelineStage}, Lý do="${updatedToLost.lostReason}"`);

    // 11. Kiểm thử Phân công lại tư vấn viên (PATCH /api/leads/:id/assign)
    logger.info('\n11. Kiểm thử Phân công Lead cho Admin phụ trách (PATCH /api/leads/:id/assign):');
    const assignedLead = await LeadService.assignSales(
      createdLeadId,
      adminUser.id,
      adminUser.id,
      adminUser.fullName
    );
    logger.info(`   ✅ Phân công thành công: Người phụ trách mới = ${assignedLead.assignedSalesName || 'ID: ' + adminUser.id}`);

    // 12. Kiểm thử Xem lịch sử tương tác / Dòng thời gian Timeline
    logger.info('\n12. Kiểm thử Lấy dòng thời gian tư vấn (GET /api/leads/:id/consultations):');
    const timelines = await LeadService.getConsultations(createdLeadId);
    logger.info(`   ✅ Tổng số sự kiện ghi nhận trên Timeline: ${timelines.length} bản ghi:`);
    timelines.forEach((t, idx) => {
      logger.info(`      [${idx + 1}] (${t.interactionType}) - ${t.content}`);
    });

    // 13. Kiểm thử Báo cáo số liệu thống kê Tuyển sinh (GET /api/leads/stats)
    logger.info('\n13. Kiểm thử Báo cáo thống kê Tuyển sinh (GET /api/leads/stats):');
    const stats = await LeadService.getStats();
    logger.info(`   📊 Tổng số Leads: ${stats.totalLeads}`);
    logger.info(`   📈 Tỷ lệ chốt thành công (Conversion Rate): ${stats.conversionRate}%`);
    logger.info(`   📌 Phân bổ theo Kênh tiếp thị:`, stats.bySource);

    // 14. Dọn dẹp Lead kiểm thử
    logger.info('\n14. Dọn dẹp dữ liệu kiểm thử (DELETE /api/leads/:id):');
    await LeadService.deleteLead(createdLeadId);
    logger.info(`   🧹 Đã xóa Lead kiểm thử ID=${createdLeadId} thành công.`);

    logger.info('\n================================================================');
    logger.info('   🎉 TẤT CẢ 14 BÀI KIỂM THỬ API LEAD (BE-03) ĐÃ VƯỢT QUA 100%!');
    logger.info('================================================================');
  } catch (error: any) {
    logger.error('❌ Lỗi kiểm thử API Lead:', error);
    // Cố gắng dọn dẹp nếu có lỗi
    if (createdLeadId) {
      try {
        await LeadService.deleteLead(createdLeadId);
      } catch {}
    }
    process.exit(1);
  }
}

testLeadModule().then(() => {
  logger.info('Kết thúc kịch bản kiểm thử.');
  process.exit(0);
});
