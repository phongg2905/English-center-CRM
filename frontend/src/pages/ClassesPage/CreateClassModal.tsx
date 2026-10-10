import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, BookOpen, AlertCircle } from 'lucide-react';
import { AcademicService } from '../../services/academic.service';
import { StaffService } from '../../services/staff.service';
import type { CourseItem, CreateClassPayload, ScheduleDays } from '../../types/academic';
import type { TeacherItem } from '../../types/staff';
import { Button } from '../../components/ui';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialCourseId?: number;
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCourseId,
}) => {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number>(initialCourseId || 1);
  const [classCode, setClassCode] = useState<string>('');
  const [className, setClassName] = useState<string>('');
  const [scheduleDays, setScheduleDays] = useState<ScheduleDays>('MON_WED_FRI');
  const [timeSlot, setTimeSlot] = useState<string>('18:00 - 19:30');
  const [room, setRoom] = useState<string>('Phòng 302 (Cơ sở 1)');
  const [teacherName, setTeacherName] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [maxCapacity, setMaxCapacity] = useState<number>(15);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load courses & teachers when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadMeta = async () => {
      try {
        const [cList, tList] = await Promise.all([
          AcademicService.getCourses(),
          StaffService.getTeachers().catch(() => []),
        ]);
        setCourses(cList);
        setTeachers(tList);

        const defaultCourse = initialCourseId
          ? cList.find((c) => c.id === initialCourseId) || cList[0]
          : cList[0];

        if (defaultCourse) {
          setSelectedCourseId(defaultCourse.id);
          autoSuggestCodeAndName(defaultCourse.id, defaultCourse.courseCode, defaultCourse.courseName);
        }

        if (tList.length > 0) {
          setTeacherName(tList[0].fullName);
        } else {
          setTeacherName('Mr. David Trần (8.0 IELTS)');
        }
      } catch (err: any) {
        console.error('Lỗi tải dữ liệu khóa học/giảng viên:', err);
      }
    };

    loadMeta();
  }, [isOpen, initialCourseId]);

  // Helper auto-suggesting class code and class name
  const autoSuggestCodeAndName = (_courseId: number, code: string, name: string) => {
    const randomSuffix = Math.floor(10 + Math.random() * 89);
    const dayTag = scheduleDays === 'MON_WED_FRI' ? 'T246' : scheduleDays === 'TUE_THU_SAT' ? 'T357' : 'T7CN';
    const suggestedCode = `${code.split('-')[0] || 'CLS'}-K${randomSuffix}-${dayTag}`;
    setClassCode(suggestedCode);
    setClassName(`${name} - K${randomSuffix}`);
  };

  const handleCourseChange = (newCourseId: number) => {
    setSelectedCourseId(newCourseId);
    const found = courses.find((c) => c.id === newCourseId);
    if (found) {
      autoSuggestCodeAndName(newCourseId, found.courseCode, found.courseName);
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
        classCode: classCode.trim(),
        className: className.trim(),
        scheduleDays,
        timeSlot: timeSlot.trim(),
        room: room.trim() || null,
        teacherName: teacherName.trim() || null,
        startDate,
        maxCapacity: Number(maxCapacity),
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
                Phân bổ phòng học, giảng viên phụ trách và thiết lập sĩ số ban đầu
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

        {/* Form Body - 2 Columns (Pinterest Style) */}
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
                  <label className="drawer-label">Mã Lớp Học (Class Code) *</label>
                  <input
                    type="text"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
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

                <div className="drawer-field-group">
                  <label className="drawer-label">Sĩ Số Tối Đa (Max Capacity) *</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(Number(e.target.value))}
                      className="drawer-input-control"
                      style={{ maxWidth: '120px', fontWeight: 700 }}
                      required
                    />
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      học viên (Hệ thống sẽ tự khóa khi đủ)
                    </span>
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: PHÂN BỔ GIẢNG VIÊN, LỊCH & PHÒNG HỌC */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="drawer-field-group">
                  <label className="drawer-label">Giảng Viên Phụ Trách</label>
                  {teachers.length > 0 ? (
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
                    onChange={(e) => setScheduleDays(e.target.value as ScheduleDays)}
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
                </div>

                <div className="drawer-field-group">
                  <label className="drawer-label">Phòng Học / Cơ Sở</label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="VD: Phòng 302 (Cơ sở Tân Bình)"
                    className="drawer-input-control"
                  />
                </div>

                <div className="drawer-field-group">
                  <label className="drawer-label">Ngày Khai Giảng *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="drawer-input-control"
                    required
                  />
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
