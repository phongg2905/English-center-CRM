/**
 * DỰ ÁN: ENGLISH CENTER CRM (EduFlow CRM)
 * MODULE: ANALYTICS & REPORTING (UC-04, TASK BE-06)
 * TÁC GIẢ: Long Phạm (@longphm11) - Backend Developer
 */

import { query, isDbAvailable } from '../database/pool.js';
import {
  DateRangeFilter,
  FunnelAnalyticsResponse,
  FunnelStageStats,
  LostReasonStats,
  RevenueAnalyticsResponse,
  RevenuePeriod,
  RevenuePeriodStat,
  RevenueByMethodStat,
  RevenueByCourseStat,
  SalesConsultantPerformance,
  MarketingChannelROI,
  CapacityAnalyticsResponse,
  ClassOccupancyStat,
  ExecutiveOverviewResponse,
  ExportReportType,
} from '../types/analytics.types.js';
import { logger } from '../utils/logger.js';

const STAGE_NAME_MAP: Record<string, string> = {
  NEW: 'Mới tiếp nhận',
  CONTACTING: 'Đang liên hệ tư vấn',
  TEST_SCHEDULED: 'Đã hẹn/Thi Test đầu vào',
  ENROLLED: 'Đã ghi danh nhập học',
  LOST: 'Thất bại / Hủy chăm sóc',
};

const CHANNEL_NAME_MAP: Record<string, string> = {
  FB_ADS: 'Facebook Ads',
  WEBSITE: 'Website Trực tuyến',
  HOTLINE: 'Hotline Trung tâm',
  WALK_IN: 'Khách đến trực tiếp (Walk-in)',
  REFERRAL: 'Học viên / Bạn bè giới thiệu',
};

const METHOD_NAME_MAP: Record<string, string> = {
  BANK_TRANSFER: 'Chuyển khoản Ngân hàng',
  CASH: 'Tiền mặt tại Quầy',
};

