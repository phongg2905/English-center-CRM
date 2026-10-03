/**
 * Định nghĩa Type & Interface cho Module Quản lý Lead (UC-01)
 * Phù hợp với CSDL chuẩn 3NF: Bảng leads & interaction_logs
 */

export type LeadInterest = 'IELTS' | 'TOEIC' | 'COMMUNICATION';
export type LeadSourceChannel = 'FB_ADS' | 'WEBSITE' | 'HOTLINE' | 'WALK_IN' | 'REFERRAL';
export type LeadPipelineStage = 'NEW' | 'CONTACTING' | 'TEST_SCHEDULED' | 'ENROLLED' | 'LOST';

export type InteractionType = 'PHONE_CALL' | 'SMS' | 'DIRECT_MEETING' | 'SYSTEM_NOTE';
export type PotentialLevel = 'HOT' | 'WARM' | 'COLD';

export interface Lead {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  interest: LeadInterest;
  sourceChannel: LeadSourceChannel;
  pipelineStage: LeadPipelineStage;
  lostReason: string | null;
  assignedSalesId: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadWithDetails extends Lead {
  assignedSalesName?: string | null;
  assignedSalesEmail?: string | null;
  lastContactedAt?: Date | null;
  totalInteractions?: number;
}

export interface InteractionLog {
  id: number;
  leadId: number;
  userId: number;
  interactionType: InteractionType;
  potentialLevel: PotentialLevel;
  content: string;
  nextFollowUpAt: Date | null;
  createdAt: Date;
  userName?: string;
  userRole?: string;
}

export interface CreateLeadDto {
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  interest: LeadInterest;
  sourceChannel: LeadSourceChannel;
  assignedSalesId?: number | null;
  notes?: string | null;
}

export interface UpdateLeadDto {
  fullName?: string;
  phoneNumber?: string;
  email?: string | null;
  interest?: LeadInterest;
  sourceChannel?: LeadSourceChannel;
  pipelineStage?: LeadPipelineStage;
  lostReason?: string | null;
  assignedSalesId?: number | null;
  notes?: string | null;
}

export interface UpdateLeadStatusDto {
  pipelineStage: LeadPipelineStage;
  lostReason?: string | null;
}

export interface AssignLeadDto {
  assignedSalesId: number | null;
}

export interface CreateInteractionLogDto {
  interactionType: InteractionType;
  potentialLevel: PotentialLevel;
  content: string;
  nextFollowUpAt?: string | Date | null;
}

export interface LeadFilterQuery {
  pipelineStage?: LeadPipelineStage;
  interest?: LeadInterest;
  sourceChannel?: LeadSourceChannel;
  assignedSalesId?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'updated_at' | 'full_name';
  sortOrder?: 'ASC' | 'DESC';
}

export interface LeadStatsResponse {
  totalLeads: number;
  byStage: Record<LeadPipelineStage, number>;
  bySource: Record<LeadSourceChannel, number>;
  byInterest: Record<LeadInterest, number>;
  conversionRate: number; // Tỷ lệ ENROLLED / totalLeads (%)
}

export interface KanbanBoardResponse {
  NEW: LeadWithDetails[];
  CONTACTING: LeadWithDetails[];
  TEST_SCHEDULED: LeadWithDetails[];
  ENROLLED: LeadWithDetails[];
  LOST: LeadWithDetails[];
  counts: Record<LeadPipelineStage, number>;
}
