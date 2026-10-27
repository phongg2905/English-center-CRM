import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Search,
  Plus,
  RefreshCw,
  Download,
  User,
  RotateCcw,
  X,
  UserPlus,
  CheckCircle2,
  Lock,
  ChevronDown,
  Bell,
  Layers,
  CheckSquare,
  Wallet,
  Users,
  Hash,
  Copy,
  Check,
  Flame,
  Edit2,
  Trash2,
} from 'lucide-react';

import { AcademicService } from '../../services/academic.service';
import type {
  ClassItem,
  CourseItem,
  ScheduleDays,
  ClassStatus,
  ClassEnrollmentItem,
  PaymentReceipt,
} from '../../types/academic';
import { CreateClassModal } from './CreateClassModal';
import { CreateCourseModal } from './CreateCourseModal';
import { ClassDetailDrawer } from './ClassDetailDrawer';
import { EnrollStudentWizardModal } from './EnrollStudentWizardModal';
import { RecordPaymentModal } from './RecordPaymentModal';
import { ReceiptPrintModal } from './ReceiptPrintModal';
import { TransferClassModal } from './TransferClassModal';
import { Button, CardGridSkeleton } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { hasRequiredRole, ACTION_PERMISSIONS } from '../../config/rbac.config';
import './ClassesPage.css';

export const CLASS_STATUS_META: Record<
  string,
  { label: string; bg: string; color: string; border: string }
> = {
  PLANNING: {
    label: 'Dự kiến mở',
    bg: '#fef3c7',
    color: '#b45309',
    border: '#fde68a',
  },
  OPEN: {
    label: 'Đang tuyển sinh',
    bg: '#dcfce7',
    color: '#15803d',
    border: '#bbf7d0',
  },
  IN_PROGRESS: {
    label: 'Đang học',
    bg: '#dbeafe',
    color: '#1d4ed8',
    border: '#bfdbfe',
  },
  FULL: {
    label: 'Đã đầy lớp',
    bg: '#fee2e2',
    color: '#b91c1c',
    border: '#fecaca',
  },
  COMPLETED: {
    label: 'Đã kết thúc',
    bg: '#f1f5f9',
    color: '#475569',
    border: '#cbd5e1',
  },
};

const formatTeacherName = (name?: string | null) => {
  if (!name) return 'Chưa phân công';
  return name.replace(/\s*\([^)]*\)/g, '').trim() || 'Chưa phân công';
};

/**
 * Rút gọn Mã Lớp: Cắt bỏ phần đuôi chứa lịch học (VD: "IELTS-K26-T246" -> "IELTS-K26")
 */
const formatShortClassCode = (code?: string | null): string => {
  if (!code) return '';
  return code
    .replace(/-(T246|T357|T7CN|246|357|T7|CN|WEEKEND|MON_WED_FRI|TUE_THU_SAT)$/i, '')
    .trim();
};

/**
 * Rút gọn Tên Lớp học: Không lặp lại tên Khóa học cha và lịch học
 * - VD: "IELTS Nền tảng F20" -> "Lớp F20"
 * - VD: "IELTS Bứt phá K26 (Tối 2-4-6)" -> "Lớp K26"
 */
const formatShortClassName = (
  className: string,
  courseName?: string | null,
  classCode?: string | null
): string => {
  if (!className) return '';
  const withoutParens = className.replace(/\s*\([^)]*\)/g, '').trim();
  if (/^lớp\s+/i.test(withoutParens)) {
    return withoutParens;
  }

  const cohortFromName = withoutParens.match(/(?:^|[\s-])([A-Z]\d{1,4})$/i);
  if (cohortFromName?.[1]) {
    return `Lớp ${cohortFromName[1].toUpperCase()}`;
  }

  const shortCode = formatShortClassCode(classCode);
  const cohortFromCode = shortCode.match(/-([A-Z]\d{1,4})$/i);
  if (cohortFromCode?.[1]) {
    return `Lớp ${cohortFromCode[1].toUpperCase()}`;
  }

  if (courseName) {
    const cleanCourse = courseName.replace(/\s*\([^)]*\)/g, '').trim();
    if (cleanCourse && withoutParens.toLowerCase().startsWith(cleanCourse.toLowerCase())) {
      const remainder = withoutParens.slice(cleanCourse.length).replace(/^[\s-]+/, '').trim();
      if (remainder) {
        return /^lớp\s+/i.test(remainder) ? remainder : `Lớp ${remainder}`;
      }
    }
  }

  return withoutParens;
};

const getScheduleLabel = (days: ScheduleDays) => {
  switch (days) {
    case 'MON_WED_FRI':
      return 'Thứ 2 - 4 - 6';
    case 'TUE_THU_SAT':
      return 'Thứ 3 - 5 - 7';
    case 'WEEKEND':
      return 'Cuối tuần';
    default:
      return days;
  }
};

/**
 * Dynamic capacity calculation:
 * - < 80%: Green (bg-green-500 / tone-success)
 * - >= 80% and < 100%: Orange/Yellow warning (bg-orange-500 / tone-warning)
 * - 100% (or isFull / FULL status): Red (bg-red-500 / tone-danger)
 */
const getCapacityMetrics = (cls: ClassItem) => {
  const maxCap = cls.maxCapacity > 0 ? cls.maxCapacity : 1;
  const rawRate = (cls.currentEnrolled / maxCap) * 100;
  const occupancyRate = Math.min(100, Math.max(0, rawRate));
  const isFullClass =
    cls.isFull ||
    cls.currentEnrolled >= cls.maxCapacity ||
    cls.status === 'FULL' ||
    occupancyRate >= 100;
  const isNearFull = !isFullClass && occupancyRate >= 80;

  let progressTone: 'success' | 'warning' | 'danger' = 'success';
  let progressBgClass = 'bg-green-500';
  if (isFullClass) {
    progressTone = 'danger';
    progressBgClass = 'bg-red-500';
  } else if (isNearFull) {
    progressTone = 'warning';
    progressBgClass = 'bg-orange-500';
  } else {
    progressTone = 'success';
    progressBgClass = 'bg-green-500';
  }

  return {
    occupancyRate,
    isFullClass,
    isNearFull,
    progressTone,
    progressBgClass,
  };
};

