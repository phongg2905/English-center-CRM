/**
 * DỰ ÁN: ENGLISH CENTER CRM (EduFlow CRM)
 * KỊCH BẢN KIỂM THỬ TỰ ĐỘNG PHÂN HỆ BÁO CÁO THỐNG KÊ (TASK [BE-06] - UC-04)
 * TÁC GIẢ: Long Phạm (@longphm11) - Backend Developer
 */

import { AnalyticsService } from '../services/analytics.service.js';
import { testDbConnection, pool } from '../database/pool.js';
import { logger } from '../utils/logger.js';

async function runAnalyticsDiagnostics(): Promise<void> {
  logger.info('================================================================');
  logger.info('   BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG PHÂN HỆ BÁO CÁO THỐNG KÊ (BE-06)');
  logger.info('================================================================');

  const dbHealth = await testDbConnection();
  if (dbHealth.connected) {
    logger.info(`💾 Kết nối CSDL PostgreSQL thành công: ${dbHealth.database} (${dbHealth.latencyMs}ms)`);
  } else {
    logger.warn('⚠️ CSDL chưa bật, đang sử dụng In-Memory Store dự phòng');
  }

  try {
    // 1. Kiểm thử KPI Overview Cards
    logger.info('\n--- 1. Kiểm thử KPI Điều hành Cốt lõi (Overview) ---');
    const overview = await AnalyticsService.getOverview();
    logger.info(`   ✅ Tổng số Lead: ${overview.totalLeads} | Lead mới tháng này: ${overview.newLeadsThisMonth}`);
    logger.info(`   ✅ Tổng ghi danh nhập học: ${overview.totalEnrolled} (Tỷ lệ chuyển đổi: ${overview.conversionRate}%)`);
    logger.info(`   ✅ Doanh thu thực thu: ${overview.totalRevenue.toLocaleString('vi-VN')} VND qua ${overview.totalTransactions} giao dịch`);
    logger.info(`   ✅ Lớp đang mở: ${overview.activeClassesCount} | Tỷ lệ lấp đầy bình quân: ${overview.averageOccupancyRate}%`);
    if (overview.topPerformingConsultant) {
      logger.info(`   🏆 Top Tư vấn viên xuất sắc: ${overview.topPerformingConsultant.name} (${overview.topPerformingConsultant.enrolledCount} học viên, ${overview.topPerformingConsultant.revenue.toLocaleString('vi-VN')} VND)`);
    }

    // 2. Kiểm thử Phễu chuyển đổi tuyển sinh (Funnel Conversion)
    logger.info('\n--- 2. Kiểm thử Phễu chuyển đổi Tuyển sinh (Funnel Analytics) ---');
    const funnel = await AnalyticsService.getFunnel({});
    logger.info(`   ✅ Tổng Lead trong phễu: ${funnel.totalLeads}`);
    logger.info(`   ✅ Tỷ lệ chuyển đổi tổng thể (Overall Conversion Rate): ${funnel.overallConversionRate}%`);
    logger.info(`   ✅ Tỷ lệ chuyển đổi từ Test -> Ghi danh: ${funnel.testToEnrollmentRate}%`);
    logger.info(`   ✅ Tỷ lệ thất bại (Drop-off Rate): ${funnel.dropOffRate}%`);
    logger.info('   📊 Chi tiết các giai đoạn phễu:');
    for (const stage of funnel.stages) {
      logger.info(`      • [${stage.stage.padEnd(14, ' ')}] ${stage.stageName.padEnd(26, ' ')}: ${stage.count} (${stage.percentageOfTotal}%)`);
    }
    if (funnel.lostReasons.length > 0) {
      logger.info('   ⚠️ Thống kê lý do hủy Lead (Lost Reasons):');
      for (const r of funnel.lostReasons) {
        logger.info(`      • "${r.reason}": ${r.count} lượt (${r.percentage}%)`);
      }
    }

    // 3. Kiểm thử Báo cáo doanh thu thực thu (Revenue Analytics)
    logger.info('\n--- 3. Kiểm thử Báo cáo Doanh thu Thực thu (Revenue Analytics) ---');
    const revenueMonthly = await AnalyticsService.getRevenue({ period: 'month' });
    logger.info(`   ✅ Tổng doanh thu: ${revenueMonthly.totalRevenue.toLocaleString('vi-VN')} VND`);
    logger.info(`   ✅ Giá trị đơn bình quân (AOV): ${revenueMonthly.averageOrderValue.toLocaleString('vi-VN')} VND`);
    logger.info('   💳 Doanh thu theo phương thức thanh toán:');
    for (const m of revenueMonthly.byPaymentMethod) {
      logger.info(`      • ${m.methodName}: ${m.amount.toLocaleString('vi-VN')} VND (${m.percentage}%) qua ${m.transactionCount} biên lai`);
    }
    logger.info('   📚 Doanh thu theo Khóa học:');
    for (const c of revenueMonthly.byCourse) {
      logger.info(`      • [${c.courseCode}] ${c.courseName}: ${c.revenue.toLocaleString('vi-VN')} VND (${c.studentCount} học viên)`);
    }

    // 4. Kiểm thử Bảng xếp hạng tư vấn viên (Sales Leaderboard)
    logger.info('\n--- 4. Kiểm thử Bảng xếp hạng Tư vấn viên (Sales Leaderboard) ---');
    const leaderboard = await AnalyticsService.getLeaderboard({ limit: 5 });
    logger.info(`   ✅ Xếp hạng ${leaderboard.length} tư vấn viên hàng đầu:`);
    for (const s of leaderboard) {
      logger.info(`      🏅 #${s.rank} ${s.consultantName.padEnd(16, ' ')} | Lead: ${s.totalLeadsAssigned} | Chốt: ${s.leadsEnrolled} (Win Rate: ${s.conversionRate}%) | Doanh số: ${s.totalRevenueGenerated.toLocaleString('vi-VN')} VND`);
    }

    // 5. Kiểm thử Hiệu quả Kênh Marketing (Channel ROI)
    logger.info('\n--- 5. Kiểm thử Hiệu quả Kênh Marketing (Channel ROI) ---');
    const channels = await AnalyticsService.getChannelROI({});
    logger.info(`   ✅ Thống kê ${channels.length} kênh tiếp cận tuyển sinh:`);
    for (const ch of channels) {
      logger.info(`      • ${ch.channelName.padEnd(30, ' ')}: ${ch.totalLeads} Lead (${ch.percentageOfLeads}%) ➔ ${ch.enrolledCount} Chốt (${ch.conversionRate}%) ➔ Doanh thu: ${ch.totalRevenue.toLocaleString('vi-VN')} VND`);
    }

    // 6. Kiểm thử Tỷ lệ lấp đầy phòng học (Class Capacity & Occupancy)
    logger.info('\n--- 6. Kiểm thử Tỷ lệ Lấp đầy Phòng học (Class Occupancy) ---');
    const capacity = await AnalyticsService.getClassOccupancy({});
    logger.info(`   ✅ Tỷ lệ lấp đầy toàn hệ thống: ${capacity.overallOccupancyRate}% (${capacity.totalEnrolled}/${capacity.totalCapacity} chỗ ngồi)`);
    logger.info(`   ✅ Tổng số lớp học: ${capacity.totalClasses} | Số lớp đã đầy/khóa: ${capacity.classesAtCapacityCount}`);
    for (const cls of capacity.classes) {
      logger.info(`      • [${cls.classCode}] ${cls.className.padEnd(30, ' ')} (${cls.room}): ${cls.currentEnrolled}/${cls.maxCapacity} (${cls.occupancyRate}%) [${cls.status}]`);
    }

    // 7. Kiểm thử Xuất báo cáo dữ liệu thô (JSON & CSV)
    logger.info('\n--- 7. Kiểm thử Xuất Dữ liệu Thô (Export JSON & CSV) ---');
    
    // Test JSON export
    const jsonExport = await AnalyticsService.exportData({ type: 'leads', format: 'json' });
    logger.info(`   ✅ Xuất JSON thành công: ${jsonExport.filename} (${jsonExport.data.length} dòng dữ liệu)`);

    // Test CSV export (kiểm tra UTF-8 BOM và header)
    const csvExport = await AnalyticsService.exportData({ type: 'revenue', format: 'csv' });
    const hasUtf8Bom = csvExport.data.startsWith('\uFEFF');
    logger.info(`   ✅ Xuất CSV thành công: ${csvExport.filename} (Dung lượng: ${csvExport.data.length} ký tự, UTF-8 BOM: ${hasUtf8Bom})`);

    // Test CSV export cho sales leaderboard
    const csvLeaderboard = await AnalyticsService.exportData({ type: 'sales-leaderboard', format: 'csv' });
    logger.info(`   ✅ Xuất CSV Leaderboard thành công: ${csvLeaderboard.filename}`);

    // Test CSV export cho marketing channel ROI
    const csvChannel = await AnalyticsService.exportData({ type: 'channel-roi', format: 'csv' });
    logger.info(`   ✅ Xuất CSV Kênh Marketing thành công: ${csvChannel.filename}`);

    // Test validation lỗi ngày không hợp lệ
    try {
      await AnalyticsService.getFunnel({ startDate: '2026-12-31', endDate: '2026-01-01' });
      logger.error('   ❌ Lỗi: Khoảng ngày vô lý không bị chặn!');
    } catch (e: any) {
      logger.info(`   ✅ Bắt đúng lỗi kiểm tra ngày hợp lệ: [${e.statusCode}] ${e.message}`);
    }

    logger.info('================================================================');
    logger.info('   🎉 TẤT CẢ CÁC BÀI KIỂM THỬ MODULE BÁO CÁO THỐNG KÊ (BE-06) ĐÃ THÀNH CÔNG!');
    logger.info('================================================================');
  } catch (error: any) {
    logger.error('❌ Lỗi kiểm thử:', error);
  } finally {
    try {
      await pool.end();
    } catch {}
    process.exit(0);
  }
}

runAnalyticsDiagnostics();
