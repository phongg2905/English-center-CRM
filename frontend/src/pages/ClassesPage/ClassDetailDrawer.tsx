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

interface ClassDetailDrawerProps {
  classItem: ClassItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onEnrollClick?: (classId: number) => void;
}

export const ClassDetailDrawer: React.FC<ClassDetailDrawerProps> = ({
  classItem,
  isOpen,
  onClose,
  onUpdated,
  onEnrollClick,
}) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'ROSTER'>('GENERAL');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [enrollments, setEnrollments] = useState<ClassEnrollmentItem[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Editable Form States
  const [editClassName, setEditClassName] = useState<string>('');
  const [editTeacherName, setEditTeacherName] = useState<string>('');
  const [editScheduleDays, setEditScheduleDays] = useState<ScheduleDays>('MON_WED_FRI');
  const [editTimeSlot, setEditTimeSlot] = useState<string>('');
  const [editRoom, setEditRoom] = useState<string>('');
  const [editStartDate, setEditStartDate] = useState<string>('');
  const [editMaxCapacity, setEditMaxCapacity] = useState<number>(15);
  const [editStatus, setEditStatus] = useState<ClassStatus>('OPEN');

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

    loadRoster(classItem.id);
  }, [classItem]);

  const loadRoster = async (classId: number) => {
    try {
      setIsLoadingRoster(true);
      const data = await AcademicService.getClassEnrollments(classId);
      setEnrollments(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách học viên trong lớp:', err);
    } finally {
      setIsLoadingRoster(false);
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
    if (!dateStr || dateStr === 'Chưa cập nhật' || dateStr === 'null' || dateStr === 'undefined') return 'Chưa cập nhật';
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

  const currentFillPercent = Math.min(
    100,
    Math.round((classItem.currentEnrolled / classItem.maxCapacity) * 100)
  );

  const handleExportRosterCSV = () => {
    if (enrollments.length === 0) {
      alert('Lớp học chưa có học viên nào để xuất dữ liệu.');
      return;
    }
    const headers = ['Mã Học Viên', 'Họ và Tên', 'Số Điện Thoại', 'Ngày Ghi Danh', 'Trạng Thái Học Phí', 'Đã Nộp (VNĐ)', 'Còn Nợ (VNĐ)'];
    const rows = enrollments.map((e) => [
      e.studentCode,
      `"${e.fullName}"`,
      e.phoneNumber,
      e.enrollmentDate,
      e.paymentStatus,
      e.paidAmount,
      e.balanceDue,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Roster_${classItem.className.replace(/\s+/g, '_')}.csv`);
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
            <div>
              {classItem.isFull || classItem.currentEnrolled >= classItem.maxCapacity ? (
                <span className="class-status-badge full">
                  <Lock size={12} /> ĐÃ ĐẦY LỚP
                </span>
              ) : (
                <span className={`class-status-badge ${classItem.status.toLowerCase().replace('_', '-')}`}>
                  ● {classItem.status === 'OPEN' ? 'Đang tuyển sinh' : classItem.status === 'IN_PROGRESS' ? 'Đang học' : classItem.status === 'COMPLETED' ? 'Đã kết thúc' : classItem.status}
                </span>
              )}
            </div>

            <div className="drawer-header-actions">
              {onEnrollClick && (
                <Button
                  variant="primary"
                  size="sm"
                  iconLeft={<UserPlus size={13} />}
                  onClick={() => onEnrollClick(classItem.id)}
                  style={{
                    background: '#2563eb',
                    fontWeight: 600,
                    borderRadius: '8px',
                    height: '32px',
                    fontSize: '12.5px',
                  }}
                >
                  Ghi Danh
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
              <span className="drawer-tuition">{Number(classItem.standardTuition).toLocaleString('vi-VN')} đ</span>
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
              loadRoster(classItem.id);
            }}
          >
            <Users size={15} />
            <span>Học viên</span>
            <span className="drawer-tab-count-badge">
              {classItem.currentEnrolled}
            </span>
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
                      Hiện có: <strong>{classItem.currentEnrolled}</strong> / {classItem.maxCapacity} học viên
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
                    <Button
                      variant="glass"
                      size="sm"
                      iconLeft={<Edit2 size={13} />}
                      onClick={() => setIsEditing(true)}
                    >
                      Chỉnh Sửa
                    </Button>
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
                      <span className="drawer-prop-value">
                        {formatDate(classItem.startDate)}
                      </span>
                    </div>

                    <div className="drawer-prop-item">
                      <span className="drawer-prop-label">Khóa Học</span>
                      <span className="drawer-prop-value highlight">
                        {classItem.courseName}
                      </span>
                    </div>

                    <div className="drawer-prop-item">
                      <span className="drawer-prop-label">Học Phí Niêm Yết</span>
                      <span className="drawer-prop-value price">
                        {Number(classItem.standardTuition).toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>

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
                      <label className="drawer-label">Giảng Viên Phụ Trách</label>
                      <input
                        type="text"
                        value={editTeacherName}
                        onChange={(e) => setEditTeacherName(e.target.value)}
                        className="drawer-input-control"
                        placeholder="VD: Ms. Emily Nguyễn (8.5 IELTS)"
                      />
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
                        <option value="OPEN">🟢 Đang mở tuyển sinh</option>
                        <option value="IN_PROGRESS">🔵 Đang học</option>
                        <option value="COMPLETED">🟣 Đã kết thúc</option>
                        <option value="FULL">🔴 Khóa sổ sĩ số (Đầy)</option>
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
                  <span>Danh Sách Học Viên ({enrollments.length})</span>
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
                <div style={{ padding: '36px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px' }}>
                  <Users size={32} style={{ color: '#94a3b8', margin: '0 auto 8px auto' }} />
                  <p style={{ fontWeight: 600, color: '#334155', margin: '0 0 4px 0' }}>
                    Chưa có học viên nào trong lớp
                  </p>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 14px 0' }}>
                    Lớp hiện đang mở tuyển sinh. Bạn có thể ghi danh học viên mới ngay.
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
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="roster-table">
                    <thead>
                      <tr>
                        <th>Học Viên</th>
                        <th>Liên Hệ</th>
                        <th>Ngày Nhập Học</th>
                        <th>Học Phí</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((en) => (
                        <tr key={en.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{en.fullName}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={11} style={{ color: '#2563eb' }} />
                              <span style={{ fontSize: '12px', fontWeight: 500 }}>{en.phoneNumber}</span>
                            </div>
                            {en.email && (
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{en.email}</div>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', color: '#475569' }}>{formatDate(en.enrollmentDate)}</span>
                          </td>
                          <td>
                            <span className={`payment-pill ${en.paymentStatus.toLowerCase()}`}>
                              {en.paymentStatus === 'FULLY_PAID'
                                ? 'Đã nộp đủ'
                                : en.paymentStatus === 'PARTIAL'
                                ? 'Đóng cọc'
                                : 'Chưa đóng'}
                            </span>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                              {Number(en.paidAmount).toLocaleString('vi-VN')} đ
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
                <Button
                  variant="primary"
                  onClick={() => setIsEditing(true)}
                  iconLeft={<Edit2 size={14} />}
                  style={{
                    background: '#2563eb',
                    fontWeight: 600,
                  }}
                >
                  Chỉnh Sửa
                </Button>
              </>
            )
          ) : (
            <>
              <Button variant="glass" onClick={onClose}>
                Đóng
              </Button>
              {onEnrollClick && (
                <Button
                  variant="primary"
                  onClick={() => onEnrollClick(classItem.id)}
                  iconLeft={<UserPlus size={14} />}
                  style={{
                    background: '#2563eb',
                    fontWeight: 600,
                  }}
                >
                  Ghi Danh Học Viên
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
