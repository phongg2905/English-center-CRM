import React from 'react';
import { AlertTriangle, Users, CalendarCheck, Clock, CheckCircle } from 'lucide-react';
import type { ShiftSlotAvailability, PlacementTestWithDetails } from '../../types/placement-test';

interface ShiftCapacityAlertProps {
  slots: ShiftSlotAvailability[];
  tests: PlacementTestWithDetails[];
}

export const ShiftCapacityAlert: React.FC<ShiftCapacityAlertProps> = ({ slots, tests }) => {
  const fullSlots = slots.filter((s) => s.isFull || s.totalBooked >= s.maxCapacity);
  const totalBooked = tests.length;
  const presentCount = tests.filter((t) => t.attendanceStatus === 'PRESENT').length;
  const scheduledCount = tests.filter((t) => t.attendanceStatus === 'SCHEDULED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Visual Capacity Warning if full slots exist */}
      {fullSlots.length > 0 && (
        <div className="pt-alert-banner danger">
          <div className="pt-alert-content">
            <AlertTriangle size={20} color="#dc2626" />
            <div>
              <strong>CẢNH BÁO SỨC CHỨA: Có {fullSlots.length} ca thi đã đạt tối đa sức chứa (10/10 thí sinh)!</strong>
              <div style={{ fontSize: '12px', fontWeight: 500, marginTop: '2px' }}>
                {fullSlots.map((s, idx) => (
                  <span key={idx} style={{ marginRight: '10px' }}>
                    • {s.testDate} [{s.timeSlot}] - {s.room} (ĐÃ ĐẦY)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="pt-stats-grid">
        <div className="pt-stat-card">
          <div className="pt-stat-icon" style={{ background: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed' }}>
            <CalendarCheck size={22} />
          </div>
          <div className="pt-stat-info">
            <span className="pt-stat-label">Tổng Thí Sinh Đăng Ký</span>
            <span className="pt-stat-value">{totalBooked}</span>
          </div>
        </div>

        <div className="pt-stat-card">
          <div className="pt-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
            <Clock size={22} />
          </div>
          <div className="pt-stat-info">
            <span className="pt-stat-label">Chờ Thi</span>
            <span className="pt-stat-value">{scheduledCount}</span>
          </div>
        </div>

        <div className="pt-stat-card">
          <div className="pt-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
            <CheckCircle size={22} />
          </div>
          <div className="pt-stat-info">
            <span className="pt-stat-label">Đã Có Mặt Điểm Danh</span>
            <span className="pt-stat-value">{presentCount}</span>
          </div>
        </div>

        <div className="pt-stat-card">
          <div 
            className="pt-stat-icon" 
            style={{ 
              background: fullSlots.length > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.12)', 
              color: fullSlots.length > 0 ? '#dc2626' : '#2563eb' 
            }}
          >
            <Users size={22} />
          </div>
          <div className="pt-stat-info">
            <span className="pt-stat-label">Ca Thi Kín Chỗ</span>
            <span className="pt-stat-value" style={{ color: fullSlots.length > 0 ? '#dc2626' : undefined }}>
              {fullSlots.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