export class AnalyticsRepository {
  /**
   * 1. Báo cáo tỷ lệ chuyển đổi phễu tuyển sinh (Funnel Analytics)
   */
  static async getFunnelAnalytics(filter: DateRangeFilter & {
    sourceChannel?: string;
    assignedSalesId?: number;
  }): Promise<FunnelAnalyticsResponse> {
    if (isDbAvailable()) {
      try {
        const conditions: string[] = ['1=1'];
        const params: any[] = [];
        let paramIndex = 1;

        if (filter.startDate) {
          conditions.push(`created_at >= $${paramIndex++}`);
          params.push(filter.startDate);
        }
        if (filter.endDate) {
          conditions.push(`created_at <= $${paramIndex++}`);
          params.push(filter.endDate);
        }
        if (filter.sourceChannel) {
          conditions.push(`source_channel = $${paramIndex++}`);
          params.push(filter.sourceChannel);
        }
        if (filter.assignedSalesId) {
          conditions.push(`assigned_sales_id = $${paramIndex++}`);
          params.push(filter.assignedSalesId);
        }

        const whereClause = conditions.join(' AND ');

        // Đếm tổng số lead và số lượng từng stage
        const stageSql = `
          SELECT 
            pipeline_stage, 
            COUNT(*) as count
          FROM leads
          WHERE ${whereClause}
          GROUP BY pipeline_stage;
        `;
        const stageRes = await query(stageSql, params);

        const stageCounts: Record<string, number> = {
          NEW: 0,
          CONTACTING: 0,
          TEST_SCHEDULED: 0,
          ENROLLED: 0,
          LOST: 0,
        };

        let totalLeads = 0;
        for (const row of stageRes.rows) {
          const count = Number(row.count);
          stageCounts[row.pipeline_stage] = count;
          totalLeads += count;
        }

        // Lấy thống kê lý do hủy Lead (Lost Reasons)
        const lostSql = `
          SELECT 
            COALESCE(lost_reason, 'Chưa rõ lý do') as reason,
            COUNT(*) as count
          FROM leads
          WHERE ${whereClause} AND pipeline_stage = 'LOST'
          GROUP BY COALESCE(lost_reason, 'Chưa rõ lý do')
          ORDER BY count DESC;
        `;
        const lostRes = await query(lostSql, params);

        const lostReasons: LostReasonStats[] = lostRes.rows.map((row) => {
          const count = Number(row.count);
          return {
            reason: row.reason,
            count,
            percentage: stageCounts.LOST > 0 ? Number(((count / stageCounts.LOST) * 100).toFixed(1)) : 0,
          };
        });

        // Xây dựng danh sách các bước phễu chính (NEW -> CONTACTING -> TEST_SCHEDULED -> ENROLLED)
        const orderedStages = ['NEW', 'CONTACTING', 'TEST_SCHEDULED', 'ENROLLED', 'LOST'];
        let prevCount = totalLeads;

        const stages: FunnelStageStats[] = orderedStages.map((st) => {
          const count = stageCounts[st] || 0;
          const percentageOfTotal = totalLeads > 0 ? Number(((count / totalLeads) * 100).toFixed(1)) : 0;
          let conversionFromPrevious = 100;
          if (st !== 'NEW' && st !== 'LOST') {
            conversionFromPrevious = prevCount > 0 ? Number(((count / prevCount) * 100).toFixed(1)) : 0;
            prevCount = count;
          }
          return {
            stage: st,
            stageName: STAGE_NAME_MAP[st] || st,
            count,
            percentageOfTotal,
            conversionFromPrevious,
          };
        });

        const overallConversionRate = totalLeads > 0
          ? Number(((stageCounts.ENROLLED / totalLeads) * 100).toFixed(1))
          : 0;

        const testToEnrollmentRate = stageCounts.TEST_SCHEDULED > 0
          ? Number(((stageCounts.ENROLLED / stageCounts.TEST_SCHEDULED) * 100).toFixed(1))
          : 0;

        const dropOffRate = totalLeads > 0
          ? Number(((stageCounts.LOST / totalLeads) * 100).toFixed(1))
          : 0;

        return {
          totalLeads,
          stages,
          overallConversionRate,
          testToEnrollmentRate,
          dropOffRate,
          lostReasons,
        };
      } catch (err: any) {
        logger.error('Lỗi khi truy vấn Funnel Analytics:', err.message);
      }
    }

    // Mock In-memory fallback
    return {
      totalLeads: 10,
      stages: [
        { stage: 'NEW', stageName: 'Mới tiếp nhận', count: 2, percentageOfTotal: 20.0, conversionFromPrevious: 100 },
        { stage: 'CONTACTING', stageName: 'Đang liên hệ tư vấn', count: 2, percentageOfTotal: 20.0, conversionFromPrevious: 100 },
        { stage: 'TEST_SCHEDULED', stageName: 'Đã hẹn/Thi Test đầu vào', count: 2, percentageOfTotal: 20.0, conversionFromPrevious: 100 },
        { stage: 'ENROLLED', stageName: 'Đã ghi danh nhập học', count: 2, percentageOfTotal: 20.0, conversionFromPrevious: 100 },
        { stage: 'LOST', stageName: 'Thất bại / Hủy chăm sóc', count: 2, percentageOfTotal: 20.0, conversionFromPrevious: 0 },
      ],
      overallConversionRate: 20.0,
      testToEnrollmentRate: 100.0,
      dropOffRate: 20.0,
      lostReasons: [
        { reason: 'Học phí vượt quá ngân sách tài chính gia đình', count: 1, percentage: 50.0 },
        { reason: 'Lịch học không khớp ca làm việc/học chính khóa', count: 1, percentage: 50.0 },
      ],
    };
  }

