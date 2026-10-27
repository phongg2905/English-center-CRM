import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  GraduationCap,
  Search,
  Plus,
  RefreshCw,
  Download,
  CreditCard,
  ArrowRightLeft,
  SlidersHorizontal,
  RotateCcw,
  X,
  Phone,
  AlertCircle,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { AcademicService } from '../../services/academic.service';
import type {
  ClassEnrollmentItem,
  ClassItem,
  CourseItem,
  PaymentReceipt,
  EnrollmentStatus,
} from '../../types/academic';
import {
  EnrollStudentWizardModal,
  RecordPaymentModal,
  ReceiptPrintModal,
  TransferClassModal,
} from '../ClassesPage';
import { Button, TableSkeleton, PaginationBar } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { hasRequiredRole, ACTION_PERMISSIONS } from '../../config/rbac.config';
import './StudentsPage.css';

const ENROLLMENT_STATUS_LABELS: Record<
  EnrollmentStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  ENROLLED: { label: 'Đang theo học', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  COMPLETED: { label: 'Đã hoàn thành', bg: '#eef2ff', color: '#4338ca', border: '#c7d2fe' },
  TRANSFERRED: { label: 'Đã chuyển lớp', bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  DROPPED: { label: 'Bảo lưu / Thôi học', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
};

export const StudentsPage: React.FC = () => {
  const { user } = useAuth();
  const canEnroll = hasRequiredRole(user?.role, ACTION_PERMISSIONS.ENROLL_STUDENT);
  const canRecordPayment = hasRequiredRole(user?.role, ACTION_PERMISSIONS.RECORD_PAYMENT);
  const canTransfer = hasRequiredRole(user?.role, ACTION_PERMISSIONS.CLASS_TRANSFER);
  const canViewTuition = hasRequiredRole(user?.role, ACTION_PERMISSIONS.VIEW_TUITION);
  const canEditStatus = hasRequiredRole(user?.role, ACTION_PERMISSIONS.CLASS_EDIT);
  const hasAnyRowAction = canRecordPayment || canTransfer;

  // Khởi tạo trực tiếp từ Smart Cache nếu đã có dữ liệu
  const initialCachedEnrollments = AcademicService.peekEnrollments();
  const initialCachedClasses = AcademicService.peekClasses();
  const initialCachedCourses = AcademicService.peekCourses();

  const [enrollments, setEnrollments] = useState<ClassEnrollmentItem[]>(
    initialCachedEnrollments || []
  );
  const [classes, setClasses] = useState<ClassItem[]>(initialCachedClasses || []);
  const [courses, setCourses] = useState<CourseItem[]>(initialCachedCourses || []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialCachedEnrollments);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedPaymentStatusFilter, setSelectedPaymentStatusFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  // Filter Popover
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState<boolean>(false);
  const filterPopoverRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [searchParams, setSearchParams] = useSearchParams();
  const [isEnrollWizardOpen, setIsEnrollWizardOpen] = useState<boolean>(false);
  const [preselectedLeadId, setPreselectedLeadId] = useState<number | undefined>(undefined);
  const [selectedEnrollmentForPayment, setSelectedEnrollmentForPayment] =
    useState<ClassEnrollmentItem | null>(null);
  const [selectedEnrollmentForTransfer, setSelectedEnrollmentForTransfer] =
    useState<ClassEnrollmentItem | null>(null);
  const [receiptForPrint, setReceiptForPrint] = useState<PaymentReceipt | null>(null);
  const [enrollmentForPrint, setEnrollmentForPrint] = useState<ClassEnrollmentItem | null>(null);

  useEffect(() => {
    const enrollLeadIdParam = searchParams.get('enrollLeadId');
    if (enrollLeadIdParam) {
      const parsedId = Number(enrollLeadIdParam);
      if (!Number.isNaN(parsedId) && parsedId > 0) {
        setPreselectedLeadId(parsedId);
        setIsEnrollWizardOpen(true);
      }
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('enrollLeadId');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCourseFilter !== 'ALL') count++;
    if (selectedClassFilter !== 'ALL') count++;
    if (selectedPaymentStatusFilter !== 'ALL') count++;
    if (selectedStatusFilter !== 'ALL') count++;
    return count;
  }, [
    selectedCourseFilter,
    selectedClassFilter,
    selectedPaymentStatusFilter,
    selectedStatusFilter,
  ]);

  const handleResetFilters = () => {
    setSelectedCourseFilter('ALL');
    setSelectedClassFilter('ALL');
    setSelectedPaymentStatusFilter('ALL');
    setSelectedStatusFilter('ALL');
    setCurrentPage(1);
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

  // Load Data (tận dụng Smart Cache trừ khi forceRefresh = true)
  const loadData = useCallback(async (showSilent = false, forceRefresh = false) => {
    try {
      const hasCached = Boolean(AcademicService.peekEnrollments());
      if (!showSilent && !hasCached) {
        setIsLoading(true);
      } else if (forceRefresh) {
        setIsRefreshing(true);
      }
      setError(null);

      const [enrollmentList, classList, courseList] = await Promise.all([
        AcademicService.getEnrollments(undefined, { forceRefresh }),
        AcademicService.getClasses(undefined, { forceRefresh }),
        AcademicService.getCourses(undefined, { forceRefresh }),
      ]);

      setEnrollments(enrollmentList);
      setClasses(classList);
      setCourses(courseList);
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu học viên:', err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          'Không thể tải danh sách học viên từ máy chủ.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (
    en: ClassEnrollmentItem,
    nextStatus: EnrollmentStatus
  ) => {
    if (nextStatus === en.status) return;
    try {
      setUpdatingStatusId(en.id);
      setError(null);
      await AcademicService.updateEnrollmentStatus(en.id, nextStatus);
      await loadData(true, true);
      setStatusFeedback(
        `Đã cập nhật trạng thái học viên "${en.fullName}" sang "${ENROLLMENT_STATUS_LABELS[nextStatus]?.label || nextStatus}"`
      );
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          'Không thể cập nhật trạng thái đào tạo học viên.'
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target as Node)) {
        setIsFilterPopoverOpen(false);
      }
    };
    if (isFilterPopoverOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isFilterPopoverOpen]);

  // Filtered list
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((en) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = en.fullName.toLowerCase().includes(q);
        const matchCode = (en.studentCode || '').toLowerCase().includes(q);
        const matchPhone = en.phoneNumber.includes(q);
        const matchEmail = (en.email || '').toLowerCase().includes(q);
        const matchClass = (en.className || '').toLowerCase().includes(q);
        const matchClassCode = (en.classCode || '').toLowerCase().includes(q);
        if (
          !matchName &&
          !matchCode &&
          !matchPhone &&
          !matchEmail &&
          !matchClass &&
          !matchClassCode
        ) {
          return false;
        }
      }

      if (selectedCourseFilter !== 'ALL') {
        if (en.courseId !== Number(selectedCourseFilter)) return false;
      }

      if (selectedClassFilter !== 'ALL') {
        if (en.classId !== Number(selectedClassFilter)) return false;
      }

      if (selectedPaymentStatusFilter !== 'ALL') {
        if (en.paymentStatus !== selectedPaymentStatusFilter) return false;
      }

      if (selectedStatusFilter !== 'ALL') {
        if (en.status !== selectedStatusFilter) return false;
      }

      return true;
    });
  }, [
    enrollments,
    searchQuery,
    selectedCourseFilter,
    selectedClassFilter,
    selectedPaymentStatusFilter,
    selectedStatusFilter,
  ]);

  const paginatedEnrollments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEnrollments.slice(start, start + pageSize);
  }, [filteredEnrollments, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedCourseFilter,
    selectedClassFilter,
    selectedPaymentStatusFilter,
    selectedStatusFilter,
  ]);

  const handleExportCSV = () => {
    if (filteredEnrollments.length === 0) {
      alert('Không có học viên nào thỏa điều kiện lọc để xuất.');
      return;
    }

    const baseHeaders = [
      'Mã Học Viên',
      'Họ và Tên',
      'Số Điện Thoại',
      'Email',
      'Khóa Học',
      'Lớp Học',
      'Mã Lớp',
    ];
    const financeHeaders = [
      'Học Phí Niêm Yết',
      'Chiết Khấu',
      'Học Phí Cần Nộp',
      'Đã Thanh Toán',
      'Còn Thiếu',
      'Tình Trạng Học Phí',
    ];
    const headers = [
      ...baseHeaders,
      ...(canViewTuition ? financeHeaders : []),
      'Trạng Thái Đào Tạo',
      'Ngày Nhập Học',
    ];

    const rows = filteredEnrollments.map((en) => [
      en.studentCode,
      `"${en.fullName}"`,
      `"${en.phoneNumber}"`,
      `"${en.email || ''}"`,
      `"${en.courseName}"`,
      `"${en.className}"`,
      en.classCode,
      ...(canViewTuition
        ? [
            en.originalTuition,
            en.discountAmount,
            en.finalAmount,
            en.paidAmount,
            en.balanceDue,
            en.paymentStatus,
          ]
        : []),
      ENROLLMENT_STATUS_LABELS[en.status]?.label || en.status,
      en.enrollmentDate,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Danh_sach_hoc_vien_EduFlow_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="students-page-container">
      {/* 1. STRIPE / LINEAR COMPACT TOOLBAR */}
      <div className="students-compact-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
          <GraduationCap size={18} style={{ color: '#4f46e5' }} />
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>Học Viên</span>
          <span className="students-count-pill">{filteredEnrollments.length}</span>
        </div>

        <div className="compact-toolbar-divider" />

        {/* Search Input */}
        <div className="compact-search-box">
          <Search size={15} className="compact-search-icon" />
          <input
            type="text"
            placeholder="Tìm theo tên học viên, mã STU-xxx, số điện thoại, lớp học..."
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

        {/* Actions & Filters */}
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
                    <span className="filter-popover-title">Bộ lọc học viên</span>
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
                    {canViewTuition && (
                      <div className="popover-filter-field">
                        <label>Tình trạng học phí</label>
                        <select
                          value={selectedPaymentStatusFilter}
                          onChange={(e) => setSelectedPaymentStatusFilter(e.target.value)}
                          className="popover-select"
                        >
                          <option value="ALL">Tất cả tình trạng</option>
                          <option value="UNPAID">Chưa đóng (UNPAID)</option>
                          <option value="PARTIAL">Đóng cọc / Còn nợ (PARTIAL)</option>
                          <option value="FULLY_PAID">Đã nộp đủ 100% (FULLY_PAID)</option>
                        </select>
                      </div>
                    )}

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

                    <div className="popover-filter-field">
                      <label>Lớp học</label>
                      <select
                        value={selectedClassFilter}
                        onChange={(e) => setSelectedClassFilter(e.target.value)}
                        className="popover-select"
                      >
                        <option value="ALL">Tất cả lớp học</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id.toString()}>
                            {c.classCode} - {c.className}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="popover-filter-field">
                      <label>Trạng thái đào tạo</label>
                      <select
                        value={selectedStatusFilter}
                        onChange={(e) => setSelectedStatusFilter(e.target.value)}
                        className="popover-select"
                      >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="ENROLLED">Đang theo học (ENROLLED)</option>
                        <option value="COMPLETED">Đã hoàn thành (COMPLETED)</option>
                        <option value="TRANSFERRED">Đã chuyển lớp (TRANSFERRED)</option>
                        <option value="DROPPED">Bảo lưu / Thôi học (DROPPED)</option>
                      </select>
                    </div>
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

          {/* Refresh Button */}
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
            title="Xuất danh sách học viên ra file CSV"
          >
            <Download size={14} />
            <span>Xuất file</span>
          </button>

          {canEnroll && (
            <Button
              variant="primary"
              size="md"
              iconLeft={<Plus size={15} />}
              onClick={() => setIsEnrollWizardOpen(true)}
              style={{
                background: '#4f46e5',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                fontWeight: 600,
                padding: '7px 14px',
                borderRadius: '10px',
                fontSize: '13px',
              }}
            >
              Xếp Lớp Học Viên
            </Button>
          )}
        </div>
      </div>

      {/* Quick Class & Status Filter Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '12px',
        }}
      >
        {[
          { code: 'ALL', label: `Tất cả (${enrollments.length})` },
          {
            code: 'ENROLLED',
            label: `Đang theo học (${enrollments.filter((e) => e.status === 'ENROLLED').length})`,
          },
          {
            code: 'COMPLETED',
            label: `Đã hoàn thành (${enrollments.filter((e) => e.status === 'COMPLETED').length})`,
          },
          {
            code: 'TRANSFERRED',
            label: `Đã chuyển lớp (${
              enrollments.filter((e) => e.status === 'TRANSFERRED').length
            })`,
          },
          {
            code: 'DROPPED',
            label: `Bảo lưu / Thôi học (${
              enrollments.filter((e) => e.status === 'DROPPED').length
            })`,
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
                border: active ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                background: active ? '#eef2ff' : '#ffffff',
                color: active ? '#4338ca' : '#475569',
                cursor: 'pointer',
              }}
            >
              {pill.label}
            </button>
          );
        })}

        <select
          value={selectedClassFilter}
          onChange={(e) => setSelectedClassFilter(e.target.value)}
          style={{
            marginLeft: 'auto',
            padding: '5px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            fontSize: '12px',
            fontWeight: 600,
            color: '#1e293b',
          }}
        >
          <option value="ALL">🏫 Lọc nhanh theo lớp học (Tất cả lớp)</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id.toString()}>
              {c.classCode} — {c.className} ({c.currentEnrolled}/{c.maxCapacity})
            </option>
          ))}
        </select>
      </div>

      {statusFeedback && (
        <div
          style={{
            marginBottom: '12px',
            padding: '10px 14px',
            borderRadius: '10px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{statusFeedback}</span>
        </div>
      )}

      {/* ERROR NOTICE */}
      {error && (
        <div className="students-error-notice">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => loadData(false, true)}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              color: '#dc2626',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 3. ROSTER DATA TABLE */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : filteredEnrollments.length === 0 ? (
        <div className="students-empty-state">
          <div className="empty-state-icon-box">
            <GraduationCap size={44} style={{ color: '#94a3b8' }} />
          </div>
          <h3 className="empty-state-title">Chưa có học viên nào trong danh sách</h3>
          <p className="empty-state-desc">
            {searchQuery || activeFilterCount > 0
              ? 'Không tìm thấy hồ sơ học viên phù hợp với điều kiện tìm kiếm và bộ lọc.'
              : canEnroll
              ? 'Hãy bắt đầu tuyển sinh và xếp lớp cho học viên đầu tiên bằng Wizard xếp lớp.'
              : 'Hiện chưa có học viên nào thuộc các lớp bạn phụ trách.'}
          </p>
          {canEnroll && (
            <Button
              variant="primary"
              size="md"
              iconLeft={<Plus size={15} />}
              onClick={() => setIsEnrollWizardOpen(true)}
              style={{ background: '#4f46e5', fontWeight: 600, marginTop: '8px' }}
            >
              Xếp Lớp Học Viên Ngay
            </Button>
          )}
        </div>
      ) : (
        <div className="students-table-card">
          <div style={{ overflowX: 'auto' }}>
            <table className="students-table">
              <thead>
                <tr>
                  <th>Mã HV</th>
                  <th>Học Viên</th>
                  <th>Số Điện Thoại</th>
                  <th>Lớp Học</th>
                  <th style={{ textAlign: 'center' }}>Trạng Thái Đào Tạo</th>
                  {canViewTuition && <th style={{ textAlign: 'center' }}>Học Phí & Công Nợ</th>}
                  {hasAnyRowAction && <th style={{ textAlign: 'right' }}>Thao Tác</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedEnrollments.map((en) => {
                  const isPaid = en.paymentStatus === 'FULLY_PAID';
                  const inDebt = Number(en.balanceDue || 0) > 0;
                  const statusMeta =
                    ENROLLMENT_STATUS_LABELS[en.status] || ENROLLMENT_STATUS_LABELS.ENROLLED;

                  return (
                    <tr key={en.id}>
                      {/* Mã Học Viên */}
                      <td>
                        <span className="student-code-badge">{en.studentCode}</span>
                      </td>

                      {/* Họ và Tên */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13.5px' }}>
                          {en.fullName}
                        </div>
                        {en.email && (
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>{en.email}</div>
                        )}
                      </td>

                      {/* Số Điện Thoại */}
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#334155',
                          }}
                        >
                          <Phone size={13} style={{ color: '#4f46e5' }} />
                          <span>{en.phoneNumber}</span>
                        </div>
                      </td>

                      {/* Lớp Học */}
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>
                          {en.className}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '2px',
                          }}
                        >
                          <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 700 }}>
                            {en.classCode}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            · {en.courseName}
                          </span>
                        </div>
                      </td>

                      {/* Trạng Thái Đào Tạo */}
                      <td style={{ textAlign: 'center' }}>
                        {canEditStatus ? (
                          <select
                            value={en.status}
                            disabled={updatingStatusId === en.id}
                            onChange={(e) =>
                              handleStatusChange(en, e.target.value as EnrollmentStatus)
                            }
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 600,
                              padding: '3px 10px',
                              borderRadius: '999px',
                              background: statusMeta.bg,
                              color: statusMeta.color,
                              border: `1px solid ${statusMeta.border}`,
                              cursor: 'pointer',
                              outline: 'none',
                            }}
                            title="Cập nhật trạng thái đào tạo của học viên"
                          >
                            <option value="ENROLLED">Đang theo học</option>
                            <option value="COMPLETED">Đã hoàn thành</option>
                            <option value="TRANSFERRED">Đã chuyển lớp</option>
                            <option value="DROPPED">Bảo lưu / Thôi học</option>
                          </select>
                        ) : (
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 600,
                              padding: '3px 10px',
                              borderRadius: '999px',
                              background: statusMeta.bg,
                              color: statusMeta.color,
                              border: `1px solid ${statusMeta.border}`,
                              display: 'inline-block',
                            }}
                          >
                            {statusMeta.label}
                          </span>
                        )}
                      </td>

                      {/* Học Phí & Công Nợ */}
                      {canViewTuition && (
                        <td style={{ textAlign: 'center' }}>
                          <div className="notion-finance-wrapper">
                            <div
                              className={`notion-finance-pill ${
                                isPaid ? 'paid' : inDebt ? 'debt' : 'unpaid'
                              }`}
                              onClick={() =>
                                canRecordPayment && setSelectedEnrollmentForPayment(en)
                              }
                              title={
                                canRecordPayment
                                  ? 'Bấm để xem chi tiết hoặc thu học phí'
                                  : 'Chi tiết học phí'
                              }
                            >
                              {isPaid ? (
                                <span>Đã nộp đủ</span>
                              ) : inDebt ? (
                                <span>Còn nợ</span>
                              ) : (
                                <span>Chưa nộp</span>
                              )}
                            </div>

                            <div className="notion-finance-popover">
                              <div className="notion-popover-title">
                                Chi Tiết Học Phí & Công Nợ
                              </div>
                              <div className="notion-popover-row">
                                <span>Học phí niêm yết:</span>
                                <span>
                                  {Number(
                                    en.originalTuition || en.finalAmount || 0
                                  ).toLocaleString('vi-VN')}{' '}
                                  đ
                                </span>
                              </div>
                              {Number(en.discountAmount || 0) > 0 && (
                                <div className="notion-popover-row discount">
                                  <span>Ưu đãi / Chiết khấu:</span>
                                  <span>
                                    -{Number(en.discountAmount).toLocaleString('vi-VN')} đ
                                  </span>
                                </div>
                              )}
                              <div className="notion-popover-row highlight">
                                <span>Học phí cần thu:</span>
                                <span>
                                  {Number(en.finalAmount || 0).toLocaleString('vi-VN')} đ
                                </span>
                              </div>
                              <div className="notion-popover-divider" />
                              <div className="notion-popover-row">
                                <span>Đã thanh toán:</span>
                                <span>{Number(en.paidAmount || 0).toLocaleString('vi-VN')} đ</span>
                              </div>
                              <div
                                className={`notion-popover-row ${inDebt ? 'debt' : 'paid-full'}`}
                              >
                                <span>{inDebt ? 'Còn nợ học phí:' : 'Trạng thái:'}</span>
                                <span>
                                  {inDebt
                                    ? `${Number(en.balanceDue).toLocaleString('vi-VN')} đ`
                                    : 'Đã hoàn tất'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Thao Tác Nhanh */}
                      {hasAnyRowAction && (
                        <td style={{ textAlign: 'right' }}>
                          <div className="table-actions-group">
                            {canRecordPayment && (
                              <button
                                type="button"
                                onClick={() => setSelectedEnrollmentForPayment(en)}
                                className={`table-action-icon-btn ${
                                  inDebt ? 'pay-debt' : 'pay-done'
                                }`}
                                title={
                                  inDebt
                                    ? `Ghi nhận thu phí (Còn nợ: ${Number(
                                        en.balanceDue
                                      ).toLocaleString('vi-VN')} đ)`
                                    : 'Xem lịch sử thanh toán học phí'
                                }
                              >
                                <CreditCard size={13} />
                              </button>
                            )}

                            {canTransfer && (
                              <button
                                type="button"
                                onClick={() => setSelectedEnrollmentForTransfer(en)}
                                className="table-action-icon-btn transfer"
                                title="Điều phối chuyển lớp học"
                              >
                                <ArrowRightLeft size={13} />
                              </button>
                            )}

                            {canRecordPayment && (
                              <button
                                type="button"
                                onClick={() => handleQuickReceipt(en)}
                                className="table-action-icon-btn receipt"
                                title="In biên lai thu tiền & lịch sử"
                              >
                                <Printer size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <PaginationBar
            currentPage={currentPage}
            totalItems={filteredEnrollments.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            pageSizeOptions={[8, 15, 30, 50]}
            itemLabel="học viên"
          />
        </div>
      )}

      {/* 4. MODALS MOUNTED */}
      <EnrollStudentWizardModal
        isOpen={isEnrollWizardOpen}
        initialLeadId={preselectedLeadId}
        onClose={() => {
          setIsEnrollWizardOpen(false);
          setPreselectedLeadId(undefined);
        }}
        onSuccess={() => loadData(true, true)}
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
    </div>
  );
};

export default StudentsPage;
