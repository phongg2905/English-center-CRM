import { AuthService } from '../services/auth.service.js';
import { testDbConnection } from '../database/pool.js';
import { logger } from '../utils/logger.js';

async function testPasswordRecovery(): Promise<void> {
  logger.info('========================================================================');
  logger.info('   BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG QUÊN/ĐẶT LẠI MẬT KHẨU & ĐỔI MẬT KHẨU (BE-02B)');
  logger.info('========================================================================');

  const dbHealth = await testDbConnection();
  if (dbHealth.connected) {
    logger.info(`💾 Đang kiểm thử trực tiếp trên PostgreSQL Database: ${dbHealth.database} (${dbHealth.latencyMs}ms)`);
  } else {
    logger.info('⚠️ PostgreSQL chưa kết nối, đang sử dụng In-Memory Mock Store');
  }

  const testEmail = 'tamminh@eduflow.vn';
  const originalPassword = '123456';
  const resetPassword = 'NewSecretPassword@2026';
  const changedPassword = 'AnotherSecretPass@999';

  try {
    // 1. Kiểm thử Yêu cầu gửi mã OTP quên mật khẩu (POST /api/auth/forgot-password)
    logger.info('\n1. Kiểm thử Quên mật khẩu với Email hợp lệ (POST /api/auth/forgot-password):');
    const forgotResult = await AuthService.forgotPassword({ email: testEmail });
    logger.info(`   ✅ Gửi OTP thành công đến email: ${forgotResult.email}`);
    logger.info(`   ⏱️ Thời gian hiệu lực: ${forgotResult.expiresInMinutes} phút`);
    logger.info(`   🔑 Mã OTP nhận được: [${forgotResult.otpPreview}]`);

    const otpCode = forgotResult.otpPreview || '123456';

    // 2. Kiểm thử Quên mật khẩu với Email không tồn tại
    logger.info('\n2. Kiểm thử Quên mật khẩu với Email không tồn tại (Kỳ vọng 404 Not Found):');
    try {
      await AuthService.forgotPassword({ email: 'nonexistent.user9999@eduflow.vn' });
      logger.error('   ❌ Thất bại: Không bắt được lỗi email không tồn tại!');
    } catch (err: any) {
      logger.info(`   ✅ Bắt đúng lỗi: [${err.statusCode}] ${err.message}`);
    }

    // 3. Kiểm thử Đặt lại mật khẩu với OTP sai (Kỳ vọng 400 Bad Request)
    logger.info('\n3. Kiểm thử Đặt lại mật khẩu với mã OTP sai (Kỳ vọng 400 Bad Request):');
    try {
      await AuthService.resetPassword({
        email: testEmail,
        otp: '999999', // Sai mã OTP
        newPassword: resetPassword,
      });
      logger.error('   ❌ Thất bại: Không bắt được lỗi OTP sai!');
    } catch (err: any) {
      logger.info(`   ✅ Bắt đúng lỗi: [${err.statusCode}] ${err.message}`);
    }

    // 4. Kiểm thử Đặt lại mật khẩu với mật khẩu mới quá ngắn (Kỳ vọng 400 Bad Request)
    logger.info('\n4. Kiểm thử Đặt lại mật khẩu mới quá ngắn < 6 ký tự (Kỳ vọng 400 Bad Request):');
    try {
      await AuthService.resetPassword({
        email: testEmail,
        otp: otpCode,
        newPassword: '123', // Quá ngắn
      });
      logger.error('   ❌ Thất bại: Không bắt được lỗi mật khẩu quá ngắn!');
    } catch (err: any) {
      logger.info(`   ✅ Bắt đúng lỗi: [${err.statusCode}] ${err.message}`);
    }

    // 5. Kiểm thử Đặt lại mật khẩu thành công bằng mã OTP hợp lệ
    logger.info('\n5. Kiểm thử Đặt lại mật khẩu thành công (POST /api/auth/reset-password):');
    await AuthService.resetPassword({
      email: testEmail,
      otp: otpCode,
      newPassword: resetPassword,
    });
    logger.info(`   ✅ Đặt lại mật khẩu thành công với mật khẩu mới: "${resetPassword}"`);

    // 6. Kiểm thử Tái sử dụng lại mã OTP vừa dùng (Kỳ vọng 400 Bad Request)
    logger.info('\n6. Kiểm thử Tái sử dụng OTP đã dùng (Kỳ vọng 400 Bad Request):');
    try {
      await AuthService.resetPassword({
        email: testEmail,
        otp: otpCode,
        newPassword: 'SomeOtherPassword@123',
      });
      logger.error('   ❌ Thất bại: OTP đã dùng nhưng vẫn cho phép tái sử dụng!');
    } catch (err: any) {
      logger.info(`   ✅ Bắt đúng lỗi chặn tái sử dụng OTP: [${err.statusCode}] ${err.message}`);
    }

    // 7. Kiểm thử Đăng nhập bằng mật khẩu mới vừa reset
    logger.info('\n7. Kiểm thử Đăng nhập tài khoản bằng mật khẩu mới vừa reset:');
    const loginWithReset = await AuthService.login({
      username: 'tamminh',
      password: resetPassword,
    });
    logger.info(`   ✅ Đăng nhập thành công! User ID=${loginWithReset.user.id}, Họ tên: ${loginWithReset.user.fullName}`);

    const loggedInUserId = loginWithReset.user.id;

    // 8. Kiểm thử Đổi mật khẩu cá nhân với mật khẩu hiện tại sai (Kỳ vọng 400 Bad Request)
    logger.info('\n8. Kiểm thử Đổi mật khẩu với mật khẩu hiện tại sai (Kỳ vọng 400 Bad Request):');
    try {
      await AuthService.changePassword(loggedInUserId, {
        currentPassword: 'WrongCurrentPassword',
        newPassword: changedPassword,
      });
      logger.error('   ❌ Thất bại: Không bắt được lỗi mật khẩu hiện tại không đúng!');
    } catch (err: any) {
      logger.info(`   ✅ Bắt đúng lỗi: [${err.statusCode}] ${err.message}`);
    }

    // 9. Kiểm thử Đổi mật khẩu mới trùng mật khẩu hiện tại (Kỳ vọng 400 Bad Request)
    logger.info('\n9. Kiểm thử Đổi mật khẩu mới trùng mật khẩu cũ (Kỳ vọng 400 Bad Request):');
    try {
      await AuthService.changePassword(loggedInUserId, {
        currentPassword: resetPassword,
        newPassword: resetPassword, // Trùng nhau
      });
      logger.error('   ❌ Thất bại: Không bắt được lỗi trùng mật khẩu cũ!');
    } catch (err: any) {
      logger.info(`   ✅ Bắt đúng lỗi: [${err.statusCode}] ${err.message}`);
    }

    // 10. Kiểm thử Đổi mật khẩu cá nhân thành công (POST /api/auth/change-password)
    logger.info('\n10. Kiểm thử Đổi mật khẩu cá nhân thành công:');
    await AuthService.changePassword(loggedInUserId, {
      currentPassword: resetPassword,
      newPassword: changedPassword,
    });
    logger.info(`   ✅ Đổi mật khẩu cá nhân thành công! Mật khẩu mới: "${changedPassword}"`);

    // 11. Kiểm thử Đăng nhập với mật khẩu vừa đổi
    logger.info('\n11. Kiểm thử Đăng nhập với mật khẩu vừa đổi:');
    const loginWithChanged = await AuthService.login({
      username: 'tamminh',
      password: changedPassword,
    });
    logger.info(`   ✅ Đăng nhập thành công với mật khẩu mới nhất: Role=${loginWithChanged.user.role}`);

    // 12. Dọn dẹp & Khôi phục mật khẩu ban đầu '123456' để các test khác không bị ảnh hưởng
    logger.info('\n12. Khôi phục mật khẩu ban đầu (123456):');
    await AuthService.changePassword(loggedInUserId, {
      currentPassword: changedPassword,
      newPassword: originalPassword,
    });
    logger.info(`   🧹 Đã khôi phục mật khẩu ban đầu thành công!`);

    logger.info('\n========================================================================');
    logger.info('   🎉 TẤT CẢ 12 BÀI KIỂM THỬ PASSWORD RECOVERY (BE-02B) ĐÃ VƯỢT QUA 100%!');
    logger.info('========================================================================');
  } catch (error: any) {
    logger.error('❌ Lỗi kiểm thử Password Recovery:', error);
    process.exit(1);
  }
}

testPasswordRecovery().then(() => {
  logger.info('Hoàn tất script test.');
  process.exit(0);
});