  /**
   * 2. Báo cáo doanh thu thực thu theo tuần/tháng/quý (Revenue Analytics)
   */
  static async getRevenueAnalytics(filter: DateRangeFilter & {
    period?: RevenuePeriod;
    paymentMethod?: string;
  }): Promise<RevenueAnalyticsResponse> {
    const period = filter.period || 'month';

    if (isDbAvailable()) {
      try {
        const conditions: string[] = ['1=1'];
        const params: any[] = [];
        let paramIndex = 1;

        if (filter.startDate) {
          conditions.push(`paid_at >= $${paramIndex++}`);
          params.push(filter.startDate);
        }
        if (filter.endDate) {
          conditions.push(`paid_at <= $${paramIndex++}`);
          params.push(filter.endDate);
        }
        if (filter.paymentMethod) {
          conditions.push(`payment_method = $${paramIndex++}`);
          params.push(filter.paymentMethod);
        }

        const whereClause = conditions.join(' AND ');

        // Tổng doanh thu & số giao dịch
        const summarySql = `
          SELECT 
            COALESCE(SUM(amount), 0) as total_revenue,
            COUNT(*) as total_transactions,
            COALESCE(AVG(amount), 0) as avg_order_value
          FROM payment_receipts
          WHERE ${whereClause};
        `;
        const summaryRes = await query(summarySql, params);
        const totalRevenue = Number(summaryRes.rows[0]?.total_revenue || 0);
        const totalTransactions = Number(summaryRes.rows[0]?.total_transactions || 0);
        const averageOrderValue = Number(Number(summaryRes.rows[0]?.avg_order_value || 0).toFixed(0));

        // Phân rã theo khoảng thời gian (day, week, month, quarter, year)
        let dateTruncFormat = "TO_CHAR(paid_at, 'YYYY-MM')";
        if (period === 'day') {
          dateTruncFormat = "TO_CHAR(paid_at, 'YYYY-MM-DD')";
        } else if (period === 'week') {
          dateTruncFormat = "TO_CHAR(DATE_TRUNC('week', paid_at), 'YYYY-\"W\"IW')";
        } else if (period === 'quarter') {
          dateTruncFormat = "'Q' || TO_CHAR(paid_at, 'Q-YYYY')";
        } else if (period === 'year') {
          dateTruncFormat = "TO_CHAR(paid_at, 'YYYY')";
        }

        const periodSql = `
          SELECT 
            ${dateTruncFormat} as period_label,
            COALESCE(SUM(amount), 0) as revenue,
            COUNT(*) as transaction_count
          FROM payment_receipts
          WHERE ${whereClause}
          GROUP BY ${dateTruncFormat}
          ORDER BY period_label ASC;
        `;
        const periodRes = await query(periodSql, params);

        const periods: RevenuePeriodStat[] = periodRes.rows.map((row) => ({
          period: row.period_label,
          revenue: Number(row.revenue),
          transactionCount: Number(row.transaction_count),
        }));

        // Phân rã theo phương thức thanh toán
        const methodSql = `
          SELECT 
            payment_method,
            COALESCE(SUM(amount), 0) as amount,
            COUNT(*) as transaction_count
          FROM payment_receipts
          WHERE ${whereClause}
          GROUP BY payment_method
          ORDER BY amount DESC;
        `;
        const methodRes = await query(methodSql, params);

        const byPaymentMethod: RevenueByMethodStat[] = methodRes.rows.map((row) => {
          const amount = Number(row.amount);
          return {
            paymentMethod: row.payment_method,
            methodName: METHOD_NAME_MAP[row.payment_method] || row.payment_method,
            amount,
            transactionCount: Number(row.transaction_count),
            percentage: totalRevenue > 0 ? Number(((amount / totalRevenue) * 100).toFixed(1)) : 0,
          };
        });

        // Phân rã theo khóa học
        const courseSql = `
          SELECT 
            c.id as course_id,
            c.course_code,
            c.course_name,
            COALESCE(SUM(pr.amount), 0) as revenue,
            COUNT(DISTINCT e.student_id) as student_count
          FROM payment_receipts pr
          JOIN enrollments e ON pr.enrollment_id = e.id
          JOIN classes cl ON e.class_id = cl.id
          JOIN courses c ON cl.course_id = c.id
          WHERE ${whereClause.replace(/paid_at/g, 'pr.paid_at')}
          GROUP BY c.id, c.course_code, c.course_name
          ORDER BY revenue DESC;
        `;
        const courseRes = await query(courseSql, params);

        const byCourse: RevenueByCourseStat[] = courseRes.rows.map((row) => ({
          courseId: row.course_id,
          courseCode: row.course_code,
          courseName: row.course_name,
          revenue: Number(row.revenue),
          studentCount: Number(row.student_count),
        }));

        return {
          totalRevenue,
          totalTransactions,
          averageOrderValue,
          period,
          periods,
          byPaymentMethod,
          byCourse,
        };
      } catch (err: any) {
        logger.error('Lỗi khi truy vấn Revenue Analytics:', err.message);
      }
    }

    // Mock fallback
    return {
      totalRevenue: 25500000,
      totalTransactions: 3,
      averageOrderValue: 8500000,
      period,
      periods: [
        { period: '2026-10', revenue: 25500000, transactionCount: 3 },
      ],
      byPaymentMethod: [
        { paymentMethod: 'BANK_TRANSFER', methodName: 'Chuyển khoản Ngân hàng', amount: 20000000, transactionCount: 2, percentage: 78.4 },
        { paymentMethod: 'CASH', methodName: 'Tiền mặt tại Quầy', amount: 5500000, transactionCount: 1, percentage: 21.6 },
      ],
      byCourse: [
        { courseId: 2, courseCode: 'IELTS-FIGHT', courseName: 'IELTS Bứt phá (Target 6.5)', revenue: 17000000, studentCount: 2 },
        { courseId: 1, courseCode: 'IELTS-FOUND', courseName: 'IELTS Nền tảng (Foundation)', revenue: 8500000, studentCount: 1 },
      ],
    };
  }

