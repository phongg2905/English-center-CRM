import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AuthService } from '../../services/auth.service';
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Shield,
  CheckCheck,
  Clock,
  UserCheck,
  CalendarCheck,
  AlertTriangle,
  CreditCard,
  Inbox,
  Settings,
  KeyRound,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import defaultAvatarMale from '../../assets/avatars/default-avatar-male.jpg';
import { hasRequiredRole } from '../../config/rbac.config';
import type { UserRole } from '../../types/auth';

interface NotificationItem {
  id: string;
  type: 'lead' | 'test' | 'class' | 'payment' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  link: string;
  /** Vai trò được phép nhận thông báo này (RBAC) */
  roles: UserRole[];
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'lead',
    title: 'Lead mới cần tư vấn',
    message: 'Nguyễn Thị Thuỳ Dung đăng ký tư vấn IELTS qua Facebook Ads',
    time: '15 phút trước',
    read: false,
    link: '/leads',
    roles: ['ADMIN', 'SALES'],
  },
  {
    id: 'notif-2',
    type: 'test',
    title: 'Lịch thi Placement Test',
    message: 'Ca thi 14:00 hôm nay tại Phòng 302 có 3 thí sinh cần điểm danh',
    time: '45 phút trước',
    read: false,
    link: '/tests',
    roles: ['ADMIN', 'SALES', 'ACADEMIC'],
  },
  {
    id: 'notif-3',
    type: 'class',
    title: 'Cảnh báo Sĩ số Lớp học',
    message: 'Lớp IELTS Bứt phá K26 đã chạm trần 15/15 học viên (Khóa tự động)',
    time: '2 giờ trước',
    read: false,
    link: '/classes',
    roles: ['ADMIN', 'SALES', 'ACADEMIC'],
  },
  {
    id: 'notif-teacher-1',
    type: 'class',
    title: 'Lịch giảng dạy hôm nay',
    message: 'Lớp IELTS Bứt phá K26 (18:00 - 19:30) tại Phòng 302 — nhớ điểm danh học viên',
    time: '1 giờ trước',
    read: false,
    link: '/classes',
    roles: ['TEACHER'],
  },
  {
    id: 'notif-4',
    type: 'payment',
    title: 'Học phí hoàn tất',
    message: 'Học viên STU-202610-0001 đã thanh toán đủ 100% học phí (Biên lai REC-0002)',
    time: '5 giờ trước',
    read: true,
    link: '/students',
    roles: ['ADMIN', 'SALES'],
  },
  {
    id: 'notif-5',
    type: 'system',
    title: 'Bảo mật & Phân quyền',
    message: 'Chính sách bảo vệ dữ liệu khách hàng RBAC đã được kích hoạt',
    time: '1 ngày trước',
    read: true,
    link: '/settings',
    roles: ['ADMIN'],
  },
];

