import React, { useState } from 'react';
import { School, BookOpen, Clock, MapPin, Award, Search } from 'lucide-react';
import type { TeacherItem } from '../../types/staff';

interface TeacherRosterGridProps {
  teachers: TeacherItem[];
  isLoading: boolean;
}

export const TeacherRosterGrid: React.FC<TeacherRosterGridProps> = ({ teachers, isLoading }) => {
  const [nationalityFilter, setNationalityFilter] = useState<'ALL' | 'NATIVE' | 'VIETNAMESE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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
    return (
      <div className="staff-table-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Đang tải danh sách giảng viên...</p>
      </div>
    );
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="staff-search-box" style={{ maxWidth: 220 }}>
            <Search size={14} className="staff-search-icon" />
            <input
              type="text"
              className="staff-search-input"
              placeholder="Tìm giảng viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '6px 10px 6px 32px', fontSize: 12.5 }}
            />
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            Hiển thị <strong>{filteredTeachers.length}</strong> giảng viên
          </div>
        </div>
      </div>

      {filteredTeachers.length === 0 ? (
        <div className="staff-table-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <School size={40} style={{ opacity: 0.4, color: 'var(--text-subtle)', marginBottom: 12 }} />
          <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>
            Chưa có giảng viên nào phù hợp
          </h4>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Bạn có thể tạo mới giảng viên bằng nút "+ Thêm Nhân Sự Mới" ở góc phải.
          </p>
        </div>
      ) : (
        <div className="teacher-grid">
          {filteredTeachers.map((teacher) => (
            <div key={teacher.id} className="teacher-card">
              {/* Header card: Avatar + Info */}
              <div className="teacher-card-top">
                <div className="teacher-card-avatar">
                  {getInitials(teacher.fullName)}
                </div>
                <div className="teacher-card-meta">
                  <div className="teacher-card-name">{teacher.fullName}</div>
                  <div className="teacher-card-tags">
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

              {/* Bio snippet */}
              {teacher.bio && (
                <div className="teacher-card-bio">
                  "{teacher.bio}"
                </div>
              )}

              {/* Assigned Classes */}
              <div className="teacher-classes-section">
                <h5>
                  <BookOpen size={14} />
                  Lớp Đang Phụ Trách ({teacher.assignedClassesCount || teacher.assignedClasses?.length || 0})
                </h5>

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
                    Chưa được phân công phụ trách lớp học nào.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
