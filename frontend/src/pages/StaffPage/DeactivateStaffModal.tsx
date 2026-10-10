import React from 'react';
import { X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { StaffMember } from '../../types/staff';

interface DeactivateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
}

export const DeactivateStaffModal: React.FC<DeactivateStaffModalProps> = ({
  isOpen,
  onClose,
  staff,
  onConfirm,
  isSubmitting,
}) => {
  if (!isOpen || !staff) return null;

  const isLocking = staff.isActive;

  return (
    <div className="staff-modal-backdrop" onClick={onClose}>
      <div className="staff-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="staff-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: isLocking ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                color: isLocking ? '#dc2626' : '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isLocking ? <ShieldAlert size={20} /> : <CheckCircle2 size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-heading)' }}>
                {isLocking ? 'Khóa Tài Khoản Nhân Viên' : 'Mở Khóa Tài Khoản Nhân Viên'}
              </h3>
            </div>
          </div>
          <button type="button" className="staff-modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="staff-modal-body">
          <div
            style={{
              padding: 14,
              borderRadius: 12,
              background: isLocking ? 'rgba(239, 68, 68, 0.06)' : 'rgba(16, 185, 129, 0.06)',
              border: isLocking ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
              fontSize: 13.5,
              color: 'var(--text-heading)',
              lineHeight: 1.5,
            }}
          >
            {isLocking ? (
              <>
                Bạn có chắc chắn muốn khóa tài khoản của <strong>{staff.fullName}</strong> (@{staff.username})?
                <br /><br />
                <span style={{ fontSize: 12.5, color: '#b91c1c' }}>
                  Khi bị khóa, nhân viên này sẽ lập tức bị đăng xuất khỏi hệ thống và không thể đăng nhập cho đến khi được mở khóa lại.
                </span>
              </>
            ) : (
              <>
                Bạn có chắc chắn muốn kích hoạt lại tài khoản của <strong>{staff.fullName}</strong> (@{staff.username})?
                <br /><br />
                <span style={{ fontSize: 12.5, color: '#047857' }}>
                  Sau khi mở khóa, nhân viên sẽ có thể đăng nhập bình thường với mật khẩu hiện tại.
                </span>
              </>
            )}
          </div>
        </div>

        <div className="staff-modal-footer">
          <button
            type="button"
            className="staff-btn staff-btn-refresh"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            type="button"
            className={`staff-btn ${isLocking ? 'staff-btn-primary' : 'staff-btn-primary'}`}
            style={
              isLocking
                ? { background: '#ef4444', borderColor: '#dc2626', color: '#fff', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)' }
                : { background: '#10b981', borderColor: '#059669', color: '#fff', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }
            }
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Đang xử lý...'
              : isLocking
              ? 'Xác Nhận Khóa Tài Khoản'
              : 'Xác Nhận Mở Khóa'}
          </button>
        </div>
      </div>
    </div>
  );
};
