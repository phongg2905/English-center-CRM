import React from 'react';
import { ChevronLeft, ChevronRight, Plus, AlertTriangle } from 'lucide-react';
import type { ShiftSlotAvailability, PlacementTestWithDetails } from '../../types/placement-test';

interface PlacementTestCalendarProps {
  currentWeekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  availabilitySlots: ShiftSlotAvailability[];
  tests: PlacementTestWithDetails[];
  selectedShift: { date: string; timeSlot: string; room?: string } | null;
  onSelectShift: (shift: { date: string; timeSlot: string; room?: string } | null) => void;
  onQuickBookSlot: (date: string, timeSlot: string, room?: string) => void;
}

const TIME_SLOTS = [
  { key: '09:00 - 10:30', name: 'Ca Sáng', time: '09:00 - 10:30' },
  { key: '14:30 - 16:00', name: 'Ca Chiều', time: '14:30 - 16:00' },
  { key: '18:00 - 19:30', name: 'Ca Tối', time: '18:00 - 19:30' },
];

export const PlacementTestCalendar: React.FC<PlacementTestCalendarProps> = ({
  currentWeekStart,
  onPrevWeek,
  onNextWeek,
  onToday,
  availabilitySlots,
  tests,
  selectedShift,
  onSelectShift,
  onQuickBookSlot,
}) => {
  // Generate 7 days of the week starting from currentWeekStart
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const formatDateYMD = (date: Date) => date.toISOString().split('T')[0];

  const todayStr = formatDateYMD(new Date());

  const getDayNameVN = (dayIndex: number) => {
    switch (dayIndex) {
      case 0:
        return 'Chủ Nhật';
      case 1:
        return 'Thứ Hai';
      case 2:
        return 'Thứ Ba';
      case 3:
        return 'Thứ Tư';
      case 4:
        return 'Thứ Năm';
      case 5:
        return 'Thứ Sáu';
      case 6:
        return 'Thứ Bảy';
      default:
        return '';
    }
  };

  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const rangeTitle = `${currentWeekStart.getDate()}/${currentWeekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}/${weekEnd.getFullYear()}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Navigation Controls */}
      <div className="pt-calendar-nav-bar">
        <div className="pt-nav-controls">
          <button className="pt-nav-btn" onClick={onPrevWeek} title="Tuần trước">
            <ChevronLeft size={18} />
          </button>
          <button className="pt-date-pill" onClick={onToday}>
            Hôm Nay
          </button>
          <button className="pt-nav-btn" onClick={onNextWeek} title="Tuần sau">
            <ChevronRight size={18} />
          </button>
          <span className="pt-current-range">Tuần: {rangeTitle}</span>
        </div>

        {selectedShift && (
          <button
            type="button"
            className="pt-date-pill"
            style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--color-primary-royal)' }}
            onClick={() => onSelectShift(null)}
          >
            Đang lọc: {selectedShift.date} ({selectedShift.timeSlot}) • Bấm để xem tất cả
          </button>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="pt-calendar-grid">
        {/* Top-left corner */}
        <div className="pt-cal-header-cell" style={{ justifyContent: 'center' }}>
          <span className="pt-day-name">Khung Giờ</span>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>Ca thi chuẩn</span>
        </div>

        {/* Header 7 Days */}
        {daysOfWeek.map((day) => {
          const dateStr = formatDateYMD(day);
          const isToday = dateStr === todayStr;
          return (
            <div key={dateStr} className={`pt-cal-header-cell ${isToday ? 'today' : ''}`}>
              <span className="pt-day-name">{getDayNameVN(day.getDay())}</span>
              <span className="pt-day-date">
                {day.getDate()}/{day.getMonth() + 1}
              </span>
            </div>
          );
        })}

        {/* Time Slot Rows */}
        {TIME_SLOTS.map((slot) => (
          <React.Fragment key={slot.key}>
            {/* Slot label cell */}
            <div className="pt-slot-label-cell">
              <span className="pt-slot-name">{slot.name}</span>
              <span className="pt-slot-time">{slot.time}</span>
            </div>

            {/* 7 Days for this slot */}
            {daysOfWeek.map((day) => {
              const dateStr = formatDateYMD(day);

              // Find tests in this day & slot
              const slotTests = tests.filter(
                (t) => t.testDate === dateStr && t.timeSlot === slot.key
              );

              // Group by room
              const roomCounts: { [room: string]: number } = {};
              slotTests.forEach((t) => {
                const r = t.room || 'Phòng Lab 201';
                roomCounts[r] = (roomCounts[r] || 0) + 1;
              });

              // Also check availabilitySlots from backend
              const slotAvailabilities = availabilitySlots.filter(
                (s) => s.testDate === dateStr && s.timeSlot === slot.key
              );

              // Distinct rooms that either have booked tests or availability
              const activeRooms = Array.from(
                new Set([...Object.keys(roomCounts), ...slotAvailabilities.map((a) => a.room)])
              );

              return (
                <div key={`${dateStr}-${slot.key}`} className="pt-cal-slot-cell">
                  {/* Shift Cards */}
                  {activeRooms.map((roomName) => {
                    const booked =
                      roomCounts[roomName] ||
                      slotAvailabilities.find((a) => a.room === roomName)?.totalBooked ||
                      0;
                    const maxCap = 10;
                    const isFull = booked >= maxCap;
                    const isSelected =
                      selectedShift?.date === dateStr &&
                      selectedShift?.timeSlot === slot.key &&
                      (!selectedShift.room || selectedShift.room === roomName);

                    return (
                      <div
                        key={roomName}
                        className={`pt-shift-card ${isSelected ? 'selected' : ''} ${isFull ? 'full' : ''}`}
                        onClick={() =>
                          onSelectShift(
                            isSelected ? null : { date: dateStr, timeSlot: slot.key, room: roomName }
                          )
                        }
                        title={`Bấm để xem danh sách thí sinh phòng ${roomName}`}
                      >
                        <div className="pt-shift-room">
                          <span>{roomName}</span>
                          {isFull && <AlertTriangle size={12} color="#dc2626" />}
                        </div>

                        <div className="pt-capacity-bar-track">
                          <div
                            className={`pt-capacity-bar-fill ${
                              isFull ? 'full' : booked >= 7 ? 'warning' : 'normal'
                            }`}
                            style={{ width: `${Math.min(100, (booked / maxCap) * 100)}%` }}
                          />
                        </div>

                        <div className="pt-capacity-meta">
                          <span
                            className={`pt-capacity-text ${
                              isFull ? 'full' : booked >= 7 ? 'warning' : 'normal'
                            }`}
                          >
                            {isFull ? 'ĐÃ KÍN (10/10)' : `${booked}/${maxCap} Thí sinh`}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add candidate button for this slot */}
                  <button
                    type="button"
                    className="pt-btn-add-shift"
                    onClick={() => onQuickBookSlot(dateStr, slot.key)}
                    title={`Đặt lịch test vào ngày ${dateStr} [${slot.key}]`}
                  >
                    <Plus size={12} /> Đặt lịch
                  </button>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
