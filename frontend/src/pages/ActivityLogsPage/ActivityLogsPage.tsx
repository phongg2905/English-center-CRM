import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Download,
  Clock,
  Activity,
  Users,
  BookOpen,
  Eye,
  X,
  Filter,
} from 'lucide-react';
import {
  AuditLogService,
  type AuditLogItem,
  type AuditLogFilterParams,
  type AuditLogListResponse,
} from '../../services/audit-log.service';
import { Button, PaginationBar } from '../../components/ui';
import './ActivityLogsPage.css';

const MODULE_META: Record<string, { label: string; bg: string; color: string }> = {
  AUTH: { label: 'Xác thực', bg: '#f1f5f9', color: '#475569' },
  LEADS: { label: 'Tuyển sinh (Leads)', bg: '#eff6ff', color: '#2563eb' },
  TESTS: { label: 'Khảo thí (Test)', bg: '#f5f3ff', color: '#7c3aed' },
  STUDENTS: { label: 'Học viên', bg: '#ecfdf5', color: '#059669' },
  CLASSES: { label: 'Lớp học', bg: '#fef3c7', color: '#d97706' },
  COURSES: { label: 'Khóa học', bg: '#e0f2fe', color: '#0284c7' },
  PAYMENTS: { label: 'Thu phí & Biên lai', bg: '#dcfce7', color: '#15803d' },
  STAFF: { label: 'Nhân sự', bg: '#fce7f3', color: '#be185d' },
  SETTINGS: { label: 'Cấu hình', bg: '#f3f4f6', color: '#374151' },
};

const ACTION_META: Record<string, { label: string; bg: string; color: string }> = {
  LOGIN: { label: 'Đăng nhập', bg: '#f1f5f9', color: '#334155' },
  CREATE: { label: 'Khởi tạo mới', bg: '#dcfce7', color: '#166534' },
  UPDATE: { label: 'Cập nhật', bg: '#dbeafe', color: '#1e40af' },
  STATUS_CHANGE: { label: 'Đổi trạng thái', bg: '#fef3c7', color: '#b45309' },
  ENROLL: { label: 'Xếp lớp / Ghi danh', bg: '#ede9fe', color: '#5b21b6' },
  PAYMENT: { label: 'Thu học phí', bg: '#d1fae5', color: '#065f46' },
  TRANSFER: { label: 'Chuyển lớp', bg: '#ffedd5', color: '#c2410c' },
  SCORE: { label: 'Chấm điểm Test', bg: '#e0e7ff', color: '#3730a3' },
  BOOK_TEST: { label: 'Đặt lịch Test', bg: '#fae8ff', color: '#86198f' },
  DELETE: { label: 'Xóa / Hủy', bg: '#fee2e2', color: '#991b1b' },
};

const ROLE_META: Record<string, { label: string; bg: string; color: string }> = {
  ADMIN: { label: 'Quản trị viên', bg: '#fee2e2', color: '#b91c1c' },
  SALES: { label: 'Tư vấn viên', bg: '#dbeafe', color: '#1d4ed8' },
  ACADEMIC: { label: 'Giáo vụ', bg: '#ede9fe', color: '#6d28d9' },
  TEACHER: { label: 'Giảng viên', bg: '#dcfce7', color: '#15803d' },
};

