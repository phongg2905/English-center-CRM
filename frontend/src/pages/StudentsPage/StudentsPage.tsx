import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
} from 'lucide-react';
import { AcademicService } from '../../services/academic.service';
import type {
  ClassEnrollmentItem,
  ClassItem,
  CourseItem,
  PaymentReceipt,
} from '../../types/academic';
import {
  EnrollStudentWizardModal,
  RecordPaymentModal,
  ReceiptPrintModal,
  TransferClassModal,
} from '../ClassesPage';
import { Button } from '../../components/ui';
import './StudentsPage.css';

export const StudentsPage: React.FC = () => {
  const [enrollments, setEnrollments] = useState<ClassEnrollmentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedPaymentStatusFilter, setSelectedPaymentStatusFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Filter Popover
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState<boolean>(false);
  const filterPopoverRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [isEnrollWizardOpen, setIsEnrollWizardOpen] = useState<boolean>(false);
  const [selectedEnrollmentForPayment, setSelectedEnrollmentForPayment] = useState<ClassEnrollmentItem | null>(null);
  const [selectedEnrollmentForTransfer, setSelectedEnrollmentForTransfer] = useState<ClassEnrollmentItem | null>(null);
  const [receiptForPrint, setReceiptForPrint] = useState<PaymentReceipt | null>(null);
  const [enrollmentForPrint, setEnrollmentForPrint] = useState<ClassEnrollmentItem | null>(null);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCourseFilter !== 'ALL') count++;
    if (selectedClassFilter !== 'ALL') count++;
    if (selectedPaymentStatusFilter !== 'ALL') count++;
    if (selectedStatusFilter !== 'ALL') count++;
    return count;
  }, [selectedCourseFilter, selectedClassFilter, selectedPaymentStatusFilter, selectedStatusFilter]);

  const handleResetFilters = () => {
    setSelectedCourseFilter('ALL');
    setSelectedClassFilter('ALL');
    setSelectedPaymentStatusFilter('ALL');
    setSelectedStatusFilter('ALL');
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

  // Load Data
  const loadData = useCallback(async (showSilent = false) => {
    try {
      if (!showSilent) setIsLoading(true);
      setError(null);

      const [enrollmentList, classList, courseList] = await Promise.all([
        AcademicService.getEnrollments(),
        AcademicService.getClasses(),
        AcademicService.getCourses(),
      ]);

      setEnrollments(enrollmentList);
      setClasses(classList);
      setCourses(courseList);
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu học viên:', err);
      setError(err?.response?.data?.message || err.message || 'Không thể tải danh sách học viên từ máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Close filter popover on outside click
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
        if (!matchName && !matchCode && !matchPhone && !matchEmail && !matchClass && !matchClassCode) {
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
  }, [enrollments, searchQuery, selectedCourseFilter, selectedClassFilter, selectedPaymentStatusFilter, selectedStatusFilter]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (filteredEnrollments.length === 0) {
      alert('Không có học viên nào thỏa điều kiện lọc để xuất.');
      return;
    }

    const headers = [
      'Mã Học Viên',
      'Họ và Tên',
      'Số Điện Thoại',
      'Email',
      'Khóa Học',
      'Lớp Học',
      'Mã Lớp',
      'Học Phí Niêm Yết',
      'Chiết Khấu',
      'Học Phí Cần Nộp',
      'Đã Thanh Toán',
      'Còn Thiếu',
      'Tình Trạng Học Phí',
      'Trạng Thái',
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
      en.originalTuition,
      en.discountAmount,
      en.finalAmount,
      en.paidAmount,
      en.balanceDue,
      en.paymentStatus,
      en.status,
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
        {/* Title & Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
          <GraduationCap size={18} style={{ color: '#4f46e5' }} />
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
            Học Viên
          </span>
          <span className="students-count-pill">{filteredEnrollments.length}</span>
        </div>

        {/* Divider */}
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

        {/* Divider */}
        <div className="compact-toolbar-divider" />

        {/* Actions & Filters */}
        <div className="compact-actions-group">
          {/* Filter Popover */}
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
                    {/* Tình Trạng Học Phí */}
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

                    {/* Khóa Học */}
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

                    {/* Lớp Học */}
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

                    {/* Trạng Thái Học Viên */}
                    <div className="popover-filter-field">
                      <label>Trạng thái đào tạo</label>
                      <select
                        value={selectedStatusFilter}
                        onChange={(e) => setSelectedStatusFilter(e.target.value)}
                        className="popover-select"
                      >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="ENROLLED">Đang theo học (ENROLLED)</option>
                        <option value="TRANSFERRED">Đã chuyển lớp (TRANSFERRED)</option>
                        <option value="DROPPED">Thôi học / Bảo lưu (DROPPED)</option>
                        <option value="COMPLETED">Đã tốt nghiệp (COMPLETED)</option>
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
            onClick={() => loadData()}
            disabled={isLoading}
            title="Làm mới dữ liệu từ máy chủ"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
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

          {/* MAIN CTA: XẾP LỚP HỌC VIÊN */}
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
        </div>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="students-error-notice">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => loadData()} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#dc2626', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
            Thử lại
          </button>
        </div>
      )}

      {/* 3. ROSTER DATA TABLE */}
      {isLoading ? (
        <div className="students-loading-box">
          <RefreshCw size={24} className="animate-spin" style={{ color: '#4f46e5', margin: '0 auto 10px auto' }} />
          <p>Đang tải danh sách hồ sơ học viên & học phí...</p>
        </div>
      ) : filteredEnrollments.length === 0 ? (
        <div className="students-empty-state">
          <div className="empty-state-icon-box">
            <GraduationCap size={44} style={{ color: '#94a3b8' }} />
          </div>
          <h3 className="empty-state-title">Chưa có học viên nào trong danh sách</h3>
          <p className="empty-state-desc">
            {searchQuery || activeFilterCount > 0
              ? 'Không tìm thấy hồ sơ học viên phù hợp với điều kiện tìm kiếm và bộ lọc.'
              : 'Hãy bắt đầu tuyển sinh và xếp lớp cho học viên đầu tiên bằng Wizard xếp lớp.'}
          </p>
          <Button
            variant="primary"
            size="md"
            iconLeft={<Plus size={15} />}
            onClick={() => setIsEnrollWizardOpen(true)}
            style={{ background: '#4f46e5', fontWeight: 600, marginTop: '8px' }}
          >
            Xếp Lớp Học Viên Ngay
          </Button>
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
                  <th style={{ textAlign: 'center' }}>Học Phí & Công Nợ</th>
                  <th style={{ textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnrollments.map((en) => {
                  const isPaid = en.paymentStatus === 'FULLY_PAID';
                  const inDebt = Number(en.balanceDue || 0) > 0;

                  return (
                    <tr key={en.id}>
                      {/* Mã Học Viên */}
                      <td>
                        <span className="student-code-badge">
                          {en.studentCode}
                        </span>
                      </td>

                      {/* Họ và Tên */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13.5px' }}>
                          {en.fullName}
                        </div>
                      </td>

                      {/* Số Điện Thoại */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                          <Phone size={13} style={{ color: '#4f46e5' }} />
                          <span>{en.phoneNumber}</span>
                        </div>
                      </td>

                      {/* Lớp Học */}
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>
                          {en.className}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 700 }}>
                            {en.classCode}
                          </span>
                          {en.status === 'TRANSFERRED' && (
                            <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', background: '#fef3c7', color: '#b45309' }}>
                              Đã chuyển
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Học Phí & Công Nợ - Single-Line Clean Text Pill with Hover Popover */}
                      <td style={{ textAlign: 'center' }}>
                        <div className="notion-finance-wrapper">
                          <div
                            className={`notion-finance-pill ${isPaid ? 'paid' : inDebt ? 'debt' : 'unpaid'}`}
                            onClick={() => setSelectedEnrollmentForPayment(en)}
                            title="Bấm để xem chi tiết hoặc thu học phí"
                          >
                            {isPaid ? (
                              <span>Đã nộp đủ</span>
                            ) : inDebt ? (
                              <span>Còn nợ</span>
                            ) : (
                              <span>Chưa nộp</span>
                            )}
                          </div>

                          {/* Hover Popover Breakdown */}
                          <div className="notion-finance-popover">
                            <div className="notion-popover-title">Chi Tiết Học Phí & Công Nợ</div>
                            <div className="notion-popover-row">
                              <span>Học phí niêm yết:</span>
                              <span>{Number(en.originalTuition || en.finalAmount || 0).toLocaleString('vi-VN')} đ</span>
                            </div>
                            {Number(en.discountAmount || 0) > 0 && (
                              <div className="notion-popover-row discount">
                                <span>Ưu đãi / Chiết khấu:</span>
                                <span>-{Number(en.discountAmount).toLocaleString('vi-VN')} đ</span>
                              </div>
                            )}
                            <div className="notion-popover-row highlight">
                              <span>Học phí cần thu:</span>
                              <span>{Number(en.finalAmount || 0).toLocaleString('vi-VN')} đ</span>
                            </div>
                            <div className="notion-popover-divider" />
                            <div className="notion-popover-row">
                              <span>Đã thanh toán:</span>
                              <span>{Number(en.paidAmount || 0).toLocaleString('vi-VN')} đ</span>
                            </div>
                            <div className={`notion-popover-row ${inDebt ? 'debt' : 'paid-full'}`}>
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

                      {/* Thao Tác Nhanh - 28px Icon Buttons with Tooltip */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions-group">
                          {/* Nút Thu Phí / Xem Chi Tiết Tài Chính */}
                          <button
                            type="button"
                            onClick={() => setSelectedEnrollmentForPayment(en)}
                            className={`table-action-icon-btn ${inDebt ? 'pay-debt' : 'pay-done'}`}
                            title={
                              inDebt
                                ? `Ghi nhận thu phí (Còn nợ: ${Number(en.balanceDue).toLocaleString('vi-VN')} đ)`
                                : 'Xem lịch sử thanh toán học phí'
                            }
                          >
                            <CreditCard size={13} />
                          </button>

                          {/* Nút Chuyển Lớp */}
                          <button
                            type="button"
                            onClick={() => setSelectedEnrollmentForTransfer(en)}
                            className="table-action-icon-btn transfer"
                            title="Điều phối chuyển lớp học"
                          >
                            <ArrowRightLeft size={13} />
                          </button>

                          {/* Nút In Biên Lai */}
                          <button
                            type="button"
                            onClick={() => handleQuickReceipt(en)}
                            className="table-action-icon-btn receipt"
                            title="In biên lai thu tiền & lịch sử"
                          >
                            <Printer size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MODALS MOUNTED */}
      {/* 4a. ENROLL WIZARD MODAL */}
      <EnrollStudentWizardModal
        isOpen={isEnrollWizardOpen}
        onClose={() => setIsEnrollWizardOpen(false)}
        onSuccess={() => loadData(true)}
        onPrintReceipt={(receipt, en) => {
          setReceiptForPrint(receipt);
          setEnrollmentForPrint(en);
        }}
      />

      {/* 4b. RECORD PAYMENT MODAL */}
      <RecordPaymentModal
        isOpen={!!selectedEnrollmentForPayment}
        enrollment={selectedEnrollmentForPayment}
        onClose={() => setSelectedEnrollmentForPayment(null)}
        onSuccess={() => loadData(true)}
        onPrintReceipt={(receipt, en) => {
          setReceiptForPrint(receipt);
          setEnrollmentForPrint(en);
        }}
      />

      {/* 4c. RECEIPT PRINT MODAL */}
      <ReceiptPrintModal
        isOpen={!!receiptForPrint && !!enrollmentForPrint}
        receipt={receiptForPrint}
        enrollment={enrollmentForPrint}
        onClose={() => {
          setReceiptForPrint(null);
          setEnrollmentForPrint(null);
        }}
      />

      {/* 4d. TRANSFER CLASS MODAL */}
      <TransferClassModal
        isOpen={!!selectedEnrollmentForTransfer}
        enrollment={selectedEnrollmentForTransfer}
        onClose={() => setSelectedEnrollmentForTransfer(null)}
        onSuccess={() => loadData(true)}
      />
    </div>
  );
};

export default StudentsPage;
