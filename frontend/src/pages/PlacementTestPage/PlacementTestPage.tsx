import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  RefreshCw,
  Search,
  LayoutGrid,
  List,
} from 'lucide-react';
import { PlacementTestService } from '../../services/placement-test.service';
import type {
  PlacementTestWithDetails,
  ShiftSlotAvailability,
  TestType,
  AttendanceStatus,
} from '../../types/placement-test';
import { PlacementTestCalendar } from './PlacementTestCalendar';
import { CandidateRosterTable } from './CandidateRosterTable';
import { ShiftCapacityAlert } from './ShiftCapacityAlert';
import { QuickBookModal } from './QuickBookModal';
import { ShiftRosterModal } from './ShiftRosterModal';
import { formatLocalDate, getMondayOfWeek } from '../../utils/date';
import './PlacementTestPage.css';

export const PlacementTestPage: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMondayOfWeek(new Date()));
  const [tests, setTests] = useState<PlacementTestWithDetails[]>([]);
  const [availabilitySlots, setAvailabilitySlots] = useState<ShiftSlotAvailability[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [selectedTestType, setSelectedTestType] = useState<string>('ALL');
  const [selectedAttendance, setSelectedAttendance] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickDateFilter, setQuickDateFilter] = useState<'today' | 'tomorrow' | 'week' | 'all'>('week');

  // Selected shift for drill-down into Candidate Roster
  const [selectedShift, setSelectedShift] = useState<{
    date: string;
    timeSlot: string;
    room?: string;
  } | null>(null);

  // View Mode: 'calendar' (Calendar + Roster) vs 'table' (Pure Roster)
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');

  // Quick Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [bookingPreselect, setBookingPreselect] = useState<{
    date?: string;
    timeSlot?: string;
    room?: string;
    lockShift?: boolean;
  }>({});

  // Fetch placement tests & availability
  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);

      const weekStartStr = formatLocalDate(currentWeekStart);
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 14); // 2-week window
      const weekEndStr = formatLocalDate(weekEnd);

      // Query tests without restricting room at query level so all rooms are available in memory
      const filterParams: any = {
        limit: 100,
        sortBy: 'test_date',
        sortOrder: 'ASC',
      };

      if (selectedTestType !== 'ALL') filterParams.testType = selectedTestType as TestType;
      if (selectedAttendance !== 'ALL') filterParams.attendanceStatus = selectedAttendance as AttendanceStatus;

      const [testsRes, availRes] = await Promise.all([
        PlacementTestService.getTests(filterParams),
        PlacementTestService.getAvailability(weekStartStr, weekEndStr),
      ]);

      const loadedTests = Array.isArray(testsRes)
        ? testsRes
        : testsRes?.tests && Array.isArray(testsRes.tests)
        ? testsRes.tests
        : [];

      setTests(loadedTests);
      setAvailabilitySlots(availRes || []);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu ca thi:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [currentWeekStart, selectedTestType, selectedAttendance]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calendar Navigation
  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const handleToday = () => {
    setCurrentWeekStart(getMondayOfWeek(new Date()));
  };

  const handleOpenBookingModal = (
    date?: string,
    timeSlot?: string,
    room?: string,
    lockShift?: boolean
  ) => {
    setBookingPreselect({ date, timeSlot, room, lockShift });
    setIsBookingOpen(true);
  };

  // Filtered candidate list based on active filters and selectedShift
  const filteredCandidates = tests.filter((t) => {
    const itemDate = (t.testDate || '').split('T')[0];

    // 1. If user clicked on a specific shift in the Calendar, filter to that shift:
    if (selectedShift) {
      if (itemDate !== selectedShift.date) return false;
      if (t.timeSlot !== selectedShift.timeSlot) return false;
      if (selectedShift.room && t.room) {
        const r1 = t.room.toLowerCase();
        const r2 = selectedShift.room.toLowerCase();
        if (!r1.includes(r2) && !r2.includes(r1)) return false;
      }
      return true; // Match found for selected shift!
    }

    // Filter by room if room dropdown filter is selected (unless 'ALL')
    if (selectedRoom !== 'ALL' && t.room) {
      const r1 = t.room.toLowerCase();
      const r2 = selectedRoom.toLowerCase();
      if (!r1.includes(r2) && !r2.includes(r1)) return false;
    }

    // 2. If no specific shift selected, filter according to quickDateFilter:
    if (quickDateFilter === 'today') {
      const todayStr = formatLocalDate(new Date());
      if (itemDate !== todayStr) return false;
    } else if (quickDateFilter === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = formatLocalDate(tomorrow);
      if (itemDate !== tomorrowStr) return false;
    } else if (quickDateFilter === 'week') {
      const weekStartStr = formatLocalDate(currentWeekStart);
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const weekEndStr = formatLocalDate(weekEnd);
      if (itemDate < weekStartStr || itemDate > weekEndStr) return false;
    }

    return true;
  });

  return (
    <div className="placement-test-page">
      {/* Capacity Alert (displays when shifts are full) */}
      <ShiftCapacityAlert slots={availabilitySlots} tests={tests} />

      {/* Unified Action & Filter Toolbar (Dual-Wing) */}
      <div className="pt-filter-card">
        {/* Top Row: Date Pills (Left) + View Toggle & Action Buttons (Right) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Left Wing: Quick Date Pills */}
          <div className="pt-date-pills">
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', alignSelf: 'center', marginRight: '6px' }}>
              Thời gian:
            </span>
            <button
              type="button"
              className={`pt-date-pill ${quickDateFilter === 'week' ? 'active' : ''}`}
              onClick={() => {
                setQuickDateFilter('week');
                setSelectedShift(null);
              }}
            >
              Tuần Này
            </button>
            <button
              type="button"
              className={`pt-date-pill ${quickDateFilter === 'today' ? 'active' : ''}`}
              onClick={() => {
                setQuickDateFilter('today');
                setSelectedShift(null);
              }}
            >
              Hôm Nay
            </button>
            <button
              type="button"
              className={`pt-date-pill ${quickDateFilter === 'tomorrow' ? 'active' : ''}`}
              onClick={() => {
                setQuickDateFilter('tomorrow');
                setSelectedShift(null);
              }}
            >
              Ngày Mai
            </button>
            <button
              type="button"
              className={`pt-date-pill ${quickDateFilter === 'all' ? 'active' : ''}`}
              onClick={() => {
                setQuickDateFilter('all');
                setSelectedShift(null);
              }}
            >
              Tất Cả Ca
            </button>
          </div>

          {/* Right Wing: View Toggle & Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div className="pt-view-toggle">
              <button
                type="button"
                className={`pt-view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                onClick={() => setViewMode('calendar')}
              >
                <LayoutGrid size={15} />
                Lịch Tuần (Calendar)
              </button>
              <button
                type="button"
                className={`pt-view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                <List size={15} />
                Danh Sách Điểm Danh
              </button>
            </div>

            <button
              type="button"
              className="pt-btn-touch"
              style={{ background: '#fff', border: 'var(--glass-border-subtle)', color: 'var(--text-body)', height: '36px', padding: '0 14px' }}
              onClick={() => loadData()}
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} />
              Làm mới
            </button>

            <button
              type="button"
              className="pt-btn-touch pt-btn-present active"
              style={{ height: '36px', padding: '0 16px', fontSize: '13px', background: 'var(--brand-gradient)' }}
              onClick={() => handleOpenBookingModal()}
            >
              <Plus size={15} />
              Đặt Lịch Hẹn Test Mới
            </button>
          </div>
        </div>

        {/* Detailed Dropdown Filters */}
        <div className="pt-filter-row">
          {/* Room / Campus Filter */}
          <div className="pt-filter-group">
            <span className="pt-filter-label">Phòng / Campus:</span>
            <select
              className="pt-select"
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
            >
              <option value="ALL">Tất cả phòng & cơ sở</option>
              <option value="Phòng Lab 201">Phòng Lab 201 (Cơ sở Q.1)</option>
              <option value="Phòng Lab 101">Phòng Lab 101 (Cơ sở Bình Thạnh)</option>
              <option value="Phòng 302">Phòng 302 (Cơ sở Tân Bình)</option>
            </select>
          </div>

          {/* Test Type Filter */}
          <div className="pt-filter-group">
            <span className="pt-filter-label">Loại Bài Thi:</span>
            <select
              className="pt-select"
              value={selectedTestType}
              onChange={(e) => setSelectedTestType(e.target.value)}
            >
              <option value="ALL">Tất cả loại bài thi</option>
              <option value="IELTS">IELTS Placement Test</option>
              <option value="TOEIC">TOEIC Placement Test</option>
              <option value="GENERAL">Cambridge / Giao Tiếp (GENERAL)</option>
            </select>
          </div>

          {/* Attendance Status Filter */}
          <div className="pt-filter-group">
            <span className="pt-filter-label">Trạng Thái:</span>
            <select
              className="pt-select"
              value={selectedAttendance}
              onChange={(e) => setSelectedAttendance(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="SCHEDULED">Đã lên lịch (SCHEDULED)</option>
              <option value="PRESENT">Có mặt (PRESENT)</option>
              <option value="ABSENT">Vắng mặt (ABSENT)</option>
              <option value="CANCELLED">Đã hủy (CANCELLED)</option>
            </select>
          </div>

          {/* Search Bar */}
          <div className="pt-search-wrapper">
            <Search size={15} className="pt-search-icon" />
            <input
              type="text"
              className="pt-search-input"
              placeholder="Tìm thí sinh theo tên, SĐT, Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area: Calendar Mode */}
      {viewMode === 'calendar' && (
        <PlacementTestCalendar
          currentWeekStart={currentWeekStart}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onToday={handleToday}
          availabilitySlots={availabilitySlots}
          tests={tests}
          selectedShift={selectedShift}
          onSelectShift={setSelectedShift}
          onQuickBookSlot={(date, slot, room) => handleOpenBookingModal(date, slot, room)}
        />
      )}

      {/* Main Content Area: Table Mode */}
      {viewMode === 'table' && (
        <CandidateRosterTable
          tests={filteredCandidates}
          onAttendanceChanged={() => loadData(true)}
          selectedShiftInfo={selectedShift}
          onClearShiftFilter={() => setSelectedShift(null)}
          onAddCandidateToShift={(shift) => handleOpenBookingModal(shift.date, shift.timeSlot, shift.room, true)}
        />
      )}

      {/* Shift Roster Modal Window (Bật lên khi bấm vào ca thi trên lịch) */}
      <ShiftRosterModal
        isOpen={Boolean(selectedShift)}
        onClose={() => setSelectedShift(null)}
        shiftInfo={selectedShift}
        tests={tests}
        onAttendanceChanged={() => loadData(true)}
        onAddCandidateToShift={(shift) => handleOpenBookingModal(shift.date, shift.timeSlot, shift.room, true)}
      />

      {/* Quick Booking Modal */}
      <QuickBookModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={() => {
          loadData(true);
        }}
        initialDate={bookingPreselect.date}
        initialTimeSlot={bookingPreselect.timeSlot}
        initialRoom={bookingPreselect.room}
        lockShift={bookingPreselect.lockShift}
        availabilitySlots={availabilitySlots}
      />
    </div>
  );
};

export default PlacementTestPage;
