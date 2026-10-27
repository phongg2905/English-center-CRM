import React, { useMemo } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  GraduationCap,
  BookOpen,
  BarChart3,
  Briefcase,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { EduFlowLogo } from '../common/EduFlowLogo';
import { ROUTE_PERMISSIONS, hasRequiredRole } from '../../config/rbac.config';
import type { UserRole } from '../../types/auth';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  roles?: (UserRole | string)[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        title: 'VẬN HÀNH TRUNG TÂM',
        items: [
          {
            to: '/dashboard',
            label: 'Tổng quan',
            icon: <LayoutDashboard size={19} />,
            roles: ROUTE_PERMISSIONS.dashboard,
          },
          {
            to: '/leads',
            label: 'Tuyển sinh & Leads',
            icon: <Users size={19} />,
            badge: '3',
            roles: ROUTE_PERMISSIONS.leads,
          },
          {
            to: '/tests',
            label: 'Khảo thí & Test',
            icon: <ClipboardCheck size={19} />,
            badge: '2',
            roles: ROUTE_PERMISSIONS.tests,
          },
          {
            to: '/students',
            label: 'Học viên & Ghi danh',
            icon: <GraduationCap size={19} />,
            roles: ROUTE_PERMISSIONS.students,
          },
          {
            to: '/classes',
            label: 'Lớp học & Khóa học',
            icon: <BookOpen size={19} />,
            roles: ROUTE_PERMISSIONS.classes,
          },
        ],
      },
      {
        title: 'BÁO CÁO & HỆ THỐNG',
        items: [
          {
            to: '/reports',
            label: 'Báo cáo & Thống kê',
            icon: <BarChart3 size={19} />,
            roles: ROUTE_PERMISSIONS.reports,
          },
          {
            to: '/staff',
            label: 'Nhân sự & Giảng viên',
            icon: <Briefcase size={19} />,
            roles: ROUTE_PERMISSIONS.staff,
          },
          {
            to: '/audit-logs',
            label: 'Nhật ký hoạt động',
            icon: <ShieldCheck size={19} />,
            roles: ROUTE_PERMISSIONS.auditLogs,
          },
          {
            to: '/settings',
            label: 'Cài đặt hệ thống',
            icon: <Settings size={19} />,
            roles: ROUTE_PERMISSIONS.settings,
          },
        ],
      },
    ],
    []
  );

  // Lọc động các mục menu theo vai trò người dùng hiện tại
  const filteredGroups = useMemo(() => {
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          hasRequiredRole(user?.role, item.roles)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [navGroups, user?.role]);

  const getInitials = (name?: string) => {
    if (!name) return 'EF';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleUserCardClick = () => {
    if (hasRequiredRole(user?.role, ROUTE_PERMISSIONS.settings)) {
      navigate('/settings');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand-wrapper">
        <Link to="/dashboard" className="sidebar-brand-link">
          <div className="sidebar-logo-icon">
            <EduFlowLogo size={collapsed ? 26 : 28} variant="square" />
          </div>
          <div className="sidebar-brand-info">
            <div className="sidebar-brand-title">
              EduFlow
              <span className="sidebar-version-badge">PRO</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Groups */}
      <div className="sidebar-nav-container">
        {filteredGroups.map((group, groupIdx) => (
          <div key={groupIdx}>
            <div className="sidebar-nav-section-title">
              {collapsed ? '•••' : group.title}
            </div>
            <ul className="sidebar-nav-list">
              {group.items.map((item) => (
                <li key={item.to} className="sidebar-nav-item">
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `sidebar-nav-link ${isActive ? 'active' : ''}`
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="sidebar-nav-icon">{item.icon}</span>
                    <span className="sidebar-nav-label">{item.label}</span>
                    {item.badge && (
                      <span className="sidebar-nav-badge">{item.badge}</span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer / User info & collapse trigger */}
      <div className="sidebar-footer">
        <div
          className="sidebar-user-card"
          title={
            hasRequiredRole(user?.role, ROUTE_PERMISSIONS.settings)
              ? 'Xem thông tin tài khoản & cài đặt'
              : 'Thông tin tài khoản'
          }
          onClick={handleUserCardClick}
          role="button"
          tabIndex={0}
        >
          <div className="sidebar-user-avatar">
            {getInitials(user?.fullName || user?.username)}
          </div>
          <div className="sidebar-user-details">
            <div className="sidebar-user-name">{user?.fullName || user?.username}</div>
            <div className="sidebar-user-role-badge">
              {user?.roleName || user?.role || 'ADMIN'}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? 'Mở rộng thanh bên' : 'Thu nhỏ thanh bên'}
          aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu nhỏ thanh bên'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
};
