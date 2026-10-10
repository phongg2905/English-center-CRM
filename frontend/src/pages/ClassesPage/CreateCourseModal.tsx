import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, BookOpen, AlertCircle } from 'lucide-react';
import { AcademicService } from '../../services/academic.service';
import type { CreateCoursePayload } from '../../types/academic';
import { Button } from '../../components/ui';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateCourseModal: React.FC<CreateCourseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [courseCode, setCourseCode] = useState<string>('');
  const [courseName, setCourseName] = useState<string>('');
  const [standardTuition, setStandardTuition] = useState<number>(6500000);
  const [totalLessons, setTotalLessons] = useState<number>(24);
  const [targetOutput, setTargetOutput] = useState<string>('');
  const [minEntryScore, setMinEntryScore] = useState<string>('0');
  const [maxEntryScore, setMaxEntryScore] = useState<string>('9.0');
  const [description, setDescription] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto generate courseCode when courseName changes if code hasn't been manually typed
  const handleNameChange = (name: string) => {
    setCourseName(name);
    if (!courseCode || courseCode.startsWith('CRS-') || courseCode.includes('-')) {
      const slug = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
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
        isActive: true,
      };

      await AcademicService.createCourse(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Lỗi tạo khóa học:', err);
      setErrorMsg(err?.response?.data?.message || err?.message || 'Không thể tạo khóa học mới.');
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
                Tạo Khóa Học Mới
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
                <label className="drawer-label">Học Phí Tiêu Chuẩn (VNĐ) *</label>
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
                  rows={4}
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
              style={{
                background: '#16a34a',
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                fontWeight: 600,
              }}
            >
              {isLoading ? 'Đang Tạo...' : 'Tạo Khóa Học Ngay'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
