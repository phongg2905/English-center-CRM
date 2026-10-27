import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Button, KanbanSkeleton, PaginationBar } from '../../components/ui';
import {
  Phone,
  Mail,
  Calendar,
  Plus,
  X,
  RefreshCw,
  Search,
  Download,
  CheckCircle2,
  Clock,
  User,
  BookOpen,
  FileText,
  Send,
  MessageSquare,
  Copy,
  Check,
  Save,
  AlertCircle,
  Flame,
  SunMedium,
  Snowflake,
  UserPlus,
  PhoneCall,
  CalendarCheck,
  GraduationCap,
  UserX,
  Sparkles,
  LayoutGrid,
  List,
  Award,
  UserCheck,
} from 'lucide-react';
import { CreateLeadModal } from './CreateLeadModal';
import { LeadService } from '../../services/lead.service';
import { StaffService } from '../../services/staff.service';
import { PlacementTestService } from '../../services/placement-test.service';
import { useAuth } from '../../hooks/useAuth';
import { hasRequiredRole, ACTION_PERMISSIONS } from '../../config/rbac.config';
import type {
  LeadWithDetails,
  LeadPipelineStage,
  LeadInterest,
  LeadSourceChannel,
  KanbanBoardResponse,
  InteractionLog,
  InteractionType,
  PotentialLevel,
} from '../../types/lead';
import type { PlacementTestWithDetails } from '../../types/placement-test';
import '../../App.css';

interface KanbanColConfig {
  id: LeadPipelineStage;
  title: string;
  color: string;
  bgColor: string;
  columnBg: string;
  borderColor: string;
  dotGlow: string;
  icon: React.ReactNode;
}

const KANBAN_COLUMNS: KanbanColConfig[] = [
  {
    id: 'NEW',
    title: 'Mới tiếp nhận',
    color: '#f97316', // Orange
    bgColor: 'rgba(249, 115, 22, 0.1)',
    columnBg: '#fffbf7',
    borderColor: '#f97316',
    dotGlow: 'rgba(249, 115, 22, 0.35)',
    icon: <UserPlus size={15} />,
  },
  {
    id: 'CONTACTING',
    title: 'Đang tư vấn',
    color: '#2563eb', // Royal Blue
    bgColor: 'rgba(37, 99, 235, 0.1)',
    columnBg: '#f8faff',
    borderColor: '#3b82f6',
    dotGlow: 'rgba(37, 99, 235, 0.35)',
    icon: <PhoneCall size={15} />,
  },
  {
    id: 'TEST_SCHEDULED',
    title: 'Đã hẹn lịch Test',
    color: '#7c3aed', // Purple
    bgColor: 'rgba(124, 58, 237, 0.1)',
    columnBg: '#faf8ff',
    borderColor: '#8b5cf6',
    dotGlow: 'rgba(124, 58, 237, 0.35)',
    icon: <CalendarCheck size={15} />,
  },
  {
    id: 'ENROLLED',
    title: 'Đã nhập học',
    color: '#059669', // Emerald Green
    bgColor: 'rgba(5, 150, 105, 0.1)',
    columnBg: '#f6fdf9',
    borderColor: '#10b981',
    dotGlow: 'rgba(5, 150, 105, 0.35)',
    icon: <GraduationCap size={15} />,
  },
  {
    id: 'LOST',
    title: 'Hủy / Thất bại',
    color: '#64748b', // Slate
    bgColor: 'rgba(100, 116, 139, 0.1)',
    columnBg: '#fafafa',
    borderColor: '#cbd5e1',
    dotGlow: 'rgba(100, 116, 139, 0.3)',
    icon: <UserX size={15} />,
  },
];

function formatLeadTime(dateInput: string | Date | undefined): string {
  if (!dateInput) return 'Vừa tiếp nhận';
  const d = new Date(dateInput);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (isToday) {
    return `Hôm nay ${timeStr}`;
  }
  return `${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} ${timeStr}`;
}

