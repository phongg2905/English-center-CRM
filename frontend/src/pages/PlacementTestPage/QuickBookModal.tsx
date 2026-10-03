import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, MapPin, BookOpen, User, AlertCircle, Check } from 'lucide-react';
import { PlacementTestService } from '../../services/placement-test.service';
import type { TestType, ShiftSlotAvailability, LeadSimple } from '../../types/placement-test';

interface QuickBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: string;
  initialTimeSlot?: string;
  initialRoom?: string;
  availabilitySlots?: ShiftSlotAvailability[];
}

export const QuickBookModal: React.FC<QuickBookModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  initialTimeSlot,
  initialRoom,
  availabilitySlots = [],
}) => {
  const [leads, setLeads] = useState<LeadSimple[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<number | ''>('');
  const [testDate, setTestDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [timeSlot, setTimeSlot] = useState<string>(
    initialTimeSlot || '09:00 - 10:30'
  );
  const [room, setRoom] = useState<string>(
    initialRoom || 'Phòng Lab 201'
  );
  const [testType, setTestType] = useState<TestType>('IELTS');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch leads on mount
  useEffect(() => {
    if (isOpen) {
      PlacementTestService.getAvailableLeads()
        .then((data) => {
          setLeads(data);
          if (data.length > 0) {
            setSelectedLeadId(data[0].id);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Update initial fields when changed
  useEffect(() => {
    if (initialDate) setTestDate(initialDate);
    if (initialTimeSlot) setTimeSlot(initialTimeSlot);
    if (initialRoom) setRoom(initialRoom);
  }, [initialDate, initialTimeSlot, initialRoom]);

  // Calculate live capacity for selected date, slot and room
  const matchedSlot = availabilitySlots.find(
    (s) => s.testDate === testDate && s.timeSlot === timeSlot && s.room === room
  );
  const isSlotFull = matchedSlot ? matchedSlot.isFull || matchedSlot.totalBooked >= matchedSlot.maxCapacity : false;
  const currentBooked = matchedSlot ? matchedSlot.totalBooked : 0;
  const maxCapacity = matchedSlot ? matchedSlot.maxCapacity : 10;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    let targetLeadId: number | null = null;
    if (typeof selectedLeadId === 'number' && selectedLeadId > 0) {
      targetLeadId = selectedLeadId;
    }

    if (!targetLeadId) {
      setErrorMsg('Vui lòng chọn hồ sơ Lead hoặc nhập thông tin thí sinh.');
      return;
    }

    if (isSlotFull) {
      setErrorMsg('Ca thi và phòng thi đã chọn đã đủ 10/10 thí sinh. Vui lòng chọn ca hoặc phòng khác!');
      return;
    }

    try {
      setLoading(true);
      await PlacementTestService.bookTest({
        leadId: targetLeadId,
        testDate,
        timeSlot,
        room,
        testType,
        notes: notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      const serverMessage = err.response?.data?.message || err.message || 'Lỗi khi đặt lịch ca thi.';
      setErrorMsg(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="pt-modal-backdrop" onClick={onClose}>
      <div className="pt-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pt-modal-header">
          <h3 className="pt-modal-title">
            <Calendar size={20} color="var(--color-primary-royal)" />
            Đặt Lịch Hẹn Placement Test Nhanh
          </h3>
          <button className="pt-modal-close-btn" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="pt-modal-body">
            {errorMsg && (
              <div className="pt-toast-banner error">
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Lead Selection */}
            <div className="pt-form-group">
              <label className="pt-form-label">
                <User size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Chọn Hồ Sơ Học Viên (Lead)<span className="req">*</span>
              </label>
              {leads.length > 0 ? (
                <select
                  className="pt-form-select"
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(Number(e.target.value))}
                  required
                >
                  <option value="">-- Chọn thí sinh từ danh sách Lead --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      #{l.id} - {l.fullName} ({l.phoneNumber}) - [{l.status}]
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    className="pt-form-input"
                    placeholder="Nhập ID Lead (VD: 1, 2, 3...)"
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value ? Number(e.target.value) : '')}
                    required
                  />
                </div>
              )}
            </div>

            {/* Date & Time Slot Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="pt-form-group">
                <label className="pt-form-label">
                  <Calendar size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  Ngày Thi<span className="req">*</span>
                </label>
                <input
                  type="date"
                  className="pt-form-input"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  required
                />
              </div>

              <div className="pt-form-group">
                <label className="pt-form-label">
                  <Clock size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  Khung Giờ (Ca Thi)<span className="req">*</span>
                </label>
                <select
                  className="pt-form-select"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  required
                >
                  <option value="09:00 - 10:30">09:00 - 10:30 (Ca Sáng)</option>
                  <option value="14:30 - 16:00">14:30 - 16:00 (Ca Chiều)</option>
                  <option value="18:00 - 19:30">18:00 - 19:30 (Ca Tối)</option>
                </select>
              </div>
            </div>

            {/* Room & Test Type Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="pt-form-group">
                <label className="pt-form-label">
                  <MapPin size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  Phòng Thi & Campus<span className="req">*</span>
                </label>
                <select
                  className="pt-form-select"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  required
                >
                  <option value="Phòng Lab 201">Phòng Lab 201 (Cơ sở Q.1)</option>
                  <option value="Phòng Lab 101">Phòng Lab 101 (Cơ sở Bình Thạnh)</option>
                  <option value="Phòng 302">Phòng 302 (Cơ sở Tân Bình)</option>
                </select>
              </div>

              <div className="pt-form-group">
                <label className="pt-form-label">
                  <BookOpen size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  Loại Bài Thi Đánh Giá<span className="req">*</span>
                </label>
                <select
                  className="pt-form-select"
                  value={testType}
                  onChange={(e) => setTestType(e.target.value as TestType)}
                  required
                >
                  <option value="IELTS">IELTS Placement Test (4 kỹ năng)</option>
                  <option value="TOEIC">TOEIC Placement Test</option>
                  <option value="GENERAL">Cambridge / Tiếng Anh Giao Tiếp (GENERAL)</option>
                </select>
              </div>
            </div>

            {/* Live Room Capacity Preview */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: isSlotFull ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                border: `1px solid ${isSlotFull ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: isSlotFull ? '#dc2626' : '#059669' }}>
                  {isSlotFull ? '⚠️ PHÒNG ĐÃ KÍN CHỖ (10/10)' : '✓ SỨC CHỨA KHẢ DỤNG'}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800 }}>
                  {currentBooked} / {maxCapacity} Thí sinh ({maxCapacity - currentBooked} chỗ còn lại)
                </span>
              </div>
              <div className="pt-capacity-bar-track">
                <div
                  className={`pt-capacity-bar-fill ${isSlotFull ? 'full' : currentBooked >= 7 ? 'warning' : 'normal'}`}
                  style={{ width: `${Math.min(100, (currentBooked / maxCapacity) * 100)}%` }}
                />
              </div>
              {isSlotFull && (
                <div style={{ fontSize: '11.5px', color: '#dc2626', marginTop: '6px', fontWeight: 600 }}>
                  Không thể tiếp nhận thêm thí sinh vào phòng thi này. Vui lòng chuyển sang ca thi khác hoặc phòng khác.
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="pt-form-group">
              <label className="pt-form-label">Ghi Chú Cho Giám Thị / Tư Vấn Viên</label>
              <textarea
                className="pt-form-textarea"
                placeholder="Nhập ghi chú đặc biệt (ví dụ: thi online, cần tai nghe rời, hẹn thi bù...)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-modal-footer">
            <button
              type="button"
              className="pt-btn-touch"
              style={{ background: '#e2e8f0', color: '#475569' }}
              onClick={onClose}
              disabled={loading}
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="pt-btn-touch pt-btn-present active"
              style={{ padding: '8px 18px', fontSize: '13px' }}
              disabled={loading || isSlotFull}
            >
              {loading ? 'Đang Đặt Lịch...' : <><Check size={16} /> Xác Nhận Đặt Lịch</>}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
