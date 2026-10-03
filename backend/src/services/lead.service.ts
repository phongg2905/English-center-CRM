import { LeadRepository } from '../repositories/lead.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import {
  LeadWithDetails,
  CreateLeadDto,
  UpdateLeadDto,
  UpdateLeadStatusDto,
  CreateInteractionLogDto,
  LeadFilterQuery,
  LeadStatsResponse,
  KanbanBoardResponse,
  InteractionLog,
  LeadPipelineStage,
  LeadInterest,
  LeadSourceChannel,
  InteractionType,
  PotentialLevel,
} from '../types/lead.types.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const VALID_INTERESTS: LeadInterest[] = ['IELTS', 'TOEIC', 'COMMUNICATION'];
const VALID_SOURCES: LeadSourceChannel[] = ['FB_ADS', 'WEBSITE', 'HOTLINE', 'WALK_IN', 'REFERRAL'];
const VALID_STAGES: LeadPipelineStage[] = ['NEW', 'CONTACTING', 'TEST_SCHEDULED', 'ENROLLED', 'LOST'];
const VALID_INTERACTION_TYPES: InteractionType[] = ['PHONE_CALL', 'SMS', 'DIRECT_MEETING', 'SYSTEM_NOTE'];
const VALID_POTENTIAL_LEVELS: PotentialLevel[] = ['HOT', 'WARM', 'COLD'];

