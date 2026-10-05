import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Badge,
  StatCard,
} from '../../components/ui';
import {
  Kanban,
  FileCheck2,
  Sparkles,
  ArrowRight,
  Plus,
  TrendingUp,
  Award,
  GraduationCap,
} from 'lucide-react';
import '../../App.css';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'scorecard' | 'kanban'>('scorecard');

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
            className={`view-tab-btn ${activeTab === 'scorecard' ? 'active' : ''}`}
            onClick={() => setActiveTab('scorecard')}
          >
            <FileCheck2 size={16} />
            <span>Phiếu Báo Điểm Học Viên</span>
          </button>
          <button
            className="view-tab-btn"
            onClick={() => navigate('/leads')}
            title="Chuyển đến Bảng Kanban Tuyển sinh kết nối dữ liệu thật"
          >
            <Kanban size={16} />
            <span>Phễu Tuyển Sinh (Kanban)</span>
            <ArrowRight size={13} style={{ marginLeft: '4px', opacity: 0.6 }} />
          </button>
        </div>

        <Button
          variant="primary"
          size="sm"
          iconLeft={<Plus size={15} />}
          onClick={() => navigate('/leads')}
        >
          Thêm Lead Mới
        </Button>
      </div>

      {/* ACADEMIC SCORECARD */}
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
            </CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(124, 58, 237, 0.08)',
                  border: '1px solid rgba(124, 58, 237, 0.2)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px',
                  }}
                >
                  <strong style={{ fontSize: '13.5px', color: 'var(--text-heading)' }}>
                    IELTS Master Intensive
                  </strong>
                  <Badge variant="brand">Mục tiêu 7.5+</Badge>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Thời lượng: 48 giờ • Giảng viên bản xứ & Chuyên gia khảo thí
                </p>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.6)',
                  border: 'var(--glass-border-subtle)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Lớp IM-2401 (T2-T4-T6 18:30)</span>
                  <Badge variant="success">Còn 4 chỗ</Badge>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Sĩ số: 16/20 học viên (80% Filled)
                </div>
                <div className="skill-progress-track">
                  <div
                    className="skill-progress-bar"
                    style={{ width: '80%', background: 'linear-gradient(90deg, #10b981, #059669)' }}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};
