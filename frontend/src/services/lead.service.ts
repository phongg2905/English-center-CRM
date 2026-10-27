import { apiClient } from './api';
import { dataCache } from '../utils/dataCache';
import type {
  LeadWithDetails,
  KanbanBoardResponse,
  LeadStatsResponse,
  PaginatedLeadsResponse,
  LeadFilterQuery,
  LeadPipelineStage,
  CreateLeadDto,
  UpdateLeadDto,
  UpdateLeadStatusDto,
  CreateInteractionLogDto,
  InteractionLog,
} from '../types/lead';

export class LeadService {
  /**
   * Lấy dữ liệu bảng Kanban phân theo 5 cột trạng thái (có hỗ trợ Smart Cache)
   */
  static async getKanban(
    assignedSalesId?: number,
    options?: { forceRefresh?: boolean }
  ): Promise<KanbanBoardResponse> {
    const key = dataCache.buildKey('leads:kanban', { assignedSalesId });
    return dataCache.getOrFetch(
      key,
      async () => {
        const params = new URLSearchParams();
        if (assignedSalesId) {
          params.append('assignedSalesId', assignedSalesId.toString());
        }
        const res = await apiClient.get<{
          success: boolean;
          data: KanbanBoardResponse;
          message?: string;
        }>(`/leads/kanban${params.toString() ? `?${params.toString()}` : ''}`);
        return res.data.data;
      },
      { forceRefresh: options?.forceRefresh }
    );
  }

  static peekKanban(assignedSalesId?: number): KanbanBoardResponse | undefined {
    return dataCache.peek<KanbanBoardResponse>(
      dataCache.buildKey('leads:kanban', { assignedSalesId })
    );
  }

  /**
   * Cập nhật nhanh trạng thái giai đoạn Pipeline của Lead (Kanban Drag & Drop)
   */
  static async updateStage(
    id: number,
    pipelineStage: LeadPipelineStage,
    lostReason?: string | null
  ): Promise<LeadWithDetails> {
    const payload: UpdateLeadStatusDto = {
      pipelineStage,
      lostReason: lostReason || undefined,
    };

    const res = await apiClient.patch<{
      success: boolean;
      data: LeadWithDetails;
      message?: string;
    }>(`/leads/${id}/stage`, payload);

    dataCache.invalidateMany(['leads', 'analytics', 'audit-logs']);
    return res.data.data;
  }

  /**
   * Lấy danh sách Lead dạng bảng có lọc, tìm kiếm và phân trang (có hỗ trợ Smart Cache)
   */
  static async getLeads(
    query?: LeadFilterQuery,
    options?: { forceRefresh?: boolean }
  ): Promise<PaginatedLeadsResponse> {
    const key = dataCache.buildKey('leads:list', query || {});
    return dataCache.getOrFetch(
      key,
      async () => {
        const params = new URLSearchParams();
        if (query?.pipelineStage) params.append('pipelineStage', query.pipelineStage);
        if (query?.interest) params.append('interest', query.interest);
        if (query?.sourceChannel) params.append('sourceChannel', query.sourceChannel);
        if (query?.assignedSalesId) params.append('assignedSalesId', query.assignedSalesId.toString());
        if (query?.search) params.append('search', query.search);
        if (query?.page) params.append('page', query.page.toString());
        if (query?.limit) params.append('limit', query.limit.toString());
        if (query?.sortBy) params.append('sortBy', query.sortBy);
        if (query?.sortOrder) params.append('sortOrder', query.sortOrder);

        const res = await apiClient.get<any>(`/leads?${params.toString()}`);
        const data = res.data?.data;
        const meta = res.data?.meta;

        if (Array.isArray(data)) {
          return {
            leads: data,
            total: meta?.total ?? data.length,
            page: meta?.page ?? 1,
            totalPages: meta?.totalPages ?? 1,
          };
        }

        if (data?.leads && Array.isArray(data.leads)) {
          return {
            leads: data.leads,
            total: data.total ?? data.leads.length,
            page: data.page ?? 1,
            totalPages: data.totalPages ?? 1,
          };
        }

        return {
          leads: [],
          total: 0,
          page: 1,
          totalPages: 1,
        };
      },
      { forceRefresh: options?.forceRefresh }
    );
  }

