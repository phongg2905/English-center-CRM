import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  School,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { StaffService } from '../../services/staff.service';
import type {
  StaffMember,
  TeacherItem,
  StaffPagination,
  StaffRoleSummary,
  CreateStaffPayload,
  UpdateStaffPayload,
} from '../../types/staff';
import { StaffTable } from './StaffTable';
import { TeacherRosterGrid } from './TeacherRosterGrid';
import { CreateEditStaffDrawer } from './CreateEditStaffDrawer';
import { ResetPasswordModal } from './ResetPasswordModal';
import { DeactivateStaffModal } from './DeactivateStaffModal';
import { StaffDetailModal } from './StaffDetailModal';
import './StaffPage.css';

export const StaffPage: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = user?.id;

  // Active Tab: 'staff' (All Staff Table) vs 'teachers' (Teacher Roster Cards)
  const [activeTab, setActiveTab] = useState<'staff' | 'teachers'>('staff');

  // Data states
  const [staffs, setStaffs] = useState<StaffMember[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [pagination, setPagination] = useState<StaffPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [roleSummary, setRoleSummary] = useState<StaffRoleSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modal / Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset Password Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTargetStaff, setResetTargetStaff] = useState<StaffMember | null>(null);

  // Deactivate Modal State
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deactivateTargetStaff, setDeactivateTargetStaff] = useState<StaffMember | null>(null);

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTargetStaff, setDetailTargetStaff] = useState<StaffMember | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Show notice helper
  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setActionNotice({ message, type });
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Fetch staffs
  const loadStaffs = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);

      const params: any = {
        page: currentPage,
        limit: 10,
      };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (statusFilter === 'ACTIVE') params.status = 'active';
      if (statusFilter === 'LOCKED') params.status = 'inactive';

      const [staffsRes, teachersRes] = await Promise.all([
        StaffService.getStaffs(params),
        StaffService.getTeachers(),
      ]);

      if (staffsRes) {
        setStaffs(staffsRes.staffs || []);
        setPagination(staffsRes.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        if (staffsRes.summary) {
          setRoleSummary(staffsRes.summary);
        }
      }

      setTeachers(teachersRes || []);
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu nhân sự:', err);
      showNotice(err.response?.data?.message || 'Không thể tải danh sách nhân sự', 'error');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [currentPage, searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    loadStaffs();
  }, [loadStaffs]);

  // KPI Calculations (Ưu tiên summary tổng thể hệ thống từ database)
  const totalStaffCount = roleSummary?.total ?? (pagination.total || staffs.length);
  const teacherCount = roleSummary?.teacherCount ?? teachers.length;

  // Handlers for Drawer
  const handleOpenCreateDrawer = () => {
    setEditingStaff(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (staff: StaffMember) => {
    setEditingStaff(staff);
    setIsDrawerOpen(true);
  };

  const handleDrawerSubmit = async (
    data: CreateStaffPayload | UpdateStaffPayload,
    isEdit: boolean
  ) => {
    try {
      setIsSubmitting(true);
      if (isEdit && editingStaff) {
        await StaffService.updateStaff(editingStaff.id, data as UpdateStaffPayload);
        showNotice(`Cập nhật thông tin nhân viên ${(data as UpdateStaffPayload).fullName || editingStaff.fullName} thành công!`);
      } else {
        await StaffService.createStaff(data as CreateStaffPayload);
        showNotice('Tạo mới tài khoản nhân sự thành công!');
      }
      setIsDrawerOpen(false);
      await loadStaffs(true);
    } catch (err: any) {
      console.error('Lỗi lưu nhân sự:', err);
      showNotice(err.response?.data?.message || 'Có lỗi xảy ra khi lưu nhân sự', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Reset Password
  const handleOpenResetModal = (staff: StaffMember) => {
    setResetTargetStaff(staff);
    setResetModalOpen(true);
  };

  const handleConfirmResetPassword = async (newPassword?: string) => {
    if (!resetTargetStaff) return undefined;
    try {
      setIsSubmitting(true);
      const res = await StaffService.resetPassword(resetTargetStaff.id, newPassword);
      showNotice(`Đã đặt lại mật khẩu cho tài khoản ${resetTargetStaff.username}!`);
      return res.temporaryPassword;
    } catch (err: any) {
      showNotice(err.response?.data?.message || 'Không thể đặt lại mật khẩu', 'error');
      return undefined;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Toggle Status
  const handleOpenToggleStatusModal = (staff: StaffMember) => {
    setDeactivateTargetStaff(staff);
    setDeactivateModalOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!deactivateTargetStaff) return;
    try {
      setIsSubmitting(true);
      const newStatus = !deactivateTargetStaff.isActive;
      await StaffService.updateStaffStatus(deactivateTargetStaff.id, newStatus);
      showNotice(
        newStatus
          ? `Đã kích hoạt lại tài khoản ${deactivateTargetStaff.fullName}`
          : `Đã khóa tài khoản ${deactivateTargetStaff.fullName}`
      );
      setDeactivateModalOpen(false);
      await loadStaffs(true);
    } catch (err: any) {
      showNotice(err.response?.data?.message || 'Không thể thay đổi trạng thái tài khoản', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Delete
  const handleDeleteStaff = async (staff: StaffMember) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản của ${staff.fullName} (@${staff.username})?`
    );
    if (!confirmed) return;

    try {
      await StaffService.deleteStaff(staff.id);
      showNotice(`Đã xóa tài khoản ${staff.fullName} thành công!`);
      await loadStaffs(true);
    } catch (err: any) {
      showNotice(err.response?.data?.message || 'Không thể xóa tài khoản nhân viên', 'error');
    }
  };

  // Handlers for Detail Modal
  const handleOpenDetailModal = async (staff: StaffMember) => {
    setDetailTargetStaff(staff);
    setDetailModalOpen(true);

    try {
      setIsLoadingDetail(true);
      const fullData = await StaffService.getStaffById(staff.id);
      if (fullData) {
        setDetailTargetStaff(fullData);
      }
    } catch (err) {
      console.error('Không thể tải thông tin chi tiết nhân sự:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <div className="staff-page">
      {/* Toast Notice */}
      {actionNotice && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            background: actionNotice.type === 'success' ? '#10b981' : '#ef4444',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: 13.5,
            boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'fadeInStaff 0.25s ease',
          }}
        >
          {actionNotice.message}
        </div>
      )}

      {/* Unified Action & Filter Toolbar (Dual-Wing) */}
      <div className="staff-filter-card">
        {/* Top Row: Left: Tabs Navigation | Right: Action Buttons */}
        <div className="staff-filter-top">
          {/* Segmented Tab Buttons */}
          <div className="staff-tabs-pills">
            <button
              type="button"
              className={`staff-tab-pill ${activeTab === 'staff' ? 'active' : ''}`}
              onClick={() => setActiveTab('staff')}
            >
              <Users size={15} />
              Danh Sách Nhân Sự ({totalStaffCount})
            </button>
            <button
              type="button"
              className={`staff-tab-pill ${activeTab === 'teachers' ? 'active' : ''}`}
              onClick={() => setActiveTab('teachers')}
            >
              <School size={15} />
              Đội Ngũ Giảng Viên ({teacherCount})
            </button>
          </div>

          {/* Action Buttons (Right Wing) */}
          <div className="staff-header-actions">
            <button
              type="button"
              className="staff-btn staff-btn-refresh"
              onClick={() => loadStaffs()}
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} />
              Làm Mới
            </button>

            <button
              type="button"
              className="staff-btn staff-btn-primary"
              onClick={handleOpenCreateDrawer}
            >
              <Plus size={16} />
              Thêm Nhân Sự Mới
            </button>
          </div>
        </div>

        {/* Filter Controls Row (for Staff tab) */}
        {activeTab === 'staff' && (
          <div
            className="staff-filter-controls"
            style={{
              paddingTop: '12px',
              borderTop: 'var(--glass-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            {/* Search Box */}
            <div className="staff-search-box" style={{ flex: 1, minWidth: '260px' }}>
              <Search size={15} className="staff-search-icon" />
              <input
                type="text"
                className="staff-search-input"
                placeholder="Tìm theo tên, email, SĐT, user..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Role Select Filter */}
            <select
              className="staff-select-control"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="ADMIN">Quản trị viên</option>
              <option value="SALES">Tư vấn viên</option>
              <option value="ACADEMIC">Giáo vụ</option>
              <option value="TEACHER">Giảng viên</option>
            </select>

            {/* Status Select Filter */}
            <select
              className="staff-select-control"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="LOCKED">Đã khóa</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'staff' ? (
        <StaffTable
          staffs={staffs}
          pagination={pagination}
          onPageChange={(p) => setCurrentPage(p)}
          onViewDetail={handleOpenDetailModal}
          onEdit={handleOpenEditDrawer}
          onResetPassword={handleOpenResetModal}
          onToggleStatus={handleOpenToggleStatusModal}
          onDelete={handleDeleteStaff}
          currentUserId={currentUserId}
        />
      ) : (
        <TeacherRosterGrid teachers={teachers} isLoading={isLoading} />
      )}

      {/* Create / Edit Staff Drawer */}
      <CreateEditStaffDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleDrawerSubmit}
        editingStaff={editingStaff}
        isSubmitting={isSubmitting}
        currentUserId={currentUserId}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        staff={resetTargetStaff}
        onConfirmReset={handleConfirmResetPassword}
        isSubmitting={isSubmitting}
      />

      {/* Deactivate / Activate Account Modal */}
      <DeactivateStaffModal
        isOpen={deactivateModalOpen}
        onClose={() => setDeactivateModalOpen(false)}
        staff={deactivateTargetStaff}
        onConfirm={handleConfirmToggleStatus}
        isSubmitting={isSubmitting}
      />

      {/* Staff Profile Detail Modal */}
      <StaffDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setDetailTargetStaff(null);
        }}
        staff={detailTargetStaff}
        isLoading={isLoadingDetail}
        onEdit={handleOpenEditDrawer}
        onResetPassword={handleOpenResetModal}
        onToggleStatus={handleOpenToggleStatusModal}
        isCurrentUser={detailTargetStaff?.id === currentUserId}
      />
    </div>
  );
};
