import { query } from '../database/pool.js';
import {
  LeadWithDetails,
  InteractionLog,
  CreateLeadDto,
  UpdateLeadDto,
  CreateInteractionLogDto,
  LeadFilterQuery,
  LeadStatsResponse,
  KanbanBoardResponse,
  LeadPipelineStage,
  LeadInterest,
  LeadSourceChannel,
} from '../types/lead.types.js';

export class LeadRepository {
  /**
   * Lấy danh sách Lead phân trang kèm bộ lọc đa tiêu chí
   */
  static async findAll(filter: LeadFilterQuery = {}): Promise<{
    leads: LeadWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (filter.pipelineStage) {
      conditions.push(`l.pipeline_stage = $${paramIdx++}`);
      params.push(filter.pipelineStage);
    }

    if (filter.interest) {
      conditions.push(`l.interest = $${paramIdx++}`);
      params.push(filter.interest);
    }

    if (filter.sourceChannel) {
      conditions.push(`l.source_channel = $${paramIdx++}`);
      params.push(filter.sourceChannel);
    }

    if (filter.assignedSalesId) {
      conditions.push(`l.assigned_sales_id = $${paramIdx++}`);
      params.push(Number(filter.assignedSalesId));
    }

    if (filter.search && filter.search.trim()) {
      const s = `%${filter.search.trim()}%`;
      conditions.push(`(l.full_name ILIKE $${paramIdx} OR l.phone_number ILIKE $${paramIdx} OR l.email ILIKE $${paramIdx})`);
      params.push(s);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortCol = filter.sortBy === 'full_name' ? 'l.full_name' : filter.sortBy === 'updated_at' ? 'l.updated_at' : 'l.created_at';
    const sortOrder = filter.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT 
        l.id, l.full_name, l.phone_number, l.email, l.interest, l.source_channel,
        l.pipeline_stage, l.lost_reason, l.assigned_sales_id, l.notes,
        l.created_at, l.updated_at,
        u.full_name AS assigned_sales_name,
        u.email AS assigned_sales_email,
        il.last_contacted_at,
        COALESCE(il.total_interactions, 0)::int AS total_interactions,
        COUNT(*) OVER() AS total_count
      FROM leads l
      LEFT JOIN users u ON l.assigned_sales_id = u.id
      LEFT JOIN (
        SELECT 
          lead_id,
          MAX(created_at) AS last_contacted_at,
          COUNT(*)::int AS total_interactions
        FROM interaction_logs
        GROUP BY lead_id
      ) il ON il.lead_id = l.id
      ${whereClause}
      ORDER BY ${sortCol} ${sortOrder}
      LIMIT $${paramIdx++} OFFSET $${paramIdx++};
    `;

    params.push(limit, offset);
    const res = await query(sql, params);

    const total = res.rows.length > 0 ? Number(res.rows[0].total_count) : 0;
    const leads: LeadWithDetails[] = res.rows.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      phoneNumber: row.phone_number,
      email: row.email,
      interest: row.interest,
      sourceChannel: row.source_channel,
      pipelineStage: row.pipeline_stage,
      lostReason: row.lost_reason,
      assignedSalesId: row.assigned_sales_id,
      assignedSalesName: row.assigned_sales_name,
      assignedSalesEmail: row.assigned_sales_email,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastContactedAt: row.last_contacted_at ? new Date(row.last_contacted_at) : null,
      totalInteractions: Number(row.total_interactions) || 0,
    }));

    return {
      leads,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Lấy cấu trúc bảng Kanban phân bổ theo 5 giai đoạn phễu
   */
  static async findKanban(assignedSalesId?: number): Promise<KanbanBoardResponse> {
    const filter: LeadFilterQuery = { limit: 1000 };
    if (assignedSalesId) {
      filter.assignedSalesId = assignedSalesId;
    }

    const { leads } = await this.findAll(filter);

    const kanban: KanbanBoardResponse = {
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
    };

    for (const lead of leads) {
      if (kanban[lead.pipelineStage]) {
        kanban[lead.pipelineStage].push(lead);
        kanban.counts[lead.pipelineStage]++;
      }
    }

    return kanban;
  }

  /**
   * Lấy chi tiết Lead theo ID
   */
  static async findById(id: number): Promise<LeadWithDetails | null> {
    const sql = `
      SELECT 
        l.id, l.full_name, l.phone_number, l.email, l.interest, l.source_channel,
        l.pipeline_stage, l.lost_reason, l.assigned_sales_id, l.notes,
        l.created_at, l.updated_at,
        u.full_name AS assigned_sales_name,
        u.email AS assigned_sales_email,
        il.last_contacted_at,
        COALESCE(il.total_interactions, 0)::int AS total_interactions
      FROM leads l
      LEFT JOIN users u ON l.assigned_sales_id = u.id
      LEFT JOIN (
        SELECT 
          lead_id,
          MAX(created_at) AS last_contacted_at,
          COUNT(*)::int AS total_interactions
        FROM interaction_logs
        GROUP BY lead_id
      ) il ON il.lead_id = l.id
      WHERE l.id = $1
      LIMIT 1;
    `;
    const res = await query(sql, [id]);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    return {
      id: row.id,
      fullName: row.full_name,
      phoneNumber: row.phone_number,
      email: row.email,
      interest: row.interest,
      sourceChannel: row.source_channel,
      pipelineStage: row.pipeline_stage,
      lostReason: row.lost_reason,
      assignedSalesId: row.assigned_sales_id,
      assignedSalesName: row.assigned_sales_name,
      assignedSalesEmail: row.assigned_sales_email,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastContactedAt: row.last_contacted_at ? new Date(row.last_contacted_at) : null,
      totalInteractions: Number(row.total_interactions) || 0,
    };
  }

  /**
   * Tìm kiếm Lead theo Số điện thoại (kiểm tra trùng lặp BR-01)
   */
  static async findByPhone(phoneNumber: string, excludeId?: number): Promise<LeadWithDetails | null> {
    const cleanPhone = phoneNumber.trim();
    const sql = excludeId
      ? `
        SELECT l.id, l.full_name, l.phone_number, l.email, l.pipeline_stage, l.assigned_sales_id, u.full_name as assigned_sales_name
        FROM leads l
        LEFT JOIN users u ON l.assigned_sales_id = u.id
        WHERE l.phone_number = $1 AND l.id != $2
        LIMIT 1;
      `
      : `
        SELECT l.id, l.full_name, l.phone_number, l.email, l.pipeline_stage, l.assigned_sales_id, u.full_name as assigned_sales_name
        FROM leads l
        LEFT JOIN users u ON l.assigned_sales_id = u.id
        WHERE l.phone_number = $1
        LIMIT 1;
      `;
    const params = excludeId ? [cleanPhone, excludeId] : [cleanPhone];
    const res = await query(sql, params);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    return {
      id: row.id,
      fullName: row.full_name,
      phoneNumber: row.phone_number,
      email: row.email,
      interest: 'IELTS',
      sourceChannel: 'FB_ADS',
      pipelineStage: row.pipeline_stage,
      lostReason: null,
      assignedSalesId: row.assigned_sales_id,
      assignedSalesName: row.assigned_sales_name,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Tìm kiếm Lead theo Email (kiểm tra trùng lặp)
   */
  static async findByEmail(email: string, excludeId?: number): Promise<LeadWithDetails | null> {
    const cleanEmail = email.trim().toLowerCase();
    const sql = excludeId
      ? `
        SELECT l.id, l.full_name, l.phone_number, l.email, l.pipeline_stage, l.assigned_sales_id, u.full_name as assigned_sales_name
        FROM leads l
        LEFT JOIN users u ON l.assigned_sales_id = u.id
        WHERE LOWER(l.email) = $1 AND l.id != $2
        LIMIT 1;
      `
      : `
        SELECT l.id, l.full_name, l.phone_number, l.email, l.pipeline_stage, l.assigned_sales_id, u.full_name as assigned_sales_name
        FROM leads l
        LEFT JOIN users u ON l.assigned_sales_id = u.id
        WHERE LOWER(l.email) = $1
        LIMIT 1;
      `;
    const params = excludeId ? [cleanEmail, excludeId] : [cleanEmail];
    const res = await query(sql, params);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    return {
      id: row.id,
      fullName: row.full_name,
      phoneNumber: row.phone_number,
      email: row.email,
      interest: 'IELTS',
      sourceChannel: 'FB_ADS',
      pipelineStage: row.pipeline_stage,
      lostReason: null,
      assignedSalesId: row.assigned_sales_id,
      assignedSalesName: row.assigned_sales_name,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Tạo hồ sơ Lead mới
   */
  static async create(dto: CreateLeadDto): Promise<LeadWithDetails> {
    let assignedSalesId = dto.assignedSalesId || null;

    // Tự động phân bổ Round-Robin nếu chưa có assignedSalesId và hệ thống bật tính năng
    if (!assignedSalesId) {
      try {
        const settingsRes = await query('SELECT auto_assign_leads FROM system_settings WHERE id = 1');
        const autoAssign = settingsRes.rows.length > 0 ? settingsRes.rows[0].auto_assign_leads : true;
        
        if (autoAssign) {
          // Tìm tư vấn viên (SALES) đang có ít lead NEW/CONTACTING nhất
          const consultantRes = await query(`
            SELECT u.id, u.full_name, COUNT(l.id) AS active_leads
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN leads l ON u.id = l.assigned_sales_id AND l.pipeline_stage IN ('NEW', 'CONTACTING')
            WHERE r.role_code = 'SALES' AND u.is_active = TRUE
            GROUP BY u.id, u.full_name
            ORDER BY active_leads ASC, u.id ASC
            LIMIT 1;
          `);
          if (consultantRes.rows.length > 0) {
            assignedSalesId = consultantRes.rows[0].id;
          }
        }
      } catch (err) {
        // Dự phòng: tiếp tục tạo lead bình thường nếu lỗi phân bổ
      }
    }

    const sql = `
      INSERT INTO leads (
        full_name, phone_number, email, interest, source_channel,
        pipeline_stage, assigned_sales_id, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'NEW', $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, full_name, phone_number, email, interest, source_channel,
                pipeline_stage, lost_reason, assigned_sales_id, notes, created_at, updated_at;
    `;
    const params = [
      dto.fullName.trim(),
      dto.phoneNumber.trim(),
      dto.email?.trim() || null,
      dto.interest,
      dto.sourceChannel,
      assignedSalesId,
      dto.notes?.trim() || null,
    ];
    const res = await query(sql, params);
    const row = res.rows[0];

    let salesName: string | null = null;
    if (row.assigned_sales_id) {
      const userRes = await query('SELECT full_name FROM users WHERE id = $1', [row.assigned_sales_id]);
      if (userRes.rows.length > 0) {
        salesName = userRes.rows[0].full_name;
      }
    }

    return {
      id: row.id,
      fullName: row.full_name,
      phoneNumber: row.phone_number,
      email: row.email,
      interest: row.interest,
      sourceChannel: row.source_channel,
      pipelineStage: row.pipeline_stage,
      lostReason: row.lost_reason,
      assignedSalesId: row.assigned_sales_id,
      assignedSalesName: salesName,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastContactedAt: null,
      totalInteractions: 0,
    };
  }

  /**
   * Cập nhật thông tin chi tiết Lead
   */
  static async update(id: number, dto: UpdateLeadDto): Promise<LeadWithDetails | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (dto.fullName !== undefined) {
      updates.push(`full_name = $${pIdx++}`);
      params.push(dto.fullName.trim());
    }
    if (dto.phoneNumber !== undefined) {
      updates.push(`phone_number = $${pIdx++}`);
      params.push(dto.phoneNumber.trim());
    }
    if (dto.email !== undefined) {
      updates.push(`email = $${pIdx++}`);
      params.push(dto.email?.trim() || null);
    }
    if (dto.interest !== undefined) {
      updates.push(`interest = $${pIdx++}`);
      params.push(dto.interest);
    }
    if (dto.sourceChannel !== undefined) {
      updates.push(`source_channel = $${pIdx++}`);
      params.push(dto.sourceChannel);
    }
    if (dto.pipelineStage !== undefined) {
      updates.push(`pipeline_stage = $${pIdx++}`);
      params.push(dto.pipelineStage);
    }
    if (dto.lostReason !== undefined) {
      updates.push(`lost_reason = $${pIdx++}`);
      params.push(dto.lostReason?.trim() || null);
    }
    if (dto.assignedSalesId !== undefined) {
      updates.push(`assigned_sales_id = $${pIdx++}`);
      params.push(dto.assignedSalesId || null);
    }
    if (dto.notes !== undefined) {
      updates.push(`notes = $${pIdx++}`);
      params.push(dto.notes?.trim() || null);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const sql = `
      UPDATE leads
      SET ${updates.join(', ')}
      WHERE id = $${pIdx}
      RETURNING id;
    `;
    const res = await query(sql, params);
    if (res.rows.length === 0) return null;

    return await this.findById(id);
  }

  /**
   * Cập nhật nhanh trạng thái giai đoạn Pipeline (Kanban Drag & Drop)
   */
  static async updateStatus(
    id: number,
    pipelineStage: LeadPipelineStage,
    lostReason?: string | null
  ): Promise<LeadWithDetails | null> {
    const sql = `
      UPDATE leads
      SET pipeline_stage = $1,
          lost_reason = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id;
    `;
    const res = await query(sql, [pipelineStage, lostReason?.trim() || null, id]);
    if (res.rows.length === 0) return null;
    return await this.findById(id);
  }

  /**
   * Phân bổ Lead cho Tư vấn viên (Assign Lead)
   */
  static async assignSales(id: number, salesId: number | null): Promise<LeadWithDetails | null> {
    const sql = `
      UPDATE leads
      SET assigned_sales_id = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id;
    `;
    const res = await query(sql, [salesId, id]);
    if (res.rows.length === 0) return null;
    return await this.findById(id);
  }

  /**
   * Xóa hồ sơ Lead
   */
  static async delete(id: number): Promise<boolean> {
    const res = await query('DELETE FROM leads WHERE id = $1 RETURNING id;', [id]);
    return res.rowCount !== null && res.rowCount > 0;
  }

  /**
   * Thống kê tổng hợp số liệu Lead
   */
  static async getStats(): Promise<LeadStatsResponse> {
    const sql = `
      SELECT
        COUNT(*)::int AS total_leads,
        COUNT(*) FILTER (WHERE pipeline_stage = 'NEW')::int AS stage_new,
        COUNT(*) FILTER (WHERE pipeline_stage = 'CONTACTING')::int AS stage_contacting,
        COUNT(*) FILTER (WHERE pipeline_stage = 'TEST_SCHEDULED')::int AS stage_test_scheduled,
        COUNT(*) FILTER (WHERE pipeline_stage = 'ENROLLED')::int AS stage_enrolled,
        COUNT(*) FILTER (WHERE pipeline_stage = 'LOST')::int AS stage_lost,
        COUNT(*) FILTER (WHERE source_channel = 'FB_ADS')::int AS src_fb_ads,
        COUNT(*) FILTER (WHERE source_channel = 'WEBSITE')::int AS src_website,
        COUNT(*) FILTER (WHERE source_channel = 'HOTLINE')::int AS src_hotline,
        COUNT(*) FILTER (WHERE source_channel = 'WALK_IN')::int AS src_walk_in,
        COUNT(*) FILTER (WHERE source_channel = 'REFERRAL')::int AS src_referral,
        COUNT(*) FILTER (WHERE interest = 'IELTS')::int AS interest_ielts,
        COUNT(*) FILTER (WHERE interest = 'TOEIC')::int AS interest_toeic,
        COUNT(*) FILTER (WHERE interest = 'COMMUNICATION')::int AS interest_comm
      FROM leads;
    `;

    const res = await query(sql);
    const row = res.rows[0] || {};

    const byStage: Record<LeadPipelineStage, number> = {
      NEW: row.stage_new || 0,
      CONTACTING: row.stage_contacting || 0,
      TEST_SCHEDULED: row.stage_test_scheduled || 0,
      ENROLLED: row.stage_enrolled || 0,
      LOST: row.stage_lost || 0,
    };

    const bySource: Record<LeadSourceChannel, number> = {
      FB_ADS: row.src_fb_ads || 0,
      WEBSITE: row.src_website || 0,
      HOTLINE: row.src_hotline || 0,
      WALK_IN: row.src_walk_in || 0,
      REFERRAL: row.src_referral || 0,
    };

    const byInterest: Record<LeadInterest, number> = {
      IELTS: row.interest_ielts || 0,
      TOEIC: row.interest_toeic || 0,
      COMMUNICATION: row.interest_comm || 0,
    };

    const totalLeads = Number(row.total_leads) || 0;
    const conversionRate = totalLeads > 0 ? Math.round((byStage.ENROLLED / totalLeads) * 1000) / 10 : 0;

    return {
      totalLeads,
      byStage,
      bySource,
      byInterest,
      conversionRate,
    };
  }

  /**
   * Lấy lịch sử tương tác / tư vấn của một Lead
   */
  static async findInteractionsByLeadId(leadId: number): Promise<InteractionLog[]> {
    const sql = `
      SELECT 
        i.id, i.lead_id, i.user_id, i.interaction_type, i.potential_level,
        i.content, i.next_follow_up_at, i.created_at,
        u.full_name AS user_name,
        r.role_code AS user_role
      FROM interaction_logs i
      JOIN users u ON i.user_id = u.id
      JOIN roles r ON u.role_id = r.id
      WHERE i.lead_id = $1
      ORDER BY i.created_at DESC;
    `;
    const res = await query(sql, [leadId]);
    return res.rows.map((row) => ({
      id: row.id,
      leadId: row.lead_id,
      userId: row.user_id,
      interactionType: row.interaction_type,
      potentialLevel: row.potential_level,
      content: row.content,
      nextFollowUpAt: row.next_follow_up_at ? new Date(row.next_follow_up_at) : null,
      createdAt: new Date(row.created_at),
      userName: row.user_name,
      userRole: row.user_role,
    }));
  }

  /**
   * Ghi thêm một nhật ký tương tác / cuộc gọi tư vấn
   */
  static async createInteraction(
    leadId: number,
    userId: number,
    dto: CreateInteractionLogDto,
    userName = 'Người dùng',
    userRole = 'SALES'
  ): Promise<InteractionLog> {
    const nextDate = dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : null;
    const sql = `
      INSERT INTO interaction_logs (
        lead_id, user_id, interaction_type, potential_level, content, next_follow_up_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING id, lead_id, user_id, interaction_type, potential_level, content, next_follow_up_at, created_at;
    `;
    const params = [
      leadId,
      userId,
      dto.interactionType,
      dto.potentialLevel,
      dto.content.trim(),
      nextDate,
    ];
    const res = await query(sql, params);
    const row = res.rows[0];

    const uRes = await query(
      'SELECT u.full_name, r.role_code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1',
      [userId]
    );
    const name = uRes.rows.length > 0 ? uRes.rows[0].full_name : userName;
    const role = uRes.rows.length > 0 ? uRes.rows[0].role_code : userRole;

    return {
      id: row.id,
      leadId: row.lead_id,
      userId: row.user_id,
      interactionType: row.interaction_type,
      potentialLevel: row.potential_level,
      content: row.content,
      nextFollowUpAt: row.next_follow_up_at ? new Date(row.next_follow_up_at) : null,
      createdAt: new Date(row.created_at),
      userName: name,
      userRole: role,
    };
  }
}
