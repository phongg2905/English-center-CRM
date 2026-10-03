import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository.js';
import { TokenService } from './token.service.js';
import { RegisterDto, LoginDto, UserWithRole, AuthTokens } from '../types/auth.types.js';
import { AppError } from '../utils/AppError.js';

export interface AuthResult {
  user: UserWithRole;
  tokens: AuthTokens;
}

export class AuthService {
  /**
   * Đăng ký tài khoản người dùng mới
   */
  static async register(dto: RegisterDto): Promise<AuthResult> {
    // 1. Kiểm tra đầu vào hợp lệ
    if (!dto.username || dto.username.trim().length < 3) {
      throw AppError.badRequest('Tên đăng nhập phải chứa tối thiểu 3 ký tự');
    }
    if (!dto.password || dto.password.length < 6) {
      throw AppError.badRequest('Mật khẩu phải chứa tối thiểu 6 ký tự');
    }
    if (!dto.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
      throw AppError.badRequest('Địa chỉ Email không đúng định dạng');
    }

    // 2. Kiểm tra xem username hoặc email đã tồn tại chưa
    const existingUser = await UserRepository.findByUsernameOrEmail(dto.username);
    if (existingUser) {
      throw AppError.conflict('Tên đăng nhập này đã được sử dụng');
    }

    const existingEmail = await UserRepository.findByUsernameOrEmail(dto.email);
    if (existingEmail) {
      throw AppError.conflict('Địa chỉ Email này đã được đăng ký');
    }

    // 3. Tìm vai trò tương ứng (mặc định là SALES nếu không chỉ định)
    const targetRoleCode = dto.roleCode || 'SALES';
    const role = await UserRepository.findRoleByCode(targetRoleCode);
    if (!role) {
      throw AppError.badRequest(`Vai trò '${targetRoleCode}' không tồn tại trong hệ thống`);
    }

    // 4. Băm mật khẩu an toàn với thuật toán bcrypt (cost factor = 10)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // 5. Lưu người dùng vào CSDL
    const newUser = await UserRepository.create({
      username: dto.username.trim(),
      passwordHash,
      fullName: dto.fullName || dto.username,
      email: dto.email.trim().toLowerCase(),
      phoneNumber: dto.phoneNumber?.trim(),
      roleId: role.id,
    });

    // 6. Phát hành cặp JWT Tokens
    const tokens = TokenService.generateTokens({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    });

    return { user: newUser, tokens };
  }

  /**
   * Đăng nhập hệ thống (bằng username hoặc email)
   */
  static async login(dto: LoginDto): Promise<AuthResult> {
    if (!dto.username || !dto.password) {
      throw AppError.badRequest('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
    }

    // 1. Tìm kiếm người dùng
    const user = await UserRepository.findByUsernameOrEmail(dto.username.trim());
    if (!user) {
      throw AppError.unauthorized('Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    // 2. Kiểm tra mật khẩu băm
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw AppError.unauthorized('Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    // 3. Kiểm tra trạng thái hoạt động của tài khoản
    if (!user.isActive) {
      throw AppError.forbidden('Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ Quản trị viên');
    }

    // 4. Phát hành cặp JWT Tokens
    const tokens = TokenService.generateTokens({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.roleCode,
    });

    const userProfile: UserWithRole = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      roleId: user.roleId,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      role: user.roleCode,
      roleName: user.roleName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return { user: userProfile, tokens };
  }

  /**
   * Cấp lại Access Token mới bằng Refresh Token
   */
  static async refresh(refreshToken: string): Promise<AuthResult> {
    if (!refreshToken) {
      throw AppError.badRequest('Vui lòng cung cấp Refresh Token');
    }

    // 1. Xác thực Refresh Token
    const payload = TokenService.verifyRefreshToken(refreshToken);

    // 2. Kiểm tra người dùng còn tồn tại và đang hoạt động không
    const user = await UserRepository.findById(payload.userId);
    if (!user) {
      throw AppError.unauthorized('Người dùng không còn tồn tại trên hệ thống');
    }

    if (!user.isActive) {
      throw AppError.forbidden('Tài khoản của bạn đã bị khóa');
    }

    // 3. Cấp phát bộ token mới
    const tokens = TokenService.generateTokens({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    return { user, tokens };
  }

  /**
   * Lấy thông tin cá nhân hiện tại từ Token
   */
  static async getCurrentUser(userId: number): Promise<UserWithRole> {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw AppError.notFound('Không tìm thấy thông tin tài khoản');
    }
    return user;
  }
}
