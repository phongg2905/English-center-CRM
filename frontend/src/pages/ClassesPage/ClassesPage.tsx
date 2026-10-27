import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  MapPin,
  Search,
  Plus,
  RefreshCw,
  Download,
  Users,
  User,
  Lock,
  SlidersHorizontal,
  RotateCcw,
  X,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';

import { AcademicService } from '../../services/academic.service';
import { SettingsService } from '../../services/settings.service';
import type {
  ClassItem,
  CourseItem,
  ScheduleDays,
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
import { Button, TableSkeleton, PaginationBar } from '../../components/ui';
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

export const ClassesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const canManageClassesAndCourses = hasRequiredRole(user?.role, ACTION_PERMISSIONS.CLASS_CREATE);
  const canEnroll = hasRequiredRole(user?.role, ACTION_PERMISSIONS.ENROLL_STUDENT);
  const canRecordPayment = hasRequiredRole(user?.role, ACTION_PERMISSIONS.RECORD_PAYMENT);
  const canTransfer = hasRequiredRole(user?.role, ACTION_PERMISSIONS.CLASS_TRANSFER);
  const canViewTuition = hasRequiredRole(user?.role, ACTION_PERMISSIONS.VIEW_TUITION);

  // Khởi tạo trực tiếp từ Smart Cache nếu đã có dữ liệu để chuyển trang không bị nháy loading
  const initialCachedClasses = AcademicService.peekClasses();
  const initialCachedCourses = AcademicService.peekCourses();
  const initialCachedSettings = SettingsService.peekSettings();

  const [classes, setClasses] = useState<ClassItem[]>(initialCachedClasses || []);
  const [courses, setCourses] = useState<CourseItem[]>(initialCachedCourses || []);
  const [occupancyWarningRate, setOccupancyWarningRate] = useState<number>(
    initialCachedSettings?.occupancyWarningRate || 85
  );
  const [isLoading, setIsLoading] = useState<boolean>(!initialCachedClasses);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // View Mode: 'CLASSES' | 'COURSES'
  const [viewMode, setViewMode] = useState<'CLASSES' | 'COURSES'>('CLASSES');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('ALL');
  const [selectedScheduleFilter, setSelectedScheduleFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [classPage, setClassPage] = useState<number>(1);
  const [classPageSize, setClassPageSize] = useState<number>(6);
  const [coursePage, setCoursePage] = useState<number>(1);
  const [coursePageSize, setCoursePageSize] = useState<number>(6);

  // Popover Filter State
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState<boolean>(false);
  const filterPopoverRef = useRef<HTMLDivElement>(null);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCourseFilter !== 'ALL') count++;
    if (selectedScheduleFilter !== 'ALL') count++;
    if (selectedStatusFilter !== 'ALL') count++;
    return count;
  }, [selectedCourseFilter, selectedScheduleFilter, selectedStatusFilter]);

  const handleResetFilters = () => {
    setSelectedCourseFilter('ALL');
    setSelectedScheduleFilter('ALL');
    setSelectedStatusFilter('ALL');
    setClassPage(1);
    setCoursePage(1);
  };

  // Modals & Drawer State
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [drawerInitialTab, setDrawerInitialTab] = useState<'GENERAL' | 'ROSTER'>('ROSTER');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [createInitialCourseId, setCreateInitialCourseId] = useState<number | undefined>(undefined);
  const isAdmin = user?.role === 'ADMIN';

  // FE-05B Modals State
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

  // Load Data (tận dụng Smart Cache trừ khi forceRefresh = true)
  const loadData = useCallback(async (showSilent = false, forceRefresh = false) => {
    try {
      const hasCached = Boolean(AcademicService.peekClasses());
      if (!showSilent && !hasCached) {
        setIsLoading(true);
      } else if (forceRefresh) {
        setIsRefreshing(true);
      }
      setError(null);

      const [classList, courseList, sysSettings] = await Promise.all([
        AcademicService.getClasses(undefined, { forceRefresh }),
        AcademicService.getCourses(undefined, { forceRefresh }),
        SettingsService.getSettings({ forceRefresh }).catch(() => null),
      ]);

      setClasses(classList);
      setCourses(courseList);
      if (sysSettings?.occupancyWarningRate) {
        setOccupancyWarningRate(sysSettings.occupancyWarningRate);
      }

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
        setDrawerInitialTab(tabParam === 'GENERAL' ? 'GENERAL' : 'ROSTER');
        setSelectedClass(found);
        searchParams.delete('classId');
        searchParams.delete('tab');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [classes, searchParams, setSearchParams]);

  // Filtered Classes
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.className.toLowerCase().includes(q);
        const matchCode = c.classCode.toLowerCase().includes(q);
        const matchTeacher = (c.teacherName || '').toLowerCase().includes(q);
        const matchRoom = (c.room || '').toLowerCase().includes(q);
        const matchCourse = (c.courseName || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchTeacher && !matchRoom && !matchCourse) return false;
      }

      if (selectedCourseFilter !== 'ALL') {
        if (c.courseId !== Number(selectedCourseFilter)) return false;
      }

      if (selectedScheduleFilter !== 'ALL') {
        if (c.scheduleDays !== selectedScheduleFilter) return false;
      }

      if (selectedStatusFilter !== 'ALL') {
        if (c.status !== selectedStatusFilter) return false;
      }

      return true;
    });
  }, [classes, searchQuery, selectedCourseFilter, selectedScheduleFilter, selectedStatusFilter]);

  const paginatedClasses = useMemo(() => {
    const start = (classPage - 1) * classPageSize;
    return filteredClasses.slice(start, start + classPageSize);
  }, [filteredClasses, classPage, classPageSize]);

  const filteredCourses = useMemo(() => {
    return courses.filter((crs) => {
      if (selectedCourseFilter !== 'ALL' && crs.id !== Number(selectedCourseFilter)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = crs.courseName.toLowerCase().includes(q);
        const matchDesc = (crs.description || '').toLowerCase().includes(q);
        const matchTarget = (crs.targetOutput || '').toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchTarget) return false;
      }
      return true;
    });
  }, [courses, searchQuery, selectedCourseFilter]);

  const paginatedCourses = useMemo(() => {
    const start = (coursePage - 1) * coursePageSize;
    return filteredCourses.slice(start, start + coursePageSize);
  }, [filteredCourses, coursePage, coursePageSize]);

  useEffect(() => {
    setClassPage(1);
    setCoursePage(1);
  }, [searchQuery, selectedCourseFilter, selectedScheduleFilter, selectedStatusFilter, viewMode]);

  const handleExportCSV = () => {
    if (filteredClasses.length === 0) {
      alert('Không có lớp học nào thỏa điều kiện lọc để xuất.');
      return;
    }

    const headers = [
      'Mã Lớp',
      'Tên Lớp',
      'Khóa Học',
      'Lịch Học',
      'Ca Học',
      'Phòng Học',
      'Giảng Viên',
      'Sĩ Số Hiện Tại',
      'Sĩ Số Tối Đa',
      'Trạng Thái',
      'Ngày Khai Giảng',
    ];

    const rows = filteredClasses.map((c) => [
      c.classCode,
      `"${c.className}"`,
      `"${c.courseName}"`,
      c.scheduleDays,
      `"${c.timeSlot}"`,
      `"${c.room || ''}"`,
      `"${c.teacherName || ''}"`,
      c.currentEnrolled,
      c.maxCapacity,
      CLASS_STATUS_META[c.status]?.label || c.status,
      c.startDate,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Danh_sach_lop_hoc_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getScheduleLabel = (days: ScheduleDays) => {
    switch (days) {
      case 'MON_WED_FRI':
        return 'Thứ 2 - 4 - 6';
      case 'TUE_THU_SAT':
        return 'Thứ 3 - 5 - 7';
      case 'WEEKEND':
        return 'Cuối tuần T7 - CN';
      default:
        return days;
    }
  };

  const openClassDrawer = (cls: ClassItem, tab: 'GENERAL' | 'ROSTER') => {
    setDrawerInitialTab(tab);
    setSelectedClass(cls);
  };

  const handleDeleteCourse = async (crs: CourseItem, classesCount: number) => {
    if (classesCount > 0) {
      alert(
        `Không thể xóa khóa học "${crs.courseName}" vì hiện đang có ${classesCount} lớp học thuộc khóa này.\n\nBạn có thể bấm "Sửa khóa học" và tắt trạng thái mở tuyển sinh nếu muốn tạm ngưng.`
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

  const handlePrintFromRoster = async (en: ClassEnrollmentItem) => {
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

  return (
    <div className="classes-page-container">
      {/* 1. COMPACT LINEAR / STRIPE TOOLBAR */}
      <div className="classes-compact-toolbar">
        {/* Left: View Mode Segmented Switcher */}
        <div className="compact-view-switcher">
          <button
            type="button"
            className={`compact-view-tab ${viewMode === 'CLASSES' ? 'active' : ''}`}
            onClick={() => setViewMode('CLASSES')}
          >
            <Users size={14} />
            <span>Lớp Học</span>
            <span className="compact-count-pill">{classes.length}</span>
          </button>
          <button
            type="button"
            className={`compact-view-tab ${viewMode === 'COURSES' ? 'active' : ''}`}
            onClick={() => setViewMode('COURSES')}
          >
            <BookOpen size={14} />
            <span>Khóa Học</span>
            <span className="compact-count-pill">{courses.length}</span>
          </button>
        </div>

        <div className="compact-toolbar-divider" />

        {/* Center: Fluid Search Bar */}
        <div className="compact-search-box">
          <Search size={15} className="compact-search-icon" />
          <input
            type="text"
            placeholder="Tìm tên lớp, mã lớp, giảng viên, phòng học, khóa học..."
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

        <div className="compact-toolbar-divider" />

        {/* Right: Actions Group */}
        <div className="compact-actions-group">
          <div className="compact-filter-container" ref={filterPopoverRef}>
            <button
              type="button"
              className={`compact-action-btn filter-trigger ${activeFilterCount > 0 ? 'active' : ''}`}
              onClick={() => setIsFilterPopoverOpen((prev) => !prev)}
              title="Bộ lọc điều kiện"
            >
              <SlidersHorizontal size={14} />
              <span>Bộ lọc</span>
              {activeFilterCount > 0 && (
                <span className="filter-badge-number">{activeFilterCount}</span>
              )}
            </button>

            {isFilterPopoverOpen && (
              <>
                <div
                  className="filter-popover-backdrop"
                  onClick={() => setIsFilterPopoverOpen(false)}
                />
                <div className="filter-popover-card">
                  <div className="filter-popover-header">
                    <span className="filter-popover-title">Bộ lọc nâng cao</span>
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        className="filter-reset-link"
                        onClick={handleResetFilters}
                      >
                        <RotateCcw size={12} />
                        <span>Đặt lại</span>
                      </button>
                    )}
                  </div>

                  <div className="filter-popover-body">
                    <div className="popover-filter-field">
                      <label>Khóa học</label>
                      <select
                        value={selectedCourseFilter}
                        onChange={(e) => setSelectedCourseFilter(e.target.value)}
                        className="popover-select"
                      >
                        <option value="ALL">Tất cả khóa học</option>
                        {courses.map((crs) => (
                          <option key={crs.id} value={crs.id.toString()}>
                            {crs.courseName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {viewMode === 'CLASSES' && (
                      <div className="popover-filter-field">
                        <label>Lịch học trong tuần</label>
                        <select
                          value={selectedScheduleFilter}
                          onChange={(e) => setSelectedScheduleFilter(e.target.value)}
                          className="popover-select"
                        >
                          <option value="ALL">Tất cả lịch học</option>
                          <option value="MON_WED_FRI">Thứ 2 - 4 - 6</option>
                          <option value="TUE_THU_SAT">Thứ 3 - 5 - 7</option>
                          <option value="WEEKEND">Cuối tuần T7 - CN</option>
                        </select>
                      </div>
                    )}

                    {viewMode === 'CLASSES' && (
                      <div className="popover-filter-field">
                        <label>Trạng thái lớp học</label>
                        <select
                          value={selectedStatusFilter}
                          onChange={(e) => setSelectedStatusFilter(e.target.value)}
                          className="popover-select"
                        >
                          <option value="ALL">Tất cả trạng thái</option>
                          <option value="PLANNING">Dự kiến mở (PLANNING)</option>
                          <option value="OPEN">Đang tuyển sinh (OPEN)</option>
                          <option value="IN_PROGRESS">Đang học (IN_PROGRESS)</option>
                          <option value="FULL">Đã đầy lớp (FULL)</option>
                          <option value="COMPLETED">Đã kết thúc (COMPLETED)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="filter-popover-footer">
                    <button
                      type="button"
                      className="popover-apply-btn"
                      onClick={() => setIsFilterPopoverOpen(false)}
                    >
                      Áp dụng bộ lọc
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Refresh Button (Force Invalidate Cache) */}
          <button
            type="button"
            className="compact-icon-btn"
            onClick={() => loadData(false, true)}
            disabled={isLoading || isRefreshing}
            title="Làm mới dữ liệu từ máy chủ"
          >
            <RefreshCw size={15} className={isLoading || isRefreshing ? 'animate-spin' : ''} />
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            className="compact-action-btn"
            onClick={handleExportCSV}
            title="Xuất file CSV"
          >
            <Download size={14} />
            <span>Xuất file</span>
          </button>

          {/* CTA Buttons: Cho phép Tạo Khóa Học & Mở Lớp Mới */}
          {canManageClassesAndCourses && (
            <>
              <Button
                variant="primary"
                size="md"
                iconLeft={<Plus size={15} />}
                onClick={() => {
                  setEditingCourse(null);
                  setIsCreateCourseModalOpen(true);
                }}
                style={{
                  background: '#16a34a',
                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.22)',
                  fontWeight: 600,
                  padding: '7px 12px',
                  borderRadius: '10px',
                  fontSize: '12.5px',
                }}
              >
                Tạo Khóa Học
              </Button>
              <Button
                variant="primary"
                size="md"
                iconLeft={<Plus size={15} />}
                onClick={() => {
                  setCreateInitialCourseId(undefined);
                  setIsCreateModalOpen(true);
                }}
                style={{
                  background: '#2563eb',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                  fontWeight: 600,
                  padding: '7px 12px',
                  borderRadius: '10px',
                  fontSize: '12.5px',
                }}
              >
                Mở Lớp Mới
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Quick Status Filter Pills for Classes */}
      {viewMode === 'CLASSES' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '14px',
          }}
        >
          {[
            { code: 'ALL', label: `Tất cả (${classes.length})` },
            {
              code: 'OPEN',
              label: `Đang tuyển sinh (${classes.filter((c) => c.status === 'OPEN').length})`,
            },
            {
              code: 'IN_PROGRESS',
              label: `Đang học (${classes.filter((c) => c.status === 'IN_PROGRESS').length})`,
            },
            {
              code: 'PLANNING',
              label: `Dự kiến mở (${classes.filter((c) => c.status === 'PLANNING').length})`,
            },
            {
              code: 'FULL',
              label: `Đã đầy (${classes.filter((c) => c.status === 'FULL' || c.isFull).length})`,
            },
            {
              code: 'COMPLETED',
              label: `Đã kết thúc (${classes.filter((c) => c.status === 'COMPLETED').length})`,
            },
          ].map((pill) => {
            const active = selectedStatusFilter === pill.code;
            return (
              <button
                key={pill.code}
                type="button"
                onClick={() => setSelectedStatusFilter(pill.code)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: active ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  background: active ? '#eff6ff' : '#ffffff',
                  color: active ? '#1d4ed8' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      )}

      {error ? (
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #fee2e2',
          }}
        >
          <p style={{ color: '#dc2626', fontWeight: 600 }}>{error}</p>
          <Button variant="glass" onClick={() => loadData(false, true)} style={{ marginTop: '12px' }}>
            Thử lại
          </Button>
        </div>
      ) : isLoading ? (
        <TableSkeleton rows={5} />
      ) : viewMode === 'CLASSES' ? (
        filteredClasses.length === 0 ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: '#ffffff',
              borderRadius: '18px',
              border: '1px dashed #cbd5e1',
            }}
          >
            <BookOpen size={40} style={{ color: '#94a3b8', margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#334155' }}>
              Không tìm thấy lớp học phù hợp
            </h3>
            <p style={{ margin: '6px 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.
            </p>
            {canManageClassesAndCourses && (
              <Button
                variant="primary"
                iconLeft={<Plus size={15} />}
                onClick={() => {
                  setCreateInitialCourseId(undefined);
                  setIsCreateModalOpen(true);
                }}
                style={{ background: '#2563eb' }}
              >
                Mở Lớp Học Mới Ngay
              </Button>
            )}
          </div>
        ) : (
          <>
          <div className="classes-grid-container">
            {paginatedClasses.map((cls) => {
              const isFullClass = cls.status === 'FULL' || cls.isFull || cls.currentEnrolled >= cls.maxCapacity;
              const occupancyRate =
                cls.maxCapacity > 0 ? (cls.currentEnrolled / cls.maxCapacity) * 100 : 0;
              const isNearFull =
                !isFullClass &&
                cls.status !== 'COMPLETED' &&
                occupancyRate >= occupancyWarningRate;
              const statusMeta =
                CLASS_STATUS_META[isFullClass && cls.status !== 'COMPLETED' ? 'FULL' : cls.status] ||
                CLASS_STATUS_META.OPEN;

              return (
                <div
                  key={cls.id}
                  className={`class-card ${
                    isFullClass ? 'is-full-alert' : isNearFull ? 'is-near-full-alert' : ''
                  }`}
                  onClick={() => openClassDrawer(cls, 'ROSTER')}
                >
                  {/* Card Header: Class Title & Status Badge */}
                  <div className="class-card-header">
                    <div className="class-header-titles">
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '3px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '1px 7px',
                            borderRadius: '5px',
                            background: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #dbeafe',
                          }}
                        >
                          {cls.classCode}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                          {cls.courseName}
                        </span>
                      </div>
                      <h4 className="class-name-heading" title={cls.className}>
                        {cls.className}
                      </h4>
                      <div className="class-submeta-row">
                        <span className="class-teacher-text">
                          <User size={12} />
                          <span>{cls.teacherName || 'Chưa phân công GV'}</span>
                        </span>
                      </div>
                    </div>

                    {isFullClass && cls.status !== 'COMPLETED' ? (
                      <span className="class-status-badge full">
                        <Lock size={11} /> ĐÃ ĐẦY LỚP
                      </span>
                    ) : isNearFull ? (
                      <span
                        className="class-status-badge"
                        style={{
                          background: '#fef3c7',
                          color: '#b45309',
                          border: '1px solid #fde68a',
                        }}
                        title={`Sĩ số đạt ${Math.round(occupancyRate)}%, chạm ngưỡng cảnh báo ${occupancyWarningRate}%`}
                      >
                        ⚠️ Sắp đầy ({Math.round(occupancyRate)}%)
                      </span>
                    ) : (
                      <span
                        className="class-status-badge"
                        style={{
                          background: statusMeta.bg,
                          color: statusMeta.color,
                          border: `1px solid ${statusMeta.border}`,
                        }}
                      >
                        ● {statusMeta.label}
                      </span>
                    )}
                  </div>

                  {/* Schedule & Room Row */}
                  <div className="class-schedule-row">
                    <span className="class-meta-inline">
                      <Calendar size={13} />
                      <span>
                        {getScheduleLabel(cls.scheduleDays)} ({cls.timeSlot})
                      </span>
                    </span>
                    <span className="class-meta-dot">•</span>
                    <span className="class-meta-inline">
                      <MapPin size={13} />
                      <span>{cls.room || 'Chưa xếp phòng'}</span>
                    </span>
                  </div>

                  {/* Real-time Capacity Progress Bar */}
                  <div
                    style={{
                      paddingTop: '8px',
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12.5px',
                      }}
                    >
                      <span style={{ color: '#475569' }}>
                        Sĩ số học viên:{' '}
                        <strong style={{ color: '#0f172a' }}>
                          {cls.currentEnrolled}/{cls.maxCapacity}
                        </strong>
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background:
                            cls.status === 'COMPLETED'
                              ? '#f1f5f9'
                              : isFullClass
                              ? '#fee2e2'
                              : cls.availableSeats <= 2
                              ? '#fef3c7'
                              : '#dcfce7',
                          color:
                            cls.status === 'COMPLETED'
                              ? '#475569'
                              : isFullClass
                              ? '#dc2626'
                              : cls.availableSeats <= 2
                              ? '#b45309'
                              : '#166534',
                        }}
                      >
                        {cls.status === 'COMPLETED'
                          ? 'Đã hoàn thành'
                          : isFullClass
                          ? 'Hết chỗ'
                          : `Còn ${cls.availableSeats} chỗ`}
                      </span>
                    </div>

                    {/* Direct Action Buttons: Xem danh sách học viên & Chi tiết */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '4px',
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openClassDrawer(cls, 'ROSTER');
                        }}
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                          cursor: 'pointer',
                        }}
                        title="Xem danh sách các học viên trong lớp này"
                      >
                        <Users size={13} />
                        <span>Xem danh sách HV ({cls.currentEnrolled})</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openClassDrawer(cls, 'GENERAL');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: '#f8fafc',
                          color: '#475569',
                          border: '1px solid #e2e8f0',
                          cursor: 'pointer',
                        }}
                        title="Xem thông tin tổng quan & chỉnh sửa lớp học"
                      >
                        <Eye size={13} />
                        <span>Chi tiết</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <PaginationBar
            currentPage={classPage}
            totalItems={filteredClasses.length}
            pageSize={classPageSize}
            onPageChange={setClassPage}
            onPageSizeChange={(size) => {
              setClassPageSize(size);
              setClassPage(1);
            }}
            pageSizeOptions={[6, 9, 12]}
            itemLabel="lớp học"
            style={{ marginTop: '14px', border: '1px solid #e2e8f0' }}
          />
          </>
        )
      ) : (
        /* ========================================================
           VIEW MODE 2: DANH MỤC KHÓA HỌC & LỘ TRÌNH (COURSE CATALOG)
           ======================================================== */
        <>
        <div className="course-catalog-grid">
          {paginatedCourses.map((crs) => {
            const courseClasses = classes.filter((c) => c.courseId === crs.id);
            return (
              <div key={crs.id} className="course-catalog-card">
                <div className="course-header-row">
                  <div className="course-header-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                        }}
                      >
                        {crs.courseCode}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: crs.isActive !== false ? '#dcfce7' : '#f1f5f9',
                          color: crs.isActive !== false ? '#15803d' : '#64748b',
                        }}
                      >
                        {crs.isActive !== false ? '● Đang mở đào tạo' : '○ Tạm ngưng'}
                      </span>
                    </div>
                    <div className="course-title-price-row">
                      <h3 className="course-title">{crs.courseName}</h3>
                      {canViewTuition && (
                        <span className="course-tuition-val">
                          {Number(crs.standardTuition).toLocaleString('vi-VN')} đ
                        </span>
                      )}
                    </div>
                    <p className="course-desc">
                      {crs.description || 'Chương trình đào tạo chuẩn quốc tế'}
                    </p>
                  </div>
                </div>

                <div className="course-meta-pills-row">
                  <span className="course-meta-pill">⏱ {crs.totalLessons} buổi học</span>
                  {crs.minEntryScore !== null && crs.maxEntryScore !== null && (
                    <span className="course-meta-pill">
                      📊 Đầu vào: {crs.minEntryScore} - {crs.maxEntryScore}
                    </span>
                  )}
                  <span className="course-meta-pill target">
                    🎯 {crs.targetOutput || 'Chuẩn cam kết đầu ra'}
                  </span>
                </div>

                <div className="course-footer-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="course-classes-count-btn"
                    onClick={() => {
                      setSelectedCourseFilter(crs.id.toString());
                      setViewMode('CLASSES');
                    }}
                    title="Bấm để xem danh sách lớp của khóa này"
                  >
                    <Users size={13} />
                    <span>{courseClasses.length} lớp học</span>
                  </button>

                  {canManageClassesAndCourses && (
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        className="course-classes-count-btn"
                        onClick={() => {
                          setEditingCourse(crs);
                          setIsCreateCourseModalOpen(true);
                        }}
                        style={{
                          background: '#f8fafc',
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                        }}
                        title="Chỉnh sửa thông tin, học phí & lộ trình khóa học"
                      >
                        <Edit2 size={13} />
                        <span>Sửa khóa</span>
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          className="course-classes-count-btn"
                          onClick={() => handleDeleteCourse(crs, courseClasses.length)}
                          style={{
                            background: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            padding: '6px 9px',
                          }}
                          title="Xóa khóa học khỏi danh mục"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}

                      <button
                        type="button"
                        className="course-classes-count-btn"
                        onClick={() => {
                          setCreateInitialCourseId(crs.id);
                          setIsCreateModalOpen(true);
                        }}
                        style={{
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                        }}
                      >
                        <Plus size={13} />
                        <span>Mở lớp mới</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <PaginationBar
          currentPage={coursePage}
          totalItems={filteredCourses.length}
          pageSize={coursePageSize}
          onPageChange={setCoursePage}
          onPageSizeChange={(size) => {
            setCoursePageSize(size);
            setCoursePage(1);
          }}
          pageSizeOptions={[6, 9, 12]}
          itemLabel="khóa học"
          style={{ marginTop: '14px', border: '1px solid #e2e8f0' }}
        />
        </>
      )}

      {/* 4. CREATE CLASS MODAL */}
      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => loadData(true, true)}
        initialCourseId={createInitialCourseId}
      />

      {/* 4b. CREATE / EDIT COURSE MODAL */}
      <CreateCourseModal
        isOpen={isCreateCourseModalOpen}
        editingCourse={editingCourse}
        onClose={() => {
          setIsCreateCourseModalOpen(false);
          setEditingCourse(null);
        }}
        onSuccess={() => loadData(true, true)}
      />

      {/* 4c. ENROLL STUDENT WIZARD MODAL */}
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

      {/* 4d. RECORD PAYMENT MODAL */}
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

      {/* 4e. RECEIPT PRINT MODAL */}
      <ReceiptPrintModal
        isOpen={!!receiptForPrint && !!enrollmentForPrint}
        receipt={receiptForPrint}
        enrollment={enrollmentForPrint}
        onClose={() => {
          setReceiptForPrint(null);
          setEnrollmentForPrint(null);
        }}
      />

      {/* 4f. TRANSFER CLASS MODAL */}
      <TransferClassModal
        isOpen={!!selectedEnrollmentForTransfer}
        enrollment={selectedEnrollmentForTransfer}
        onClose={() => setSelectedEnrollmentForTransfer(null)}
        onSuccess={() => loadData(true, true)}
      />

      {/* 5. CLASS DETAIL DRAWER */}
      <ClassDetailDrawer
        classItem={selectedClass}
        initialTab={drawerInitialTab}
        isOpen={!!selectedClass}
        onClose={() => setSelectedClass(null)}
        onUpdated={() => loadData(true, true)}
        onEnrollClick={
          canEnroll
            ? (classId) => {
                setEnrollWizardInitialClassId(classId);
                setIsEnrollWizardOpen(true);
              }
            : undefined
        }
        onCollectPayment={
          canRecordPayment ? (en) => setSelectedEnrollmentForPayment(en) : undefined
        }
        onTransferClass={canTransfer ? (en) => setSelectedEnrollmentForTransfer(en) : undefined}
        onPrintReceipt={canRecordPayment ? (en) => handlePrintFromRoster(en) : undefined}
      />
    </div>
  );
};
export default ClassesPage;