/**
 * Badge display logic (Placed next to Class Name for F-pattern scanning):
 * - Normal (< 80%): Hidden (null) — keeps active normal classes clean.
 * - Near-full (80% - 99%): Warm Amber badge (text-amber-800 bg-amber-100) + Flame icon -> Urgent sales priority.
 * - Full (100%): Muted Slate/Rose badge (text-slate-600 bg-slate-100) + Lock icon -> Indicates closed without stealing visual focus.
 * - Completed / Cancelled: Neutral Gray badge (text-gray-600 bg-gray-100) ("Đã hủy" if enrolled === 0, else "Đã kết thúc").
 */
const getAdmissionBadgeInfo = (cls: ClassItem, isFullClass: boolean, isNearFull: boolean) => {
  if (cls.status === 'CANCELLED' || (cls.status === 'COMPLETED' && cls.currentEnrolled === 0)) {
    return {
      label: 'Đã hủy',
      tone: 'completed text-gray-600 bg-gray-100',
      icon: null,
    };
  }
  if (cls.status === 'COMPLETED') {
    return {
      label: 'Đã kết thúc',
      tone: 'completed text-gray-600 bg-gray-100',
      icon: null,
    };
  }
  if (isFullClass) {
    return {
      label: 'Đã đầy',
      tone: 'full-muted text-slate-600 bg-slate-100',
      icon: <Lock size={11} />,
    };
  }
  if (isNearFull) {
    return {
      label: 'Sắp đầy',
      tone: 'near-full text-amber-800 bg-amber-100',
      icon: <Flame size={11} />,
    };
  }
  return null;
};

/**
 * Thứ tự ưu tiên sắp xếp Lớp học con (Child Classes) trong mỗi khóa học:
 * - Ưu tiên 1: Lớp "Sắp đầy" (tỷ lệ >= 80% và < 100%, chưa kết thúc/hủy)
 * - Ưu tiên 2: Lớp "Còn chỗ" (tỷ lệ < 80%, chưa kết thúc/hủy)
 * - Ưu tiên 3: Lớp "Đã đầy" (tỷ lệ = 100%, chưa kết thúc/hủy)
 * - Ưu tiên 4: Lớp "Đã kết thúc" hoặc "Đã hủy" (nằm dưới cùng)
 */
const getClassSortPriority = (cls: ClassItem): number => {
  if (cls.status === 'COMPLETED' || cls.status === 'CANCELLED') {
    return 4;
  }
  const { isFullClass, isNearFull } = getCapacityMetrics(cls);
  if (isNearFull) {
    return 1;
  }
  if (!isFullClass) {
    return 2;
  }
  return 3;
};

const compareChildClasses = (a: ClassItem, b: ClassItem): number => {
  const priorityDiff = getClassSortPriority(a) - getClassSortPriority(b);
  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  // Cùng mức ưu tiên trạng thái -> sắp xếp theo ngày khai giảng gần nhất, sau đó theo tên lớp
  const timeA = a.startDate ? new Date(a.startDate).getTime() : Number.MAX_SAFE_INTEGER;
  const timeB = b.startDate ? new Date(b.startDate).getTime() : Number.MAX_SAFE_INTEGER;
  if (!Number.isNaN(timeA) && !Number.isNaN(timeB) && timeA !== timeB) {
    return timeA - timeB;
  }

  return a.className.localeCompare(b.className, 'vi');
};

/**
 * Thứ tự ưu tiên sắp xếp Khóa học cha (Parent Courses):
 * - Tier 1: Có ít nhất 1 lớp đang mở (Còn chỗ / Sắp đầy) -> trên cùng
 * - Tier 2: Có lớp nhưng toàn bộ lớp đã đầy hoặc đã kết thúc/hủy -> phía dưới
 * - Tier 3: Có 0 lớp -> dưới cùng
 */
const getCourseSortTier = (courseClasses: ClassItem[]): number => {
  if (courseClasses.length === 0) {
    return 3;
  }
  const hasAvailableOrNearFullClass = courseClasses.some((c) => getClassSortPriority(c) <= 2);
  return hasAvailableOrNearFullClass ? 1 : 2;
};

interface CourseAccordionGroupProps {
  course: CourseItem;
  classes: ClassItem[];
  isCollapsed: boolean;
  onToggleCollapse: (courseId: number) => void;
  selectedClassIds: Set<number>;
  onToggleSelectClass: (classId: number) => void;
  onToggleSelectCourseClasses: (classIds: number[], selectAll: boolean) => void;
  canManageClassesAndCourses: boolean;
  canEnrollStudent: boolean;
  canViewTuition: boolean;
  isAdmin: boolean;
  onOpenCreateClassForCourse: (courseId: number) => void;
  onEditCourse: (course: CourseItem) => void;
  onDeleteCourse: (course: CourseItem, classesCount: number) => void;
  onSelectClassDetail: (cls: ClassItem) => void;
  onQuickEnroll: (classId: number) => void;
}

