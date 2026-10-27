import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  Edit2,
  Save,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  Phone,
  Lock,
  CreditCard,
  ArrowRightLeft,
  Printer,
  Copy,
  Check,
  Flame,
  Search,
} from 'lucide-react';
import { AcademicService } from '../../services/academic.service';
import { StaffService } from '../../services/staff.service';
import type {
  ClassItem,
  ClassEnrollmentItem,
  ScheduleDays,
  ClassStatus,
  EnrollmentStatus,
} from '../../types/academic';
import type { TeacherOption } from '../../types/staff';
import { Button, PaginationBar } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { hasRequiredRole, ACTION_PERMISSIONS } from '../../config/rbac.config';

interface ClassDetailDrawerProps {
  classItem: ClassItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  canEdit?: boolean;
  initialTab?: 'GENERAL' | 'ROSTER';
  onEnrollClick?: (classId: number) => void;
  onCollectPayment?: (enrollment: ClassEnrollmentItem) => void;
  onTransferClass?: (enrollment: ClassEnrollmentItem) => void;
  onPrintReceipt?: (enrollment: ClassEnrollmentItem) => void;
}

const formatShortClassCode = (code?: string | null): string => {
  if (!code) return '';
  return code
    .replace(/-(T246|T357|T7CN|246|357|T7|CN|WEEKEND|MON_WED_FRI|TUE_THU_SAT)$/i, '')
    .trim();
};

const formatTeacherName = (name?: string | null) => {
  if (!name) return 'Chưa phân công giảng viên';
  return name.replace(/\s*\([^)]*\)/g, '').trim() || 'Chưa phân công giảng viên';
};

const ENROLLMENT_STATUS_META: Record<
  EnrollmentStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  ENROLLED: {
    label: 'Đang theo học',
    bg: '#dcfce7',
    color: '#166534',
    border: '#bbf7d0',
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    bg: '#dbeafe',
    color: '#1e40af',
    border: '#bfdbfe',
  },
  TRANSFERRED: {
    label: 'Đã chuyển lớp',
    bg: '#fef3c7',
    color: '#92400e',
    border: '#fde68a',
  },
  DROPPED: {
    label: 'Bảo lưu / Thôi học',
    bg: '#fee2e2',
    color: '#991b1b',
    border: '#fecaca',
  },
};

