import { apiClient } from './api';
import type { 
  User, 
  LoginResponseData, 
  ApiResponse, 
  RegisterRequestData, 
  ResetPasswordRequestData, 
  ChangePasswordRequestData 
} from '../types/auth';

export class AuthService {
  /**
   * Đăng nhập hệ thống bằng username hoặc email
   */
  static async login(username: string, password: string): Promise<LoginResponseData> {
    const res = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', {
      username: username.trim(),
      password,
    });
    return res.data.data;
  }

  /**
   * Đăng ký tài khoản nhân sự mới
   */
  static async register(data: RegisterRequestData): Promise<LoginResponseData> {
    const res = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/register', data);
    return res.data.data;
  }

  /**
   * Yêu cầu gửi mã OTP khôi phục mật khẩu qua Email
   */
  static async forgotPassword(email: string): Promise<{ message: string; otp?: string }> {
    const res = await apiClient.post<ApiResponse<{ message: string; otp?: string }>>('/auth/forgot-password', {
      email: email.trim(),
    });
    return res.data.data;
  }

  /**
   * Đặt lại mật khẩu mới bằng mã OTP
   */
  static async resetPassword(data: ResetPasswordRequestData): Promise<{ message: string }> {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/reset-password', data);
    return res.data.data;
  }

  /**
   * Đổi mật khẩu tài khoản cá nhân
   */
  static async changePassword(data: ChangePasswordRequestData): Promise<{ message: string }> {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/change-password', data);
    return res.data.data;
  }

  /**
   * Lấy thông tin tài khoản hiện tại từ Token
   */
  static async getMe(): Promise<User> {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  }

  /**
   * Đăng xuất khỏi hệ thống
   */
  static async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignored
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }

  /**
   * Làm mới Access Token
   */
  static async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    const res = await apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', {
      refreshToken,
    });
    return res.data.data;
  }
}
