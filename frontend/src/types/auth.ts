export type UserRole = 'ADMIN' | 'ACADEMIC' | 'SALES' | 'TEACHER';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  roleName?: string;
  isActive: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: string;
}

export interface LoginResponseData {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterRequestData {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  roleCode?: UserRole;
}

export interface ForgotPasswordRequestData {
  email: string;
}

export interface ResetPasswordRequestData {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ChangePasswordRequestData {
  currentPassword: string;
  newPassword: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}
