import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
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
} from 'lucide-react';
import { CreateLeadModal } from './CreateLeadModal';
import { LeadService } from '../../services/lead.service';
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

  // Data states
  const [kanbanData, setKanbanData] = useState<KanbanBoardResponse>({
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
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters (Behance Style)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [selectedInterest, setSelectedInterest] = useState<string>('ALL');

  // Selected lead for Pinterest-style Tabbed Profile Drawer
  const [selectedLead, setSelectedLead] = useState<LeadWithDetails | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'OVERVIEW' | 'TIMELINE' | 'TESTS'>('OVERVIEW');
  const [timelineLogs, setTimelineLogs] = useState<InteractionLog[]>([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Editable Lead states for Tab 1 & Drawer Save
  const [editFullName, setEditFullName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editInterest, setEditInterest] = useState<LeadInterest>('IELTS');
  const [editSourceChannel, setEditSourceChannel] = useState<LeadSourceChannel>('FB_ADS');
  const [editStage, setEditStage] = useState<LeadPipelineStage>('NEW');
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
      if (!silent) setIsLoading(true);
      setError(null);

      const kanbanRes = await LeadService.getKanban();
      setKanbanData(kanbanRes);
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

  // Fetch timeline when a lead is selected in drawer
  const handleSelectLead = async (lead: LeadWithDetails) => {
    setSelectedLead(lead);
    setEditFullName(lead.fullName || '');
    setEditPhone(lead.phoneNumber || '');
    setEditEmail(lead.email || '');
    setEditInterest(lead.interest);
    setEditSourceChannel(lead.sourceChannel);
    setEditStage(lead.pipelineStage);
    setEditLostReason(lead.lostReason || '');
    setEditNotes(lead.notes || '');
    setSaveLeadSuccess(null);
    setSaveLeadError(null);

    setActiveDrawerTab('OVERVIEW');
    setIsTimelineLoading(true);
    setTimelineLogs([]);
    setLogContent('');
    setLogFollowUp('');
    setLogSuccessMsg(null);

    try {
      const logs = await LeadService.getTimeline(lead.id);
      setTimelineLogs(logs);
    } catch (err) {
      console.warn('Không thể tải lịch sử chăm sóc của Lead:', err);
    } finally {
      setIsTimelineLoading(false);
    }
  };

  // Save edited lead details from drawer
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
        lostReason: editStage === 'LOST' ? editLostReason.trim() : null,
        notes: editNotes.trim() || null,
      });

      setSelectedLead(updated);
      setSaveLeadSuccess('Đã lưu thông tin Lead thành công!');
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

  // Filtered Kanban columns
  const filteredColumns = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filterFn = (lead: LeadWithDetails) => {
      const matchSearch =
        !q ||
        lead.fullName.toLowerCase().includes(q) ||
        lead.phoneNumber.includes(q) ||
        (lead.email && lead.email.toLowerCase().includes(q)) ||
        (lead.assignedSalesName && lead.assignedSalesName.toLowerCase().includes(q));

      const matchInterest = selectedInterest === 'ALL' || lead.interest === selectedInterest;
      const matchSource = selectedSource === 'ALL' || lead.sourceChannel === selectedSource;

      return matchSearch && matchInterest && matchSource;
    };

    return KANBAN_COLUMNS.map((col) => {
      const colLeads = kanbanData[col.id] || [];
      const filtered = colLeads.filter(filterFn);
      return {
        ...col,
        count: filtered.length,
        leads: filtered,
      };
    });
  }, [kanbanData, searchQuery, selectedInterest, selectedSource]);

  return (
    <div className="dashboard-page" style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Header Bar: Title, Subtitle, and Primary Actions (Behance Style) */}
      <div className="leads-header-bar">
        <div>
          <h1 className="leads-header-title">Leads</h1>
          <p className="leads-header-subtitle">
            Quản lý phễu tuyển sinh & theo dõi trạng thái tư vấn khách hàng tiềm năng
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Refresh button */}
          <button
            type="button"
            onClick={() => loadData()}
            disabled={isLoading}
            title="Làm mới dữ liệu từ server"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              cursor: 'pointer',
              color: '#475569',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>

          {/* Export CSV button */}
          <Button
            variant="glass"
            size="md"
            iconLeft={<Download size={16} />}
            onClick={handleExportCSV}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              fontWeight: 600,
              color: '#334155',
            }}
          >
            Xuất Dữ Liệu
          </Button>

          {/* Add Lead button (Behance royal blue) */}
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
        </div>
      </div>

      {/* 2. Behance-Style Filter Toolbar */}
      <div className="leads-filters-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
        </div>

        {/* Search input with search icon */}
        <div className="behance-search-container">
          <Search size={15} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Tìm tên, SĐT, email, tư vấn viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="behance-search-input"
          />
        </div>
      </div>

      {/* 3. Main Kanban Board (Real Data Fetching & Drag-and-Drop) */}
      {error ? (
        <div style={{ padding: '32px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px solid #fee2e2' }}>
          <p style={{ color: '#dc2626', fontWeight: 600 }}>{error}</p>
          <Button variant="glass" onClick={() => loadData()} style={{ marginTop: '12px' }}>
            Thử lại
          </Button>
        </div>
      ) : (
          <div className={`kanban-board-container ${draggingLead ? 'is-dragging-active' : ''}`}>
            {filteredColumns.map((col) => {
              const isOver = dragOverColumn === col.id && (!draggingLead || draggingLead.stage !== col.id);
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
                    }}
                  >
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
                      {col.id === 'NEW' && (
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
                          draggable
                          onDragStart={(e) => {
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
                        {/* Top Row: Avatar + Name + Time + Action Menu */}
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
                        <div className="empty-state-title">Chưa có Lead</div>
                        <div className="empty-state-desc">
                          {col.id === 'NEW'
                            ? 'Chưa có Lead mới. Bấm "+" để tiếp nhận ngay'
                            : 'Kéo thả thẻ vào đây để chuyển sang giai đoạn này'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Column Footer: Quick Add Button (Chỉ áp dụng cho cột Mới tiếp nhận) */}
                  {col.id === 'NEW' && (
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
      )}

      {/* 4. SLIDE-OVER DRAWER (PINTEREST TABBED PROFILE STYLE) */}
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
                      setSelectedLead(null);
                      navigate('/tests');
                    }}
                    className="drawer-quick-btn"
                  >
                    <Calendar size={15} />
                    <span>Đặt Lịch Thi</span>
                  </button>
                </div>
              </div>

              {/* Navigation Tabs (Pinterest Style) */}
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
                  <span>Lịch thi Test</span>
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
                        <span>Thông Tin Học Viên & Nhu Cầu</span>
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

                        {/* Phân công & Lần liên hệ gần nhất */}
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
                            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
                              Chuyên viên tư vấn:
                            </span>
                            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#1e293b' }}>
                              {selectedLead.assignedSalesName || 'Chưa phân công'}
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
                              Tương tác gần nhất:
                            </span>
                            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#1e293b' }}>
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

                {/* TAB 3: LỊCH THI TEST & HỌC VỤ */}
                {activeDrawerTab === 'TESTS' && (
                  <div className="drawer-section-card" style={{ gap: '16px' }}>
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
                        Kiểm Tra Trình Độ Đầu Vào (Placement Test)
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
                        Đánh giá năng lực tiếng Anh ({selectedLead.interest}) 4 kỹ năng của học viên để định hướng vào
                        lớp học phù hợp nhất.
                      </p>
                    </div>

                    <div
                      style={{
                        background: '#f8fafc',
                        padding: '14px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                        Quy trình kiểm tra xếp lớp:
                      </div>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: '18px',
                          fontSize: '12px',
                          color: '#475569',
                          lineHeight: '1.8',
                        }}
                      >
                        <li>Bước 1: Chọn ngày & ca thi Placement Test tại phòng test trung tâm.</li>
                        <li>Bước 2: Học viên làm bài test 60 phút (Nghe, Đọc, Viết & Nói).</li>
                        <li>Bước 3: Giảng viên chấm điểm và nhập kết quả vào hệ thống.</li>
                        <li>Bước 4: Chuyển Lead sang trạng thái Đã nhập học và xếp lớp.</li>
                      </ul>
                    </div>

                    <Button
                      variant="primary"
                      size="md"
                      iconLeft={<Calendar size={16} />}
                      onClick={() => {
                        setSelectedLead(null);
                        navigate('/tests');
                      }}
                      style={{ background: '#2563eb', width: '100%', justifyContent: 'center' }}
                    >
                      Lên Lịch Thi Placement Test Ngay
                    </Button>
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