  /**
   * 3. Bảng xếp hạng hiệu suất tư vấn viên (Sales Consultant Leaderboard)
   */
  static async getSalesLeaderboard(filter: DateRangeFilter & { limit?: number }): Promise<SalesConsultantPerformance[]> {
    const limit = filter.limit || 10;

    if (isDbAvailable()) {
      try {
        const conditions: string[] = ['1=1'];
        const params: any[] = [];
        let paramIndex = 1;

        if (filter.startDate) {
          conditions.push(`l.created_at >= $${paramIndex++}`);
          params.push(filter.startDate);
        }
        if (filter.endDate) {
          conditions.push(`l.created_at <= $${paramIndex++}`);
          params.push(filter.endDate);
        }

        const whereClause = conditions.join(' AND ');

        const sql = `
          SELECT 
            u.id as consultant_id,
            u.full_name as consultant_name,
            u.email as consultant_email,
            COUNT(l.id) as total_leads_assigned,
            COUNT(CASE WHEN l.pipeline_stage = 'ENROLLED' THEN 1 END) as leads_enrolled,
            COUNT(CASE WHEN l.pipeline_stage = 'LOST' THEN 1 END) as leads_lost,
            COALESCE(
              SUM(
                CASE WHEN l.pipeline_stage = 'ENROLLED' 
                THEN COALESCE(e.final_amount, 0) 
                ELSE 0 END
              ), 0
            ) as total_revenue
          FROM users u
          JOIN roles r ON u.role_id = r.id
          LEFT JOIN leads l ON l.assigned_sales_id = u.id AND ${whereClause}
          LEFT JOIN students s ON s.lead_id = l.id
          LEFT JOIN enrollments e ON e.student_id = s.id
          WHERE r.role_code IN ('SALES', 'ADMIN') AND u.is_active = TRUE
          GROUP BY u.id, u.full_name, u.email
          ORDER BY total_revenue DESC, leads_enrolled DESC;
        `;
        const res = await query(sql, params);

        return res.rows.slice(0, limit).map((row, index) => {
          const totalAssigned = Number(row.total_leads_assigned || 0);
          const enrolled = Number(row.leads_enrolled || 0);
          const lost = Number(row.leads_lost || 0);
          const totalRev = Number(row.total_revenue || 0);
          const winRate = totalAssigned > 0 ? Number(((enrolled / totalAssigned) * 100).toFixed(1)) : 0;
          const avgDeal = enrolled > 0 ? Number((totalRev / enrolled).toFixed(0)) : 0;

          return {
            rank: index + 1,
            consultantId: row.consultant_id,
            consultantName: row.consultant_name,
            consultantEmail: row.consultant_email,
            totalLeadsAssigned: totalAssigned,
            leadsEnrolled: enrolled,
            leadsLost: lost,
            conversionRate: winRate,
            totalRevenueGenerated: totalRev,
            averageDealValue: avgDeal,
          };
        });
      } catch (err: any) {
        logger.error('Lỗi khi truy vấn Sales Leaderboard:', err.message);
      }
    }

    // Mock fallback
    return [
      {
        rank: 1,
        consultantId: 2,
        consultantName: 'Long Phạm',
        consultantEmail: 'longpham@crm.edu.vn',
        totalLeadsAssigned: 8,
        leadsEnrolled: 2,
        leadsLost: 2,
        conversionRate: 25.0,
        totalRevenueGenerated: 17000000,
        averageDealValue: 8500000,
      },
      {
        rank: 2,
        consultantId: 1,
        consultantName: 'Tam Minh',
        consultantEmail: 'tamminh@crm.edu.vn',
        totalLeadsAssigned: 2,
        leadsEnrolled: 0,
        leadsLost: 0,
        conversionRate: 0.0,
        totalRevenueGenerated: 0,
        averageDealValue: 0,
      },
    ];
  }

