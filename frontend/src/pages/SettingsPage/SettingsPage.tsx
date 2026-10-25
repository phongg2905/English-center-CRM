/**
 * DỰ ÁN: ENGLISH CENTER CRM (EduFlow CRM)
 * MÀN HÌNH: CÀI ĐẶT HỆ THỐNG (SYSTEM SETTINGS)
 * Vision Liquid Glass Design System: Cosmic Sunset & Quicksand Typography
 */

import React, { useState, useEffect } from 'react';
import {
  Building2,
  GraduationCap,
  CreditCard,
  Bell,
  ShieldCheck,
  Save,
  RotateCcw,
  CheckCircle2,
  Upload,
  Phone,
  Mail,
  MapPin,
  Globe,
  Clock,
  Sliders,
  Lock,
  Server,
  Zap,
} from 'lucide-react';
import eduflowLogoSquare from '../../assets/brand/eduflow-logo-square.png';
import { SettingsService } from '../../services/settings.service';
import './SettingsPage.css';

interface SystemSettingsState {
  // General Profile
  centerName: string;
  slogan: string;
  centerCode: string;
  hotline: string;
  email: string;
  address: string;
  website: string;
  workingHours: string;
  
  // Academic & Operations
  ieltsMinScore: string;
  toeicMinScore: string;
  slaLeadMinutes: number;
  maxClassCapacity: number;
  occupancyWarningRate: number;
  autoAssignLeads: boolean;
  autoSendPlacementResult: boolean;

  // Finance & Tuition
  currency: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  receiptPrefix: string;
  autoGenerateReceipt: boolean;
  allowPartialPayment: boolean;

  // Notifications & Integrations
  enableSmsPlacementReminder: boolean;
  enableZnsNotification: boolean;
  enableEmailTuitionReminder: boolean;
  enableGoogleCalendarSync: boolean;
  reminderBeforeHours: number;

  // Security & System
  sessionTimeoutHours: number;
  requireTwoFactorForAdmin: boolean;
  autoBackupDaily: boolean;
}

const DEFAULT_SETTINGS: SystemSettingsState = {
  centerName: 'EduFlow English Academy',
  slogan: 'Tiên phong đào tạo tiếng Anh chuẩn quốc tế Cambridge & IELTS',
  centerCode: 'EF-HN-01',
  hotline: '1900 6868',
  email: 'contact@eduflow.edu.vn',
  address: 'Tầng 5, Tòa nhà EduTower, 144 Xuân Thủy, Cầu Giấy, Hà Nội',
  website: 'https://eduflow.edu.vn',
  workingHours: '08:00 - 21:30 (Thứ 2 - Chủ Nhật)',

  ieltsMinScore: '4.5',
  toeicMinScore: '450',
  slaLeadMinutes: 30,
  maxClassCapacity: 20,
  occupancyWarningRate: 85,
  autoAssignLeads: true,
  autoSendPlacementResult: true,

  currency: 'VND',
  bankName: 'Ngân hàng Quân Đội (MB Bank)',
  bankAccountNumber: '888899996868',
  bankAccountHolder: 'TRUNG TAM ANH NGU EDUFLOW',
  receiptPrefix: 'PT-2026',
  autoGenerateReceipt: true,
  allowPartialPayment: true,

  enableSmsPlacementReminder: true,
  enableZnsNotification: true,
  enableEmailTuitionReminder: true,
  enableGoogleCalendarSync: true,
  reminderBeforeHours: 24,

  sessionTimeoutHours: 8,
  requireTwoFactorForAdmin: true,
  autoBackupDaily: true,
};

