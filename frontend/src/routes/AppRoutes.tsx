import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppShell } from '../components/layout';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PlacementTestPage } from '../pages/PlacementTestPage';
import { LeadsPage } from '../pages/LeadsPage';
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
        
        <Route path="leads" element={<LeadsPage />} />

        <Route path="tests" element={<PlacementTestPage />} />

        <Route
          path="classes"
          element={<PlaceholderPage title="Quản lý Lớp học & Thời khóa biểu" />}
        />

        <Route
          path="reports"
          element={<PlaceholderPage title="Báo cáo Doanh thu & Tuyển sinh" />}
        />

        <Route
          path="staff"
          element={<PlaceholderPage title="Đội ngũ Giảng viên & Nhân sự" />}
        />

        <Route
          path="settings"
          element={<PlaceholderPage title="Cài đặt Hệ thống" />}
        />
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
