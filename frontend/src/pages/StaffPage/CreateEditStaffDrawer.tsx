import React, { useState, useEffect } from 'react';
import { X, Save, UserCheck, Award } from 'lucide-react';
import type { StaffMember, StaffRole, CreateStaffPayload, UpdateStaffPayload } from '../../types/staff';

interface CreateEditStaffDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStaffPayload | UpdateStaffPayload, isEdit: boolean) => Promise<void>;
  editingStaff?: StaffMember | null;
  isSubmitting: boolean;
  currentUserId?: number;
}

export const CreateEditStaffDrawer: React.FC<CreateEditStaffDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingStaff,
  isSubmitting,
  currentUserId,
}) => {
  const isSelf = Boolean(currentUserId && editingStaff && currentUserId === editingStaff.id);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [roleCode, setRoleCode] = useState<StaffRole>('SALES');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [isNative, setIsNative] = useState(false);
  const [bio, setBio] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingStaff) {
      setFullName(editingStaff.fullName || '');
      setUsername(editingStaff.username || '');
      setEmail(editingStaff.email || '');
      setPhoneNumber(editingStaff.phoneNumber || '');
      setRoleCode(editingStaff.roleCode || 'SALES');
      setPassword('');
      setSpecialization(editingStaff.specialization || '');
      setIsNative(Boolean(editingStaff.isNative));
      setBio(editingStaff.bio || '');
    } else {
      setFullName('');
      setUsername('');
      setEmail('');
      setPhoneNumber('');
      setRoleCode('SALES');
      setPassword('');
      setSpecialization('');
      setIsNative(false);
      setBio('');
    }
    setErrors({});
  }, [editingStaff, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Vui lòng nhập họ và tên';
    if (!editingStaff) {
      if (!username.trim()) errs.username = 'Vui lòng nhập tên đăng nhập';
      else if (!/^[a-zA-Z0-9_.]+$/.test(username.trim())) {
        errs.username = 'Tên đăng nhập chỉ chứa chữ, số, dấu gạch dưới hoặc chấm';
      }
    }
    if (!email.trim()) errs.email = 'Vui lòng nhập địa chỉ email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Địa chỉ email không đúng định dạng';
    }
    const cleanPhone = phoneNumber.trim().replace(/[\s.-]/g, '');
    if (cleanPhone && !/^[0-9]{9,15}$/.test(cleanPhone)) {
      errs.phoneNumber = 'Số điện thoại gồm 9 - 15 chữ số';
    }
    if (!editingStaff && password && password.length < 6) {
      errs.password = 'Mật khẩu phải chứa ít nhất 6 ký tự';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const cleanPhone = phoneNumber.trim().replace(/[\s.-]/g, '');

    if (editingStaff) {
      const payload: UpdateStaffPayload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: cleanPhone,
        roleCode: isSelf ? undefined : roleCode,
        specialization: specialization.trim(),
        isNative,
        bio: bio.trim(),
      };
      await onSubmit(payload, true);
    } else {
      const payload: CreateStaffPayload = {
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        phoneNumber: cleanPhone || undefined,
        roleCode,
        password: password.trim() || undefined,
        specialization: specialization.trim() || undefined,
        isNative,
        bio: bio.trim() || undefined,
      };
      await onSubmit(payload, false);
    }
  };


  return (
    <div className="staff-drawer-backdrop" onClick={onClose}>
      <div className="staff-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="staff-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--brand-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <UserCheck size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-heading)' }}>
                {editingStaff ? 'Cập Nhật Hồ Sơ Nhân Sự' : 'Thêm Mới Nhân Sự'}
              </h3>
            </div>
          </div>
          <button type="button" className="staff-modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="staff-drawer-body">
            {/* Họ và tên */}
            <div className="staff-form-group">
              <label className="staff-form-label">
                Họ và Tên <span className="req">*</span>
              </label>
              <input
                type="text"
                className="staff-form-input"
                placeholder="VD: David Miller, Lê Minh Tuấn..."
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              {errors.fullName && <span className="staff-form-error">{errors.fullName}</span>}
            </div>

            {/* Tên đăng nhập */}
            <div className="staff-form-group">
              <label className="staff-form-label">
                Tên Đăng Nhập {!editingStaff && <span className="req">*</span>}
              </label>
              <input
                type="text"
                className="staff-form-input"
                placeholder="VD: david_miller, tuanlm..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={Boolean(editingStaff)}
                style={editingStaff ? { background: '#f1f5f9', cursor: 'not-allowed' } : {}}
              />
              {errors.username && <span className="staff-form-error">{errors.username}</span>}
              {editingStaff && (
                <span style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>
                  Không thể thay đổi tên đăng nhập của tài khoản đã tồn tại.
                </span>
              )}
            </div>

            {/* Vai trò */}
            <div className="staff-form-group">
              <label className="staff-form-label">
                Vai Trò <span className="req">*</span>
              </label>
              <select
                className="staff-form-select"
                value={roleCode}
                onChange={(e) => setRoleCode(e.target.value as StaffRole)}
                disabled={isSelf}
                style={isSelf ? { background: '#f1f5f9', cursor: 'not-allowed' } : {}}
              >
                <option value="ADMIN">Quản trị viên (Admin)</option>
                <option value="SALES">Tư vấn viên (Sales)</option>
                <option value="ACADEMIC">Giáo vụ (Academic)</option>
                <option value="TEACHER">Giảng viên (Teacher)</option>
              </select>
              {isSelf && (
                <span style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>
                  Không thể tự thay đổi vai trò của chính tài khoản đang đăng nhập.
                </span>
              )}
            </div>

            {/* Email & Số điện thoại */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="staff-form-group">
                <label className="staff-form-label">
                  Email <span className="req">*</span>
                </label>
                <input
                  type="email"
                  className="staff-form-input"
                  placeholder="name@eduflow.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && <span className="staff-form-error">{errors.email}</span>}
              </div>

              <div className="staff-form-group">
                <label className="staff-form-label">Số Điện Thoại</label>
                <input
                  type="tel"
                  className="staff-form-input"
                  placeholder="0912 345 678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                {errors.phoneNumber && <span className="staff-form-error">{errors.phoneNumber}</span>}
              </div>
            </div>

            {/* Mật khẩu khởi tạo (Chỉ khi tạo mới) */}
            {!editingStaff && (
              <div className="staff-form-group">
                <label className="staff-form-label">
                  Mật Khẩu Khởi Tạo <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Tùy chọn)</span>
                </label>
                <input
                  type="password"
                  className="staff-form-input"
                  placeholder="Mặc định: EduFlow@2026 nếu để trống"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {errors.password && <span className="staff-form-error">{errors.password}</span>}
                <span style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>
                  Nếu để trống, hệ thống sẽ cấp mật khẩu mặc định <strong>EduFlow@2026</strong>.
                </span>
              </div>
            )}

            {/* Khu vực chuyên môn Giảng viên (Hiển thị khi chọn TEACHER hoặc ACADEMIC) */}
            {(roleCode === 'TEACHER' || roleCode === 'ACADEMIC') && (
              <div
                style={{
                  background: 'rgba(124, 58, 237, 0.04)',
                  border: '1px solid rgba(124, 58, 237, 0.2)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 13, color: 'var(--color-primary-royal)' }}>
                    <Award size={16} />
                    Hồ Sơ Chuyên Môn Giảng Dạy
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isNative}
                      onChange={(e) => setIsNative(e.target.checked)}
                      style={{ accentColor: 'var(--color-primary-royal)' }}
                    />
                    Giảng viên bản ngữ (Native)
                  </label>
                </div>

                <div className="staff-form-group">
                  <label className="staff-form-label">Trình Độ / Chứng Chỉ / Chuyên Môn</label>
                  <input
                    type="text"
                    className="staff-form-input"
                    placeholder="VD: IELTS 8.5 & Writing, TOEIC 990 Master..."
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                  />
                </div>

                <div className="staff-form-group">
                  <label className="staff-form-label">Tóm Tắt Kinh Nghiệm (Bio)</label>
                  <textarea
                    rows={2}
                    className="staff-form-textarea"
                    placeholder="VD: 8 năm kinh nghiệm giảng dạy luyện thi Cambridge và IELTS..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="staff-drawer-footer">
            <button
              type="button"
              className="staff-btn staff-btn-refresh"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="staff-btn staff-btn-primary"
              disabled={isSubmitting}
            >
              <Save size={15} />
              {isSubmitting ? 'Đang lưu...' : editingStaff ? 'Cập Nhật Hồ Sơ' : 'Xác Nhận Tạo Nhân Viên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