const STORAGE_KEY = 'eduflow_crm_system_settings';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'academic' | 'finance' | 'notifications' | 'security'>('general');
  const [settings, setSettings] = useState<SystemSettingsState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback to defaults
    }
    return DEFAULT_SETTINGS;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(eduflowLogoSquare);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load settings from Backend / Supabase Cloud DB
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await SettingsService.getSettings();
        if (data) {
          setSettings((prev) => ({
            ...prev,
            ...data,
          }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, ...data }));
        }
      } catch (err) {
        console.warn('Sử dụng cấu hình từ local cache do chưa kết nối được server:', err);
      }
    };
    fetchSettings();
  }, []);

  // Auto dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleTextChange = (field: keyof SystemSettingsState, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleToggle = (field: keyof SystemSettingsState) => {
    setSettings((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Đồng bộ trực tiếp lên Database Supabase qua API
      await SettingsService.updateSettings(settings);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setToastMessage('Đã lưu cấu hình lên Supabase Database thành công!');
    } catch (err) {
      console.error('Lỗi khi lưu cấu hình lên server:', err);
      // Vẫn lưu vào local cache nếu mạng chập chờn
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setToastMessage('Đã lưu cấu hình cục bộ (chưa đồng bộ server).');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục toàn bộ cài đặt về mặc định ban đầu?')) {
      try {
        setIsSaving(true);
        await SettingsService.updateSettings(DEFAULT_SETTINGS);
        setSettings(DEFAULT_SETTINGS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
        setToastMessage('Đã khôi phục cài đặt về giá trị mặc định trên Database!');
      } catch (err) {
        setSettings(DEFAULT_SETTINGS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
        setToastMessage('Đã khôi phục cài đặt về giá trị mặc định!');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setLogoPreview(reader.result);
          setToastMessage('Đã tải lên logo mới của trung tâm!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="settings-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="settings-toast">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="settings-header">
        <div className="settings-header-text">
          <h1>Cài Đặt Hệ Thống</h1>
          <p>
            Quản lý thông tin trung tâm, thiết lập quy trình tuyển sinh, mẫu số phiếu thu và cấu hình bảo mật.
          </p>
        </div>

        <div className="settings-header-actions">
          <button type="button" className="settings-btn-reset" onClick={handleReset} disabled={isSaving}>
            <RotateCcw size={15} />
            <span>Mặc định</span>
          </button>

          <button type="button" className="settings-btn-save" onClick={handleSave} disabled={isSaving}>
            <Save size={16} />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
          </button>
        </div>
      </div>

      {/* Main Master-Detail Container */}
      <div className="settings-container">
        {/* Navigation Sidebar */}
        <div className="settings-nav-card">
          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <div className="settings-nav-icon">
              <Building2 size={16} />
            </div>
            <div className="settings-nav-info">
              <span className="settings-nav-label">Thông tin Trung tâm</span>
              <span className="settings-nav-sub">Hồ sơ & thương hiệu</span>
            </div>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'academic' ? 'active' : ''}`}
            onClick={() => setActiveTab('academic')}
          >
            <div className="settings-nav-icon">
              <GraduationCap size={16} />
            </div>
            <div className="settings-nav-info">
              <span className="settings-nav-label">Quy trình & Đào tạo</span>
              <span className="settings-nav-sub">SLA Lead & Sĩ số lớp</span>
            </div>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'finance' ? 'active' : ''}`}
            onClick={() => setActiveTab('finance')}
          >
            <div className="settings-nav-icon">
              <CreditCard size={16} />
            </div>
            <div className="settings-nav-info">
              <span className="settings-nav-label">Tài chính & Học phí</span>
              <span className="settings-nav-sub">Phiếu thu & VietQR</span>
            </div>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <div className="settings-nav-icon">
              <Bell size={16} />
            </div>
            <div className="settings-nav-info">
              <span className="settings-nav-label">Thông báo & Tích hợp</span>
              <span className="settings-nav-sub">SMS, Email & Lịch</span>
            </div>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <div className="settings-nav-icon">
              <ShieldCheck size={16} />
            </div>
            <div className="settings-nav-info">
              <span className="settings-nav-label">Bảo mật & Hệ thống</span>
              <span className="settings-nav-sub">Phiên & Supabase DB</span>
            </div>
          </button>
        </div>

        {/* Content Canvas */}
        <div className="settings-content-card">
          {/* TAB 1: THÔNG TIN TRUNG TÂM */}
          {activeTab === 'general' && (
            <>
              <div className="settings-section-header">
                <h2 className="settings-section-title">
                  <Building2 size={20} color="#7c3aed" />
                  Hồ Sơ & Thông Tin Trung Tâm
                </h2>
                <p className="settings-section-desc">
                  Thông tin thương hiệu chính thức sẽ hiển thị trên phiếu thu, email xác nhận và biểu mẫu khảo thí.
                </p>
              </div>

              {/* Logo Upload Box */}
              <div className="settings-logo-container">
                <div className="settings-logo-preview">
                  <img src={logoPreview} alt="Center Logo" />
                </div>
                <div className="settings-logo-actions">
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b' }}>
                    Logo Thương Hiệu Trung Tâm
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Định dạng khuyến nghị PNG, JPG tỷ lệ vuông hoặc 1:1, tối đa 2MB.
                  </span>
                  <label className="settings-logo-btn" style={{ width: 'fit-content' }}>
                    <Upload size={14} />
                    <span>Tải ảnh logo mới</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="settings-form-group">
                  <label className="settings-label">
                    <Building2 size={13} color="#64748b" />
                    Tên trung tâm
                  </label>
                  <input
                    type="text"
                    className="settings-input"
                    value={settings.centerName}
                    onChange={(e) => handleTextChange('centerName', e.target.value)}
                    placeholder="VD: EduFlow English Academy"
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-label">
                    <Sliders size={13} color="#64748b" />
                    Mã định danh cơ sở
                  </label>
                  <input
                    type="text"
                    className="settings-input"
                    value={settings.centerCode}
                    onChange={(e) => handleTextChange('centerCode', e.target.value)}
                    placeholder="VD: EF-HN-01"
                  />
                </div>

                <div className="settings-form-group span-2">
                  <label className="settings-label">Slogan / Tiêu ngữ thương hiệu</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={settings.slogan}
                    onChange={(e) => handleTextChange('slogan', e.target.value)}
                    placeholder="VD: Tiên phong phương pháp đào tạo..."
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-label">
                    <Phone size={13} color="#64748b" />
                    Hotline tư vấn tuyển sinh
                  </label>
                  <input
                    type="text"
                    className="settings-input"
                    value={settings.hotline}
                    onChange={(e) => handleTextChange('hotline', e.target.value)}
                    placeholder="VD: 1900 6868"
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-label">
                    <Mail size={13} color="#64748b" />
                    Email tiếp nhận thông tin
                  </label>
                  <input
                    type="email"
                    className="settings-input"
                    value={settings.email}
                    onChange={(e) => handleTextChange('email', e.target.value)}
                    placeholder="contact@eduflow.edu.vn"
                  />
                </div>

                <div className="settings-form-group span-2">
                  <label className="settings-label">
                    <MapPin size={13} color="#64748b" />
                    Địa chỉ trụ sở chính
                  </label>
                  <input
                    type="text"
                    className="settings-input"
                    value={settings.address}
                    onChange={(e) => handleTextChange('address', e.target.value)}
                    placeholder="Địa chỉ số nhà, tòa nhà, quận huyện..."
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-label">
                    <Globe size={13} color="#64748b" />
                    Website chính thức
                  </label>
                  <input
                    type="url"
                    className="settings-input"
                    value={settings.website}
                    onChange={(e) => handleTextChange('website', e.target.value)}
                    placeholder="https://eduflow.edu.vn"
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-label">
                    <Clock size={13} color="#64748b" />
                    Giờ làm việc & mở cửa
                  </label>
                  <input
                    type="text"
                    className="settings-input"
                    value={settings.workingHours}
                    onChange={(e) => handleTextChange('workingHours', e.target.value)}
                    placeholder="08:00 - 21:30"
                  />
                </div>
              </div>
            </>
          )}

          {/* TAB 2: QUY TRÌNH & ĐÀO TẠO */}
          {activeTab === 'academic' && (
            <>
              <div className="settings-section-header">
                <h2 className="settings-section-title">
                  <GraduationCap size={20} color="#7c3aed" />
                  Quy Trình Vận Hành & Chuẩn Đào Tạo
                </h2>
                <p className="settings-section-desc">
                  Quy định các ngưỡng xử lý Lead, sức chứa lớp học và thang điểm tối thiểu cho học viên.
                </p>
              </div>

              {/* Toggle Cards */}
              <div className="settings-toggle-card">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-title">Tự động phân bổ Lead (Round-Robin)</span>
                  <span className="settings-toggle-sub">
                    Tự động chia đều khách hàng tiềm năng mới cho các tư vấn viên trực ca theo vòng tròn.
                  </span>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={settings.autoAssignLeads}
                    onChange={() => handleToggle('autoAssignLeads')}
                  />
                  <span className="settings-slider"></span>
                </label>
              </div>

              <div className="settings-toggle-card">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-title">Tự động gửi kết quả khảo thí đầu vào</span>
                  <span className="settings-toggle-sub">
                    Gửi email và thông báo cho phụ huynh/học viên ngay khi giám khảo nhập xong điểm test.
                  </span>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={settings.autoSendPlacementResult}
                    onChange={() => handleToggle('autoSendPlacementResult')}
                  />
                  <span className="settings-slider"></span>
                </label>
              </div>

              {/* Class Capacity Slider */}
              <div className="settings-range-box">
                <div className="settings-range-header">
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                    Sức chứa học viên tối đa trong 1 lớp học
                  </span>
                  <span className="settings-range-value">{settings.maxClassCapacity} học viên</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="35"
                  step="1"
                  value={settings.maxClassCapacity}
                  onChange={(e) => handleTextChange('maxClassCapacity', parseInt(e.target.value, 10))}
                  className="settings-range-input"
                />
                <span className="settings-help-text">
                  Hệ thống sẽ gắn cờ cảnh báo khi lớp vượt quá số lượng tối đa này nhằm đảm bảo chất lượng giảng dạy.
                </span>
              </div>

              {/* Threshold inputs */}
              <div className="settings-form-grid">
                <div className="settings-form-group">
                  <label className="settings-label">
                    <Clock size={13} color="#64748b" />
                    SLA Phản hồi Lead mới (Phút)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    className="settings-input"
                    value={settings.slaLeadMinutes}
                    onChange={(e) => handleTextChange('slaLeadMinutes', parseInt(e.target.value, 10))}
                  />
                  <span className="settings-help-text">
                    Thời gian yêu cầu tư vấn viên liên hệ cuộc gọi đầu tiên sau khi Lead vào hệ thống.
                  </span>
                </div>

                <div className="settings-form-group">
                  <label className="settings-label">
                    <Zap size={13} color="#64748b" />
                    Ngưỡng cảnh báo lấp đầy phòng học (%)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    className="settings-input"
                    value={settings.occupancyWarningRate}
                    onChange={(e) => handleTextChange('occupancyWarningRate', parseInt(e.target.value, 10))}
                  />
                  <span className="settings-help-text">
                    Kích hoạt thông báo đổi phòng học lớn hơn khi sĩ số lớp chạm mốc này.
                  </span>
                </div>

                <div className="settings-form-group">
                  <label className="settings-label">Điểm IELTS đầu vào mục tiêu cơ bản</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={settings.ieltsMinScore}
                    onChange={(e) => handleTextChange('ieltsMinScore', e.target.value)}
                    placeholder="VD: 4.5"
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-label">Điểm TOEIC đầu vào mục tiêu cơ bản</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={settings.toeicMinScore}
                    onChange={(e) => handleTextChange('toeicMinScore', e.target.value)}
                    placeholder="VD: 450"
                  />
                </div>
              </div>
            </>
          )}

          {/* TAB 3: TÀI CHÍNH & HỌC PHÍ */}
          {activeTab === 'finance' && (
            <>
              <div className="settings-section-header">
                <h2 className="settings-section-title">
                  <CreditCard size={20} color="#7c3aed" />
                  Cấu Hình Tài Chính & Học Phí
                </h2>
                <p className="settings-section-desc">
                  Thiết lập tài khoản ngân hàng thụ hưởng qua VietQR và cấu hình phát hành phiếu thu học phí.
                </p>
              </div>

              <div className="settings-toggle-card">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-title">Tự động phát hành phiếu thu điện tử</span>
                  <span className="settings-toggle-sub">
                    Tạo mã biên lai thu tiền hợp lệ ngay sau khi lễ tân hoặc kế toán xác nhận đã thu phí.
                  </span>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={settings.autoGenerateReceipt}
                    onChange={() => handleToggle('autoGenerateReceipt')}
                  />
                  <span className="settings-slider"></span>
                </label>
              </div>

              <div className="settings-toggle-card">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-title">Cho phép đóng học phí nhiều đợt (Trả góp)</span>
                  <span className="settings-toggle-sub">
                    Hỗ trợ học viên đóng học phí theo 2-3 đợt trước và sau khi khai giảng khóa học.
                  </span>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={settings.allowPartialPayment}
                    onChange={() => handleToggle('allowPartialPayment')}
                  />
                  <span className="settings-slider"></span>
                </label>
              </div>

              <div className="settings-form-grid">
                <div className="settings-form-group">
                  <label className="settings-label">Đơn vị tiền tệ hạch toán</label>
                  <select
                    className="settings-select"
                    value={settings.currency}
                    onChange={(e) => handleTextChange('currency', e.target.value)}
                  >
                    <option value="VND">Việt Nam Đồng (VNĐ ₫)</option>
                    <option value="USD">Đô la Mỹ (USD $)</option>
                  </select>
                </div>

                <div className="settings-form-group">
                  <label className="settings-label">Tiền tố số phiếu thu</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={settings.receiptPrefix}
                    onChange={(e) => handleTextChange('receiptPrefix', e.target.value)}
                    placeholder="VD: PT-2026"
                  />
                  <span className="settings-help-text">Định dạng mẫu: PT-2026-0001</span>
                </div>

                <div className="settings-form-group">
                  <label className="settings-label">Ngân hàng thụ hưởng (VietQR)</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={settings.bankName}
                    onChange={(e) => handleTextChange('bankName', e.target.value)}
                    placeholder="VD: Ngân hàng MB Bank"
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-label">Số tài khoản ngân hàng</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={settings.bankAccountNumber}
                    onChange={(e) => handleTextChange('bankAccountNumber', e.target.value)}
                    placeholder="VD: 888899996868"
                  />
                </div>

                <div className="settings-form-group span-2">
                  <label className="settings-label">Tên chủ tài khoản thụ hưởng</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={settings.bankAccountHolder}
                    onChange={(e) => handleTextChange('bankAccountHolder', e.target.value)}
                    placeholder="TRUNG TAM ANH NGU EDUFLOW"
                  />
                </div>
              </div>
            </>
          )}

          {/* TAB 4: THÔNG BÁO & TÍCH HỢP */}
          {activeTab === 'notifications' && (
            <>
              <div className="settings-section-header">
                <h2 className="settings-section-title">
                  <Bell size={20} color="#7c3aed" />
                  Kênh Thông Báo & Cổng Dịch Vụ
                </h2>
                <p className="settings-section-desc">
                  Quản lý nhắc lịch thi tự động qua SMS/ZNS và đồng bộ hóa lịch giảng dạy.
                </p>
              </div>

              <div className="settings-toggle-card">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-title">SMS Brandname / Zalo ZNS nhắc lịch thi</span>
                  <span className="settings-toggle-sub">
                    Tự động gửi tin nhắn trước ca thi xếp lớp 24 giờ để tăng tỷ lệ học viên đến dự thi.
                  </span>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={settings.enableSmsPlacementReminder}
                    onChange={() => handleToggle('enableSmsPlacementReminder')}
                  />
                  <span className="settings-slider"></span>
                </label>
              </div>

              <div className="settings-toggle-card">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-title">Email thông báo lịch khai giảng & học phí</span>
                  <span className="settings-toggle-sub">
                    Tự động gửi email hướng dẫn học viên chuẩn bị trước ngày khai giảng 3 ngày.
                  </span>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={settings.enableEmailTuitionReminder}
                    onChange={() => handleToggle('enableEmailTuitionReminder')}
                  />
                  <span className="settings-slider"></span>
                </label>
              </div>

              <div className="settings-toggle-card">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-title">Đồng bộ Google Calendar cho Giảng viên</span>
                  <span className="settings-toggle-sub">
                    Tự động cập nhật ca dạy vào ứng dụng lịch cá nhân của từng giảng viên và trợ giảng.
                  </span>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={settings.enableGoogleCalendarSync}
                    onChange={() => handleToggle('enableGoogleCalendarSync')}
                  />
                  <span className="settings-slider"></span>
                </label>
              </div>

              {/* Service Gateways Status */}
              <div style={{ marginTop: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '12px' }}>
                  Trạng thái kết nối các cổng dịch vụ bên thứ ba:
                </span>
                <div className="settings-status-grid">
                  <div className="settings-status-card">
                    <div className="settings-status-header">
                      <span className="settings-status-label">SMS Gateway (eSMS)</span>
                      <div className="settings-status-dot"></div>
                    </div>
                    <div className="settings-status-val">Sẵn sàng</div>
                    <div className="settings-status-sub">Số dư Brandname: 4,820 tin</div>
                  </div>

                  <div className="settings-status-card">
                    <div className="settings-status-header">
                      <span className="settings-status-label">Email SMTP Server</span>
                      <div className="settings-status-dot"></div>
                    </div>
                    <div className="settings-status-val">Hoạt động</div>
                    <div className="settings-status-sub">smtp.sendgrid.net (SSL)</div>
                  </div>

                  <div className="settings-status-card">
                    <div className="settings-status-header">
                      <span className="settings-status-label">VietQR API</span>
                      <div className="settings-status-dot"></div>
                    </div>
                    <div className="settings-status-val">Đã kết nối</div>
                    <div className="settings-status-sub">Ngân hàng MB Bank</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 5: BẢO MẬT & HỆ THỐNG */}
          {activeTab === 'security' && (
            <>
              <div className="settings-section-header">
                <h2 className="settings-section-title">
                  <ShieldCheck size={20} color="#7c3aed" />
                  Bảo Mật & Cơ Sở Dữ Liệu
                </h2>
                <p className="settings-section-desc">
                  Giám sát trạng thái kết nối Cloud Database, bảo vệ tài khoản và sao lưu dữ liệu.
                </p>
              </div>

              {/* Status Overview Grid */}
              <div className="settings-status-grid">
                <div className="settings-status-card">
                  <div className="settings-status-header">
                    <span className="settings-status-label">Supabase PostgreSQL</span>
                    <div className="settings-status-dot"></div>
                  </div>
                  <div className="settings-status-val">Đang kết nối</div>
                  <div className="settings-status-sub">Cloud Pooler: Port 6543 (SSL)</div>
                </div>

                <div className="settings-status-card">
                  <div className="settings-status-header">
                    <span className="settings-status-label">Độ trễ truy vấn (Latency)</span>
                    <div className="settings-status-dot"></div>
                  </div>
                  <div className="settings-status-val">~85 ms</div>
                  <div className="settings-status-sub">Khu vực: Singapore (ap-southeast-1)</div>
                </div>

                <div className="settings-status-card">
                  <div className="settings-status-header">
                    <span className="settings-status-label">Phiên bản EduFlow</span>
                    <div className="settings-status-dot"></div>
                  </div>
                  <div className="settings-status-val">v2.4.0-prod</div>
                  <div className="settings-status-sub">Môi trường: Production Ready</div>
                </div>
              </div>

              {/* Security Toggles */}
              <div className="settings-toggle-card">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-title">Bắt buộc xác thực hai yếu tố (2FA) cho Quản lý</span>
                  <span className="settings-toggle-sub">
                    Yêu cầu mã OTP qua ứng dụng xác thực đối với các tài khoản vai trò Admin và Center Manager.
                  </span>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={settings.requireTwoFactorForAdmin}
                    onChange={() => handleToggle('requireTwoFactorForAdmin')}
                  />
                  <span className="settings-slider"></span>
                </label>
              </div>

              <div className="settings-toggle-card">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-title">Tự động sao lưu dữ liệu định kỳ (Daily Snapshot)</span>
                  <span className="settings-toggle-sub">
                    Hệ thống tự động sao lưu toàn bộ dữ liệu bảng vào lúc 02:00 AM mỗi ngày lên lưu trữ Cloud.
                  </span>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={settings.autoBackupDaily}
                    onChange={() => handleToggle('autoBackupDaily')}
                  />
                  <span className="settings-slider"></span>
                </label>
              </div>

              {/* Session Timeout */}
              <div className="settings-form-grid">
                <div className="settings-form-group">
                  <label className="settings-label">
                    <Lock size={13} color="#64748b" />
                    Thời gian duy trì phiên làm việc (Session Timeout)
                  </label>
                  <select
                    className="settings-select"
                    value={settings.sessionTimeoutHours}
                    onChange={(e) => handleTextChange('sessionTimeoutHours', parseInt(e.target.value, 10))}
                  >
                    <option value={4}>4 giờ (Khuyến nghị máy công cộng)</option>
                    <option value={8}>8 giờ (Một ca làm việc tiêu chuẩn)</option>
                    <option value={24}>24 giờ (Một ngày)</option>
                    <option value={168}>7 ngày (Thiết bị văn phòng bảo mật)</option>
                  </select>
                </div>

                <div className="settings-form-group">
                  <label className="settings-label">
                    <Server size={13} color="#64748b" />
                    Chế độ nhật ký kiểm toán (Audit Logs)
                  </label>
                  <input
                    type="text"
                    disabled
                    className="settings-input"
                    value="Bật (Ghi nhận toàn bộ thao tác thu chi & điểm)"
                    style={{ background: '#f8fafc', color: '#64748b' }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
