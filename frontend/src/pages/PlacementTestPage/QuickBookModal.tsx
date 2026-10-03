import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  User,
  UserPlus,
  AlertCircle,
  Check,
  Search,
  Trash2,
  Plus,
} from 'lucide-react';
import { PlacementTestService } from '../../services/placement-test.service';
import type { TestType, ShiftSlotAvailability, LeadSimple } from '../../types/placement-test';
import { formatLocalDate } from '../../utils/date';

interface QuickBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: string;
  initialTimeSlot?: string;
  initialRoom?: string;
  availabilitySlots?: ShiftSlotAvailability[];
}

interface NewCandidateInput {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
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
  // Mode: 'select_existing' (Chọn từ Lead có sẵn) vs 'direct_input' (Nhập trực tiếp)
  const [activeTab, setActiveTab] = useState<'select_existing' | 'direct_input'>('select_existing');

  // Existing Leads Mode
  const [leads, setLeads] = useState<LeadSimple[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
  const [leadSearchQuery, setLeadSearchQuery] = useState('');

  // Direct Input Mode (Nhập danh sách thí sinh mới trực tiếp)
  const [newCandidates, setNewCandidates] = useState<NewCandidateInput[]>([
    { id: '1', fullName: '', phoneNumber: '', email: '' },
  ]);

  // Shift & Room Settings
  const [testDate, setTestDate] = useState<string>(
    initialDate || formatLocalDate(new Date())
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

  // Fetch leads on modal open
  useEffect(() => {
    if (isOpen) {
      PlacementTestService.getAvailableLeads()
        .then((data) => {
          setLeads(data);
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
  const matchedSlot = availabilitySlots.find((s) => {
    const sDate = (s.testDate || '').split('T')[0];
    const sRoom = (s.room || '').toLowerCase();
    const targetRoom = (room || '').toLowerCase();
    return sDate === testDate && s.timeSlot === timeSlot && (sRoom.includes(targetRoom) || targetRoom.includes(sRoom));
  });

  const currentBooked = matchedSlot ? matchedSlot.totalBooked : 0;
  const maxCapacity = matchedSlot ? matchedSlot.maxCapacity : 10;
  const availableSeats = Math.max(0, maxCapacity - currentBooked);

  // Candidates count to add
  const candidateCount =
    activeTab === 'select_existing'
      ? selectedLeadIds.length
      : newCandidates.filter((c) => c.fullName.trim() && c.phoneNumber.trim()).length;

  const isOverCapacity = currentBooked + candidateCount > maxCapacity;

  if (!isOpen) return null;

  // Toggle select lead
  const handleToggleLead = (id: number) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredLeads.map((l) => l.id);
    setSelectedLeadIds(Array.from(new Set([...selectedLeadIds, ...filteredIds])));
  };

  const handleDeselectAll = () => {
    setSelectedLeadIds([]);
  };

  // Direct Input Row Handlers
  const handleAddCandidateRow = () => {
    setNewCandidates((prev) => [
      ...prev,
      { id: Date.now().toString(), fullName: '', phoneNumber: '', email: '' },
    ]);
  };

  const handleRemoveCandidateRow = (id: string) => {
    if (newCandidates.length <= 1) return;
    setNewCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdateCandidate = (id: string, field: keyof NewCandidateInput, val: string) => {
    setNewCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: val } : c))
    );
  };

  // Filter existing leads list
  const filteredLeads = leads.filter((l) => {
    if (!leadSearchQuery.trim()) return true;
    const q = leadSearchQuery.toLowerCase();
    return (
      l.fullName.toLowerCase().includes(q) ||
      l.phoneNumber.includes(q) ||
      (l.email && l.email.toLowerCase().includes(q))
    );
  });

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (candidateCount === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 học viên từ danh sách hoặc nhập thông tin thí sinh mới.');
      return;
    }

    if (isOverCapacity) {
      setErrorMsg(
        `Không thể đặt lịch: Bạn đang thêm ${candidateCount} thí sinh nhưng phòng chỉ còn ${availableSeats} chỗ trống!`
      );
      return;
    }

    try {
      setLoading(true);

      if (activeTab === 'select_existing') {
        // Bulk book for selected leads
        for (const leadId of selectedLeadIds) {
          await PlacementTestService.bookTest({
            leadId,
            testDate,
            timeSlot,
            room,
            testType,
            notes: notes.trim() || undefined,
          });
        }
      } else {
        // Direct input: Create lead then book for each candidate
        const validCandidates = newCandidates.filter((c) => c.fullName.trim() && c.phoneNumber.trim());
        for (const candidate of validCandidates) {
          // 1. Create lead
          const createdLead = await PlacementTestService.createLead({
            fullName: candidate.fullName.trim(),
            phoneNumber: candidate.phoneNumber.trim(),
            email: candidate.email.trim() || undefined,
            interest: testType,
          });

          // 2. Book test for this newly created lead
          await PlacementTestService.bookTest({
            leadId: createdLead.id,
            testDate,
            timeSlot,
            room,
            testType,
            notes: notes.trim() || undefined,
          });
        }
      }

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
      <div className="pt-modal-dialog" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pt-modal-header">
          <h3 className="pt-modal-title">
            <Calendar size={20} color="var(--color-primary-royal)" />
            Đặt Lịch Hẹn & Quản Lý Ca Thi
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

            {/* Mode Selector Tabs */}
            <div style={{ display: 'flex', gap: '8px', padding: '4px', background: '#f1f5f9', borderRadius: '10px' }}>
              <button
                type="button"
                className={`pt-view-toggle-btn ${activeTab === 'select_existing' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setActiveTab('select_existing')}
              >
                <User size={15} />
                Chọn từ danh sách Lead ({selectedLeadIds.length} đã chọn)
              </button>
              <button
                type="button"
                className={`pt-view-toggle-btn ${activeTab === 'direct_input' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setActiveTab('direct_input')}
              >
                <UserPlus size={15} />
                Nhập trực tiếp thí sinh mới
              </button>
            </div>

            {/* TAB 1: SELECT EXISTING LEADS (MULTI-SELECT) */}
            {activeTab === 'select_existing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      className="pt-form-input"
                      style={{ paddingLeft: '32px', height: '36px', fontSize: '13px' }}
                      placeholder="Tìm kiếm Lead theo tên hoặc số điện thoại..."
                      value={leadSearchQuery}
                      onChange={(e) => setLeadSearchQuery(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="pt-date-pill"
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                      onClick={handleSelectAllFiltered}
                    >
                      Chọn tất cả
                    </button>
                    <button
                      type="button"
                      className="pt-date-pill"
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                      onClick={handleDeselectAll}
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>

                {/* Scrollable Lead List */}
                <div
                  style={{
                    maxHeight: '180px',
                    overflowY: 'auto',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    background: '#f8fafc',
                  }}
                >
                  {filteredLeads.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '12.5px' }}>
                      Không tìm thấy Lead nào phù hợp.
                    </div>
                  ) : (
                    filteredLeads.map((lead) => {
                      const isChecked = selectedLeadIds.includes(lead.id);
                      return (
                        <label
                          key={lead.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: isChecked ? 'rgba(124, 58, 237, 0.08)' : '#fff',
                            border: `1px solid ${isChecked ? 'rgba(124, 58, 237, 0.3)' : '#e2e8f0'}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleLead(lead.id)}
                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-primary-royal)' }}
                          />
                          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong style={{ fontSize: '13px', color: 'var(--text-heading)' }}>{lead.fullName}</strong>
                              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                                📞 {lead.phoneNumber}
                              </span>
                            </div>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                              {lead.targetSubject || lead.status}
                            </span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: DIRECT INPUT NEW CANDIDATES (NO EXISTING LEAD REQUIRED) */}
            {activeTab === 'direct_input' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                  Nhập thông tin thí sinh mới trực tiếp. Hệ thống sẽ tự động tạo hồ sơ Lead và xếp vào ca thi:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {newCandidates.map((c, idx) => (
                    <div
                      key={c.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1fr 1fr auto',
                        gap: '8px',
                        alignItems: 'center',
                        padding: '8px',
                        borderRadius: '8px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <input
                        type="text"
                        className="pt-form-input"
                        style={{ height: '34px', fontSize: '12.5px' }}
                        placeholder={`Họ và tên thí sinh #${idx + 1} *`}
                        value={c.fullName}
                        onChange={(e) => handleUpdateCandidate(c.id, 'fullName', e.target.value)}
                        required={idx === 0}
                      />
                      <input
                        type="text"
                        className="pt-form-input"
                        style={{ height: '34px', fontSize: '12.5px' }}
                        placeholder="Số điện thoại *"
                        value={c.phoneNumber}
                        onChange={(e) => handleUpdateCandidate(c.id, 'phoneNumber', e.target.value)}
                        required={idx === 0}
                      />
                      <input
                        type="email"
                        className="pt-form-input"
                        style={{ height: '34px', fontSize: '12.5px' }}
                        placeholder="Email (tùy chọn)"
                        value={c.email}
                        onChange={(e) => handleUpdateCandidate(c.id, 'email', e.target.value)}
                      />
                      {newCandidates.length > 1 && (
                        <button
                          type="button"
                          className="pt-modal-close-btn"
                          style={{ color: '#dc2626' }}
                          onClick={() => handleRemoveCandidateRow(c.id)}
                          title="Xóa dòng thí sinh này"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="pt-btn-add-shift"
                  style={{ alignSelf: 'flex-start', padding: '6px 12px' }}
                  onClick={handleAddCandidateRow}
                >
                  <Plus size={13} /> Thêm người nữa vào ca này
                </button>
              </div>
            )}

            {/* Shift & Room Settings */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="pt-form-group">
                <label className="pt-form-label">
                  <Calendar size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
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
                  <Clock size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="pt-form-group">
                <label className="pt-form-label">
                  <MapPin size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
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
                  <BookOpen size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  Loại Bài Thi<span className="req">*</span>
                </label>
                <select
                  className="pt-form-select"
                  value={testType}
                  onChange={(e) => setTestType(e.target.value as TestType)}
                  required
                >
                  <option value="IELTS">IELTS Placement Test (4 kỹ năng)</option>
                  <option value="TOEIC">TOEIC Placement Test</option>
                  <option value="GENERAL">Cambridge / Giao Tiếp (GENERAL)</option>
                </select>
              </div>
            </div>

            {/* Live Room Capacity Preview */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: isOverCapacity ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                border: `1px solid ${isOverCapacity ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: isOverCapacity ? '#dc2626' : '#059669' }}>
                  {isOverCapacity ? '⚠️ VƯỢT QUÁ SỨC CHỨA PHÒNG THI' : '✓ SỨC CHỨA KHẢ DỤNG'}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800 }}>
                  Hiện có: {currentBooked} / {maxCapacity} | Sắp thêm: +{candidateCount} bạn (Còn lại: {Math.max(0, availableSeats - candidateCount)} chỗ)
                </span>
              </div>
              <div className="pt-capacity-bar-track">
                <div
                  className={`pt-capacity-bar-fill ${isOverCapacity ? 'full' : currentBooked + candidateCount >= 7 ? 'warning' : 'normal'}`}
                  style={{ width: `${Math.min(100, ((currentBooked + candidateCount) / maxCapacity) * 100)}%` }}
                />
              </div>
              {isOverCapacity && (
                <div style={{ fontSize: '11.5px', color: '#dc2626', marginTop: '6px', fontWeight: 600 }}>
                  Phòng thi này chỉ còn {availableSeats} chỗ trống. Vui lòng giảm số người hoặc chọn ca/phòng khác!
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="pt-form-group">
              <label className="pt-form-label">Ghi Chú Chung</label>
              <textarea
                className="pt-form-textarea"
                style={{ minHeight: '60px' }}
                placeholder="Ghi chú đặc biệt cho ca thi này..."
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
              style={{ padding: '8px 20px', fontSize: '13px' }}
              disabled={loading || candidateCount === 0 || isOverCapacity}
            >
              {loading ? (
                'Đang Xử Lý...'
              ) : (
                <>
                  <Check size={16} />
                  Xác Nhận Đặt Lịch ({candidateCount} Thí Sinh)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
