export type RoleCode = 'ADMIN' | 'SALES' | 'ACADEMIC';

export interface Role {
  id: number;
  roleCode: RoleCode;
  roleName: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: number;
  username: string;
  passwordHash: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  roleId: number;
  avatarUrl?: string;
  isActive: boolean;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithRole extends Omit<User, 'passwordHash'> {
  role: RoleCode;
  roleName: string;
}

export interface TokenPayload {
  userId: number;
  username: string;
  email: string;
  role: RoleCode;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

export interface RegisterDto {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  roleCode?: RoleCode; // Mặc định là SALES nếu không truyền
}

export interface LoginDto {
  username: string; // Cho phép đăng nhập bằng username hoặc email
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

// Mở rộng interface Request của Express để chứa user đã giải mã từ JWT
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
