import React, { useState, useEffect } from 'react';
import { X, Save, UserCheck, Award, BookOpen } from 'lucide-react';
import type { StaffMember, StaffRole, CreateStaffPayload, UpdateStaffPayload } from '../../types/staff';
import { AcademicService, type ClassItem } from '../../services/academic.service';

interface CreateEditStaffDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStaffPayload | UpdateStaffPayload, isEdit: boolean) => Promise<void>;
  editingStaff?: StaffMember | null;
  defaultRole?: StaffRole;
  isSubmitting: boolean;
  currentUserId?: number;
}

const QUICK_SPECIALIZATIONS = [
  'IELTS 8.5 Academic & Writing',
  'IELTS 8.0 Overall (Speaking & Listening)',
  'TOEIC 990 Master & Business English',
  'Cambridge CELTA & Giao tiếp Phản xạ',
];

export const CreateEditStaffDrawer: React.FC<CreateEditStaffDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingStaff,
  defaultRole = 'SALES',
  isSubmitting,
  currentUserId,
}) => {
  const isSelf = Boolean(currentUserId && editingStaff && currentUserId === editingStaff.id);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [roleCode, setRoleCode] = useState<StaffRole>(defaultRole);
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [isNative, setIsNative] = useState(false);
  const [bio, setBio] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Danh sách lớp học để phân công đứng lớp trực tiếp khi tạo/sửa Giảng viên
  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [initialClassIds, setInitialClassIds] = useState<number[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    if (editingStaff) {
      setFullName(editingStaff.fullName || '');
      setUsername(editingStaff.username || '');
      setEmail(editingStaff.email || '');
      setPhoneNumber(editingStaff.phoneNumber || '');
      setRoleCode(editingStaff.roleCode || defaultRole);
      setPassword('');
      setSpecialization(editingStaff.specialization || '');
      setIsNative(Boolean(editingStaff.isNative));
      setBio(editingStaff.bio || '');
    } else {
      setFullName('');
      setUsername('');
      setEmail('');
      setPhoneNumber('');
      setRoleCode(defaultRole);
      setPassword('');
      setSpecialization(defaultRole === 'TEACHER' ? 'IELTS 8.0+ Academic' : '');
      setIsNative(false);
      setBio('');
    }
    setErrors({});

    // Load danh sách lớp để hỗ trợ phân công đứng lớp
    AcademicService.getClasses()
      .then((clsList) => {
        setAllClasses(clsList);
        if (editingStaff?.fullName) {
          const targetName = editingStaff.fullName.trim().toLowerCase();
          const matchedIds = clsList
            .filter((c) => (c.teacherName || '').trim().toLowerCase() === targetName)
            .map((c) => c.id);
          setSelectedClassIds(matchedIds);
          setInitialClassIds(matchedIds);
        } else {
          setSelectedClassIds([]);
          setInitialClassIds([]);
        }
      })
      .catch(() => {
        setAllClasses([]);
      });
  }, [editingStaff, defaultRole, isOpen]);

  // Tự động gợi ý username & email khi nhập Họ tên ở chế độ Tạo mới
  const handleFullNameChange = (val: string) => {
    setFullName(val);
    if (!editingStaff) {
      const slug = val
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/\([^)]*\)/g, '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      if (slug.length > 0) {
        const last = slug[slug.length - 1];
        const firstInitials = slug.slice(0, -1).map((w) => w[0]).join('');
        const suggestedUser = firstInitials ? `${last}_${firstInitials}` : last;
        if (!username || username.includes('_')) {
          setUsername(suggestedUser);
        }
        if (!email || email.endsWith('@eduflow.vn')) {
          const roleSuffix = roleCode === 'TEACHER' ? '.teacher' : roleCode === 'ACADEMIC' ? '.academic' : '';
          setEmail(`${suggestedUser}${roleSuffix}@eduflow.vn`);
        }
      }
    }
  };

  const toggleClassAssignment = (classId: number) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Vui lòng nhập họ và tên';
    if (!editingStaff) {
      if (!username.trim()) errs.username = 'Vui lòng nhập tên đăng nhập';
      else if (!/^[a-zA-Z0-9_.]+$/.test(username.trim())) {
        errs.username = 'Tên đăng nhập chỉ chứa chữ, số, dấu gạch dưới hoặc chấm';
      }
    }
    if (!email.trim()) errs.email = 'Vui lòng nhập địa chỉ email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Địa chỉ email không đúng định dạng';
    }
    const cleanPhone = phoneNumber.trim().replace(/[\s.-]/g, '');
    if (cleanPhone && !/^[0-9]{9,15}$/.test(cleanPhone)) {
      errs.phoneNumber = 'Số điện thoại gồm 9 - 15 chữ số';
    }
    if (!editingStaff && (!password.trim() || password.trim().length < 6)) {
      errs.password = 'Vui lòng nhập mật khẩu (tối thiểu 6 ký tự)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const syncAssignedClasses = async (teacherFullName: string) => {
    if (roleCode !== 'TEACHER' && roleCode !== 'ACADEMIC') return;

    const toAssign = selectedClassIds.filter((id) => !initialClassIds.includes(id));
    const toUnassign = initialClassIds.filter((id) => !selectedClassIds.includes(id));

    const promises: Promise<any>[] = [];
    for (const classId of toAssign) {
      promises.push(AcademicService.updateClass(classId, { teacherName: teacherFullName }));
    }
    for (const classId of toUnassign) {
      promises.push(AcademicService.updateClass(classId, { teacherName: 'Chưa phân công' }));
    }
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const cleanPhone = phoneNumber.trim().replace(/[\s.-]/g, '');
    const cleanFullName = fullName.trim();

    if (editingStaff) {
      const payload: UpdateStaffPayload = {
        fullName: cleanFullName,
        email: email.trim().toLowerCase(),
        phoneNumber: cleanPhone,
        roleCode: isSelf ? undefined : roleCode,
        specialization: specialization.trim(),
        isNative,
        bio: bio.trim(),
      };
      await syncAssignedClasses(cleanFullName);
      await onSubmit(payload, true);
    } else {
      const payload: CreateStaffPayload = {
        fullName: cleanFullName,
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        phoneNumber: cleanPhone || undefined,
        roleCode,
        password: password.trim() || undefined,
        specialization: specialization.trim() || undefined,
        isNative,
        bio: bio.trim() || undefined,
      };
      await syncAssignedClasses(cleanFullName);
      await onSubmit(payload, false);
    }
  };

  return (
    <div className="staff-drawer-backdrop" onClick={onClose}>
      <div className="staff-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="staff-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--brand-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <UserCheck size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                {editingStaff
                  ? `Cập Nhật Hồ Sơ ${roleCode === 'TEACHER' ? 'Giảng Viên' : 'Nhân Sự'}`
                  : roleCode === 'TEACHER'
                  ? 'Thêm Giảng Viên Đứng Lớp Mới'
                  : 'Thêm Mới Nhân Sự'}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                {roleCode === 'TEACHER'
                  ? 'Thiết lập tài khoản giảng viên, chứng chỉ chuyên môn và phân công lớp đứng dạy'
                  : 'Cấp tài khoản và phân quyền truy cập hệ thống CRM'}
              </p>
            </div>
          </div>
          <button type="button" className="staff-modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="staff-drawer-body">
            {/* Vai trò */}
            <div className="staff-form-group">
              <label className="staff-form-label">
                Vai Trò Trong Hệ Thống <span className="req">*</span>
              </label>
              <select
                className="staff-form-select"
                value={roleCode}
                onChange={(e) => setRoleCode(e.target.value as StaffRole)}
                disabled={isSelf}
                style={isSelf ? { background: '#f1f5f9', cursor: 'not-allowed', fontWeight: 700 } : { fontWeight: 700 }}
              >
                <option value="TEACHER">👩‍🏫 Giảng viên đứng lớp (Teacher)</option>
                <option value="ACADEMIC">🎓 Giáo vụ đào tạo (Academic)</option>
                <option value="SALES">💼 Tư vấn viên tuyển sinh (Sales)</option>
                <option value="ADMIN">🛡️ Quản trị viên (Admin)</option>
              </select>
              {isSelf && (
                <span style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>
                  Không thể tự thay đổi vai trò của chính tài khoản đang đăng nhập.
                </span>
              )}
            </div>

            {/* Họ và tên */}
            <div className="staff-form-group">
              <label className="staff-form-label">
                Họ và Tên {roleCode === 'TEACHER' ? 'Giảng Viên' : 'Nhân Sự'} <span className="req">*</span>
              </label>
              <input
                type="text"
                className="staff-form-input"
                placeholder={
                  roleCode === 'TEACHER'
                    ? 'VD: ThS. Nguyễn Thị Thu Hà (Ms. Emily), Thầy David Miller...'
                    : 'VD: Lê Minh Tuấn...'
                }
                value={fullName}
                onChange={(e) => handleFullNameChange(e.target.value)}
              />
              {errors.fullName && <span className="staff-form-error">{errors.fullName}</span>}
            </div>

            {/* Tên đăng nhập & Mật khẩu */}
            <div style={{ display: 'grid', gridTemplateColumns: editingStaff ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div className="staff-form-group">
                <label className="staff-form-label">
                  Tên Đăng Nhập {!editingStaff && <span className="req">*</span>}
                </label>
                <input
                  type="text"
                  className="staff-form-input"
                  placeholder="VD: david_miller, tuanlm..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={Boolean(editingStaff)}
                  style={editingStaff ? { background: '#f1f5f9', cursor: 'not-allowed' } : {}}
                />
                {errors.username && <span className="staff-form-error">{errors.username}</span>}
              </div>

              {!editingStaff && (
                <div className="staff-form-group">
                  <label className="staff-form-label">
                    Mật Khẩu <span className="req">*</span>
                  </label>
                  <input
                    type="password"
                    className="staff-form-input"
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {errors.password && <span className="staff-form-error">{errors.password}</span>}
                </div>
              )}
            </div>

            {/* Email & Số điện thoại */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="staff-form-group">
                <label className="staff-form-label">
                  Email <span className="req">*</span>
                </label>
                <input
                  type="email"
                  className="staff-form-input"
                  placeholder="name@eduflow.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && <span className="staff-form-error">{errors.email}</span>}
              </div>

              <div className="staff-form-group">
                <label className="staff-form-label">Số Điện Thoại</label>
                <input
                  type="tel"
                  className="staff-form-input"
                  placeholder="0912 345 678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                {errors.phoneNumber && <span className="staff-form-error">{errors.phoneNumber}</span>}
              </div>
            </div>

            {/* Khu vực chuyên môn Giảng viên & Phân công đứng lớp */}
            {(roleCode === 'TEACHER' || roleCode === 'ACADEMIC') && (
              <div
                style={{
                  background: 'rgba(124, 58, 237, 0.04)',
                  border: '1px solid rgba(124, 58, 237, 0.2)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 13.5, color: 'var(--color-primary-royal)' }}>
                    <Award size={16} />
                    Hồ Sơ Chuyên Môn & Phân Công Đứng Lớp
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isNative}
                      onChange={(e) => setIsNative(e.target.checked)}
                      style={{ accentColor: 'var(--color-primary-royal)', width: 15, height: 15 }}
                    />
                    Giảng viên bản ngữ (Native Speaker)
                  </label>
                </div>

                <div className="staff-form-group">
                  <label className="staff-form-label">Trình Độ / Chứng Chỉ / Chuyên Môn Giảng Dạy</label>
                  <input
                    type="text"
                    className="staff-form-input"
                    placeholder="VD: IELTS 8.5 & Writing, TOEIC 990 Master..."
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {QUICK_SPECIALIZATIONS.map((spec) => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => setSpecialization(spec)}
                        style={{
                          fontSize: 11,
                          padding: '3px 8px',
                          borderRadius: 6,
                          border: specialization === spec ? '1px solid #7c3aed' : '1px solid #cbd5e1',
                          background: specialization === spec ? '#f5f3ff' : '#ffffff',
                          color: specialization === spec ? '#6d28d9' : '#475569',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="staff-form-group">
                  <label className="staff-form-label">Tóm Tắt Kinh Nghiệm & Phong Cách Giảng Dạy (Bio)</label>
                  <textarea
                    rows={2}
                    className="staff-form-textarea"
                    placeholder="VD: 8 năm kinh nghiệm luyện thi IELTS Academic & chấm chữa Writing chuyên sâu..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                {/* Chọn Lớp Học Đứng Lớp */}
                {allClasses.length > 0 && (
                  <div className="staff-form-group">
                    <label className="staff-form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <BookOpen size={14} style={{ color: '#2563eb' }} />
                      <span>Phân Công Lớp Học Đứng Lớp ({selectedClassIds.length} lớp đang chọn)</span>
                    </label>
                    <div
                      style={{
                        maxHeight: 170,
                        overflowY: 'auto',
                        border: '1px solid #cbd5e1',
                        borderRadius: 10,
                        background: '#ffffff',
                        padding: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      {allClasses.map((cls) => {
                        const checked = selectedClassIds.includes(cls.id);
                        return (
                          <label
                            key={cls.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                              padding: '6px 10px',
                              borderRadius: 8,
                              background: checked ? '#eff6ff' : '#f8fafc',
                              border: checked ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                              cursor: 'pointer',
                              fontSize: 12.5,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleClassAssignment(cls.id)}
                                style={{ accentColor: '#2563eb', width: 15, height: 15 }}
                              />
                              <div>
                                <span style={{ fontWeight: 700, color: '#1e293b' }}>{cls.classCode}</span>
                                <span style={{ color: '#475569', marginLeft: 6 }}>{cls.className}</span>
                              </div>
                            </div>
                            <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>
                              {cls.teacherName ? `GV: ${cls.teacherName}` : 'Chưa có GV'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="staff-drawer-footer">
            <button
              type="button"
              className="staff-btn staff-btn-refresh"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="staff-btn staff-btn-primary"
              disabled={isSubmitting}
            >
              <Save size={15} />
              {isSubmitting
                ? 'Đang lưu...'
                : editingStaff
                ? 'Lưu Cập Nhật Hồ Sơ'
                : roleCode === 'TEACHER'
                ? 'Tạo Giảng Viên & Phân Công'
                : 'Xác Nhận Tạo Nhân Sự'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