  /**
   * 4. Báo cáo hiệu quả từng kênh Marketing (Channel ROI Analytics)
   */
  static async getMarketingChannelROI(filter: DateRangeFilter): Promise<MarketingChannelROI[]> {
    if (isDbAvailable()) {
      try {
        const conditions: string[] = ['1=1'];
        const params: any[] = [];
        let paramIndex = 1;

        if (filter.startDate) {
          conditions.push(`l.created_at >= $${paramIndex++}`);
          params.push(filter.startDate);
        }
        if (filter.endDate) {
          conditions.push(`l.created_at <= $${paramIndex++}`);
          params.push(filter.endDate);
        }

        const whereClause = conditions.join(' AND ');

        const sql = `
          WITH channel_leads AS (
            SELECT 
              source_channel,
              COUNT(*) as total_leads,
              COUNT(CASE WHEN pipeline_stage = 'ENROLLED' THEN 1 END) as enrolled_count
            FROM leads l
            WHERE ${whereClause}
            GROUP BY source_channel
          ),
          channel_revenue AS (
            SELECT 
              l.source_channel,
              COALESCE(SUM(pr.amount), 0) as total_revenue
            FROM leads l
            JOIN students s ON s.lead_id = l.id
            JOIN enrollments e ON e.student_id = s.id
            JOIN payment_receipts pr ON pr.enrollment_id = e.id
            WHERE ${whereClause}
            GROUP BY l.source_channel
          )
          SELECT 
            cl.source_channel,
            cl.total_leads,
            cl.enrolled_count,
            COALESCE(cr.total_revenue, 0) as total_revenue,
            SUM(cl.total_leads) OVER() as grand_total_leads
          FROM channel_leads cl
          LEFT JOIN channel_revenue cr ON cl.source_channel = cr.source_channel
          ORDER BY total_revenue DESC, total_leads DESC;
        `;
        const res = await query(sql, params);

        return res.rows.map((row) => {
          const totalLeads = Number(row.total_leads || 0);
          const grandTotal = Number(row.grand_total_leads || 1);
          const enrolled = Number(row.enrolled_count || 0);
          const revenue = Number(row.total_revenue || 0);
          const conversionRate = totalLeads > 0 ? Number(((enrolled / totalLeads) * 100).toFixed(1)) : 0;
          const avgTuition = enrolled > 0 ? Number((revenue / enrolled).toFixed(0)) : 0;
          const percentageOfLeads = Number(((totalLeads / grandTotal) * 100).toFixed(1));

          return {
            channel: row.source_channel,
            channelName: CHANNEL_NAME_MAP[row.source_channel] || row.source_channel,
            totalLeads,
            percentageOfLeads,
            enrolledCount: enrolled,
            conversionRate,
            totalRevenue: revenue,
            averageTuitionPerEnrollment: avgTuition,
          };
        });
      } catch (err: any) {
        logger.error('Lỗi khi truy vấn Marketing Channel ROI:', err.message);
      }
    }

    // Mock fallback
    return [
      {
        channel: 'FB_ADS',
        channelName: 'Facebook Ads',
        totalLeads: 4,
        percentageOfLeads: 40.0,
        enrolledCount: 1,
        conversionRate: 25.0,
        totalRevenue: 8500000,
        averageTuitionPerEnrollment: 8500000,
      },
      {
        channel: 'HOTLINE',
        channelName: 'Hotline Trung tâm',
        totalLeads: 2,
        percentageOfLeads: 20.0,
        enrolledCount: 1,
        conversionRate: 50.0,
        totalRevenue: 8500000,
        averageTuitionPerEnrollment: 8500000,
      },
      {
        channel: 'WEBSITE',
        channelName: 'Website Trực tuyến',
        totalLeads: 2,
        percentageOfLeads: 20.0,
        enrolledCount: 0,
        conversionRate: 0.0,
        totalRevenue: 0,
        averageTuitionPerEnrollment: 0,
      },
      {
        channel: 'WALK_IN',
        channelName: 'Khách đến trực tiếp (Walk-in)',
        totalLeads: 1,
        percentageOfLeads: 10.0,
        enrolledCount: 0,
        conversionRate: 0.0,
        totalRevenue: 0,
        averageTuitionPerEnrollment: 0,
      },
      {
        channel: 'REFERRAL',
        channelName: 'Học viên / Bạn bè giới thiệu',
        totalLeads: 1,
        percentageOfLeads: 10.0,
        enrolledCount: 0,
        conversionRate: 0.0,
        totalRevenue: 0,
        averageTuitionPerEnrollment: 0,
      },
    ];
  }