export const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreateLead = hasRequiredRole(user?.role, ACTION_PERMISSIONS.LEAD_CREATE);
  const canEditLead = hasRequiredRole(user?.role, ACTION_PERMISSIONS.LEAD_EDIT);
  const canEnrollStudent = hasRequiredRole(user?.role, ACTION_PERMISSIONS.ENROLL_STUDENT);

  // Data states
  const [kanbanData, setKanbanData] = useState<KanbanBoardResponse>(() => {
    return (
      LeadService.peekKanban() || {
        NEW: [],
        CONTACTING: [],
        TEST_SCHEDULED: [],
        ENROLLED: [],
        LOST: [],
        counts: {
          NEW: 0,
          CONTACTING: 0,
          TEST_SCHEDULED: 0,
          ENROLLED: 0,
          LOST: 0,
        },
      }
    );
  });
  const [consultants, setConsultants] = useState<Array<{ id: number; fullName: string }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(() => !LeadService.peekKanban());
  const [error, setError] = useState<string | null>(null);

  // Global Filters & View Mode
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<'ALL' | LeadPipelineStage>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [selectedInterest, setSelectedInterest] = useState<string>('ALL');
  const [selectedConsultant, setSelectedConsultant] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Per-Status Search Queries inside each Kanban column
  const [columnSearches, setColumnSearches] = useState<Record<LeadPipelineStage, string>>({
    NEW: '',
    CONTACTING: '',
    TEST_SCHEDULED: '',
    ENROLLED: '',
    LOST: '',
  });

  // Pagination for Table View
  const [tablePage, setTablePage] = useState<number>(1);
  const [tablePageSize, setTablePageSize] = useState<number>(10);

  // Selected lead for Tabbed Profile Window
  const [selectedLead, setSelectedLead] = useState<LeadWithDetails | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'OVERVIEW' | 'TIMELINE' | 'TESTS'>('OVERVIEW');
  const [timelineLogs, setTimelineLogs] = useState<InteractionLog[]>([]);
  const [leadPlacementTests, setLeadPlacementTests] = useState<PlacementTestWithDetails[]>([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Editable Lead states for Tab 1 & Window Save
  const [editFullName, setEditFullName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editInterest, setEditInterest] = useState<LeadInterest>('IELTS');
  const [editSourceChannel, setEditSourceChannel] = useState<LeadSourceChannel>('FB_ADS');
  const [editStage, setEditStage] = useState<LeadPipelineStage>('NEW');
  const [editAssignedSalesId, setEditAssignedSalesId] = useState<string>('');
  const [editLostReason, setEditLostReason] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isSavingLead, setIsSavingLead] = useState<boolean>(false);
  const [saveLeadSuccess, setSaveLeadSuccess] = useState<string | null>(null);
  const [saveLeadError, setSaveLeadError] = useState<string | null>(null);

  // Create Lead Modal states (FE-03B)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createModalInitialStage, setCreateModalInitialStage] = useState<LeadPipelineStage>('NEW');

  // Quick Consultation Log Form states
  const [logType, setLogType] = useState<InteractionType>('PHONE_CALL');
  const [logPotential, setLogPotential] = useState<PotentialLevel>('HOT');
  const [logContent, setLogContent] = useState<string>('');
  const [logFollowUp, setLogFollowUp] = useState<string>('');
  const [isSubmittingLog, setIsSubmittingLog] = useState<boolean>(false);
  const [logSuccessMsg, setLogSuccessMsg] = useState<string | null>(null);

  // Drag over stage visual tracker & active dragging lead
  const [draggingLead, setDraggingLead] = useState<{ id: number; stage: LeadPipelineStage } | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<LeadPipelineStage | null>(null);

  // Global drag end listener to ensure drag states are cleanly reset even if drop occurs outside
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setDraggingLead(null);
      setDragOverColumn(null);
    };
    window.addEventListener('dragend', handleGlobalDragEnd);
    return () => window.removeEventListener('dragend', handleGlobalDragEnd);
  }, []);

  // Reset table page when filters change
  useEffect(() => {
    setTablePage(1);
  }, [searchQuery, selectedStageFilter, selectedSource, selectedInterest, selectedConsultant]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (selectedLead) {
      const originalBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const contentBody = document.querySelector('.app-content-body') as HTMLElement | null;
      const originalContentOverflow = contentBody ? contentBody.style.overflowY : '';
      if (contentBody) {
        contentBody.style.overflowY = 'hidden';
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setSelectedLead(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        if (contentBody) {
          contentBody.style.overflowY = originalContentOverflow;
        }
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [selectedLead]);

  // Load real data from Backend API
  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent && !LeadService.peekKanban()) setIsLoading(true);
      setError(null);

      const [kanbanRes, consultantsRes] = await Promise.all([
        LeadService.getKanban(undefined, { forceRefresh: silent }),
        StaffService.getConsultants().catch(() => []),
      ]);
      setKanbanData(kanbanRes);
      if (Array.isArray(consultantsRes) && consultantsRes.length > 0) {
        setConsultants(consultantsRes.map((c) => ({ id: c.id, fullName: c.fullName })));
      }
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu Leads:', err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Không thể tải dữ liệu phễu tuyển sinh. Vui lòng kiểm tra lại server backend.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fetch timeline & placement tests when a lead is selected in window
  const handleSelectLead = async (lead: LeadWithDetails) => {
    setSelectedLead(lead);
    setEditFullName(lead.fullName || '');
    setEditPhone(lead.phoneNumber || '');
    setEditEmail(lead.email || '');
    setEditInterest(lead.interest);
    setEditSourceChannel(lead.sourceChannel);
    setEditStage(lead.pipelineStage);
    setEditAssignedSalesId(lead.assignedSalesId ? String(lead.assignedSalesId) : '');
    setEditLostReason(lead.lostReason || '');
    setEditNotes(lead.notes || '');
    setSaveLeadSuccess(null);
    setSaveLeadError(null);

    setActiveDrawerTab('OVERVIEW');
    setIsTimelineLoading(true);
    setTimelineLogs([]);
    setLeadPlacementTests([]);
    setLogContent('');
    setLogFollowUp('');
    setLogSuccessMsg(null);

    try {
      const [logs, testsRes] = await Promise.all([
        LeadService.getTimeline(lead.id).catch(() => []),
        PlacementTestService.getTests({ limit: 100 }).catch(() => ({ tests: [] })),
      ]);
      setTimelineLogs(logs);
      const allTests = Array.isArray(testsRes)
        ? testsRes
        : Array.isArray(testsRes?.tests)
        ? testsRes.tests
        : [];
      setLeadPlacementTests(allTests.filter((t) => t.leadId === lead.id));
    } catch (err) {
      console.warn('Không thể tải lịch sử chăm sóc của Lead:', err);
    } finally {
      setIsTimelineLoading(false);
    }
  };

  // Save edited lead details from window
  const handleSaveLead = async () => {
    if (!selectedLead) return;
    if (!editFullName.trim()) {
      setSaveLeadError('Vui lòng nhập họ và tên học viên');
      return;
    }
    if (!editPhone.trim()) {
      setSaveLeadError('Vui lòng nhập số điện thoại');
      return;
    }
    if (editStage === 'LOST' && !editLostReason.trim()) {
      setSaveLeadError('Vui lòng nhập lý do hủy / từ chối khi chọn trạng thái HỦY');
      return;
    }

    setIsSavingLead(true);
    setSaveLeadError(null);
    setSaveLeadSuccess(null);

    try {
      const updated = await LeadService.updateLead(selectedLead.id, {
        fullName: editFullName.trim(),
        phoneNumber: editPhone.trim(),
        email: editEmail.trim() || null,
        interest: editInterest,
        sourceChannel: editSourceChannel,
        pipelineStage: editStage,
        assignedSalesId: editAssignedSalesId ? Number(editAssignedSalesId) : null,
        lostReason: editStage === 'LOST' ? editLostReason.trim() : null,
        notes: editNotes.trim() || null,
      });

      setSelectedLead(updated);
      setSaveLeadSuccess('Đã lưu thông tin & phân công Lead thành công!');
      setTimeout(() => setSaveLeadSuccess(null), 3500);

      // Refresh kanban board data
      await loadData(true);
    } catch (err: any) {
      setSaveLeadError(err?.response?.data?.message || err.message || 'Lỗi khi cập nhật thông tin Lead');
    } finally {
      setIsSavingLead(false);
    }
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Quick submit interaction log from drawer
  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !logContent.trim()) return;

    setIsSubmittingLog(true);
    try {
      await LeadService.addInteractionLog(selectedLead.id, {
        interactionType: logType,
        potentialLevel: logPotential,
        content: logContent.trim(),
        nextFollowUpAt: logFollowUp ? new Date(logFollowUp).toISOString() : null,
      });

      // Refetch timeline logs
      const updatedLogs = await LeadService.getTimeline(selectedLead.id);
      setTimelineLogs(updatedLogs);

      // Refresh lead details (in case auto promoted to CONTACTING)
      const updatedLead = await LeadService.getLeadById(selectedLead.id);
      setSelectedLead(updatedLead);
      setEditStage(updatedLead.pipelineStage);
      await loadData(true);

      setLogContent('');
      setLogFollowUp('');
      setLogSuccessMsg('Đã lưu nhật ký tư vấn thành công!');
      setTimeout(() => setLogSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi khi ghi nhật ký tư vấn');
    } finally {
      setIsSubmittingLog(false);
    }
  };

  // Drag and Drop move card handler
  const handleDrop = async (e: React.DragEvent, toStage: LeadPipelineStage) => {
    e.preventDefault();
    setDragOverColumn(null);
    setDraggingLead(null);

    if (!canEditLead) return;

    try {
      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return;
      const { leadId, fromStage } = JSON.parse(raw);

      if (fromStage === toStage) return;

      // Handle business rule: moving to LOST requires lostReason
      let lostReason: string | undefined = undefined;
      if (toStage === 'LOST') {
        const inputReason = window.prompt(
          'Vui lòng nhập lý do hủy / từ chối của khách hàng (VD: Học phí cao, Lịch không phù hợp):'
        );
        if (!inputReason || !inputReason.trim()) {
          alert('Chuyển sang trạng thái LOST yêu cầu phải có lý do hủy.');
          return;
        }
        lostReason = inputReason.trim();
      }

      // Optimistic UI update
      const backupState = { ...kanbanData };
      setKanbanData((prev) => {
        const sourceList = [...prev[fromStage as LeadPipelineStage]];
        const targetList = [...prev[toStage]];

        const leadIdx = sourceList.findIndex((l) => l.id === leadId);
        if (leadIdx === -1) return prev;

        const [movedLead] = sourceList.splice(leadIdx, 1);
        const updatedLead: LeadWithDetails = {
          ...movedLead,
          pipelineStage: toStage,
          lostReason: lostReason || null,
          updatedAt: new Date().toISOString(),
        };

        targetList.unshift(updatedLead);

        return {
          ...prev,
          [fromStage]: sourceList,
          [toStage]: targetList,
          counts: {
            ...prev.counts,
            [fromStage]: Math.max(0, prev.counts[fromStage as LeadPipelineStage] - 1),
            [toStage]: prev.counts[toStage] + 1,
          },
        };
      });

      // Call API Backend
      try {
        await LeadService.updateStage(leadId, toStage, lostReason);
      } catch (apiErr: any) {
        // Rollback on error
        setKanbanData(backupState);
        alert(apiErr?.response?.data?.message || 'Lỗi khi cập nhật trạng thái Lead');
      }
    } catch (err) {
      console.error('Lỗi drag-drop:', err);
    }
  };

  // Export CSV handler
  const handleExportCSV = () => {
    const allLeads = [
      ...kanbanData.NEW,
      ...kanbanData.CONTACTING,
      ...kanbanData.TEST_SCHEDULED,
      ...kanbanData.ENROLLED,
      ...kanbanData.LOST,
    ];

    if (allLeads.length === 0) {
      alert('Không có dữ liệu Lead để xuất file.');
      return;
    }

    const headers = [
      'ID',
      'Họ và tên',
      'Số điện thoại',
      'Email',
      'Khóa học quan tâm',
      'Nguồn tiếp cận',
      'Giai đoạn',
      'Người phụ trách',
      'Ghi chú',
      'Thời gian tiếp nhận',
    ];

    const rows = allLeads.map((l) => [
      l.id,
      `"${l.fullName}"`,
      `"${l.phoneNumber}"`,
      `"${l.email || ''}"`,
      l.interest,
      l.sourceChannel,
      l.pipelineStage,
      `"${l.assignedSalesName || 'Chưa gán'}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      new Date(l.createdAt).toLocaleDateString('vi-VN'),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `danh_sach_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Extract unique consultants from both API and loaded leads
  const consultantOptions = useMemo(() => {
    const map = new Map<number, string>();
    consultants.forEach((c) => map.set(c.id, c.fullName));
    const allLeads = [
      ...kanbanData.NEW,
      ...kanbanData.CONTACTING,
      ...kanbanData.TEST_SCHEDULED,
      ...kanbanData.ENROLLED,
      ...kanbanData.LOST,
    ];
    allLeads.forEach((l) => {
      if (l.assignedSalesId && l.assignedSalesName) {
        map.set(l.assignedSalesId, l.assignedSalesName);
      }
    });
    return Array.from(map.entries()).map(([id, fullName]) => ({ id, fullName }));
  }, [consultants, kanbanData]);

  // Filtered Kanban columns (supports both Global Search AND Per-Status Column Search)
  const filteredColumns = useMemo(() => {
    const qGlobal = searchQuery.toLowerCase().trim();

    return KANBAN_COLUMNS.filter(
      (col) => selectedStageFilter === 'ALL' || col.id === selectedStageFilter
    ).map((col) => {
      const colLeads = kanbanData[col.id] || [];
      const qCol = (columnSearches[col.id] || '').toLowerCase().trim();

      const filtered = colLeads.filter((lead) => {
        const matchGlobal =
          !qGlobal ||
          lead.fullName.toLowerCase().includes(qGlobal) ||
          lead.phoneNumber.includes(qGlobal) ||
          (lead.email && lead.email.toLowerCase().includes(qGlobal)) ||
          (lead.assignedSalesName && lead.assignedSalesName.toLowerCase().includes(qGlobal)) ||
          (lead.notes && lead.notes.toLowerCase().includes(qGlobal));

        const matchColSearch =
          !qCol ||
          lead.fullName.toLowerCase().includes(qCol) ||
          lead.phoneNumber.includes(qCol) ||
          (lead.email && lead.email.toLowerCase().includes(qCol)) ||
          (lead.assignedSalesName && lead.assignedSalesName.toLowerCase().includes(qCol)) ||
          (lead.notes && lead.notes.toLowerCase().includes(qCol));

        const matchInterest = selectedInterest === 'ALL' || lead.interest === selectedInterest;
        const matchSource = selectedSource === 'ALL' || lead.sourceChannel === selectedSource;
        const matchConsultant =
          selectedConsultant === 'ALL'
            ? true
            : selectedConsultant === 'UNASSIGNED'
            ? !lead.assignedSalesId
            : String(lead.assignedSalesId) === selectedConsultant;

        return matchGlobal && matchColSearch && matchInterest && matchSource && matchConsultant;
      });

      return {
        ...col,
        totalRawCount: colLeads.length,
        count: filtered.length,
        leads: filtered,
      };
    });
  }, [
    kanbanData,
    searchQuery,
    columnSearches,
    selectedStageFilter,
    selectedInterest,
    selectedSource,
    selectedConsultant,
  ]);

  // Flat filtered list for Table View
  const allFilteredLeads = useMemo(() => {
    return filteredColumns.flatMap((c) => c.leads);
  }, [filteredColumns]);

  const paginatedTableLeads = useMemo(() => {
    const start = (tablePage - 1) * tablePageSize;
    return allFilteredLeads.slice(start, start + tablePageSize);
  }, [allFilteredLeads, tablePage, tablePageSize]);

  const totalLeadsCount = useMemo(() => {
    return (
      (kanbanData.NEW?.length || 0) +
      (kanbanData.CONTACTING?.length || 0) +
      (kanbanData.TEST_SCHEDULED?.length || 0) +
      (kanbanData.ENROLLED?.length || 0) +
      (kanbanData.LOST?.length || 0)
    );
  }, [kanbanData]);

  return (
    <div className="dashboard-page" style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 1. Unified Action & Filter Toolbar */}
      <div
        className="leads-filters-bar"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: '#ffffff',
          padding: '14px 18px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          {/* Left Wing: Search & Dropdown Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1, minWidth: '300px' }}>
            {/* Global Search input */}
            <div className="behance-search-container" style={{ minWidth: '250px', position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Tìm tên, SĐT, email, ghi chú..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="behance-search-input"
                style={{ paddingRight: searchQuery ? '30px' : '12px' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  title="Xóa từ khóa"
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Sources */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="behance-select"
            >
              <option value="ALL">Tất cả nguồn tiếp cận</option>
              <option value="FB_ADS">Facebook Ads</option>
              <option value="WEBSITE">Website Trung Tâm</option>
              <option value="HOTLINE">Hotline Tổng Đài</option>
              <option value="WALK_IN">Đến Trực Tiếp (Walk-in)</option>
              <option value="REFERRAL">Người quen giới thiệu</option>
            </select>

            {/* Filter Interests */}
            <select
              value={selectedInterest}
              onChange={(e) => setSelectedInterest(e.target.value)}
              className="behance-select"
            >
              <option value="ALL">Tất cả khóa học</option>
              <option value="IELTS">Luyện thi IELTS</option>
              <option value="TOEIC">Luyện thi TOEIC</option>
              <option value="COMMUNICATION">Tiếng Anh Giao tiếp</option>
            </select>

            {/* Filter Consultant */}
            <select
              value={selectedConsultant}
              onChange={(e) => setSelectedConsultant(e.target.value)}
              className="behance-select"
            >
              <option value="ALL">Tất cả tư vấn viên</option>
              <option value="UNASSIGNED">Chưa phân công</option>
              {consultantOptions.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  TVV: {c.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Right Wing: View Switcher & Primary Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
            {/* View Mode Toggle: Kanban vs Table */}
            <div
              style={{
                display: 'inline-flex',
                background: '#f1f5f9',
                padding: '3px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 11px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === 'kanban' ? '#ffffff' : 'transparent',
                  color: viewMode === 'kanban' ? '#2563eb' : '#64748b',
                  boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <LayoutGrid size={14} />
                <span>Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 11px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === 'table' ? '#ffffff' : 'transparent',
                  color: viewMode === 'table' ? '#2563eb' : '#64748b',
                  boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <List size={14} />
                <span>Danh sách</span>
              </button>
            </div>

            {/* Refresh button */}
            <button
              type="button"
              onClick={() => {
                LeadService.invalidateCache();
                loadData(true);
              }}
              disabled={isLoading}
              title="Làm mới dữ liệu từ server"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                cursor: 'pointer',
                color: '#475569',
              }}
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            </button>

            {/* Export CSV button */}
            <Button
              variant="glass"
              size="md"
              iconLeft={<Download size={15} />}
              onClick={handleExportCSV}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                fontWeight: 600,
                color: '#334155',
              }}
            >
              Xuất CSV
            </Button>

            {/* Add Lead button */}
            {canCreateLead && (
              <Button
                variant="primary"
                size="md"
                iconLeft={<Plus size={16} />}
                onClick={() => {
                  setCreateModalInitialStage('NEW');
                  setIsCreateModalOpen(true);
                }}
                style={{
                  background: '#2563eb',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                  fontWeight: 600,
                }}
              >
                Thêm Lead Mới
              </Button>
            )}
          </div>
        </div>

        {/* Row 2: Customer Status Filter Pills (Lọc nhanh theo từng trạng thái khách hàng) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            paddingTop: '10px',
            borderTop: '1px dashed #e2e8f0',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>
            Trạng thái khách hàng:
          </span>
          <button
            type="button"
            onClick={() => setSelectedStageFilter('ALL')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              border: selectedStageFilter === 'ALL' ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
              background: selectedStageFilter === 'ALL' ? '#eff6ff' : '#f8fafc',
              color: selectedStageFilter === 'ALL' ? '#2563eb' : '#475569',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Tất cả trạng thái</span>
            <span
              style={{
                padding: '1px 7px',
                borderRadius: '999px',
                fontSize: '11px',
                background: selectedStageFilter === 'ALL' ? '#2563eb' : '#e2e8f0',
                color: selectedStageFilter === 'ALL' ? '#ffffff' : '#475569',
              }}
            >
              {totalLeadsCount}
            </span>
          </button>

          {KANBAN_COLUMNS.map((col) => {
            const isSelected = selectedStageFilter === col.id;
            const rawCount = (kanbanData[col.id] || []).length;
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => setSelectedStageFilter(isSelected ? 'ALL' : col.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSelected ? `1.5px solid ${col.color}` : '1px solid #e2e8f0',
                  background: isSelected ? col.bgColor : '#ffffff',
                  color: isSelected ? col.color : '#475569',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ display: 'inline-flex', color: col.color }}>{col.icon}</span>
                <span>{col.title}</span>
                <span
                  style={{
                    padding: '1px 7px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    background: isSelected ? col.color : '#f1f5f9',
                    color: isSelected ? '#ffffff' : col.color,
                  }}
                >
                  {rawCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Content: Kanban View vs Paginated Table View */}
      {error ? (
        <div style={{ padding: '32px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px solid #fee2e2' }}>
          <p style={{ color: '#dc2626', fontWeight: 600 }}>{error}</p>
          <Button variant="glass" onClick={() => loadData()} style={{ marginTop: '12px' }}>
            Thử lại
          </Button>
        </div>
      ) : isLoading ? (
        <KanbanSkeleton columns={5} cardsPerColumn={3} />
      ) : viewMode === 'kanban' ? (
        <div
          className={`kanban-board-container ${draggingLead ? 'is-dragging-active' : ''}`}
          style={
            filteredColumns.length === 1
              ? { gridTemplateColumns: 'minmax(360px, 680px)' }
              : undefined
          }
        >
          {filteredColumns.map((col) => {
            const isOver = dragOverColumn === col.id && (!draggingLead || draggingLead.stage !== col.id);
            const colSearchVal = columnSearches[col.id] || '';

            return (
              <div
                key={col.id}
                className="kanban-column"
                style={{
                  background: isOver ? `${col.color}0d` : col.columnBg,
                  border: isOver ? `2px dashed ${col.borderColor}` : '1px solid #e2e8f0',
                  boxShadow: isOver ? `0 0 16px ${col.dotGlow}` : undefined,
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  if (draggingLead && draggingLead.stage !== col.id) {
                    if (dragOverColumn !== col.id) setDragOverColumn(col.id);
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (draggingLead && draggingLead.stage !== col.id) {
                    if (dragOverColumn !== col.id) setDragOverColumn(col.id);
                  } else if (!draggingLead) {
                    if (dragOverColumn !== col.id) setDragOverColumn(col.id);
                  }
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  const related = e.relatedTarget as Node | null;
                  if (!e.currentTarget.contains(related)) {
                    if (dragOverColumn === col.id) setDragOverColumn(null);
                  }
                }}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {/* Column Header: Stage Icon + Title + Count Badge + [+] Quick Add */}
                <div
                  className="kanban-column-header"
                  style={{
                    borderTop: `3.5px solid ${col.borderColor}`,
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="kanban-column-title">
                      <span
                        className="column-stage-icon"
                        style={{
                          color: col.color,
                          background: col.bgColor,
                        }}
                      >
                        {col.icon}
                      </span>
                      <span>{col.title}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        className="column-count-badge"
                        style={{
                          color: col.color,
                          background: col.bgColor,
                          borderColor: `${col.color}30`,
                        }}
                      >
                        {col.count} Leads
                      </span>
                      {col.id === 'NEW' && canCreateLead && (
                        <button
                          type="button"
                          onClick={() => {
                            setCreateModalInitialStage('NEW');
                            setIsCreateModalOpen(true);
                          }}
                          className="column-header-add-btn"
                          title="Tiếp nhận Lead mới vào cột này"
                        >
                          <Plus size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Per-Status Search Bar inside each column */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search
                      size={13}
                      style={{ position: 'absolute', left: '9px', color: '#94a3b8', pointerEvents: 'none' }}
                    />
                    <input
                      type="text"
                      value={colSearchVal}
                      onChange={(e) =>
                        setColumnSearches((prev) => ({
                          ...prev,
                          [col.id]: e.target.value,
                        }))
                      }
                      placeholder={`Tìm trong ${col.title}...`}
                      style={{
                        width: '100%',
                        padding: '5px 26px 5px 28px',
                        fontSize: '11.5px',
                        borderRadius: '8px',
                        border: colSearchVal ? `1px solid ${col.color}` : '1px solid #e2e8f0',
                        background: '#ffffff',
                        color: '#1e293b',
                        outline: 'none',
                      }}
                    />
                    {colSearchVal && (
                      <button
                        type="button"
                        onClick={() =>
                          setColumnSearches((prev) => ({
                            ...prev,
                            [col.id]: '',
                          }))
                        }
                        title="Xóa tìm kiếm cột này"
                        style={{
                          position: 'absolute',
                          right: '6px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#64748b',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Card List */}
                <div className="kanban-card-list">
                  {/* Drag Over Drop Placeholder */}
                  {isOver && (
                    <div
                      className="kanban-drop-placeholder"
                      style={{
                        border: `1.5px dashed ${col.borderColor}`,
                        color: col.color,
                        background: col.bgColor,
                      }}
                    >
                      <Sparkles size={14} />
                      <span>Thả thẻ vào "{col.title}"</span>
                    </div>
                  )}

                  {col.leads.map((lead) => {
                    const isThisCardDragging = draggingLead?.id === lead.id;
                    return (
                      <div
                        key={lead.id}
                        className={`lead-card ${isThisCardDragging ? 'is-dragging' : ''}`}
                        draggable={canEditLead}
                        onDragStart={(e) => {
                          if (!canEditLead) return;
                          setDraggingLead({ id: lead.id, stage: lead.pipelineStage });
                          e.dataTransfer.setData(
                            'application/json',
                            JSON.stringify({ leadId: lead.id, fromStage: lead.pipelineStage })
                          );
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={() => {
                          setDraggingLead(null);
                          setDragOverColumn(null);
                        }}
                        onClick={() => handleSelectLead(lead)}
                      >
                        {/* Top Row: Avatar + Name + Time */}
                        <div className="lead-card-header">
                          <div className="lead-student-info">
                            <div className="lead-avatar-sm">
                              {lead.fullName.split(' ').pop()?.[0]?.toUpperCase() || 'H'}
                            </div>
                            <div>
                              <div className="lead-student-name">{lead.fullName}</div>
                              <div className="lead-student-time">{formatLeadTime(lead.createdAt)}</div>
                            </div>
                          </div>
                        </div>

                        {/* Middle: Phone & Email */}
                        <div className="lead-contact-info">
                          <div className="lead-contact-item">
                            <Phone size={13} style={{ color: '#2563eb', flexShrink: 0 }} />
                            <span style={{ fontWeight: 500 }}>{lead.phoneNumber}</span>
                          </div>
                          <div className="lead-contact-item">
                            <Mail size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                            <span>{lead.email || 'Chưa cập nhật email'}</span>
                          </div>
                        </div>

                        {/* Lost reason notification if LOST */}
                        {lead.lostReason && (
                          <div
                            style={{
                              fontSize: '11px',
                              color: '#dc2626',
                              background: '#fef2f2',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid #fee2e2',
                              lineHeight: '1.4',
                            }}
                          >
                            Lý do: {lead.lostReason}
                          </div>
                        )}

                        {/* Bottom Footer: Badges & Sales Name */}
                        <div className="lead-card-footer">
                          <div className="lead-tags">
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600,
                                background: '#eff6ff',
                                color: '#2563eb',
                                border: '1px solid #dbeafe',
                              }}
                            >
                              {lead.interest}
                            </span>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 500,
                                background: '#f1f5f9',
                                color: '#475569',
                              }}
                            >
                              {lead.sourceChannel}
                            </span>
                          </div>

                          <span style={{ fontWeight: 500, color: '#64748b' }}>
                            {lead.assignedSalesName || 'Chưa gán'}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty State */}
                  {col.leads.length === 0 && !isOver && (
                    <div className="kanban-empty-state">
                      <div
                        className="empty-state-icon-box"
                        style={{ color: col.color, background: col.bgColor }}
                      >
                        {col.icon}
                      </div>
                      <div className="empty-state-title">
                        {colSearchVal ? 'Không tìm thấy kết quả' : 'Chưa có Lead'}
                      </div>
                      <div className="empty-state-desc">
                        {colSearchVal
                          ? `Không có khách hàng nào khớp với "${colSearchVal}" trong cột này.`
                          : col.id === 'NEW'
                          ? 'Chưa có Lead mới. Bấm "+" để tiếp nhận ngay'
                          : 'Kéo thả thẻ vào đây để chuyển sang giai đoạn này'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Column Footer: Quick Add Button */}
                {col.id === 'NEW' && canCreateLead && (
                  <div className="kanban-column-footer">
                    <button
                      type="button"
                      className="column-quick-add-btn"
                      onClick={() => {
                        setCreateModalInitialStage('NEW');
                        setIsCreateModalOpen(true);
                      }}
                    >
                      <Plus size={13} />
                      <span>Thêm Lead mới...</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW MODE WITH PAGINATION */
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Khách hàng / Học viên</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Liên hệ</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Nhu cầu & Nguồn</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Trạng thái khách hàng</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Tư vấn viên</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Tiếp nhận</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTableLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                      Không tìm thấy khách hàng nào khớp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  paginatedTableLeads.map((lead) => {
                    const colCfg = KANBAN_COLUMNS.find((c) => c.id === lead.pipelineStage) || KANBAN_COLUMNS[0];
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => handleSelectLead(lead)}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{lead.fullName}</div>
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>Mã: #{lead.id}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#2563eb' }}>{lead.phoneNumber}</div>
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>{lead.email || '—'}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: '#eff6ff',
                              color: '#2563eb',
                              marginRight: '6px',
                            }}
                          >
                            {lead.interest}
                          </span>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: '#f1f5f9',
                              color: '#475569',
                            }}
                          >
                            {lead.sourceChannel}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              background: colCfg.bgColor,
                              color: colCfg.color,
                            }}
                          >
                            {colCfg.icon}
                            <span>{colCfg.title}</span>
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>
                          {lead.assignedSalesName || 'Chưa phân công'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                          {formatLeadTime(lead.createdAt)}
                        </td>
                        <td
                          style={{ padding: '12px 16px', textAlign: 'right' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => navigate(`/tests?bookLeadId=${lead.id}`)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '8px',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                border: '1px solid #ddd6fe',
                                background: '#f5f3ff',
                                color: '#6d28d9',
                                cursor: 'pointer',
                              }}
                              title="Đặt lịch thi đầu vào cho khách hàng này"
                            >
                              Hẹn Test
                            </button>
                            {canEnrollStudent && (
                              <button
                                type="button"
                                onClick={() => navigate(`/students?enrollLeadId=${lead.id}`)}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '8px',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  border: '1px solid #a7f3d0',
                                  background: '#ecfdf5',
                                  color: '#047857',
                                  cursor: 'pointer',
                                }}
                                title="Ghi danh & Xếp lớp cho khách hàng này"
                              >
                                Ghi danh
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <PaginationBar
            currentPage={tablePage}
            totalItems={allFilteredLeads.length}
            pageSize={tablePageSize}
            onPageChange={setTablePage}
            onPageSizeChange={setTablePageSize}
            itemLabel="khách hàng"
          />
        </div>
      )}

      {/* 4. LEAD DETAIL WINDOW */}
      {selectedLead &&
        createPortal(
          <div className="drawer-backdrop" onClick={() => setSelectedLead(null)}>
            <div className="slide-over-drawer" onClick={(e) => e.stopPropagation()}>
              {/* Hero Header */}
              <div className="drawer-hero">
                <div className="drawer-hero-top">
                  <div className="drawer-profile-info">
                    <div className="drawer-avatar-lg">
                      {selectedLead.fullName.split(' ').pop()?.[0]?.toUpperCase() || 'H'}
                    </div>
                    <div>
                      <div className="drawer-lead-name">{selectedLead.fullName}</div>
                      <div className="drawer-lead-meta">
                        <span>Mã Lead: #{selectedLead.id}</span>
                        <span>•</span>
                        <span>Tiếp nhận: {formatLeadTime(selectedLead.createdAt)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #dbeafe',
                          }}
                        >
                          {selectedLead.interest}
                        </span>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: '#f1f5f9',
                            color: '#475569',
                          }}
                        >
                          {selectedLead.sourceChannel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedLead(null)}
                    aria-label="Đóng"
                    style={{
                      background: '#f1f5f9',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748b',
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Quick Action Icons Bar */}
                <div className="drawer-quick-actions">
                  <a href={`tel:${selectedLead.phoneNumber}`} className="drawer-quick-btn primary">
                    <Phone size={15} />
                    <span>Gọi Điện</span>
                  </a>
                  {selectedLead.email ? (
                    <a href={`mailto:${selectedLead.email}`} className="drawer-quick-btn">
                      <Mail size={15} />
                      <span>Email</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="drawer-quick-btn"
                      style={{ opacity: 0.5, cursor: 'not-allowed' }}
                    >
                      <Mail size={15} />
                      <span>Email</span>
                    </button>
                  )}
                  <a
                    href={`https://zalo.me/${selectedLead.phoneNumber.replace(/^0/, '84')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="drawer-quick-btn"
                  >
                    <MessageSquare size={15} />
                    <span>Zalo</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const targetId = selectedLead.id;
                      setSelectedLead(null);
                      navigate(`/tests?bookLeadId=${targetId}`);
                    }}
                    className="drawer-quick-btn"
                  >
                    <Calendar size={15} />
                    <span>Đặt Lịch Thi</span>
                  </button>
                  {canEnrollStudent && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetId = selectedLead.id;
                        setSelectedLead(null);
                        navigate(`/students?enrollLeadId=${targetId}`);
                      }}
                      className="drawer-quick-btn"
                      style={{ color: '#059669', borderColor: '#a7f3d0', background: '#ecfdf5' }}
                    >
                      <UserCheck size={15} />
                      <span>Ghi Danh</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="drawer-tabs-nav">
                <button
                  type="button"
                  onClick={() => setActiveDrawerTab('OVERVIEW')}
                  className={`drawer-tab-item ${activeDrawerTab === 'OVERVIEW' ? 'active' : ''}`}
                >
                  <User size={14} />
                  <span>Tổng quan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDrawerTab('TIMELINE')}
                  className={`drawer-tab-item ${activeDrawerTab === 'TIMELINE' ? 'active' : ''}`}
                >
                  <Clock size={14} />
                  <span>Nhật ký tư vấn</span>
                  <span className="badge-count">{timelineLogs.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDrawerTab('TESTS')}
                  className={`drawer-tab-item ${activeDrawerTab === 'TESTS' ? 'active' : ''}`}
                >
                  <BookOpen size={14} />
                  <span>Lịch thi & Kết quả Test</span>
                  {leadPlacementTests.length > 0 && (
                    <span className="badge-count">{leadPlacementTests.length}</span>
                  )}
                </button>
              </div>

              {/* Drawer Body - Tab Switcher */}
              <div className="drawer-body">
                {/* TAB 1: TỔNG QUAN */}
                {activeDrawerTab === 'OVERVIEW' && (
                  <>
                    {/* Quản lý Trạng thái Phễu */}
                    <div className="drawer-section-card">
                      <h4 className="drawer-section-title">
                        <CheckCircle2 size={15} style={{ color: '#2563eb' }} />
                        <span>Giai Đoạn Phễu Tuyển Sinh</span>
                      </h4>
                      <div>
                        <select
                          value={editStage}
                          disabled={!canEditLead}
                          onChange={(e) => setEditStage(e.target.value as LeadPipelineStage)}
                          className="behance-select"
                          style={{ width: '100%', padding: '9px 12px', fontWeight: 600 }}
                        >
                          <option value="NEW">🟠 1. Mới tiếp nhận (NEW)</option>
                          <option value="CONTACTING">🔵 2. Đang tư vấn (CONTACTING)</option>
                          <option value="TEST_SCHEDULED">🟣 3. Đã hẹn lịch Test (TEST_SCHEDULED)</option>
                          <option value="ENROLLED">🟢 4. Đã nhập học (ENROLLED)</option>
                          <option value="LOST">🔴 5. Hủy / Thất bại (LOST)</option>
                        </select>
                      </div>
                      {editStage === 'LOST' && (
                        <div style={{ marginTop: '10px' }}>
                          <label
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#dc2626',
                              display: 'block',
                              marginBottom: '4px',
                            }}
                          >
                            Lý do hủy / từ chối (Bắt buộc):
                          </label>
                          <input
                            type="text"
                            disabled={!canEditLead}
                            value={editLostReason}
                            onChange={(e) => setEditLostReason(e.target.value)}
                            placeholder="VD: Học phí cao, không phù hợp lịch học, đã học trung tâm khác..."
                            className="drawer-input"
                            style={{ borderColor: '#fca5a5' }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Thông tin học viên & liên hệ */}
                    <div className="drawer-section-card">
                      <h4 className="drawer-section-title">
                        <User size={15} style={{ color: '#2563eb' }} />
                        <span>Thông Tin Học Viên & Phân Công Tư Vấn</span>
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Họ và tên */}
                        <div>
                          <label
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#475569',
                              display: 'block',
                              marginBottom: '4px',
                            }}
                          >
                            Họ và tên học viên *
                          </label>
                          <input
                            type="text"
                            disabled={!canEditLead}
                            value={editFullName}
                            onChange={(e) => setEditFullName(e.target.value)}
                            className="drawer-input"
                            placeholder="Nhập họ và tên..."
                            required
                          />
                        </div>

                        {/* SĐT & Email */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '4px',
                              }}
                            >
                              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                                Số điện thoại *
                              </label>
                              {editPhone && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(editPhone, 'phone')}
                                  title="Sao chép SĐT"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#64748b',
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '11px',
                                  }}
                                >
                                  {copiedField === 'phone' ? (
                                    <Check size={12} style={{ color: '#10b981' }} />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                  <span>{copiedField === 'phone' ? 'Đã chép' : 'Chép'}</span>
                                </button>
                              )}
                            </div>
                            <input
                              type="tel"
                              disabled={!canEditLead}
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="drawer-input"
                              placeholder="0912345678"
                              required
                            />
                          </div>

                          <div>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '4px',
                              }}
                            >
                              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                                Email
                              </label>
                              {editEmail && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(editEmail, 'email')}
                                  title="Sao chép Email"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#64748b',
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '11px',
                                  }}
                                >
                                  {copiedField === 'email' ? (
                                    <Check size={12} style={{ color: '#10b981' }} />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                  <span>{copiedField === 'email' ? 'Đã chép' : 'Chép'}</span>
                                </button>
                              )}
                            </div>
                            <input
                              type="email"
                              disabled={!canEditLead}
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              className="drawer-input"
                              placeholder="hocvien@gmail.com"
                            />
                          </div>
                        </div>

                        {/* Khóa học quan tâm & Kênh tiếp nhận */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label
                              style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#475569',
                                display: 'block',
                                marginBottom: '4px',
                              }}
                            >
                              Khóa học quan tâm
                            </label>
                            <select
                              disabled={!canEditLead}
                              value={editInterest}
                              onChange={(e) => setEditInterest(e.target.value as LeadInterest)}
                              className="behance-select"
                              style={{ width: '100%', padding: '8px 12px' }}
                            >
                              <option value="IELTS">Luyện thi IELTS</option>
                              <option value="TOEIC">Luyện thi TOEIC</option>
                              <option value="COMMUNICATION">Tiếng Anh Giao Tiếp</option>
                            </select>
                          </div>

                          <div>
                            <label
                              style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#475569',
                                display: 'block',
                                marginBottom: '4px',
                              }}
                            >
                              Kênh tiếp nhận
                            </label>
                            <select
                              disabled={!canEditLead}
                              value={editSourceChannel}
                              onChange={(e) => setEditSourceChannel(e.target.value as LeadSourceChannel)}
                              className="behance-select"
                              style={{ width: '100%', padding: '8px 12px' }}
                            >
                              <option value="FB_ADS">Facebook Ads</option>
                              <option value="WEBSITE">Website & Form</option>
                              <option value="HOTLINE">Hotline Trung tâm</option>
                              <option value="WALK_IN">Đến Trực Tiếp</option>
                              <option value="REFERRAL">Người quen giới thiệu</option>
                            </select>
                          </div>
                        </div>

                        {/* Phân công Chuyên viên tư vấn (FR-LEAD-03) & Lần liên hệ gần nhất */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px',
                            marginTop: '2px',
                            paddingTop: '10px',
                            borderTop: '1px dashed #e2e8f0',
                          }}
                        >
                          <div>
                            <label
                              style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#475569',
                                display: 'block',
                                marginBottom: '4px',
                              }}
                            >
                              Chuyên viên tư vấn phụ trách
                            </label>
                            <select
                              disabled={!canEditLead}
                              value={editAssignedSalesId}
                              onChange={(e) => setEditAssignedSalesId(e.target.value)}
                              className="behance-select"
                              style={{ width: '100%', padding: '8px 12px' }}
                            >
                              <option value="">-- Chưa phân công --</option>
                              {consultantOptions.map((c) => (
                                <option key={c.id} value={String(c.id)}>
                                  {c.fullName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                              Tương tác gần nhất:
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                              {selectedLead.lastContactedAt
                                ? formatLeadTime(selectedLead.lastContactedAt)
                                : 'Chưa có tương tác'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ghi chú tư vấn */}
                    <div className="drawer-section-card">
                      <h4 className="drawer-section-title">
                        <FileText size={15} style={{ color: '#2563eb' }} />
                        <span>Ghi Chú Nhu Cầu & Nguyện Vọng</span>
                      </h4>
                      <textarea
                        disabled={!canEditLead}
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Nhập ghi chú chi tiết về nhu cầu học viên, mục tiêu band điểm, thời gian rảnh..."
                        rows={3}
                        className="drawer-textarea"
                      />
                    </div>
                  </>
                )}

                {/* TAB 2: NHẬT KÝ TƯ VẤN (QUICK LOG & TIMELINE) */}
                {activeDrawerTab === 'TIMELINE' && (
                  <>
                    {/* Quick Log Form */}
                    {canEditLead && (
                      <form onSubmit={handleQuickLog} className="quick-log-box">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                            Ghi Nhận Cuộc Gọi / Tư Vấn Mới
                          </span>
                          {logSuccessMsg && (
                            <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                              {logSuccessMsg}
                            </span>
                          )}
                        </div>

                        {/* Log Type Selector */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => setLogType('PHONE_CALL')}
                            className={`potential-chip ${logType === 'PHONE_CALL' ? 'active-warm' : ''}`}
                          >
                            📞 Gọi Điện
                          </button>
                          <button
                            type="button"
                            onClick={() => setLogType('DIRECT_MEETING')}
                            className={`potential-chip ${logType === 'DIRECT_MEETING' ? 'active-cold' : ''}`}
                          >
                            🏢 Gặp Trực Tiếp
                          </button>
                          <button
                            type="button"
                            onClick={() => setLogType('SMS')}
                            className={`potential-chip ${logType === 'SMS' ? 'active-warm' : ''}`}
                          >
                            💬 Nhắn Tin / Zalo
                          </button>
                        </div>

                        {/* Potential Level */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Lead Temperature:</span>
                          <button
                            type="button"
                            onClick={() => setLogPotential('HOT')}
                            className={`potential-chip ${logPotential === 'HOT' ? 'active-hot' : ''}`}
                          >
                            <Flame size={13} style={{ color: logPotential === 'HOT' ? '#dc2626' : '#94a3b8' }} />
                            <span>HOT</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setLogPotential('WARM')}
                            className={`potential-chip ${logPotential === 'WARM' ? 'active-warm' : ''}`}
                          >
                            <SunMedium size={13} style={{ color: logPotential === 'WARM' ? '#d97706' : '#94a3b8' }} />
                            <span>WARM</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setLogPotential('COLD')}
                            className={`potential-chip ${logPotential === 'COLD' ? 'active-cold' : ''}`}
                          >
                            <Snowflake size={13} style={{ color: logPotential === 'COLD' ? '#0284c7' : '#94a3b8' }} />
                            <span>COLD</span>
                          </button>
                        </div>

                        {/* Content Textarea */}
                        <textarea
                          rows={3}
                          placeholder="Nhập nội dung tư vấn, phản hồi của học viên..."
                          value={logContent}
                          onChange={(e) => setLogContent(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                            background: '#ffffff',
                            boxSizing: 'border-box',
                            outline: 'none',
                            resize: 'vertical',
                          }}
                          required
                        />

                        {/* Follow-up date & Submit */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11.5px', color: '#64748b' }}>Hẹn liên hệ lại:</span>
                            <input
                              type="datetime-local"
                              value={logFollowUp}
                              onChange={(e) => setLogFollowUp(e.target.value)}
                              style={{
                                padding: '5px 8px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '12px',
                                background: '#ffffff',
                              }}
                            />
                          </div>

                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={isSubmittingLog || !logContent.trim()}
                            iconLeft={<Send size={14} />}
                            style={{ background: '#2563eb' }}
                          >
                            {isSubmittingLog ? 'Đang lưu...' : 'Lưu Nhật Ký'}
                          </Button>
                        </div>
                      </form>
                    )}

                    {/* Timeline List */}
                    <div style={{ marginTop: '8px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
                        Dòng Thời Gian Tương Tác ({timelineLogs.length})
                      </h4>

                      <div className="drawer-timeline">
                        {isTimelineLoading ? (
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Đang tải lịch sử...</div>
                        ) : timelineLogs.length > 0 ? (
                          timelineLogs.map((log) => (
                            <div key={log.id} className="timeline-item">
                              <div className="timeline-dot" />
                              <div className="timeline-time">
                                {new Date(log.createdAt).toLocaleString('vi-VN')} • {log.userName || 'Tư vấn viên'}
                                {log.potentialLevel && (
                                  <span
                                    style={{
                                      marginLeft: '8px',
                                      padding: '2px 7px',
                                      borderRadius: '6px',
                                      fontSize: '10.5px',
                                      fontWeight: 700,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      background:
                                        log.potentialLevel === 'HOT'
                                          ? '#fee2e2'
                                          : log.potentialLevel === 'WARM'
                                          ? '#fef3c7'
                                          : '#f0f9ff',
                                      color:
                                        log.potentialLevel === 'HOT'
                                          ? '#dc2626'
                                          : log.potentialLevel === 'WARM'
                                          ? '#d97706'
                                          : '#0284c7',
                                      border:
                                        log.potentialLevel === 'HOT'
                                          ? '1px solid #fecaca'
                                          : log.potentialLevel === 'WARM'
                                          ? '1px solid #fde68a'
                                          : '1px solid #bae6fd',
                                    }}
                                  >
                                    {log.potentialLevel === 'HOT' && <Flame size={10} />}
                                    {log.potentialLevel === 'WARM' && <SunMedium size={10} />}
                                    {log.potentialLevel === 'COLD' && <Snowflake size={10} />}
                                    <span>{log.potentialLevel}</span>
                                  </span>
                                )}
                              </div>
                              <div className="timeline-desc">{log.content}</div>
                              {log.nextFollowUpAt && (
                                <div
                                  style={{
                                    fontSize: '11px',
                                    color: '#2563eb',
                                    marginTop: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Clock size={11} />
                                  <span>Hẹn gọi lại: {new Date(log.nextFollowUpAt).toLocaleString('vi-VN')}</span>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="timeline-item">
                            <div className="timeline-dot" />
                            <div className="timeline-time">Mới tiếp nhận • Hệ thống CRM</div>
                            <div className="timeline-desc">
                              Hồ sơ Lead được tạo thành công từ kênh {selectedLead.sourceChannel}.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* TAB 3: LỊCH THI TEST & HỌC VỤ (KẾT QUẢ THỰC TẾ + HANDOFF SANG XẾP LỚP) */}
                {activeDrawerTab === 'TESTS' && (
                  <div className="drawer-section-card" style={{ gap: '16px' }}>
                    {leadPlacementTests.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                          Hồ Sơ Ca Thi & Kết Quả Placement Test ({leadPlacementTests.length})
                        </h4>
                        {leadPlacementTests.map((pt) => (
                          <div
                            key={pt.id}
                            style={{
                              padding: '14px',
                              borderRadius: '12px',
                              border: '1px solid #e2e8f0',
                              background: '#f8fafc',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                                  Ca thi: {pt.testDate} • {pt.timeSlot}
                                </strong>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                  Phòng: {pt.room || 'Phòng Lab'} • Bài thi: <strong>{pt.testType}</strong>
                                </div>
                              </div>
                              <span
                                style={{
                                  padding: '3px 9px',
                                  borderRadius: '999px',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  background:
                                    pt.attendanceStatus === 'PRESENT'
                                      ? '#dcfce7'
                                      : pt.attendanceStatus === 'ABSENT'
                                      ? '#fee2e2'
                                      : '#e0e7ff',
                                  color:
                                    pt.attendanceStatus === 'PRESENT'
                                      ? '#15803d'
                                      : pt.attendanceStatus === 'ABSENT'
                                      ? '#b91c1c'
                                      : '#4338ca',
                                }}
                              >
                                {pt.attendanceStatus === 'PRESENT'
                                  ? 'Đã dự thi'
                                  : pt.attendanceStatus === 'ABSENT'
                                  ? 'Vắng mặt'
                                  : 'Đã lên lịch'}
                              </span>
                            </div>

                            {pt.overallScore !== null ? (
                              <div
                                style={{
                                  padding: '10px 12px',
                                  borderRadius: '10px',
                                  background: '#ffffff',
                                  border: '1px solid #dbeafe',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: '8px',
                                }}
                              >
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Award size={16} color="#2563eb" />
                                    <span style={{ fontWeight: 800, fontSize: '14px', color: '#1d4ed8' }}>
                                      Overall Band: {pt.overallScore}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '3px' }}>
                                    L: {pt.listeningScore ?? '-'} • R: {pt.readingScore ?? '-'} • W:{' '}
                                    {pt.writingScore ?? '-'} • S: {pt.speakingScore ?? '-'}
                                  </div>
                                  {pt.suggestedCourseName && (
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#059669', marginTop: '4px' }}>
                                      → Khóa học đề xuất: {pt.suggestedCourseName}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                                Chưa cập nhật điểm chấm thi 4 kỹ năng.
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                        <div
                          style={{
                            width: '54px',
                            height: '54px',
                            borderRadius: '50%',
                            background: '#eff6ff',
                            color: '#2563eb',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '12px',
                          }}
                        >
                          <Calendar size={28} />
                        </div>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                          Chưa Có Lịch Thi Placement Test
                        </h4>
                        <p
                          style={{
                            fontSize: '12.5px',
                            color: '#64748b',
                            margin: '0 auto',
                            maxWidth: '360px',
                            lineHeight: '1.5',
                          }}
                        >
                          Đặt lịch kiểm tra năng lực tiếng Anh ({selectedLead.interest}) 4 kỹ năng cho học viên hoặc
                          chuyển thẳng sang bước Ghi danh & Xếp lớp.
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <Button
                        variant="primary"
                        size="md"
                        iconLeft={<Calendar size={16} />}
                        onClick={() => {
                          const targetId = selectedLead.id;
                          setSelectedLead(null);
                          navigate(`/tests?bookLeadId=${targetId}`);
                        }}
                        style={{ background: '#2563eb', width: '100%', justifyContent: 'center' }}
                      >
                        Đặt Lịch Thi Placement Test Cho Học Viên Này
                      </Button>

                      {canEnrollStudent && (
                        <Button
                          variant="glass"
                          size="md"
                          iconLeft={<GraduationCap size={16} />}
                          onClick={() => {
                            const targetId = selectedLead.id;
                            setSelectedLead(null);
                            navigate(`/students?enrollLeadId=${targetId}`);
                          }}
                          style={{
                            background: '#ecfdf5',
                            color: '#047857',
                            border: '1px solid #a7f3d0',
                            fontWeight: 700,
                            width: '100%',
                            justifyContent: 'center',
                          }}
                        >
                          Chốt Ghi Danh & Xếp Lớp Ngay
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="drawer-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {saveLeadSuccess && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#16a34a',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>{saveLeadSuccess}</span>
                    </div>
                  )}
                  {saveLeadError && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#dc2626',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      <AlertCircle size={16} />
                      <span>{saveLeadError}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Button variant="glass" size="sm" onClick={() => setSelectedLead(null)}>
                    Đóng
                  </Button>
                  {canEditLead && (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isSavingLead}
                      onClick={handleSaveLead}
                      iconLeft={<Save size={15} />}
                      style={{ background: '#2563eb' }}
                    >
                      {isSavingLead ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 5. CREATE LEAD MODAL (FE-03B) */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialStage={createModalInitialStage}
        onSuccess={async () => {
          await loadData(true);
        }}
        onSelectLeadById={async (leadId: number) => {
          try {
            const lead = await LeadService.getLeadById(leadId);
            handleSelectLead(lead);
          } catch (err) {
            console.warn('Không thể mở Lead cũ:', err);
          }
        }}
      />
    </div>
  );
};
