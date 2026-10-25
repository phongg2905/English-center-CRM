import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Handle Token Expiration and Refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const triggerLogout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.dispatchEvent(
    new CustomEvent('auth:expired', {
      detail: { message: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.' },
    })
  );
  const publicRoutes = ['/login', '/register', '/forgot-password'];
  if (!publicRoutes.some((route) => window.location.pathname.startsWith(route))) {
    window.location.href = '/login?expired=1';
  }
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!error.response) {
      return Promise.reject(new Error('Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại mạng hoặc server.'));
    }

    // Handle 401 Unauthorized
    if (error.response.status === 401) {
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (originalRequest._retry) {
        triggerLogout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        triggerLogout();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        // Backend response format: data.tokens.accessToken OR data.accessToken
        const newAccessToken =
          response.data?.data?.tokens?.accessToken || response.data?.data?.accessToken;
        const newRefreshToken =
          response.data?.data?.tokens?.refreshToken || response.data?.data?.refreshToken;

        if (newAccessToken) {
          localStorage.setItem('access_token', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }
          apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return apiClient(originalRequest);
        } else {
          throw new Error('Mã access token mới không hợp lệ');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        triggerLogout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
