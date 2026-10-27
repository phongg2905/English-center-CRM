import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { AcademicService } from '../../services/academic.service';
import { StaffService } from '../../services/staff.service';
import { SettingsService } from '../../services/settings.service';
import type { CourseItem, CreateClassPayload, ScheduleDays, ClassStatus } from '../../types/academic';
import type { TeacherItem } from '../../types/staff';
import { Button } from '../../components/ui';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialCourseId?: number;
}

const QUICK_TIME_SLOTS = [
  '08:30 - 10:00',
  '14:00 - 15:30',
  '18:00 - 19:30',
  '19:45 - 21:15',
];

const QUICK_ROOMS = [
  'Room 101 - Tầng 1',
  'Room 102 - Tầng 1',
  'Room 201 - Tầng 2',
  'Room VIP 301 - Tầng 3',
];

export const CreateClassModal: React.FC<CreateClassModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCourseId,
}) => {
  const [courses, setCourses] = useState<CourseItem[]>(() => AcademicService.peekCourses() || []);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number>(initialCourseId || 1);
  const [classCode, setClassCode] = useState<string>('');
  const [className, setClassName] = useState<string>('');
  const [scheduleDays, setScheduleDays] = useState<ScheduleDays>('MON_WED_FRI');
  const [timeSlot, setTimeSlot] = useState<string>('18:00 - 19:30');
  const [room, setRoom] = useState<string>('Room 101 - Tầng 1');
  const [teacherName, setTeacherName] = useState<string>('');
  const [customTeacherMode, setCustomTeacherMode] = useState<boolean>(false);
  const [initialStatus, setInitialStatus] = useState<ClassStatus>('OPEN');
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [maxCapacity, setMaxCapacity] = useState<number>(20);
  const [systemMaxCapacity, setSystemMaxCapacity] = useState<number>(20);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getDayTag = (days: ScheduleDays) =>
    days === 'MON_WED_FRI' ? 'T246' : days === 'TUE_THU_SAT' ? 'T357' : 'T7CN';

  // Helper auto-suggesting class code and class name
  const autoSuggestCodeAndName = (code: string, name: string, days: ScheduleDays = scheduleDays) => {
    const randomSuffix = Math.floor(10 + Math.random() * 89);
    const dayTag = getDayTag(days);
    const suggestedCode = `${code.split('-')[0] || 'CLS'}-K${randomSuffix}-${dayTag}`;
    setClassCode(suggestedCode);
    setClassName(`${name} - K${randomSuffix}`);
  };

  // Load courses & teachers when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setInitialStatus('OPEN');
    setCustomTeacherMode(false);

    const loadMeta = async () => {
      try {
        const [cList, tList, sysSettings] = await Promise.all([
          AcademicService.getCourses(),
          StaffService.getTeachers().catch(() => []),
          SettingsService.getSettings().catch(() => null),
        ]);
        setCourses(cList);
        setTeachers(tList);

        if (sysSettings?.maxClassCapacity) {
          setMaxCapacity(sysSettings.maxClassCapacity);
          setSystemMaxCapacity(sysSettings.maxClassCapacity);
        }

        const defaultCourse = initialCourseId
          ? cList.find((c) => c.id === initialCourseId) || cList[0]
          : cList[0];

        if (defaultCourse) {
          setSelectedCourseId(defaultCourse.id);
          autoSuggestCodeAndName(defaultCourse.courseCode, defaultCourse.courseName, 'MON_WED_FRI');
        }

        if (tList.length > 0) {
          setTeacherName(tList[0].fullName);
        } else {
          setTeacherName('Mr. David Trần');
        }
      } catch (err: any) {
        console.error('Lỗi tải dữ liệu khóa học/giảng viên:', err);
      }
    };

    loadMeta();
  }, [isOpen, initialCourseId]);

  const handleCourseChange = (newCourseId: number) => {
    setSelectedCourseId(newCourseId);
    const found = courses.find((c) => c.id === newCourseId);
    if (found) {
      autoSuggestCodeAndName(found.courseCode, found.courseName, scheduleDays);
    }
  };

  const handleScheduleDaysChange = (newDays: ScheduleDays) => {
    setScheduleDays(newDays);
    const newTag = getDayTag(newDays);
    if (classCode.match(/-(T246|T357|T7CN)$/)) {
      setClassCode(classCode.replace(/-(T246|T357|T7CN)$/, `-${newTag}`));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!classCode.trim()) {
      setErrorMsg('Vui lòng nhập mã lớp học');
      return;
    }
    if (!className.trim()) {
      setErrorMsg('Vui lòng nhập tên lớp học');
      return;
    }
    if (!startDate) {
      setErrorMsg('Vui lòng chọn ngày khai giảng');
      return;
    }
    if (maxCapacity <= 0) {
      setErrorMsg('Sĩ số tối đa phải lớn hơn 0');
      return;
    }

    try {
      setIsLoading(true);
      const payload: CreateClassPayload = {
        courseId: selectedCourseId,
        classCode: classCode.trim().toUpperCase(),
        className: className.trim(),
        scheduleDays,
        timeSlot: timeSlot.trim(),
        room: room.trim() || null,
        teacherName: teacherName.trim() || null,
        startDate,
        maxCapacity: Number(maxCapacity),
        status: initialStatus,
      };

      await AcademicService.createClass(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err.message || 'Lỗi khi tạo mới lớp học');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentCourse = courses.find((c) => c.id === selectedCourseId);

  return createPortal(
    <div className="create-class-modal-overlay" onClick={onClose}>
      <div className="create-class-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="create-class-modal-header">
          <div className="modal-title-wrap">
            <div className="modal-header-icon-box">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Mở Lớp Học Mới
              </h3>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                Phân bổ phòng học, giảng viên phụ trách, trạng thái và thiết lập sĩ số ban đầu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div
            style={{
              margin: '16px 24px 0 24px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              color: '#dc2626',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body - 2 Columns */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="create-class-form-body">
            <div className="create-class-grid-two-cols">
              {/* CỘT TRÁI: KHÓA HỌC & THÔNG TIN LỚP */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="drawer-field-group">
                  <label className="drawer-label">Khóa Học Đào Tạo *</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => handleCourseChange(Number(e.target.value))}
                    className="drawer-input-control"
                    style={{ fontWeight: 600 }}
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.courseName} ({Number(c.standardTuition).toLocaleString('vi-VN')} đ)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="drawer-field-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="drawer-label" style={{ marginBottom: 0 }}>Mã Lớp Học (Class Code) *</label>
                    {currentCourse && (
                      <button
                        type="button"
                        onClick={() => autoSuggestCodeAndName(currentCourse.courseCode, currentCourse.courseName, scheduleDays)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#2563eb',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Sparkles size={12} /> Gợi ý mã mới
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    placeholder="VD: IELTS-K28-T246"
                    className="drawer-input-control"
                    required
                  />
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Mã duy nhất để phân biệt lớp và xuất bảng điểm danh.
                  </span>
                </div>

                <div className="drawer-field-group">
                  <label className="drawer-label">Tên Hiển Thị Lớp Học *</label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="VD: IELTS Bứt phá K28 (Tối 2-4-6)"
                    className="drawer-input-control"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="drawer-field-group">
                    <label className="drawer-label">Trạng Thái Mở Lớp *</label>
                    <select
                      value={initialStatus}
                      onChange={(e) => setInitialStatus(e.target.value as ClassStatus)}
                      className="drawer-input-control"
                      style={{ fontWeight: 600 }}
                    >
                      <option value="OPEN">🟢 Đang mở tuyển sinh</option>
                      <option value="PLANNING">🟣 Đang lên kế hoạch</option>
                      <option value="IN_PROGRESS">🔵 Đang học (Đã khai giảng)</option>
                    </select>
                  </div>

                  <div className="drawer-field-group">
                    <label className="drawer-label">Sĩ Số Tối Đa *</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={maxCapacity}
                        onChange={(e) => setMaxCapacity(Number(e.target.value))}
                        className="drawer-input-control"
                        style={{ fontWeight: 700 }}
                        required
                      />
                      <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>HV</span>
                    </div>
                  </div>
                </div>

                {maxCapacity > systemMaxCapacity && (
                  <span style={{ fontSize: '11.5px', color: '#b45309', display: 'block', fontWeight: 600 }}>
                    ⚠️ Lưu ý: Sức chứa này vượt quá giới hạn khuyến nghị ({systemMaxCapacity} học viên).
                  </span>
                )}

                <div className="drawer-field-group">
                  <label className="drawer-label">Ngày Khai Giảng Dự Kiến *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="drawer-input-control"
                    required
                  />
                </div>
              </div>

              {/* CỘT PHẢI: PHÂN BỔ GIẢNG VIÊN, LỊCH & PHÒNG HỌC */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="drawer-field-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="drawer-label" style={{ marginBottom: 0 }}>Giảng Viên Phụ Trách</label>
                    {teachers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCustomTeacherMode((prev) => !prev)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#2563eb',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {customTeacherMode ? 'Chọn từ danh sách GV' : '+ Nhập tên GV khác'}
                      </button>
                    )}
                  </div>
                  {teachers.length > 0 && !customTeacherMode ? (
                    <select
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      className="drawer-input-control"
                      style={{ fontWeight: 600 }}
                    >
                      {teachers.map((t) => (
                        <option key={t.id} value={t.fullName}>
                          {t.fullName} {t.specialization ? `(${t.specialization})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      placeholder="VD: Ms. Sarah Lê (8.0 IELTS)"
                      className="drawer-input-control"
                    />
                  )}
                </div>

                <div className="drawer-field-group">
                  <label className="drawer-label">Lịch Học Trong Tuần *</label>
                  <select
                    value={scheduleDays}
                    onChange={(e) => handleScheduleDaysChange(e.target.value as ScheduleDays)}
                    className="drawer-input-control"
                    style={{ fontWeight: 600 }}
                  >
                    <option value="MON_WED_FRI">📅 Thứ 2 - Thứ 4 - Thứ 6</option>
                    <option value="TUE_THU_SAT">📅 Thứ 3 - Thứ 5 - Thứ 7</option>
                    <option value="WEEKEND">📅 Cuối tuần (Thứ 7 & Chủ Nhật)</option>
                  </select>
                </div>

                <div className="drawer-field-group">
                  <label className="drawer-label">Ca Học (Time Slot) *</label>
                  <input
                    type="text"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    placeholder="VD: 18:00 - 19:30 hoặc 19:45 - 21:15"
                    className="drawer-input-control"
                    required
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {QUICK_TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTimeSlot(slot)}
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: timeSlot === slot ? '1px solid #2563eb' : '1px solid #e2e8f0',
                          background: timeSlot === slot ? '#eff6ff' : '#f8fafc',
                          color: timeSlot === slot ? '#2563eb' : '#475569',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="drawer-field-group">
                  <label className="drawer-label">Phòng Học / Cơ Sở</label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="VD: Room 101 - Tầng 1"
                    className="drawer-input-control"
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {QUICK_ROOMS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRoom(r)}
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: room === r ? '1px solid #2563eb' : '1px solid #e2e8f0',
                          background: room === r ? '#eff6ff' : '#f8fafc',
                          color: room === r ? '#2563eb' : '#475569',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="create-class-modal-footer">
            <Button variant="glass" type="button" onClick={onClose} disabled={isLoading}>
              Hủy Bỏ
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isLoading}
              style={{
                background: '#2563eb',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                fontWeight: 600,
              }}
            >
              {isLoading ? 'Đang tạo lớp...' : 'Tạo Lớp Học Ngay'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
