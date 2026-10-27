import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Building2,
  Shield,
  KeyRound,
  Edit3,
  X,
  Lock,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AuthService } from '../../services/auth.service';
import type { UserRole } from '../../types/auth';
import defaultAvatarMale from '../../assets/avatars/default-avatar-male.jpg';
import profileCover from '../../assets/brand/profile-cover.jpg';
import './ProfilePage.css';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  // View Mode vs Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || 'Phong Phạm',
    phone: (user as any)?.phone || '0988 123 456',
    bio: (user as any)?.bio || 'Chuyên viên Tư vấn Tuyển sinh & Phát triển Đào tạo tại EduFlow CRM.',
  });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Password Change State (Default: Closed View Mode, only opens when requested)
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCancelPassword = () => {
    setIsChangingPassword(false);
    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordMsg(null);
  };

  // Copy contact feedback
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const currentRole = (user?.role || 'SALES') as UserRole;
  const currentRoleName = user?.roleName || user?.role || 'Chuyên viên';

  // Role Badge CSS modifier
  const getRoleClass = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'admin';
      case 'ACADEMIC':
        return 'academic';
      case 'TEACHER':
        return 'teacher';
      default:
        return 'sales';
    }
  };

  // Handle Save Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      const updatedUser = {
        ...user,
        fullName: formData.fullName,
        phone: formData.phone,
        bio: formData.bio,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    setIsEditing(false);
    setSaveSuccessMsg('Đã cập nhật thông tin hồ sơ thành công!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Handle Cancel Edit
  const handleCancelEdit = () => {
    setFormData({
      fullName: user?.fullName || 'Phong Phạm',
      phone: (user as any)?.phone || '0988 123 456',
      bio: (user as any)?.bio || 'Chuyên viên Tư vấn Tuyển sinh & Phát triển Đào tạo tại EduFlow CRM.',
    });
    setIsEditing(false);
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!passwordData.oldPassword || !passwordData.newPassword) {
      setPasswordMsg({ type: 'error', text: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới.' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Xác nhận mật khẩu mới không trùng khớp.' });
      return;
    }

    try {
      setPasswordLoading(true);
      await AuthService.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordMsg({ type: 'success', text: 'Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.' });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordMsg(null);
      }, 2500);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Đổi mật khẩu không thành công. Vui lòng kiểm tra lại mật khẩu cũ.';
      setPasswordMsg({ type: 'error', text: errorMsg });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2500);
  };



  return (
    <div className="profile-page-container">
      {/* Page Header */}
      <div className="profile-page-header">
        <h1 className="profile-page-title">Hồ sơ cá nhân</h1>
        <p className="profile-page-subtitle">
          Quản lý thông tin định danh, bảo mật và phân quyền vai trò tài khoản EduFlow CRM
        </p>
      </div>

      {saveSuccessMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 18px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '14px',
            color: '#065f46',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '20px',
          }}
        >
          <CheckCircle2 size={18} color="#10b981" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Layout Grid: Left Hero Card + Right Details Column */}
      <div className="profile-layout-grid">
        {/* ================================================================
            LEFT HERO PROFILE CARD (100% Noah Thompson Reference Layout)
            ================================================================ */}
        <div className="profile-hero-card">
          {/* Cover Banner */}
          <div
            className="profile-hero-cover"
            style={{ backgroundImage: `url(${profileCover})` }}
          >
            <button
              type="button"
              className="profile-cover-action-btn"
              onClick={() => setIsEditing(!isEditing)}
              title={isEditing ? 'Đóng chỉnh sửa' : 'Chỉnh sửa thông tin'}
            >
              <Edit3 size={13} />
              <span>{isEditing ? 'Đóng' : 'Chỉnh sửa'}</span>
            </button>
          </div>

          {/* Hero Card Body */}
          <div className="profile-hero-body">
            {/* Centered Avatar Overlapping the Banner Bottom Edge */}
            <div className="profile-hero-avatar-wrapper">
              <div className="profile-hero-avatar-ring">
                <img
                  src={defaultAvatarMale}
                  alt={formData.fullName}
                  className="profile-hero-avatar-img"
                />
              </div>
              <span className="profile-hero-status-dot" title="Tài khoản đang hoạt động" />
            </div>



            {/* User Name & Role Pill */}
            <h2 className="profile-hero-name">{formData.fullName}</h2>
            <div className={`profile-hero-role-pill ${getRoleClass(currentRole)}`}>
              {currentRoleName}
            </div>

            {/* Bio / Description */}
            <p className="profile-hero-bio">{formData.bio}</p>

            {/* Stats Capsule Pill Container (3 Columns with Dividers) */}
            <div className="profile-stats-capsule">
              <div className="profile-stat-col">
                <span className="profile-stat-val">142</span>
                <span className="profile-stat-lbl">Leads / Ca</span>
              </div>
              <div className="profile-stat-col">
                <span className="profile-stat-val">98%</span>
                <span className="profile-stat-lbl">SLA Phản hồi</span>
              </div>
              <div className="profile-stat-col">
                <span className="profile-stat-val">1.2 Năm</span>
                <span className="profile-stat-lbl">Thâm niên</span>
              </div>
            </div>

            {/* Bottom Quick Action Icons Row */}
            <div className="profile-quick-icons">
              <button
                type="button"
                className="profile-quick-icon-btn"
                title={`Sao chép Email: ${user?.email || 'phong.pham@eduflow.vn'}`}
                onClick={() => handleCopy(user?.email || 'phong.pham@eduflow.vn', 'Email')}
              >
                <Mail size={16} />
              </button>
              <button
                type="button"
                className="profile-quick-icon-btn"
                title={`Sao chép Số điện thoại: ${formData.phone}`}
                onClick={() => handleCopy(formData.phone, 'Số điện thoại')}
              >
                <Phone size={16} />
              </button>
              <button
                type="button"
                className="profile-quick-icon-btn"
                title="Bảo mật & Đổi mật khẩu"
                onClick={() => {
                  const secEl = document.getElementById('security-section');
                  secEl?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Shield size={16} />
              </button>
            </div>
            {copiedField && (
              <span style={{ fontSize: '11px', color: '#10b981', marginTop: '6px', fontWeight: 600 }}>
                Đã sao chép {copiedField}!
              </span>
            )}
          </div>
        </div>

        {/* ================================================================
            RIGHT COLUMN: DETAILS & SECURITY PANELS
            ================================================================ */}
        <div className="profile-details-column">
          {/* Card 1: Thông tin cá nhân (View Mode by Default / Edit Mode when clicked) */}
          <div className="profile-panel-card">
            <div className="profile-panel-header">
              <div className="profile-panel-title-wrapper">
                <div className="profile-panel-title-icon">
                  <User size={18} />
                </div>
                <h3 className="profile-panel-title">Thông tin cá nhân</h3>
              </div>

              {!isEditing ? (
                <button
                  type="button"
                  className="profile-cover-action-btn"
                  style={{ position: 'static' }}
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 size={13} />
                  <span>Chỉnh sửa hồ sơ</span>
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 14px',
                      borderRadius: '9999px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#64748b',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <X size={13} />
                    <span>Hủy</span>
                  </button>
                </div>
              )}
            </div>

            {/* View Mode (Default: Read-only format) */}
            {!isEditing ? (
              <div className="profile-info-grid">
                <div className="profile-info-item">
                  <div className="profile-info-icon">
                    <User size={18} />
                  </div>
                  <div className="profile-info-content">
                    <span className="profile-info-label">Họ và tên</span>
                    <span className="profile-info-val">{formData.fullName}</span>
                  </div>
                </div>

                <div className="profile-info-item">
                  <div className="profile-info-icon">
                    <Shield size={18} />
                  </div>
                  <div className="profile-info-content">
                    <span className="profile-info-label">Tên đăng nhập</span>
                    <span className="profile-info-val">@{user?.username || 'phongphm'}</span>
                  </div>
                </div>

                <div className="profile-info-item">
                  <div className="profile-info-icon">
                    <Mail size={18} />
                  </div>
                  <div className="profile-info-content">
                    <span className="profile-info-label">Email công vụ</span>
                    <span className="profile-info-val">{user?.email || 'phong.pham@eduflow.vn'}</span>
                  </div>
                </div>

                <div className="profile-info-item">
                  <div className="profile-info-icon">
                    <Phone size={18} />
                  </div>
                  <div className="profile-info-content">
                    <span className="profile-info-label">Số điện thoại</span>
                    <span className="profile-info-val">{formData.phone}</span>
                  </div>
                </div>

                <div className="profile-info-item">
                  <div className="profile-info-icon">
                    <Building2 size={18} />
                  </div>
                  <div className="profile-info-content">
                    <span className="profile-info-label">Phòng ban & Vai trò</span>
                    <span className="profile-info-val">{currentRoleName}</span>
                  </div>
                </div>

                <div className="profile-info-item">
                  <div className="profile-info-icon">
                    <Calendar size={18} />
                  </div>
                  <div className="profile-info-content">
                    <span className="profile-info-label">Ngày tham gia hệ thống</span>
                    <span className="profile-info-val">
                      {(user as any)?.createdAt
                        ? new Date((user as any).createdAt).toLocaleDateString('vi-VN')
                        : '15/10/2022'}
                    </span>
                  </div>
                </div>

                <div className="profile-info-item" style={{ gridColumn: 'span 2' }}>
                  <div className="profile-info-icon">
                    <Layers size={18} />
                  </div>
                  <div className="profile-info-content">
                    <span className="profile-info-label">Giới thiệu & Ghi chú công tác</span>
                    <span className="profile-info-val" style={{ fontWeight: 500, fontSize: '13.5px' }}>
                      {formData.bio}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Edit Mode (Inputs activated only when clicking Edit) */
              <form onSubmit={handleSaveProfile}>
                <div className="profile-edit-grid">
                  <div className="profile-form-group">
                    <label className="profile-form-label">Họ và tên</label>
                    <input
                      type="text"
                      className="profile-form-input"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Số điện thoại</label>
                    <input
                      type="text"
                      className="profile-form-input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Tên đăng nhập</label>
                    <input
                      type="text"
                      className="profile-form-input"
                      value={`@${user?.username || 'phongphm'}`}
                      disabled
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Email công vụ</label>
                    <input
                      type="email"
                      className="profile-form-input"
                      value={user?.email || 'phong.pham@eduflow.vn'}
                      disabled
                    />
                  </div>

                  <div className="profile-form-group full-width">
                    <label className="profile-form-label">Giới thiệu / Ghi chú công tác</label>
                    <textarea
                      className="profile-form-input"
                      rows={3}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    />
                  </div>
                </div>

                <div className="profile-edit-actions">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#475569',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '13.5px',
                    }}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 24px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'var(--brand-gradient, linear-gradient(135deg, #7c3aed 0%, #ec4899 100%))',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '13.5px',
                      boxShadow: '0 6px 18px rgba(124, 58, 237, 0.3)',
                    }}
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Card 2: Bảo mật & Đổi mật khẩu (Closed View Mode by default) */}
          <div className="profile-panel-card" id="security-section">
            <div className="profile-panel-header">
              <div className="profile-panel-title-wrapper">
                <div className="profile-panel-title-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                  <KeyRound size={18} />
                </div>
                <h3 className="profile-panel-title">Bảo mật & Mật khẩu</h3>
              </div>

              {!isChangingPassword ? (
                <button
                  type="button"
                  className="profile-cover-action-btn"
                  style={{ position: 'static' }}
                  onClick={() => setIsChangingPassword(true)}
                >
                  <KeyRound size={13} />
                  <span>Đổi mật khẩu</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCancelPassword}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <X size={13} />
                  <span>Hủy</span>
                </button>
              )}
            </div>

            {passwordMsg && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  background: passwordMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: passwordMsg.type === 'success' ? '#065f46' : '#991b1b',
                  border: `1px solid ${passwordMsg.type === 'success' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                }}
              >
                {passwordMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            {!isChangingPassword ? (
              /* Security View Mode (Default: Overview, no open input fields) */
              <div className="profile-info-grid">
                <div className="profile-info-item">
                  <div className="profile-info-icon" style={{ color: '#ef4444' }}>
                    <Lock size={18} />
                  </div>
                  <div className="profile-info-content">
                    <span className="profile-info-label">Mật khẩu đăng nhập</span>
                    <span className="profile-info-val" style={{ letterSpacing: '0.15em' }}>••••••••••••</span>
                  </div>
                </div>

                <div className="profile-info-item">
                  <div className="profile-info-icon" style={{ color: '#10b981' }}>
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="profile-info-content">
                    <span className="profile-info-label">Trạng thái bảo mật</span>
                    <span className="profile-info-val" style={{ color: '#059669', fontSize: '13.5px' }}>
                      Độ bảo mật cao • Đã được bảo vệ an toàn
                    </span>
                  </div>
                </div>

                <div className="profile-info-item" style={{ gridColumn: 'span 2' }}>
                  <div className="profile-info-icon" style={{ color: '#3b82f6' }}>
                    <Shield size={18} />
                  </div>
                  <div className="profile-info-content">
                    <span className="profile-info-label">Phiên đăng nhập</span>
                    <span className="profile-info-val" style={{ fontWeight: 500, fontSize: '13.5px' }}>
                      Tự động đăng xuất sau 24 giờ không hoạt động để bảo vệ tài khoản.
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Password Change Form (Only displayed when user actively clicks "Đổi mật khẩu") */
              <form onSubmit={handleChangePassword} className="profile-security-form">
                <div className="profile-edit-grid" style={{ marginBottom: 0 }}>
                  <div className="profile-form-group">
                    <label className="profile-form-label">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      className="profile-form-input"
                      placeholder="Nhập mật khẩu đang dùng"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                      required
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Mật khẩu mới (Tối thiểu 6 ký tự)</label>
                    <input
                      type="password"
                      className="profile-form-input"
                      placeholder="Nhập mật khẩu mới"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                    />
                  </div>

                  <div className="profile-form-group full-width">
                    <label className="profile-form-label">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      className="profile-form-input"
                      placeholder="Nhập lại mật khẩu mới"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
                  <button
                    type="button"
                    onClick={handleCancelPassword}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#475569',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '13.5px',
                    }}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '12px',
                      border: 'none',
                      background: '#0f172a',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: passwordLoading ? 'not-allowed' : 'pointer',
                      fontSize: '13.5px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
                    }}
                  >
                    <Lock size={14} />
                    <span>{passwordLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
