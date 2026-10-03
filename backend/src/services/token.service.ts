import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { env } from '../config/environment.js';
import { TokenPayload, AuthTokens, UserWithRole } from '../types/auth.types.js';
import { AppError } from '../utils/AppError.js';

export class TokenService {
  /**
   * Tạo bộ cặp Access Token và Refresh Token
   */
  static generateTokens(user: { id: number; username: string; email: string; role: string }): AuthTokens {
    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role as any,
    };

    const accessSignOptions: SignOptions = {
      expiresIn: env.jwt.expiresIn as any,
    };

    const refreshSignOptions: SignOptions = {
      expiresIn: env.jwt.refreshExpiresIn as any,
    };

    const accessToken = jwt.sign(payload, env.jwt.secret as Secret, accessSignOptions);
    const refreshToken = jwt.sign(payload, env.jwt.refreshSecret as Secret, refreshSignOptions);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: env.jwt.expiresIn,
    };
  }

  /**
   * Xác thực và giải mã Access Token
   */
  static verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, env.jwt.secret as Secret) as TokenPayload;
      return decoded;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Phiên đăng nhập đã hết hạn, vui lòng làm mới token hoặc đăng nhập lại', 401);
      }
      throw new AppError('Mã Access Token không hợp lệ', 401);
    }
  }

  /**
   * Xác thực và giải mã Refresh Token
   */
  static verifyRefreshToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, env.jwt.refreshSecret as Secret) as TokenPayload;
      return decoded;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Phiên Refresh Token đã hết hạn, vui lòng đăng nhập lại', 401);
      }
      throw new AppError('Mã Refresh Token không hợp lệ', 401);
    }
  }
}