export class LeadService {
  /**
   * Kiểm tra định dạng số điện thoại Việt Nam (10 chữ số bắt đầu bằng 0)
   */
  private static validatePhone(phone: string): void {
    const clean = phone.trim();
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(clean)) {
      throw AppError.badRequest(
        `Số điện thoại [${phone}] không hợp lệ. Yêu cầu chuẩn 10 chữ số bắt đầu bằng 0 (ví dụ: 0912345678)`
      );
    }
  }

  /**
   * Kiểm tra định dạng email
   */
  private static validateEmail(email: string): void {
    const clean = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clean)) {
      throw AppError.badRequest(`Định dạng email [${email}] không hợp lệ`);
    }
  }

  /**
   * Tạo Lead mới (Tiếp nhận hồ sơ tuyển sinh)
   */
  static async createLead(
    dto: CreateLeadDto,
    currentUserId?: number,
    currentUserRole?: string
  ): Promise<LeadWithDetails> {
    if (!dto.fullName || !dto.fullName.trim()) {
      throw AppError.badRequest('Họ và tên khách hàng là bắt buộc');
    }
    if (!dto.phoneNumber || !dto.phoneNumber.trim()) {
      throw AppError.badRequest('Số điện thoại là bắt buộc');
    }

    this.validatePhone(dto.phoneNumber);

    if (dto.email && dto.email.trim()) {
      this.validateEmail(dto.email);
    }

    if (!VALID_INTERESTS.includes(dto.interest)) {
      throw AppError.badRequest(
        `Nhu cầu học [${dto.interest}] không hợp lệ. Chấp nhận: ${VALID_INTERESTS.join(', ')}`
      );
    }

    if (!VALID_SOURCES.includes(dto.sourceChannel)) {
      throw AppError.badRequest(
        `Kênh tiếp cận [${dto.sourceChannel}] không hợp lệ. Chấp nhận: ${VALID_SOURCES.join(', ')}`
      );
    }

    // Quy tắc nghiệp vụ BR-01: Kiểm tra trùng lặp Số điện thoại
    const existingByPhone = await LeadRepository.findByPhone(dto.phoneNumber);
    if (existingByPhone) {
      throw AppError.conflict(
        `Số điện thoại [${dto.phoneNumber}] đã tồn tại trên hệ thống! Thuộc Lead: [${existingByPhone.fullName}] - Phụ trách bởi: [${existingByPhone.assignedSalesName || 'Chưa gán'}] - Trạng thái: [${existingByPhone.pipelineStage}]`,
        { existingLeadId: existingByPhone.id }
      );
    }

    // Kiểm tra trùng lặp Email (nếu có cung cấp)
    if (dto.email && dto.email.trim()) {
      const existingByEmail = await LeadRepository.findByEmail(dto.email);
      if (existingByEmail) {
        throw AppError.conflict(
          `Email [${dto.email}] đã tồn tại trên hệ thống! Thuộc Lead: [${existingByEmail.fullName}]`,
          { existingLeadId: existingByEmail.id }
        );
      }
    }

    // Tự động gán người phụ trách nếu người tạo là SALES và chưa chọn người phụ trách
    let assignedSalesId = dto.assignedSalesId;
    if (!assignedSalesId && currentUserRole?.toUpperCase() === 'SALES' && currentUserId) {
      assignedSalesId = currentUserId;
    }

    // Tạo hồ sơ Lead
    const createdLead = await LeadRepository.create({
      ...dto,
      assignedSalesId,
    });

    // Tự động tạo bản ghi InteractionLog khởi tạo nguồn
    try {
      await LeadRepository.createInteraction(
        createdLead.id,
        currentUserId || 1,
        {
          interactionType: 'SYSTEM_NOTE',
          potentialLevel: 'WARM',
          content: `Hệ thống tiếp nhận hồ sơ Lead mới từ kênh [${dto.sourceChannel}] - Nhu cầu: [${dto.interest}]`,
        },
        'Hệ thống CRM',
        'SYSTEM'
      );
    } catch (logErr) {
      logger.warn('Không thể ghi system log khi tạo lead:', logErr);
    }

    return createdLead;
  }

  /**
   * Lấy danh sách Lead phân trang và lọc
   */
  static async getLeads(filter: LeadFilterQuery = {}) {
    return await LeadRepository.findAll(filter);
  }

  /**
   * Lấy dữ liệu Kanban Pipeline
   */
  static async getKanban(assignedSalesId?: number): Promise<KanbanBoardResponse> {
    return await LeadRepository.findKanban(assignedSalesId);
  }

  /**
   * Lấy chi tiết Lead theo ID
   */
  static async getLeadById(id: number): Promise<LeadWithDetails> {
    const lead = await LeadRepository.findById(id);
    if (!lead) {
      throw AppError.notFound(`Không tìm thấy hồ sơ khách hàng tiềm năng với ID = ${id}`);
    }
    return lead;
  }

  /**
   * Cập nhật thông tin chi tiết Lead
   */
  static async updateLead(id: number, dto: UpdateLeadDto): Promise<LeadWithDetails> {
    const existing = await LeadRepository.findById(id);
    if (!existing) {
      throw AppError.notFound(`Không tìm thấy hồ sơ khách hàng tiềm năng với ID = ${id}`);
    }

    if (dto.phoneNumber) {
      this.validatePhone(dto.phoneNumber);
      const duplicatePhone = await LeadRepository.findByPhone(dto.phoneNumber, id);
      if (duplicatePhone) {
        throw AppError.conflict(
          `Số điện thoại [${dto.phoneNumber}] đã được sử dụng bởi Lead khác (${duplicatePhone.fullName})`
        );
      }
    }

    if (dto.email) {
      this.validateEmail(dto.email);
      const duplicateEmail = await LeadRepository.findByEmail(dto.email, id);
      if (duplicateEmail) {
        throw AppError.conflict(
          `Email [${dto.email}] đã được sử dụng bởi Lead khác (${duplicateEmail.fullName})`
        );
      }
    }

    if (dto.interest && !VALID_INTERESTS.includes(dto.interest)) {
      throw AppError.badRequest(`Nhu cầu học [${dto.interest}] không hợp lệ`);
    }

    if (dto.sourceChannel && !VALID_SOURCES.includes(dto.sourceChannel)) {
      throw AppError.badRequest(`Kênh tiếp cận [${dto.sourceChannel}] không hợp lệ`);
    }

    // Quy tắc BR-02: Nếu chuyển sang LOST thì bắt buộc có lý do
    if (dto.pipelineStage === 'LOST' && (!dto.lostReason || !dto.lostReason.trim())) {
      throw AppError.badRequest('Vui lòng cung cấp lý do thất bại (lostReason) khi chuyển sang trạng thái LOST');
    }

    const updated = await LeadRepository.update(id, dto);
    if (!updated) {
      throw AppError.internal('Cập nhật hồ sơ Lead thất bại');
    }
    return updated;
  }

  /**
   * Cập nhật nhanh trạng thái giai đoạn Pipeline (Kanban Drag & Drop)
   */
  static async updateStatus(
    id: number,
    dto: UpdateLeadStatusDto,
    userId: number,
    userName: string
  ): Promise<LeadWithDetails> {
    const lead = await LeadRepository.findById(id);
    if (!lead) {
      throw AppError.notFound(`Không tìm thấy hồ sơ Lead với ID = ${id}`);
    }

    if (!VALID_STAGES.includes(dto.pipelineStage)) {
      throw AppError.badRequest(
        `Trạng thái phễu [${dto.pipelineStage}] không hợp lệ. Chấp nhận: ${VALID_STAGES.join(', ')}`
      );
    }

    // Quy tắc BR-02: Bắt buộc chọn lý do khi chuyển sang LOST
    if (dto.pipelineStage === 'LOST' && (!dto.lostReason || !dto.lostReason.trim())) {
      throw AppError.badRequest(
        'Vui lòng cung cấp lý do hủy (lostReason) khi chuyển trạng thái Lead sang LOST (ví dụ: Học phí cao, Lịch không phù hợp...)'
      );
    }

    const oldStage = lead.pipelineStage;
    if (oldStage === dto.pipelineStage) {
      return lead;
    }

    const updated = await LeadRepository.updateStatus(id, dto.pipelineStage, dto.lostReason);
    if (!updated) {
      throw AppError.internal('Không thể cập nhật trạng thái Lead');
    }

    // Ghi nhật ký hệ thống về việc dịch chuyển thẻ Kanban
    try {
      const reasonMsg = dto.pipelineStage === 'LOST' ? ` - Lý do: ${dto.lostReason}` : '';
      await LeadRepository.createInteraction(
        id,
        userId,
        {
          interactionType: 'SYSTEM_NOTE',
          potentialLevel: dto.pipelineStage === 'ENROLLED' ? 'HOT' : dto.pipelineStage === 'LOST' ? 'COLD' : 'WARM',
          content: `${userName} đã chuyển trạng thái từ [${oldStage}] sang [${dto.pipelineStage}]${reasonMsg}`,
        },
        userName,
        'SALES'
      );
    } catch (err) {
      logger.warn('Lỗi ghi interaction log khi đổi stage:', err);
    }

    return updated;
  }

  /**
   * Phân bổ Lead cho tư vấn viên (Assign Sales)
   */
  static async assignSales(
    id: number,
    assignedSalesId: number | null,
    userId: number,
    userName: string
  ): Promise<LeadWithDetails> {
    const lead = await LeadRepository.findById(id);
    if (!lead) {
      throw AppError.notFound(`Không tìm thấy hồ sơ Lead với ID = ${id}`);
    }

    let targetSalesName = 'Chưa gán';
    if (assignedSalesId) {
      const targetUser = await UserRepository.findById(assignedSalesId);
      if (!targetUser) {
        throw AppError.notFound(`Không tìm thấy người dùng với ID = ${assignedSalesId}`);
      }
      targetSalesName = targetUser.fullName;
    }

    const updated = await LeadRepository.assignSales(id, assignedSalesId);
    if (!updated) {
      throw AppError.internal('Phân bổ người phụ trách thất bại');
    }

    // Ghi nhật ký hệ thống
    try {
      await LeadRepository.createInteraction(
        id,
        userId,
        {
          interactionType: 'SYSTEM_NOTE',
          potentialLevel: 'WARM',
          content: `${userName} đã phân công phụ trách Lead cho [${targetSalesName}]`,
        },
        userName,
        'ADMIN'
      );
    } catch (err) {
      logger.warn('Lỗi ghi interaction log khi assign:', err);
    }

    return updated;
  }

  /**
   * Xóa hồ sơ Lead
   */
  static async deleteLead(id: number): Promise<void> {
    const lead = await LeadRepository.findById(id);
    if (!lead) {
      throw AppError.notFound(`Không tìm thấy hồ sơ Lead với ID = ${id}`);
    }

    const deleted = await LeadRepository.delete(id);
    if (!deleted) {
      throw AppError.internal('Xóa hồ sơ Lead thất bại');
    }
  }

  /**
   * Báo cáo thống kê số liệu Lead
   */
  static async getStats(): Promise<LeadStatsResponse> {
    return await LeadRepository.getStats();
  }

  /**
   * Lấy lịch sử tư vấn / tương tác của Lead
   */
  static async getConsultations(leadId: number): Promise<InteractionLog[]> {
    const lead = await LeadRepository.findById(leadId);
    if (!lead) {
      throw AppError.notFound(`Không tìm thấy hồ sơ Lead với ID = ${leadId}`);
    }

    return await LeadRepository.findInteractionsByLeadId(leadId);
  }

  /**
   * Thêm mới nhật ký tư vấn / cuộc gọi cho Lead
   */
  static async addConsultation(
    leadId: number,
    userId: number,
    dto: CreateInteractionLogDto,
    userName: string,
    userRole: string
  ): Promise<InteractionLog> {
    const lead = await LeadRepository.findById(leadId);
    if (!lead) {
      throw AppError.notFound(`Không tìm thấy hồ sơ Lead với ID = ${leadId}`);
    }

    if (!dto.content || !dto.content.trim()) {
      throw AppError.badRequest('Nội dung nhật ký tương tác không được để trống');
    }

    if (!VALID_INTERACTION_TYPES.includes(dto.interactionType)) {
      throw AppError.badRequest(
        `Loại tương tác [${dto.interactionType}] không hợp lệ. Chấp nhận: ${VALID_INTERACTION_TYPES.join(', ')}`
      );
    }

    if (!VALID_POTENTIAL_LEVELS.includes(dto.potentialLevel)) {
      throw AppError.badRequest(
        `Mức độ tiềm năng [${dto.potentialLevel}] không hợp lệ. Chấp nhận: ${VALID_POTENTIAL_LEVELS.join(', ')}`
      );
    }

    const log = await LeadRepository.createInteraction(leadId, userId, dto, userName, userRole);

    // Nếu Lead đang ở trạng thái 'NEW', tự động chuyển sang 'CONTACTING' (Đang liên hệ)
    if (lead.pipelineStage === 'NEW') {
      await LeadRepository.updateStatus(leadId, 'CONTACTING', null);
      logger.info(`Lead ID=${leadId} đã tự động chuyển từ NEW sang CONTACTING sau khi ghi nhật ký tư vấn.`);
    }

    return log;
  }
}
