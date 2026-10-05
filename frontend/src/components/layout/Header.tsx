import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Shield,
} from 'lucide-react';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute breadcrumb title based on path
  const getBreadcrumbTitle = (pathname: string) => {
    if (pathname.includes('/leads')) return 'Tuyển sinh & Leads';
    if (pathname.includes('/tests')) return 'Lịch thi & Xếp lớp';
    if (pathname.includes('/classes')) return 'Quản lý Lớp học';
    if (pathname.includes('/reports')) return 'Báo cáo Doanh thu';
    if (pathname.includes('/staff')) return 'Đội ngũ Nhân sự';
    if (pathname.includes('/settings')) return 'Cài đặt Hệ thống';
    return 'Tổng quan';
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      {/* Dynamic Breadcrumbs */}
      <div className="header-breadcrumbs">
        <span className="breadcrumb-root">EduFlow</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{getBreadcrumbTitle(location.pathname)}</span>
      </div>

      {/* Actions: Search, Notifications, Profile */}
      <div className="header-actions-group">
        {/* Global Search Bar */}
        <div className="header-search-box" title="Tìm kiếm học viên, lớp học...">
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm học viên, lớp học..."
            aria-label="Tìm kiếm toàn hệ thống"
          />
          <kbd className="header-search-kbd">⌘K</kbd>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          className="header-icon-btn"
          aria-label="Thông báo hệ thống"
          title="3 thông báo mới"
        >
          <Bell size={18} />
          <span className="header-badge-dot" />
        </button>

        {/* User Profile Menu */}
        <div className="header-profile-menu-wrapper" ref={dropdownRef}>
          <button
            type="button"
            className="header-profile-trigger"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className="header-profile-avatar">
              {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
            </div>
            <span className="header-profile-name">{user?.fullName || user?.username}</span>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>

          {/* Profile Dropdown */}
          {dropdownOpen && (
            <div className="header-profile-dropdown" role="menu">
              <div style={{ padding: '6px 12px', borderBottom: '1px solid rgba(226, 232, 240, 0.7)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>
                  {user?.fullName || user?.username}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  {user?.email || 'admin@eduflow.edu.vn'}
                </div>
                <div style={{ marginTop: '4px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(124, 58, 237, 0.12)',
                      color: 'var(--color-primary-royal)',
                    }}
                  >
                    {user?.roleName || user?.role || 'ADMIN'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="header-dropdown-item"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/settings');
                }}
              >
                <User size={15} />
                <span>Hồ sơ cá nhân</span>
              </button>

              <button
                type="button"
                className="header-dropdown-item"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/settings');
                }}
              >
                <Shield size={15} />
                <span>Phân quyền & Bảo mật</span>
              </button>

              <div className="header-dropdown-divider" />

              <button
                type="button"
                className="header-dropdown-item danger"
                role="menuitem"
                onClick={handleLogout}
              >
                <LogOut size={15} />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
