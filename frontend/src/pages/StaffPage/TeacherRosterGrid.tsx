import React, { useState, useEffect } from 'react';
import {
  School,
  BookOpen,
  Clock,
  MapPin,
  Award,
  Search,
  Edit3,
  Trash2,
  Eye,
  Plus,
  X,
  Save,
  Phone,
  Mail,
} from 'lucide-react';
import type { TeacherItem } from '../../types/staff';
import { AcademicService, type ClassItem } from '../../services/academic.service';
import { CardGridSkeleton, PaginationBar } from '../../components/ui';

interface TeacherRosterGridProps {
  teachers: TeacherItem[];
  isLoading: boolean;
  onAddTeacher?: () => void;
  onEditTeacher?: (teacher: TeacherItem) => void;
  onViewDetail?: (teacher: TeacherItem) => void;
  onDeleteTeacher?: (teacher: TeacherItem) => void;
  onClassesChanged?: () => void;
}

export const TeacherRosterGrid: React.FC<TeacherRosterGridProps> = ({
  teachers,
  isLoading,
  onAddTeacher,
  onEditTeacher,
  onViewDetail,
  onDeleteTeacher,
  onClassesChanged,
}) => {
  const [nationalityFilter, setNationalityFilter] = useState<'ALL' | 'NATIVE' | 'VIETNAMESE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);

  // State cho Cửa sổ Phân công đứng lớp nhanh
  const [assigningTeacher, setAssigningTeacher] = useState<TeacherItem | null>(null);
  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [initialClassIds, setInitialClassIds] = useState<number[]>([]);
  const [isSavingAssign, setIsSavingAssign] = useState<boolean>(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [nationalityFilter, searchQuery]);

  const handleOpenAssignModal = async (teacher: TeacherItem) => {
    setAssigningTeacher(teacher);
    try {
      const clsList = await AcademicService.getClasses();
      setAllClasses(clsList);
      const targetName = teacher.fullName.trim().toLowerCase();
      const matched = clsList
        .filter((c) => (c.teacherName || '').trim().toLowerCase() === targetName)
        .map((c) => c.id);
      setSelectedClassIds(matched);
      setInitialClassIds(matched);
    } catch {
      setAllClasses([]);
    }
  };

  const toggleClassId = (classId: number) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleSaveAssignClasses = async () => {
    if (!assigningTeacher) return;
    setIsSavingAssign(true);
    try {
      const toAssign = selectedClassIds.filter((id) => !initialClassIds.includes(id));
      const toUnassign = initialClassIds.filter((id) => !selectedClassIds.includes(id));

      const tasks: Promise<any>[] = [];
      for (const classId of toAssign) {
        tasks.push(AcademicService.updateClass(classId, { teacherName: assigningTeacher.fullName }));
      }
      for (const classId of toUnassign) {
        tasks.push(AcademicService.updateClass(classId, { teacherName: 'Chưa phân công' }));
      }
      if (tasks.length > 0) {
        await Promise.all(tasks);
      }
      setAssigningTeacher(null);
      if (onClassesChanged) onClassesChanged();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi khi cập nhật phân công lớp dạy');
    } finally {
      setIsSavingAssign(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'TC';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const filteredTeachers = teachers.filter((teacher) => {
    if (nationalityFilter === 'NATIVE' && !teacher.isNative) return false;
    if (nationalityFilter === 'VIETNAMESE' && teacher.isNative) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = teacher.fullName.toLowerCase().includes(q);
      const matchSpec = teacher.specialization?.toLowerCase().includes(q) || false;
      const matchEmail = teacher.email.toLowerCase().includes(q);
      if (!matchName && !matchSpec && !matchEmail) return false;
    }

    return true;
  });

  if (isLoading) {
    return <CardGridSkeleton count={6} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Sub-filters for Teacher Roster */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          padding: '12px 18px',
          background: 'var(--glass-bg)',
          borderRadius: 'var(--radius-md)',
          border: 'var(--glass-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
            Quốc tịch:
          </span>
          <div className="staff-tabs-pills" style={{ background: '#f8fafc' }}>
            <button
              type="button"
              className={`staff-tab-pill ${nationalityFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setNationalityFilter('ALL')}
              style={{ padding: '5px 12px', fontSize: 12.5 }}
            >
              Tất cả ({teachers.length})
            </button>
            <button
              type="button"
              className={`staff-tab-pill ${nationalityFilter === 'NATIVE' ? 'active' : ''}`}
              onClick={() => setNationalityFilter('NATIVE')}
              style={{ padding: '5px 12px', fontSize: 12.5 }}
            >
              Bản ngữ ({teachers.filter((t) => t.isNative).length})
            </button>
            <button
              type="button"
              className={`staff-tab-pill ${nationalityFilter === 'VIETNAMESE' ? 'active' : ''}`}
              onClick={() => setNationalityFilter('VIETNAMESE')}
              style={{ padding: '5px 12px', fontSize: 12.5 }}
            >
              Việt Nam ({teachers.filter((t) => !t.isNative).length})
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div className="staff-search-box" style={{ maxWidth: 230 }}>
            <Search size={14} className="staff-search-icon" />
            <input
              type="text"
              className="staff-search-input"
              placeholder="Tìm tên, chứng chỉ, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '6px 10px 6px 32px', fontSize: 12.5 }}
            />
          </div>
          {onAddTeacher && (
            <button
              type="button"
              className="staff-btn staff-btn-primary"
              onClick={onAddTeacher}
              style={{ padding: '7px 14px', fontSize: 12.5 }}
            >
              <Plus size={15} />
              Thêm Giảng Viên Đứng Lớp
            </button>
          )}
        </div>
      </div>

      {filteredTeachers.length === 0 ? (
        <div className="staff-table-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <School size={40} style={{ opacity: 0.4, color: 'var(--text-subtle)', marginBottom: 12 }} />
          <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>
            Chưa có giảng viên nào phù hợp
          </h4>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
            Bạn có thể tạo mới giảng viên đứng lớp ngay để phân công phụ trách các lớp đào tạo.
          </p>
          {onAddTeacher && (
            <button
              type="button"
              className="staff-btn staff-btn-primary"
              onClick={onAddTeacher}
              style={{ margin: '0 auto' }}
            >
              <Plus size={15} />
              Thêm Giảng Viên Đứng Lớp Mới
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="teacher-grid">
            {filteredTeachers
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map((teacher) => (
                <div key={teacher.id} className="teacher-card">
                  {/* Header card: Avatar + Info + Quick Actions */}
                  <div className="teacher-card-top" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                      <div className="teacher-card-avatar">
                        {getInitials(teacher.fullName)}
                      </div>
                      <div className="teacher-card-meta">
                        <div className="teacher-card-name">{teacher.fullName}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11.5, color: '#64748b', marginTop: 2, flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Mail size={11} /> {teacher.email}
                          </span>
                          {teacher.phoneNumber && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Phone size={11} /> {teacher.phoneNumber}
                            </span>
                          )}
                        </div>
                        <div className="teacher-card-tags" style={{ marginTop: 6 }}>
                          <span className="teacher-flag-tag">
                            {teacher.isNative ? 'Giảng viên Bản ngữ' : 'Giảng viên Việt Nam'}
                          </span>
                          {teacher.specialization && (
                            <span className="teacher-spec-pill">
                              <Award size={11} style={{ display: 'inline', marginRight: 3 }} />
                              {teacher.specialization}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Icons on Teacher Card */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {onViewDetail && (
                        <button
                          type="button"
                          className="staff-action-btn"
                          title="Xem hồ sơ chi tiết giảng viên"
                          onClick={() => onViewDetail(teacher)}
                        >
                          <Eye size={14} />
                        </button>
                      )}
                      {onEditTeacher && (
                        <button
                          type="button"
                          className="staff-action-btn"
                          title="Chỉnh sửa thông tin & chuyên môn giảng viên"
                          onClick={() => onEditTeacher(teacher)}
                        >
                          <Edit3 size={14} />
                        </button>
                      )}
                      {onDeleteTeacher && (
                        <button
                          type="button"
                          className="staff-action-btn btn-danger"
                          title="Xóa giảng viên"
                          onClick={() => onDeleteTeacher(teacher)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bio snippet */}
                  {teacher.bio && (
                    <div className="teacher-card-bio">
                      "{teacher.bio}"
                    </div>
                  )}

                  {/* Assigned Classes */}
                  <div className="teacher-classes-section">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <h5 style={{ margin: 0 }}>
                        <BookOpen size={14} />
                        Lớp Đang Phụ Trách ({teacher.assignedClassesCount || teacher.assignedClasses?.length || 0})
                      </h5>

                      <button
                        type="button"
                        onClick={() => handleOpenAssignModal(teacher)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 700,
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          cursor: 'pointer',
                        }}
                        title="Phân công hoặc thay đổi lớp học đứng lớp cho giảng viên này"
                      >
                        <Plus size={12} />
                        Phân công đứng lớp
                      </button>
                    </div>

                    {teacher.assignedClasses && teacher.assignedClasses.length > 0 ? (
                      <div className="teacher-class-chips">
                        {teacher.assignedClasses.map((cls) => (
                          <div key={cls.id} className="teacher-class-chip">
                            <div>
                              <span className="chip-code">{cls.classCode}</span>
                              <span style={{ fontSize: 11.5, color: 'var(--text-muted)', marginLeft: 6 }}>
                                ({cls.className})
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span className="chip-schedule">
                                <Clock size={11} style={{ display: 'inline', marginRight: 3 }} />
                                {cls.scheduleDays} {cls.timeSlot}
                              </span>
                              {cls.room && (
                                <span className="chip-room">
                                  <MapPin size={10} style={{ display: 'inline' }} /> {cls.room}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--text-subtle)', fontStyle: 'italic', padding: '6px 0' }}>
                        Chưa được phân công phụ trách lớp học nào. Bấm "Phân công đứng lớp" để gán lớp.
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
          <PaginationBar
            currentPage={currentPage}
            totalItems={filteredTeachers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            pageSizeOptions={[6, 9, 12]}
            itemLabel="giảng viên"
            style={{ border: '1px solid #e2e8f0' }}
          />
        </>
      )}

      {/* CỬA SỐ PHÂN CÔNG LỚP DẠY NHANH CHO GIẢNG VIÊN */}
      {assigningTeacher && (
        <div className="staff-modal-backdrop" onClick={() => setAssigningTeacher(null)}>
          <div
            className="staff-modal-box"
            style={{ maxWidth: 560, width: '92vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="staff-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                    Phân Công Lớp Đứng Dạy
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                    Giảng viên: <strong>{assigningTeacher.fullName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="staff-modal-close-btn"
                onClick={() => setAssigningTeacher(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="staff-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: 12.5, color: '#475569' }}>
                Chọn các lớp học mà giảng viên <strong>{assigningTeacher.fullName}</strong> sẽ đứng lớp phụ trách:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allClasses.map((cls) => {
                  const checked = selectedClassIds.includes(cls.id);
                  return (
                    <label
                      key={cls.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: checked ? '#eff6ff' : '#f8fafc',
                        border: checked ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleClassId(cls.id)}
                          style={{ accentColor: '#2563eb', width: 16, height: 16 }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                            {cls.classCode} — {cls.className}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                            {cls.courseName} • {cls.scheduleDays} ({cls.timeSlot}) • {cls.room || 'Chưa xếp phòng'}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: checked ? '#dbeafe' : '#e2e8f0',
                          color: checked ? '#1d4ed8' : '#475569',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {cls.teacherName ? `Hiện tại: ${cls.teacherName}` : 'Chưa có GV'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="staff-modal-footer">
              <button
                type="button"
                className="staff-btn staff-btn-refresh"
                onClick={() => setAssigningTeacher(null)}
                disabled={isSavingAssign}
              >
                Hủy
              </button>
              <button
                type="button"
                className="staff-btn staff-btn-primary"
                onClick={handleSaveAssignClasses}
                disabled={isSavingAssign}
              >
                <Save size={15} />
                {isSavingAssign ? 'Đang lưu...' : `Lưu Phân Công (${selectedClassIds.length} lớp)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
