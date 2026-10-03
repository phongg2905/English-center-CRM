import { Request, Response, NextFunction } from 'express';
import { LeadService } from '../services/lead.service.js';
import { ApiResponse } from '../utils/response.js';
import { AppError } from '../utils/AppError.js';
import { LeadPipelineStage, LeadInterest, LeadSourceChannel } from '../types/lead.types.js';

export class LeadController {
  /**
   * @route GET /api/leads
   * @desc  Lấy danh sách Lead phân trang, tìm kiếm và lọc
   */
  static async getLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        pipelineStage,
        interest,
        sourceChannel,
        assignedSalesId,
        search,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await LeadService.getLeads({
        pipelineStage: pipelineStage as LeadPipelineStage | undefined,
        interest: interest as LeadInterest | undefined,
        sourceChannel: sourceChannel as LeadSourceChannel | undefined,
        assignedSalesId: assignedSalesId ? Number(assignedSalesId) : undefined,
        search: search as string | undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        sortBy: sortBy as 'created_at' | 'updated_at' | 'full_name' | undefined,
        sortOrder: sortOrder as 'ASC' | 'DESC' | undefined,
      });

      ApiResponse.success(res, result.leads, 'Lấy danh sách Lead thành công', 200, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/leads/kanban
   * @desc  Lấy dữ liệu bảng Kanban phân luồng theo 5 cột trạng thái
   */
  static async getKanban(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { assignedSalesId } = req.query;
      const kanban = await LeadService.getKanban(
        assignedSalesId ? Number(assignedSalesId) : undefined
      );
      ApiResponse.success(res, kanban, 'Lấy dữ liệu bảng Kanban Lead thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/leads/stats
   * @desc  Lấy báo cáo số liệu thống kê Lead
   */
  static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await LeadService.getStats();
      ApiResponse.success(res, stats, 'Lấy thống kê Lead thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/leads/:id
   * @desc  Lấy thông tin chi tiết một Lead theo ID
   */
  static async getLeadById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw AppError.badRequest('ID khách hàng tiềm năng không hợp lệ');
      }
      const lead = await LeadService.getLeadById(id);
      ApiResponse.success(res, lead, 'Lấy chi tiết Lead thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/leads
   * @desc  Tiếp nhận Lead mới vào phễu tuyển sinh
   */
  static async createLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const lead = await LeadService.createLead(req.body, userId, userRole);
      ApiResponse.created(res, lead, 'Tiếp nhận Lead mới thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route PUT /api/leads/:id
   * @desc  Cập nhật toàn bộ thông tin Lead
   */
  static async updateLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw AppError.badRequest('ID khách hàng tiềm năng không hợp lệ');
      }
      const updated = await LeadService.updateLead(id, req.body);
      ApiResponse.success(res, updated, 'Cập nhật thông tin Lead thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route PATCH /api/leads/:id/status
   * @desc  Cập nhật nhanh trạng thái Lead (phục vụ kéo thả trên Kanban)
   */
  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw AppError.badRequest('ID khách hàng tiềm năng không hợp lệ');
      }
      const userId = req.user?.userId || 1;
      const userName = req.user?.username || 'User';

      const updated = await LeadService.updateStatus(id, req.body, userId, userName);
      ApiResponse.success(res, updated, 'Cập nhật trạng thái Lead thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route PATCH /api/leads/:id/assign
   * @desc  Phân công người phụ trách Lead (Tư vấn viên)
   */
  static async assignLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw AppError.badRequest('ID khách hàng tiềm năng không hợp lệ');
      }
      const { assignedSalesId } = req.body;
      const userId = req.user?.userId || 1;
      const userName = req.user?.username || 'User';

      const updated = await LeadService.assignSales(
        id,
        assignedSalesId !== undefined ? (assignedSalesId === null ? null : Number(assignedSalesId)) : null,
        userId,
        userName
      );
      ApiResponse.success(res, updated, 'Phân bổ tư vấn viên thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route DELETE /api/leads/:id
   * @desc  Xóa hồ sơ Lead khỏi hệ thống (Chỉ Admin)
   */
  static async deleteLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw AppError.badRequest('ID khách hàng tiềm năng không hợp lệ');
      }
      await LeadService.deleteLead(id);
      ApiResponse.success(res, null, 'Xóa hồ sơ Lead thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/leads/:id/consultations
   * @desc  Lấy lịch sử tư vấn / tương tác của Lead
   */
  static async getConsultations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw AppError.badRequest('ID khách hàng tiềm năng không hợp lệ');
      }
      const logs = await LeadService.getConsultations(id);
      ApiResponse.success(res, logs, 'Lấy lịch sử tương tác chăm sóc Lead thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/leads/:id/consultations
   * @desc  Ghi nhật ký tương tác / cuộc gọi tư vấn mới
   */
  static async addConsultation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw AppError.badRequest('ID khách hàng tiềm năng không hợp lệ');
      }
      const userId = req.user?.userId || 1;
      const userName = req.user?.username || 'User';
      const userRole = req.user?.role || 'SALES';

      const log = await LeadService.addConsultation(id, userId, req.body, userName, userRole);
      ApiResponse.created(res, log, 'Ghi nhận nhật ký tư vấn thành công');
    } catch (error) {
      next(error);
    }
  }
}