const ROLE_CAPABILITIES: Record<string, string[]> = {
  ADMIN: [
    'Toàn quyền quản trị nhân sự, giảng viên và nhật ký hoạt động (Audit Logs)',
    'Quản lý khóa học đào tạo, lớp học, phễu tuyển sinh Lead và khảo thí',
    'Xem báo cáo doanh thu thực thu, công nợ học phí và cấu hình hệ thống',
  ],
  SALES: [
    'Tiếp nhận, phân bổ và chăm sóc khách hàng tiềm năng (Leads Kanban & Danh sách)',
    'Đặt lịch hẹn thi Placement Test và xem kết quả chấm điểm để tư vấn lộ trình',
    'Ghi danh xếp lớp học viên, thu học phí và in biên lai điện tử PDF',
  ],
  ACADEMIC: [
    'Tổ chức ca thi Placement Test, điểm danh thí sinh và chấm điểm 4 kỹ năng',
    'Khởi tạo khóa học, mở lớp học, phân công giảng viên và điều phối phòng học',
    'Xếp lớp học viên, cập nhật trạng thái đào tạo và luân chuyển lớp học',
  ],
  TEACHER: [
    'Theo dõi lịch giảng dạy các lớp học được phân công phụ trách',
    'Tra cứu sĩ số và danh sách học viên trong từng lớp giảng dạy',
  ],
};

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = hasRequiredRole(user?.role, ['ADMIN']);

  // Global search state
  const [globalSearch, setGlobalSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Profile dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Profile & Change Password Window Modal (FR-AUTH-04)
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'info' | 'password'>('info');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [pwdFeedback, setPwdFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  // Notification dropdown
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Chỉ hiển thị thông báo thuộc phạm vi nghiệp vụ của vai trò hiện tại
  const roleNotifications = useMemo(
    () => notifications.filter((n) => hasRequiredRole(user?.role, n.roles)),
    [notifications, user?.role]
  );

  // Close dropdowns on outside click & Cmd+K shortcut
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const unreadCount = useMemo(() => roleNotifications.filter((n) => !n.read).length, [roleNotifications]);

  const filteredNotifications = useMemo(() => {
    if (notificationFilter === 'unread') {
      return roleNotifications.filter((n) => !n.read);
    }
    return roleNotifications;
  }, [roleNotifications, notificationFilter]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setNotificationOpen(false);
    navigate(item.link);
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'lead':
        return <UserCheck size={16} />;
      case 'test':
        return <CalendarCheck size={16} />;
      case 'class':
        return <AlertTriangle size={16} />;
      case 'payment':
        return <CreditCard size={16} />;
      case 'system':
      default:
        return <Shield size={16} />;
    }
  };

  // Compute page title based on path
  const getPageTitle = (pathname: string) => {
    if (pathname.includes('/leads')) return 'Leads & Phễu Tuyển Sinh';
    if (pathname.includes('/tests')) return 'Lịch Thi & Xếp Lớp';
    if (pathname.includes('/classes')) return 'Quản Lý Lớp Học & Khóa Đào Tạo';
    if (pathname.includes('/reports')) return 'Báo Cáo & Thống Kê';
    if (pathname.includes('/staff')) return 'Quản Lý Nhân Sự & Giảng Viên';
    if (pathname.includes('/audit-logs')) return 'Nhật Ký Hoạt Động Hệ Thống';
    if (pathname.includes('/students')) return 'Học Viên & Ghi Danh';
    if (pathname.includes('/profile')) return 'Hồ Sơ Cá Nhân';
    if (pathname.includes('/settings')) return 'Cài Đặt Hệ Thống';
    return 'Tổng Quan';
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    setNotificationOpen(false);
    await logout();
    navigate('/login');
  };

  const handleOpenProfileModal = (tab: 'info' | 'password') => {
    setDropdownOpen(false);
    setProfileModalTab(tab);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPwdFeedback(null);
    setProfileModalOpen(true);
  };

  const handleSubmitChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdFeedback(null);

    if (!currentPassword.trim() || !newPassword.trim()) {
      setPwdFeedback({ text: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.', isError: true });
      return;
    }
    if (newPassword.trim().length < 6) {
      setPwdFeedback({ text: 'Mật khẩu mới phải có ít nhất 6 ký tự.', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdFeedback({ text: 'Mật khẩu xác nhận không khớp với mật khẩu mới.', isError: true });
      return;
    }

    try {
      setIsChangingPwd(true);
      await AuthService.changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });
      setPwdFeedback({ text: 'Đổi mật khẩu cá nhân thành công!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdFeedback({
        text: err?.response?.data?.message || err.message || 'Mật khẩu hiện tại không chính xác.',
        isError: true,
      });
    } finally {
      setIsChangingPwd(false);
    }
  };

  const handleGlobalSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && globalSearch.trim()) {
      const q = globalSearch.trim().toLowerCase();
      if (q.startsWith('ielts') || q.startsWith('toeic') || q.startsWith('ge') || q.includes('lớp')) {
        navigate('/classes');
      } else if (user?.role === 'TEACHER') {
        navigate('/students');
      } else if (location.pathname.includes('/leads')) {
        navigate('/leads');
      } else {
        navigate('/students');
      }
    }
  };

  const roleCode = (user?.role || 'ADMIN').toUpperCase();
  const capabilities = ROLE_CAPABILITIES[roleCode] || ROLE_CAPABILITIES.ADMIN;

  return (
    <>
      <header className="app-header">
        {/* Page Title in Topbar */}
        <div className="header-page-title">
          <h1 className="header-main-title">{getPageTitle(location.pathname)}</h1>
        </div>

        {/* Actions: Search, Notifications, Profile */}
        <div className="header-actions-group">
          {/* Global Search Bar */}
          <div className="header-search-box" title="Tìm kiếm học viên, lớp học (Nhấn Enter để chuyển trang)">
            <Search size={16} />
            <input
              ref={searchInputRef}
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onKeyDown={handleGlobalSearchKeyDown}
              placeholder="Tìm học viên, lớp học..."
              aria-label="Tìm kiếm toàn hệ thống"
            />
            <kbd className="header-search-kbd">⌘K</kbd>
          </div>

          {/* Notification Bell Dropdown */}
          <div className="header-notification-wrapper" ref={notificationRef}>
            <button
              type="button"
              className={`header-icon-btn ${notificationOpen ? 'active' : ''}`}
              aria-label="Thông báo hệ thống"
              title={unreadCount > 0 ? `${unreadCount} thông báo mới` : 'Thông báo hệ thống'}
              onClick={() => {
                setNotificationOpen(!notificationOpen);
                if (dropdownOpen) setDropdownOpen(false);
              }}
              aria-expanded={notificationOpen}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="header-badge-count">{unreadCount}</span>
              )}
            </button>

            {notificationOpen && (
              <div className="header-notification-dropdown" role="dialog" aria-label="Trung tâm thông báo">
                {/* Header */}
                <div className="notification-dropdown-header">
                  <div className="notification-header-title">
                    <span>Thông báo</span>
                    {unreadCount > 0 && (
                      <span className="notification-pill-badge">{unreadCount} mới</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="notification-mark-all-btn"
                      onClick={markAllAsRead}
                      title="Đánh dấu tất cả là đã đọc"
                    >
                      <CheckCheck size={14} />
                      <span>Đã đọc tất cả</span>
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="notification-dropdown-tabs">
                  <button
                    type="button"
                    className={`notification-tab-btn ${notificationFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setNotificationFilter('all')}
                  >
                    Tất cả ({roleNotifications.length})
                  </button>
                  <button
                    type="button"
                    className={`notification-tab-btn ${notificationFilter === 'unread' ? 'active' : ''}`}
                    onClick={() => setNotificationFilter('unread')}
                  >
                    Chưa đọc ({unreadCount})
                  </button>
                </div>

                {/* List */}
                <div className="notification-dropdown-list">
                  {filteredNotifications.length === 0 ? (
                    <div className="notification-empty-state">
                      <Inbox size={32} />
                      <p>Không có thông báo nào</p>
                    </div>
                  ) : (
                    filteredNotifications.map((item) => (
                      <div
                        key={item.id}
                        className={`notification-item ${!item.read ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(item)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className={`notification-icon-box ${item.type}`}>
                          {getNotificationIcon(item.type)}
                        </div>
                        <div className="notification-content">
                          <div className="notification-item-top">
                            <h4 className="notification-title">{item.title}</h4>
                            <span className="notification-time">
                              <Clock size={11} />
                              {item.time}
                            </span>
                          </div>
                          <p className="notification-desc">{item.message}</p>
                        </div>
                        {!item.read && <span className="notification-unread-dot" />}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {isAdmin && (
                  <div className="notification-dropdown-footer">
                    <button
                      type="button"
                      className="notification-footer-link"
                      onClick={() => {
                        setNotificationOpen(false);
                        navigate('/settings');
                      }}
                    >
                      <Settings size={13} />
                      <span>Cài đặt thông báo hệ thống</span>
                    </button>
                  </div>
                )}
              </div>
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
                    {user?.email || 'staff@eduflow.edu.vn'}
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

                <button
                  type="button"
                  className="header-dropdown-item"
                  role="menuitem"
                  onClick={() => handleOpenProfileModal('password')}
                >
                  <KeyRound size={15} />
                  <span>Đổi mật khẩu nhanh</span>
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    className="header-dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/settings');
                    }}
                  >
                    <Settings size={15} />
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

      {/* Profile & Change Password Window Modal (FR-AUTH-04 for all roles) */}
      {profileModalOpen &&
        createPortal(
          <div
            onClick={() => setProfileModalOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '520px',
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 24px 48px rgba(15, 23, 42, 0.18)',
                overflow: 'hidden',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '18px 22px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '18px',
                    }}
                  >
                    {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                      {user?.fullName || user?.username}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      @{user?.username} • Vai trò: <strong>{user?.roleName || user?.role}</strong>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: 'none',
                    background: '#e2e8f0',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 22px' }}>
                <button
                  type="button"
                  onClick={() => setProfileModalTab('info')}
                  style={{
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: profileModalTab === 'info' ? '#2563eb' : '#64748b',
                    borderBottom: profileModalTab === 'info' ? '2.5px solid #2563eb' : '2.5px solid transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <User size={15} />
                  <span>Thông tin & Phân quyền</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProfileModalTab('password')}
                  style={{
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: profileModalTab === 'password' ? '#2563eb' : '#64748b',
                    borderBottom: profileModalTab === 'password' ? '2.5px solid #2563eb' : '2.5px solid transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <KeyRound size={15} />
                  <span>Đổi mật khẩu cá nhân</span>
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '20px 22px' }}>
                {profileModalTab === 'info' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        padding: '14px',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '11.5px', color: '#64748b', display: 'block' }}>Họ và tên</span>
                        <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{user?.fullName || '—'}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11.5px', color: '#64748b', display: 'block' }}>Tên đăng nhập</span>
                        <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{user?.username || '—'}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11.5px', color: '#64748b', display: 'block' }}>Email công việc</span>
                        <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{user?.email || '—'}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11.5px', color: '#64748b', display: 'block' }}>Vai trò hệ thống</span>
                        <strong style={{ fontSize: '13.5px', color: '#2563eb' }}>
                          {user?.roleName || user?.role}
                        </strong>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        background: '#eff6ff',
                        border: '1px solid #dbeafe',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <Shield size={15} color="#2563eb" />
                        <strong style={{ fontSize: '13px', color: '#1e3a8a' }}>
                          Phạm vi nghiệp vụ được cấp quyền ({roleCode}):
                        </strong>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#1e40af', lineHeight: 1.7 }}>
                        {capabilities.map((cap, idx) => (
                          <li key={idx}>{cap}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {pwdFeedback && (
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: pwdFeedback.isError ? '#fef2f2' : '#f0fdf4',
                          color: pwdFeedback.isError ? '#dc2626' : '#16a34a',
                          border: pwdFeedback.isError ? '1px solid #fecaca' : '1px solid #bbf7d0',
                        }}
                      >
                        {pwdFeedback.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                        <span>{pwdFeedback.text}</span>
                      </div>
                    )}

                    <div>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                        Mật khẩu hiện tại *
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Nhập mật khẩu đang sử dụng..."
                        required
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13.5px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                        Mật khẩu mới (Tối thiểu 6 ký tự) *
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới..."
                        required
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13.5px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                        Xác nhận mật khẩu mới *
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới..."
                        required
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13.5px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setProfileModalOpen(false)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#475569',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        Đóng
                      </button>
                      <button
                        type="submit"
                        disabled={isChangingPwd}
                        style={{
                          padding: '8px 18px',
                          borderRadius: '10px',
                          border: 'none',
                          background: '#2563eb',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        {isChangingPwd ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
