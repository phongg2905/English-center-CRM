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
import { NotificationDropdown } from './NotificationDropdown';
import { useNotificationCenter } from '../../hooks/useNotificationCenter';
import defaultAvatarMale from '../../assets/avatars/default-avatar-male.jpg';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Realtime Notification State & Background Polling
  const {
    notifications,
    unreadCount,
    readIds,
    isLoading: isNotifLoading,
    markAsRead,
    markAllAsRead,
  } = useNotificationCenter();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute page title based on path
  const getPageTitle = (pathname: string) => {
    if (pathname.includes('/leads')) return 'Leads';
    if (pathname.includes('/tests')) return 'Lịch Thi & Xếp Lớp';
    if (pathname.includes('/classes')) return 'Quản Lý Lớp Học';
    if (pathname.includes('/reports')) return 'Báo Cáo Doanh Thu';
    if (pathname.includes('/staff')) return 'Quản Lý Nhân Sự & Giảng Viên';
    if (pathname.includes('/settings')) return 'Cài Đặt Hệ Thống';
    return 'Tổng Quan';
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    setNotificationOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      {/* Page Title in Topbar */}
      <div className="header-page-title">
        <h1 className="header-main-title">{getPageTitle(location.pathname)}</h1>
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

        {/* Notification Bell with Dropdown */}
        <div className="header-notification-wrapper" ref={notifDropdownRef}>
          <button
            type="button"
            className={`header-icon-btn ${notificationOpen ? 'active' : ''}`}
            aria-label="Thông báo hệ thống"
            aria-expanded={notificationOpen}
            title={unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Thông báo hệ thống'}
            onClick={() => {
              setNotificationOpen(!notificationOpen);
              if (dropdownOpen) setDropdownOpen(false);
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="header-badge-count">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notificationOpen && (
            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              readIds={readIds}
              isLoading={isNotifLoading}
              onClose={() => setNotificationOpen(false)}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
            />
          )}
        </div>

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
              <img
                src={defaultAvatarMale}
                alt={user?.fullName || user?.username || 'Avatar'}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
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
                  navigate('/profile');
                }}
              >
                <User size={15} />
                <span>Hồ sơ cá nhân</span>
              </button>

              {user?.role === 'ADMIN' && (
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
                  <span>Cài đặt hệ thống</span>
                </button>
              )}

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
