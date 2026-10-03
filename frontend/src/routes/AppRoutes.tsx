import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppShell } from '../components/layout';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected Routes inside AppShell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        {/* Index redirects to /dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Core modules */}
        <Route path="dashboard" element={<DashboardPage />} />
        
        <Route
          path="leads"
          element={
            <PlaceholderPage
              title="Quản lý Tuyển sinh & Leads"
              subtitle="Theo dõi phễu học viên tiềm năng, tỷ lệ chuyển đổi và lịch sử tư vấn"
              taskTag="UC-01 ADMISSIONS"
            />
          }
        />

        <Route
          path="tests"
          element={
            <PlaceholderPage
              title="Kiểm tra Đầu vào & Xếp lớp"
              subtitle="Lên lịch thi Cambridge/IELTS, chấm điểm 4 kỹ năng và đề xuất khóa học"
              taskTag="UC-02 PLACEMENT TEST"
            />
          }
        />

        <Route
          path="classes"
          element={
            <PlaceholderPage
              title="Quản lý Lớp học & Thời khóa biểu"
              subtitle="Danh sách lớp đang mở, sĩ số phòng học và lịch dạy của giảng viên"
              taskTag="UC-03 CLASS MANAGEMENT"
            />
          }
        />

        <Route
          path="reports"
          element={
            <PlaceholderPage
              title="Báo cáo Doanh thu & Tuyển sinh"
              subtitle="Biểu đồ trực quan doanh số học phí thực thu theo từng chi nhánh Campus"
              taskTag="UC-04 REVENUE & ANALYTICS"
            />
          }
        />

        <Route
          path="staff"
          element={
            <PlaceholderPage
              title="Đội ngũ Giảng viên & Nhân sự"
              subtitle="Hồ sơ giáo viên bản xứ, trợ giảng và phân bổ chỉ tiêu tư vấn viên"
              taskTag="UC-05 STAFF & TEACHERS"
            />
          }
        />

        <Route
          path="settings"
          element={
            <PlaceholderPage
              title="Cài đặt Hệ thống CRM"
              subtitle="Cấu hình tham số trung tâm, phân quyền RBAC và tích hợp Webhook"
              taskTag="SYSTEM CONFIG"
            />
          }
        />
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
