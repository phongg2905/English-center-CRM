/**
 * DỰ ÁN: ENGLISH CENTER CRM (EduFlow CRM)
 * MODULE: ANALYTICS & REPORTING (UC-04, TASK BE-06)
 * TÁC GIẢ: Long Phạm (@longphm11) - Backend Developer
 */

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

export interface FunnelStageStats {
  stage: string;
  stageName: string;
  count: number;
  percentageOfTotal: number;
  conversionFromPrevious: number;
}

export interface LostReasonStats {
  reason: string;
  count: number;
  percentage: number;
}

export interface FunnelAnalyticsResponse {
  totalLeads: number;
  stages: FunnelStageStats[];
  overallConversionRate: number; // Tỷ lệ từ NEW -> ENROLLED (%)
  testToEnrollmentRate: number;  // Tỷ lệ từ TEST_SCHEDULED -> ENROLLED (%)
  dropOffRate: number;           // Tỷ lệ LOST (%)
  lostReasons: LostReasonStats[];
}

export type RevenuePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface RevenuePeriodStat {
  period: string;
  revenue: number;
  transactionCount: number;
}

export interface RevenueByMethodStat {
  paymentMethod: string;
  methodName: string;
  amount: number;
  transactionCount: number;
  percentage: number;
}

export interface RevenueByCourseStat {
  courseId: number;
  courseCode: string;
  courseName: string;
  revenue: number;
  studentCount: number;
}

export interface RevenueAnalyticsResponse {
  totalRevenue: number;
  totalTransactions: number;
  averageOrderValue: number;
  period: RevenuePeriod;
  periods: RevenuePeriodStat[];
  byPaymentMethod: RevenueByMethodStat[];
  byCourse: RevenueByCourseStat[];
}

export interface SalesConsultantPerformance {
  rank: number;
  consultantId: number;
  consultantName: string;
  consultantEmail: string;
  totalLeadsAssigned: number;
  leadsEnrolled: number;
  leadsLost: number;
  conversionRate: number; // Win rate %
  totalRevenueGenerated: number;
  averageDealValue: number;
}

export interface MarketingChannelROI {
  channel: string;
  channelName: string;
  totalLeads: number;
  percentageOfLeads: number;
  enrolledCount: number;
  conversionRate: number;
  totalRevenue: number;
  averageTuitionPerEnrollment: number;
}

export interface ClassOccupancyStat {
  classId: number;
  classCode: string;
  className: string;
  courseName: string;
  room: string;
  maxCapacity: number;
  currentEnrolled: number;
  occupancyRate: number;
  status: string;
}

export interface CapacityAnalyticsResponse {
  overallOccupancyRate: number;
  totalCapacity: number;
  totalEnrolled: number;
  totalClasses: number;
  classesAtCapacityCount: number;
  classes: ClassOccupancyStat[];
}

export interface ExecutiveOverviewResponse {
  totalLeads: number;
  newLeadsThisMonth: number;
  totalEnrolled: number;
  conversionRate: number;
  totalRevenue: number;
  totalTransactions: number;
  activeClassesCount: number;
  averageOccupancyRate: number;
  topPerformingConsultant?: {
    id: number;
    name: string;
    revenue: number;
    enrolledCount: number;
  } | null;
}

export type ExportReportType = 'leads' | 'revenue' | 'sales-leaderboard' | 'channel-roi' | 'occupancy';
export type ExportFormat = 'json' | 'csv';

export interface ExportFilterQuery extends DateRangeFilter {
  type: ExportReportType;
  format?: ExportFormat;
}