  static peekLeads(query?: LeadFilterQuery): PaginatedLeadsResponse | undefined {
    return dataCache.peek<PaginatedLeadsResponse>(dataCache.buildKey('leads:list', query || {}));
  }

  /**
   * Lấy báo cáo thống kê Lead (theo stage, nguồn, nhu cầu)
   */
  static async getStats(options?: { forceRefresh?: boolean }): Promise<LeadStatsResponse> {
    const key = 'leads:stats';
    return dataCache.getOrFetch(
      key,
      async () => {
        const res = await apiClient.get<{
          success: boolean;
          data: LeadStatsResponse;
          message?: string;
        }>('/leads/stats');
        return res.data.data;
      },
      { forceRefresh: options?.forceRefresh }
    );
  }

  static peekStats(): LeadStatsResponse | undefined {
    return dataCache.peek<LeadStatsResponse>('leads:stats');
  }

  /**
   * Lấy chi tiết Lead theo ID
   */
  static async getLeadById(id: number, options?: { forceRefresh?: boolean }): Promise<LeadWithDetails> {
    const key = dataCache.buildKey('leads:detail', id);
    return dataCache.getOrFetch(
      key,
      async () => {
        const res = await apiClient.get<{
          success: boolean;
          data: LeadWithDetails;
          message?: string;
        }>(`/leads/${id}`);
        return res.data.data;
      },
      { forceRefresh: options?.forceRefresh }
    );
  }

  /**
   * Tạo Lead mới vào phễu tuyển sinh
   */
  static async createLead(dto: CreateLeadDto): Promise<LeadWithDetails> {
    const res = await apiClient.post<{
      success: boolean;
      data: LeadWithDetails;
      message?: string;
    }>('/leads', dto);

    dataCache.invalidateMany(['leads', 'analytics', 'audit-logs']);
    return res.data.data;
  }

  /**
   * Cập nhật thông tin chi tiết Lead
   */
  static async updateLead(id: number, dto: UpdateLeadDto): Promise<LeadWithDetails> {
    const res = await apiClient.put<{
      success: boolean;
      data: LeadWithDetails;
      message?: string;
    }>(`/leads/${id}`, dto);

    dataCache.invalidateMany(['leads', 'analytics', 'audit-logs']);
    return res.data.data;
  }

  /**
   * Phân công người phụ trách Lead (Tư vấn viên)
   */
  static async assignLead(id: number, assignedSalesId: number | null): Promise<LeadWithDetails> {
    const res = await apiClient.patch<{
      success: boolean;
      data: LeadWithDetails;
      message?: string;
    }>(`/leads/${id}/assign`, { assignedSalesId });

    dataCache.invalidateMany(['leads', 'analytics', 'audit-logs']);
    return res.data.data;
  }

  /**
   * Xóa Lead (chỉ dành cho Admin)
   */
  static async deleteLead(id: number): Promise<void> {
    await apiClient.delete(`/leads/${id}`);
    dataCache.invalidateMany(['leads', 'analytics', 'audit-logs']);
  }

  /**
   * Lấy lịch sử dòng thời gian nhật ký chăm sóc của Lead (Timeline)
   */
  static async getTimeline(id: number, options?: { forceRefresh?: boolean }): Promise<InteractionLog[]> {
    const key = dataCache.buildKey('leads:timeline', id);
    return dataCache.getOrFetch(
      key,
      async () => {
        const res = await apiClient.get<{
          success: boolean;
          data: InteractionLog[];
          message?: string;
        }>(`/leads/${id}/timeline`);
        return res.data?.data || [];
      },
      { forceRefresh: options?.forceRefresh }
    );
  }

  /**
   * Thêm mới nhật ký tương tác / cuộc gọi
   */
  static async addInteractionLog(
    id: number,
    dto: CreateInteractionLogDto
  ): Promise<InteractionLog> {
    const res = await apiClient.post<{
      success: boolean;
      data: InteractionLog;
      message?: string;
    }>(`/leads/${id}/logs`, dto);

    dataCache.invalidateMany(['leads', 'audit-logs']);
    return res.data.data;
  }

  static invalidateCache(): void {
    dataCache.invalidate('leads');
  }
}
