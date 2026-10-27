import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { EduFlowLogo } from '../components/common/EduFlowLogo';
import { hasRequiredRole } from '../config/rbac.config';
import type { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: (UserRole | string)[];
  moduleName?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  moduleName,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          background: 'var(--color-canvas)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: '#ffffff',
            border: '1px solid rgba(124, 58, 237, 0.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px -2px rgba(124, 58, 237, 0.22)',
            animation: 'pulse 1.5s infinite ease-in-out',
          }}
        >
          <EduFlowLogo size={46} variant="square" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="btn-spinner"
            style={{
              width: '16px',
              height: '16px',
              borderColor: 'rgba(124, 58, 237, 0.3)',
              borderTopColor: 'var(--color-primary-royal)',
            }}
          />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Đang tải phiên làm việc EduFlow CRM...
          </span>
        </div>
      </div>
    );
  }

  // 1. Chưa đăng nhập -> Chuyển về màn hình đăng nhập
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Đã đăng nhập nhưng không có vai trò phù hợp -> Chuyển về màn hình 403 Forbidden toàn màn hình
  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasRequiredRole(user?.role, allowedRoles)) {
      return (
        <Navigate
          to="/403"
          state={{
            requiredRoles: allowedRoles as string[],
            moduleName,
            from: location.pathname,
          }}
          replace
        />
      );
    }
  }

  return children ? <>{children}</> : <Outlet />;
};
