import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { Button } from '../../components/ui';
import { LeadService } from '../../services/lead.service';
import type {
  LeadInterest,
  LeadSourceChannel,
  LeadPipelineStage,
} from '../../types/lead';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStage?: LeadPipelineStage;
  onSuccess: () => Promise<void>;
  onSelectLeadById: (leadId: number) => void;
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
  isOpen,
  onClose,
  initialStage = 'NEW',
  onSuccess,
  onSelectLeadById,
}) => {
  const [fullName, setFullName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [interest, setInterest] = useState<LeadInterest>('IELTS');
  const [sourceChannel, setSourceChannel] = useState<LeadSourceChannel>('FB_ADS');
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [conflictLeadId, setConflictLeadId] = useState<number | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setFullName('');
      setPhoneNumber('');
      setEmail('');
      setInterest('IELTS');
      setSourceChannel('FB_ADS');
      setNotes('');
      setFormError(null);
      setConflictLeadId(null);
      setConflictMessage(null);
    }
  }, [isOpen, initialStage]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setConflictLeadId(null);
    setConflictMessage(null);

    // Validate phone number format (Vietnam 10 digits starting with 0)
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
    if (!cleanPhone) {
      setFormError('Vui lòng nhập số điện thoại khách hàng');
      return;
    }
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setFormError('Số điện thoại không hợp lệ (Phải đúng 10 chữ số, bắt đầu bằng số 0)');
      return;
    }

    // Validate Email if entered
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setFormError('Định dạng email không hợp lệ');
        return;
      }
    }

    if (!fullName.trim()) {
      setFormError('Vui lòng nhập họ và tên khách hàng');
      return;
    }

    setIsSubmitting(true);
    try {
      await LeadService.createLead({
        fullName: fullName.trim(),
        phoneNumber: cleanPhone,
        email: email.trim() || null,
        interest,
        sourceChannel,
        notes: notes.trim() || null,
      });

      await onSuccess();
      onClose();
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      // Duplicate Phone or Email (HTTP 409 Conflict)
      if (status === 409) {
        const existingId = data?.details?.existingLeadId || data?.existingLeadId;
        setConflictMessage(data?.message || 'Khách hàng này đã tồn tại trên hệ thống!');
        if (existingId) {
          setConflictLeadId(Number(existingId));
        }
      } else {
        setFormError(data?.message || err?.message || 'Không thể tạo hồ sơ Lead mới');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenExistingLead = () => {
    if (conflictLeadId) {
      onClose();
      onSelectLeadById(conflictLeadId);
    }
  };

  return createPortal(
    <div className="create-lead-modal-backdrop" onClick={onClose}>
      <div className="create-lead-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="create-lead-header">
          <div className="create-lead-title">
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserPlus size={18} />
            </span>
            <span>Tiếp Nhận Lead Mới</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="create-lead-body">
            {/* Conflict Alert (BR-01) */}
            {conflictMessage && (
              <div className="conflict-alert-box">
                <div className="conflict-alert-title">
                  <AlertCircle size={16} />
                  <span>{conflictMessage}</span>
                </div>
                {conflictLeadId && (
                  <button
                    type="button"
                    onClick={handleOpenExistingLead}
                    className="conflict-view-btn"
                  >
                    <span>Xem ngay hồ sơ Lead cũ</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            )}

            {/* General Form Error */}
            {formError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  color: '#dc2626',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            {/* Họ và tên */}
            <div>
              <label
                style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#334155',
                  display: 'block',
                  marginBottom: '5px',
                }}
              >
                Họ và tên học viên <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Nguyễn Văn An"
                className="drawer-input"
                required
                autoFocus
              />
            </div>

            {/* Số điện thoại & Email (2 columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#334155',
                    display: 'block',
                    marginBottom: '5px',
                  }}
                >
                  Số điện thoại <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0912345678"
                  className="drawer-input"
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#334155',
                    display: 'block',
                    marginBottom: '5px',
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hocvien@gmail.com"
                  className="drawer-input"
                />
              </div>
            </div>

            {/* Khóa học quan tâm & Kênh tiếp nhận (2 columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#334155',
                    display: 'block',
                    marginBottom: '5px',
                  }}
                >
                  Mục tiêu chứng chỉ
                </label>
                <select
                  value={interest}
                  onChange={(e) => setInterest(e.target.value as LeadInterest)}
                  className="behance-select"
                  style={{ width: '100%', padding: '9px 12px' }}
                >
                  <option value="IELTS">Luyện thi IELTS</option>
                  <option value="TOEIC">Luyện thi TOEIC</option>
                  <option value="COMMUNICATION">Tiếng Anh Giao Tiếp</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#334155',
                    display: 'block',
                    marginBottom: '5px',
                  }}
                >
                  Kênh nguồn tiếp cận
                </label>
                <select
                  value={sourceChannel}
                  onChange={(e) => setSourceChannel(e.target.value as LeadSourceChannel)}
                  className="behance-select"
                  style={{ width: '100%', padding: '9px 12px' }}
                >
                  <option value="FB_ADS">Facebook Ads</option>
                  <option value="WEBSITE">Website & Landing Page</option>
                  <option value="HOTLINE">Hotline Trung tâm</option>
                  <option value="WALK_IN">Đến Trực Tiếp</option>
                  <option value="REFERRAL">Người quen giới thiệu</option>
                </select>
              </div>
            </div>

            {/* Ghi chú ban đầu */}
            <div>
              <label
                style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#334155',
                  display: 'block',
                  marginBottom: '5px',
                }}
              >
                Ghi chú nguyện vọng & Target điểm
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VD: Cần thi IELTS 6.5 trước tháng 12 để ra trường, rảnh tối 2-4-6..."
                rows={3}
                className="drawer-textarea"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="create-lead-footer">
            <Button variant="glass" size="sm" type="button" onClick={onClose}>
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isSubmitting}
              iconLeft={<Check size={16} />}
              style={{ background: '#2563eb' }}
            >
              {isSubmitting ? 'Đang lưu...' : 'Tiếp Nhận Lead'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
