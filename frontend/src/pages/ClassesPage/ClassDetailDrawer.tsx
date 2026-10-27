import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Users,
  Clock,
  Phone,
  CheckCircle2,
  AlertCircle,
  Download,
  UserPlus,
  Save,
  Lock,
  Edit2,
  CreditCard,
  ArrowRightLeft,
  Printer,
  Target,
  Hash,
  Flame,
  Copy,
  Check,
} from 'lucide-react';
import { AcademicService } from '../../services/academic.service';
import type {
  ClassItem,
  ClassEnrollmentItem,
  UpdateClassPayload,
  ScheduleDays,
  ClassStatus,
} from '../../types/academic';
import { Button } from '../../components/ui';

const formatTeacherName = (name?: string | null) => {
  if (!name) return '';
  return name.replace(/\s*\([^)]*\)/g, '').trim();
};

const formatShortClassCode = (code?: string | null): string => {
  if (!code) return '';
  return code
    .replace(/-(T246|T357|T7CN|246|357|T7|CN|WEEKEND|MON_WED_FRI|TUE_THU_SAT)$/i, '')
    .trim();
};

const getLifecycleStatusLabel = (status?: ClassStatus, currentEnrolled = 0): string => {
  if (status === 'CANCELLED' || (status === 'COMPLETED' && currentEnrolled === 0)) {
    return 'Đã hủy';
  }
  switch (status) {
    case 'PLANNING':
      return 'Dự kiến khai giảng';
    case 'OPEN':
      return 'Đang mở tuyển sinh';
    case 'IN_PROGRESS':
      return 'Đang học';
    case 'FULL':
      return 'Đã khóa sổ (Đầy)';
    case 'COMPLETED':
      return 'Đã kết thúc';
    default:
      return 'Đang mở';
  }
};

interface ClassDetailDrawerProps {
  classItem: ClassItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  canEdit?: boolean;
  onEnrollClick?: (classId: number) => void;
  onCollectPayment?: (enrollment: ClassEnrollmentItem) => void;
  onTransferClass?: (enrollment: ClassEnrollmentItem) => void;
  onPrintReceipt?: (enrollment: ClassEnrollmentItem) => void;
}