const CourseAccordionGroup: React.FC<CourseAccordionGroupProps> = ({
  course: crs,
  classes: courseClasses,
  isCollapsed,
  onToggleCollapse,
  selectedClassIds,
  onToggleSelectClass,
  onToggleSelectCourseClasses,
  canManageClassesAndCourses,
  canEnrollStudent,
  canViewTuition,
  isAdmin,
  onOpenCreateClassForCourse,
  onEditCourse,
  onDeleteCourse,
  onSelectClassDetail,
  onQuickEnroll,
}) => {
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const [copiedClassId, setCopiedClassId] = useState<number | null>(null);

  const handleCopyCode = (e: React.MouseEvent, classId: number, codeText: string) => {
    e.stopPropagation();
    if (!codeText) return;
    navigator.clipboard?.writeText(codeText).catch(() => {});
    setCopiedClassId(classId);
    window.setTimeout(() => {
      setCopiedClassId((prev) => (prev === classId ? null : prev));
    }, 1500);
  };

  const courseClassIds = useMemo(() => courseClasses.map((c) => c.id), [courseClasses]);
  const selectedInCourseCount = useMemo(
    () => courseClassIds.filter((id) => selectedClassIds.has(id)).length,
    [courseClassIds, selectedClassIds]
  );

  const allSelected = courseClassIds.length > 0 && selectedInCourseCount === courseClassIds.length;
  const someSelected = selectedInCourseCount > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const openClassesCount = courseClasses.filter(
    (c) => c.status !== 'COMPLETED' && c.status !== 'CANCELLED'
  ).length;

  return (
    <section className={`course-group-card bg-white ${isCollapsed ? 'is-collapsed' : ''}`}>
      {/* PARENT COURSE HEADER (bg-white) */}
      <div
        className={`course-group-header bg-white ${isCollapsed ? 'collapsed' : ''}`}
        onClick={() => onToggleCollapse(crs.id)}
        role="button"
        tabIndex={0}
        aria-expanded={!isCollapsed}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleCollapse(crs.id);
          }
        }}
      >
        <div className="course-header-main">
          <div className="course-title-row">
            {/* Select All Checkbox in Parent Course Header */}
            <label
              className="course-checkbox-wrap"
              onClick={(e) => e.stopPropagation()}
              title={
                courseClassIds.length === 0
                  ? 'Khóa học chưa có lớp để chọn'
                  : allSelected
                  ? 'Bỏ chọn tất cả lớp thuộc khóa này'
                  : 'Chọn tất cả lớp thuộc khóa này'
              }
            >
              <input
                ref={selectAllRef}
                type="checkbox"
                className="custom-select-checkbox"
                disabled={courseClassIds.length === 0}
                checked={allSelected}
                onChange={(e) => onToggleSelectCourseClasses(courseClassIds, e.target.checked)}
                aria-label={`Chọn tất cả lớp thuộc khóa ${crs.courseName}`}
              />
            </label>

            {/* Accordion Chevron Button */}
            <button
              type="button"
              className={`course-chevron-btn ${isCollapsed ? 'collapsed' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse(crs.id);
              }}
              aria-label={isCollapsed ? 'Mở rộng danh sách lớp' : 'Thu gọn danh sách lớp'}
              title={isCollapsed ? 'Mở rộng danh sách lớp' : 'Thu gọn danh sách lớp'}
            >
              <ChevronDown size={16} />
            </button>

            <span className="course-accent-bar" />
            <h3 className="course-group-title">{crs.courseName}</h3>
            {crs.targetOutput && (
              <span className="course-level-badge">Đầu ra: {crs.targetOutput}</span>
            )}
          </div>

          <div className="course-meta-chips">
            <span className="course-meta-item" title="Thời lượng khóa học">
              <Clock className="w-4 h-4 text-gray-500" size={16} />
              <strong>{crs.totalLessons} buổi</strong>
            </span>
            {canViewTuition && (
              <>
                <span className="course-meta-divider">•</span>
                <span className="course-meta-item" title="Học phí khóa học">
                  <Wallet className="w-4 h-4 text-gray-500" size={16} />
                  <strong className="course-tuition-text">
                    {Number(crs.standardTuition).toLocaleString('vi-VN')} đ
                  </strong>
                </span>
              </>
            )}
            <span className="course-meta-divider">•</span>
            <span
              className={`course-open-badge ${
                openClassesCount > 0 ? 'has-classes' : 'empty-classes text-gray-400'
              }`}
              title={`${openClassesCount} lớp đang mở`}
            >
              <span
                className={`course-status-dot ${openClassesCount > 0 ? 'dot-green' : 'dot-gray'}`}
              />
              <span>{openClassesCount} lớp</span>
            </span>
          </div>
        </div>

        {canManageClassesAndCourses && (
          <div
            className="course-header-actions"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="course-open-class-btn"
              onClick={() => onEditCourse(crs)}
              title={`Chỉnh sửa khóa học ${crs.courseName}`}
              style={{
                background: '#f8fafc',
                color: '#475569',
                borderColor: '#cbd5e1',
                padding: '6px 9px',
              }}
            >
              <Edit2 size={13} />
            </button>
            {isAdmin && (
              <button
                type="button"
                className="course-open-class-btn"
                onClick={() => onDeleteCourse(crs, courseClasses.length)}
                title={`Xóa khóa học ${crs.courseName}`}
                style={{
                  background: '#fef2f2',
                  color: '#dc2626',
                  borderColor: '#fecaca',
                  padding: '6px 9px',
                }}
              >
                <Trash2 size={13} />
              </button>
            )}
            <button
              type="button"
              className="course-open-class-btn"
              onClick={() => onOpenCreateClassForCourse(crs.id)}
              title={`Mở lớp mới thuộc khóa ${crs.courseName}`}
            >
              <Plus size={14} />
              <span>Mở lớp</span>
            </button>
          </div>
        )}
      </div>

      {/* COLLAPSIBLE CHILD CLASSES CONTAINER (bg-slate-50 + Indented + Left Guide Border) */}
      {!isCollapsed && (
        <div className="course-collapsible-body bg-slate-50">
          {courseClasses.length === 0 ? (
            <div className="course-empty-state-row">
              <span className="course-empty-message">Chưa có lớp đang mở</span>
              {canManageClassesAndCourses && (
                <button
                  type="button"
                  className="course-empty-first-btn"
                  onClick={() => onOpenCreateClassForCourse(crs.id)}
                >
                  <Plus size={13} />
                  <span>Mở lớp đầu tiên</span>
                </button>
              )}
            </div>
          ) : (
            <div className="course-classes-list">
              {courseClasses.map((cls) => {
                const { occupancyRate, isFullClass, isNearFull, progressTone, progressBgClass } =
                  getCapacityMetrics(cls);
                const admissionBadge = getAdmissionBadgeInfo(cls, isFullClass, isNearFull);
                const isEndedClass = cls.status === 'COMPLETED' || cls.status === 'CANCELLED';
                const canEnrollThisClass = !isFullClass && !isEndedClass;
                const isSelected = selectedClassIds.has(cls.id);

                return (
                  <div
                    key={cls.id}
                    className={`class-row-card ${isFullClass || isEndedClass ? 'is-full-row' : ''} ${
                      isSelected ? 'is-selected' : ''
                    }`}
                    onClick={() => onSelectClassDetail(cls)}
                  >
                    {/* Cột 1: Checkbox chọn lớp + Tên lớp (kèm Badge trạng thái cạnh tên) & Mã lớp */}
                    <div className="class-col class-col-identity-with-check">
                      <label
                        className="class-checkbox-wrap"
                        onClick={(e) => e.stopPropagation()}
                        title="Chọn lớp học này"
                      >
                        <input
                          type="checkbox"
                          className="custom-select-checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelectClass(cls.id)}
                          aria-label={`Chọn lớp ${cls.className}`}
                        />
                      </label>

                      <div className="class-identity-content">
                        <div className="class-title-line">
                          <h4 className="class-row-name" title={cls.className}>
                            {formatShortClassName(cls.className, crs.courseName, cls.classCode)}
                          </h4>
                          {admissionBadge && (
                            <span className={`class-status-badge ${admissionBadge.tone}`}>
                              {admissionBadge.icon}
                              <span>{admissionBadge.label}</span>
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="class-row-code text-xs text-gray-500"
                          onClick={(e) =>
                            handleCopyCode(e, cls.id, formatShortClassCode(cls.classCode))
                          }
                          title={
                            copiedClassId === cls.id
                              ? 'Đã sao chép mã lớp!'
                              : 'Nhấn để sao chép mã lớp'
                          }
                        >
                          <Hash className="w-3 h-3" size={12} />
                          <span>{formatShortClassCode(cls.classCode)}</span>
                          {copiedClassId === cls.id ? (
                            <Check className="w-3 h-3 copy-code-icon copied" size={12} />
                          ) : (
                            <Copy className="w-3 h-3 copy-code-icon" size={12} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Cột 2: Giảng viên & Phòng học */}
                    <div className="class-col class-col-teacher-room">
                      <div className="class-info-line">
                        <User size={13} className="class-info-icon" />
                        <span className="class-info-primary">
                          {formatTeacherName(cls.teacherName)}
                        </span>
                      </div>
                      <div className="class-info-line sub">
                        <MapPin size={13} className="class-info-icon" />
                        <span>{cls.room || 'Chưa xếp phòng'}</span>
                      </div>
                    </div>

                    {/* Cột 3: Lịch học & Giờ học */}
                    <div className="class-col class-col-schedule">
                      <div className="class-info-line">
                        <Calendar size={13} className="class-info-icon" />
                        <span className="class-info-primary">
                          {getScheduleLabel(cls.scheduleDays)}
                        </span>
                      </div>
                      <div className="class-info-line sub">
                        <Clock size={13} className="class-info-icon" />
                        <span>{cls.timeSlot}</span>
                      </div>
                    </div>

                    {/* Cột 4: Tỷ lệ sĩ số (VD: 4/15) cạnh icon người dùng & Thanh tiến độ động */}
                    <div className="class-col class-col-capacity">
                      <div className="capacity-inline-row">
                        <span className="capacity-fraction-text">
                          <Users className="w-4 h-4 text-gray-500" size={14} />
                          <strong>
                            {cls.currentEnrolled}/{cls.maxCapacity}
                          </strong>
                        </span>
                        <div className="capacity-track">
                          <div
                            className={`capacity-fill tone-${progressTone} ${progressBgClass}`}
                            style={{ width: `${occupancyRate}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cột 5: Nút Hành động Ghi danh */}
                    <div className="class-col class-col-actions">
                      {canEnrollStudent && (
                        <button
                          type="button"
                          className={`class-enroll-btn ${
                            !canEnrollThisClass ? 'disabled opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={!canEnrollThisClass}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!canEnrollThisClass) return;
                            onQuickEnroll(cls.id);
                          }}
                          title={
                            canEnrollThisClass
                              ? `Ghi danh học viên vào lớp ${cls.className}`
                              : 'Lớp đã đầy hoặc không còn nhận học viên'
                          }
                        >
                          <UserPlus size={13} />
                          <span>Ghi danh</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export const ClassesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const canManageClassesAndCourses = hasRequiredRole(user?.role, ACTION_PERMISSIONS.CLASS_CREATE);
  const canEditClass = hasRequiredRole(user?.role, ACTION_PERMISSIONS.CLASS_EDIT);
  const canEnrollStudent = hasRequiredRole(user?.role, ACTION_PERMISSIONS.ENROLL_STUDENT);
  const canRecordPayment = hasRequiredRole(user?.role, ACTION_PERMISSIONS.RECORD_PAYMENT);
  const canTransferClass = hasRequiredRole(user?.role, ACTION_PERMISSIONS.CLASS_TRANSFER);
  const canViewTuition = hasRequiredRole(user?.role, ACTION_PERMISSIONS.VIEW_TUITION);
  const isAdmin = user?.role === 'ADMIN';

  const initialCachedClasses = AcademicService.peekClasses();
  const initialCachedCourses = AcademicService.peekCourses();

  const [classes, setClasses] = useState<ClassItem[]>(initialCachedClasses || []);
  const [courses, setCourses] = useState<CourseItem[]>(initialCachedCourses || []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialCachedClasses);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Quick Filters (Course, Teacher, Schedule, Status)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('ALL');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('ALL');
  const [selectedScheduleFilter, setSelectedScheduleFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Accordion Collapsible State (stores IDs of collapsed courses)
  const [collapsedCourseIds, setCollapsedCourseIds] = useState<Set<number>>(new Set());

  // Bulk Selection State (stores IDs of selected classes)
  const [selectedClassIds, setSelectedClassIds] = useState<Set<number>>(new Set());
  const [bulkActionMessage, setBulkActionMessage] = useState<string | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState<boolean>(false);

  const hasActiveFilter =
    searchQuery.trim() !== '' ||
    selectedCourseFilter !== 'ALL' ||
    selectedTeacherFilter !== 'ALL' ||
    selectedScheduleFilter !== 'ALL' ||
    selectedStatusFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCourseFilter('ALL');
    setSelectedTeacherFilter('ALL');
    setSelectedScheduleFilter('ALL');
    setSelectedStatusFilter('ALL');
  };

  // Modals & Drawer State
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [drawerInitialTab, setDrawerInitialTab] = useState<'GENERAL' | 'ROSTER'>('GENERAL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [createInitialCourseId, setCreateInitialCourseId] = useState<number | undefined>(undefined);

  // Enrollment, Payment & Transfer Modals State
  const [isEnrollWizardOpen, setIsEnrollWizardOpen] = useState<boolean>(false);
  const [enrollWizardInitialClassId, setEnrollWizardInitialClassId] = useState<number | undefined>(
    undefined
  );
  const [selectedEnrollmentForPayment, setSelectedEnrollmentForPayment] =
    useState<ClassEnrollmentItem | null>(null);
  const [selectedEnrollmentForTransfer, setSelectedEnrollmentForTransfer] =
    useState<ClassEnrollmentItem | null>(null);
  const [receiptForPrint, setReceiptForPrint] = useState<PaymentReceipt | null>(null);
  const [enrollmentForPrint, setEnrollmentForPrint] = useState<ClassEnrollmentItem | null>(null);

  const showTemporaryFeedback = (msg: string) => {
    setBulkActionMessage(msg);
    window.setTimeout(() => {
      setBulkActionMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleQuickReceipt = async (en: ClassEnrollmentItem) => {
    try {
      const receipts = await AcademicService.getPaymentReceipts(en.id);
      if (receipts && receipts.length > 0) {
        setReceiptForPrint(receipts[0]);
        setEnrollmentForPrint(en);
      } else {
        setSelectedEnrollmentForPayment(en);
      }
    } catch {
      setSelectedEnrollmentForPayment(en);
    }
  };

  const loadData = useCallback(async (showSilent = false, forceRefresh = false) => {
    try {
      const hasCached = Boolean(AcademicService.peekClasses());
      if (!showSilent && !hasCached) {
        setIsLoading(true);
      } else if (forceRefresh) {
        setIsRefreshing(true);
      }
      setError(null);

      const [classList, courseList] = await Promise.all([
        AcademicService.getClasses(undefined, { forceRefresh }),
        AcademicService.getCourses(undefined, { forceRefresh }),
      ]);

      setClasses(classList);
      setCourses(courseList);

      // Clean up any selected class IDs that no longer exist
      setSelectedClassIds((prev) => {
        if (prev.size === 0) return prev;
        const validIds = new Set(classList.map((c) => c.id));
        const next = new Set<number>();
        prev.forEach((id) => {
          if (validIds.has(id)) next.add(id);
        });
        return next;
      });

      setSelectedClass((prev) => {
        if (!prev) return null;
        return classList.find((c) => c.id === prev.id) || prev;
      });
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu lớp học / khóa học:', err);
      setError(
        err?.response?.data?.message || err.message || 'Không thể tải dữ liệu từ máy chủ.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Hỗ trợ mở nhanh lớp học từ URL (?classId=123&tab=ROSTER)
  useEffect(() => {
    const classIdParam = searchParams.get('classId');
    if (classIdParam && classes.length > 0) {
      const found = classes.find((c) => c.id === Number(classIdParam));
      if (found) {
        const tabParam = searchParams.get('tab');
        setDrawerInitialTab(tabParam === 'ROSTER' ? 'ROSTER' : 'GENERAL');
        setSelectedClass(found);
        searchParams.delete('classId');
        searchParams.delete('tab');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [classes, searchParams, setSearchParams]);

  // Unique Teacher options derived from classes
  const teacherOptions = useMemo(() => {
    const teacherSet = new Set<string>();
    classes.forEach((c) => {
      const formatted = formatTeacherName(c.teacherName);
      if (formatted && formatted !== 'Chưa phân công') {
        teacherSet.add(formatted);
      }
    });
    return Array.from(teacherSet).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [classes]);

  // Base filtered classes (before status tab filter) for live segmented tab counts
  const baseFilteredClasses = useMemo(() => {
    return classes.filter((c) => {
      if (selectedCourseFilter !== 'ALL' && c.courseId !== Number(selectedCourseFilter)) {
        return false;
      }

      if (selectedTeacherFilter !== 'ALL') {
        const formattedTeacher = formatTeacherName(c.teacherName);
        if (formattedTeacher !== selectedTeacherFilter) {
          return false;
        }
      }

      if (selectedScheduleFilter !== 'ALL' && c.scheduleDays !== selectedScheduleFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.className.toLowerCase().includes(q);
        const matchCode = (c.classCode || '').toLowerCase().includes(q);
        const matchTeacher = formatTeacherName(c.teacherName).toLowerCase().includes(q);
        const matchRoom = (c.room || '').toLowerCase().includes(q);
        const matchCourse = (c.courseName || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchTeacher && !matchRoom && !matchCourse) return false;
      }

      return true;
    });
  }, [classes, searchQuery, selectedCourseFilter, selectedTeacherFilter, selectedScheduleFilter]);

  // Mutually-exclusive 5-tab status counts: AVAILABLE + NEAR_FULL + FULL + ENDED === ALL
  const statusCounts = useMemo(() => {
    let available = 0;
    let nearFull = 0;
    let full = 0;
    let ended = 0;

    baseFilteredClasses.forEach((c) => {
      const isEnded = c.status === 'COMPLETED' || c.status === 'CANCELLED';
      if (isEnded) {
        ended += 1;
        return;
      }

      const { isFullClass, isNearFull } = getCapacityMetrics(c);
      if (isFullClass) {
        full += 1;
      } else if (isNearFull) {
        nearFull += 1;
      } else {
        available += 1;
      }
    });

    return {
      ALL: baseFilteredClasses.length,
      AVAILABLE: available,
      NEAR_FULL: nearFull,
      FULL: full,
      ENDED: ended,
    };
  }, [baseFilteredClasses]);

  // Filtered Classes matching the 5 mutually-exclusive status tabs
  const filteredClasses = useMemo(() => {
    if (selectedStatusFilter === 'ALL') return baseFilteredClasses;

    return baseFilteredClasses.filter((c) => {
      const isEnded = c.status === 'COMPLETED' || c.status === 'CANCELLED';
      if (selectedStatusFilter === 'ENDED') {
        return isEnded;
      }
      if (isEnded) {
        return false;
      }

      const { isFullClass, isNearFull } = getCapacityMetrics(c);
      if (selectedStatusFilter === 'AVAILABLE') {
        return !isFullClass && !isNearFull;
      }
      if (selectedStatusFilter === 'NEAR_FULL') {
        return isNearFull;
      }
      if (selectedStatusFilter === 'FULL') {
        return isFullClass;
      }
      return c.status === selectedStatusFilter;
    });
  }, [baseFilteredClasses, selectedStatusFilter]);

  // Grouped Courses with their Classes (Sorted: Courses with active classes first)
  const groupedCourseSections = useMemo(() => {
    const hasClassLevelFilter =
      searchQuery.trim() !== '' ||
      selectedTeacherFilter !== 'ALL' ||
      selectedScheduleFilter !== 'ALL' ||
      selectedStatusFilter !== 'ALL';

    return courses
      .filter((crs) => {
        if (selectedCourseFilter !== 'ALL' && crs.id !== Number(selectedCourseFilter)) {
          return false;
        }
        return true;
      })
      .map((crs) => {
        const crsClasses = filteredClasses
          .filter((c) => c.courseId === crs.id)
          .sort(compareChildClasses);
        return {
          course: crs,
          classes: crsClasses,
        };
      })
      .filter((group) => {
        if (hasClassLevelFilter && selectedCourseFilter === 'ALL') {
          const q = searchQuery.toLowerCase().trim();
          const courseSelfMatches =
            q !== '' &&
            selectedTeacherFilter === 'ALL' &&
            selectedScheduleFilter === 'ALL' &&
            selectedStatusFilter === 'ALL' &&
            (group.course.courseName.toLowerCase().includes(q) ||
              (group.course.targetOutput || '').toLowerCase().includes(q));
          return group.classes.length > 0 || courseSelfMatches;
        }
        return true;
      })
      .sort((a, b) => {
        const tierDiff = getCourseSortTier(a.classes) - getCourseSortTier(b.classes);
        if (tierDiff !== 0) {
          return tierDiff;
        }
        return a.course.id - b.course.id;
      });
  }, [
    courses,
    filteredClasses,
    selectedCourseFilter,
    selectedTeacherFilter,
    selectedScheduleFilter,
    selectedStatusFilter,
    searchQuery,
  ]);

  // Accordion Handlers
  const handleToggleCollapseCourse = useCallback((courseId: number) => {
    setCollapsedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  }, []);

  // Bulk Selection Handlers
  const handleToggleSelectClass = useCallback((classId: number) => {
    setSelectedClassIds((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }
      return next;
    });
  }, []);

  const handleToggleSelectCourseClasses = useCallback((classIds: number[], selectAll: boolean) => {
    setSelectedClassIds((prev) => {
      const next = new Set(prev);
      classIds.forEach((id) => {
        if (selectAll) {
          next.add(id);
        } else {
          next.delete(id);
        }
      });
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedClassIds(new Set());
  }, []);

  const selectedClassItems = useMemo(
    () => classes.filter((c) => selectedClassIds.has(c.id)),
    [classes, selectedClassIds]
  );

  // CSV Export Helper (supports either a custom list or filteredClasses)
  const exportClassesToCSV = (targetList: ClassItem[], filePrefix = 'Danh_sach_lop_hoc') => {
    if (targetList.length === 0) {
      alert('Không có lớp học nào để xuất.');
      return;
    }

    const headers = [
      'Khóa Học',
      'Mã Lớp',
      'Tên Lớp',
      'Giảng Viên',
      'Lịch Học',
      'Ca Học',
      'Phòng Học',
      'Sĩ Số',
      'Tối Đa',
      'Học Phí (VNĐ)',
    ];

    const rows = targetList.map((c) => [
      `"${c.courseName}"`,
      `"${c.classCode}"`,
      `"${c.className}"`,
      `"${formatTeacherName(c.teacherName)}"`,
      getScheduleLabel(c.scheduleDays),
      `"${c.timeSlot}"`,
      `"${c.room || ''}"`,
      c.currentEnrolled,
      c.maxCapacity,
      c.standardTuition,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute(
      'download',
      `${filePrefix}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteCourse = async (crs: CourseItem, classesCount: number) => {
    const totalCourseClasses = classes.filter((c) => c.courseId === crs.id).length || classesCount;
    if (totalCourseClasses > 0) {
      alert(
        `Không thể xóa khóa học "${crs.courseName}" vì hiện đang có ${totalCourseClasses} lớp học thuộc khóa này.\n\nBạn có thể bấm nút sửa khóa học và tắt trạng thái mở tuyển sinh nếu muốn tạm ngưng.`
      );
      return;
    }
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa khóa học "${crs.courseName}" (${crs.courseCode}) khỏi danh mục đào tạo không?`
    );
    if (!confirmed) return;

    try {
      await AcademicService.deleteCourse(crs.id);
      await loadData(true, true);
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Không thể xóa khóa học này.');
    }
  };

  // Bulk Action Execution (Export, Notify, Change Status)
  const handleBulkAction = async (action: string) => {
    if (selectedClassItems.length === 0) return;

    if (action === 'EXPORT') {
      exportClassesToCSV(selectedClassItems, 'Danh_sach_lop_da_chon');
      showTemporaryFeedback(`Đã xuất dữ liệu ${selectedClassItems.length} lớp học đã chọn.`);
      return;
    }

    if (action === 'NOTIFY') {
      const classNames = selectedClassItems.map((c) => c.className).join(', ');
      showTemporaryFeedback(
        `Đã gửi thông báo nhắc lịch cho ${selectedClassItems.length} lớp: ${classNames}`
      );
      return;
    }

    if (action.startsWith('STATUS_')) {
      const newStatus = action.replace('STATUS_', '') as ClassStatus;
      try {
        setIsBulkProcessing(true);
        await Promise.all(
          selectedClassItems.map((cls) =>
            AcademicService.updateClass(cls.id, { status: newStatus })
          )
        );
        await loadData(true, true);
        const statusText =
          newStatus === 'OPEN'
            ? 'Đang mở tuyển sinh'
            : newStatus === 'IN_PROGRESS'
            ? 'Đang học'
            : newStatus === 'COMPLETED'
            ? 'Đã kết thúc'
            : newStatus;
        showTemporaryFeedback(
          `Đã cập nhật trạng thái "${statusText}" cho ${selectedClassItems.length} lớp học.`
        );
        setSelectedClassIds(new Set());
      } catch (err: any) {
        alert(
          err?.response?.data?.message ||
            err?.message ||
            'Không thể cập nhật trạng thái hàng loạt.'
        );
      } finally {
        setIsBulkProcessing(false);
      }
    }
  };

  const hasSelection = selectedClassIds.size > 0;

  return (
    <div className="classes-page-container pb-32">
      {/* 1A. THANH ĐIỀU HƯỚNG TRẠNG THÁI (TABS) & TÁC VỤ CHÍNH (NGOÀI KHUNG TRẮNG) */}
      <div className="classes-top-action-bar">
        {/* Bên trái: Segmented Status Tabs đếm số lượng trực tiếp */}
        <div
          className="status-segmented-tabs"
          role="tablist"
          aria-label="Lọc nhanh theo trạng thái lớp"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedStatusFilter === 'ALL'}
            className={`status-tab-btn ${selectedStatusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedStatusFilter('ALL')}
          >
            <span>Tất cả</span>
            <span className="status-tab-count">{statusCounts.ALL}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedStatusFilter === 'AVAILABLE'}
            className={`status-tab-btn ${selectedStatusFilter === 'AVAILABLE' ? 'active' : ''}`}
            onClick={() => setSelectedStatusFilter('AVAILABLE')}
          >
            <span className="status-tab-dot dot-green" />
            <span>Còn chỗ</span>
            <span className="status-tab-count">{statusCounts.AVAILABLE}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedStatusFilter === 'NEAR_FULL'}
            className={`status-tab-btn ${selectedStatusFilter === 'NEAR_FULL' ? 'active' : ''}`}
            onClick={() => setSelectedStatusFilter('NEAR_FULL')}
          >
            <span className="status-tab-dot dot-orange" />
            <span>Sắp đầy</span>
            <span className="status-tab-count">{statusCounts.NEAR_FULL}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedStatusFilter === 'FULL'}
            className={`status-tab-btn ${selectedStatusFilter === 'FULL' ? 'active' : ''}`}
            onClick={() => setSelectedStatusFilter('FULL')}
          >
            <span className="status-tab-dot dot-red" />
            <span>Đã đầy</span>
            <span className="status-tab-count">{statusCounts.FULL}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedStatusFilter === 'ENDED'}
            className={`status-tab-btn ${selectedStatusFilter === 'ENDED' ? 'active' : ''}`}
            onClick={() => setSelectedStatusFilter('ENDED')}
          >
            <span className="status-tab-dot dot-gray" />
            <span>Đã kết thúc</span>
            <span className="status-tab-count">{statusCounts.ENDED}</span>
          </button>
        </div>

        {/* Bên phải: Nhóm nút công cụ & Tạo mới toàn trang */}
        <div className="top-global-actions">
          <button
            type="button"
            className="compact-icon-btn"
            onClick={() => loadData(false, true)}
            disabled={isLoading || isRefreshing}
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={15} className={isLoading || isRefreshing ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            className="compact-action-btn"
            onClick={() => exportClassesToCSV(filteredClasses)}
            title="Xuất danh sách lớp ra file CSV"
          >
            <Download size={14} />
            <span>Xuất file</span>
          </button>

          {canManageClassesAndCourses && (
            <>
              <div className="top-actions-divider" />

              <button
                type="button"
                className="compact-action-btn create-course-btn"
                onClick={() => {
                  setEditingCourse(null);
                  setIsCreateCourseModalOpen(true);
                }}
              >
                <Plus size={14} />
                <span>Tạo Khóa Học</span>
              </button>

              <Button
                variant="primary"
                size="md"
                iconLeft={<Plus size={15} />}
                onClick={() => {
                  setCreateInitialCourseId(
                    selectedCourseFilter !== 'ALL' ? Number(selectedCourseFilter) : undefined
                  );
                  setIsCreateModalOpen(true);
                }}
                className="global-create-class-btn"
              >
                Tạo Lớp Mới
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 1B. KHUNG TRẮNG 1 DÒNG DUY NHẤT: DÀNH TRỌN CHO TÌM KIẾM & BỘ LỌC */}
      <div className="classes-compact-toolbar">
        <div className="compact-search-box flex-1">
          <Search size={15} className="compact-search-icon" />
          <input
            type="text"
            placeholder="Tìm theo tên lớp, mã lớp, khóa học, giảng viên, phòng học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="compact-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="compact-search-clear-btn"
              onClick={() => setSearchQuery('')}
              title="Xóa tìm kiếm"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="toolbar-inline-filters">
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className={`toolbar-inline-select w-auto ${
              selectedCourseFilter !== 'ALL' ? 'active' : ''
            }`}
            aria-label="Lọc theo khóa học"
          >
            <option value="ALL">Tất cả khóa học ({courses.length})</option>
            {courses.map((crs) => (
              <option key={crs.id} value={crs.id.toString()}>
                {crs.courseName}
              </option>
            ))}
          </select>

          <select
            value={selectedTeacherFilter}
            onChange={(e) => setSelectedTeacherFilter(e.target.value)}
            className={`toolbar-inline-select w-auto ${
              selectedTeacherFilter !== 'ALL' ? 'active' : ''
            }`}
            aria-label="Lọc theo giảng viên"
          >
            <option value="ALL">Giảng viên: Tất cả</option>
            {teacherOptions.map((teacher) => (
              <option key={teacher} value={teacher}>
                {teacher}
              </option>
            ))}
          </select>

          <select
            value={selectedScheduleFilter}
            onChange={(e) => setSelectedScheduleFilter(e.target.value)}
            className={`toolbar-inline-select w-auto ${
              selectedScheduleFilter !== 'ALL' ? 'active' : ''
            }`}
            aria-label="Lọc theo lịch học"
          >
            <option value="ALL">Mọi lịch học</option>
            <option value="MON_WED_FRI">Thứ 2 - 4 - 6</option>
            <option value="TUE_THU_SAT">Thứ 3 - 5 - 7</option>
            <option value="WEEKEND">Cuối tuần</option>
          </select>

          {hasActiveFilter && (
            <button
              type="button"
              className="toolbar-reset-btn"
              onClick={handleResetFilters}
              title="Đặt lại bộ lọc"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* BULK FEEDBACK TOAST BANNER */}
      {bulkActionMessage && (
        <div className="bulk-feedback-banner" role="status">
          <CheckCircle2 size={16} />
          <span>{bulkActionMessage}</span>
          <button
            type="button"
            className="bulk-feedback-close"
            onClick={() => setBulkActionMessage(null)}
            aria-label="Đóng thông báo"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. DANH SÁCH KHÓA HỌC & CÁC LỚP THUỘC KHÓA (ACCORDION + STICKY HEADER + pb-32) */}
      {error ? (
        <div className="classes-empty-state">
          <p style={{ color: '#dc2626', fontWeight: 600 }}>{error}</p>
          <Button
            variant="glass"
            onClick={() => loadData(false, true)}
            style={{ marginTop: '12px' }}
          >
            Thử lại
          </Button>
        </div>
      ) : isLoading ? (
        <CardGridSkeleton count={6} />
      ) : groupedCourseSections.length === 0 ? (
        <div className="classes-empty-state">
          <BookOpen size={36} style={{ color: '#94a3b8', margin: '0 auto 10px auto' }} />
          <h3>Không tìm thấy khóa học hoặc lớp học phù hợp</h3>
          <p>Hãy thử điều chỉnh từ khóa tìm kiếm hoặc đặt lại bộ lọc.</p>
          {hasActiveFilter && (
            <Button variant="glass" onClick={handleResetFilters}>
              Đặt lại bộ lọc
            </Button>
          )}
        </div>
      ) : (
        <div className="course-groups-container pb-32">
          {groupedCourseSections.map(({ course: crs, classes: courseClasses }) => (
            <CourseAccordionGroup
              key={crs.id}
              course={crs}
              classes={courseClasses}
              isCollapsed={collapsedCourseIds.has(crs.id)}
              onToggleCollapse={handleToggleCollapseCourse}
              selectedClassIds={selectedClassIds}
              onToggleSelectClass={handleToggleSelectClass}
              onToggleSelectCourseClasses={handleToggleSelectCourseClasses}
              canManageClassesAndCourses={canManageClassesAndCourses}
              canEnrollStudent={canEnrollStudent}
              canViewTuition={canViewTuition}
              isAdmin={isAdmin}
              onOpenCreateClassForCourse={(courseId) => {
                setCreateInitialCourseId(courseId);
                setIsCreateModalOpen(true);
              }}
              onEditCourse={(courseItem) => {
                setEditingCourse(courseItem);
                setIsCreateCourseModalOpen(true);
              }}
              onDeleteCourse={handleDeleteCourse}
              onSelectClassDetail={(cls) => {
                setDrawerInitialTab('GENERAL');
                setSelectedClass(cls);
              }}
              onQuickEnroll={(classId) => {
                setEnrollWizardInitialClassId(classId);
                setIsEnrollWizardOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* FIXED FLOATING BULK ACTION BAR (Portal to document.body with smooth slide-up/down transition) */}
      {createPortal(
        <div
          className={`bulk-floating-bar fixed bottom-8 left-1/2 -translate-x-1/2 z-50 shadow-2xl ${
            hasSelection ? 'is-visible' : 'is-hidden'
          }`}
          role="region"
          aria-label="Thanh thao tác hàng loạt"
          aria-hidden={!hasSelection}
        >
          <div className="bulk-bar-left">
            <span className="bulk-count-badge">
              <CheckSquare size={14} />
              <span>Đã chọn {selectedClassIds.size} lớp</span>
            </span>
            <button
              type="button"
              className="bulk-clear-btn"
              onClick={handleClearSelection}
              tabIndex={hasSelection ? 0 : -1}
            >
              Bỏ chọn
            </button>
          </div>

          <div className="bulk-bar-actions">
            <button
              type="button"
              className="bulk-action-pill"
              onClick={() => handleBulkAction('EXPORT')}
              disabled={!hasSelection || isBulkProcessing}
              tabIndex={hasSelection ? 0 : -1}
            >
              <Download size={14} />
              <span>Xuất CSV</span>
            </button>

            <button
              type="button"
              className="bulk-action-pill"
              onClick={() => handleBulkAction('NOTIFY')}
              disabled={!hasSelection || isBulkProcessing}
              tabIndex={hasSelection ? 0 : -1}
            >
              <Bell size={14} />
              <span>Gửi thông báo</span>
            </button>

            {canEditClass && (
              <div className="bulk-status-select-wrap">
                <Layers size={14} className="bulk-status-icon" />
                <select
                  value=""
                  disabled={!hasSelection || isBulkProcessing}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) handleBulkAction(val);
                  }}
                  className="bulk-status-select"
                  aria-label="Đổi trạng thái hàng loạt"
                  tabIndex={hasSelection ? 0 : -1}
                >
                  <option value="">Đổi trạng thái...</option>
                  <option value="STATUS_OPEN">Đang mở tuyển sinh</option>
                  <option value="STATUS_IN_PROGRESS">Đang học</option>
                  <option value="STATUS_COMPLETED">Đã kết thúc</option>
                </select>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* 3. MODALS & DRAWER */}
      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => loadData(true, true)}
        initialCourseId={createInitialCourseId}
      />

      <CreateCourseModal
        isOpen={isCreateCourseModalOpen}
        editingCourse={editingCourse}
        onClose={() => {
          setIsCreateCourseModalOpen(false);
          setEditingCourse(null);
        }}
        onSuccess={() => loadData(true, true)}
      />

      <EnrollStudentWizardModal
        isOpen={isEnrollWizardOpen}
        onClose={() => setIsEnrollWizardOpen(false)}
        onSuccess={() => loadData(true, true)}
        initialClassId={enrollWizardInitialClassId}
        onPrintReceipt={(receipt, en) => {
          setReceiptForPrint(receipt);
          setEnrollmentForPrint(en);
        }}
      />

      <RecordPaymentModal
        isOpen={!!selectedEnrollmentForPayment}
        enrollment={selectedEnrollmentForPayment}
        onClose={() => setSelectedEnrollmentForPayment(null)}
        onSuccess={() => loadData(true, true)}
        onPrintReceipt={(receipt, en) => {
          setReceiptForPrint(receipt);
          setEnrollmentForPrint(en);
        }}
      />

      <ReceiptPrintModal
        isOpen={!!receiptForPrint && !!enrollmentForPrint}
        receipt={receiptForPrint}
        enrollment={enrollmentForPrint}
        onClose={() => {
          setReceiptForPrint(null);
          setEnrollmentForPrint(null);
        }}
      />

      <TransferClassModal
        isOpen={!!selectedEnrollmentForTransfer}
        enrollment={selectedEnrollmentForTransfer}
        onClose={() => setSelectedEnrollmentForTransfer(null)}
        onSuccess={() => loadData(true, true)}
      />

      <ClassDetailDrawer
        classItem={selectedClass}
        initialTab={drawerInitialTab}
        isOpen={!!selectedClass}
        onClose={() => setSelectedClass(null)}
        onUpdated={() => loadData(true, true)}
        canEdit={canEditClass}
        onEnrollClick={
          canEnrollStudent
            ? (classId) => {
                setEnrollWizardInitialClassId(classId);
                setIsEnrollWizardOpen(true);
              }
            : undefined
        }
        onCollectPayment={
          canRecordPayment ? (en) => setSelectedEnrollmentForPayment(en) : undefined
        }
        onTransferClass={canTransferClass ? (en) => setSelectedEnrollmentForTransfer(en) : undefined}
        onPrintReceipt={(en) => handleQuickReceipt(en)}
      />
    </div>
  );
};

export default ClassesPage;
