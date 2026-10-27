import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  GraduationCap,
  MapPin,
  PhoneCall,
  Plus,
  RefreshCw,
  School,
  Target,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  Wallet,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { hasRequiredRole, ACTION_PERMISSIONS, ROUTE_PERMISSIONS } from '../../config/rbac.config';
import { AnalyticsService } from '../../services/analytics.service';
import { LeadService } from '../../services/lead.service';
import { PlacementTestService } from '../../services/placement-test.service';
import { AcademicService } from '../../services/academic.service';
import type { ExecutiveOverview, CapacityData } from '../../types/analytics';
import type { LeadStatsResponse, LeadWithDetails, LeadPipelineStage } from '../../types/lead';
import type { PlacementTestWithDetails } from '../../types/placement-test';
import type { ClassItem, ClassEnrollmentItem, ScheduleDays } from '../../types/academic';
import './DashboardPage.css';

/* =========================================================
   HẰNG SỐ & HÀM TIỆN ÍCH
   ========================================================= */

const STAGE_META: Record<LeadPipelineStage, { label: string; color: string }> = {
  NEW: { label: 'Lead mới', color: '#6366f1' },
  CONTACTING: { label: 'Đang tư vấn', color: '#0ea5e9' },
  TEST_SCHEDULED: { label: 'Đã hẹn test', color: '#f59e0b' },
  ENROLLED: { label: 'Đã ghi danh', color: '#10b981' },
  LOST: { label: 'Thất bại', color: '#94a3b8' },
};
const STAGE_ORDER: LeadPipelineStage[] = ['NEW', 'CONTACTING', 'TEST_SCHEDULED', 'ENROLLED', 'LOST'];

/** Ngày học trong tuần theo lịch lớp (0 = Chủ nhật) */
const SCHEDULE_WEEKDAYS: Record<ScheduleDays, number[]> = {
  MON_WED_FRI: [1, 3, 5],
  TUE_THU_SAT: [2, 4, 6],
  WEEKEND: [6, 0],
};
const SCHEDULE_LABELS: Record<ScheduleDays, string> = {
  MON_WED_FRI: 'Thứ 2 - 4 - 6',
  TUE_THU_SAT: 'Thứ 3 - 5 - 7',
  WEEKEND: 'Thứ 7 - CN',
};

const NEAR_FULL_THRESHOLD = 80; // % sĩ số được coi là "sắp đầy"
const INACTIVE_CLASS_STATUSES = ['COMPLETED', 'CANCELLED'];

const toLocalISODate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatShortDate = (iso?: string | null): string => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

const formatVnd = (n?: number | null): string => `${Number(n || 0).toLocaleString('vi-VN')} đ`;

const daysSince = (iso?: string | null): number | null => {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
};

const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 11) return 'Chào buổi sáng';
  if (h < 14) return 'Chào buổi trưa';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

const ROLE_SUBTITLE: Record<string, string> = {
  ADMIN: 'Toàn cảnh hoạt động tuyển sinh, đào tạo và doanh thu của trung tâm.',
  SALES: 'Lead bạn phụ trách, việc cần follow-up và lịch test của khách hàng.',
  ACADEMIC: 'Lịch Placement Test, bài cần chấm điểm và tình trạng sĩ số lớp học.',
  TEACHER: 'Các lớp bạn phụ trách và lịch giảng dạy trong ngày.',
};

/* =========================================================
   COMPONENT CON
   ========================================================= */

