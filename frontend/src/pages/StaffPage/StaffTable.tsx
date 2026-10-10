import React from 'react';
import {
  Edit3,
  KeyRound,
  Lock,
  Unlock,
  Trash2,
  Mail,
  Phone,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Shield,
  Briefcase,
  GraduationCap,
  School,
} from 'lucide-react';
import type { StaffMember, StaffRole, StaffPagination } from '../../types/staff';

interface StaffTableProps {
  staffs: StaffMember[];
  pagination: StaffPagination;
  onPageChange: (newPage: number) => void;
  onViewDetail: (staff: StaffMember) => void;
  onEdit: (staff: StaffMember) => void;
  onResetPassword: (staff: StaffMember) => void;
  onToggleStatus: (staff: StaffMember) => void;
  onDelete: (staff: StaffMember) => void;
  currentUserId?: number;
}

export const StaffTable: React.FC<StaffTableProps> = ({
  staffs,
  pagination,
  onPageChange,
  onViewDetail,
  onEdit,
  onResetPassword,
  onToggleStatus,
  onDelete,
  currentUserId,
}) => {
  const getRoleBadge = (roleCode: StaffRole, roleName: string) => {
    switch (roleCode) {
      case 'ADMIN':
        return (
          <span className="badge-role badge-role-admin">
            <Shield size={12} />
            {roleName || 'Quản lý'}
          </span>
        );
      case 'SALES':
        return (
          <span className="badge-role badge-role-sales">
            <Briefcase size={12} />
            {roleName || 'Tư vấn'}
          </span>
        );
      case 'ACADEMIC':
        return (
          <span className="badge-role badge-role-academic">
            <GraduationCap size={12} />
            {roleName || 'Giáo vụ'}
          </span>
        );
      case 'TEACHER':
        return (
          <span className="badge-role badge-role-teacher">
            <School size={12} />
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

  if (staffs.length === 0) {
    return (
      <div className="staff-table-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-subtle)', marginBottom: 12 }}>
          <Briefcase size={40} style={{ opacity: 0.4 }} />
        </div>
        <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>
          Không tìm thấy nhân sự phù hợp
        </h4>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Thử thay đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc vai trò.
        </p>
      </div>
    );
  }

  return (
    <div className="staff-table-card">
      <div style={{ overflowX: 'auto' }}>
        <table className="staff-table">
          <thead>
            <tr>
              <th>Nhân Sự</th>
              <th>Vai Trò</th>
              <th>Thông Tin Liên Hệ</th>
              <th>Trạng Thái</th>
              <th>Lớp Phụ Trách</th>
              <th style={{ textAlign: 'right' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {staffs.map((staff) => {
              const isCurrentUser = currentUserId === staff.id;

              return (
                <tr
                  key={staff.id}
                  className="staff-table-row-clickable"
                  onClick={() => onViewDetail(staff)}
                  title="Nhấp để xem hồ sơ chi tiết nhân sự"
                >
                  {/* Nhân viên */}
                  <td>
                    <div className="staff-user-cell">
                      <div className="staff-avatar-initials">
                        {getInitials(staff.fullName)}
                      </div>
                      <div className="staff-user-names">
                        <span className="staff-user-fullname">
                          {staff.fullName}
                          {isCurrentUser && (
                            <span
                              style={{
                                marginLeft: 6,
                                fontSize: 10,
                                fontWeight: 800,
                                background: 'rgba(124, 58, 237, 0.1)',
                                color: 'var(--color-primary-royal)',
                                padding: '2px 6px',
                                borderRadius: 4,
                              }}
                            >
                              BẠN
                            </span>
                          )}
                        </span>
                        <span className="staff-user-username">@{staff.username}</span>
                      </div>
                    </div>
                  </td>

                  {/* Vai trò */}
                  <td>{getRoleBadge(staff.roleCode, staff.roleName)}</td>

                  {/* Liên hệ */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                        <Mail size={13} style={{ color: 'var(--text-subtle)' }} />
                        <span>{staff.email}</span>
                      </div>
                      {staff.phoneNumber && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                          <Phone size={13} style={{ color: 'var(--text-subtle)' }} />
                          <span>{staff.phoneNumber}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Trạng thái */}
                  <td>
                    {staff.isActive ? (
                      <span className="badge-status badge-status-active">
                        <span className="status-dot status-dot-active" />
                        Đang hoạt động
                      </span>
                    ) : (
                      <span className="badge-status badge-status-locked">
                        <span className="status-dot status-dot-locked" />
                        Đã khóa
                      </span>
                    )}
                  </td>

                  {/* Lớp phụ trách */}
                  <td>
                    {staff.assignedClassesCount > 0 ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--color-primary-royal)',
                          background: 'rgba(124, 58, 237, 0.08)',
                          padding: '3px 9px',
                          borderRadius: 6,
                        }}
                      >
                        <BookOpen size={13} />
                        {staff.assignedClassesCount} lớp học
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>—</span>
                    )}
                  </td>

                  {/* Thao tác */}
                  <td>
                    <div
                      className="staff-row-actions"
                      style={{ justifyContent: 'flex-end' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="staff-action-btn"
                        title="Chỉnh sửa hồ sơ"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(staff);
                        }}
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        type="button"
                        className="staff-action-btn"
                        title="Đặt lại mật khẩu"
                        onClick={(e) => {
                          e.stopPropagation();
                          onResetPassword(staff);
                        }}
                      >
                        <KeyRound size={15} />
                      </button>

                      {!isCurrentUser && (
                        <button
                          type="button"
                          className="staff-action-btn"
                          title={staff.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStatus(staff);
                          }}
                          style={!staff.isActive ? { color: '#059669', borderColor: '#a7f3d0' } : {}}
                        >
                          {staff.isActive ? <Lock size={15} /> : <Unlock size={15} />}
                        </button>
                      )}

                      {!isCurrentUser && (
                        <button
                          type="button"
                          className="staff-action-btn btn-danger"
                          title="Xóa tài khoản"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(staff);
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div
          style={{
            padding: '14px 20px',
            borderTop: 'var(--glass-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(248, 250, 252, 0.5)',
          }}
        >
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            Hiển thị <strong>{staffs.length}</strong> / <strong>{pagination.total}</strong> nhân sự
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              className="staff-action-btn"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              style={pagination.page <= 1 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
            >
              <ChevronLeft size={16} />
            </button>

            <span style={{ fontSize: 12.5, fontWeight: 700, padding: '0 8px', color: 'var(--text-heading)' }}>
              Trang {pagination.page} / {pagination.totalPages}
            </span>

            <button
              type="button"
              className="staff-action-btn"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              style={pagination.page >= pagination.totalPages ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
