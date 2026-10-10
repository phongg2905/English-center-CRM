import React from 'react';
import {
  X,
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  Briefcase,
  GraduationCap,
  School,
  BookOpen,
  MapPin,
  Users,
  Edit3,
  KeyRound,
  Lock,
  Unlock,
  Globe,
  Award,
  RefreshCw,
} from 'lucide-react';
import type { StaffMember, StaffRole } from '../../types/staff';

interface StaffDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;
  isLoading?: boolean;
  onEdit?: (staff: StaffMember) => void;
  onResetPassword?: (staff: StaffMember) => void;
  onToggleStatus?: (staff: StaffMember) => void;
  isCurrentUser?: boolean;
}

export const StaffDetailModal: React.FC<StaffDetailModalProps> = ({
  isOpen,
  onClose,
  staff,
  isLoading = false,
  onEdit,
  onResetPassword,
  onToggleStatus,
  isCurrentUser = false,
}) => {
  if (!isOpen || !staff) return null;

  const getRoleBadge = (roleCode: StaffRole, roleName: string) => {
    switch (roleCode) {
      case 'ADMIN':
        return (
          <span className="badge-role badge-role-admin">
            <Shield size={13} />
            {roleName || 'Quản lý'}
          </span>
        );
      case 'SALES':
        return (
          <span className="badge-role badge-role-sales">
            <Briefcase size={13} />
            {roleName || 'Tư vấn viên'}
          </span>
        );
      case 'ACADEMIC':
        return (
          <span className="badge-role badge-role-academic">
            <GraduationCap size={13} />
            {roleName || 'Giáo vụ'}
          </span>
        );
      case 'TEACHER':
        return (
          <span className="badge-role badge-role-teacher">
            <School size={13} />
            {roleName || 'Giảng viên'}
          </span>
        );
      default:
        return <span className="badge-role">{roleName || roleCode}</span>;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'EF';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="staff-modal-backdrop" onClick={onClose}>
      <div
        className="staff-modal-dialog staff-detail-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '92%' }}
      >
        {/* Modal Top Header */}
        <div className="staff-modal-header" style={{ padding: '16px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Hồ Sơ Nhân Sự
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                background: 'rgba(124, 58, 237, 0.08)',
                color: 'var(--color-primary-royal)',
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              #STF-{String(staff.id).padStart(3, '0')}
            </span>
            {isLoading && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <RefreshCw size={11} className="spin-icon" /> Đang đồng bộ...
              </span>
            )}
          </div>

          <button
            type="button"
            className="staff-modal-close-btn"
            onClick={onClose}
            title="Đóng cửa sổ"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          className="staff-modal-body"
          style={{
            maxHeight: 'calc(85vh - 130px)',
            overflowY: 'auto',
            padding: '22px',
            gap: '18px',
          }}
        >
          {/* Profile Hero Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              padding: '18px',
              background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.95), rgba(241, 245, 249, 0.8))',
              border: 'var(--glass-border-subtle)',
              borderRadius: 'var(--radius-lg)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: 'var(--radius-pill)',
                background: 'var(--brand-gradient)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)',
              }}
            >
              {getInitials(staff.fullName)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: 'var(--text-heading)',
                    margin: 0,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {staff.fullName}
                </h3>
                {isCurrentUser && (
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      background: 'rgba(124, 58, 237, 0.12)',
                      color: 'var(--color-primary-royal)',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    BẠN
                  </span>
                )}
              </div>

              <div style={{ fontSize: 13, color: 'var(--text-subtle)', marginBottom: 8, fontWeight: 500 }}>
                @{staff.username}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {getRoleBadge(staff.roleCode, staff.roleName)}

                {staff.isActive ? (
                  <span className="badge-status badge-status-active">
                    <span className="status-dot status-dot-active" />
                    Đang hoạt động
                  </span>
                ) : (
                  <span className="badge-status badge-status-locked">
                    <span className="status-dot status-dot-locked" />
                    Tài khoản đã khóa
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 1: Thông tin liên hệ & Hệ thống */}
          <div
            style={{
              background: '#ffffff',
              border: 'var(--glass-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 18px',
            }}
          >
            <h4
              style={{
                fontSize: 12.5,
                fontWeight: 800,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Users size={14} />
              Thông Tin Liên Hệ & Quản Trị
            </h4>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 14,
              }}
            >
              <div>
                <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', fontWeight: 600, marginBottom: 2 }}>
                  Địa chỉ Email
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 600 }}>
                  <Mail size={14} color="#7c3aed" />
                  <a
                    href={`mailto:${staff.email}`}
                    style={{ color: 'var(--text-heading)', textDecoration: 'none' }}
                    title="Gửi email"
                  >
                    {staff.email}
                  </a>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', fontWeight: 600, marginBottom: 2 }}>
                  Số điện thoại
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 600 }}>
                  <Phone size={14} color="#10b981" />
                  {staff.phoneNumber ? (
                    <a
                      href={`tel:${staff.phoneNumber}`}
                      style={{ color: 'var(--text-heading)', textDecoration: 'none' }}
                      title="Gọi điện"
                    >
                      {staff.phoneNumber}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-subtle)', fontWeight: 500 }}>Chưa cập nhật</span>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', fontWeight: 600, marginBottom: 2 }}>
                  Ngày tạo tài khoản
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>
                  <Calendar size={14} color="#3b82f6" />
                  {formatDate(staff.createdAt)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', fontWeight: 600, marginBottom: 2 }}>
                  Cập nhật gần nhất
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>
                  <Clock size={14} color="#f59e0b" />
                  {formatDate(staff.updatedAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Thông tin chuyên môn & Học thuật (Nếu có) */}
          {(staff.roleCode === 'TEACHER' || staff.specialization || staff.bio) && (
            <div
              style={{
                background: '#ffffff',
                border: 'var(--glass-border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 18px',
              }}
            >
              <h4
                style={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Award size={14} />
                Hồ Sơ Chuyên Môn & Giảng Dạy
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  {staff.specialization && (
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', fontWeight: 600, marginBottom: 2 }}>
                        Chuyên môn / Chứng chỉ
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-primary-royal)' }}>
                        {staff.specialization}
                      </div>
                    </div>
                  )}

                  {staff.roleCode === 'TEACHER' && (
                    <div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', fontWeight: 600, marginBottom: 2 }}>
                        Phân loại giảng viên
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>
                        <Globe size={14} color="#059669" />
                        {staff.isNative ? 'Giảng viên Bản Ngữ (Native)' : 'Giảng viên Việt Nam'}
                      </div>
                    </div>
                  )}
                </div>

                {staff.bio && (
                  <div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', fontWeight: 600, marginBottom: 4 }}>
                      Tiểu sử & Giới thiệu
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        lineHeight: 1.55,
                        color: 'var(--text-body)',
                        background: 'rgba(248, 250, 252, 0.8)',
                        padding: '10px 14px',
                        borderRadius: 6,
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                      }}
                    >
                      {staff.bio}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Lớp học đang phụ trách */}
          <div
            style={{
              background: '#ffffff',
              border: 'var(--glass-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h4
                style={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <BookOpen size={14} />
                Lớp Học Đang Phụ Trách
              </h4>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--color-primary-royal)',
                  background: 'rgba(124, 58, 237, 0.08)',
                  padding: '2px 8px',
                  borderRadius: 12,
                }}
              >
                {staff.assignedClasses?.length || staff.assignedClassesCount || 0} lớp
              </span>
            </div>

            {staff.assignedClasses && staff.assignedClasses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {staff.assignedClasses.map((cls) => (
                  <div
                    key={cls.id}
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(248, 250, 252, 0.9)',
                      border: '1px solid rgba(226, 232, 240, 0.9)',
                      borderRadius: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-heading)' }}>
                        <span style={{ color: 'var(--color-primary-royal)', marginRight: 6 }}>[{cls.classCode}]</span>
                        {cls.className}
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: cls.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: cls.status === 'ACTIVE' ? '#059669' : '#d97706',
                        }}
                      >
                        {cls.status === 'ACTIVE' ? 'Đang diễn ra' : cls.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
                      <span>Khóa học: <strong style={{ color: 'var(--text-heading)' }}>{cls.courseName}</strong></span>
                      <span>Lịch học: <strong style={{ color: 'var(--text-heading)' }}>{cls.scheduleDays} ({cls.timeSlot})</strong></span>
                      {cls.room && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} color="#7c3aed" />
                          Phòng: <strong style={{ color: 'var(--text-heading)' }}>{cls.room}</strong>
                        </span>
                      )}
                      <span>Sĩ số: <strong style={{ color: 'var(--text-heading)' }}>{cls.currentEnrolled}/{cls.maxCapacity}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px 16px',
                  background: 'rgba(248, 250, 252, 0.6)',
                  borderRadius: 8,
                  border: '1px dashed rgba(203, 213, 225, 0.8)',
                  color: 'var(--text-subtle)',
                  fontSize: 13,
                }}
              >
                Nhân sự hiện tại chưa được phân công phụ trách lớp học nào.
              </div>
            )}
          </div>
        </div>

        {/* Modal Action Footer */}
        <div
          className="staff-modal-footer"
          style={{
            padding: '14px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          {/* Quick Actions (Left) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {onEdit && (
              <button
                type="button"
                className="staff-btn staff-btn-refresh"
                style={{ padding: '7px 12px', fontSize: 12.5 }}
                onClick={() => {
                  onClose();
                  onEdit(staff);
                }}
                title="Chỉnh sửa hồ sơ"
              >
                <Edit3 size={14} />
                Chỉnh Sửa
              </button>
            )}

            {onResetPassword && (
              <button
                type="button"
                className="staff-btn staff-btn-refresh"
                style={{ padding: '7px 12px', fontSize: 12.5 }}
                onClick={() => {
                  onClose();
                  onResetPassword(staff);
                }}
                title="Đặt lại mật khẩu"
              >
                <KeyRound size={14} />
                Đổi Mật Khẩu
              </button>
            )}

            {!isCurrentUser && onToggleStatus && (
              <button
                type="button"
                className="staff-btn staff-btn-refresh"
                style={{
                  padding: '7px 12px',
                  fontSize: 12.5,
                  color: staff.isActive ? '#dc2626' : '#059669',
                  borderColor: staff.isActive ? '#fecaca' : '#a7f3d0',
                }}
                onClick={() => {
                  onClose();
                  onToggleStatus(staff);
                }}
                title={staff.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
              >
                {staff.isActive ? <Lock size={14} /> : <Unlock size={14} />}
                {staff.isActive ? 'Khóa TK' : 'Mở Khóa'}
              </button>
            )}
          </div>

          {/* Close button (Right) */}
          <button
            type="button"
            className="staff-btn staff-btn-primary"
            style={{ padding: '7px 18px', fontSize: 13 }}
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
