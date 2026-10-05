import { query, isDbAvailable } from '../database/pool.js';
import {
  Lead,
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
import { logger } from '../utils/logger.js';

// Dữ liệu mẫu ban đầu (Mock Store khi chưa kết nối PostgreSQL) đồng bộ chuẩn seed_data.sql
let mockLeads: LeadWithDetails[] = [
  {
    id: 1,
    fullName: 'Nguyễn Thị Thuỳ Dung',
    phoneNumber: '0912111001',
    email: 'thuydung.nguyen@gmail.com',
    interest: 'IELTS',
    sourceChannel: 'FB_ADS',
    pipelineStage: 'NEW',
    lostReason: null,
    assignedSalesId: 2,
    assignedSalesName: 'Long Phạm',
    notes: 'Đăng ký qua Form Facebook Ads lúc 08:30 sáng nay, muốn học cấp tốc tháng 11.',
    createdAt: new Date('2026-10-01T08:30:00Z'),
    updatedAt: new Date('2026-10-01T08:30:00Z'),
    lastContactedAt: null,
    totalInteractions: 0,
  },
  {
    id: 2,
    fullName: 'Hoàng Minh Quân',
    phoneNumber: '0912111002',
    email: 'quan.hoang@yahoo.com',
    interest: 'TOEIC',
    sourceChannel: 'WEBSITE',
    pipelineStage: 'NEW',
    lostReason: null,
    assignedSalesId: 2,
    assignedSalesName: 'Long Phạm',
    notes: 'Cần chứng chỉ TOEIC 600 để ra trường PTIT cuối năm.',
    createdAt: new Date('2026-10-01T09:15:00Z'),
    updatedAt: new Date('2026-10-01T09:15:00Z'),
    lastContactedAt: null,
    totalInteractions: 0,
  },
  {
    id: 3,
    fullName: 'Trần Bảo Ngọc',
    phoneNumber: '0912111003',
    email: 'ngoc.tran@outlook.com',
    interest: 'IELTS',
    sourceChannel: 'HOTLINE',
    pipelineStage: 'CONTACTING',
    lostReason: null,
    assignedSalesId: 2,
    assignedSalesName: 'Long Phạm',
    notes: 'Đã gọi 1 cuộc, khách đang đi làm, hẹn gọi lại sau 17h30 chiều.',
    createdAt: new Date('2026-10-01T10:00:00Z'),
    updatedAt: new Date('2026-10-01T14:00:00Z'),
    lastContactedAt: new Date('2026-10-01T14:00:00Z'),
    totalInteractions: 1,
  },
  {
    id: 4,
    fullName: 'Lê Tuấn Hưng',
    phoneNumber: '0912111004',
    email: 'tuanhung.le@gmail.com',
    interest: 'COMMUNICATION',
    sourceChannel: 'WALK_IN',
    pipelineStage: 'CONTACTING',
    lostReason: null,
    assignedSalesId: 2,
    assignedSalesName: 'Long Phạm',
    notes: 'Khách vãng lai đến cơ sở, quan tâm lớp giao tiếp tối 2-4-6.',
    createdAt: new Date('2026-10-01T11:20:00Z'),
    updatedAt: new Date('2026-10-01T11:20:00Z'),
    lastContactedAt: null,
    totalInteractions: 0,
  },
  {
    id: 5,
    fullName: 'Nguyễn Hoàng Nam',
    phoneNumber: '0912111005',
    email: 'nam.nguyenhoang@gmail.com',
    interest: 'IELTS',
    sourceChannel: 'REFERRAL',
    pipelineStage: 'TEST_SCHEDULED',
    lostReason: null,
    assignedSalesId: 2,
    assignedSalesName: 'Long Phạm',
    notes: 'Bạn học giới thiệu, đã hẹn lịch thi Placement Test ngày mai.',
    createdAt: new Date('2026-10-01T13:45:00Z'),
    updatedAt: new Date('2026-10-02T09:00:00Z'),
    lastContactedAt: new Date('2026-10-02T09:00:00Z'),
    totalInteractions: 1,
  },
  {
    id: 6,
    fullName: 'Trần Thu Hà',
    phoneNumber: '0912111006',
    email: 'thuha.tran@gmail.com',
    interest: 'IELTS',
    sourceChannel: 'FB_ADS',
    pipelineStage: 'TEST_SCHEDULED',
    lostReason: null,
    assignedSalesId: 2,
    assignedSalesName: 'Long Phạm',
    notes: 'Đã test xong chiều qua, đang đợi giáo vụ gửi phiếu phân tích điểm.',
    createdAt: new Date('2026-09-28T15:30:00Z'),
    updatedAt: new Date('2026-09-29T16:00:00Z'),
    lastContactedAt: new Date('2026-09-29T16:00:00Z'),
    totalInteractions: 1,
  },
  {
    id: 7,
    fullName: 'Đặng Minh Khôi',
    phoneNumber: '0912111007',
    email: 'khoi.dang@gmail.com',
    interest: 'IELTS',
    sourceChannel: 'FB_ADS',
    pipelineStage: 'ENROLLED',
    lostReason: null,
    assignedSalesId: 2,
    assignedSalesName: 'Long Phạm',
    notes: 'Test đầu vào 5.0, chốt học lớp K26, nộp đủ 100% học phí.',
    createdAt: new Date('2026-09-25T08:00:00Z'),
    updatedAt: new Date('2026-09-28T17:00:00Z'),
    lastContactedAt: new Date('2026-09-28T17:00:00Z'),
    totalInteractions: 1,
  },
  {
    id: 8,
    fullName: 'Vũ Hoàng Yến',
    phoneNumber: '0912111008',
    email: 'hoangyen.vu@gmail.com',
    interest: 'IELTS',
    sourceChannel: 'HOTLINE',
    pipelineStage: 'ENROLLED',
    lostReason: null,
    assignedSalesId: 2,
    assignedSalesName: 'Long Phạm',
    notes: 'Chốt học lớp K26, đã nộp đặt cọc giữ chỗ 3.000.000 VND.',
    createdAt: new Date('2026-09-26T10:00:00Z'),
    updatedAt: new Date('2026-09-29T10:30:00Z'),
    lastContactedAt: null,
    totalInteractions: 0,
  },
  {
    id: 9,
    fullName: 'Phan Quốc Tuấn',
    phoneNumber: '0912111009',
    email: 'quoctuan.phan@gmail.com',
    interest: 'IELTS',
    sourceChannel: 'WEBSITE',
    pipelineStage: 'ENROLLED',
    lostReason: null,
    assignedSalesId: 2,
    assignedSalesName: 'Long Phạm',
    notes: 'Chốt học lớp K27, chuyển khoản đủ học phí.',
    createdAt: new Date('2026-09-27T14:20:00Z'),
    updatedAt: new Date('2026-09-30T11:00:00Z'),
    lastContactedAt: null,
    totalInteractions: 0,
  },
  {
    id: 10,
    fullName: 'Bùi Văn Hậu',
    phoneNumber: '0912111010',
    email: 'vanhau.bui@gmail.com',
    interest: 'IELTS',
    sourceChannel: 'FB_ADS',
    pipelineStage: 'LOST',
    lostReason: 'Học phí cao vượt ngân sách dự kiến',
    assignedSalesId: 2,
    assignedSalesName: 'Long Phạm',
    notes: 'Khách phản hồi học phí vượt ngân sách dự kiến, hẹn dịp khác.',
    createdAt: new Date('2026-09-27T09:00:00Z'),
    updatedAt: new Date('2026-09-28T16:00:00Z'),
    lastContactedAt: new Date('2026-09-28T16:00:00Z'),
    totalInteractions: 1,
  },
];

let mockInteractions: InteractionLog[] = [
  {
    id: 1,
    leadId: 3,
    userId: 2,
    interactionType: 'PHONE_CALL',
    potentialLevel: 'WARM',
    content: 'Gọi điện tư vấn lần 1: Khách đang ở công ty bận họp, hẹn gọi lại lúc 17:30.',
    nextFollowUpAt: new Date('2026-10-01T17:30:00Z'),
    createdAt: new Date('2026-10-01T14:00:00Z'),
    userName: 'Long Phạm',
    userRole: 'SALES',
  },
  {
    id: 2,
    leadId: 5,
    userId: 2,
    interactionType: 'PHONE_CALL',
    potentialLevel: 'HOT',
    content: 'Tư vấn lộ trình IELTS: Học viên đã đồng ý đến làm bài test đầu vào chiều thứ 7 lúc 14:30.',
    nextFollowUpAt: new Date('2026-10-03T14:30:00Z'),
    createdAt: new Date('2026-10-02T09:00:00Z'),
    userName: 'Long Phạm',
    userRole: 'SALES',
  },
  {
    id: 3,
    leadId: 7,
    userId: 2,
    interactionType: 'DIRECT_MEETING',
    potentialLevel: 'HOT',
    content: 'Gặp trực tiếp tư vấn kết quả thi Overall 5.0, định hướng vào lớp K26 và hướng dẫn đóng học phí.',
    nextFollowUpAt: null,
    createdAt: new Date('2026-09-28T17:00:00Z'),
    userName: 'Long Phạm',
    userRole: 'SALES',
  },
];

let nextLeadId = 11;
let nextInteractionId = 4;

export class LeadRepository {
  /**
   * Lấy danh sách Lead có hỗ trợ lọc, tìm kiếm và phân trang
   */
  static async findAll(
    filter: LeadFilterQuery = {}
  ): Promise<{ leads: LeadWithDetails[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const offset = (page - 1) * limit;

    if (isDbAvailable()) {
      try {
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
      } catch (err: any) {
        logger.warn('Lỗi truy vấn DB khi lấy danh sách Lead, chuyển sang Mock store:', err.message);
      }
    }

    // In-Memory Mock Store Fallback
    let result = [...mockLeads];

    if (filter.pipelineStage) {
      result = result.filter((l) => l.pipelineStage === filter.pipelineStage);
    }
    if (filter.interest) {
      result = result.filter((l) => l.interest === filter.interest);
    }
    if (filter.sourceChannel) {
      result = result.filter((l) => l.sourceChannel === filter.sourceChannel);
    }
    if (filter.assignedSalesId) {
      result = result.filter((l) => l.assignedSalesId === Number(filter.assignedSalesId));
    }
    if (filter.search && filter.search.trim()) {
      const q = filter.search.trim().toLowerCase();
      result = result.filter(
        (l) =>
          l.fullName.toLowerCase().includes(q) ||
          l.phoneNumber.includes(q) ||
          (l.email && l.email.toLowerCase().includes(q))
      );
    }

    const sortOrder = filter.sortOrder?.toUpperCase() === 'ASC' ? 1 : -1;
    result.sort((a, b) => {
      if (filter.sortBy === 'full_name') {
        return a.fullName.localeCompare(b.fullName) * sortOrder;
      }
      if (filter.sortBy === 'updated_at') {
        return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * sortOrder;
      }
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * sortOrder;
    });

    const total = result.length;
    const paginated = result.slice(offset, offset + limit);

    return {
      leads: paginated,
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
    if (isDbAvailable()) {
      try {
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
      } catch (err: any) {
        logger.warn('Lỗi DB findById lead, dùng mock:', err.message);
      }
    }

    const found = mockLeads.find((l) => l.id === id);
    return found ? { ...found } : null;
  }

  /**
   * Tìm kiếm Lead theo Số điện thoại (kiểm tra trùng lặp BR-01)
   */
  static async findByPhone(phoneNumber: string, excludeId?: number): Promise<LeadWithDetails | null> {
    const cleanPhone = phoneNumber.trim();

    if (isDbAvailable()) {
      try {
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
      } catch (err: any) {
        logger.warn('Lỗi DB findByPhone, dùng mock:', err.message);
      }
    }

    const found = mockLeads.find(
      (l) => l.phoneNumber === cleanPhone && (excludeId === undefined || l.id !== excludeId)
    );
    return found ? { ...found } : null;
  }

  /**
   * Tìm kiếm Lead theo Email (kiểm tra trùng lặp)
   */
  static async findByEmail(email: string, excludeId?: number): Promise<LeadWithDetails | null> {
    const cleanEmail = email.trim().toLowerCase();

    if (isDbAvailable()) {
      try {
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
      } catch (err: any) {
        logger.warn('Lỗi DB findByEmail, dùng mock:', err.message);
      }
    }

    const found = mockLeads.find(
      (l) => l.email && l.email.toLowerCase() === cleanEmail && (excludeId === undefined || l.id !== excludeId)
    );
    return found ? { ...found } : null;
  }

  /**
   * Tạo hồ sơ Lead mới
   */
  static async create(dto: CreateLeadDto): Promise<LeadWithDetails> {
    const now = new Date();

    if (isDbAvailable()) {
      try {
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
          dto.assignedSalesId || null,
          dto.notes?.trim() || null,
        ];
        const res = await query(sql, params);
        const row = res.rows[0];

        // Lấy thông tin user phụ trách nếu có
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
      } catch (err: any) {
        logger.warn('Lỗi DB create lead, dùng mock:', err.message);
      }
    }

    const newLead: LeadWithDetails = {
      id: nextLeadId++,
      fullName: dto.fullName.trim(),
      phoneNumber: dto.phoneNumber.trim(),
      email: dto.email?.trim() || null,
      interest: dto.interest,
      sourceChannel: dto.sourceChannel,
      pipelineStage: 'NEW',
      lostReason: null,
      assignedSalesId: dto.assignedSalesId || null,
      assignedSalesName: dto.assignedSalesId === 2 ? 'Long Phạm' : dto.assignedSalesId === 1 ? 'Tam Minh' : null,
      notes: dto.notes?.trim() || null,
      createdAt: now,
      updatedAt: now,
      lastContactedAt: null,
      totalInteractions: 0,
    };

    mockLeads.unshift(newLead);
    return { ...newLead };
  }

  /**
   * Cập nhật thông tin chi tiết Lead
   */
  static async update(id: number, dto: UpdateLeadDto): Promise<LeadWithDetails | null> {
    if (isDbAvailable()) {
      try {
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
      } catch (err: any) {
        logger.warn('Lỗi DB update lead, dùng mock:', err.message);
      }
    }

    const idx = mockLeads.findIndex((l) => l.id === id);
    if (idx === -1) return null;

    const current = mockLeads[idx];
    const updated: LeadWithDetails = {
      ...current,
      fullName: dto.fullName !== undefined ? dto.fullName.trim() : current.fullName,
      phoneNumber: dto.phoneNumber !== undefined ? dto.phoneNumber.trim() : current.phoneNumber,
      email: dto.email !== undefined ? dto.email?.trim() || null : current.email,
      interest: dto.interest !== undefined ? dto.interest : current.interest,
      sourceChannel: dto.sourceChannel !== undefined ? dto.sourceChannel : current.sourceChannel,
      pipelineStage: dto.pipelineStage !== undefined ? dto.pipelineStage : current.pipelineStage,
      lostReason: dto.lostReason !== undefined ? dto.lostReason?.trim() || null : current.lostReason,
      assignedSalesId: dto.assignedSalesId !== undefined ? dto.assignedSalesId : current.assignedSalesId,
      notes: dto.notes !== undefined ? dto.notes?.trim() || null : current.notes,
      updatedAt: new Date(),
    };

    mockLeads[idx] = updated;
    return { ...updated };
  }

  /**
   * Cập nhật nhanh trạng thái giai đoạn Pipeline (Kanban Drag & Drop)
   */
  static async updateStatus(
    id: number,
    pipelineStage: LeadPipelineStage,
    lostReason?: string | null
  ): Promise<LeadWithDetails | null> {
    if (isDbAvailable()) {
      try {
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
      } catch (err: any) {
        logger.warn('Lỗi DB updateStatus lead, dùng mock:', err.message);
      }
    }

    const idx = mockLeads.findIndex((l) => l.id === id);
    if (idx === -1) return null;

    mockLeads[idx] = {
      ...mockLeads[idx],
      pipelineStage,
      lostReason: lostReason?.trim() || null,
      updatedAt: new Date(),
    };

    return { ...mockLeads[idx] };
  }

  /**
   * Phân bổ Lead cho Tư vấn viên (Assign Lead)
   */
  static async assignSales(id: number, salesId: number | null): Promise<LeadWithDetails | null> {
    if (isDbAvailable()) {
      try {
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
      } catch (err: any) {
        logger.warn('Lỗi DB assignSales lead, dùng mock:', err.message);
      }
    }

    const idx = mockLeads.findIndex((l) => l.id === id);
    if (idx === -1) return null;

    mockLeads[idx] = {
      ...mockLeads[idx],
      assignedSalesId: salesId,
      assignedSalesName: salesId === 2 ? 'Long Phạm' : salesId === 1 ? 'Tam Minh' : null,
      updatedAt: new Date(),
    };

    return { ...mockLeads[idx] };
  }

  /**
   * Xóa hồ sơ Lead
   */
  static async delete(id: number): Promise<boolean> {
    if (isDbAvailable()) {
      try {
        const res = await query('DELETE FROM leads WHERE id = $1 RETURNING id;', [id]);
        return res.rowCount !== null && res.rowCount > 0;
      } catch (err: any) {
        logger.warn('Lỗi DB delete lead, dùng mock:', err.message);
      }
    }

    const idx = mockLeads.findIndex((l) => l.id === id);
    if (idx === -1) return false;

    mockLeads.splice(idx, 1);
    mockInteractions = mockInteractions.filter((i) => i.leadId !== id);
    return true;
  }

  /**
   * Thống kê tổng hợp số liệu Lead
   */
  static async getStats(): Promise<LeadStatsResponse> {
    if (isDbAvailable()) {
      try {
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
      } catch (err: any) {
        logger.warn('Lỗi DB getStats, dùng mock:', err.message);
      }
    }

    const byStage: Record<LeadPipelineStage, number> = {
      NEW: 0,
      CONTACTING: 0,
      TEST_SCHEDULED: 0,
      ENROLLED: 0,
      LOST: 0,
    };
    const bySource: Record<LeadSourceChannel, number> = {
      FB_ADS: 0,
      WEBSITE: 0,
      HOTLINE: 0,
      WALK_IN: 0,
      REFERRAL: 0,
    };
    const byInterest: Record<LeadInterest, number> = {
      IELTS: 0,
      TOEIC: 0,
      COMMUNICATION: 0,
    };

    for (const lead of mockLeads) {
      byStage[lead.pipelineStage]++;
      bySource[lead.sourceChannel]++;
      byInterest[lead.interest]++;
    }

    const totalLeads = mockLeads.length;
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
    if (isDbAvailable()) {
      try {
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
      } catch (err: any) {
        logger.warn('Lỗi DB findInteractions, dùng mock:', err.message);
      }
    }

    const list = mockInteractions.filter((i) => i.leadId === leadId);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

    if (isDbAvailable()) {
      try {
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

        // Lấy tên user tạo log
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
      } catch (err: any) {
        logger.warn('Lỗi DB createInteraction, dùng mock:', err.message);
      }
    }

    const log: InteractionLog = {
      id: nextInteractionId++,
      leadId,
      userId,
      interactionType: dto.interactionType,
      potentialLevel: dto.potentialLevel,
      content: dto.content.trim(),
      nextFollowUpAt: nextDate,
      createdAt: new Date(),
      userName,
      userRole,
    };

    mockInteractions.unshift(log);

    // Cập nhật số lần tương tác trong mockLeads
    const lead = mockLeads.find((l) => l.id === leadId);
    if (lead) {
      lead.lastContactedAt = log.createdAt;
      lead.totalInteractions = (lead.totalInteractions || 0) + 1;
    }

    return { ...log };
  }
}
