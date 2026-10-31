import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/auth';
import { AuthService } from '../services/auth.service';
import { dataCache } from '../utils/dataCache';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isValidUser = (u: unknown): u is User => {
  return Boolean(
    u &&
      typeof u === 'object' &&
      'id' in u &&
      'username' in u &&
      'role' in u &&
      typeof (u as User).username === 'string'
  );
};

const isJwtExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return true;
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Listen for global auth:expired event from Axios interceptor
  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  // 2. Initial Auth verification
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (!isValidUser(parsedUser)) {
            throw new Error('Invalid stored user');
          }
          setUser(parsedUser);
          const freshUser = await AuthService.getMe();
          if (!isValidUser(freshUser)) {
            throw new Error('Invalid user profile response');
          }
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } catch {
          // Token invalid or expired
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // 3. Periodic heartbeat & tab focus checker for token expiration
  useEffect(() => {
    const checkTokenExpiration = async () => {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      if (user && (!accessToken || !refreshToken)) {
        setUser(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=1';
        }
        return;
      }

      if (accessToken && isJwtExpired(accessToken)) {
        if (refreshToken && isJwtExpired(refreshToken)) {
          // Both access & refresh tokens expired -> auto logout
          setUser(null);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login?expired=1';
          }
        } else {
          // Access token expired, attempt seamless refresh via getMe()
          try {
            const freshUser = await AuthService.getMe();
            if (isValidUser(freshUser)) {
              setUser(freshUser);
              localStorage.setItem('user', JSON.stringify(freshUser));
            }
          } catch {
            // Handled in interceptor
          }
        }
      }
    };

    const interval = setInterval(checkTokenExpiration, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkTokenExpiration();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const login = async (username: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const result = await AuthService.login(username, password);
      if (!result || !result.tokens?.accessToken || !isValidUser(result.user)) {
        throw new Error('Không nhận được phản hồi xác thực hợp lệ từ máy chủ.');
      }
      localStorage.setItem('access_token', result.tokens.accessToken);
      localStorage.setItem('refresh_token', result.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(result.user));
      dataCache.clearAll();
      setUser(result.user);
      return result.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await AuthService.logout();
      dataCache.clearAll();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: isValidUser(user),
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
