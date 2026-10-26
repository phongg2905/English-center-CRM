import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/auth';
import {
  hasRequiredRole,
  canPerformAction,
  type ActionPermissionKey,
} from '../../config/rbac.config';

interface AuthorizeProps {
  /** Danh sách vai trò được phép truy cập/hiển thị */
  roles?: (UserRole | string)[];
  /** Mã hành động nghiệp vụ cần kiểm tra từ ACTION_PERMISSIONS */
  action?: ActionPermissionKey;
  /** Thành phần dự phòng hiển thị khi không có quyền (Mặc định: null) */
  fallback?: React.ReactNode;
  /** Nội dung được bảo vệ */
  children: React.ReactNode;
}

/**
 * Component kiểm soát quyền truy cập cấp thành phần (Component-level RBAC Gate)
 * Chỉ render `children` nếu người dùng có vai trò hoặc quyền hành động tương ứng.
 */
export const Authorize: React.FC<AuthorizeProps> = ({
  roles,
  action,
  fallback = null,
  children,
}) => {
  const { user } = useAuth();
  const userRole = user?.role;

  // 1. Kiểm tra theo danh sách vai trò nếu có
  if (roles && roles.length > 0) {
    if (!hasRequiredRole(userRole, roles)) {
      return <>{fallback}</>;
    }
  }

  // 2. Kiểm tra theo hành động nghiệp vụ nếu có
  if (action) {
    if (!canPerformAction(userRole, action)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

/**
 * Custom Hook tiện ích để kiểm tra quyền hạn của người dùng hiện tại
 */
export function useAuthorize() {
  const { user } = useAuth();
  const userRole = user?.role;

  return {
    userRole,
    isAdmin: userRole === 'ADMIN',
    isSales: userRole === 'SALES',
    isAcademic: userRole === 'ACADEMIC',
    isTeacher: userRole === 'TEACHER',

    /** Kiểm tra xem người dùng có ít nhất 1 trong các vai trò truyền vào không */
    hasRole: (roles: (UserRole | string)[] | UserRole | string): boolean => {
      const roleList = Array.isArray(roles) ? roles : [roles];
      return hasRequiredRole(userRole, roleList);
    },

    /** Kiểm tra xem người dùng có được thực hiện một hành động cụ thể không */
    can: (action: ActionPermissionKey): boolean => {
      return canPerformAction(userRole, action);
    },
  };
}
