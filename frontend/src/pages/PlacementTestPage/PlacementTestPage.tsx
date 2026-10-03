import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
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
import './PlacementTestPage.css';

export const PlacementTestPage: React.FC = () => {
  // Calendar Week Start (defaults to Monday of current week)
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMonday(new Date()));
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
  }>({});

  // Fetch placement tests & availability
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const weekStartStr = currentWeekStart.toISOString().split('T')[0];
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 14); // 2-week window
      const weekEndStr = weekEnd.toISOString().split('T')[0];

      // Query tests
      const filterParams: any = {
        limit: 100,
        sortBy: 'test_date',
        sortOrder: 'ASC',
      };

      if (selectedRoom !== 'ALL') filterParams.room = selectedRoom;
      if (selectedTestType !== 'ALL') filterParams.testType = selectedTestType as TestType;
      if (selectedAttendance !== 'ALL') filterParams.attendanceStatus = selectedAttendance as AttendanceStatus;
      if (searchQuery.trim()) filterParams.search = searchQuery.trim();

      const [testsRes, availRes] = await Promise.all([
        PlacementTestService.getTests(filterParams),
        PlacementTestService.getAvailability(
          weekStartStr,
          weekEndStr,
          selectedRoom !== 'ALL' ? selectedRoom : undefined
        ),
      ]);

      setTests(testsRes.tests || []);
      setAvailabilitySlots(availRes || []);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu ca thi:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentWeekStart, selectedRoom, selectedTestType, selectedAttendance, searchQuery]);

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
    setCurrentWeekStart(getMonday(new Date()));
  };

  const handleOpenBookingModal = (date?: string, timeSlot?: string, room?: string) => {
    setBookingPreselect({ date, timeSlot, room });
    setIsBookingOpen(true);
  };

  // Filtered candidate list based on active filters and selectedShift
  const filteredCandidates = tests.filter((t) => {
    if (selectedShift) {
      if (t.testDate !== selectedShift.date) return false;
      if (t.timeSlot !== selectedShift.timeSlot) return false;
      if (selectedShift.room && t.room !== selectedShift.room) return false;
    }

    if (quickDateFilter === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      if (t.testDate !== todayStr) return false;
    } else if (quickDateFilter === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      if (t.testDate !== tomorrowStr) return false;
    }

    return true;
  });

  return (
    <div className="placement-test-page">
      {/* Page Header */}
      <div className="pt-header">
        <div className="pt-title-area">
          <h1>
            <Calendar size={26} color="var(--color-primary-royal)" />
            Lịch Thi & Quản Lý Ca Thi Placement Test
            <span className="pt-title-badge">UC-02 / FE-04A</span>
          </h1>
          <p>
            Theo dõi ca thi trực quan, kiểm soát tải phòng thi (10 thí sinh/phòng) và điểm danh thí sinh một chạm.
          </p>
        </div>

        <div className="pt-header-actions">
          <button
            type="button"
            className="pt-btn-touch"
            style={{ background: '#fff', border: 'var(--glass-border-subtle)', color: 'var(--text-body)' }}
            onClick={loadData}
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} />
            Làm mới
          </button>

          <button
            type="button"
            className="pt-btn-touch pt-btn-present active"
            style={{ padding: '8px 16px', fontSize: '13px', background: 'var(--brand-gradient)' }}
            onClick={() => handleOpenBookingModal()}
          >
            <Plus size={16} />
            Đặt Lịch Hẹn Test Mới
          </button>
        </div>
      </div>

      {/* Capacity Alert & Overview KPIs */}
      <ShiftCapacityAlert slots={availabilitySlots} tests={tests} />

      {/* Filter Bar */}
      <div className="pt-filter-card">
        {/* Quick Date Pills */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
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

          {/* View Toggle */}
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

      {/* Main Content Area */}
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

      {/* Candidate Roster & One-Touch Attendance Table */}
      <CandidateRosterTable
        tests={filteredCandidates}
        onAttendanceChanged={loadData}
        selectedShiftInfo={selectedShift}
      />

      {/* Quick Booking Modal */}
      <QuickBookModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={() => {
          loadData();
        }}
        initialDate={bookingPreselect.date}
        initialTimeSlot={bookingPreselect.timeSlot}
        initialRoom={bookingPreselect.room}
        availabilitySlots={availabilitySlots}
      />
    </div>
  );
};

export default PlacementTestPage;
