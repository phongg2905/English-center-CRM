import React, { useState } from 'react';
import { X, KeyRound, Copy, Check, ShieldAlert } from 'lucide-react';
import type { StaffMember } from '../../types/staff';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;
  onConfirmReset: (newPassword?: string) => Promise<string | undefined>;
  isSubmitting: boolean;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  staff,
  onConfirmReset,
  isSubmitting,
}) => {
  const [customPassword, setCustomPassword] = useState('');
  const [resultPassword, setResultPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isCustomPasswordTooShort = customPassword.trim().length > 0 && customPassword.trim().length < 6;

  if (!isOpen || !staff) return null;

  const handleReset = async () => {
    if (isCustomPasswordTooShort) return;
    const tempPass = await onConfirmReset(customPassword.trim() || undefined);
    if (tempPass) {
      setResultPassword(tempPass);
    }
  };

  const handleCopy = () => {
    if (!resultPassword) return;
    navigator.clipboard.writeText(resultPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setCustomPassword('');
    setResultPassword(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="staff-modal-backdrop" onClick={handleClose}>
      <div className="staff-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="staff-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(124, 58, 237, 0.12)',
                color: 'var(--color-primary-royal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <KeyRound size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-heading)' }}>
                Đặt Lại Mật Khẩu
              </h3>
            </div>
          </div>
          <button type="button" className="staff-modal-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="staff-modal-body">
          {/* Target user info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              borderRadius: 12,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div className="staff-avatar-initials" style={{ width: 44, height: 44, fontSize: 15 }}>
              {staff.fullName ? staff.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--text-heading)', fontSize: 14 }}>
                {staff.fullName}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                @{staff.username} • {staff.email}
              </div>
            </div>
          </div>

          {!resultPassword ? (
            <>
              <div className="staff-form-group">
                <label className="staff-form-label">
                  Mật khẩu mới tùy chọn <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Để trống nếu muốn sinh tự động)</span>
                </label>
                <input
                  type="text"
                  className="staff-form-input"
                  placeholder="VD: EduFlow@2026..."
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  style={isCustomPasswordTooShort ? { borderColor: '#ef4444' } : {}}
                />
                {isCustomPasswordTooShort && (
                  <span className="staff-form-error" style={{ marginTop: 4 }}>
                    Mật khẩu phải chứa ít nhất 6 ký tự (hoặc để trống để sinh tự động)
                  </span>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: 12,
                  borderRadius: 10,
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  fontSize: 12.5,
                  color: '#92400e',
                  lineHeight: 1.5,
                }}
              >
                <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  Sau khi đặt lại, nhân viên có thể sử dụng mật khẩu mới này để đăng nhập ngay lập tức. Hệ thống sẽ ghi nhận lịch sử thay đổi vào nhật ký bảo mật.
                </span>
              </div>
            </>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                padding: 16,
                borderRadius: 12,
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>
                Đã đặt lại mật khẩu thành công!
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-body)' }}>
                Mật khẩu tạm thời cho tài khoản <strong>{staff.username}</strong> là:
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#ffffff',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontWeight: 800,
                  fontSize: 16,
                  color: 'var(--color-primary-royal)',
                  fontFamily: 'var(--font-family-mono)',
                }}
              >
                <span>{resultPassword}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="staff-btn"
                  style={{
                    padding: '4px 10px',
                    fontSize: 12,
                    background: copied ? '#10b981' : '#f1f5f9',
                    color: copied ? '#fff' : 'var(--text-heading)',
                    border: 'none',
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="staff-modal-footer">
          <button type="button" className="staff-btn staff-btn-refresh" onClick={handleClose}>
            {resultPassword ? 'Đóng' : 'Hủy'}
          </button>
          {!resultPassword && (
            <button
              type="button"
              className="staff-btn staff-btn-primary"
              onClick={handleReset}
              disabled={isSubmitting || isCustomPasswordTooShort}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác Nhận Đặt Lại'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