export const ClassDetailDrawer: React.FC<ClassDetailDrawerProps> = ({
  classItem,
  isOpen,
  onClose,
  onUpdated,
  canEdit,
  initialTab = 'GENERAL',
  onEnrollClick,
  onCollectPayment,
  onTransferClass,
  onPrintReceipt,
}) => {
  const { user } = useAuth();
  const canEditClass =
    canEdit !== undefined ? canEdit : hasRequiredRole(user?.role, ACTION_PERMISSIONS.CLASS_EDIT);
  const canViewTuition = hasRequiredRole(user?.role, ACTION_PERMISSIONS.VIEW_TUITION);
  const hasRosterActions = Boolean(onCollectPayment || onTransferClass || onPrintReceipt);

  const [activeTab, setActiveTab] = useState<'GENERAL' | 'ROSTER'>(initialTab);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Roster State
  const [enrollments, setEnrollments] = useState<ClassEnrollmentItem[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState<boolean>(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [rosterStatusFilter, setRosterStatusFilter] = useState<string>('ALL');
  const [rosterPage, setRosterPage] = useState<number>(1);
  const [rosterPageSize, setRosterPageSize] = useState<number>(5);

  // Edit Form State
  const [className, setClassName] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [room, setRoom] = useState<string>('');
  const [scheduleDays, setScheduleDays] = useState<ScheduleDays>('MON_WED_FRI');
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [maxCapacity, setMaxCapacity] = useState<number>(15);
  const [status, setStatus] = useState<ClassStatus>('OPEN');

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (classItem) {
      setClassName(classItem.className);
      setSelectedTeacherId(classItem.teacherId ? String(classItem.teacherId) : '');
      setRoom(classItem.room || '');
      setScheduleDays(classItem.scheduleDays);
      setTimeSlot(classItem.timeSlot);
      setStartDate(classItem.startDate);
      setMaxCapacity(classItem.maxCapacity);
      setStatus(classItem.status);
      setIsEditing(false);
      setErrorMsg(null);
      setSuccessMsg(null);
      setCopiedCode(false);
      setRosterSearch('');
      setRosterStatusFilter('ALL');
      setRosterPage(1);
    }
  }, [classItem]);

  useEffect(() => {
    if (isOpen && classItem) {
      setActiveTab(initialTab);
    }
  }, [isOpen, classItem?.id, initialTab]);

  useEffect(() => {
    if (isOpen && canEditClass) {
      StaffService.getTeachers()
        .then((list) => setTeachers(list || []))
        .catch(() => {});
    }
  }, [isOpen, canEditClass]);

  const loadRoster = useCallback(async (classId: number, forceRefresh = false) => {
    try {
      const cached = AcademicService.peekClassEnrollments(classId);
      if (cached && !forceRefresh) {
        setEnrollments(cached);
        setIsLoadingRoster(false);
      } else {
        setIsLoadingRoster(true);
      }
      const list = await AcademicService.getClassEnrollments(classId, { forceRefresh });
      setEnrollments(list);
    } catch (err) {
      console.error('Lỗi tải danh sách học viên trong lớp:', err);
    } finally {
      setIsLoadingRoster(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && classItem) {
      loadRoster(classItem.id);
    }
  }, [isOpen, classItem, loadRoster]);

  const filteredRoster = useMemo(() => {
    return enrollments.filter((en) => {
      if (rosterStatusFilter !== 'ALL' && en.status !== rosterStatusFilter) {
        return false;
      }
      if (rosterSearch.trim()) {
        const q = rosterSearch.toLowerCase().trim();
        const matchName = (en.fullName || '').toLowerCase().includes(q);
        const matchCode = (en.studentCode || '').toLowerCase().includes(q);
        const matchPhone = (en.phoneNumber || '').toLowerCase().includes(q);
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

  useEffect(() => {
    setRosterPage(1);
  }, [rosterSearch, rosterStatusFilter]);

  if (!isOpen || !classItem) return null;

  const isEnded = classItem.status === 'COMPLETED' || classItem.status === 'CANCELLED';
  const isCancelled =
    classItem.status === 'CANCELLED' ||
    (classItem.status === 'COMPLETED' && classItem.currentEnrolled === 0);
  const isClassFull =
    !isEnded &&
    (classItem.isFull ||
      classItem.status === 'FULL' ||
      classItem.currentEnrolled >= classItem.maxCapacity);

  const occupancyPercent =
    classItem.maxCapacity > 0
      ? Math.min(100, Math.round((classItem.currentEnrolled / classItem.maxCapacity) * 100))
      : 0;
  const isNearFull = !isEnded && !isClassFull && occupancyPercent >= 80;
  const canEnrollThisClass = !isEnded && !isClassFull;

  const shortClassCode = formatShortClassCode(classItem.classCode);

  const handleCopyCode = () => {
    if (!shortClassCode) return;
    navigator.clipboard?.writeText(shortClassCode).catch(() => {});
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 1500);
  };

  const handleSaveGeneralInfo = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!className.trim()) {
      setErrorMsg('Tên lớp học không được để trống.');
      return;
    }
    if (!timeSlot.trim()) {
      setErrorMsg('Khung giờ học không được để trống.');
      return;
    }
    if (Number(maxCapacity) < classItem.currentEnrolled) {
      setErrorMsg(
        `Sĩ số tối đa (${maxCapacity}) không được nhỏ hơn số học viên đang theo học (${classItem.currentEnrolled}).`
      );
      return;
    }

    try {
      setIsSaving(true);
      await AcademicService.updateClass(classItem.id, {
        className: className.trim(),
        teacherId: selectedTeacherId ? Number(selectedTeacherId) : null,
        room: room.trim() || null,
        scheduleDays,
        timeSlot: timeSlot.trim(),
        startDate,
        maxCapacity: Number(maxCapacity),
        status,
      });

      setSuccessMsg('Đã lưu cập nhật thông tin lớp học thành công!');
      setIsEditing(false);
      onUpdated();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err.message || 'Không thể cập nhật thông tin lớp học.';
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setClassName(classItem.className);
    setSelectedTeacherId(classItem.teacherId ? String(classItem.teacherId) : '');
    setRoom(classItem.room || '');
    setScheduleDays(classItem.scheduleDays);
    setTimeSlot(classItem.timeSlot);
    setStartDate(classItem.startDate);
    setMaxCapacity(classItem.maxCapacity);
    setStatus(classItem.status);
    setErrorMsg(null);
    setIsEditing(false);
  };

  const handleStatusChange = async (en: ClassEnrollmentItem, newStatus: EnrollmentStatus) => {
    if (newStatus === en.status) return;
    try {
      setUpdatingStatusId(en.id);
      await AcademicService.updateEnrollmentStatus(en.id, newStatus);
      await loadRoster(classItem.id, true);
      onUpdated();
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Không thể cập nhật trạng thái học viên.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Chưa xác định';
    try {
      const [y, m, d] = dateStr.split('-');
      if (!y || !m || !d) return dateStr;
      return `${d}/${m}/${y}`;
    } catch {
      return dateStr;
    }
  };

  const getScheduleText = (days: ScheduleDays) => {
    switch (days) {
      case 'MON_WED_FRI':
        return 'Thứ 2 - Thứ 4 - Thứ 6';
      case 'TUE_THU_SAT':
        return 'Thứ 3 - Thứ 5 - Thứ 7';
      case 'WEEKEND':
        return 'Thứ 7 - Chủ Nhật';
      default:
        return days;
    }
  };

  const renderHeaderStatusBadge = () => {
    if (isCancelled) {
      return (
        <span className="class-status-badge completed">
          <span>Đã hủy</span>
        </span>
      );
    }
    if (classItem.status === 'COMPLETED') {
      return (
        <span className="class-status-badge completed">
          <span>Đã kết thúc</span>
        </span>
      );
    }
    if (isClassFull) {
      return (
        <span className="class-status-badge full">
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
      return (
        <span className="class-status-badge in-progress">
          <span>Đang học</span>
        </span>
      );
    }
    return (
      <span
        className="class-status-badge"
        style={{
          background: '#dcfce7',
          color: '#15803d',
          border: '1px solid #bbf7d0',
        }}
      >
        <span>Đang mở tuyển sinh</span>
      </span>
    );
  };

  return createPortal(
    <div className="classes-drawer-overlay" onClick={onClose}>
      <div className="classes-drawer-container" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="classes-drawer-header">
          <div className="drawer-header-top-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {renderHeaderStatusBadge()}

              <button
                type="button"
                className="class-row-code text-xs text-gray-500"
                onClick={handleCopyCode}
                title={copiedCode ? 'Đã sao chép mã lớp!' : 'Nhấn để sao chép mã lớp'}
              >
                <span># {shortClassCode}</span>
                {copiedCode ? (
                  <Check size={12} className="copy-code-icon copied" />
                ) : (
                  <Copy size={12} className="copy-code-icon" />
                )}
              </button>
            </div>

            <div className="drawer-header-actions">
              <button
                type="button"
                className="drawer-close-btn"
                onClick={onClose}
                title="Đóng chi tiết"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="drawer-header-title-box">
            <h2 className="drawer-title">{classItem.className}</h2>
            <p className="drawer-subtitle">
              <BookOpen size={13} />
              <span>{classItem.courseName}</span>
              {canViewTuition && (
                <>
                  <span className="drawer-dot">•</span>
                  <span className="drawer-tuition">
                    {Number(classItem.standardTuition || 0).toLocaleString('vi-VN')} đ
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Navigation Pill Tabs */}
        <div className="classes-drawer-tabs-nav">
          <button
            type="button"
            className={`drawer-tab-btn ${activeTab === 'GENERAL' ? 'active' : ''}`}
            onClick={() => setActiveTab('GENERAL')}
          >
            <BookOpen size={14} />
            <span>Thông Tin Chung</span>
          </button>

          <button
            type="button"
            className={`drawer-tab-btn ${activeTab === 'ROSTER' ? 'active' : ''}`}
            onClick={() => setActiveTab('ROSTER')}
          >
            <Users size={14} />
            <span>Học Viên Trong Lớp</span>
            <span className="drawer-tab-count-badge">{enrollments.length}</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-scroll-body">
          {errorMsg && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'GENERAL' ? (
            <>
              {/* Capacity Card (Clean header without redundant capacity badge) */}
              <div className="drawer-section-card">
                <div className="drawer-section-header">
                  <h4 className="drawer-section-title">
                    <Users size={15} style={{ color: '#2563eb' }} />
                    <span>Sĩ Số Lớp Học</span>
                  </h4>
                </div>

                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      marginBottom: '6px',
                      color: '#475569',
                    }}
                  >
                    <span>
                      Đã ghi danh:{' '}
                      <strong style={{ color: '#0f172a' }}>{classItem.currentEnrolled}</strong> /{' '}
                      {classItem.maxCapacity} học viên
                    </span>
                    <strong
                      style={{
                        color: isEnded
                          ? '#64748b'
                          : isClassFull
                          ? '#dc2626'
                          : isNearFull
                          ? '#d97706'
                          : '#16a34a',
                      }}
                    >
                      {occupancyPercent}%
                    </strong>
                  </div>

                  <div className="capacity-track" style={{ height: '8px' }}>
                    <div
                      className={`capacity-fill ${
                        isEnded
                          ? ''
                          : isClassFull
                          ? 'tone-danger bg-red-500'
                          : isNearFull
                          ? 'tone-warning bg-orange-500'
                          : 'tone-success bg-green-500'
                      }`}
                      style={{
                        width: `${occupancyPercent}%`,
                        ...(isEnded ? { backgroundColor: '#94a3b8' } : {}),
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* General Info View or Edit Form */}
              <div className="drawer-section-card">
                <div className="drawer-section-header">
                  <h4 className="drawer-section-title">
                    <Calendar size={15} style={{ color: '#2563eb' }} />
                    <span>{isEditing ? 'Chỉnh Sửa Thông Tin Lớp Học' : 'Thông Tin Vận Hành'}</span>
                  </h4>
                </div>

                {!isEditing ? (
                  <div className="drawer-prop-grid">
                    <div className="drawer-prop-item">
                      <span className="drawer-prop-label">Giảng Viên Phụ Trách</span>
                      <span className="drawer-prop-value">
                        <User size={14} style={{ color: '#64748b' }} />
                        <span>{formatTeacherName(classItem.teacherName)}</span>
                      </span>
                    </div>

                    <div className="drawer-prop-item">
                      <span className="drawer-prop-label">Phòng Học</span>
                      <span className="drawer-prop-value">
                        <MapPin size={14} style={{ color: '#64748b' }} />
                        <span>{classItem.room || 'Chưa xếp phòng'}</span>
                      </span>
                    </div>

                    <div className="drawer-prop-item">
                      <span className="drawer-prop-label">Ngày Học Trong Tuần</span>
                      <span className="drawer-prop-value highlight">
                        <Calendar size={14} />
                        <span>{getScheduleText(classItem.scheduleDays)}</span>
                      </span>
                    </div>

                    <div className="drawer-prop-item">
                      <span className="drawer-prop-label">Ca Học / Khung Giờ</span>
                      <span className="drawer-prop-value">
                        <Clock size={14} style={{ color: '#64748b' }} />
                        <span>{classItem.timeSlot}</span>
                      </span>
                    </div>

                    <div className="drawer-prop-item">
                      <span className="drawer-prop-label">Ngày Khai Giảng</span>
                      <span className="drawer-prop-value">{formatDate(classItem.startDate)}</span>
                    </div>

                    <div className="drawer-prop-item">
                      <span className="drawer-prop-label">Ngày Kết Thúc Dự Kiến</span>
                      <span className="drawer-prop-value">{formatDate(classItem.endDate)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="drawer-edit-grid">
                    <div className="drawer-field-group full-width">
                      <label className="drawer-label">Tên lớp học *</label>
                      <input
                        type="text"
                        className="drawer-input-control"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                      />
                    </div>

                    <div className="drawer-field-group">
                      <label className="drawer-label">Giảng viên phụ trách</label>
                      <select
                        className="drawer-input-control"
                        value={selectedTeacherId}
                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                      >
                        <option value="">-- Chưa phân công GV --</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.fullName} {t.phoneNumber ? `(${t.phoneNumber})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="drawer-field-group">
                      <label className="drawer-label">Phòng học</label>
                      <input
                        type="text"
                        className="drawer-input-control"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        placeholder="VD: P.201 hoặc Online Zoom"
                      />
                    </div>

                    <div className="drawer-field-group">
                      <label className="drawer-label">Lịch học trong tuần</label>
                      <select
                        className="drawer-input-control"
                        value={scheduleDays}
                        onChange={(e) => setScheduleDays(e.target.value as ScheduleDays)}
                      >
                        <option value="MON_WED_FRI">Thứ 2 - Thứ 4 - Thứ 6</option>
                        <option value="TUE_THU_SAT">Thứ 3 - Thứ 5 - Thứ 7</option>
                        <option value="WEEKEND">Cuối tuần (T7 - CN)</option>
                      </select>
                    </div>

                    <div className="drawer-field-group">
                      <label className="drawer-label">Khung giờ học *</label>
                      <input
                        type="text"
                        className="drawer-input-control"
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        placeholder="VD: 18:00 - 19:30"
                      />
                    </div>

                    <div className="drawer-field-group">
                      <label className="drawer-label">Ngày khai giảng</label>
                      <input
                        type="date"
                        className="drawer-input-control"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>

                    <div className="drawer-field-group">
                      <label className="drawer-label">
                        Sĩ số tối đa (Tối thiểu {classItem.currentEnrolled})
                      </label>
                      <input
                        type="number"
                        min={Math.max(1, classItem.currentEnrolled)}
                        max={200}
                        className="drawer-input-control"
                        value={maxCapacity}
                        onChange={(e) => setMaxCapacity(Number(e.target.value))}
                      />
                    </div>

                    <div className="drawer-field-group full-width">
                      <label className="drawer-label">Trạng thái vận hành lớp</label>
                      <select
                        className="drawer-input-control"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as ClassStatus)}
                      >
                        <option value="OPEN">Đang mở tuyển sinh (OPEN)</option>
                        <option value="IN_PROGRESS">Đang học (IN_PROGRESS)</option>
                        <option value="FULL">Đã đầy lớp (FULL)</option>
                        <option value="COMPLETED">Đã kết thúc (COMPLETED)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* TAB 2: STUDENT ROSTER */
            <div className="drawer-section-card" style={{ padding: '18px' }}>
              <div className="drawer-section-header" style={{ marginBottom: '6px' }}>
                <h4 className="drawer-section-title">
                  <Users size={15} style={{ color: '#2563eb' }} />
                  <span>Danh Sách Học Viên ({enrollments.length})</span>
                </h4>
              </div>

              {enrollments.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginBottom: '6px',
                  }}
                >
                  <div style={{ position: 'relative', flex: 1, minWidth: '170px' }}>
                    <Search
                      size={13}
                      style={{
                        position: 'absolute',
                        left: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Tìm học viên theo tên, mã HV, SĐT..."
                      value={rosterSearch}
                      onChange={(e) => setRosterSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 26px 6px 28px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    />
                    {rosterSearch && (
                      <button
                        type="button"
                        onClick={() => setRosterSearch('')}
                        style={{
                          position: 'absolute',
                          right: '6px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <select
                    value={rosterStatusFilter}
                    onChange={(e) => setRosterStatusFilter(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#334155',
                      background: '#ffffff',
                      outline: 'none',
                    }}
                  >
                    <option value="ALL">Mọi trạng thái ({enrollments.length})</option>
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
                <div style={{ padding: '32px 0', textAlign: 'center', color: '#64748b' }}>
                  Đang tải danh sách học viên...
                </div>
              ) : enrollments.length === 0 ? (
                <div
                  style={{
                    padding: '36px 16px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px dashed #cbd5e1',
                  }}
                >
                  <Users size={28} style={{ color: '#94a3b8', margin: '0 auto 8px auto' }} />
                  <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: '#475569' }}>
                    Lớp học này chưa có học viên ghi danh
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    Sử dụng nút "Ghi Danh Học Viên" ở thanh dưới cùng để thêm học viên vào lớp.
                  </p>
                </div>
              ) : filteredRoster.length === 0 ? (
                <div
                  style={{
                    padding: '28px 16px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px dashed #cbd5e1',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                    Không tìm thấy học viên phù hợp với bộ lọc.
                  </p>
                </div>
              ) : (
                <div className="roster-table-container">
                  <table className="roster-table">
                    <thead>
                      <tr>
                        <th>Học Viên</th>
                        <th>Liên Hệ</th>
                        <th>Trạng Thái Học</th>
                        {canViewTuition && <th style={{ textAlign: 'center' }}>Học Phí</th>}
                        {hasRosterActions && <th style={{ textAlign: 'right' }}>Thao Tác</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRoster.map((en, idx) => {
                        const stMeta =
                          ENROLLMENT_STATUS_META[en.status] || ENROLLMENT_STATUS_META.ENROLLED;
                        return (
                          <tr key={en.id}>
                            <td>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{en.fullName}</div>
                              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                {en.studentCode ? `${en.studentCode} • ` : ''}
                                {formatDate(en.enrollmentDate)}
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

                            {/* Trạng thái đào tạo */}
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

                            {/* Học Phí - Single-Line Notion Pill with Hover Popover */}
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

                                  {/* Hover Popover Breakdown (opens downward on first row to prevent clipping) */}
                                  <div
                                    className={`notion-finance-popover ${
                                      idx === 0 ? 'popover-bottom' : ''
                                    }`}
                                  >
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

                            {/* Thao Tác - 28px Icon Buttons with Tooltip */}
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

        {/* Drawer Sticky Footer (Single authoritative action bar) */}
        <div
          className="classes-drawer-footer"
          style={{ gap: '10px', justifyContent: 'space-between' }}
        >
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
                {activeTab === 'GENERAL' && canEditClass && (
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
