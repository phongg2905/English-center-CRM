import React, { useState } from 'react';
import { Check, X, Clock, AlertCircle, Phone, Mail, RotateCcw } from 'lucide-react';
import { PlacementTestService } from '../../services/placement-test.service';
import type { PlacementTestWithDetails, AttendanceStatus } from '../../types/placement-test';

interface CandidateRosterTableProps {
  tests: PlacementTestWithDetails[];
  onAttendanceChanged: () => void;
  selectedShiftInfo?: {
    date: string;
    timeSlot: string;
    room?: string;
  } | null;
}

export const CandidateRosterTable: React.FC<CandidateRosterTableProps> = ({
  tests,
  onAttendanceChanged,
  selectedShiftInfo,
}) => {
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError?: boolean } | null>(null);

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

  const getTestTypeBadge = (type: string) => {
    switch (type) {
      case 'IELTS':
        return <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', fontWeight: 700, fontSize: '11px', border: '1px solid rgba(124, 58, 237, 0.25)' }}>IELTS</span>;
      case 'TOEIC':
        return <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', fontWeight: 700, fontSize: '11px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>TOEIC</span>;
      default:
        return <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(249, 115, 22, 0.1)', color: '#ea580c', fontWeight: 700, fontSize: '11px', border: '1px solid rgba(249, 115, 22, 0.25)' }}>CAMBRIDGE</span>;
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
        return <span className="pt-status-badge scheduled"><Clock size={13} /> Đã lên lịch</span>;
    }
  };

  return (
    <div className="pt-roster-card">
      {/* Header */}
      <div className="pt-roster-header">
        <div className="pt-roster-title">
          <h3>
            {selectedShiftInfo
              ? `Danh Sách Thí Sinh Trong Ca: ${selectedShiftInfo.date} • ${selectedShiftInfo.timeSlot} ${selectedShiftInfo.room ? `(${selectedShiftInfo.room})` : ''}`
              : 'Bảng Danh Sách Thí Sinh & Điểm Danh Một Chạm'}
          </h3>
          <span className="pt-roster-count">{tests.length} Thí sinh</span>
        </div>

        {feedbackMsg && (
          <div
            className={`pt-toast-banner ${feedbackMsg.isError ? 'error' : 'success'}`}
            style={{ padding: '6px 14px', fontSize: '12.5px' }}
          >
            {feedbackMsg.text}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="pt-table-responsive">
        <table className="pt-roster-table">
          <thead>
            <tr>
              <th>Thí Sinh / Học Viên</th>
              <th>Ca Thi & Phòng</th>
              <th>Loại Bài Thi</th>
              <th>Tư Vấn Viên</th>
              <th>Trạng Thái</th>
              <th>Kết Quả / Gợi Ý</th>
              <th style={{ textAlign: 'center' }}>Điểm Danh Một Chạm</th>
            </tr>
          </thead>
          <tbody>
            {tests.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Không có thí sinh nào trong ca thi hoặc điều kiện lọc đã chọn.
                </td>
              </tr>
            ) : (
              tests.map((item) => {
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
                            <Phone size={12} /> {item.leadPhoneNumber || 'Chưa có SĐT'}
                            {item.leadEmail && (
                              <>
                                <span>•</span>
                                <Mail size={12} /> {item.leadEmail}
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Ca thi & Phòng */}
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{item.testDate}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-family-mono)' }}>
                        {item.timeSlot} • <strong>{item.room || 'Phòng Lab'}</strong>
                      </div>
                    </td>

                    {/* Loại bài thi */}
                    <td>{getTestTypeBadge(item.testType)}</td>

                    {/* Tư vấn viên */}
                    <td>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-body)' }}>
                        {item.assignedSalesName || 'Chưa phân bổ'}
                      </span>
                    </td>

                    {/* Trạng thái hiện tại */}
                    <td>{getStatusBadge(item.attendanceStatus)}</td>

                    {/* Điểm & Gợi ý khóa học */}
                    <td>
                      {item.overallScore !== null ? (
                        <div>
                          <span style={{ fontWeight: 800, color: 'var(--color-primary-royal)', fontSize: '13.5px' }}>
                            Band {item.overallScore}
                          </span>
                          {item.suggestedCourseName && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              → {item.suggestedCourseName}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                          Chưa chấm điểm
                        </span>
                      )}
                    </td>

                    {/* Thao tác Điểm danh một chạm */}
                    <td>
                      <div className="pt-attendance-actions" style={{ justifyContent: 'center' }}>
                        {/* Nút Có mặt */}
                        <button
                          type="button"
                          className={`pt-btn-touch pt-btn-present ${item.attendanceStatus === 'PRESENT' ? 'active' : ''}`}
                          onClick={() => handleUpdateAttendance(item.id, 'PRESENT')}
                          disabled={isUpdating}
                          title="Đánh dấu Có mặt tham gia thi"
                        >
                          <Check size={14} /> Có mặt
                        </button>

                        {/* Nút Vắng mặt */}
                        <button
                          type="button"
                          className={`pt-btn-touch pt-btn-absent ${item.attendanceStatus === 'ABSENT' ? 'active' : ''}`}
                          onClick={() => handleUpdateAttendance(item.id, 'ABSENT')}
                          disabled={isUpdating}
                          title="Đánh dấu Vắng mặt không đến"
                        >
                          <X size={14} /> Vắng mặt
                        </button>

                        {/* Nút Hoàn nguyên về Chờ thi nếu cần */}
                        {item.attendanceStatus !== 'SCHEDULED' && (
                          <button
                            type="button"
                            className="pt-btn-touch"
                            style={{ background: '#f1f5f9', color: '#64748b' }}
                            onClick={() => handleUpdateAttendance(item.id, 'SCHEDULED')}
                            disabled={isUpdating}
                            title="Đặt lại trạng thái Chờ thi"
                          >
                            <RotateCcw size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
