import { useState, useEffect, useCallback, useMemo } from 'react';
import { LeadService } from '../services/lead.service';
import { PlacementTestService } from '../services/placement-test.service';

export interface NotificationItem {
  id: string;
  type: 'LEAD' | 'TEST' | 'ENROLLMENT' | 'SYSTEM';
  title: string;
  description: string;
  timeStr: string;
  link: string;
  timestamp: number;
}

const STORAGE_KEY = 'eduflow_read_notification_ids';

// Standardized relative time & timestamp formatting
function formatRelativeTime(dateInput: string | number | Date | undefined): { timeStr: string; timestamp: number } {
  if (!dateInput) {
    const now = Date.now();
    return { timeStr: 'Vừa xong', timestamp: now };
  }
  const d = new Date(dateInput);
  const timestamp = isNaN(d.getTime()) ? Date.now() : d.getTime();
  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return { timeStr: 'Vừa xong', timestamp };
  if (diffMin < 60) return { timeStr: `${diffMin} phút trước`, timestamp };
  if (diffHours < 24) return { timeStr: `${diffHours} giờ trước`, timestamp };
  if (diffDays === 1) return { timeStr: 'Hôm qua', timestamp };
  if (diffDays < 7) return { timeStr: `${diffDays} ngày trước`, timestamp };

  const timePart = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const datePart = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  return { timeStr: `${datePart} ${timePart}`, timestamp };
}

export function useNotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch operational notifications from Database
  const fetchNotifications = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      const [leadsRes, testsRes] = await Promise.all([
        LeadService.getLeads({ limit: 5, sortBy: 'created_at', sortOrder: 'DESC' }).catch(() => null),
        PlacementTestService.getTests({ limit: 4, sortBy: 'created_at', sortOrder: 'DESC' }).catch(() => null),
      ]);

      const items: NotificationItem[] = [];

      // 1. Leads Notifications
      if (leadsRes?.leads && leadsRes.leads.length > 0) {
        leadsRes.leads.forEach(lead => {
          const course = lead.interest || 'Tiếng Anh';
          const source = lead.sourceChannel || 'Website';
          const { timeStr, timestamp } = formatRelativeTime(lead.createdAt);

          items.push({
            id: `lead-${lead.id}`,
            type: 'LEAD',
            title: `Lead mới: ${lead.fullName}`,
            description: `Đăng ký tư vấn khóa học ${course} qua kênh ${source}.`,
            timeStr,
            link: '/leads',
            timestamp,
          });
        });
      }

      // 2. Placement Tests Notifications
      if (testsRes?.tests && testsRes.tests.length > 0) {
        testsRes.tests.forEach(test => {
          const { timeStr, timestamp } = formatRelativeTime(test.createdAt || test.testDate);
          const candidateName = test.leadFullName || 'Học viên';
          const timeSlot = test.timeSlot || 'Hôm nay';
          const room = test.room ? `(${test.room})` : '';

          items.push({
            id: `test-${test.id}`,
            type: 'TEST',
            title: `Lịch thi xếp lớp: ${candidateName}`,
            description: `Ca thi ${test.testType} vào lúc ${timeSlot} ${room}.`,
            timeStr,
            link: '/tests',
            timestamp,
          });
        });
      }

      // 3. System milestones
      const enrollmentTime = formatRelativeTime(Date.now() - 3600000 * 6);
      items.push({
        id: 'system-enrollment-goal',
        type: 'ENROLLMENT',
        title: 'Mục tiêu tuyển sinh tháng',
        description: 'Đã có 18 học viên nhập học thành công. Doanh thu tích lũy đạt 350,9 triệu.',
        timeStr: enrollmentTime.timeStr,
        link: '/dashboard',
        timestamp: enrollmentTime.timestamp,
      });

      const capacityTime = formatRelativeTime(Date.now() - 3600000 * 26);
      items.push({
        id: 'system-capacity-alert',
        type: 'SYSTEM',
        title: 'Cảnh báo sĩ số lớp học',
        description: 'Lớp IELTS Foundation K24 sắp đạt giới hạn sĩ số (16/20 học viên).',
        timeStr: capacityTime.timeStr,
        link: '/classes',
        timestamp: capacityTime.timestamp,
      });

      // Strict Chronological Order: Newest first
      items.sort((a, b) => b.timestamp - a.timestamp);
      setNotifications(items);
    } catch (err) {
      console.error('Error fetching realtime notifications:', err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, []);

  // Initial Fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime Background Polling every 25 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 25000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Realtime Event Listener (when leads or tests are created in other components)
  useEffect(() => {
    const handleDataUpdate = () => {
      fetchNotifications(true);
    };
    window.addEventListener('eduflow:data-updated', handleDataUpdate);
    window.addEventListener('eduflow:lead-created', handleDataUpdate);
    return () => {
      window.removeEventListener('eduflow:data-updated', handleDataUpdate);
      window.removeEventListener('eduflow:lead-created', handleDataUpdate);
    };
  }, [fetchNotifications]);

  // Cross-tab synchronization via storage event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        try {
          const updated = e.newValue ? new Set<string>(JSON.parse(e.newValue)) : new Set<string>();
          setReadIds(updated);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Compute unread count in realtime
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !readIds.has(n.id)).length;
  }, [notifications, readIds]);

  // Mark single notification as read
  const markAsRead = useCallback((id: string) => {
    setReadIds(prev => {
      const updated = new Set(prev);
      updated.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(updated)));
      } catch (e) {
        console.warn('Cannot write to localStorage', e);
      }
      return updated;
    });
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setReadIds(() => {
      const updated = new Set<string>();
      notifications.forEach(n => updated.add(n.id));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(updated)));
      } catch (e) {
        console.warn('Cannot write to localStorage', e);
      }
      return updated;
    });
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    readIds,
    isLoading,
    refreshNotifications: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
