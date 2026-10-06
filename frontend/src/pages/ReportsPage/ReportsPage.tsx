/**
 * DỰ ÁN: ENGLISH CENTER CRM (EduFlow CRM)
 * MÀN HÌNH: BÁO CÁO & THỐNG KÊ QUẢN TRỊ (UC-04 / TASK [FE-06])
 * TÁC GIẢ: Long Phạm (@longphm11) - Frontend Developer
 */

import React, { useState, useEffect, useTransition } from 'react';
import { AnalyticsService } from '../../services/analytics.service';
import type {
  ExecutiveOverview,
  FunnelData,
  RevenueData,
  SalesConsultant,
  MarketingChannel,
  CapacityData,
  ExportReportType,
} from '../../types/analytics';
import {
  TrendingUp,
  CircleDollarSign,
  GraduationCap,
  Building,
  Award,
  Download,
  RefreshCw,
  Target,
  BarChart3,
  Calendar,
  Layers,
  ChevronDown,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import './ReportsPage.css';

export const ReportsPage: React.FC = () => {
  // Tabs: 'funnel' | 'revenue' | 'leaderboard' | 'channels' | 'occupancy'
  const [activeTab, setActiveTab] = useState<'funnel' | 'revenue' | 'leaderboard' | 'channels' | 'occupancy'>('funnel');

  // Filter States
  const [revenuePeriod, setRevenuePeriod] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'this_quarter' | 'this_year'>('all');
  const [exportOpen, setExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Data States
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<ExecutiveOverview | null>(null);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [leaderboard, setLeaderboard] = useState<SalesConsultant[]>([]);
  const [channels, setChannels] = useState<MarketingChannel[]>([]);
  const [capacity, setCapacity] = useState<CapacityData | null>(null);

  const [, startTransition] = useTransition();

  const getDateRange = (filterType: string): { startDate?: string; endDate?: string } => {
    const now = new Date();
    if (filterType === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      return { startDate: start };
    }
    if (filterType === 'this_quarter') {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), qMonth, 1).toISOString().slice(0, 10);
      return { startDate: start };
    }
    if (filterType === 'this_year') {
      const start = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      return { startDate: start };
    }
    return {};
  };

  const loadAllAnalytics = async () => {
    setLoading(true);
    const range = getDateRange(dateFilter);

    try {
      const [ovData, fnData, rvData, lbData, chData, cpData] = await Promise.all([
        AnalyticsService.getOverview().catch(() => null),
        AnalyticsService.getFunnel(range).catch(() => null),
        AnalyticsService.getRevenue({ ...range, period: revenuePeriod }).catch(() => null),
        AnalyticsService.getLeaderboard(range).catch(() => []),
        AnalyticsService.getChannelROI(range).catch(() => []),
        AnalyticsService.getClassOccupancy().catch(() => null),
      ]);

      startTransition(() => {
        setOverview(ovData);
        setFunnel(fnData);
        setRevenue(rvData);
        setLeaderboard(lbData || []);
        setChannels(chData || []);
        setCapacity(cpData);
      });
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu báo cáo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAnalytics();
  }, [dateFilter, revenuePeriod]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleExport = async (type: ExportReportType) => {
    setIsExporting(true);
    setExportOpen(false);
    try {
      const range = getDateRange(dateFilter);
      await AnalyticsService.exportReport({
        type,
        format: 'csv',
        ...range,
      });
      showToast(`Đã xuất file báo cáo ${type.toUpperCase()} thành công!`);
    } catch (err: any) {
      alert('Không thể xuất file: ' + (err.message || 'Lỗi kết nối'));
    } finally {
      setIsExporting(false);
    }
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="reports-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="reports-toast">
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="reports-header-section">
        <div className="reports-header-text">
          <div className="reports-badge">
            <BarChart3 size={14} />
            <span>Phân hệ Điều hành & Báo cáo [UC-04]</span>
          </div>
          <h1 className="reports-title">Báo Cáo & Thống Kê Tuyển Sinh</h1>
          <p className="reports-subtitle">
            Theo dõi phễu chuyển đổi, doanh thu thực thu, hiệu suất tư vấn viên và tỷ lệ lấp đầy phòng học theo thời gian thực.
          </p>
        </div>

        <div className="reports-actions">
          {/* Date Filter Pills */}
          <div className="reports-date-filter-group">
            <Calendar size={15} className="reports-filter-icon" />
            <button
              className={`date-pill ${dateFilter === 'all' ? 'active' : ''}`}
              onClick={() => setDateFilter('all')}
            >
              Tất cả
            </button>
            <button
              className={`date-pill ${dateFilter === 'this_month' ? 'active' : ''}`}
              onClick={() => setDateFilter('this_month')}
            >
              Tháng này
            </button>
            <button
              className={`date-pill ${dateFilter === 'this_quarter' ? 'active' : ''}`}
              onClick={() => setDateFilter('this_quarter')}
            >
              Quý này
            </button>
            <button
              className={`date-pill ${dateFilter === 'this_year' ? 'active' : ''}`}
              onClick={() => setDateFilter('this_year')}
            >
              Năm nay
            </button>
          </div>

          {/* Refresh Button */}
          <button
            className={`reports-btn secondary ${loading ? 'spinning' : ''}`}
            onClick={loadAllAnalytics}
            title="Làm mới số liệu"
            disabled={loading}
          >
            <RefreshCw size={16} />
          </button>

          {/* Export Dropdown (FR-DASH-05) */}
          <div className="reports-export-dropdown-wrapper">
            <button
              className="reports-btn primary"
              onClick={() => setExportOpen(!exportOpen)}
              disabled={isExporting}
            >
              <Download size={16} />
              <span>{isExporting ? 'Đang xuất file...' : 'Xuất Excel / CSV'}</span>
              <ChevronDown size={14} />
            </button>

            {exportOpen && (
              <div className="reports-export-menu">
                <div className="export-menu-header">Chọn mẫu dữ liệu xuất:</div>
                <button className="export-menu-item" onClick={() => handleExport('leads')}>
                  <FileSpreadsheet size={15} color="#3b82f6" />
                  <div>
                    <div className="item-title">Danh sách Khách hàng (Leads)</div>
                    <div className="item-sub">Toàn bộ pipeline, kênh nguồn và lý do hủy</div>
                  </div>
                </button>
                <button className="export-menu-item" onClick={() => handleExport('revenue')}>
                  <FileSpreadsheet size={15} color="#10b981" />
                  <div>
                    <div className="item-title">Báo cáo Doanh thu (Receipts)</div>
                    <div className="item-sub">Chi tiết biên lai thu, số tiền, ngày thu</div>
                  </div>
                </button>
                <button className="export-menu-item" onClick={() => handleExport('sales-leaderboard')}>
                  <FileSpreadsheet size={15} color="#f59e0b" />
                  <div>
                    <div className="item-title">Bảng xếp hạng Tư vấn viên</div>
                    <div className="item-sub">Số đơn chốt, Win rate % và tổng doanh số</div>
                  </div>
                </button>
                <button className="export-menu-item" onClick={() => handleExport('channel-roi')}>
                  <FileSpreadsheet size={15} color="#8b5cf6" />
                  <div>
                    <div className="item-title">Hiệu quả Kênh Marketing (ROI)</div>
                    <div className="item-sub">Tỷ trọng lead, chuyển đổi và doanh thu kênh</div>
                  </div>
                </button>
                <button className="export-menu-item" onClick={() => handleExport('occupancy')}>
                  <FileSpreadsheet size={15} color="#ec4899" />
                  <div>
                    <div className="item-title">Tỷ lệ Lấp đầy Phòng học</div>
                    <div className="item-sub">Sĩ số tối đa, hiện tại và tỷ lệ lấp đầy</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 Metric Cards (Tremor / Cosmic Sunset Style) */}
      <div className="reports-kpi-grid">
        <div className="reports-kpi-card revenue">
          <div className="kpi-header">
            <span className="kpi-label">Tổng doanh thu thực thu</span>
            <div className="kpi-icon-circle revenue">
              <CircleDollarSign size={20} />
            </div>
          </div>
          <div className="kpi-value">{overview ? formatVND(overview.totalRevenue) : '...'}</div>
          <div className="kpi-footer">
            <span className="kpi-delta positive">
              <TrendingUp size={13} /> {overview?.totalTransactions || 0} giao dịch
            </span>
            <span className="kpi-note">Từ các phiếu thu hợp lệ</span>
          </div>
        </div>

        <div className="reports-kpi-card leads">
          <div className="kpi-header">
            <span className="kpi-label">Tổng số Lead tiếp nhận</span>
            <div className="kpi-icon-circle leads">
              <Target size={20} />
            </div>
          </div>
          <div className="kpi-value">{overview?.totalLeads ?? '...'} Lead</div>
          <div className="kpi-footer">
            <span className="kpi-delta neutral">
              {overview?.newLeadsThisMonth ?? 0} mới tháng này
            </span>
            <span className="kpi-note">Đang trong phễu chăm sóc</span>
          </div>
        </div>

        <div className="reports-kpi-card conversion">
          <div className="kpi-header">
            <span className="kpi-label">Học viên ghi danh nhập học</span>
            <div className="kpi-icon-circle conversion">
              <GraduationCap size={20} />
            </div>
          </div>
          <div className="kpi-value">{overview?.totalEnrolled ?? '...'} Học viên</div>
          <div className="kpi-footer">
            <span className="kpi-delta positive">
              Win Rate: {overview?.conversionRate ?? 0}%
            </span>
            <span className="kpi-note">Tỷ lệ chốt toàn hệ thống</span>
          </div>
        </div>

        <div className="reports-kpi-card capacity">
          <div className="kpi-header">
            <span className="kpi-label">Tỷ lệ lấp đầy phòng học</span>
            <div className="kpi-icon-circle capacity">
              <Building size={20} />
            </div>
          </div>
          <div className="kpi-value">{overview?.averageOccupancyRate ?? '...'}%</div>
          <div className="kpi-footer">
            <span className="kpi-delta neutral">
              {overview?.activeClassesCount ?? 0} lớp đang mở
            </span>
            <span className="kpi-note">Giám sát công suất cơ sở</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="reports-tab-nav">
        <button
          className={`tab-btn ${activeTab === 'funnel' ? 'active' : ''}`}
          onClick={() => setActiveTab('funnel')}
        >
          <Target size={16} />
          <span>Phễu Tuyển Sinh (Funnel)</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setActiveTab('revenue')}
        >
          <CircleDollarSign size={16} />
          <span>Báo Cáo Doanh Thu</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <Award size={16} />
          <span>Xếp Hạng Tư Vấn Viên</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'channels' ? 'active' : ''}`}
          onClick={() => setActiveTab('channels')}
        >
          <Layers size={16} />
          <span>Hiệu Quả Kênh Marketing</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'occupancy' ? 'active' : ''}`}
          onClick={() => setActiveTab('occupancy')}
        >
          <Building size={16} />
          <span>Sĩ Số & Phòng Học</span>
        </button>
      </div>

      {/* TAB CONTENT 1: FUNNEL */}
      {activeTab === 'funnel' && (
        <div className="reports-tab-pane">
          <div className="funnel-layout-grid">
            {/* Left: Interactive Funnel Visualization */}
            <div className="reports-card funnel-card">
              <div className="card-header-row">
                <div>
                  <h3 className="card-title">Phễu Chuyển Đổi Tuyển Sinh 5 Giai Đoạn</h3>
                  <p className="card-desc">Tỷ lệ rớt và chuyển đổi qua các giai đoạn từ Lead đến lúc Nhập học</p>
                </div>
                <div className="funnel-rates-badge">
                  <span>Tỷ lệ chốt tổng: <strong>{funnel?.overallConversionRate}%</strong></span>
                  <span className="divider">•</span>
                  <span>Test ➔ Enrolled: <strong>{funnel?.testToEnrollmentRate}%</strong></span>
                </div>
              </div>

              <div className="funnel-steps-container">
                {funnel?.stages.map((stage, idx) => {
                  const isLost = stage.stage === 'LOST';
                  const stageColors: Record<string, string> = {
                    NEW: '#6366f1',
                    CONTACTING: '#3b82f6',
                    TEST_SCHEDULED: '#f59e0b',
                    ENROLLED: '#10b981',
                    LOST: '#ef4444',
                  };
                  const color = stageColors[stage.stage] || '#6366f1';

                  return (
                    <div key={stage.stage} className={`funnel-step-row ${isLost ? 'lost-row' : ''}`}>
                      <div className="step-info">
                        <div className="step-badge" style={{ backgroundColor: `${color}15`, color }}>
                          #{idx + 1} {stage.stageName}
                        </div>
                        <div className="step-metrics">
                          <span className="step-count">{stage.count} Lead</span>
                          <span className="step-percent">({stage.percentageOfTotal}% tổng số)</span>
                        </div>
                      </div>

                      <div className="step-bar-wrapper">
                        <div
                          className="step-bar"
                          style={{
                            width: `${Math.max(stage.percentageOfTotal, 5)}%`,
                            backgroundColor: color,
                          }}
                        >
                          <span className="bar-label">{stage.percentageOfTotal}%</span>
                        </div>
                      </div>

                      {stage.stage !== 'NEW' && !isLost && (
                        <div className="step-conversion-hint">
                          Từ bước trước: <strong>{stage.conversionFromPrevious}%</strong>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Lost Reasons Breakdown */}
            <div className="reports-card lost-reasons-card">
              <div className="card-header-row">
                <div>
                  <h3 className="card-title">Phân Tích Lý Do Hủy (Lost Reasons)</h3>
                  <p className="card-desc">Nguyên nhân khiến Lead không chuyển đổi thành học viên</p>
                </div>
                <div className="lost-rate-chip">
                  <AlertCircle size={14} />
                  <span>Rơi rụng: {funnel?.dropOffRate}%</span>
                </div>
              </div>

              {funnel && funnel.lostReasons.length > 0 ? (
                <div className="lost-reasons-list">
                  {funnel.lostReasons.map((item, index) => (
                    <div key={index} className="lost-reason-item">
                      <div className="reason-top">
                        <span className="reason-name">{item.reason}</span>
                        <span className="reason-count">{item.count} lượt ({item.percentage}%)</span>
                      </div>
                      <div className="reason-bar-bg">
                        <div className="reason-bar-fill" style={{ width: `${item.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-lost-state">
                  <CheckCircle2 size={36} color="#10b981" />
                  <p>Chưa có Lead nào bị đánh dấu thất bại trong giai đoạn này.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: REVENUE */}
      {activeTab === 'revenue' && (
        <div className="reports-tab-pane">
          {/* Revenue Period Selector & Summary */}
          <div className="reports-card revenue-main-card">
            <div className="card-header-row">
              <div>
                <h3 className="card-title">Diễn Biến Doanh Thu Thực Thu</h3>
                <p className="card-desc">Dữ liệu tổng hợp từ các biên lai thanh toán học phí đã xác nhận</p>
              </div>

              <div className="period-pills-group">
                <button
                  className={`period-btn ${revenuePeriod === 'day' ? 'active' : ''}`}
                  onClick={() => setRevenuePeriod('day')}
                >
                  Theo ngày
                </button>
                <button
                  className={`period-btn ${revenuePeriod === 'week' ? 'active' : ''}`}
                  onClick={() => setRevenuePeriod('week')}
                >
                  Theo tuần
                </button>
                <button
                  className={`period-btn ${revenuePeriod === 'month' ? 'active' : ''}`}
                  onClick={() => setRevenuePeriod('month')}
                >
                  Theo tháng
                </button>
                <button
                  className={`period-btn ${revenuePeriod === 'quarter' ? 'active' : ''}`}
                  onClick={() => setRevenuePeriod('quarter')}
                >
                  Theo quý
                </button>
              </div>
            </div>

            {/* Visual Bar Chart (Tremor Style) */}
            <div className="revenue-chart-container">
              {revenue && revenue.periods.length > 0 ? (
                <div className="revenue-bars-chart">
                  {(() => {
                    const maxRev = Math.max(...revenue.periods.map((p) => p.revenue), 1);
                    return revenue.periods.map((item, idx) => {
                      const heightPercent = Math.max(Math.round((item.revenue / maxRev) * 100), 8);
                      return (
                        <div key={idx} className="chart-bar-column">
                          <div className="bar-tooltip">
                            <div className="tooltip-period">{item.period}</div>
                            <div className="tooltip-amount">{formatVND(item.revenue)}</div>
                            <div className="tooltip-tx">({item.transactionCount} biên lai)</div>
                          </div>
                          <div
                            className="chart-bar-fill"
                            style={{ height: `${heightPercent}%` }}
                          />
                          <span className="chart-bar-label">{item.period}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="empty-chart">Chưa có giao dịch thanh toán trong chu kỳ này</div>
              )}
            </div>

            {/* Bottom Breakdown Grids */}
            <div className="revenue-sub-grid">
              {/* Payment Methods */}
              <div className="sub-box">
                <h4 className="sub-title">Cơ Cấu Phương Thức Thanh Toán</h4>
                <div className="methods-list">
                  {revenue?.byPaymentMethod.map((pm, idx) => (
                    <div key={idx} className="method-item">
                      <div className="method-info">
                        <span className="method-name">{pm.methodName}</span>
                        <span className="method-amount">{formatVND(pm.amount)} ({pm.percentage}%)</span>
                      </div>
                      <div className="method-progress-bg">
                        <div
                          className="method-progress-fill"
                          style={{
                            width: `${pm.percentage}%`,
                            backgroundColor: pm.paymentMethod === 'BANK_TRANSFER' ? '#3b82f6' : '#10b981',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Courses Breakdown */}
              <div className="sub-box">
                <h4 className="sub-title">Doanh Thu Theo Khóa Học</h4>
                <div className="courses-rev-list">
                  {revenue?.byCourse.map((c, idx) => (
                    <div key={idx} className="course-rev-row">
                      <div className="course-tag-col">
                        <span className="course-badge">{c.courseCode}</span>
                        <span className="course-name-text">{c.courseName}</span>
                      </div>
                      <div className="course-stat-col">
                        <span className="c-rev">{formatVND(c.revenue)}</span>
                        <span className="c-students">{c.studentCount} học viên</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: SALES LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="reports-tab-pane">
          <div className="reports-card leaderboard-card">
            <div className="card-header-row">
              <div>
                <h3 className="card-title">Bảng Xếp Hạng Thi Đua Tư Vấn Viên Tuyển Sinh</h3>
                <p className="card-desc">Thống kê số lượng Lead chốt thành công, Win Rate % và tổng doanh thu thu về</p>
              </div>
            </div>

            <div className="leaderboard-table-responsive">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Hạng</th>
                    <th>Tư vấn viên</th>
                    <th>Email</th>
                    <th>Lead phụ trách</th>
                    <th>Chốt (Enrolled)</th>
                    <th>Thất bại (Lost)</th>
                    <th>Tỷ lệ chốt (Win Rate)</th>
                    <th>Doanh số đem về</th>
                    <th>AOV / Học viên</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.length > 0 ? (
                    leaderboard.map((consultant) => {
                      const medal =
                        consultant.rank === 1 ? '🥇' : consultant.rank === 2 ? '🥈' : consultant.rank === 3 ? '🥉' : `#${consultant.rank}`;
                      const isTop1 = consultant.rank === 1;

                      return (
                        <tr key={consultant.consultantId} className={isTop1 ? 'top-performer-row' : ''}>
                          <td className="rank-cell">
                            <span className={`rank-badge rank-${consultant.rank}`}>{medal}</span>
                          </td>
                          <td className="name-cell">
                            <div className="consultant-avatar">
                              {consultant.consultantName.charAt(0)}
                            </div>
                            <span className="consultant-full-name">{consultant.consultantName}</span>
                          </td>
                          <td className="email-cell">{consultant.consultantEmail}</td>
                          <td className="center-cell">{consultant.totalLeadsAssigned}</td>
                          <td className="center-cell highlight-enrolled">{consultant.leadsEnrolled}</td>
                          <td className="center-cell text-muted">{consultant.leadsLost}</td>
                          <td className="center-cell">
                            <span className={`winrate-pill ${consultant.conversionRate >= 20 ? 'high' : 'normal'}`}>
                              {consultant.conversionRate}%
                            </span>
                          </td>
                          <td className="revenue-cell">{formatVND(consultant.totalRevenueGenerated)}</td>
                          <td className="center-cell text-muted">{formatVND(consultant.averageDealValue)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="empty-cell">Chưa có dữ liệu tư vấn viên</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: CHANNELS */}
      {activeTab === 'channels' && (
        <div className="reports-tab-pane">
          <div className="reports-card channels-card">
            <div className="card-header-row">
              <div>
                <h3 className="card-title">Hiệu Quả & ROI Từng Kênh Marketing Tiếp Cận</h3>
                <p className="card-desc">Đánh giá kênh tuyển sinh nào mang lại số lượng Lead và doanh thu cao nhất</p>
              </div>
            </div>

            <div className="channels-grid">
              {channels.map((ch, idx) => (
                <div key={idx} className="channel-box-card">
                  <div className="ch-box-top">
                    <div>
                      <span className="ch-code-pill">{ch.channel}</span>
                      <h4 className="ch-name">{ch.channelName}</h4>
                    </div>
                    <div className="ch-revenue-tag">{formatVND(ch.totalRevenue)}</div>
                  </div>

                  <div className="ch-metrics-row">
                    <div className="ch-stat">
                      <span className="ch-stat-label">Số Lead tiếp nhận</span>
                      <span className="ch-stat-val">{ch.totalLeads} ({ch.percentageOfLeads}%)</span>
                    </div>
                    <div className="ch-stat">
                      <span className="ch-stat-label">Đã nhập học</span>
                      <span className="ch-stat-val success">{ch.enrolledCount} Học viên</span>
                    </div>
                    <div className="ch-stat">
                      <span className="ch-stat-label">Tỷ lệ chốt</span>
                      <span className="ch-stat-val purple">{ch.conversionRate}%</span>
                    </div>
                  </div>

                  <div className="ch-progress-bar">
                    <div className="ch-progress-fill" style={{ width: `${ch.percentageOfLeads}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: OCCUPANCY */}
      {activeTab === 'occupancy' && (
        <div className="reports-tab-pane">
          <div className="reports-card occupancy-card">
            <div className="card-header-row">
              <div>
                <h3 className="card-title">Tỷ Lệ Lấp Đầy Sĩ Số Lớp Học & Phòng Học</h3>
                <p className="card-desc">Giám sát công suất hoạt động tránh tình trạng quá tải hoặc lớp học vắng</p>
              </div>
              <div className="capacity-summary-pill">
                Toàn hệ thống: <strong>{capacity?.totalEnrolled} / {capacity?.totalCapacity}</strong> chỗ ({capacity?.overallOccupancyRate}%)
              </div>
            </div>

            <div className="occupancy-classes-grid">
              {capacity?.classes.map((cls) => {
                const isFull = cls.occupancyRate >= 100 || cls.status === 'FULL';
                const isHigh = cls.occupancyRate >= 70;
                const statusColor = isFull ? 'danger' : isHigh ? 'warning' : 'safe';

                return (
                  <div key={cls.classId} className={`occupancy-box-card ${statusColor}`}>
                    <div className="occ-card-top">
                      <div>
                        <span className="occ-code">{cls.classCode}</span>
                        <h4 className="occ-name">{cls.className}</h4>
                      </div>
                      <span className={`occ-status-chip ${cls.status.toLowerCase()}`}>{cls.status}</span>
                    </div>

                    <div className="occ-course-tag">{cls.courseName} • Phòng: <strong>{cls.room}</strong></div>

                    <div className="occ-progress-section">
                      <div className="occ-counts-row">
                        <span>Đã ghi danh: <strong>{cls.currentEnrolled}</strong> / {cls.maxCapacity}</span>
                        <span className="occ-percent">{cls.occupancyRate}%</span>
                      </div>
                      <div className="occ-progress-track">
                        <div
                          className={`occ-progress-fill ${statusColor}`}
                          style={{ width: `${Math.min(cls.occupancyRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
