import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Calendar,
  Award,
  Bell,
  CheckCheck,
  Settings,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import type { NotificationItem } from '../../hooks/useNotificationCenter';
import './NotificationDropdown.css';

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  unreadCount: number;
  readIds: Set<string>;
  isLoading: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  readIds,
  isLoading,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');

  // Filtered list based on active tab
  const displayList = useMemo(() => {
    if (activeTab === 'UNREAD') {
      return notifications.filter(n => !readIds.has(n.id));
    }
    return notifications;
  }, [notifications, activeTab, readIds]);

  const handleItemClick = (id: string, link: string) => {
    onMarkAsRead(id);
    onClose();
    navigate(link);
  };

  const renderIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'LEAD':
        return (
          <div className="notif-item-icon type-lead">
            <UserPlus size={16} />
          </div>
        );
      case 'TEST':
        return (
          <div className="notif-item-icon type-test">
            <Calendar size={16} />
          </div>
        );
      case 'ENROLLMENT':
        return (
          <div className="notif-item-icon type-enrollment">
            <Award size={16} />
          </div>
        );
      case 'SYSTEM':
      default:
        return (
          <div className="notif-item-icon type-system">
            <AlertCircle size={16} />
          </div>
        );
    }
  };

  return (
    <div className="header-notification-dropdown" role="dialog" aria-label="Thông báo hệ thống">
      {/* Header */}
      <div className="notif-header">
        <div className="notif-header-top">
          <div className="notif-header-title-box">
            <span className="notif-header-title">Thông báo</span>
            {unreadCount > 0 && (
              <span className="notif-unread-pill">{unreadCount} mới</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              className="notif-btn-mark-all"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAllAsRead();
              }}
              title="Đánh dấu tất cả là đã đọc"
            >
              <CheckCheck size={14} />
              <span>Đọc tất cả</span>
            </button>
          )}
        </div>

        {/* Tab filters */}
        <div className="notif-tabs">
          <button
            type="button"
            className={`notif-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            Tất cả ({notifications.length})
          </button>
          <button
            type="button"
            className={`notif-tab-btn ${activeTab === 'UNREAD' ? 'active' : ''}`}
            onClick={() => setActiveTab('UNREAD')}
          >
            Chưa đọc ({unreadCount})
          </button>
        </div>
      </div>

      {/* List Content */}
      <div className="notif-list-container">
        {isLoading && notifications.length === 0 ? (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(226, 232, 240, 0.6)' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ width: '60%', height: '12px', borderRadius: '4px', background: 'rgba(226, 232, 240, 0.6)' }} />
                  <div style={{ width: '90%', height: '10px', borderRadius: '4px', background: 'rgba(226, 232, 240, 0.4)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div className="notif-empty-state">
            <div className="notif-empty-icon">
              <Bell size={20} />
            </div>
            <p className="notif-empty-title">Không có thông báo mới</p>
            <p className="notif-empty-subtitle">
              {activeTab === 'UNREAD' ? 'Bạn đã đọc toàn bộ thông báo.' : 'Hệ thống chưa ghi nhận thông báo nào.'}
            </p>
          </div>
        ) : (
          displayList.map(item => {
            const isUnread = !readIds.has(item.id);
            return (
              <div
                key={item.id}
                className={`notif-item ${isUnread ? 'unread' : ''}`}
                onClick={() => handleItemClick(item.id, item.link)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleItemClick(item.id, item.link);
                }}
              >
                {renderIcon(item.type)}
                <div className="notif-item-content">
                  <div className="notif-item-title-row">
                    <span className="notif-item-title">{item.title}</span>
                    <span className="notif-item-time">{item.timeStr}</span>
                  </div>
                  <p className="notif-item-desc">{item.description}</p>
                </div>
                {isUnread && <span className="notif-item-unread-dot" />}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="notif-footer">
        <button
          type="button"
          className="notif-footer-link"
          onClick={() => {
            onClose();
            navigate('/settings');
          }}
        >
          <Settings size={13} />
          <span>Cài đặt thông báo</span>
          <ExternalLink size={11} style={{ opacity: 0.6 }} />
        </button>
        <span className="notif-footer-note">EduFlow CRM v1.0</span>
      </div>
    </div>
  );
};
