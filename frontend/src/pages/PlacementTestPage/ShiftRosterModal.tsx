import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Check,
  AlertCircle,
  Phone,
  Mail,
  RotateCcw,
  Trash2,
  UserPlus,
  Award,
} from 'lucide-react';
import { PlacementTestService } from '../../services/placement-test.service';
import { ScoringModal } from './ScoringModal';
import type { PlacementTestWithDetails, AttendanceStatus } from '../../types/placement-test';

interface ShiftRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftInfo: {
    date: string;
    timeSlot: string;
    room?: string;
  } | null;
  tests: PlacementTestWithDetails[];
  onAttendanceChanged: () => void;
  onAddCandidateToShift: (shift: { date: string; timeSlot: string; room?: string }) => void;
}

export const ShiftRosterModal: React.FC<ShiftRosterModalProps> = ({
  isOpen,
  onClose,
  shiftInfo,
  tests,
  onAttendanceChanged,
  onAddCandidateToShift,
}) => {
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeletingShift, setIsDeletingShift] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [scoringTest, setScoringTest] = useState<PlacementTestWithDetails | null>(null);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !shiftInfo) return null;

  // Filter candidates specifically in this shift
  const shiftCandidates = tests.filter((t) => {
    const tDate = (t.testDate || '').split('T')[0];
    const sDate = (shiftInfo.date || '').split('T')[0];
    if (tDate !== sDate) return false;
    if (t.timeSlot !== shiftInfo.timeSlot) return false;
    if (shiftInfo.room && t.room && t.room.toLowerCase() !== shiftInfo.room.toLowerCase()) return false;
    return true;
  });

  const presentCount = shiftCandidates.filter((t) => t.attendanceStatus === 'PRESENT').length;
  const absentCount = shiftCandidates.filter((t) => t.attendanceStatus === 'ABSENT').length;
  const scheduledCount = shiftCandidates.filter((t) => t.attendanceStatus === 'SCHEDULED').length;
  const maxCapacity = 10;
  const isFull = shiftCandidates.length >= maxCapacity;

  const handleUpdateAttendance = async (testId: number, newStatus: AttendanceStatus) => {
    try {
      setUpdatingId(testId);
      setFeedbackMsg(null);
      await PlacementTestService.updateAttendance(testId, {
        attendanceStatus: newStatus,
      });

      const label =
        newStatus === 'PRESENT'
          ? 'Đã điểm danh CÓ MẶT'
          : newStatus === 'ABSENT'
          ? 'Đã ghi nhận VẮNG MẶT'
          : newStatus === 'SCHEDULED'
          ? 'Đã chuyển về trạng thái CHỜ THI'
          : 'Đã HỦY LỊCH';

      setFeedbackMsg({ text: `✓ ${label} cho thí sinh #${testId}` });
      setTimeout(() => setFeedbackMsg(null), 3000);
      onAttendanceChanged();
    } catch (err: any) {
      setFeedbackMsg({
        text: err.response?.data?.message || err.message || 'Lỗi khi cập nhật điểm danh',
        isError: true,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteCandidate = async (testId: number, candidateName: string) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa thí sinh "${candidateName}" khỏi ca thi này không?\n\nChỗ thi trong phòng sẽ được giải phóng cho học viên khác.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(testId);
      await PlacementTestService.deleteTest(testId);
      setFeedbackMsg({ text: `✓ Đã xóa thí sinh "${candidateName}" khỏi ca thi thành công!` });
      setTimeout(() => setFeedbackMsg(null), 3000);
      onAttendanceChanged();
    } catch (err: any) {
      setFeedbackMsg({
        text: err.response?.data?.message || err.message || 'Lỗi khi xóa thí sinh khỏi ca thi',
        isError: true,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteShift = async () => {
    const count = shiftCandidates.length;
    const confirmed = window.confirm(
      `CẢNH BÁO: Bạn có chắc chắn muốn HỦY & XÓA TOÀN BỘ ca thi này không?\n\n` +
      `• Ngày thi: ${shiftInfo.date}\n` +
      `• Khung giờ: ${shiftInfo.timeSlot}\n` +
      (shiftInfo.room ? `• Phòng: ${shiftInfo.room}\n` : '') +
      `• Tổng số thí sinh hiện tại: ${count} người\n\n` +
      `Tất cả dữ liệu lịch thi của các thí sinh trong ca này sẽ bị xóa và phòng thi sẽ trở về trạng thái trống.`
    );
    if (!confirmed) return;

    try {
      setIsDeletingShift(true);
      await PlacementTestService.deleteShift(
        shiftInfo.date,
        shiftInfo.timeSlot,
        shiftInfo.room
      );
      onAttendanceChanged();
      onClose();
    } catch (err: any) {
      setFeedbackMsg({
        text: err.response?.data?.message || err.message || 'Lỗi khi xóa toàn bộ ca thi',
        isError: true,
      });
    } finally {
      setIsDeletingShift(false);
    }
  };

  const getTestTypeBadge = (type: string) => {
    switch (type) {
      case 'IELTS':
        return (
          <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', fontWeight: 700, fontSize: '11px', border: '1px solid rgba(124, 58, 237, 0.25)' }}>
            IELTS
          </span>
        );
      case 'TOEIC':
        return (
          <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', fontWeight: 700, fontSize: '11px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
            TOEIC
          </span>
        );
      default:
        return (
          <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(249, 115, 22, 0.1)', color: '#ea580c', fontWeight: 700, fontSize: '11px', border: '1px solid rgba(249, 115, 22, 0.25)' }}>
            CAMBRIDGE
          </span>
        );
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT':
        return <span className="pt-status-badge present"><Check size={13} /> Có mặt</span>;
      case 'ABSENT':
        return <span className="pt-status-badge absent"><X size={13} /> Vắng mặt</span>;
      case 'CANCELLED':
        return <span className="pt-status-badge cancelled"><AlertCircle size={13} /> Đã hủy</span>;
      case 'SCHEDULED':
      default:
        return <span className="pt-status-badge scheduled"><Clock size={13} /> Chờ thi</span>;
    }
  };

  return createPortal(
    <div className="pt-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="pt-modal-dialog pt-roster-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pt-modal-header" style={{ padding: '18px 24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 className="pt-modal-title" style={{ fontSize: '17px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="var(--color-primary-royal)" />
                Chi Tiết Ca Thi: {shiftInfo.date} • {shiftInfo.timeSlot}
              </h3>
              {shiftInfo.room && (
                <span 
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(124, 58, 237, 0.1)',
                    color: 'var(--color-primary-royal)',
                    border: '1px solid rgba(124, 58, 237, 0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <MapPin size={12} /> {shiftInfo.room}
                </span>
              )}
              <span 
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: isFull ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  color: isFull ? '#dc2626' : '#059669',
                  border: isFull ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Users size={12} /> {shiftCandidates.length}/{maxCapacity} Thí sinh {isFull ? '(ĐÃ KÍN)' : ''}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              className="pt-btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #4f46e5, #2563eb)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              onClick={() => onAddCandidateToShift(shiftInfo)}
              title="Thêm thí sinh vào ca thi này"
            >
              <UserPlus size={15} /> Thêm Thí Sinh
            </button>

            <button
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                fontSize: '12.5px',
                fontWeight: 600,
                borderRadius: '8px',
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              onClick={handleDeleteShift}
              disabled={isDeletingShift}
              title="Hủy toàn bộ ca thi"
            >
              <Trash2 size={14} /> {isDeletingShift ? 'Đang xóa...' : 'Hủy Ca'}
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

        {feedbackMsg && (
          <div
            className={`pt-toast-banner ${feedbackMsg.isError ? 'error' : 'success'}`}
            style={{ margin: '12px 24px 0 24px', padding: '8px 14px', fontSize: '13px' }}
          >
            {feedbackMsg.text}
          </div>
        )}

        {/* Body: Candidate Roster Table */}
        <div className="pt-modal-body" style={{ padding: '16px 24px', maxHeight: '65vh' }}>
          {shiftCandidates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
              <div 
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(124, 58, 237, 0.08)',
                  color: 'var(--color-primary-royal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto'
                }}
              >
                <Users size={26} />
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                Ca thi hiện chưa có thí sinh đăng ký
              </h4>
              <p style={{ fontSize: '13px', margin: '0 0 16px 0', color: 'var(--text-muted)' }}>
                Bạn có thể bấm nút bên dưới để chọn học viên từ danh sách Lead hoặc nhập thí sinh mới.
              </p>
              <button
                type="button"
                className="pt-btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  background: 'var(--brand-gradient)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => onAddCandidateToShift(shiftInfo)}
              >
                <UserPlus size={15} /> Thêm Thí Sinh Vào Ca Này
              </button>
            </div>
          ) : (
            <div className="pt-table-responsive" style={{ border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <table className="pt-roster-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Thí Sinh / Học Viên</th>
                    <th>Loại Bài Thi</th>
                    <th>Tư Vấn Viên</th>
                    <th>Trạng Thái</th>
                    <th>Kết Quả / Gợi Ý</th>
                    <th style={{ textAlign: 'center' }}>Điểm Danh Một Chạm</th>
                  </tr>
                </thead>
                <tbody>
                  {shiftCandidates.map((item) => {
                    const isUpdating = updatingId === item.id;
                    return (
                      <tr key={item.id} style={{ opacity: isUpdating ? 0.6 : 1 }}>
                        {/* Thí sinh */}
                        <td>
                          <div className="pt-candidate-info">
                            <div className="pt-candidate-avatar">
                              {item.leadFullName ? item.leadFullName.trim().split(' ').pop()?.[0]?.toUpperCase() : 'T'}
                            </div>
                            <div className="pt-candidate-details">
                              <span className="pt-candidate-name">{item.leadFullName || `Thí sinh #${item.leadId}`}</span>
                              <span className="pt-candidate-contact">
                                <Phone size={11} /> {item.leadPhoneNumber || 'Chưa có SĐT'}
                                {item.leadEmail && (
                                  <>
                                    <span>•</span>
                                    <Mail size={11} /> {item.leadEmail}
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Loại bài thi */}
                        <td>{getTestTypeBadge(item.testType)}</td>

                        {/* Tư vấn viên */}
                        <td>
                          <span style={{ fontSize: '12.5px', color: 'var(--text-body)', whiteSpace: 'nowrap' }}>
                            {item.assignedSalesName || 'Chưa phân bổ'}
                          </span>
                        </td>

                        {/* Trạng thái hiện tại */}
                        <td>{getStatusBadge(item.attendanceStatus)}</td>

                        {/* Điểm & Gợi ý khóa học */}
                        <td>
                          {item.overallScore !== null ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div>
                                <span style={{ fontWeight: 800, color: 'var(--color-primary-royal)', fontSize: '13.5px', whiteSpace: 'nowrap' }}>
                                  Band {item.overallScore}
                                </span>
                                {item.suggestedCourseName && (
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                    → {item.suggestedCourseName}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                className="pt-btn-touch"
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                  background: 'rgba(124, 58, 237, 0.08)',
                                  color: 'var(--color-primary-royal)',
                                  border: '1px solid rgba(124, 58, 237, 0.25)',
                                  borderRadius: '6px',
                                }}
                                onClick={() => setScoringTest(item)}
                                title="Xem lại điểm / Xuất phiếu điểm PDF"
                              >
                                <Award size={12} /> Xem / Sửa
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="pt-btn-touch"
                              style={{
                                padding: '4px 10px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                background: '#f8fafc',
                                color: '#4f46e5',
                                border: '1px solid #c7d2fe',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                              }}
                              onClick={() => setScoringTest(item)}
                              title="Nhập điểm 4 kỹ năng & đề xuất lớp học"
                            >
                              <Award size={13} color="#4f46e5" /> Chấm điểm
                            </button>
                          )}
                        </td>

                        {/* Thao tác Điểm danh một chạm & Xóa */}
                        <td>
                          <div className="pt-attendance-actions" style={{ justifyContent: 'center' }}>
                            <button
                              type="button"
                              className={`pt-btn-touch pt-btn-present ${item.attendanceStatus === 'PRESENT' ? 'active' : ''}`}
                              onClick={() => handleUpdateAttendance(item.id, 'PRESENT')}
                              disabled={isUpdating || deletingId === item.id}
                              title="Đánh dấu Có mặt tham gia thi"
                            >
                              <Check size={14} /> Có mặt
                            </button>

                            <button
                              type="button"
                              className={`pt-btn-touch pt-btn-absent ${item.attendanceStatus === 'ABSENT' ? 'active' : ''}`}
                              onClick={() => handleUpdateAttendance(item.id, 'ABSENT')}
                              disabled={isUpdating || deletingId === item.id}
                              title="Đánh dấu Vắng mặt không đến"
                            >
                              <X size={14} /> Vắng mặt
                            </button>

                            {item.attendanceStatus !== 'SCHEDULED' && (
                              <button
                                type="button"
                                className="pt-btn-touch"
                                style={{ background: '#f1f5f9', color: '#64748b' }}
                                onClick={() => handleUpdateAttendance(item.id, 'SCHEDULED')}
                                disabled={isUpdating || deletingId === item.id}
                                title="Đặt lại trạng thái Chờ thi"
                              >
                                <RotateCcw size={12} />
                              </button>
                            )}

                            <button
                              type="button"
                              className="pt-btn-touch"
                              style={{
                                background: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                marginLeft: '4px',
                              }}
                              onClick={() => handleDeleteCandidate(item.id, item.leadFullName || `Thí sinh #${item.leadId}`)}
                              disabled={isUpdating || deletingId === item.id}
                              title="Xóa thí sinh khỏi ca thi (giải phóng chỗ)"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer: Quick Summary & Close */}
        <div className="pt-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>Tổng số: <strong style={{ color: 'var(--text-heading)' }}>{shiftCandidates.length}</strong> thí sinh</span>
            <span style={{ whiteSpace: 'nowrap' }}>• Có mặt: <strong style={{ color: '#059669' }}>{presentCount}</strong></span>
            <span style={{ whiteSpace: 'nowrap' }}>• Vắng mặt: <strong style={{ color: '#dc2626' }}>{absentCount}</strong></span>
            <span style={{ whiteSpace: 'nowrap' }}>• Chờ thi: <strong style={{ color: '#d97706' }}>{scheduledCount}</strong></span>
          </div>

          <button
            type="button"
            className="pt-btn-touch"
            style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 16px', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}
            onClick={onClose}
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>

      {scoringTest && (
        <ScoringModal
          isOpen={Boolean(scoringTest)}
          onClose={() => setScoringTest(null)}
          test={scoringTest}
          onScoreSaved={() => {
            onAttendanceChanged();
            setScoringTest(null);
          }}
        />
      )}
    </div>,
    document.body
  );
};