interface KpiCardProps {
  id: string;
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  tone: 'indigo' | 'sky' | 'amber' | 'emerald' | 'rose' | 'violet';
  onClick?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({ id, label, value, hint, icon, tone, onClick }) => (
  <button
    type="button"
    id={id}
    className={`dash-kpi tone-${tone} ${onClick ? 'clickable' : ''}`}
    onClick={onClick}
    disabled={!onClick}
  >
    <div className="dash-kpi-top">
      <span className="dash-kpi-label">{label}</span>
      <span className="dash-kpi-icon">{icon}</span>
    </div>
    <div className="dash-kpi-value">{value}</div>
    {hint && <div className="dash-kpi-hint">{hint}</div>}
  </button>
);

interface TaskItem {
  key: string;
  icon: React.ReactNode;
  tone: 'indigo' | 'sky' | 'amber' | 'emerald' | 'rose' | 'violet';
  title: string;
  meta?: string;
  badge?: string;
  to: string;
}

const TaskList: React.FC<{ items: TaskItem[]; emptyText: string; onGo: (to: string) => void }> = ({
  items,
  emptyText,
  onGo,
}) => {
  if (items.length === 0) {
    return (
      <div className="dash-empty">
        <CheckCircle2 size={28} />
        <span>{emptyText}</span>
      </div>
    );
  }
  return (
    <ul className="dash-task-list">
      {items.map((t) => (
        <li key={t.key}>
          <button type="button" className="dash-task-item" onClick={() => onGo(t.to)}>
            <span className={`dash-task-icon tone-${t.tone}`}>{t.icon}</span>
            <span className="dash-task-body">
              <span className="dash-task-title">{t.title}</span>
              {t.meta && <span className="dash-task-meta">{t.meta}</span>}
            </span>
            {t.badge && <span className={`dash-task-badge tone-${t.tone}`}>{t.badge}</span>}
            <ArrowRight size={14} className="dash-task-arrow" />
          </button>
        </li>
      ))}
    </ul>
  );
};

const ProgressRow: React.FC<{ label: string; sub?: string; value: number; max: number; color: string; right: string }> = ({
  label,
  sub,
  value,
  max,
  color,
  right,
}) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="dash-progress-row">
      <div className="dash-progress-head">
        <span className="dash-progress-label">
          {label}
          {sub && <span className="dash-progress-sub">{sub}</span>}
        </span>
        <span className="dash-progress-right">{right}</span>
      </div>
      <div className="dash-progress-track">
        <div className="dash-progress-bar" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
};

const Panel: React.FC<{
  title: string;
  icon: React.ReactNode;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}> = ({ title, icon, action, children }) => (
  <section className="dash-panel">
    <header className="dash-panel-header">
      <h2 className="dash-panel-title">
        {icon}
        <span>{title}</span>
      </h2>
      {action && (
        <button type="button" className="dash-panel-link" onClick={action.onClick}>
          {action.label}
          <ArrowRight size={13} />
        </button>
      )}
    </header>
    <div className="dash-panel-body">{children}</div>
  </section>
);

