import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Award,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  Sparkles,
  Printer,
  Save,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Clock,
  MapPin,
  UserCheck,
} from 'lucide-react';
import { PlacementTestService } from '../../services/placement-test.service';
import { AcademicService, type ClassItem } from '../../services/academic.service';
import { ScorecardPrintModal } from './ScorecardPrintModal';
import type { PlacementTestWithDetails, CourseRecommendation } from '../../types/placement-test';

interface ScoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: PlacementTestWithDetails | null;
  onScoreSaved: () => void;
}

export const ScoringModal: React.FC<ScoringModalProps> = ({
  isOpen,
  onClose,
  test,
  onScoreSaved,
}) => {
  const [listening, setListening] = useState<number>(5.0);
  const [reading, setReading] = useState<number>(5.0);
  const [writing, setWriting] = useState<number>(5.0);
  const [speaking, setSpeaking] = useState<number>(5.0);
  const [feedback, setFeedback] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnrollingClassId, setIsEnrollingClassId] = useState<number | null>(null);
  const [recommendation, setRecommendation] = useState<CourseRecommendation | null>(null);
  const [openClasses, setOpenClasses] = useState<ClassItem[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Khởi tạo điểm từ test đã có sẵn
  useEffect(() => {
    if (test) {
      setListening(test.listeningScore ?? 5.0);
      setReading(test.readingScore ?? 5.0);
      setWriting(test.writingScore ?? 5.0);
      setSpeaking(test.speakingScore ?? 5.0);
      setFeedback(test.examinerFeedback || '');
      setStatusMsg(null);
    }
  }, [test]);

  // Khóa cuộn trang khi modal mở
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !showPrintModal) {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, showPrintModal, onClose]);

  // Thuật toán tính Overall Band IELTS chuẩn quốc tế
  const overallBand = useMemo(() => {
    const raw = (listening + reading + writing + speaking) / 4;
    const decimal = raw - Math.floor(raw);
    if (decimal < 0.25) return Math.floor(raw);
    if (decimal < 0.75) return Math.floor(raw) + 0.5;
    return Math.floor(raw) + 1.0;
  }, [listening, reading, writing, speaking]);

  // Khung năng lực CEFR tương đương
  const cefrInfo = useMemo(() => {
    if (overallBand < 4.0) return { level: 'A2', label: 'Sơ trung cấp', color: '#64748b' };
    if (overallBand <= 5.0) return { level: 'B1', label: 'Trung cấp (Intermediate)', color: '#d97706' };
    if (overallBand <= 6.5) return { level: 'B2', label: 'Trung cao cấp (Upper-Inter)', color: '#2563eb' };
    if (overallBand <= 8.0) return { level: 'C1', label: 'Cao cấp (Advanced)', color: '#7c3aed' };
    return { level: 'C2', label: 'Thành thạo (Proficient)', color: '#059669' };
  }, [overallBand]);

  // Tự động lấy đề xuất khóa học khi Overall thay đổi
  useEffect(() => {
    let isCancelled = false;
    async function fetchRecommendation() {
      if (!isOpen || !test) return;
      try {
        const rec = await PlacementTestService.recommendCourse(
          overallBand,
          test.testType,
          test.leadInterest
        );
        if (!isCancelled) {
          setRecommendation(rec);
          // Tải thêm danh sách lớp học thực tế đang mở của khóa này
          if (rec.course?.id) {
            const classes = await AcademicService.getClasses(rec.course.id);
            setOpenClasses(classes);
          }
        }
      } catch (err) {
        // Fallback im lặng nếu lỗi mạng
      }
    }
    const timer = setTimeout(fetchRecommendation, 200);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, test, overallBand]);

  if (!isOpen || !test) return null;

  // Xử lý Lưu Điểm 4 Kỹ Năng
  const handleSaveScore = async () => {
    try {
      setIsSubmitting(true);
      setStatusMsg(null);

      await PlacementTestService.recordScore(test.id, {
        listeningScore: listening,
        readingScore: reading,
        writingScore: writing,
        speakingScore: speaking,
        overallScore: overallBand,
        examinerFeedback: feedback.trim(),
        suggestedCourseId: recommendation?.course?.id,
      });

      setStatusMsg({ text: `Đã lưu thành công điểm Overall Band ${overallBand}!` });
      onScoreSaved();
    } catch (err: any) {
      setStatusMsg({
        text: err.response?.data?.message || 'Lỗi khi lưu điểm bài thi',
        isError: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Thao tác Một chạm: Xếp học viên vào lớp học ngay
  const handleEnrollIntoClass = async (classItem: ClassItem) => {
    try {
      setIsEnrollingClassId(classItem.id);
      setStatusMsg(null);

      const res = await AcademicService.enrollStudent({
        leadId: test.leadId,
        classId: classItem.id,
        notes: `Xếp lớp từ kết quả thi Placement Test Band ${overallBand}`,
      });

      setStatusMsg({
        text: `🎉 Đã xếp thành công học viên ${res.fullName} (${res.studentCode}) vào lớp ${classItem.classCode}!`,
      });

      // Tải lại danh sách lớp để cập nhật sĩ số
      if (recommendation?.course?.id) {
        const updatedClasses = await AcademicService.getClasses(recommendation.course.id);
        setOpenClasses(updatedClasses);
      }
      onScoreSaved();
    } catch (err: any) {
      setStatusMsg({
        text: err.response?.data?.message || 'Lỗi khi xếp lớp cho học viên',
        isError: true,
      });
    } finally {
      setIsEnrollingClassId(null);
    }
  };

  return createPortal(
    <>
      <div className="pt-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
        <div
          className="pt-modal-dialog pt-scoring-modal"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '980px', width: '95vw', maxHeight: '90vh' }}
        >
          {/* Header */}
          <div className="pt-modal-header" style={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 8px rgba(124, 58, 237, 0.3)',
                }}
              >
                <Award size={20} />
              </div>
              <div>
                <h3 className="pt-modal-title" style={{ fontSize: '17px', margin: 0 }}>
                  Chấm Điểm 4 Kỹ Năng & Đánh Giá Năng Lực Đầu Vào
                </h3>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Thí sinh: <strong>{test.leadFullName}</strong> ({test.leadPhoneNumber}) • Ca thi: {test.testDate} {test.timeSlot}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="pt-btn-touch"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  padding: '7px 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
                onClick={() => setShowPrintModal(true)}
                title="Xem trước và xuất phiếu báo điểm chuẩn PDF"
              >
                <Printer size={15} color="#475569" /> Xuất Phiếu Điểm PDF
              </button>

              <button
                type="button"
                className="pt-modal-close-btn"
                onClick={onClose}
                aria-label="Đóng cửa sổ"
                title="Đóng (ESC)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {statusMsg && (
            <div
              className={`pt-toast-banner ${statusMsg.isError ? 'error' : 'success'}`}
              style={{ margin: '12px 24px 0 24px', padding: '8px 14px', fontSize: '13px' }}
            >
              {statusMsg.isError ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
              {statusMsg.text}
            </div>
          )}

          {/* Modal Body */}
          <div className="pt-modal-body" style={{ padding: '20px 24px', overflowY: 'auto' }}>
            <div className="pt-scoring-layout">
              {/* CỘT TRÁI: Nhập điểm 4 Kỹ Năng & Sliders */}
              <div className="pt-scoring-left">
                <h4 style={{ fontSize: '14.5px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-heading)' }}>
                  Điểm Số Từng Phần (Thang điểm 0.0 - 9.0)
                </h4>

                {/* 1. Listening Slider */}
                <div className="pt-skill-slider-card listening">
                  <div className="pt-slider-meta">
                    <span className="label">
                      <Headphones size={15} color="#2563eb" /> Listening (Nghe)
                    </span>
                    <div className="val-badge">{listening.toFixed(1)}</div>
                  </div>
                  <div className="pt-slider-row">
                    <input
                      type="range"
                      min="0"
                      max="9"
                      step="0.5"
                      value={listening}
                      onChange={(e) => setListening(parseFloat(e.target.value))}
                      className="pt-range-slider listening"
                    />
                    <input
                      type="number"
                      min="0"
                      max="9"
                      step="0.5"
                      value={listening}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(9, parseFloat(e.target.value) || 0));
                        setListening(val);
                      }}
                      className="pt-num-input"
                    />
                  </div>
                </div>

                {/* 2. Reading Slider */}
                <div className="pt-skill-slider-card reading">
                  <div className="pt-slider-meta">
                    <span className="label">
                      <BookOpen size={15} color="#059669" /> Reading (Đọc)
                    </span>
                    <div className="val-badge">{reading.toFixed(1)}</div>
                  </div>
                  <div className="pt-slider-row">
                    <input
                      type="range"
                      min="0"
                      max="9"
                      step="0.5"
                      value={reading}
                      onChange={(e) => setReading(parseFloat(e.target.value))}
                      className="pt-range-slider reading"
                    />
                    <input
                      type="number"
                      min="0"
                      max="9"
                      step="0.5"
                      value={reading}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(9, parseFloat(e.target.value) || 0));
                        setReading(val);
                      }}
                      className="pt-num-input"
                    />
                  </div>
                </div>

                {/* 3. Writing Slider */}
                <div className="pt-skill-slider-card writing">
                  <div className="pt-slider-meta">
                    <span className="label">
                      <PenTool size={15} color="#d97706" /> Writing (Viết)
                    </span>
                    <div className="val-badge">{writing.toFixed(1)}</div>
                  </div>
                  <div className="pt-slider-row">
                    <input
                      type="range"
                      min="0"
                      max="9"
                      step="0.5"
                      value={writing}
                      onChange={(e) => setWriting(parseFloat(e.target.value))}
                      className="pt-range-slider writing"
                    />
                    <input
                      type="number"
                      min="0"
                      max="9"
                      step="0.5"
                      value={writing}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(9, parseFloat(e.target.value) || 0));
                        setWriting(val);
                      }}
                      className="pt-num-input"
                    />
                  </div>
                </div>

                {/* 4. Speaking Slider */}
                <div className="pt-skill-slider-card speaking">
                  <div className="pt-slider-meta">
                    <span className="label">
                      <Mic size={15} color="#e11d48" /> Speaking (Nói)
                    </span>
                    <div className="val-badge">{speaking.toFixed(1)}</div>
                  </div>
                  <div className="pt-slider-row">
                    <input
                      type="range"
                      min="0"
                      max="9"
                      step="0.5"
                      value={speaking}
                      onChange={(e) => setSpeaking(parseFloat(e.target.value))}
                      className="pt-range-slider speaking"
                    />
                    <input
                      type="number"
                      min="0"
                      max="9"
                      step="0.5"
                      value={speaking}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(9, parseFloat(e.target.value) || 0));
                        setSpeaking(val);
                      }}
                      className="pt-num-input"
                    />
                  </div>
                </div>

                {/* Nhận xét của giám khảo */}
                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)', display: 'block', marginBottom: '6px' }}>
                    Nhận xét chuyên môn của Giám khảo / Khảo thí
                  </label>
                  <textarea
                    rows={3}
                    className="pt-form-control"
                    placeholder="Ghi chú điểm mạnh, điểm yếu cần khắc phục của thí sinh..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    style={{ width: '100%', fontSize: '13px', padding: '8px 12px' }}
                  />
                </div>
              </div>

              {/* CỘT PHẢI: Overall Band Hero + Gợi ý Khóa học & Xếp Lớp */}
              <div className="pt-scoring-right">
                {/* Hero Band Card */}
                <div className="pt-overall-hero-card">
                  <div className="hero-top">
                    <span className="title">TỰ ĐỘNG TÍNH TOÁN BAND CHUẨN</span>
                    <span className="badge-cefr" style={{ background: cefrInfo.color }}>
                      CEFR: {cefrInfo.level}
                    </span>
                  </div>
                  <div className="hero-score-row">
                    <div className="hero-band-num">{overallBand.toFixed(1)}</div>
                    <div className="hero-desc">
                      <strong>Band {overallBand.toFixed(1)} IELTS</strong>
                      <span>Đánh giá năng lực: {cefrInfo.label}</span>
                    </div>
                  </div>
                </div>

                {/* Đề xuất Khóa học */}
                <div className="pt-recommend-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Sparkles size={16} color="var(--color-primary-royal)" />
                    <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>
                      Lộ Trình & Khóa Học Phù Hợp Nhất
                    </h5>
                  </div>

                  {recommendation?.course ? (
                    <div className="pt-course-card-compact">
                      <div className="meta">
                        <GraduationCap size={18} color="var(--color-primary-royal)" />
                        <div>
                          <strong className="name">{recommendation.course.courseName}</strong>
                          <span className="code">Mã: {recommendation.course.courseCode} • {recommendation.course.totalLessons} buổi</span>
                        </div>
                      </div>
                      <div className="tuition">
                        {recommendation.course.standardTuition.toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Đang tính toán khóa học tối ưu theo điểm số...
                    </div>
                  )}

                  {/* Lớp học mở đang tuyển sinh */}
                  <h6 style={{ fontSize: '13px', fontWeight: 700, margin: '14px 0 8px 0', color: 'var(--text-heading)' }}>
                    Lớp Học Đang Mở Tuyển Sinh (Xếp Lớp Một Chạm):
                  </h6>

                  {openClasses.length === 0 ? (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                      Hiện chưa có lớp học nào đang mở cho khóa này.
                    </p>
                  ) : (
                    <div className="pt-classes-mini-list">
                      {openClasses.map((cls) => {
                        const isEnrolling = isEnrollingClassId === cls.id;
                        return (
                          <div key={cls.id} className="pt-class-mini-item">
                            <div className="class-info">
                              <strong className="c-name">{cls.className}</strong>
                              <span className="c-meta">
                                <Clock size={11} /> {cls.timeSlot} • {cls.scheduleDays === 'MON_WED_FRI' ? 'T2-4-6' : 'T3-5-7'}
                                {cls.room && <> • <MapPin size={11} /> {cls.room}</>}
                              </span>
                              <div className="capacity-bar">
                                <div
                                  className="fill"
                                  style={{
                                    width: `${Math.min(100, (cls.currentEnrolled / cls.maxCapacity) * 100)}%`,
                                    background: cls.isFull ? '#dc2626' : '#10b981',
                                  }}
                                />
                                <span className="text">
                                  {cls.currentEnrolled}/{cls.maxCapacity} học viên {cls.isFull ? '(ĐÃ ĐẦY)' : `(còn ${cls.availableSeats} chỗ)`}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="pt-btn-enroll-touch"
                              onClick={() => handleEnrollIntoClass(cls)}
                              disabled={cls.isFull || isEnrolling}
                              title={cls.isFull ? 'Lớp đã đầy sĩ số' : 'Xếp học viên vào lớp này ngay'}
                            >
                              <UserCheck size={14} />
                              {isEnrolling ? 'Đang xếp...' : 'Xếp Lớp'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-modal-footer" style={{ padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Band hiện tại: <strong>{overallBand.toFixed(1)}</strong> ({cefrInfo.level})
            </span>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="pt-btn-touch"
                style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '7px 16px', fontSize: '13px' }}
                onClick={onClose}
              >
                Hủy / Đóng
              </button>

              <button
                type="button"
                className="pt-btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  background: 'var(--brand-gradient)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={handleSaveScore}
                disabled={isSubmitting}
              >
                <Save size={15} /> {isSubmitting ? 'Đang lưu...' : 'Lưu Điểm Khảo Thí'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Scorecard Modal */}
      {showPrintModal && (
        <ScorecardPrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          test={test}
          scores={{
            listening,
            reading,
            writing,
            speaking,
            overall: overallBand,
            feedback,
          }}
          recommendedCourse={recommendation?.course}
        />
      )}
    </>,
    document.body
  );
};
