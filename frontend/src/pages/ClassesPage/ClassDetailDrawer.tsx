import React, { useState, useEffect, useMemo } from 'react';
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
  Search,
  RefreshCw,
} from 'lucide-react';
import { AcademicService } from '../../services/academic.service';
import { StaffService } from '../../services/staff.service';
import type { TeacherItem } from '../../types/staff';
import type {
  ClassItem,
  ClassEnrollmentItem,
  UpdateClassPayload,
  ScheduleDays,
  ClassStatus,
  EnrollmentStatus,
} from '../../types/academic';
import { Button, PaginationBar } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { hasRequiredRole, ACTION_PERMISSIONS } from '../../config/rbac.config';
import { CLASS_STATUS_META } from './ClassesPage';

interface ClassDetailDrawerProps {
  classItem: ClassItem | null;
  initialTab?: 'GENERAL' | 'ROSTER';
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onEnrollClick?: (classId: number) => void;
  onCollectPayment?: (enrollment: ClassEnrollmentItem) => void;
  onTransferClass?: (enrollment: ClassEnrollmentItem) => void;
  onPrintReceipt?: (enrollment: ClassEnrollmentItem) => void;
}

export const ENROLLMENT_STATUS_META: Record<
  EnrollmentStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  ENROLLED: {
    label: 'Đang theo học',
    bg: '#ecfdf5',
    color: '#047857',
    border: '#a7f3d0',
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    bg: '#eef2ff',
    color: '#4338ca',
    border: '#c7d2fe',
  },
  TRANSFERRED: {
    label: 'Đã chuyển lớp',
    bg: '#fef3c7',
    color: '#b45309',
    border: '#fde68a',
  },
  DROPPED: {
    label: 'Bảo lưu / Thôi học',
    bg: '#fef2f2',
    color: '#b91c1c',
    border: '#fecaca',
  },
};