export const ActivityLogsPage: React.FC = () => {
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const buildFilterParams = useCallback((): AuditLogFilterParams => {
    const params: AuditLogFilterParams = { page, limit };
    if (moduleFilter !== 'ALL') params.module = moduleFilter;
    if (actionFilter !== 'ALL') params.action = actionFilter;
    if (roleFilter !== 'ALL') params.userRole = roleFilter;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return params;
  }, [moduleFilter, actionFilter, roleFilter, searchQuery, startDate, endDate, page, limit]);

  const initialCached = AuditLogService.peekLogs({ page: 1, limit: 10 });

  const [data, setData] = useState<AuditLogListResponse | null>(initialCached || null);
  const [loading, setLoading] = useState<boolean>(!initialCached);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const loadLogs = useCallback(
    async (forceRefresh = false) => {
      const params = buildFilterParams();
      const cached = !forceRefresh ? AuditLogService.peekLogs(params) : undefined;
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await AuditLogService.getLogs(params, { forceRefresh });
        setData(res);
      } catch (err) {
        console.error('Lỗi tải nhật ký hoạt động:', err);
      } finally {
        setLoading(false);
      }
    },
    [buildFilterParams]
  );

  useEffect(() => {
    loadLogs(false);
  }, [loadLogs]);

  const handleResetFilters = () => {
    setModuleFilter('ALL');
    setActionFilter('ALL');
    setRoleFilter('ALL');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleExportCsv = () => {
    if (!data?.logs?.length) return;
    const headers = [
      'ID',
      'Thời gian',
      'Tài khoản',
      'Họ và tên',
      'Vai trò',
      'Phân hệ',
      'Hành động',
      'Đối tượng',
      'Nội dung chi tiết',
      'IP',
    ];
    const rows = data.logs.map((l) => [
      l.id,
      new Date(l.createdAt).toLocaleString('vi-VN'),
      l.username,
      `"${(l.userFullName || '').replace(/"/g, '""')}"`,
      l.userRole,
      MODULE_META[l.module]?.label || l.module,
      ACTION_META[l.action]?.label || l.action,
      `"${(l.targetLabel || l.targetId || '').replace(/"/g, '""')}"`,
      `"${(l.description || '').replace(/"/g, '""')}"`,
      l.ipAddress || '',
    ]);
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nhat-ky-hoat-dong-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summary = data?.summary || {
    totalLogs: 0,
    todayLogs: 0,
    byModule: {},
    byAction: {},
  };

  const admissionsLogsCount =
    (summary.byModule.LEADS || 0) +
    (summary.byModule.STUDENTS || 0) +
    (summary.byModule.TESTS || 0);

  const academicFinanceLogsCount =
    (summary.byModule.CLASSES || 0) +
    (summary.byModule.COURSES || 0) +
    (summary.byModule.PAYMENTS || 0);

  return (
    <div className="activity-logs-page">
      {/* Header */}
      <div className="activity-logs-header">
        <div>
          <h2 className="activity-logs-title">Nhật Ký Hoạt Động Hệ Thống (Audit Logs)</h2>
          <p className="activity-logs-subtitle">
            Giám sát toàn bộ lịch sử thao tác trên hệ thống theo thời gian thực dành cho Quản trị viên
          </p>
        </div>
        <div className="activity-logs-actions">
          <Button
            variant="glass"
            size="sm"
            iconLeft={<Download size={15} />}
            onClick={handleExportCsv}
            disabled={!data?.logs?.length}
          >
            Xuất CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            iconLeft={<RefreshCw size={15} className={loading ? 'spin' : ''} />}
            onClick={() => loadLogs(true)}
            disabled={loading}
            style={{ background: '#2563eb' }}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="activity-kpi-grid">
        <div className="activity-kpi-card">
          <div className="activity-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="activity-kpi-label">Tổng bản ghi nhật ký</div>
            <div className="activity-kpi-value">{summary.totalLogs.toLocaleString('vi-VN')}</div>
            <div className="activity-kpi-sub">Lưu trữ tự động toàn hệ thống</div>
          </div>
        </div>

        <div className="activity-kpi-card">
          <div className="activity-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <Activity size={22} />
          </div>
          <div>
            <div className="activity-kpi-label">Hoạt động trong ngày</div>
            <div className="activity-kpi-value">{summary.todayLogs.toLocaleString('vi-VN')}</div>
            <div className="activity-kpi-sub">Thao tác phát sinh hôm nay</div>
          </div>
        </div>

        <div className="activity-kpi-card">
          <div className="activity-kpi-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <Users size={22} />
          </div>
          <div>
            <div className="activity-kpi-label">Tuyển sinh & Khảo thí</div>
            <div className="activity-kpi-value">{admissionsLogsCount.toLocaleString('vi-VN')}</div>
            <div className="activity-kpi-sub">Leads, Lịch thi & Hồ sơ HV</div>
          </div>
        </div>

        <div className="activity-kpi-card">
          <div className="activity-kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <BookOpen size={22} />
          </div>
          <div>
            <div className="activity-kpi-label">Đào tạo & Thu học phí</div>
            <div className="activity-kpi-value">{academicFinanceLogsCount.toLocaleString('vi-VN')}</div>
            <div className="activity-kpi-sub">Lớp học, Khóa học & Biên lai</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="activity-filter-card">
        <div className="activity-filter-row">
          <div className="activity-search-wrap">
            <Search size={15} />
            <input
              type="text"
              className="activity-search-input"
              placeholder="Tìm theo tên nhân sự, tài khoản, nội dung thao tác, mã lớp/học viên..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="activity-select"
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">Tất cả phân hệ</option>
            {Object.entries(MODULE_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>

          <select
            className="activity-select"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">Tất cả hành động</option>
            {Object.entries(ACTION_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>

          <select
            className="activity-select"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên (ADMIN)</option>
            <option value="SALES">Tư vấn viên (SALES)</option>
            <option value="ACADEMIC">Giáo vụ (ACADEMIC)</option>
            <option value="TEACHER">Giảng viên (TEACHER)</option>
          </select>
        </div>

        <div className="activity-filter-row" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={13} /> Khoảng thời gian:
            </span>
            <input
              type="date"
              className="activity-select"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
            <span style={{ color: '#94a3b8' }}>→</span>
            <input
              type="date"
              className="activity-select"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
            {(moduleFilter !== 'ALL' ||
              actionFilter !== 'ALL' ||
              roleFilter !== 'ALL' ||
              searchQuery ||
              startDate ||
              endDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  border: 'none',
                  background: '#fee2e2',
                  color: '#b91c1c',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '6px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Xóa bộ lọc
              </button>
            )}
          </div>

          <div style={{ fontSize: '12.5px', color: '#64748b' }}>
            Hiển thị <strong>{data?.logs?.length || 0}</strong> / <strong>{data?.total || 0}</strong> hoạt động
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="activity-table-card">
        <div className="activity-table-wrapper">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Nhân sự thực hiện</th>
                <th>Vai trò</th>
                <th>Phân hệ</th>
                <th>Hành động</th>
                <th>Nội dung hoạt động & Đối tượng</th>
                <th>Địa chỉ IP</th>
                <th style={{ textAlign: 'right' }}>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data?.logs?.length ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Đang tải nhật ký hoạt động hệ thống...
                  </td>
                </tr>
              ) : !data?.logs?.length ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Không tìm thấy bản ghi hoạt động nào khớp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                data.logs.map((log) => {
                  const modMeta = MODULE_META[log.module] || {
                    label: log.module,
                    bg: '#f1f5f9',
                    color: '#475569',
                  };
                  const actMeta = ACTION_META[log.action] || {
                    label: log.action,
                    bg: '#f1f5f9',
                    color: '#334155',
                  };
                  const roleMeta = ROLE_META[log.userRole] || {
                    label: log.userRole,
                    bg: '#f1f5f9',
                    color: '#475569',
                  };

                  return (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={13} color="#64748b" />
                          {new Date(log.createdAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                          {new Date(log.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{log.userFullName}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'monospace' }}>
                          @{log.username}
                        </div>
                      </td>

                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            background: roleMeta.bg,
                            color: roleMeta.color,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {roleMeta.label}
                        </span>
                      </td>

                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            background: modMeta.bg,
                            color: modMeta.color,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {modMeta.label}
                        </span>
                      </td>

                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 9px',
                            borderRadius: '999px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            background: actMeta.bg,
                            color: actMeta.color,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {actMeta.label}
                        </span>
                      </td>

                      <td style={{ maxWidth: '380px' }}>
                        <div style={{ fontWeight: 500, color: '#0f172a', lineHeight: 1.4 }}>
                          {log.description}
                        </div>
                        {(log.targetLabel || log.targetId) && (
                          <div style={{ marginTop: '4px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {log.targetLabel && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  background: '#f1f5f9',
                                  color: '#334155',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                }}
                              >
                                {log.targetLabel}
                              </span>
                            )}
                            {log.targetId && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  color: '#64748b',
                                  fontFamily: 'monospace',
                                }}
                              >
                                #{log.targetId}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>
                        {log.ipAddress || '127.0.0.1'}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          style={{
                            border: '1px solid #e2e8f0',
                            background: '#ffffff',
                            color: '#2563eb',
                            borderRadius: '7px',
                            padding: '5px 10px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Eye size={13} /> Xem
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > 0 && (
          <PaginationBar
            currentPage={page}
            totalItems={data.total}
            pageSize={limit}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setLimit(size);
              setPage(1);
            }}
            pageSizeOptions={[10, 20, 50]}
            itemLabel="hoạt động"
          />
        )}
      </div>

      {/* Metadata Detail Modal */}
      {selectedLog && (
        <div
          className="create-class-modal-overlay"
          onClick={() => setSelectedLog(null)}
          style={{ zIndex: 1200 }}
        >
          <div
            className="create-class-modal-card"
            style={{ maxWidth: '560px', width: '92vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="create-class-modal-header">
              <div className="modal-title-wrap">
                <div className="modal-header-icon-box">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    Chi Tiết Bản Ghi Nhật Ký #{selectedLog.id}
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                    {new Date(selectedLog.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>Người thực hiện:</span>
                  <div style={{ fontWeight: 700 }}>{selectedLog.userFullName} (@{selectedLog.username})</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>Vai trò & IP:</span>
                  <div style={{ fontWeight: 700 }}>
                    {ROLE_META[selectedLog.userRole]?.label || selectedLog.userRole} • {selectedLog.ipAddress || '127.0.0.1'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>Phân hệ:</span>
                  <div style={{ fontWeight: 700 }}>
                    {MODULE_META[selectedLog.module]?.label || selectedLog.module}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>Hành động:</span>
                  <div style={{ fontWeight: 700 }}>
                    {ACTION_META[selectedLog.action]?.label || selectedLog.action}
                  </div>
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Nội dung chi tiết:</span>
                <div style={{ fontWeight: 600, marginTop: '2px', color: '#0f172a' }}>
                  {selectedLog.description}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Dữ liệu đính kèm (Metadata JSON):</span>
                <pre
                  style={{
                    marginTop: '6px',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    overflowX: 'auto',
                    maxHeight: '220px',
                  }}
                >
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="create-class-modal-footer">
              <Button variant="primary" size="sm" onClick={() => setSelectedLog(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