/* =========================================================
   TRANG TỔNG QUAN
   ========================================================= */

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = String(user?.role || '').toUpperCase();
  const isAdmin = role === 'ADMIN';
  const isSales = role === 'SALES';
  const isAcademic = role === 'ACADEMIC';
  const isTeacher = role === 'TEACHER';

  // Quyền cho các nút thao tác nhanh
  const canCreateLead = hasRequiredRole(role, ACTION_PERMISSIONS.LEAD_CREATE);
  const canOpenTests = hasRequiredRole(role, ROUTE_PERMISSIONS.tests);
  const canCreateClass = hasRequiredRole(role, ACTION_PERMISSIONS.CLASS_CREATE);
  const canOpenReports = hasRequiredRole(role, ROUTE_PERMISSIONS.reports);
  const canViewRevenue = hasRequiredRole(role, ACTION_PERMISSIONS.REVENUE_REPORT);

  const [isLoading, setIsLoading] = useState(() => !AnalyticsService.peekOverview() && !AcademicService.peekClasses());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [overview, setOverview] = useState<Partial<ExecutiveOverview> | null>(null);
  const [leadStats, setLeadStats] = useState<LeadStatsResponse | null>(null);
  const [myLeads, setMyLeads] = useState<LeadWithDetails[]>([]);
  const [tests, setTests] = useState<PlacementTestWithDetails[]>([]);
  const [capacity, setCapacity] = useState<CapacityData | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [enrollments, setEnrollments] = useState<ClassEnrollmentItem[]>([]);

  const todayISO = toLocalISODate(new Date());
  const todayWeekday = new Date().getDay();

  const loadData = useCallback(async () => {
    if (!user) return;
    if (!AnalyticsService.peekOverview() && !AcademicService.peekClasses()) setIsLoading(true);
    setLoadError(null);

    // Mỗi vai trò chỉ gọi các API mà Backend cho phép
    const jobs: Promise<unknown>[] = [];
    if (isTeacher) {
      jobs.push(AcademicService.getClasses().then(setClasses));
      jobs.push(AcademicService.getEnrollments().then(setEnrollments));
    } else {
      jobs.push(AnalyticsService.getOverview().then(setOverview));
      jobs.push(AnalyticsService.getClassOccupancy().then(setCapacity));
      jobs.push(
        PlacementTestService.getTests({ limit: 100, sortBy: 'test_date', sortOrder: 'ASC' }).then((r) =>
          setTests(r.tests)
        )
      );
      if (isSales) {
        jobs.push(
          LeadService.getLeads({ assignedSalesId: user.id, limit: 100, sortBy: 'updated_at', sortOrder: 'ASC' }).then(
            (r) => setMyLeads(r.leads)
          )
        );
      } else {
        jobs.push(LeadService.getStats().then(setLeadStats));
      }
    }

    const results = await Promise.allSettled(jobs);
    if (results.some((r) => r.status === 'rejected')) {
      setLoadError('Một số số liệu chưa tải được từ máy chủ. Bấm "Làm mới" để thử lại.');
    }
    setIsLoading(false);
  }, [user, isTeacher, isSales]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ---------- Số liệu dẫn xuất ---------- */
  const relevantTests = useMemo(
    () => (isSales ? tests.filter((t) => t.assignedSalesId === user?.id) : tests),
    [tests, isSales, user?.id]
  );
  const upcomingTests = useMemo(
    () =>
      relevantTests
        .filter((t) => t.attendanceStatus === 'SCHEDULED' && t.testDate.split('T')[0] >= todayISO)
        .sort((a, b) => (a.testDate + a.timeSlot).localeCompare(b.testDate + b.timeSlot)),
    [relevantTests, todayISO]
  );
  const overdueTests = useMemo(
    () => relevantTests.filter((t) => t.attendanceStatus === 'SCHEDULED' && t.testDate.split('T')[0] < todayISO),
    [relevantTests, todayISO]
  );
  const pendingScoreTests = useMemo(
    () => relevantTests.filter((t) => t.attendanceStatus === 'PRESENT' && (t.overallScore === null || t.overallScore === undefined)),
    [relevantTests]
  );
  const activeCapacityClasses = useMemo(
    () => (capacity?.classes || []).filter((c) => !INACTIVE_CLASS_STATUSES.includes(c.status)),
    [capacity]
  );
  const nearFullClasses = useMemo(
    () => activeCapacityClasses.filter((c) => c.occupancyRate >= NEAR_FULL_THRESHOLD),
    [activeCapacityClasses]
  );

  // SALES: phễu cá nhân & danh sách cần follow-up
  const myStageCounts = useMemo(() => {
    const counts: Record<LeadPipelineStage, number> = { NEW: 0, CONTACTING: 0, TEST_SCHEDULED: 0, ENROLLED: 0, LOST: 0 };
    myLeads.forEach((l) => {
      counts[l.pipelineStage] = (counts[l.pipelineStage] || 0) + 1;
    });
    return counts;
  }, [myLeads]);
  const followUpLeads = useMemo(
    () =>
      myLeads
        .filter((l) => l.pipelineStage === 'NEW' || l.pipelineStage === 'CONTACTING')
        .sort((a, b) => {
          const ta = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : 0;
          const tb = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : 0;
          return ta - tb; // Chưa liên hệ / liên hệ lâu nhất lên đầu
        }),
    [myLeads]
  );

  // TEACHER: lớp phụ trách & lịch dạy hôm nay
  const activeTeacherClasses = useMemo(
    () => classes.filter((c) => !INACTIVE_CLASS_STATUSES.includes(c.status)),
    [classes]
  );
  const todayClasses = useMemo(
    () =>
      activeTeacherClasses
        .filter(
          (c) =>
            c.status !== 'PLANNING' &&
            (c.startDate ? c.startDate.split('T')[0] <= todayISO : true) &&
            (SCHEDULE_WEEKDAYS[c.scheduleDays] || []).includes(todayWeekday)
        )
        .sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || '')),
    [activeTeacherClasses, todayISO, todayWeekday]
  );
  const upcomingStartClasses = useMemo(
    () => activeTeacherClasses.filter((c) => c.startDate && c.startDate.split('T')[0] > todayISO),
    [activeTeacherClasses, todayISO]
  );
  const activeStudentCount = useMemo(() => enrollments.filter((e) => e.status === 'ENROLLED').length, [enrollments]);

  /* ---------- KPI theo vai trò ---------- */
  const kpis: KpiCardProps[] = useMemo(() => {
    if (isTeacher) {
      return [
        { id: 'kpi-teacher-classes', label: 'Lớp đang phụ trách', value: activeTeacherClasses.length, hint: `${classes.length} lớp được phân công`, icon: <School size={18} />, tone: 'indigo', onClick: () => navigate('/classes') },
        { id: 'kpi-teacher-students', label: 'Học viên đang theo học', value: activeStudentCount, hint: 'Trong các lớp của bạn', icon: <Users size={18} />, tone: 'sky', onClick: () => navigate('/students') },
        { id: 'kpi-teacher-today', label: 'Buổi dạy hôm nay', value: todayClasses.length, hint: todayClasses[0] ? `Ca sớm nhất: ${todayClasses[0].timeSlot}` : 'Hôm nay không có lịch dạy', icon: <CalendarClock size={18} />, tone: 'amber' },
        { id: 'kpi-teacher-upcoming', label: 'Lớp sắp khai giảng', value: upcomingStartClasses.length, hint: upcomingStartClasses[0] ? `Gần nhất: ${formatShortDate(upcomingStartClasses[0].startDate)}` : 'Không có lớp sắp mở', icon: <CalendarDays size={18} />, tone: 'emerald' },
      ];
    }
    if (isSales) {
      const total = myLeads.length;
      const rate = total > 0 ? ((myStageCounts.ENROLLED / total) * 100).toFixed(1) : '0';
      return [
        { id: 'kpi-sales-leads', label: 'Lead tôi phụ trách', value: total, hint: `${myStageCounts.LOST} lead thất bại`, icon: <Users size={18} />, tone: 'indigo', onClick: () => navigate('/leads') },
        { id: 'kpi-sales-followup', label: 'Cần liên hệ / tư vấn', value: followUpLeads.length, hint: `${myStageCounts.NEW} lead mới chưa xử lý`, icon: <PhoneCall size={18} />, tone: 'rose', onClick: () => navigate('/leads') },
        { id: 'kpi-sales-tests', label: 'Đã hẹn Placement Test', value: myStageCounts.TEST_SCHEDULED, hint: `${upcomingTests.length} ca test sắp diễn ra`, icon: <ClipboardList size={18} />, tone: 'amber', onClick: () => navigate('/tests') },
        { id: 'kpi-sales-enrolled', label: 'Đã chốt ghi danh', value: myStageCounts.ENROLLED, hint: `Tỷ lệ chuyển đổi ${rate}%`, icon: <Target size={18} />, tone: 'emerald', onClick: () => navigate('/students') },
      ];
    }
    if (isAcademic) {
      return [
        { id: 'kpi-academic-upcoming', label: 'Ca test sắp diễn ra', value: upcomingTests.length, hint: upcomingTests[0] ? `Gần nhất: ${formatShortDate(upcomingTests[0].testDate)} · ${upcomingTests[0].timeSlot}` : 'Chưa có lịch test mới', icon: <CalendarClock size={18} />, tone: 'indigo', onClick: () => navigate('/tests') },
        { id: 'kpi-academic-score', label: 'Bài test chờ chấm điểm', value: pendingScoreTests.length, hint: 'Thí sinh đã dự thi, chưa có điểm', icon: <ClipboardCheck size={18} />, tone: 'rose', onClick: () => navigate('/tests') },
        { id: 'kpi-academic-overdue', label: 'Ca test chưa điểm danh', value: overdueTests.length, hint: 'Đã qua ngày thi, chưa cập nhật', icon: <AlertCircle size={18} />, tone: 'amber', onClick: () => navigate('/tests') },
        { id: 'kpi-academic-occupancy', label: 'Tỷ lệ lấp đầy lớp', value: `${Number(capacity?.overallOccupancyRate ?? overview?.averageOccupancyRate ?? 0).toFixed(1)}%`, hint: `${activeCapacityClasses.length} lớp đang mở · ${nearFullClasses.length} lớp sắp đầy`, icon: <School size={18} />, tone: 'emerald', onClick: () => navigate('/classes') },
      ];
    }
    // ADMIN
    return [
      { id: 'kpi-admin-leads', label: 'Tổng số Lead', value: overview?.totalLeads ?? 0, hint: `+${overview?.newLeadsThisMonth ?? 0} lead mới trong tháng`, icon: <Users size={18} />, tone: 'indigo', onClick: () => navigate('/leads') },
      { id: 'kpi-admin-conversion', label: 'Tỷ lệ chuyển đổi', value: `${Number(overview?.conversionRate ?? 0).toFixed(1)}%`, hint: `${overview?.totalEnrolled ?? 0} lead đã ghi danh`, icon: <TrendingUp size={18} />, tone: 'violet', onClick: () => navigate('/reports') },
      ...(canViewRevenue
        ? [{ id: 'kpi-admin-revenue', label: 'Doanh thu thực thu', value: formatVnd(overview?.totalRevenue), hint: `${overview?.totalTransactions ?? 0} giao dịch thu học phí`, icon: <Wallet size={18} />, tone: 'emerald' as const, onClick: () => navigate('/reports') }]
        : []),
      { id: 'kpi-admin-classes', label: 'Lớp đang hoạt động', value: overview?.activeClassesCount ?? activeCapacityClasses.length, hint: `Lấp đầy trung bình ${Number(capacity?.overallOccupancyRate ?? overview?.averageOccupancyRate ?? 0).toFixed(1)}%`, icon: <School size={18} />, tone: 'sky', onClick: () => navigate('/classes') },
    ];
  }, [isTeacher, isSales, isAcademic, canViewRevenue, navigate, overview, capacity, classes.length, activeTeacherClasses.length, activeStudentCount, todayClasses, upcomingStartClasses, myLeads.length, myStageCounts, followUpLeads.length, upcomingTests, pendingScoreTests.length, overdueTests.length, activeCapacityClasses.length, nearFullClasses.length]);

  /* ---------- Việc cần làm theo vai trò ---------- */
  const testToTask = (t: PlacementTestWithDetails, tone: TaskItem['tone'], badge: string): TaskItem => ({
    key: `test-${t.id}-${badge}`,
    icon: <ClipboardList size={15} />,
    tone,
    title: t.leadFullName || `Thí sinh #${t.leadId}`,
    meta: `${t.testType} · ${formatShortDate(t.testDate)} · ${t.timeSlot}${t.room ? ` · ${t.room}` : ''}`,
    badge,
    to: '/tests',
  });

  const tasks: TaskItem[] = useMemo(() => {
    if (isTeacher) {
      return todayClasses.map((c) => ({
        key: `class-${c.id}`,
        icon: <BookOpen size={15} />,
        tone: 'indigo' as const,
        title: c.className,
        meta: `${c.timeSlot || 'Chưa xếp ca'} · ${c.room || 'Chưa xếp phòng'} · ${c.currentEnrolled} học viên`,
        badge: c.classCode,
        to: '/classes',
      }));
    }
    if (isSales) {
      const leadTasks = followUpLeads.slice(0, 6).map((l) => {
        const d = daysSince(l.lastContactedAt);
        return {
          key: `lead-${l.id}`,
          icon: <PhoneCall size={15} />,
          tone: (l.pipelineStage === 'NEW' ? 'rose' : 'sky') as TaskItem['tone'],
          title: l.fullName,
          meta: `${l.phoneNumber} · ${l.interest} · ${d === null ? 'Chưa liên hệ lần nào' : d === 0 ? 'Liên hệ hôm nay' : `Liên hệ lần cuối ${d} ngày trước`}`,
          badge: STAGE_META[l.pipelineStage].label,
          to: '/leads',
        };
      });
      const testTasks = upcomingTests.slice(0, 3).map((t) => testToTask(t, 'amber', 'Sắp thi'));
      return [...leadTasks, ...testTasks];
    }
    if (isAcademic) {
      return [
        ...overdueTests.slice(0, 4).map((t) => testToTask(t, 'amber', 'Cần điểm danh')),
        ...pendingScoreTests.slice(0, 4).map((t) => testToTask(t, 'rose', 'Chờ chấm điểm')),
        ...upcomingTests.slice(0, 4).map((t) => testToTask(t, 'indigo', 'Sắp thi')),
      ];
    }
    // ADMIN: tóm tắt các điểm cần chú ý toàn trung tâm
    const items: TaskItem[] = [];
    const newLeads = leadStats?.byStage?.NEW ?? 0;
    if (newLeads > 0) items.push({ key: 'a-new', icon: <UserPlus size={15} />, tone: 'rose', title: `${newLeads} lead mới chưa được liên hệ`, meta: 'Nhắc tư vấn viên xử lý sớm để tránh mất khách', to: '/leads' });
    if (upcomingTests.length > 0) items.push({ key: 'a-tests', icon: <CalendarClock size={15} />, tone: 'indigo', title: `${upcomingTests.length} ca Placement Test sắp diễn ra`, meta: `Gần nhất: ${formatShortDate(upcomingTests[0].testDate)} · ${upcomingTests[0].timeSlot}`, to: '/tests' });
    if (overdueTests.length > 0) items.push({ key: 'a-overdue', icon: <AlertCircle size={15} />, tone: 'amber', title: `${overdueTests.length} ca test đã qua ngày nhưng chưa điểm danh`, meta: 'Giáo vụ cần cập nhật trạng thái dự thi', to: '/tests' });
    if (pendingScoreTests.length > 0) items.push({ key: 'a-score', icon: <ClipboardCheck size={15} />, tone: 'rose', title: `${pendingScoreTests.length} bài test chờ chấm điểm`, meta: 'Thí sinh đã dự thi nhưng chưa có kết quả', to: '/tests' });
    if (nearFullClasses.length > 0) items.push({ key: 'a-full', icon: <School size={15} />, tone: 'emerald', title: `${nearFullClasses.length} lớp sắp đầy (≥ ${NEAR_FULL_THRESHOLD}% sĩ số)`, meta: nearFullClasses.map((c) => c.classCode).join(', '), to: '/classes' });
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacher, isSales, isAcademic, todayClasses, followUpLeads, upcomingTests, overdueTests, pendingScoreTests, leadStats, nearFullClasses]);

  const taskPanelTitle = isTeacher
    ? `Lịch dạy hôm nay (${new Date().toLocaleDateString('vi-VN', { weekday: 'long' })})`
    : isSales
      ? 'Việc cần follow-up'
      : isAcademic
        ? 'Việc cần xử lý về khảo thí'
        : 'Điểm cần chú ý';
  const taskEmptyText = isTeacher
    ? 'Hôm nay bạn không có lịch dạy.'
    : isSales
      ? 'Tuyệt vời! Không có lead nào đang chờ bạn liên hệ.'
      : isAcademic
        ? 'Không có ca test nào cần xử lý.'
        : 'Mọi hoạt động đang ổn định, không có điểm cần chú ý.';

  /* ---------- Thao tác nhanh ---------- */
  const quickActions = [
    canCreateLead && { id: 'qa-add-lead', label: 'Thêm Lead', icon: <Plus size={15} />, to: '/leads', primary: true },
    canOpenTests && !isAdmin && { id: 'qa-tests', label: 'Lịch Placement Test', icon: <CalendarClock size={15} />, to: '/tests' },
    canCreateClass && { id: 'qa-classes', label: isAcademic ? 'Mở lớp mới' : 'Quản lý lớp học', icon: <School size={15} />, to: '/classes', primary: isAcademic },
    isTeacher && { id: 'qa-students', label: 'Danh sách học viên', icon: <GraduationCap size={15} />, to: '/students', primary: true },
    canOpenReports && { id: 'qa-reports', label: 'Báo cáo', icon: <BarChart3 size={15} />, to: '/reports' },
  ].filter(Boolean) as { id: string; label: string; icon: React.ReactNode; to: string; primary?: boolean }[];

  /* ---------- Panel bên phải ---------- */
  const renderSidePanels = () => {
    if (isTeacher) {
      return (
        <Panel title="Lớp của tôi" icon={<School size={16} />} action={{ label: 'Xem tất cả', onClick: () => navigate('/classes') }}>
          {classes.length === 0 ? (
            <div className="dash-empty">
              <School size={28} />
              <span>Bạn chưa được phân công lớp nào. Liên hệ Giáo vụ nếu đây là nhầm lẫn.</span>
            </div>
          ) : (
            <div className="dash-class-list">
              {classes.map((c) => (
                <div key={c.id} className="dash-class-card">
                  <div className="dash-class-head">
                    <span className="dash-class-code">{c.classCode}</span>
                    <span className={`dash-status status-${c.status.toLowerCase()}`}>{c.status}</span>
                  </div>
                  <div className="dash-class-name">{c.className}</div>
                  <div className="dash-class-meta">
                    <span><CalendarDays size={12} /> {SCHEDULE_LABELS[c.scheduleDays] || c.scheduleDays}</span>
                    <span><Clock size={12} /> {c.timeSlot || '—'}</span>
                    <span><MapPin size={12} /> {c.room || '—'}</span>
                  </div>
                  <ProgressRow label="Sĩ số" value={c.currentEnrolled} max={c.maxCapacity} color="linear-gradient(90deg,#6366f1,#8b5cf6)" right={`${c.currentEnrolled}/${c.maxCapacity}`} />
                </div>
              ))}
            </div>
          )}
        </Panel>
      );
    }

    const stageCounts: Record<LeadPipelineStage, number> = isSales
      ? myStageCounts
      : (leadStats?.byStage as Record<LeadPipelineStage, number>) || { NEW: 0, CONTACTING: 0, TEST_SCHEDULED: 0, ENROLLED: 0, LOST: 0 };
    const stageTotal = STAGE_ORDER.reduce((s, k) => s + (stageCounts[k] || 0), 0);

    const funnelPanel = !isAcademic && (
      <Panel
        title={isSales ? 'Phễu tuyển sinh của tôi' : 'Phễu tuyển sinh toàn trung tâm'}
        icon={<TrendingUp size={16} />}
        action={{ label: 'Mở Kanban', onClick: () => navigate('/leads') }}
      >
        {stageTotal === 0 ? (
          <div className="dash-empty"><Users size={28} /><span>Chưa có lead nào.</span></div>
        ) : (
          STAGE_ORDER.map((s) => (
            <ProgressRow key={s} label={STAGE_META[s].label} value={stageCounts[s] || 0} max={stageTotal} color={STAGE_META[s].color} right={`${stageCounts[s] || 0} lead`} />
          ))
        )}
        {overview?.topPerformingConsultant && (
          <div className="dash-top-consultant">
            <Trophy size={16} />
            <div>
              <div className="dash-top-label">Tư vấn viên dẫn đầu</div>
              <div className="dash-top-name">
                {overview.topPerformingConsultant.name}
                {isSales && overview.topPerformingConsultant.id === user?.id && <span className="dash-you-badge">Bạn</span>}
              </div>
            </div>
            <div className="dash-top-stat">{overview.topPerformingConsultant.enrolledCount} ghi danh</div>
          </div>
        )}
      </Panel>
    );

    // SALES: ưu tiên lớp còn nhiều chỗ để tư vấn; ADMIN/ACADEMIC: theo dõi lớp sắp đầy
    const classRows = [...activeCapacityClasses].sort((a, b) =>
      isSales ? b.maxCapacity - b.currentEnrolled - (a.maxCapacity - a.currentEnrolled) : b.occupancyRate - a.occupancyRate
    );
    const occupancyPanel = (
      <Panel
        title={isSales ? 'Lớp còn chỗ để tư vấn' : 'Tình trạng sĩ số lớp học'}
        icon={<School size={16} />}
        action={{ label: 'Xem lớp học', onClick: () => navigate('/classes') }}
      >
        {classRows.length === 0 ? (
          <div className="dash-empty"><School size={28} /><span>Chưa có lớp học đang mở.</span></div>
        ) : (
          classRows.slice(0, 6).map((c) => (
            <ProgressRow
              key={c.classId}
              label={c.classCode}
              sub={c.room ? ` · ${c.room}` : undefined}
              value={c.currentEnrolled}
              max={c.maxCapacity}
              color={c.occupancyRate >= NEAR_FULL_THRESHOLD ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#10b981,#059669)'}
              right={isSales ? `Còn ${Math.max(0, c.maxCapacity - c.currentEnrolled)} chỗ` : `${c.currentEnrolled}/${c.maxCapacity} (${c.occupancyRate}%)`}
            />
          ))
        )}
      </Panel>
    );

    return (
      <>
        {funnelPanel}
        {occupancyPanel}
      </>
    );
  };

  /* ---------- Render ---------- */
  const todayLabel = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="dash-page">
      {/* HERO */}
      <section className="dash-hero">
        <div className="dash-hero-text">
          <span className="dash-hero-date">{todayLabel}</span>
          <h1 className="dash-hero-title">
            {getGreeting()}, {user?.fullName || user?.username}
          </h1>
          <p className="dash-hero-sub">
            <span className="dash-role-chip">{user?.roleName || role}</span>
            {ROLE_SUBTITLE[role] || ''}
          </p>
        </div>
        <div className="dash-hero-actions">
          {quickActions.map((a) => (
            <button key={a.id} id={a.id} type="button" className={`dash-qa-btn ${a.primary ? 'primary' : ''}`} onClick={() => navigate(a.to)}>
              {a.icon}
              <span>{a.label}</span>
            </button>
          ))}
          <button type="button" id="dash-refresh" className="dash-qa-btn icon-only" onClick={() => { AnalyticsService.invalidateCache(); LeadService.invalidateCache(); PlacementTestService.invalidateCache(); AcademicService.invalidateCache(); loadData(); }} disabled={isLoading} title="Làm mới số liệu">
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </section>

      {loadError && (
        <div className="dash-error">
          <AlertCircle size={16} />
          <span>{loadError}</span>
        </div>
      )}

      {/* KPI */}
      <section className={`dash-kpi-grid cols-${kpis.length}`} aria-label="Chỉ số chính">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="dash-kpi dash-skeleton" />)
          : kpis.map((k) => <KpiCard key={k.id} {...k} />)}
      </section>

      {/* MAIN GRID */}
      <div className="dash-main-grid">
        <Panel
          title={taskPanelTitle}
          icon={isTeacher ? <CalendarClock size={16} /> : <ClipboardList size={16} />}
          action={
            isTeacher
              ? { label: 'Lớp học', onClick: () => navigate('/classes') }
              : isSales
                ? { label: 'Tất cả lead', onClick: () => navigate('/leads') }
                : isAcademic
                  ? { label: 'Lịch test', onClick: () => navigate('/tests') }
                  : undefined
          }
        >
          {isLoading ? (
            <div className="dash-skeleton-list">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="dash-skeleton line" />)}
            </div>
          ) : (
            <TaskList items={tasks} emptyText={taskEmptyText} onGo={(to) => navigate(to)} />
          )}
        </Panel>

        <div className="dash-side-col">
          {isLoading ? <div className="dash-panel dash-skeleton tall" /> : renderSidePanels()}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
