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
import { ClassesPage } from '../pages/ClassesPage';
import { StudentsPage } from '../pages/StudentsPage';
import { StaffPage } from '../pages/StaffPage';
import { ReportsPage } from '../pages/ReportsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { AccessDeniedPage } from '../pages/AccessDeniedPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProfilePage } from '../pages/ProfilePage';
import { ROUTE_PERMISSIONS } from '../config/rbac.config';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/403" element={<AccessDeniedPage />} />
      <Route path="/404" element={<NotFoundPage />} />

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

        {/* 1. Tổng quan điều hành (All Authenticated Staff) */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute
              allowedRoles={ROUTE_PERMISSIONS.dashboard}
              moduleName="Tổng quan"
            >
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* 2. Tuyển sinh & Leads (ADMIN, SALES, ACADEMIC) */}
        <Route
          path="leads"
          element={
            <ProtectedRoute
              allowedRoles={ROUTE_PERMISSIONS.leads}
              moduleName="Tuyển sinh & Leads"
            >
              <LeadsPage />
            </ProtectedRoute>
          }
        />

        {/* 3. Khảo thí & Placement Test (ADMIN, SALES, ACADEMIC, TEACHER) */}
        <Route
          path="tests"
          element={
            <ProtectedRoute
              allowedRoles={ROUTE_PERMISSIONS.tests}
              moduleName="Khảo thí & Lịch thi"
            >
              <PlacementTestPage />
            </ProtectedRoute>
          }
        />

        {/* 4. Học viên & Ghi danh (ADMIN, SALES, ACADEMIC, TEACHER) */}
        <Route
          path="students"
          element={
            <ProtectedRoute
              allowedRoles={ROUTE_PERMISSIONS.students}
              moduleName="Học viên & Ghi danh"
            >
              <StudentsPage />
            </ProtectedRoute>
          }
        />

        {/* 5. Quản lý Lớp học & Khóa học (ADMIN, SALES, ACADEMIC, TEACHER) */}
        <Route
          path="classes"
          element={
            <ProtectedRoute
              allowedRoles={ROUTE_PERMISSIONS.classes}
              moduleName="Quản lý Lớp học"
            >
              <ClassesPage />
            </ProtectedRoute>
          }
        />

        {/* 6. Báo cáo & Thống kê doanh thu (ADMIN, SALES, ACADEMIC) */}
        <Route
          path="reports"
          element={
            <ProtectedRoute
              allowedRoles={ROUTE_PERMISSIONS.reports}
              moduleName="Báo cáo & Thống kê"
            >
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* 7. Nhân sự & Giảng viên (ADMIN Only) */}
        <Route
          path="staff"
          element={
            <ProtectedRoute
              allowedRoles={ROUTE_PERMISSIONS.staff}
              moduleName="Quản lý Nhân sự"
            >
              <StaffPage />
            </ProtectedRoute>
          }
        />

        {/* 8. Cài đặt hệ thống (ADMIN Only) */}
        <Route
          path="settings"
          element={
            <ProtectedRoute
              allowedRoles={ROUTE_PERMISSIONS.settings}
              moduleName="Cài đặt hệ thống"
            >
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* 9. Hồ sơ cá nhân người dùng (All Authenticated Staff) */}
        <Route
          path="profile"
          element={
            <ProtectedRoute
              allowedRoles={ROUTE_PERMISSIONS.profile}
              moduleName="Hồ sơ cá nhân"
            >
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all route -> Dedicated 404 Not Found Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
