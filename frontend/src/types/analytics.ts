/**
 * DỰ ÁN: ENGLISH CENTER CRM (EduFlow CRM)
 * MODULE: BÁO CÁO & THỐNG KÊ (FE-06 / UC-04)
 * TÁC GIẢ: Long Phạm (@longphm11) - Frontend Developer
 */

export interface ExecutiveOverview {
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

export interface FunnelStage {
  stage: string;
  stageName: string;
  count: number;
  percentageOfTotal: number;
  conversionFromPrevious: number;
}

export interface LostReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface FunnelData {
  totalLeads: number;
  stages: FunnelStage[];
  overallConversionRate: number;
  testToEnrollmentRate: number;
  dropOffRate: number;
  lostReasons: LostReason[];
}

export interface RevenuePeriodStat {
  period: string;
  revenue: number;
  transactionCount: number;
}

export interface RevenueByMethod {
  paymentMethod: string;
  methodName: string;
  amount: number;
  transactionCount: number;
  percentage: number;
}

export interface RevenueByCourse {
  courseId: number;
  courseCode: string;
  courseName: string;
  revenue: number;
  studentCount: number;
}

export interface RevenueData {
  totalRevenue: number;
  totalTransactions: number;
  averageOrderValue: number;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  periods: RevenuePeriodStat[];
  byPaymentMethod: RevenueByMethod[];
  byCourse: RevenueByCourse[];
}

export interface SalesConsultant {
  rank: number;
  consultantId: number;
  consultantName: string;
  consultantEmail: string;
  totalLeadsAssigned: number;
  leadsEnrolled: number;
  leadsLost: number;
  conversionRate: number;
  totalRevenueGenerated: number;
  averageDealValue: number;
}

export interface MarketingChannel {
  channel: string;
  channelName: string;
  totalLeads: number;
  percentageOfLeads: number;
  enrolledCount: number;
  conversionRate: number;
  totalRevenue: number;
  averageTuitionPerEnrollment: number;
}

export interface ClassOccupancy {
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

export interface CapacityData {
  overallOccupancyRate: number;
  totalCapacity: number;
  totalEnrolled: number;
  totalClasses: number;
  classesAtCapacityCount: number;
  classes: ClassOccupancy[];
}

export type ExportReportType = 'leads' | 'revenue' | 'sales-leaderboard' | 'channel-roi' | 'occupancy';
export type ExportFormat = 'json' | 'csv';