  /**
   * 5. Thống kê tỷ lệ lấp đầy phòng học và lớp học (Class Occupancy Analytics)
   */
  static async getClassOccupancy(filter: { courseId?: number; status?: string }): Promise<CapacityAnalyticsResponse> {
    if (isDbAvailable()) {
      try {
        const conditions: string[] = ['1=1'];
        const params: any[] = [];
        let paramIndex = 1;

        if (filter.courseId) {
          conditions.push(`cl.course_id = $${paramIndex++}`);
          params.push(filter.courseId);
        }
        if (filter.status) {
          conditions.push(`cl.status = $${paramIndex++}`);
          params.push(filter.status);
        }

        const whereClause = conditions.join(' AND ');

        const sql = `
          SELECT 
            cl.id as class_id,
            cl.class_code,
            cl.class_name,
            c.course_name,
            cl.room,
            cl.max_capacity,
            cl.current_enrolled,
            cl.status,
            ROUND((cl.current_enrolled::numeric / cl.max_capacity::numeric) * 100, 1) as occupancy_rate
          FROM classes cl
          JOIN courses c ON cl.course_id = c.id
          WHERE ${whereClause}
          ORDER BY occupancy_rate DESC, cl.start_date ASC;
        `;
        const res = await query(sql, params);

        let totalCapacity = 0;
        let totalEnrolled = 0;
        let classesAtCapacityCount = 0;

        const classes: ClassOccupancyStat[] = res.rows.map((row) => {
          const max = Number(row.max_capacity);
          const enrolled = Number(row.current_enrolled);
          const rate = Number(row.occupancy_rate || 0);

          totalCapacity += max;
          totalEnrolled += enrolled;
          if (enrolled >= max || row.status === 'FULL') {
            classesAtCapacityCount++;
          }

          return {
            classId: row.class_id,
            classCode: row.class_code,
            className: row.class_name,
            courseName: row.course_name,
            room: row.room || 'Chưa xếp phòng',
            maxCapacity: max,
            currentEnrolled: enrolled,
            occupancyRate: rate,
            status: row.status,
          };
        });

        const overallOccupancyRate = totalCapacity > 0
          ? Number(((totalEnrolled / totalCapacity) * 100).toFixed(1))
          : 0;

        return {
          overallOccupancyRate,
          totalCapacity,
          totalEnrolled,
          totalClasses: classes.length,
          classesAtCapacityCount,
          classes,
        };
      } catch (err: any) {
        logger.error('Lỗi khi truy vấn Class Occupancy:', err.message);
      }
    }

    // Mock fallback
    return {
      overallOccupancyRate: 50.0,
      totalCapacity: 42,
      totalEnrolled: 21,
      totalClasses: 3,
      classesAtCapacityCount: 0,
      classes: [
        { classId: 1, classCode: 'IELTS-K26-T246', className: 'IELTS Bứt phá K26 (Tối 2-4-6)', courseName: 'IELTS Bứt phá', room: 'Phòng 302', maxCapacity: 15, currentEnrolled: 10, occupancyRate: 66.7, status: 'OPEN' },
        { classId: 2, classCode: 'IELTS-K27-T357', className: 'IELTS Bứt phá K27 (Tối 3-5-7)', courseName: 'IELTS Bứt phá', room: 'Phòng 201', maxCapacity: 12, currentEnrolled: 6, occupancyRate: 50.0, status: 'OPEN' },
        { classId: 3, classCode: 'IELTS-F20-T246', className: 'IELTS Nền tảng F20', courseName: 'IELTS Nền tảng', room: 'Phòng 101', maxCapacity: 15, currentEnrolled: 5, occupancyRate: 33.3, status: 'OPEN' },
      ],
    };
  }

