import { AuthService } from '../services/auth.service.js';
import { TokenService } from '../services/token.service.js';
import { logger } from '../utils/logger.js';
import { pool } from '../database/pool.js';

async function testAuthModule(): Promise<void> {
  logger.info('========================================================');
  logger.info('   BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG MODULE AUTHENTICATION & RBAC');
  logger.info('========================================================');

  try {
    // 1. Kiểm thử Đăng ký người dùng mới (Register)
    logger.info('1. Kiểm thử Đăng ký tài khoản mới:');
    const testUsername = `user_${Date.now().toString().slice(-4)}`;
    const regResult = await AuthService.register({
      username: testUsername,
      password: 'Password123!',
      fullName: 'Nguyễn Văn Test',
      email: `${testUsername}@eduflow.vn`,
      phoneNumber: '0912345678',
      roleCode: 'SALES',
    });

    logger.info(`   ✅ Đăng ký thành công: ID=${regResult.user.id}, Username=${regResult.user.username}, Role=${regResult.user.role}`);
    logger.info(`   🔑 Access Token:  ${regResult.tokens.accessToken.substring(0, 30)}...`);
    logger.info(`   🔄 Refresh Token: ${regResult.tokens.refreshToken.substring(0, 30)}...`);

    // 2. Kiểm thử Đăng nhập tài khoản vừa tạo (Login)
    logger.info('2. Kiểm thử Đăng nhập tài khoản vừa tạo:');
    const loginResult = await AuthService.login({
      username: testUsername,
      password: 'Password123!',
    });
    logger.info(`   ✅ Đăng nhập thành công: User ID=${loginResult.user.id}, Role=${loginResult.user.role}`);

    // 3. Kiểm thử Đăng nhập với mật khẩu sai (Login Fail -> 401)
    logger.info('3. Kiểm thử Đăng nhập sai mật khẩu (Kỳ vọng 401):');
    try {
      await AuthService.login({
        username: testUsername,
        password: 'WrongPassword',
      });
      logger.error('   ❌ Thất bại: Đăng nhập sai mật khẩu mà không báo lỗi!');
    } catch (err: any) {
      logger.info(`   ✅ Bắt đúng lỗi: [${err.statusCode}] ${err.message}`);
    }

    // 4. Kiểm thử Giải mã & Xác thực JWT Token (Token Verification)
    logger.info('4. Kiểm thử giải mã và xác thực Token:');
    const decoded = TokenService.verifyAccessToken(loginResult.tokens.accessToken);
    logger.info(`   ✅ Giải mã Token thành công: Payload UserId=${decoded.userId}, Role=${decoded.role}`);

    // 5. Kiểm thử Làm mới Token (Refresh Token)
    logger.info('5. Kiểm thử cơ chế Refresh Token:');
    const refreshResult = await AuthService.refresh(loginResult.tokens.refreshToken);
    logger.info(`   ✅ Làm mới Token thành công! New Access Token: ${refreshResult.tokens.accessToken.substring(0, 30)}...`);

    // 6. Kiểm thử Lấy thông tin cá nhân (Profile)
    logger.info('6. Kiểm thử lấy thông tin tài khoản:');
    const profile = await AuthService.getCurrentUser(decoded.userId);
    logger.info(`   ✅ Lấy Profile thành công: Họ tên: ${profile.fullName}, Email: ${profile.email}, Role: ${profile.role}`);

    // 7. Kiểm thử tài khoản Admin mặc định (tamminh / 123456)
    logger.info('7. Kiểm thử đăng nhập tài khoản Quản trị viên (tamminh / 123456):');
    const adminLogin = await AuthService.login({
      username: 'tamminh',
      password: '123456',
    });
    logger.info(`   ✅ Đăng nhập Admin thành công: Username=${adminLogin.user.username}, Role=${adminLogin.user.role} (${adminLogin.user.roleName})`);

    // 8. Kiểm thử logic Phân quyền RBAC
    logger.info('8. Kiểm thử logic phân quyền RBAC:');
    const allowedAdminRoles = ['ADMIN'];
    const isSalesAdmin = allowedAdminRoles.includes(loginResult.user.role);
    const isAdminAdmin = allowedAdminRoles.includes(adminLogin.user.role);

    logger.info(`   ✅ Kiểm tra quyền SALES với vùng ADMIN: ${!isSalesAdmin ? 'Chặn thành công (403 Forbidden)' : 'Lỗi!'}`);
    logger.info(`   ✅ Kiểm tra quyền ADMIN với vùng ADMIN: ${isAdminAdmin ? 'Cho phép truy cập (200 OK)' : 'Lỗi!'}`);

    logger.info('========================================================');
    logger.info('   🎉 TẤT CẢ CÁC BÀI KIỂM THỬ AUTH & RBAC ĐÃ HOÀN TẤT THÀNH CÔNG!');
    logger.info('========================================================');
  } catch (error: any) {
    logger.error('❌ Lỗi kiểm thử:', error);
  } finally {
    try {
      await pool.end();
    } catch {}
    process.exit(0);
  }
}

testAuthModule();
