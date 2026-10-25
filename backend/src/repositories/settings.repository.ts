import { query } from '../database/pool.js';
import { logger } from '../utils/logger.js';

export interface SystemSettings {
  id: number;
  centerName: string;
  slogan: string;
  centerCode: string;
  hotline: string;
  email: string;
  address: string;
  website: string;
  workingHours: string;
  logoUrl: string | null;
  ieltsMinScore: string;
  toeicMinScore: string;
  slaLeadMinutes: number;
  maxClassCapacity: number;
  occupancyWarningRate: number;
  autoAssignLeads: boolean;
  autoSendPlacementResult: boolean;
  sessionTimeoutHours: number;
  requireTwoFactorForAdmin: boolean;
  autoBackupDaily: boolean;
  updatedAt: string;
}

export class SettingsRepository {
  /**
   * Lấy cấu hình hệ thống hiện tại từ Database
   */
  static async getSettings(): Promise<SystemSettings> {
    const sql = `
      SELECT 
        id,
        center_name,
        slogan,
        center_code,
        hotline,
        email,
        address,
        website,
        working_hours,
        logo_url,
        ielts_min_score,
        toeic_min_score,
        sla_lead_minutes,
        max_class_capacity,
        occupancy_warning_rate,
        auto_assign_leads,
        auto_send_placement_result,
        session_timeout_hours,
        require_two_factor_for_admin,
        auto_backup_daily,
        updated_at
      FROM system_settings
      WHERE id = 1
      LIMIT 1;
    `;
    const res = await query(sql);
    if (res.rows.length === 0) {
      // Tự động tạo bản ghi 1 nếu chưa tồn tại
      await query('INSERT INTO system_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;');
      const retryRes = await query(sql);
      return this.mapRow(retryRes.rows[0]);
    }
    return this.mapRow(res.rows[0]);
  }

  /**
   * Cập nhật thông số cấu hình hệ thống
   */
  static async updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
    const fields: string[] = [];
    const values: any[] = [];
    let pIdx = 1;

    const columnMapping: Record<string, string> = {
      centerName: 'center_name',
      slogan: 'slogan',
      centerCode: 'center_code',
      hotline: 'hotline',
      email: 'email',
      address: 'address',
      website: 'website',
      workingHours: 'working_hours',
      logoUrl: 'logo_url',
      ieltsMinScore: 'ielts_min_score',
      toeicMinScore: 'toeic_min_score',
      slaLeadMinutes: 'sla_lead_minutes',
      maxClassCapacity: 'max_class_capacity',
      occupancyWarningRate: 'occupancy_warning_rate',
      autoAssignLeads: 'auto_assign_leads',
      autoSendPlacementResult: 'auto_send_placement_result',
      sessionTimeoutHours: 'session_timeout_hours',
      requireTwoFactorForAdmin: 'require_two_factor_for_admin',
      autoBackupDaily: 'auto_backup_daily',
    };

    for (const [key, col] of Object.entries(columnMapping)) {
      if ((data as any)[key] !== undefined) {
        fields.push(`${col} = $${pIdx++}`);
        values.push((data as any)[key]);
      }
    }

    if (fields.length === 0) {
      return this.getSettings();
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    const sql = `
      UPDATE system_settings
      SET ${fields.join(', ')}
      WHERE id = 1
      RETURNING 
        id, center_name, slogan, center_code, hotline, email, address,
        website, working_hours, logo_url, ielts_min_score, toeic_min_score,
        sla_lead_minutes, max_class_capacity, occupancy_warning_rate,
        auto_assign_leads, auto_send_placement_result, session_timeout_hours,
        require_two_factor_for_admin, auto_backup_daily, updated_at;
    `;

    const res = await query(sql, values);
    logger.info('Đã cập nhật cấu hình hệ thống system_settings thành công');
    return this.mapRow(res.rows[0]);
  }

  private static mapRow(row: any): SystemSettings {
    return {
      id: row.id,
      centerName: row.center_name || 'EduFlow English Academy',
      slogan: row.slogan || '',
      centerCode: row.center_code || 'EF-HN-01',
      hotline: row.hotline || '1900 6868',
      email: row.email || 'contact@eduflow.edu.vn',
      address: row.address || '',
      website: row.website || 'https://eduflow.edu.vn',
      workingHours: row.working_hours || '08:00 - 21:30',
      logoUrl: row.logo_url || null,
      ieltsMinScore: row.ielts_min_score || '4.5',
      toeicMinScore: row.toeic_min_score || '450',
      slaLeadMinutes: Number(row.sla_lead_minutes) || 30,
      maxClassCapacity: Number(row.max_class_capacity) || 20,
      occupancyWarningRate: Number(row.occupancy_warning_rate) || 85,
      autoAssignLeads: Boolean(row.auto_assign_leads),
      autoSendPlacementResult: Boolean(row.auto_send_placement_result),
      sessionTimeoutHours: Number(row.session_timeout_hours) || 8,
      requireTwoFactorForAdmin: Boolean(row.require_two_factor_for_admin),
      autoBackupDaily: Boolean(row.auto_backup_daily),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    };
  }
}