  /**
   * 6. Tổng quan chỉ số điều hành cốt lõi (Executive Overview KPI Cards)
   */
  static async getExecutiveOverview(): Promise<ExecutiveOverviewResponse> {
    if (isDbAvailable()) {
      try {
        const sql = `
          SELECT
            (SELECT COUNT(*) FROM leads) as total_leads,
            (SELECT COUNT(*) FROM leads WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as new_leads_this_month,
            (SELECT COUNT(*) FROM leads WHERE pipeline_stage = 'ENROLLED') as total_enrolled,
            (SELECT COALESCE(SUM(amount), 0) FROM payment_receipts) as total_revenue,
            (SELECT COUNT(*) FROM payment_receipts) as total_transactions,
            (SELECT COUNT(*) FROM classes WHERE status IN ('OPEN', 'PLANNING', 'IN_PROGRESS')) as active_classes_count,
            (SELECT COALESCE(SUM(max_capacity), 0) FROM classes) as total_capacity,
            (SELECT COALESCE(SUM(current_enrolled), 0) FROM classes) as total_class_enrolled;
        `;
        const res = await query(sql);
        const row = res.rows[0];

        const totalLeads = Number(row.total_leads || 0);
        const totalEnrolled = Number(row.total_enrolled || 0);
        const conversionRate = totalLeads > 0 ? Number(((totalEnrolled / totalLeads) * 100).toFixed(1)) : 0;
        const totalCapacity = Number(row.total_capacity || 0);
        const totalClassEnrolled = Number(row.total_class_enrolled || 0);
        const averageOccupancyRate = totalCapacity > 0 ? Number(((totalClassEnrolled / totalCapacity) * 100).toFixed(1)) : 0;

        // Top tư vấn viên tháng
        const topConsultantSql = `
          SELECT 
            u.id, 
            u.full_name, 
            COUNT(l.id) as enrolled_count,
            COALESCE(SUM(e.final_amount), 0) as revenue
          FROM users u
          JOIN leads l ON l.assigned_sales_id = u.id AND l.pipeline_stage = 'ENROLLED'
          JOIN students s ON s.lead_id = l.id
          JOIN enrollments e ON e.student_id = s.id
          GROUP BY u.id, u.full_name
          ORDER BY revenue DESC, enrolled_count DESC
          LIMIT 1;
        `;
        const topRes = await query(topConsultantSql);
        const topRow = topRes.rows[0];

        return {
          totalLeads,
          newLeadsThisMonth: Number(row.new_leads_this_month || 0),
          totalEnrolled,
          conversionRate,
          totalRevenue: Number(row.total_revenue || 0),
          totalTransactions: Number(row.total_transactions || 0),
          activeClassesCount: Number(row.active_classes_count || 0),
          averageOccupancyRate,
          topPerformingConsultant: topRow
            ? {
                id: topRow.id,
                name: topRow.full_name,
                revenue: Number(topRow.revenue),
                enrolledCount: Number(topRow.enrolled_count),
              }
            : null,
        };
      } catch (err: any) {
        logger.error('Lỗi khi truy vấn Executive Overview:', err.message);
      }
    }

    // Mock fallback
    return {
      totalLeads: 10,
      newLeadsThisMonth: 10,
      totalEnrolled: 2,
      conversionRate: 20.0,
      totalRevenue: 25500000,
      totalTransactions: 3,
      activeClassesCount: 3,
      averageOccupancyRate: 50.0,
      topPerformingConsultant: {
        id: 2,
        name: 'Long Phạm',
        revenue: 17000000,
        enrolledCount: 2,
      },
    };
  }

