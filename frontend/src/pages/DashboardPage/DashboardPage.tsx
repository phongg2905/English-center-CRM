import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardSubtitle,
  CardBody,
  Badge,
  Input,
  StatCard,
} from '../../components/ui';
import {
  Kanban,
  FileCheck2,
  Component,
  Phone,
  Calendar,
  Sparkles,
  ArrowRight,
  X,
  Plus,
  TrendingUp,
  Award,
  Layers,
  GraduationCap,
} from 'lucide-react';
import '../../App.css';

interface LeadItem {
  id: string;
  name: string;
  phone: string;
  target: string;
  priority: 'high' | 'medium';
  source: string;
  lastContact: string;
  counselor: string;
}

export const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kanban' | 'scorecard' | 'components'>('kanban');
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [btnLoading, setBtnLoading] = useState(false);

  // Khóa cuộn nền đằng sau khi mở ngăn kéo chi tiết Lead
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

  // Sample data for Kanban columns with rich admissions pipeline colors
  const kanbanColumns = [
    {
      id: 'new',
      title: 'Mới tiếp nhận',
      count: 3,
      color: '#2563eb', // Ocean Blue
      bgColor: 'rgba(37, 99, 235, 0.1)',
      borderColor: '#3b82f6',
      dotGlow: 'rgba(37, 99, 235, 0.6)',
      leads: [
        { id: 'LD-101', name: 'Nguyễn Thúy Hằng', phone: '0982345671', target: 'IELTS 6.5', priority: 'high', source: 'Facebook Ads', lastContact: '15 phút trước', counselor: 'Trần Sales' },
        { id: 'LD-102', name: 'Trần Văn Nam', phone: '0971234562', target: 'IELTS 7.0', priority: 'medium', source: 'Google Search', lastContact: '1 giờ trước', counselor: 'Trần Sales' },
        { id: 'LD-103', name: 'Lê Hoàng Long', phone: '0912345673', target: 'IELTS 7.5', priority: 'high', source: 'Referral', lastContact: '2 giờ trước', counselor: 'Trần Sales' },
      ] as LeadItem[],
    },
    {
      id: 'consulting',
      title: 'Đang tư vấn',
      count: 2,
      color: '#d97706', // Warm Amber / Orange
      bgColor: 'rgba(217, 119, 6, 0.1)',
      borderColor: '#f59e0b',
      dotGlow: 'rgba(217, 119, 6, 0.6)',
      leads: [
        { id: 'LD-104', name: 'Phạm Quỳnh Nga', phone: '0963456784', target: 'IELTS 6.5', priority: 'medium', source: 'Tiktok Video', lastContact: 'Hôm qua', counselor: 'Trần Sales' },
        { id: 'LD-105', name: 'Hoàng Minh Quân', phone: '0934567895', target: 'IELTS 8.0', priority: 'high', source: 'Facebook Ads', lastContact: 'Hôm qua', counselor: 'Trần Sales' },
      ] as LeadItem[],
    },
    {
      id: 'test_scheduled',
      title: 'Đã hẹn lịch Test',
      count: 2,
      color: '#7c3aed', // Royal Violet / Purple
      bgColor: 'rgba(124, 58, 237, 0.1)',
      borderColor: '#8b5cf6',
      dotGlow: 'rgba(124, 58, 237, 0.6)',
      leads: [
        { id: 'LD-106', name: 'Vũ Thảo Vy', phone: '0945678906', target: 'IELTS 7.0', priority: 'high', source: 'Direct Walk-in', lastContact: '3 ngày trước', counselor: 'Trần Sales' },
        { id: 'LD-107', name: 'Đặng Quốc Huy', phone: '0923456787', target: 'IELTS 6.5', priority: 'medium', source: 'Google Search', lastContact: '3 ngày trước', counselor: 'Trần Sales' },
      ] as LeadItem[],
    },
    {
      id: 'payment_pending',
      title: 'Chờ đóng học phí',
      count: 2,
      color: '#db2777', // Vibrant Pink / Rose
      bgColor: 'rgba(219, 39, 119, 0.1)',
      borderColor: '#ec4899',
      dotGlow: 'rgba(219, 39, 119, 0.6)',
      leads: [
        { id: 'LD-108', name: 'Bùi Gia Linh', phone: '0919876548', target: 'IELTS 7.5', priority: 'high', source: 'Referral', lastContact: '4 ngày trước', counselor: 'Trần Sales' },
        { id: 'LD-109', name: 'Ngô Đức Thắng', phone: '0988776655', target: 'IELTS 7.0', priority: 'medium', source: 'Facebook Ads', lastContact: '5 ngày trước', counselor: 'Trần Sales' },
      ] as LeadItem[],
    },
    {
      id: 'enrolled',
      title: 'Đã nhập học',
      count: 1,
      color: '#059669', // Emerald Green
      bgColor: 'rgba(5, 150, 105, 0.1)',
      borderColor: '#10b981',
      dotGlow: 'rgba(5, 150, 105, 0.6)',
      leads: [
        { id: 'LD-110', name: 'Đỗ Hải Đăng', phone: '0977665544', target: 'IELTS 7.5', priority: 'medium', source: 'Referral', lastContact: 'Tuần trước', counselor: 'Trần Sales' },
      ] as LeadItem[],
    },
  ];

  const handleTestLoading = () => {
    setBtnLoading(true);
    setTimeout(() => setBtnLoading(false), 1500);
  };

  return (
    <div className="dashboard-page">
      {/* KPI Row (Tremor Style) */}
      <div className="metrics-grid">
        <StatCard
          title="Tổng số Lead đang chăm sóc"
          value="342"
          delta={{ value: '+14.2%', isPositive: true }}
          icon={<TrendingUp size={18} />}
          color="#7c3aed"
          sparklineData={[180, 210, 240, 220, 270, 310, 342]}
        />
        <StatCard
          title="Tỷ lệ qua Placement Test"
          value="78.4%"
          delta={{ value: '+3.8%', isPositive: true }}
          icon={<Award size={18} />}
          color="#ec4899"
          sparklineData={[65, 70, 68, 72, 75, 74, 78.4]}
        />
        <StatCard
          title="Học viên nhập học tháng này"
          value="86"
          delta={{ value: '+12.5%', isPositive: true }}
          icon={<GraduationCap size={18} />}
          color="#3b82f6"
          sparklineData={[40, 52, 60, 58, 71, 80, 86]}
        />
        <StatCard
          title="Doanh thu học phí tích lũy"
          value="$48,200"
          delta={{ value: '+18.4%', isPositive: true }}
          icon={<Sparkles size={18} />}
          color="#10b981"
          sparklineData={[28000, 32000, 35000, 39000, 42000, 45000, 48200]}
        />
      </div>

      {/* View Switcher Tabs */}
      <div className="view-tabs-container">
        <div className="view-tabs">
          <button
            className={`view-tab-btn ${activeTab === 'kanban' ? 'active' : ''}`}
            onClick={() => setActiveTab('kanban')}
          >
            <Kanban size={16} />
            <span>Phễu Tuyển Sinh Kanban (UC-01)</span>
          </button>
          <button
            className={`view-tab-btn ${activeTab === 'scorecard' ? 'active' : ''}`}
            onClick={() => setActiveTab('scorecard')}
          >
            <FileCheck2 size={16} />
            <span>Phiếu Báo Điểm Placement Test (UC-02)</span>
          </button>
          <button
            className={`view-tab-btn ${activeTab === 'components' ? 'active' : ''}`}
            onClick={() => setActiveTab('components')}
          >
            <Component size={16} />
            <span>Thư Viện Atomic Components (FE-01)</span>
          </button>
        </div>

        <Button
          variant="primary"
          size="sm"
          iconLeft={<Plus size={15} />}
          onClick={() => alert('Thêm học viên mới (Mở Modal tạo Lead)')}
        >
          Thêm Lead Mới
        </Button>
      </div>

      {/* TAB 1: KANBAN ADMISSIONS PIPELINE */}
      {activeTab === 'kanban' && (
        <div className="kanban-board-container">
          {kanbanColumns.map((col) => (
            <div 
              key={col.id} 
              className="kanban-column"
              style={{
                borderTop: `3.5px solid ${col.borderColor}`,
              }}
            >
              <div 
                className="kanban-column-header"
                style={{
                  background: `linear-gradient(180deg, ${col.bgColor} 0%, rgba(255, 255, 255, 0.45) 100%)`,
                }}
              >
                <div className="kanban-column-title">
                  <span 
                    className="column-status-dot" 
                    style={{ 
                      background: col.color,
                      boxShadow: `0 0 10px ${col.dotGlow}` 
                    }} 
                  />
                  <span style={{ color: col.color }}>{col.title}</span>
                </div>
                <span 
                  className="column-count-badge"
                  style={{
                    color: col.color,
                    backgroundColor: col.bgColor,
                    border: `1px solid ${col.borderColor}40`,
                  }}
                >
                  {col.count}
                </span>
              </div>

              <div className="kanban-card-list">
                {col.leads.map((lead) => (
                  <Card
                    key={lead.id}
                    variant="interactive"
                    className="lead-card"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <div className="lead-card-header">
                      <div className="lead-student-info">
                        <div className="lead-avatar-sm">
                          {lead.name.split(' ').pop()?.[0] || 'H'}
                        </div>
                        <span className="lead-student-name">{lead.name}</span>
                      </div>
                      <Badge variant={lead.priority === 'high' ? 'danger' : 'warning'}>
                        {lead.priority === 'high' ? 'Gấp' : 'Thường'}
                      </Badge>
                    </div>

                    <div className="lead-tags">
                      <Badge variant="brand">{lead.target}</Badge>
                      <Badge variant="neutral">{lead.source}</Badge>
                    </div>

                    <div className="lead-card-footer">
                      <span>Liên hệ: {lead.lastContact}</span>
                      <span>{lead.counselor}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: ACADEMIC SCORECARD (UC-02) */}
      {activeTab === 'scorecard' && (
        <div className="scorecard-container">
          <Card variant="elevated" className="academic-scorecard">
            <div className="scorecard-badge-top">
              <Award size={16} />
              <span>CHỨNG NHẬN ĐÁNH GIÁ NĂNG LỰC ĐẦU VÀO CAMBRIDGE</span>
            </div>

            <div className="overall-band-label">OVERALL BAND SCORE</div>
            <div className="overall-band-number">7.0</div>
            <Badge variant="success" dot>
              Đủ điều kiện nhập học lớp chuyên sâu
            </Badge>

            <div className="skills-grid">
              <div className="skill-score-card">
                <div className="skill-header">
                  <span className="skill-name">Listening (Nghe)</span>
                  <span className="skill-val">7.5 / 9.0</span>
                </div>
                <div className="skill-progress-track">
                  <div className="skill-progress-bar" style={{ width: '83%' }} />
                </div>
              </div>

              <div className="skill-score-card">
                <div className="skill-header">
                  <span className="skill-name">Reading (Đọc)</span>
                  <span className="skill-val">7.0 / 9.0</span>
                </div>
                <div className="skill-progress-track">
                  <div className="skill-progress-bar" style={{ width: '77%' }} />
                </div>
              </div>

              <div className="skill-score-card">
                <div className="skill-header">
                  <span className="skill-name">Writing (Viết)</span>
                  <span className="skill-val">6.5 / 9.0</span>
                </div>
                <div className="skill-progress-track">
                  <div className="skill-progress-bar" style={{ width: '72%' }} />
                </div>
              </div>

              <div className="skill-score-card">
                <div className="skill-header">
                  <span className="skill-name">Speaking (Nói)</span>
                  <span className="skill-val">7.0 / 9.0</span>
                </div>
                <div className="skill-progress-track">
                  <div className="skill-progress-bar" style={{ width: '77%' }} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '28px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Button variant="primary" iconRight={<ArrowRight size={16} />}>
                Xếp Vào Lớp IELTS Master Intensive
              </Button>
              <Button variant="glass">Tải Phiếu Điểm PDF</Button>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Khóa Học & Lớp Học Phù Hợp</CardTitle>
              <CardSubtitle>Gợi ý tự động theo phổ điểm</CardSubtitle>
            </CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '13.5px', color: 'var(--text-heading)' }}>IELTS Master Intensive</strong>
                  <Badge variant="brand">Mục tiêu 7.5+</Badge>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Thời lượng: 48 giờ • Giảng viên bản xứ & Chuyên gia khảo thí</p>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.6)', border: 'var(--glass-border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Lớp IM-2401 (T2-T4-T6 18:30)</span>
                  <Badge variant="success">Còn 4 chỗ</Badge>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>Sĩ số: 16/20 học viên (80% Filled)</div>
                <div className="skill-progress-track">
                  <div className="skill-progress-bar" style={{ width: '80%', background: 'linear-gradient(90deg, #10b981, #059669)' }} />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* TAB 3: ATOMIC COMPONENTS PLAYGROUND */}
      {activeTab === 'components' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card>
            <CardHeader>
              <CardTitle>1. Thư Viện Nút Bấm (Button Variants)</CardTitle>
              <CardSubtitle>Chuẩn hiệu ứng Vision Liquid Glass & Cosmic Sunset Gradient</CardSubtitle>
            </CardHeader>
            <CardBody style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
              <Button variant="primary" iconLeft={<Sparkles size={16} />}>
                Primary Gradient
              </Button>
              <Button variant="glass" iconLeft={<Layers size={16} />}>
                Vision Liquid Glass
              </Button>
              <Button variant="outline">Secondary Outline</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Action</Button>
              <Button variant="primary" isLoading={btnLoading} onClick={handleTestLoading}>
                {btnLoading ? 'Đang Xử Lý...' : 'Bấm Thử Hiệu Ứng Loading'}
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Huy Hiệu Trạng Thái (Badge & Pills)</CardTitle>
              <CardSubtitle>Phân loại mức độ ưu tiên và tiến trình tuyển sinh</CardSubtitle>
            </CardHeader>
            <CardBody style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              <Badge variant="brand" dot>Cosmic Sunset Pill</Badge>
              <Badge variant="success" dot>Đã Nhập Học (Success)</Badge>
              <Badge variant="warning" dot>Đang Tư Vấn (Warning)</Badge>
              <Badge variant="danger" dot>Ưu Tiên Cao (Danger)</Badge>
              <Badge variant="info" dot>Đã Hẹn Test (Info)</Badge>
              <Badge variant="neutral">Mặc Định (Neutral)</Badge>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Ô Nhập Liệu Kính Mờ (Input Controls)</CardTitle>
              <CardSubtitle>Bắt nét viền phát quang và kiểm soát thông báo lỗi</CardSubtitle>
            </CardHeader>
            <CardBody style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
              <Input
                label="Họ và tên học viên"
                placeholder="Nhập họ và tên..."
                defaultValue="Nguyễn Thúy Hằng"
              />
              <Input
                label="Số điện thoại liên hệ"
                placeholder="09xx..."
                leftIcon={<Phone size={15} />}
                defaultValue="0982345671"
              />
              <Input
                label="Ngày sinh"
                placeholder="DD/MM/YYYY"
                leftIcon={<Calendar size={15} />}
                defaultValue="15/08/2005"
              />
              <Input
                label="Email học viên (Kiểm thử báo lỗi)"
                defaultValue="email_chua_dung_dinh_dang"
                error="Vui lòng nhập đúng định dạng địa chỉ email (ví dụ: student@gmail.com)"
              />
            </CardBody>
          </Card>
        </div>
      )}

      {/* SLIDE-OVER DRAWER (TWENTY CRM STYLE - PORTAL TO ROOT BODY) */}
      {selectedLead && createPortal(
        <div className="drawer-backdrop" onClick={() => setSelectedLead(null)}>
          <div className="slide-over-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-heading)' }}>
                  Hồ Sơ Tuyển Sinh: {selectedLead.name}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mã Lead: {selectedLead.id}</span>
              </div>
              <button
                className="header-icon-btn"
                onClick={() => setSelectedLead(null)}
                aria-label="Đóng ngăn kéo"
              >
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body">
              {/* Primary Student Info Card */}
              <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.75)', border: 'var(--glass-border-subtle)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Mục tiêu chứng chỉ:</span>
                  <Badge variant="brand">{selectedLead.target}</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Số điện thoại:</span>
                  <strong style={{ fontSize: '13px', color: 'var(--color-primary-royal)' }}>{selectedLead.phone}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Nguồn tiếp cận:</span>
                  <Badge variant="neutral">{selectedLead.source}</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Chuyên viên tư vấn:</span>
                  <strong style={{ fontSize: '13px' }}>{selectedLead.counselor}</strong>
                </div>
              </div>

              {/* Consultation Notes Section */}
              <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.5)', border: 'var(--glass-border-subtle)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-heading)' }}>
                  Ghi chú tư vấn tuyển sinh
                </h4>
                <p style={{ fontSize: '12.5px', color: 'var(--text-body)', lineHeight: '1.6' }}>
                  Học viên hiện đang là sinh viên năm 3, cần đạt chứng chỉ IELTS trước tháng 12/2026. Trình độ đầu vào ước tính band 4.5 - 5.0, mong muốn lớp học ca tối thứ 2-4-6.
                </p>
              </div>

              {/* Contact History Timeline */}
              <div>
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-heading)' }}>
                  Dòng Thời Gian Chăm Sóc (Contact History)
                </h4>
                <div className="drawer-timeline">
                  <div className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-time">15 phút trước • Tư vấn viên {selectedLead.counselor}</div>
                    <div className="timeline-desc">Gọi điện trao đổi nguyện vọng thi và đề xuất tham gia bài test xếp lớp đầu vào.</div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-time">Hôm qua 16:30 • Hệ thống Webhook</div>
                    <div className="timeline-desc">Tiếp nhận thông tin đăng ký tư vấn từ chiến dịch quảng cáo {selectedLead.source}.</div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-time">Hôm qua 14:00 • Phân bổ tự động (Round-Robin)</div>
                    <div className="timeline-desc">Lead được tự động chuyển giao và gán cho tư vấn viên {selectedLead.counselor}.</div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-time">3 ngày trước • Form Website</div>
                    <div className="timeline-desc">Khách hàng để lại thông tin quan tâm khóa học tại Landing Page trung tâm.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pinned Action Buttons Footer */}
            <div className="drawer-footer">
              <Button variant="primary" iconLeft={<Calendar size={16} />}>
                Lên Lịch Thi Placement Test
              </Button>
              <Button variant="glass" iconLeft={<Phone size={16} />}>
                Gọi Điện Tư Vấn Ngay
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
