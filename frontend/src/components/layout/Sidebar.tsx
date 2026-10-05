import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  BookOpen,
  BarChart3,
  Briefcase,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { EduFlowLogo } from '../common/EduFlowLogo';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const navGroups = [
    {
      title: 'VẬN HÀNH TRUNG TÂM',
      items: [
        {
          to: '/dashboard',
          label: 'Tổng quan',
          icon: <LayoutDashboard size={19} />,
        },
        {
          to: '/leads',
          label: 'Tuyển sinh & Leads',
          icon: <Users size={19} />,
          badge: '3',
        },
        {
          to: '/tests',
          label: 'Test & Xếp lớp',
          icon: <ClipboardCheck size={19} />,
          badge: '2',
        },
        {
          to: '/classes',
          label: 'Quản lý Lớp học',
          icon: <BookOpen size={19} />,
        },
      ],
    },
    {
      title: 'BÁO CÁO & HỆ THỐNG',
      items: [
        {
          to: '/reports',
          label: 'Báo cáo doanh thu',
          icon: <BarChart3 size={19} />,
        },
        {
          to: '/staff',
          label: 'Đội ngũ giảng viên',
          icon: <Briefcase size={19} />,
        },
        {
          to: '/settings',
          label: 'Cài đặt hệ thống',
          icon: <Settings size={19} />,
        },
      ],
    },
  ];

  const getInitials = (name?: string) => {
    if (!name) return 'EF';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
        {navGroups.map((group, groupIdx) => (
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
          title="Xem thông tin tài khoản & cài đặt"
          onClick={() => navigate('/settings')}
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
