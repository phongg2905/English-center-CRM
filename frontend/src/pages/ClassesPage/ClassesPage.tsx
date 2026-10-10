import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  BookOpen,
  Calendar,
  MapPin,
  Search,
  Plus,
  RefreshCw,
  Download,
  Users,
  User,
  Lock,
  SlidersHorizontal,
  RotateCcw,
  X,
} from 'lucide-react';
import { AcademicService } from '../../services/academic.service';
import type { ClassItem, CourseItem, ScheduleDays } from '../../types/academic';
import { CreateClassModal } from './CreateClassModal';
import { CreateCourseModal } from './CreateCourseModal';
import { ClassDetailDrawer } from './ClassDetailDrawer';
import { Button } from '../../components/ui';
import './ClassesPage.css';

export const ClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode: 'CLASSES' (Lưới lớp học & sĩ số) | 'COURSES' (Danh mục khóa học & lộ trình)
  const [viewMode, setViewMode] = useState<'CLASSES' | 'COURSES'>('CLASSES');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('ALL');
  const [selectedScheduleFilter, setSelectedScheduleFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Popover Filter State
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState<boolean>(false);
  const filterPopoverRef = useRef<HTMLDivElement>(null);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCourseFilter !== 'ALL') count++;
    if (selectedScheduleFilter !== 'ALL') count++;
    if (selectedStatusFilter !== 'ALL') count++;
    return count;
  }, [selectedCourseFilter, selectedScheduleFilter, selectedStatusFilter]);

  // Reset filters handler
  const handleResetFilters = () => {
    setSelectedCourseFilter('ALL');
    setSelectedScheduleFilter('ALL');
    setSelectedStatusFilter('ALL');
  };

  // Modals & Drawer State
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState<boolean>(false);
  const [createInitialCourseId, setCreateInitialCourseId] = useState<number | undefined>(undefined);

  // Load Data
  const loadData = useCallback(async (showSilent = false) => {
    try {
      if (!showSilent) setIsLoading(true);
      setError(null);

      const [classList, courseList] = await Promise.all([
        AcademicService.getClasses(),
        AcademicService.getCourses(),
      ]);

      setClasses(classList);
      setCourses(courseList);

      // If a class is currently opened in drawer, update its instance
      setSelectedClass((prev) => {
        if (!prev) return null;
        return classList.find((c) => c.id === prev.id) || prev;
      });
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu lớp học / khóa học:', err);
      setError(err?.response?.data?.message || err.message || 'Không thể tải dữ liệu từ máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered Classes
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.className.toLowerCase().includes(q);
        const matchCode = c.classCode.toLowerCase().includes(q);
        const matchTeacher = (c.teacherName || '').toLowerCase().includes(q);
        const matchRoom = (c.room || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchTeacher && !matchRoom) return false;
      }

      if (selectedCourseFilter !== 'ALL') {
        if (c.courseId !== Number(selectedCourseFilter)) return false;
      }

      if (selectedScheduleFilter !== 'ALL') {
        if (c.scheduleDays !== selectedScheduleFilter) return false;
      }

      if (selectedStatusFilter !== 'ALL') {
        if (c.status !== selectedStatusFilter) return false;
      }

      return true;
    });
  }, [classes, searchQuery, selectedCourseFilter, selectedScheduleFilter, selectedStatusFilter]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (filteredClasses.length === 0) {
      alert('Không có lớp học nào thỏa điều kiện lọc để xuất.');
      return;
    }

    const headers = [
      'Mã Lớp',
      'Tên Lớp',
      'Khóa Học',
      'Lịch Học',
      'Ca Học',
      'Phòng Học',
      'Giảng Viên',
      'Sĩ Số Hiện Tại',
      'Sĩ Số Tối Đa',
      'Trạng Thái',
      'Ngày Khai Giảng',
    ];

    const rows = filteredClasses.map((c) => [
      c.classCode,
      `"${c.className}"`,
      `"${c.courseName}"`,
      c.scheduleDays,
      `"${c.timeSlot}"`,
      `"${c.room || ''}"`,
      `"${c.teacherName || ''}"`,
      c.currentEnrolled,
      c.maxCapacity,
      c.status,
      c.startDate,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Danh_sach_lop_hoc_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getScheduleLabel = (days: ScheduleDays) => {
    switch (days) {
      case 'MON_WED_FRI':
        return 'Thứ 2 - 4 - 6';
      case 'TUE_THU_SAT':
        return 'Thứ 3 - 5 - 7';
      case 'WEEKEND':
        return 'Cuối tuần T7 - CN';
      default:
        return days;
    }
  };


  return (
    <div className="classes-page-container">
      {/* 1. COMPACT LINEAR / STRIPE TOOLBAR (Option 2) */}
      <div className="classes-compact-toolbar">
        {/* Left: View Mode Segmented Switcher */}
        <div className="compact-view-switcher">
          <button
            type="button"
            className={`compact-view-tab ${viewMode === 'CLASSES' ? 'active' : ''}`}
            onClick={() => setViewMode('CLASSES')}
          >
            <Users size={14} />
            <span>Lớp Học</span>
            <span className="compact-count-pill">{classes.length}</span>
          </button>
          <button
            type="button"
            className={`compact-view-tab ${viewMode === 'COURSES' ? 'active' : ''}`}
            onClick={() => setViewMode('COURSES')}
          >
            <BookOpen size={14} />
            <span>Khóa Học</span>
            <span className="compact-count-pill">{courses.length}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="compact-toolbar-divider" />

        {/* Center: Fluid Search Bar */}
        <div className="compact-search-box">
          <Search size={15} className="compact-search-icon" />
          <input
            type="text"
            placeholder="Tìm tên lớp, mã lớp, giảng viên, phòng học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="compact-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="compact-search-clear-btn"
              onClick={() => setSearchQuery('')}
              title="Xóa tìm kiếm"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="compact-toolbar-divider" />

        {/* Right: Actions Group (Filter Popover, Refresh, Export, CTA) */}
        <div className="compact-actions-group">
          {/* Floating Filter Popover */}
          <div className="compact-filter-container" ref={filterPopoverRef}>
            <button
              type="button"
              className={`compact-action-btn filter-trigger ${activeFilterCount > 0 ? 'active' : ''}`}
              onClick={() => setIsFilterPopoverOpen((prev) => !prev)}
              title="Bộ lọc điều kiện"
            >
              <SlidersHorizontal size={14} />
              <span>Bộ lọc</span>
              {activeFilterCount > 0 && (
                <span className="filter-badge-number">{activeFilterCount}</span>
              )}
            </button>

            {isFilterPopoverOpen && (
              <>
                <div
                  className="filter-popover-backdrop"
                  onClick={() => setIsFilterPopoverOpen(false)}
                />
                <div className="filter-popover-card">
                  <div className="filter-popover-header">
                    <span className="filter-popover-title">Bộ lọc nâng cao</span>
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        className="filter-reset-link"
                        onClick={handleResetFilters}
                      >
                        <RotateCcw size={12} />
                        <span>Đặt lại</span>
                      </button>
                    )}
                  </div>

                  <div className="filter-popover-body">
                    {/* Filter Khóa Học */}
                    <div className="popover-filter-field">
                      <label>Khóa học</label>
                      <select
                        value={selectedCourseFilter}
                        onChange={(e) => setSelectedCourseFilter(e.target.value)}
                        className="popover-select"
                      >
                        <option value="ALL">Tất cả khóa học</option>
                        {courses.map((crs) => (
                          <option key={crs.id} value={crs.id.toString()}>
                            {crs.courseName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filter Lịch Học */}
                    <div className="popover-filter-field">
                      <label>Lịch học trong tuần</label>
                      <select
                        value={selectedScheduleFilter}
                        onChange={(e) => setSelectedScheduleFilter(e.target.value)}
                        className="popover-select"
                      >
                        <option value="ALL">Tất cả lịch học</option>
                        <option value="MON_WED_FRI">Thứ 2 - 4 - 6</option>
                        <option value="TUE_THU_SAT">Thứ 3 - 5 - 7</option>
                        <option value="WEEKEND">Cuối tuần T7 - CN</option>
                      </select>
                    </div>

                    {/* Filter Trạng Thái */}
                    <div className="popover-filter-field">
                      <label>Trạng thái tuyển sinh</label>
                      <select
                        value={selectedStatusFilter}
                        onChange={(e) => setSelectedStatusFilter(e.target.value)}
                        className="popover-select"
                      >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="OPEN">Đang tuyển sinh (OPEN)</option>
                        <option value="IN_PROGRESS">Đang học (IN_PROGRESS)</option>
                        <option value="FULL">Đã đầy lớp (FULL)</option>
                        <option value="COMPLETED">Đã hoàn thành (COMPLETED)</option>
                      </select>
                    </div>
                  </div>

                  <div className="filter-popover-footer">
                    <button
                      type="button"
                      className="popover-apply-btn"
                      onClick={() => setIsFilterPopoverOpen(false)}
                    >
                      Áp dụng bộ lọc
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            className="compact-icon-btn"
            onClick={() => loadData()}
            disabled={isLoading}
            title="Làm mới dữ liệu từ máy chủ"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            className="compact-action-btn"
            onClick={handleExportCSV}
            title="Xuất file CSV"
          >
            <Download size={14} />
            <span>Xuất file</span>
          </button>

          {/* CTA: Mở Lớp Mới hoặc Tạo Khóa Học Mới tùy viewMode */}
          {viewMode === 'CLASSES' ? (
            <Button
              variant="primary"
              size="md"
              iconLeft={<Plus size={15} />}
              onClick={() => {
                setCreateInitialCourseId(undefined);
                setIsCreateModalOpen(true);
              }}
              style={{
                background: '#2563eb',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                fontWeight: 600,
                padding: '7px 14px',
                borderRadius: '10px',
                fontSize: '13px',
              }}
            >
              Mở Lớp Mới
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              iconLeft={<Plus size={15} />}
              onClick={() => setIsCreateCourseModalOpen(true)}
              style={{
                background: '#16a34a',
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                fontWeight: 600,
                padding: '7px 14px',
                borderRadius: '10px',
                fontSize: '13px',
              }}
            >
              Tạo Khóa Học Mới
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #fee2e2',
          }}
        >
          <p style={{ color: '#dc2626', fontWeight: 600 }}>{error}</p>
          <Button variant="glass" onClick={() => loadData()} style={{ marginTop: '12px' }}>
            Thử lại
          </Button>
        </div>
      ) : isLoading ? (
        <div
          style={{
            padding: '80px 20px',
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <RefreshCw
            size={36}
            className="animate-spin"
            style={{ color: '#2563eb', margin: '0 auto 12px auto' }}
          />
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
            Đang Tải Danh Mục Lớp Học & Khóa Học...
          </h4>
          <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
            Đang đồng bộ dữ liệu thời gian thực từ máy chủ EduFlow
          </p>
        </div>
      ) : viewMode === 'CLASSES' ? (
        /* ========================================================
           VIEW MODE 1: LỚP HỌC & GIÁM SÁT SĨ SỐ (PINTEREST GRID)
           ======================================================== */
        filteredClasses.length === 0 ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: '#ffffff',
              borderRadius: '18px',
              border: '1px dashed #cbd5e1',
            }}
          >
            <BookOpen size={40} style={{ color: '#94a3b8', margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#334155' }}>
              Không tìm thấy lớp học phù hợp
            </h3>
            <p style={{ margin: '6px 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.
            </p>
            <Button
              variant="primary"
              iconLeft={<Plus size={15} />}
              onClick={() => {
                setCreateInitialCourseId(undefined);
                setIsCreateModalOpen(true);
              }}
              style={{ background: '#2563eb' }}
            >
              Mở Lớp Học Mới Ngay
            </Button>
          </div>
        ) : (
          <div className="classes-grid-container">
            {filteredClasses.map((cls) => {
              const isFullClass = cls.isFull || cls.currentEnrolled >= cls.maxCapacity;
              const fillPercent = Math.min(
                100,
                Math.round((cls.currentEnrolled / cls.maxCapacity) * 100)
              );

              return (
                <div
                  key={cls.id}
                  className={`class-card ${isFullClass ? 'is-full-alert' : ''}`}
                  onClick={() => setSelectedClass(cls)}
                >
                  {/* Card Header: Class Title & Status Badge */}
                  <div className="class-card-header">
                    <div className="class-header-titles">
                      <h4 className="class-name-heading" title={cls.className}>
                        {cls.className}
                      </h4>
                      <div className="class-submeta-row">
                        <span className="class-teacher-text">
                          <User size={12} />
                          <span>{cls.teacherName || 'Chưa gán GV'}</span>
                        </span>
                      </div>
                    </div>

                    {isFullClass ? (
                      <span className="class-status-badge full">
                        <Lock size={11} /> ĐÃ ĐẦY
                      </span>
                    ) : (
                      <span
                        className={`class-status-badge ${cls.status.toLowerCase().replace('_', '-')}`}
                      >
                        ● {cls.status === 'OPEN' ? 'Tuyển sinh' : cls.status}
                      </span>
                    )}
                  </div>

                  {/* Schedule & Room Row */}
                  <div className="class-schedule-row">
                    <span className="class-meta-inline">
                      <Calendar size={13} />
                      <span>
                        {getScheduleLabel(cls.scheduleDays)} ({cls.timeSlot})
                      </span>
                    </span>
                    <span className="class-meta-dot">•</span>
                    <span className="class-meta-inline">
                      <MapPin size={13} />
                      <span>{cls.room || 'Chưa xếp phòng'}</span>
                    </span>
                  </div>

                  {/* Real-time Capacity Progress Bar (Minimal) */}
                  <div className="class-capacity-minimal">
                    <div className="capacity-text-row">
                      <span className="capacity-fraction-text">
                        Sĩ số: <strong>{cls.currentEnrolled}/{cls.maxCapacity}</strong> ({fillPercent}%)
                      </span>
                      <span
                        className="capacity-remaining-text"
                        style={{
                          color: isFullClass
                            ? '#dc2626'
                            : cls.availableSeats <= 2
                            ? '#d97706'
                            : '#059669',
                        }}
                      >
                        {isFullClass ? 'Khóa sổ' : `Còn ${cls.availableSeats} chỗ`}
                      </span>
                    </div>
                    <div className="capacity-track">
                      <div
                        className="capacity-fill"
                        style={{
                          width: `${fillPercent}%`,
                          backgroundColor: isFullClass
                            ? '#ef4444'
                            : fillPercent >= 80
                            ? '#f59e0b'
                            : '#10b981',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ========================================================
           VIEW MODE 2: DANH MỤC KHÓA HỌC & LỘ TRÌNH (COURSE CATALOG)
           ======================================================== */
        <div className="course-catalog-grid">
          {courses.map((crs) => {
            const courseClasses = classes.filter((c) => c.courseId === crs.id);
            return (
              <div key={crs.id} className="course-catalog-card">
                {/* Course Header */}
                <div className="course-header-row">
                  <div className="course-header-info">
                    <div className="course-title-price-row">
                      <h3 className="course-title">{crs.courseName}</h3>
                      <span className="course-tuition-val">
                        {Number(crs.standardTuition).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <p className="course-desc">
                      {crs.description || 'Chương trình đào tạo chuẩn quốc tế'}
                    </p>
                  </div>
                </div>

                {/* Course Metadata Pills */}
                <div className="course-meta-pills-row">
                  <span className="course-meta-pill">⏱ {crs.totalLessons} buổi học</span>
                  <span className="course-meta-pill target">
                    🎯 {crs.targetOutput || 'Chuẩn cam kết đầu ra'}
                  </span>
                </div>

                {/* Course Footer: Active Classes Count & Quick Add Class */}
                <div className="course-footer-row">
                  <button
                    type="button"
                    className="course-classes-count-btn"
                    onClick={() => {
                      setSelectedCourseFilter(crs.id.toString());
                      setViewMode('CLASSES');
                    }}
                    title="Bấm để xem danh sách lớp của khóa này"
                  >
                    <Users size={13} />
                    <span>{courseClasses.length} lớp học đang mở</span>
                  </button>

                  <button
                    type="button"
                    className="course-quick-add-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreateInitialCourseId(crs.id);
                      setIsCreateModalOpen(true);
                    }}
                    title="Mở thêm lớp cho khóa học này"
                  >
                    <Plus size={13} />
                    <span>Mở lớp</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. CREATE CLASS MODAL */}
      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => loadData(true)}
        initialCourseId={createInitialCourseId}
      />

      {/* 4b. CREATE COURSE MODAL */}
      <CreateCourseModal
        isOpen={isCreateCourseModalOpen}
        onClose={() => setIsCreateCourseModalOpen(false)}
        onSuccess={() => loadData(true)}
      />

      {/* 5. CLASS DETAIL DRAWER */}
      <ClassDetailDrawer
        classItem={selectedClass}
        isOpen={!!selectedClass}
        onClose={() => setSelectedClass(null)}
        onUpdated={() => loadData(true)}
      />
    </div>
  );
};
export default ClassesPage;