  /**
   * 7. Xuất dữ liệu thô phục vụ báo cáo CSV/JSON
   */
  static async getRawExportData(type: ExportReportType, filter: DateRangeFilter): Promise<any[]> {
    if (!isDbAvailable()) {
      return [{ message: 'Mock data export', type, timestamp: new Date().toISOString() }];
    }

    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (filter.startDate) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(filter.startDate);
    }
    if (filter.endDate) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(filter.endDate);
    }

    const whereClause = conditions.join(' AND ');

    switch (type) {
      case 'leads': {
        const sql = `
          SELECT 
            l.id as "Mã Lead",
            l.full_name as "Họ và tên",
            l.phone_number as "Số điện thoại",
            l.email as "Email",
            l.interest as "Khóa quan tâm",
            l.source_channel as "Kênh nguồn",
            l.pipeline_stage as "Trạng thái Pipeline",
            COALESCE(l.lost_reason, '') as "Lý do hủy",
            COALESCE(u.full_name, 'Chưa phân công') as "Tư vấn viên",
            TO_CHAR(l.created_at, 'YYYY-MM-DD HH24:MI:SS') as "Ngày tạo"
          FROM leads l
          LEFT JOIN users u ON l.assigned_sales_id = u.id
          WHERE ${whereClause.replace(/created_at/g, 'l.created_at')}
          ORDER BY l.id ASC;
        `;
        const res = await query(sql, params);
        return res.rows;
      }

      case 'revenue': {
        const sql = `
          SELECT 
            pr.receipt_code as "Mã biên lai",
            s.student_code as "Mã học viên",
            s.full_name as "Họ tên học viên",
            c.course_name as "Khóa học",
            cl.class_code as "Lớp học",
            pr.amount as "Số tiền thu (VND)",
            pr.payment_method as "Phương thức",
            COALESCE(pr.transaction_reference, '') as "Mã giao dịch",
            u.full_name as "Người thu tiền",
            TO_CHAR(pr.paid_at, 'YYYY-MM-DD HH24:MI:SS') as "Thời gian thu"
          FROM payment_receipts pr
          JOIN enrollments e ON pr.enrollment_id = e.id
          JOIN students s ON e.student_id = s.id
          JOIN classes cl ON e.class_id = cl.id
          JOIN courses c ON cl.course_id = c.id
          JOIN users u ON pr.receiver_id = u.id
          WHERE ${whereClause.replace(/created_at/g, 'pr.paid_at')}
          ORDER BY pr.paid_at DESC;
        `;
        const res = await query(sql, params);
        return res.rows;
      }

      case 'sales-leaderboard': {
        const leaderboard = await this.getSalesLeaderboard(filter);
        return leaderboard.map((item) => ({
          'Thứ hạng': item.rank,
          'Tư vấn viên': item.consultantName,
          'Email': item.consultantEmail,
          'Số Lead phụ trách': item.totalLeadsAssigned,
          'Số Lead chốt (Enrolled)': item.leadsEnrolled,
          'Số Lead mất (Lost)': item.leadsLost,
          'Tỷ lệ chốt đơn (%)': `${item.conversionRate}%`,
          'Tổng doanh thu (VND)': item.totalRevenueGenerated,
          'Giá trị đơn bình quân (VND)': item.averageDealValue,
        }));
      }

      case 'channel-roi': {
        const channels = await this.getMarketingChannelROI(filter);
        return channels.map((item) => ({
          'Kênh nguồn': item.channelName,
          'Mã kênh': item.channel,
          'Tổng số Lead': item.totalLeads,
          'Tỷ trọng Lead (%)': `${item.percentageOfLeads}%`,
          'Số Lead nhập học': item.enrolledCount,
          'Tỷ lệ chuyển đổi (%)': `${item.conversionRate}%`,
          'Tổng doanh thu thu về (VND)': item.totalRevenue,
          'Học phí bình quân / học viên': item.averageTuitionPerEnrollment,
        }));
      }

      case 'occupancy': {
        const capacity = await this.getClassOccupancy({});
        return capacity.classes.map((cls) => ({
          'Mã lớp': cls.classCode,
          'Tên lớp học': cls.className,
          'Khóa học': cls.courseName,
          'Phòng học': cls.room,
          'Sĩ số tối đa': cls.maxCapacity,
          'Hiện tại': cls.currentEnrolled,
          'Tỷ lệ lấp đầy (%)': `${cls.occupancyRate}%`,
          'Trạng thái': cls.status,
        }));
      }

      default:
        return [];
    }
  }
}
