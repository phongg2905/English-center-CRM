import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, BookOpen, AlertCircle, Save } from 'lucide-react';
import { AcademicService } from '../../services/academic.service';
import type { CourseItem, CreateCoursePayload } from '../../types/academic';
import { Button } from '../../components/ui';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingCourse?: CourseItem | null;
}

const QUICK_TUITIONS = [
  { label: '4.5 Triệu', value: 4500000 },
  { label: '6.5 Triệu', value: 6500000 },
  { label: '9.8 Triệu', value: 9800000 },
  { label: '12.5 Triệu', value: 12500000 },
];

const QUICK_LESSONS = [24, 30, 36, 40];

const QUICK_TARGETS = [
  'IELTS 5.5+',
  'IELTS 6.5+',
  'IELTS 7.0+',
  'TOEIC 650+',
  'Giao tiếp B1-B2',
];

export const CreateCourseModal: React.FC<CreateCourseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingCourse,
}) => {
  const isEdit = Boolean(editingCourse);

  const [courseCode, setCourseCode] = useState<string>('');
  const [courseName, setCourseName] = useState<string>('');
  const [standardTuition, setStandardTuition] = useState<number>(6500000);
  const [totalLessons, setTotalLessons] = useState<number>(24);
  const [targetOutput, setTargetOutput] = useState<string>('');
  const [minEntryScore, setMinEntryScore] = useState<string>('0');
  const [maxEntryScore, setMaxEntryScore] = useState<string>('9.0');
  const [description, setDescription] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingCourse) {
        setCourseCode(editingCourse.courseCode || '');
        setCourseName(editingCourse.courseName || '');
        setStandardTuition(Number(editingCourse.standardTuition) || 0);
        setTotalLessons(Number(editingCourse.totalLessons) || 24);
        setTargetOutput(editingCourse.targetOutput || '');
        setMinEntryScore(
          editingCourse.minEntryScore !== null && editingCourse.minEntryScore !== undefined
            ? String(editingCourse.minEntryScore)
            : '0'
        );
        setMaxEntryScore(
          editingCourse.maxEntryScore !== null && editingCourse.maxEntryScore !== undefined
            ? String(editingCourse.maxEntryScore)
            : '9.0'
        );
        setDescription(editingCourse.description || '');
        setIsActive(editingCourse.isActive !== false);
      } else {
        setCourseCode('');
        setCourseName('');
        setStandardTuition(6500000);
        setTotalLessons(24);
        setTargetOutput('');
        setMinEntryScore('0');
        setMaxEntryScore('9.0');
        setDescription('');
        setIsActive(true);
      }
      setErrorMsg(null);
    }
  }, [isOpen, editingCourse]);

  // Auto generate courseCode when courseName changes if code hasn't been manually typed (create mode only)
  const handleNameChange = (name: string) => {
    setCourseName(name);
    if (!isEdit && (!courseCode || courseCode.startsWith('CRS-') || courseCode.includes('-'))) {
      const slug = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .split(/\s+/)
        .slice(0, 3)
        .map((w) => w.toUpperCase())
        .join('-');
      if (slug) {
        setCourseCode(slug);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!courseName.trim()) {
      setErrorMsg('Vui lòng nhập tên khóa học.');
      return;
    }

    if (!courseCode.trim()) {
      setErrorMsg('Vui lòng nhập mã khóa học.');
      return;
    }

    if (totalLessons <= 0) {
      setErrorMsg('Tổng số buổi học phải lớn hơn 0.');
      return;
    }

    if (standardTuition < 0) {
      setErrorMsg('Học phí không được là số âm.');
      return;
    }

    const minScoreNum = minEntryScore.trim() !== '' ? Number(minEntryScore) : null;
    const maxScoreNum = maxEntryScore.trim() !== '' ? Number(maxEntryScore) : null;

    if (minScoreNum !== null && (isNaN(minScoreNum) || minScoreNum < 0 || minScoreNum > 9.0)) {
      setErrorMsg('Điểm đầu vào tối thiểu phải từ 0.0 đến 9.0.');
      return;
    }

    if (maxScoreNum !== null && (isNaN(maxScoreNum) || maxScoreNum < 0 || maxScoreNum > 9.0)) {
      setErrorMsg('Điểm đầu vào tối đa phải từ 0.0 đến 9.0.');
      return;
    }

    if (minScoreNum !== null && maxScoreNum !== null && minScoreNum > maxScoreNum) {
      setErrorMsg('Điểm đầu vào tối thiểu không được lớn hơn điểm đầu vào tối đa.');
      return;
    }

    try {
      setIsLoading(true);
      const payload: CreateCoursePayload = {
        courseCode: courseCode.trim().toUpperCase(),
        courseName: courseName.trim(),
        standardTuition: Number(standardTuition),
        totalLessons: Number(totalLessons),
        targetOutput: targetOutput.trim() || null,
        minEntryScore: minScoreNum,
        maxEntryScore: maxScoreNum,
        description: description.trim() || null,
        isActive,
      };

      if (isEdit && editingCourse) {
        await AcademicService.updateCourse(editingCourse.id, payload);
      } else {
        await AcademicService.createCourse(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Lỗi lưu khóa học:', err);
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          (isEdit ? 'Không thể cập nhật khóa học.' : 'Không thể tạo khóa học mới.')
      );
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
            <div className="modal-header-icon-box" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                {isEdit ? 'Chỉnh Sửa Khóa Học Đào Tạo' : 'Tạo Khóa Học Đào Tạo Mới'}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                Thiết lập chương trình đào tạo, học phí niêm yết và chuẩn cam kết đầu ra
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
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="create-class-form-body">
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: '#fef2f2',
                borderRadius: '10px',
                border: '1px solid #fecaca',
                color: '#dc2626',
                fontSize: '13px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="create-class-grid-two-cols">
            {/* Cột 1: Thông tin cơ bản & Học phí */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="drawer-field-group">
                <label className="drawer-label">Tên Khóa Học Đào Tạo *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: IELTS Bứt phá (Target 6.5)"
                  value={courseName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="drawer-input-control"
                  required
                />
              </div>

              <div className="drawer-field-group">
                <label className="drawer-label">Mã Khóa Học (Course Code) *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: IELTS-FIGHT"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                  className="drawer-input-control"
                  required
                />
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Mã định danh duy nhất của khóa học trong hệ thống
                </span>
              </div>

              <div className="drawer-field-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="drawer-label" style={{ marginBottom: 0 }}>Học Phí Tiêu Chuẩn (VNĐ) *</label>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a' }}>
                    {Number(standardTuition || 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <input
                  type="number"
                  step="500000"
                  min="0"
                  placeholder="6500000"
                  value={standardTuition}
                  onChange={(e) => setStandardTuition(Number(e.target.value))}
                  className="drawer-input-control"
                  required
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {QUICK_TUITIONS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setStandardTuition(item.value)}
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: standardTuition === item.value ? '1px solid #16a34a' : '1px solid #e2e8f0',
                        background: standardTuition === item.value ? '#f0fdf4' : '#f8fafc',
                        color: standardTuition === item.value ? '#16a34a' : '#475569',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="drawer-field-group">
                <label className="drawer-label">Tổng Số Buổi Học *</label>
                <input
                  type="number"
                  min="1"
                  placeholder="24"
                  value={totalLessons}
                  onChange={(e) => setTotalLessons(Number(e.target.value))}
                  className="drawer-input-control"
                  required
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {QUICK_LESSONS.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTotalLessons(num)}
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: totalLessons === num ? '1px solid #16a34a' : '1px solid #e2e8f0',
                        background: totalLessons === num ? '#f0fdf4' : '#f8fafc',
                        color: totalLessons === num ? '#16a34a' : '#475569',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {num} buổi
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cột 2: Chuẩn đầu ra, Thang điểm & Mô tả */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="drawer-field-group">
                <label className="drawer-label">Chuẩn Cam Kết Đầu Ra (Target Output)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: IELTS 6.0 - 6.5, TOEIC 650+"
                  value={targetOutput}
                  onChange={(e) => setTargetOutput(e.target.value)}
                  className="drawer-input-control"
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {QUICK_TARGETS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTargetOutput(t)}
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: targetOutput === t ? '1px solid #16a34a' : '1px solid #e2e8f0',
                        background: targetOutput === t ? '#f0fdf4' : '#f8fafc',
                        color: targetOutput === t ? '#16a34a' : '#475569',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="drawer-field-group">
                  <label className="drawer-label">Điểm Vào Tối Thiểu</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="9.0"
                    placeholder="5.0"
                    value={minEntryScore}
                    onChange={(e) => setMinEntryScore(e.target.value)}
                    className="drawer-input-control"
                  />
                </div>
                <div className="drawer-field-group">
                  <label className="drawer-label">Điểm Vào Tối Đa</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="9.0"
                    placeholder="5.5"
                    value={maxEntryScore}
                    onChange={(e) => setMaxEntryScore(e.target.value)}
                    className="drawer-input-control"
                  />
                </div>
              </div>

              <div className="drawer-field-group">
                <label className="drawer-label">Mô Tả Khóa Học & Lộ Trình</label>
                <textarea
                  rows={3}
                  placeholder="Xây dựng nền tảng ngữ pháp, từ vựng học thuật và chiến thuật giải đề..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="drawer-input-control"
                  style={{
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div className="drawer-field-group">
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#0f172a',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ accentColor: '#16a34a', width: '15px', height: '15px' }}
                  />
                  <span>Đang mở tuyển sinh cho khóa học này</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="create-class-modal-footer">
            <Button variant="glass" type="button" onClick={onClose} disabled={isLoading}>
              Hủy Bỏ
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isLoading}
              iconLeft={isEdit ? <Save size={15} /> : undefined}
              style={{
                background: '#16a34a',
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                fontWeight: 600,
              }}
            >
              {isLoading ? 'Đang Lưu...' : isEdit ? 'Lưu Cập Nhật Khóa Học' : 'Tạo Khóa Học Ngay'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