export const ClassDetailDrawer: React.FC<ClassDetailDrawerProps> = ({
  classItem,
  initialTab = 'ROSTER',
  isOpen,
  onClose,
  onUpdated,
  onEnrollClick,
  onCollectPayment,
  onTransferClass,
  onPrintReceipt,
}) => {
  const { user } = useAuth();
  const canEditClass = hasRequiredRole(user?.role, ACTION_PERMISSIONS.CLASS_EDIT);
  const canViewTuition = hasRequiredRole(user?.role, ACTION_PERMISSIONS.VIEW_TUITION);
  const hasRosterActions = !!(onCollectPayment || onTransferClass || onPrintReceipt);

  const [activeTab, setActiveTab] = useState<'GENERAL' | 'ROSTER'>(initialTab);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [enrollments, setEnrollments] = useState<ClassEnrollmentItem[]>([]);
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [rosterStatusFilter, setRosterStatusFilter] = useState<string>('ALL');
  const [rosterPage, setRosterPage] = useState<number>(1);
  const [rosterPageSize, setRosterPageSize] = useState<number>(5);
  const [isLoadingRoster, setIsLoadingRoster] = useState<boolean>(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Editable Form States
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [customTeacherInput, setCustomTeacherInput] = useState<boolean>(false);
  const [editClassName, setEditClassName] = useState<string>('');
  const [editTeacherName, setEditTeacherName] = useState<string>('');
  const [editScheduleDays, setEditScheduleDays] = useState<ScheduleDays>('MON_WED_FRI');
  const [editTimeSlot, setEditTimeSlot] = useState<string>('');
  const [editRoom, setEditRoom] = useState<string>('');
  const [editStartDate, setEditStartDate] = useState<string>('');
  const [editMaxCapacity, setEditMaxCapacity] = useState<number>(15);
  const [editStatus, setEditStatus] = useState<ClassStatus>('OPEN');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      if (canEditClass) {
        StaffService.getTeachers()
          .then((list) => setTeachers(list || []))
          .catch(() => setTeachers([]));
      }
    }
  }, [initialTab, isOpen, classItem?.id, canEditClass]);

  // Sync state whenever classItem changes
  useEffect(() => {
    if (!classItem) return;

    setEditClassName(classItem.className || '');
    setEditTeacherName(classItem.teacherName || '');
    setEditScheduleDays(classItem.scheduleDays || 'MON_WED_FRI');
    setEditTimeSlot(classItem.timeSlot || '');
    setEditRoom(classItem.room || '');
    setEditStartDate(classItem.startDate ? classItem.startDate.split('T')[0] : '');
    setEditMaxCapacity(classItem.maxCapacity || 15);
    setEditStatus(classItem.status || 'OPEN');
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
    setIsEditing(false);
    setRosterSearch('');
    setRosterStatusFilter('ALL');
    setRosterPage(1);

    loadRoster(classItem.id, false);
  }, [classItem]);

  const loadRoster = async (classId: number, forceRefresh = false) => {
    try {
      const cached = AcademicService.peekClassEnrollments(classId);
      if (cached && !forceRefresh) {
        setEnrollments(cached);
        setIsLoadingRoster(false);
      } else {
        setIsLoadingRoster(true);
      }
      const data = await AcademicService.getClassEnrollments(classId, { forceRefresh });
      setEnrollments(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách học viên trong lớp:', err);
    } finally {
      setIsLoadingRoster(false);
    }
  };

  const handleStatusChange = async (
    enrollment: ClassEnrollmentItem,
    nextStatus: EnrollmentStatus
  ) => {
    if (nextStatus === enrollment.status) return;
    try {
      setUpdatingStatusId(enrollment.id);
      setSaveErrorMsg(null);
      await AcademicService.updateEnrollmentStatus(enrollment.id, nextStatus);
      if (classItem) {
        await loadRoster(classItem.id, true);
      }
      onUpdated();
      setSaveSuccessMsg(
        `Đã cập nhật trạng thái học viên "${enrollment.fullName}" sang "${ENROLLMENT_STATUS_META[nextStatus].label}"`
      );
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      setSaveErrorMsg(
        err?.response?.data?.message || err.message || 'Không thể cập nhật trạng thái học viên'
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const filteredRoster = useMemo(() => {
    return enrollments.filter((en) => {
      if (rosterStatusFilter !== 'ALL' && en.status !== rosterStatusFilter) {
        return false;
      }
      if (rosterSearch.trim()) {
        const q = rosterSearch.toLowerCase().trim();
        const matchName = en.fullName.toLowerCase().includes(q);
        const matchCode = (en.studentCode || '').toLowerCase().includes(q);
        const matchPhone = (en.phoneNumber || '').includes(q);
        const matchEmail = (en.email || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchPhone && !matchEmail) return false;
      }
      return true;
    });
  }, [enrollments, rosterSearch, rosterStatusFilter]);

  const paginatedRoster = useMemo(() => {
    const start = (rosterPage - 1) * rosterPageSize;
    return filteredRoster.slice(start, start + rosterPageSize);
  }, [filteredRoster, rosterPage, rosterPageSize]);

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
    if (!dateStr || dateStr === 'Chưa cập nhật' || dateStr === 'null' || dateStr === 'undefined')
      return 'Chưa cập nhật';
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

  const activeEnrolledCount = enrollments.filter((e) => e.status === 'ENROLLED').length;
  const displayedEnrolledCount =
    enrollments.length > 0 ? activeEnrolledCount || enrollments.length : classItem.currentEnrolled;

  const currentFillPercent = Math.min(
    100,
    Math.round((classItem.currentEnrolled / Math.max(1, classItem.maxCapacity)) * 100)
  );

  const statusMeta =
    CLASS_STATUS_META[
      (classItem.isFull || classItem.currentEnrolled >= classItem.maxCapacity) &&
      classItem.status !== 'COMPLETED'
        ? 'FULL'
        : classItem.status
    ] || CLASS_STATUS_META.OPEN;

  const handleExportRosterCSV = () => {
    if (enrollments.length === 0) {
      alert('Lớp học chưa có học viên nào để xuất dữ liệu.');
      return;
    }
    const headers = [
      'Mã Học Viên',
      'Họ và Tên',
      'Số Điện Thoại',
      'Email',
      'Ngày Ghi Danh',
      'Trạng Thái Đào Tạo',
      ...(canViewTuition ? ['Trạng Thái Học Phí', 'Đã Nộp (VNĐ)', 'Còn Nợ (VNĐ)'] : []),
    ];
    const rows = enrollments.map((e) => [
      e.studentCode,
      `"${e.fullName}"`,
      e.phoneNumber,
      `"${e.email || ''}"`,
      e.enrollmentDate,
      ENROLLMENT_STATUS_META[e.status]?.label || e.status,
      ...(canViewTuition ? [e.paymentStatus, e.paidAmount, e.balanceDue] : []),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Danh_sach_HV_${classItem.classCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCancelEdit = () => {
    if (!classItem) return;
    setEditClassName(classItem.className || '');
    setEditTeacherName(classItem.teacherName || '');
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
      setSaveErrorMsg(
        err?.response?.data?.message || err.message || 'Lỗi khi cập nhật lớp học'
      );
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #dbeafe',
                }}
              >
                {classItem.classCode}
              </span>
              {(classItem.isFull || classItem.currentEnrolled >= classItem.maxCapacity) &&
              classItem.status !== 'COMPLETED' ? (
                <span className="class-status-badge full">
                  <Lock size={12} /> ĐÃ ĐẦY LỚP
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

            <div className="drawer-header-actions">
              {onEnrollClick && classItem.status !== 'COMPLETED' && (
                <Button
                  variant="primary"
                  size="sm"
                  iconLeft={<UserPlus size={13} />}
                  onClick={() => onEnrollClick(classItem.id)}
                  disabled={classItem.isFull || classItem.currentEnrolled >= classItem.maxCapacity}
                  style={{
                    background: '#2563eb',
                    fontWeight: 600,
                    borderRadius: '8px',
                    height: '32px',
                    fontSize: '12.5px',
                  }}
                >
                  Ghi Danh HV
                </Button>
              )}
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
              <span>GV: {classItem.teacherName || 'Chưa phân công'}</span>
              {canViewTuition && (
                <>
                  <span className="drawer-dot">·</span>
                  <span className="drawer-tuition">
                    {Number(classItem.standardTuition).toLocaleString('vi-VN')} đ
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Drawer Navigation Tabs */}
        <div className="classes-drawer-tabs-nav">
          <button
            type="button"
            className={`drawer-tab-btn ${activeTab === 'ROSTER' ? 'active' : ''}`}
            onClick={() => setActiveTab('ROSTER')}
          >
            <Users size={15} />
            <span>Danh sách học viên</span>
            <span className="drawer-tab-count-badge">
              {enrollments.length || displayedEnrolledCount}
            </span>
          </button>
          <button
            type="button"
            className={`drawer-tab-btn ${activeTab === 'GENERAL' ? 'active' : ''}`}
            onClick={() => setActiveTab('GENERAL')}
          >
            <Clock size={15} />
            <span>Thông tin lớp & Lịch học</span>
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
              {/* Sĩ số Card */}
              <div className="drawer-section-card">
                <div className="drawer-section-header">
                  <h4 className="drawer-section-title">
                    <Users size={16} style={{ color: '#2563eb' }} />
                    <span>Sĩ Số Lớp Học</span>
                  </h4>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color:
                        classItem.availableSeats === 0
                          ? '#dc2626'
                          : classItem.availableSeats <= 2
                          ? '#d97706'
                          : '#059669',
                    }}
                  >
                    {classItem.availableSeats === 0
                      ? '🔒 Đã đầy lớp'
                      : `Còn ${classItem.availableSeats} chỗ trống`}
                  </span>
                </div>

                <div className="class-capacity-progress-box">
                  <div className="capacity-text-row">
                    <span className="capacity-fraction-text">
                      Đang theo học: <strong>{classItem.currentEnrolled}</strong> /{' '}
                      {classItem.maxCapacity} học viên (Tổng hồ sơ: {enrollments.length})
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
                        backgroundColor:
                          currentFillPercent >= 100
                            ? '#ef4444'
                            : currentFillPercent >= 75
                            ? '#f59e0b'
                            : '#10b981',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Thông tin chi tiết Card */}
              {!isEditing ? (
                <div className="drawer-section-card">
                  <div className="drawer-section-header">
                    <h4 className="drawer-section-title">
                      <Clock size={16} style={{ color: '#2563eb' }} />
                      <span>Thông Tin Chi Tiết</span>
                    </h4>
                    {canEditClass && (
                      <Button
                        variant="glass"
                        size="sm"
                        iconLeft={<Edit2 size={13} />}
                        onClick={() => setIsEditing(true)}
                      >
                        Chỉnh Sửa
                      </Button>
                    )}
                  </div>

                  <div className="drawer-prop-grid">
                    <div className="drawer-prop-item">
                      <span className="drawer-prop-label">Giảng Viên</span>
                      <span className="drawer-prop-value">
                        {classItem.teacherName || 'Chưa phân công'}
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
                      <span className="drawer-prop-label">Phòng Học / Cơ Sở</span>
                      <span className="drawer-prop-value">
                        {classItem.room || 'Chưa xếp phòng'}
                      </span>
                    </div>

                    <div className="drawer-prop-item">
                      <span className="drawer-prop-label">Khai Giảng</span>
                      <span className="drawer-prop-value">{formatDate(classItem.startDate)}</span>
                    </div>

                    <div className="drawer-prop-item">
                      <span className="drawer-prop-label">Khóa Học</span>
                      <span className="drawer-prop-value highlight">{classItem.courseName}</span>
                    </div>

                    {canViewTuition && (
                      <div className="drawer-prop-item">
                        <span className="drawer-prop-label">Học Phí Niêm Yết</span>
                        <span className="drawer-prop-value price">
                          {Number(classItem.standardTuition).toLocaleString('vi-VN')} VNĐ
                        </span>
                      </div>
                    )}

                    {classItem.targetOutput && (
                      <div className="drawer-prop-item full-width">
                        <span className="drawer-prop-label">Chuẩn Đầu Ra Cam Kết</span>
                        <span className="drawer-prop-value" style={{ color: '#2563eb' }}>
                          🎯 {classItem.targetOutput}
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="drawer-label" style={{ marginBottom: 0 }}>
                          Giảng Viên Đứng Lớp Phụ Trách
                        </label>
                        {teachers.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setCustomTeacherInput((prev) => !prev)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#2563eb',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {customTeacherInput ? 'Chọn từ danh sách GV' : '+ Nhập tên GV khác'}
                          </button>
                        )}
                      </div>
                      {teachers.length > 0 && !customTeacherInput ? (
                        <select
                          value={editTeacherName}
                          onChange={(e) => setEditTeacherName(e.target.value)}
                          className="drawer-input-control"
                          style={{ fontWeight: 600 }}
                        >
                          {editTeacherName &&
                            !teachers.some((t) => t.fullName === editTeacherName) && (
                              <option value={editTeacherName}>{editTeacherName}</option>
                            )}
                          {teachers.map((t) => (
                            <option key={t.id} value={t.fullName}>
                              {t.fullName} {t.specialization ? `(${t.specialization})` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={editTeacherName}
                          onChange={(e) => setEditTeacherName(e.target.value)}
                          className="drawer-input-control"
                          placeholder="VD: ThS. Nguyễn Thị Thu Hà (Ms. Emily)"
                        />
                      )}
                    </div>

                    <div className="drawer-field-group">
                      <label className="drawer-label">Lịch Học Trong Tuần</label>
                      <select
                        value={editScheduleDays}
                        onChange={(e) => setEditScheduleDays(e.target.value as ScheduleDays)}
                        className="drawer-input-control"
                      >
                        <option value="MON_WED_FRI">📅 Thứ 2 - Thứ 4 - Thứ 6</option>
                        <option value="TUE_THU_SAT">📅 Thứ 3 - Thứ 5 - Thứ 7</option>
                        <option value="WEEKEND">📅 Cuối tuần (T7 & CN)</option>
                      </select>
                    </div>

                    <div className="drawer-field-group">
                      <label className="drawer-label">Ca Học (Time Slot)</label>
                      <input
                        type="text"
                        value={editTimeSlot}
                        onChange={(e) => setEditTimeSlot(e.target.value)}
                        className="drawer-input-control"
                        placeholder="VD: 18:00-19:30"
                      />
                    </div>

                    <div className="drawer-field-group">
                      <label className="drawer-label">Phòng Học / Cơ Sở</label>
                      <input
                        type="text"
                        value={editRoom}
                        onChange={(e) => setEditRoom(e.target.value)}
                        className="drawer-input-control"
                        placeholder="VD: Room 101 - Tầng 1"
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
                        <option value="PLANNING">🟡 Dự kiến mở lớp (PLANNING)</option>
                        <option value="OPEN">🟢 Đang mở tuyển sinh (OPEN)</option>
                        <option value="IN_PROGRESS">🔵 Đang học (IN_PROGRESS)</option>
                        <option value="FULL">🔴 Khóa sổ sĩ số - Đã đầy (FULL)</option>
                        <option value="COMPLETED">🟣 Đã kết thúc (COMPLETED)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview danh sách học viên ngay trong tab Tổng quan */}
              <div className="drawer-section-card">
                <div className="drawer-section-header">
                  <h4 className="drawer-section-title">
                    <Users size={16} style={{ color: '#2563eb' }} />
                    <span>Học Viên Trong Lớp ({enrollments.length})</span>
                  </h4>
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => setActiveTab('ROSTER')}
                  >
                    Xem toàn bộ danh sách →
                  </Button>
                </div>

                {enrollments.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    Lớp học hiện chưa có học viên ghi danh.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {enrollments.slice(0, 5).map((en) => {
                      const stMeta = ENROLLMENT_STATUS_META[en.status] || ENROLLMENT_STATUS_META.ENROLLED;
                      return (
                        <div
                          key={en.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                background: '#ede9fe',
                                color: '#4f46e5',
                                padding: '2px 7px',
                                borderRadius: '5px',
                              }}
                            >
                              {en.studentCode}
                            </span>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>
                                {en.fullName}
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                                {en.phoneNumber} {en.email ? `· ${en.email}` : ''}
                              </div>
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              background: stMeta.bg,
                              color: stMeta.color,
                              border: `1px solid ${stMeta.border}`,
                            }}
                          >
                            {stMeta.label}
                          </span>
                        </div>
                      );
                    })}
                    {enrollments.length > 5 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('ROSTER')}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          border: '1px dashed #bfdbfe',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        + Xem thêm {enrollments.length - 5} học viên khác trong lớp
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: DANH SÁCH HỌC VIÊN (ROSTER) */}
          {activeTab === 'ROSTER' && (
            <div className="drawer-section-card">
              <div className="drawer-section-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
                <h4 className="drawer-section-title">
                  <Users size={16} style={{ color: '#2563eb' }} />
                  <span>
                    Danh Sách Học Viên Lớp {classItem.classCode} ({filteredRoster.length}/
                    {enrollments.length})
                  </span>
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="compact-icon-btn"
                    onClick={() => loadRoster(classItem.id, true)}
                    disabled={isLoadingRoster}
                    title="Làm mới danh sách học viên"
                  >
                    <RefreshCw size={14} className={isLoadingRoster ? 'animate-spin' : ''} />
                  </button>
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
              </div>

              {/* Thanh tìm kiếm & lọc nhanh trong lớp */}
              {enrollments.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      minWidth: '200px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                    }}
                  >
                    <Search size={14} style={{ color: '#64748b' }} />
                    <input
                      type="text"
                      value={rosterSearch}
                      onChange={(e) => {
                        setRosterSearch(e.target.value);
                        setRosterPage(1);
                      }}
                      placeholder="Tìm tên, mã STU, SĐT học viên trong lớp..."
                      style={{
                        border: 'none',
                        background: 'transparent',
                        outline: 'none',
                        fontSize: '12.5px',
                        width: '100%',
                        color: '#0f172a',
                      }}
                    />
                    {rosterSearch && (
                      <button
                        type="button"
                        onClick={() => setRosterSearch('')}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: '#94a3b8',
                          padding: 0,
                        }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  <select
                    value={rosterStatusFilter}
                    onChange={(e) => {
                      setRosterStatusFilter(e.target.value);
                      setRosterPage(1);
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: '#334155',
                    }}
                  >
                    <option value="ALL">Tất cả trạng thái ({enrollments.length})</option>
                    <option value="ENROLLED">
                      Đang theo học ({enrollments.filter((e) => e.status === 'ENROLLED').length})
                    </option>
                    <option value="COMPLETED">
                      Đã hoàn thành ({enrollments.filter((e) => e.status === 'COMPLETED').length})
                    </option>
                    <option value="TRANSFERRED">
                      Đã chuyển lớp ({enrollments.filter((e) => e.status === 'TRANSFERRED').length})
                    </option>
                    <option value="DROPPED">
                      Bảo lưu / Thôi học ({enrollments.filter((e) => e.status === 'DROPPED').length})
                    </option>
                  </select>
                </div>
              )}

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
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 14px 0' }}>
                    {onEnrollClick
                      ? 'Lớp hiện đang mở tuyển sinh. Bạn có thể ghi danh học viên mới ngay.'
                      : 'Lớp hiện chưa có học viên ghi danh.'}
                  </p>
                  {onEnrollClick && (
                    <Button
                      variant="primary"
                      size="sm"
                      iconLeft={<UserPlus size={14} />}
                      onClick={() => onEnrollClick(classItem.id)}
                      style={{ background: '#2563eb' }}
                    >
                      Ghi Danh Học Viên
                    </Button>
                  )}
                </div>
              ) : filteredRoster.length === 0 ? (
                <div style={{ padding: '28px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  Không tìm thấy học viên nào khớp với bộ lọc hiện tại.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="roster-table">
                    <thead>
                      <tr>
                        <th>Mã HV</th>
                        <th>Họ và Tên</th>
                        <th>Liên Hệ</th>
                        <th>Trạng Thái Học</th>
                        {canViewTuition && <th style={{ textAlign: 'center' }}>Học Phí & Công Nợ</th>}
                        {hasRosterActions && <th style={{ textAlign: 'right' }}>Thao Tác</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRoster.map((en) => {
                        const stMeta =
                          ENROLLMENT_STATUS_META[en.status] || ENROLLMENT_STATUS_META.ENROLLED;
                        return (
                          <tr key={en.id}>
                            <td>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  background: '#ede9fe',
                                  color: '#4f46e5',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                }}
                              >
                                {en.studentCode}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{en.fullName}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                Nhập học: {formatDate(en.enrollmentDate)}
                              </div>
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

                            {/* Trạng thái đào tạo (Cho phép Admin/Academic đổi trực tiếp) */}
                            <td>
                              {canEditClass ? (
                                <select
                                  value={en.status}
                                  disabled={updatingStatusId === en.id}
                                  onChange={(e) =>
                                    handleStatusChange(en, e.target.value as EnrollmentStatus)
                                  }
                                  style={{
                                    fontSize: '11.5px',
                                    fontWeight: 600,
                                    padding: '3px 8px',
                                    borderRadius: '999px',
                                    background: stMeta.bg,
                                    color: stMeta.color,
                                    border: `1px solid ${stMeta.border}`,
                                    cursor: 'pointer',
                                    outline: 'none',
                                  }}
                                  title="Đổi trạng thái học viên"
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
                                    padding: '3px 9px',
                                    borderRadius: '999px',
                                    background: stMeta.bg,
                                    color: stMeta.color,
                                    border: `1px solid ${stMeta.border}`,
                                    display: 'inline-block',
                                  }}
                                >
                                  {stMeta.label}
                                </span>
                              )}
                            </td>

                            {/* Học Phí */}
                            {canViewTuition && (
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
                                      <span>
                                        {Number(en.paidAmount || 0).toLocaleString('vi-VN')} đ
                                      </span>
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
                            )}

                            {/* Thao Tác */}
                            {hasRosterActions && (
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
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <PaginationBar
                    currentPage={rosterPage}
                    totalItems={filteredRoster.length}
                    pageSize={rosterPageSize}
                    onPageChange={setRosterPage}
                    onPageSizeChange={(size) => {
                      setRosterPageSize(size);
                      setRosterPage(1);
                    }}
                    pageSizeOptions={[5, 10, 20]}
                    itemLabel="học viên"
                    compact
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Sticky Footer */}
        <div className="classes-drawer-footer" style={{ gap: '10px' }}>
          {activeTab === 'GENERAL' ? (
            isEditing ? (
              <>
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
              </>
            ) : (
              <>
                <Button variant="glass" onClick={onClose}>
                  Đóng
                </Button>
                {canEditClass && (
                  <Button
                    variant="primary"
                    onClick={() => setIsEditing(true)}
                    iconLeft={<Edit2 size={14} />}
                    style={{
                      background: '#2563eb',
                      fontWeight: 600,
                    }}
                  >
                    Chỉnh Sửa Lớp
                  </Button>
                )}
              </>
            )
          ) : (
            <>
              <Button variant="glass" onClick={onClose}>
                Đóng
              </Button>
              {onEnrollClick && classItem.status !== 'COMPLETED' && (
                <Button
                  variant="primary"
                  onClick={() => onEnrollClick(classItem.id)}
                  disabled={classItem.isFull || classItem.currentEnrolled >= classItem.maxCapacity}
                  iconLeft={<UserPlus size={14} />}
                  style={{
                    background: '#2563eb',
                    fontWeight: 600,
                  }}
                >
                  Ghi Danh Học Viên Mới
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