export const ClassDetailDrawer: React.FC<ClassDetailDrawerProps> = ({
  classItem,
  isOpen,
  onClose,
  onUpdated,
  canEdit = true,
  onEnrollClick,
  onCollectPayment,
  onTransferClass,
  onPrintReceipt,
}) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'ROSTER'>('GENERAL');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [enrollments, setEnrollments] = useState<ClassEnrollmentItem[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Editable Form States
  const [editClassName, setEditClassName] = useState<string>('');
  const [editTeacherName, setEditTeacherName] = useState<string>('');
  const [editScheduleDays, setEditScheduleDays] = useState<ScheduleDays>('MON_WED_FRI');
  const [editTimeSlot, setEditTimeSlot] = useState<string>('');
  const [editRoom, setEditRoom] = useState<string>('');
  const [editStartDate, setEditStartDate] = useState<string>('');
  const [editMaxCapacity, setEditMaxCapacity] = useState<number>(15);
  const [editStatus, setEditStatus] = useState<ClassStatus>('OPEN');

  const lastClassIdRef = React.useRef<number | null>(null);

  // Sync state whenever classItem changes
  useEffect(() => {
    if (!classItem) {
      lastClassIdRef.current = null;
      return;
    }

    const isSwitchingClass = lastClassIdRef.current !== classItem.id;
    lastClassIdRef.current = classItem.id;

    setEditClassName(classItem.className || '');
    setEditTeacherName(formatTeacherName(classItem.teacherName));
    setEditScheduleDays(classItem.scheduleDays || 'MON_WED_FRI');
    setEditTimeSlot(classItem.timeSlot || '');
    setEditRoom(classItem.room || '');
    setEditStartDate(classItem.startDate ? classItem.startDate.split('T')[0] : '');
    setEditMaxCapacity(classItem.maxCapacity || 15);
    setEditStatus(classItem.status || 'OPEN');

    if (isSwitchingClass) {
      setActiveTab('GENERAL');
      setSaveSuccessMsg(null);
      setSaveErrorMsg(null);
      setIsEditing(false);
      setCopiedCode(false);
    }

    loadRoster(classItem.id, !isSwitchingClass);
  }, [classItem]);

  const loadRoster = async (classId: number, silent = false) => {
    try {
      if (!silent) setIsLoadingRoster(true);
      const data = await AcademicService.getClassEnrollments(classId);
      setEnrollments(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách học viên trong lớp:', err);
    } finally {
      if (!silent) setIsLoadingRoster(false);
    }
  };

  const getScheduleLabel = (days?: ScheduleDays) => {
    switch (days) {
      case 'MON_WED_FRI':
        return 'Thứ 2 - Thứ 4 - Thứ 6';
      case 'TUE_THU_SAT':
        return 'Thứ 3 - Thứ 5 - Thứ 7';
      case 'WEEKEND':
        return 'Cuối tuần (T7 & CN)';
      default:
        return days || 'Chưa sắp xếp';
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr || dateStr === 'Chưa cập nhật' || dateStr === 'null' || dateStr === 'undefined') {
      return 'Chưa cập nhật';
    }
    try {
      const cleaned = dateStr.replace(/\s+GM.*$/, '');
      const d = new Date(cleaned);
      if (!isNaN(d.getTime())) return d.toLocaleDateString('vi-VN');
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  if (!isOpen || !classItem) return null;

  // Unified Capacity & Status Metrics (100% consistent with ClassesPage list)
  const maxCap = classItem.maxCapacity > 0 ? classItem.maxCapacity : 1;
  const rawFillRate = (classItem.currentEnrolled / maxCap) * 100;
  const currentFillPercent = Math.min(100, Math.max(0, Math.round(rawFillRate)));

  const isEnded = classItem.status === 'COMPLETED' || classItem.status === 'CANCELLED';
  const isCancelled =
    classItem.status === 'CANCELLED' ||
    (classItem.status === 'COMPLETED' && classItem.currentEnrolled === 0);

  const isClassFull =
    !isEnded &&
    (classItem.isFull ||
      classItem.currentEnrolled >= classItem.maxCapacity ||
      classItem.status === 'FULL' ||
      rawFillRate >= 100);

  const isNearFull = !isEnded && !isClassFull && rawFillRate >= 80;
  const canEnrollThisClass = !isEnded && !isClassFull;

  const shortClassCode = formatShortClassCode(classItem.classCode) || classItem.classCode;

  const handleCopyCode = () => {
    if (!shortClassCode) return;
    navigator.clipboard?.writeText(shortClassCode);
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 1800);
  };

  // Header Badge Rendering (Prioritizes Ended/Cancelled -> Full -> Near Full -> In Progress -> Open)
  const renderHeaderBadge = () => {
    if (isCancelled) {
      return <span className="class-status-badge completed">Đã hủy</span>;
    }
    if (isEnded) {
      return <span className="class-status-badge completed">Đã kết thúc</span>;
    }
    if (isClassFull) {
      return (
        <span className="class-status-badge full-muted">
          <Lock size={11} />
          <span>Đã đầy</span>
        </span>
      );
    }
    if (isNearFull) {
      return (
        <span className="class-status-badge near-full">
          <Flame size={11} />
          <span>Sắp đầy</span>
        </span>
      );
    }
    if (classItem.status === 'IN_PROGRESS') {
      return <span className="class-status-badge in-progress">● Đang học</span>;
    }
    return (
      <span
        className="class-status-badge"
        style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}
      >
        ● Đang mở tuyển sinh
      </span>
    );
  };

  const handleExportRosterCSV = () => {
    if (enrollments.length === 0) {
      alert('Lớp học chưa có học viên nào để xuất dữ liệu.');
      return;
    }
    const headers = [
      'Họ và Tên',
      'Số Điện Thoại',
      'Ngày Ghi Danh',
      'Trạng Thái Học Phí',
      'Đã Nộp (VNĐ)',
      'Còn Nợ (VNĐ)',
    ];
    const rows = enrollments.map((e) => [
      `"${e.fullName}"`,
      e.phoneNumber,
      formatDate(e.enrollmentDate),
      e.paymentStatus === 'FULLY_PAID'
        ? 'Đã nộp đủ'
        : Number(e.balanceDue || 0) > 0
        ? 'Còn nợ'
        : 'Chưa nộp',
      e.paidAmount,
      e.balanceDue,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Danh_sach_hoc_vien_${classItem.className.replace(/\s+/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCancelEdit = () => {
    if (!classItem) return;
    setEditClassName(classItem.className || '');
    setEditTeacherName(formatTeacherName(classItem.teacherName));
    setEditScheduleDays(classItem.scheduleDays || 'MON_WED_FRI');
    setEditTimeSlot(classItem.timeSlot || '');
    setEditRoom(classItem.room || '');
    setEditStartDate(classItem.startDate ? classItem.startDate.split('T')[0] : '');
    setEditMaxCapacity(classItem.maxCapacity || 15);
    setEditStatus(classItem.status || 'OPEN');
    setSaveErrorMsg(null);
    setIsEditing(false);
  };

  const handleSaveGeneralInfo = async () => {
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    if (editMaxCapacity < classItem.currentEnrolled) {
      setSaveErrorMsg(
        `Không thể giảm sĩ số tối đa xuống ${editMaxCapacity} vì lớp hiện đang có ${classItem.currentEnrolled} học viên.`
      );
      return;
    }

    try {
      setIsSaving(true);
      const payload: UpdateClassPayload = {
        className: editClassName.trim(),
        teacherName: editTeacherName.trim() || null,
        scheduleDays: editScheduleDays,
        timeSlot: editTimeSlot.trim(),
        room: editRoom.trim() || null,
        startDate: editStartDate,
        maxCapacity: Number(editMaxCapacity),
        status: editStatus,
      };

      await AcademicService.updateClass(classItem.id, payload);
      setSaveSuccessMsg('Đã cập nhật thông tin lớp học thành công!');
      setIsEditing(false);
      onUpdated();
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      setSaveErrorMsg(err?.response?.data?.message || err.message || 'Lỗi khi cập nhật lớp học');
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="classes-drawer-overlay" onClick={onClose}>
      <div className="classes-drawer-container" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="classes-drawer-header">
          <div className="drawer-header-top-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {renderHeaderBadge()}
              {shortClassCode && (
                <button
                  type="button"
                  className="class-row-code text-xs text-gray-500"
                  onClick={handleCopyCode}
                  title={copiedCode ? 'Đã sao chép mã lớp!' : 'Nhấn để sao chép mã lớp'}
                  style={{ margin: 0 }}
                >
                  <Hash className="w-3 h-3" size={12} />
                  <span>{shortClassCode}</span>
                  {copiedCode ? (
                    <Check className="w-3 h-3 copy-code-icon copied" size={12} />
                  ) : (
                    <Copy className="w-3 h-3 copy-code-icon" size={12} />
                  )}
                </button>
              )}
            </div>

            <div className="drawer-header-actions">
              <button
                type="button"
                className="drawer-close-btn"
                onClick={onClose}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="drawer-header-title-box">
            <h3 className="drawer-title">{classItem.className}</h3>
            <p className="drawer-subtitle">
              <span>{classItem.courseName}</span>
              <span className="drawer-dot">·</span>
              <span className="drawer-tuition">
                {Number(classItem.standardTuition).toLocaleString('vi-VN')} đ
              </span>
            </p>
          </div>
        </div>

        {/* Drawer Navigation Tabs (2 Clean Tabs) */}
        <div className="classes-drawer-tabs-nav">
          <button
            type="button"
            className={`drawer-tab-btn ${activeTab === 'GENERAL' ? 'active' : ''}`}
            onClick={() => setActiveTab('GENERAL')}
          >
            <Clock size={15} />
            <span>Tổng quan</span>
          </button>
          <button
            type="button"
            className={`drawer-tab-btn ${activeTab === 'ROSTER' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('ROSTER');
              loadRoster(classItem.id, true);
            }}
          >
            <Users size={15} />
            <span>Học viên</span>
            <span className="drawer-tab-count-badge">{classItem.currentEnrolled}</span>
          </button>
        </div>

        {/* Alert banners */}
        {saveSuccessMsg && (
          <div
            style={{
              margin: '12px 24px 0 24px',
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
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {saveErrorMsg && (
          <div
            style={{
              margin: '12px 24px 0 24px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{saveErrorMsg}</span>
          </div>
        )}

        {/* Drawer Scroll Body */}
        <div className="drawer-scroll-body">
          {/* TAB 1: TỔNG QUAN */}
          {activeTab === 'GENERAL' && (
            <>
              {/* Sĩ số Card (Đồng bộ ngưỡng 80% / 100% với danh sách ngoài) */}
              <div className="drawer-section-card">
                <div className="drawer-section-header">
                  <h4 className="drawer-section-title">
                    <Users size={16} style={{ color: '#2563eb' }} />
                    <span>Sĩ Số Lớp Học</span>
                  </h4>
                </div>

                <div className="class-capacity-progress-box">
                  <div className="capacity-text-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="capacity-fraction-text">
                      Hiện có: <strong>{classItem.currentEnrolled}/{classItem.maxCapacity}</strong> học viên
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                      {currentFillPercent}%
                    </span>
                  </div>
                  <div className="capacity-track">
                    <div
                      className="capacity-fill"
                      style={{
                        width: `${currentFillPercent}%`,
                        backgroundColor: isEnded
                          ? '#94a3b8'
                          : isClassFull
                          ? '#ef4444'
                          : isNearFull
                          ? '#f97316'
                          : '#22c55e',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Thông tin chi tiết Card (Đã loại bỏ Khóa Học & Học Phí bị trùng với Header) */}
              {!isEditing ? (
                <div className="drawer-section-card">
                  <div className="drawer-section-header">
                    <h4 className="drawer-section-title">
                      <Clock size={16} style={{ color: '#2563eb' }} />
                      <span>Thông Tin Lớp Học</span>
                    </h4>
                  </div>

                  <div className="drawer-prop-grid">
                    <div className="drawer-prop-item">
                      <span className="drawer-prop-label">Giảng Viên</span>
                      <span className="drawer-prop-value">
                        {formatTeacherName(classItem.teacherName) || 'Chưa phân công'}
                      </span>
                    </div>

                    <div className="drawer-prop-item">
                      <span className="drawer-prop-label">Phòng Học / Cơ Sở</span>
                      <span className="drawer-prop-value">
                        {classItem.room || 'Chưa xếp phòng'}
                      </span>
                    </div>

                    <div className="drawer-prop-item">
                      <span className="drawer-prop-label">Lịch Học</span>
                      <span className="drawer-prop-value">
                        {getScheduleLabel(classItem.scheduleDays)}
                      </span>
                    </div>

                    <div className="drawer-prop-item">
                      <span className="drawer-prop-label">Ca Học</span>
                      <span className="drawer-prop-value">
                        {classItem.timeSlot || 'Chưa xếp ca'}
                      </span>
                    </div>

                    <div className="drawer-prop-item">
                      <span className="drawer-prop-label">Ngày Khai Giảng</span>
                      <span className="drawer-prop-value">
                        {formatDate(classItem.startDate)}
                      </span>
                    </div>

                    <div className="drawer-prop-item">
                      <span className="drawer-prop-label">Trạng Thái Lớp</span>
                      <span className="drawer-prop-value">
                        {getLifecycleStatusLabel(classItem.status, classItem.currentEnrolled)}
                      </span>
                    </div>

                    {classItem.targetOutput && (
                      <div className="drawer-prop-item full-width">
                        <span className="drawer-prop-label">Chuẩn Đầu Ra Cam Kết</span>
                        <span className="drawer-prop-value" style={{ color: '#2563eb' }}>
                          <Target size={14} />
                          <span>{classItem.targetOutput}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Chế độ Chỉnh sửa (Edit Mode) */
                <div className="drawer-section-card">
                  <div className="drawer-section-header">
                    <h4 className="drawer-section-title">
                      <Edit2 size={16} style={{ color: '#2563eb' }} />
                      <span>Chỉnh Sửa Lớp Học</span>
                    </h4>
                  </div>

                  <div className="drawer-edit-grid">
                    <div className="drawer-field-group full-width">
                      <label className="drawer-label">Tên Hiển Thị Lớp Học *</label>
                      <input
                        type="text"
                        value={editClassName}
                        onChange={(e) => setEditClassName(e.target.value)}
                        className="drawer-input-control"
                      />
                    </div>

                    <div className="drawer-field-group full-width">
                      <label className="drawer-label">Giảng Viên Phụ Trách</label>
                      <input
                        type="text"
                        value={editTeacherName}
                        onChange={(e) => setEditTeacherName(e.target.value)}
                        className="drawer-input-control"
                        placeholder="VD: Ms. Emily Nguyễn"
                      />
                    </div>

                    <div className="drawer-field-group">
                      <label className="drawer-label">Lịch Học Trong Tuần</label>
                      <select
                        value={editScheduleDays}
                        onChange={(e) => setEditScheduleDays(e.target.value as ScheduleDays)}
                        className="drawer-input-control"
                      >
                        <option value="MON_WED_FRI">Thứ 2 - Thứ 4 - Thứ 6</option>
                        <option value="TUE_THU_SAT">Thứ 3 - Thứ 5 - Thứ 7</option>
                        <option value="WEEKEND">Cuối tuần (T7 & CN)</option>
                      </select>
                    </div>

                    <div className="drawer-field-group">
                      <label className="drawer-label">Ca Học</label>
                      <input
                        type="text"
                        value={editTimeSlot}
                        onChange={(e) => setEditTimeSlot(e.target.value)}
                        className="drawer-input-control"
                        placeholder="VD: 18:00 - 19:30"
                      />
                    </div>

                    <div className="drawer-field-group">
                      <label className="drawer-label">Phòng Học / Cơ Sở</label>
                      <input
                        type="text"
                        value={editRoom}
                        onChange={(e) => setEditRoom(e.target.value)}
                        className="drawer-input-control"
                        placeholder="VD: Phòng 302"
                      />
                    </div>

                    <div className="drawer-field-group">
                      <label className="drawer-label">Ngày Khai Giảng</label>
                      <input
                        type="date"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        className="drawer-input-control"
                      />
                    </div>

                    <div className="drawer-field-group">
                      <label className="drawer-label">Sĩ Số Tối Đa</label>
                      <input
                        type="number"
                        min={classItem.currentEnrolled || 1}
                        max={50}
                        value={editMaxCapacity}
                        onChange={(e) => setEditMaxCapacity(Number(e.target.value))}
                        className="drawer-input-control"
                      />
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Tối thiểu: {classItem.currentEnrolled} (số học viên hiện tại)
                      </span>
                    </div>

                    <div className="drawer-field-group">
                      <label className="drawer-label">Trạng Thái Lớp Học</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as ClassStatus)}
                        className="drawer-input-control"
                      >
                        <option value="PLANNING">Dự kiến khai giảng</option>
                        <option value="OPEN">Đang mở tuyển sinh</option>
                        <option value="IN_PROGRESS">Đang học</option>
                        <option value="COMPLETED">Đã kết thúc</option>
                        <option value="FULL">Khóa sổ sĩ số (Đầy)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: DANH SÁCH HỌC VIÊN (ROSTER) */}
          {activeTab === 'ROSTER' && (
            <div className="drawer-section-card">
              <div className="drawer-section-header">
                <h4 className="drawer-section-title">
                  <Users size={16} style={{ color: '#2563eb' }} />
                  <span>Danh Sách Học Viên</span>
                </h4>
                <Button
                  variant="glass"
                  size="sm"
                  onClick={handleExportRosterCSV}
                  disabled={enrollments.length === 0}
                  iconLeft={<Download size={13} />}
                >
                  Xuất CSV
                </Button>
              </div>

              {isLoadingRoster ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Đang tải danh sách học viên...
                </div>
              ) : enrollments.length === 0 ? (
                <div
                  style={{
                    padding: '36px 16px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    borderRadius: '12px',
                  }}
                >
                  <Users size={32} style={{ color: '#94a3b8', margin: '0 auto 8px auto' }} />
                  <p style={{ fontWeight: 600, color: '#334155', margin: '0 0 4px 0' }}>
                    Chưa có học viên nào trong lớp
                  </p>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0' }}>
                    {isEnded
                      ? 'Lớp học này đã kết thúc hoặc đã hủy.'
                      : 'Lớp hiện đang mở tuyển sinh. Bạn có thể bấm nút Ghi Danh Học Viên ở thanh dưới cùng.'}
                  </p>
                </div>
              ) : (
                <div className="roster-table-container">
                  <table className="roster-table">
                    <thead>
                      <tr>
                        <th>Học Viên</th>
                        <th>Liên Hệ</th>
                        <th>Ngày Nhập Học</th>
                        <th style={{ textAlign: 'center' }}>Học Phí & Công Nợ</th>
                        <th style={{ textAlign: 'right' }}>Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((en, idx) => (
                        <tr key={en.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{en.fullName}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={11} style={{ color: '#2563eb' }} />
                              <span style={{ fontSize: '12px', fontWeight: 500 }}>
                                {en.phoneNumber}
                              </span>
                            </div>
                            {en.email && (
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{en.email}</div>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', color: '#475569' }}>
                              {formatDate(en.enrollmentDate)}
                            </span>
                          </td>
                          {/* Học Phí - Single-Line Notion Pill with Hover Popover */}
                          <td style={{ textAlign: 'center' }}>
                            <div className="notion-finance-wrapper">
                              <div
                                className={`notion-finance-pill ${
                                  en.paymentStatus === 'FULLY_PAID'
                                    ? 'paid'
                                    : Number(en.balanceDue || 0) > 0
                                    ? 'debt'
                                    : 'unpaid'
                                }`}
                                onClick={() => onCollectPayment && onCollectPayment(en)}
                                title="Bấm để xem chi tiết hoặc thu học phí"
                              >
                                {en.paymentStatus === 'FULLY_PAID' ? (
                                  <span>Đã nộp đủ</span>
                                ) : Number(en.balanceDue || 0) > 0 ? (
                                  <span>Còn nợ</span>
                                ) : (
                                  <span>Chưa nộp</span>
                                )}
                              </div>

                              {/* Hover Popover Breakdown (opens downward on first row to prevent clipping) */}
                              <div
                                className={`notion-finance-popover ${
                                  idx === 0 ? 'popover-bottom' : ''
                                }`}
                              >
                                <div className="notion-popover-title">Chi Tiết Học Phí & Công Nợ</div>
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
                                  <span>{Number(en.finalAmount || 0).toLocaleString('vi-VN')} đ</span>
                                </div>
                                <div className="notion-popover-divider" />
                                <div className="notion-popover-row">
                                  <span>Đã thanh toán:</span>
                                  <span>{Number(en.paidAmount || 0).toLocaleString('vi-VN')} đ</span>
                                </div>
                                <div
                                  className={`notion-popover-row ${
                                    Number(en.balanceDue || 0) > 0 ? 'debt' : 'paid-full'
                                  }`}
                                >
                                  <span>
                                    {Number(en.balanceDue || 0) > 0
                                      ? 'Còn nợ học phí:'
                                      : 'Trạng thái:'}
                                  </span>
                                  <span>
                                    {Number(en.balanceDue || 0) > 0
                                      ? `${Number(en.balanceDue).toLocaleString('vi-VN')} đ`
                                      : 'Đã hoàn tất'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Thao Tác - 28px Icon Buttons with Tooltip */}
                          <td style={{ textAlign: 'right' }}>
                            <div className="table-actions-group">
                              {onCollectPayment && (
                                <button
                                  type="button"
                                  onClick={() => onCollectPayment(en)}
                                  className={`table-action-icon-btn ${
                                    Number(en.balanceDue || 0) > 0 ? 'pay-debt' : 'pay-done'
                                  }`}
                                  title={
                                    Number(en.balanceDue || 0) > 0
                                      ? `Ghi nhận thu phí (Còn nợ: ${Number(
                                          en.balanceDue
                                        ).toLocaleString('vi-VN')} đ)`
                                      : 'Xem lịch sử thanh toán học phí'
                                  }
                                >
                                  <CreditCard size={13} />
                                </button>
                              )}
                              {onTransferClass && (
                                <button
                                  type="button"
                                  onClick={() => onTransferClass(en)}
                                  className="table-action-icon-btn transfer"
                                  title="Điều phối chuyển lớp học"
                                >
                                  <ArrowRightLeft size={13} />
                                </button>
                              )}
                              {onPrintReceipt && (
                                <button
                                  type="button"
                                  onClick={() => onPrintReceipt(en)}
                                  className="table-action-icon-btn receipt"
                                  title="Lịch sử biên lai & in phiếu thu"
                                >
                                  <Printer size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Sticky Footer (Single authoritative action bar) */}
        <div className="classes-drawer-footer" style={{ gap: '10px', justifyContent: 'space-between' }}>
          {activeTab === 'GENERAL' && isEditing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
              <Button variant="glass" onClick={handleCancelEdit} disabled={isSaving}>
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveGeneralInfo}
                disabled={isSaving}
                iconLeft={<Save size={15} />}
                style={{
                  background: '#2563eb',
                  fontWeight: 600,
                }}
              >
                {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </Button>
            </div>
          ) : (
            <>
              <div>
                {activeTab === 'GENERAL' && canEdit && (
                  <Button
                    variant="glass"
                    onClick={() => setIsEditing(true)}
                    iconLeft={<Edit2 size={14} />}
                  >
                    Chỉnh Sửa Lớp
                  </Button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {onEnrollClick && (
                  <Button
                    variant="primary"
                    onClick={() => onEnrollClick(classItem.id)}
                    disabled={!canEnrollThisClass}
                    iconLeft={<UserPlus size={14} />}
                    style={{
                      background: canEnrollThisClass ? '#2563eb' : '#94a3b8',
                      fontWeight: 600,
                    }}
                  >
                    {isEnded
                      ? 'Lớp Đã Đóng'
                      : isClassFull
                      ? 'Đã Đầy Lớp'
                      : 'Ghi Danh Học Viên'}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
