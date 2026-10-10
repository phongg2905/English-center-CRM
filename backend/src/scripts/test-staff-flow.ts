/**
 * Script kiểm thử tự động toàn diện phân hệ Quản lý Nhân sự & Phân quyền RBAC (BE-07 / UC-05)
 */
import { StaffService } from '../services/staff.service.js';
import { AuthService } from '../services/auth.service.js';
import { pool } from '../database/pool.js';

async function runStaffTests() {
  console.log('================================================================');
  console.log('  TEST SUITE: PHÂN HỆ QUẢN TRỊ NHÂN SỰ & RBAC (BE-07 / UC-05)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`, detail || '');
      failed++;
    }
  }

  let createdTeacherId: number | null = null;
  const testUsername = `teacher_${Date.now().toString().slice(-4)}`;
  const testEmail = `${testUsername}@eduflow.vn`;
  const testPhone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;

  try {
    // -------------------------------------------------------------
    // TEST 1: Lấy danh sách nhân sự & Phân trang (GET /api/staff)
    // -------------------------------------------------------------
    console.log('📌 1. Kiểm thử Lấy danh sách nhân sự & Phân trang:');
    const staffList = await StaffService.getStaffs({ page: 1, limit: 10 });
    assert(staffList.staffs.length > 0, `Lấy danh sách nhân viên thành công (${staffList.staffs.length} nhân sự)`);
    assert(staffList.pagination.total >= staffList.staffs.length, `Tổng số nhân sự: ${staffList.pagination.total}`);

    // Lọc theo vai trò ADMIN
    const adminList = await StaffService.getStaffs({ roleCode: 'ADMIN' });
    assert(adminList.staffs.every((s) => s.roleCode === 'ADMIN'), 'Lọc chính xác theo vai trò ADMIN');

    // -------------------------------------------------------------
    // TEST 2: Tạo mới tài khoản Giảng viên (POST /api/staff)
    // -------------------------------------------------------------
    console.log('\n📌 2. Kiểm thử Tạo mới tài khoản nhân viên (Admin Only):');
    const createdTeacher = await StaffService.createStaff({
      username: testUsername,
      password: 'Password@123',
      fullName: 'Thầy David Miller',
      email: testEmail,
      phoneNumber: testPhone,
      roleCode: 'TEACHER',
      specialization: 'IELTS 8.5 & Academic Writing',
      isNative: true,
      bio: 'Giảng viên bản ngữ với 8 năm kinh nghiệm giảng dạy luyện thi Cambridge và IELTS.',
    });

    createdTeacherId = createdTeacher.id;
    assert(Boolean(createdTeacherId), `Tạo mới tài khoản Giảng viên thành công (ID: ${createdTeacherId})`);
    assert(createdTeacher.roleCode === 'TEACHER', 'Gán chính xác vai trò TEACHER');
    assert(createdTeacher.is_native === true, 'Cờ giảng viên bản xứ được lưu đúng (is_native = true)');

    // Kiểm tra chặn trùng username
    let duplicateUsernameBlocked = false;
    try {
      await StaffService.createStaff({
        username: testUsername,
        fullName: 'Người khác trùng username',
        email: 'different@eduflow.vn',
        roleCode: 'SALES',
      });
    } catch (err: any) {
      duplicateUsernameBlocked = err.statusCode === 409;
    }
    assert(duplicateUsernameBlocked, 'Chặn thành công lỗi xung đột trùng tên đăng nhập (409 Conflict)');

    // Kiểm tra chặn trùng email
    let duplicateEmailBlocked = false;
    try {
      await StaffService.createStaff({
        username: `diff_${Date.now().toString().slice(-4)}`,
        fullName: 'Người khác trùng email',
        email: testEmail,
        roleCode: 'SALES',
      });
    } catch (err: any) {
      duplicateEmailBlocked = err.statusCode === 409;
    }
    assert(duplicateEmailBlocked, 'Chặn thành công lỗi xung đột trùng địa chỉ email (409 Conflict)');

    // -------------------------------------------------------------
    // TEST 3: Lấy chi tiết nhân sự (GET /api/staff/:id)
    // -------------------------------------------------------------
    console.log('\n📌 3. Kiểm thử Chi tiết nhân sự:');
    const detail = await StaffService.getStaffById(createdTeacherId!);
    assert(detail.username === testUsername, `Lấy chi tiết nhân sự thành công: ${detail.fullName}`);
    assert(detail.specialization === 'IELTS 8.5 & Academic Writing', 'Thông tin chuyên môn khớp dữ liệu tạo');
    assert(Array.isArray(detail.assignedClasses), 'Hỗ trợ trường danh sách lớp học phụ trách');

    // -------------------------------------------------------------
    // TEST 4: Cập nhật thông tin nhân viên (PUT /api/staff/:id)
    // -------------------------------------------------------------
    console.log('\n📌 4. Kiểm thử Cập nhật thông tin nhân viên:');
    const updated = await StaffService.updateStaff(createdTeacherId!, {
      fullName: 'Thầy David Miller (Senior Lecturer)',
      specialization: 'IELTS 9.0 Master Trainer',
      phoneNumber: '0988776655',
      bio: 'Chuyên gia luyện thi IELTS cấp tốc với 10 năm kinh nghiệm quốc tế.',
      isNative: true,
      roleCode: 'ACADEMIC',
    });
    assert(updated.full_name === 'Thầy David Miller (Senior Lecturer)', 'Cập nhật họ và tên thành công');
    assert(updated.specialization === 'IELTS 9.0 Master Trainer', 'Cập nhật chuyên môn giảng dạy thành công');
    assert(updated.phone_number === '0988776655', 'Cập nhật số điện thoại thành công');
    assert(updated.bio === 'Chuyên gia luyện thi IELTS cấp tốc với 10 năm kinh nghiệm quốc tế.', 'Cập nhật tiểu sử (bio) thành công');
    assert(updated.is_native === true, 'Cập nhật cờ quốc tịch (isNative) thành công');
    assert(Boolean(updated.role_id), 'Cập nhật chuyển đổi vai trò hệ thống thành công');

    // Chuyển lại vai trò TEACHER để phục vụ các bài test tiếp theo
    await StaffService.updateStaff(createdTeacherId!, { roleCode: 'TEACHER' });

    // 4.1. Kiểm thử chặn cập nhật trùng Email với tài khoản khác (409 Conflict)
    let dupEmailUpdateBlocked = false;
    try {
      await StaffService.updateStaff(createdTeacherId!, { email: 'tamminh@crm.edu.vn' });
    } catch (err: any) {
      dupEmailUpdateBlocked = err.statusCode === 409;
    }
    assert(dupEmailUpdateBlocked, 'Chặn thành công lỗi trùng email với nhân viên khác khi cập nhật (409 Conflict)');

    // 4.2. Kiểm thử cập nhật với ID không tồn tại (404 Not Found)
    let notFoundUpdateBlocked = false;
    try {
      await StaffService.updateStaff(999999, { fullName: 'Không tồn tại' });
    } catch (err: any) {
      notFoundUpdateBlocked = err.statusCode === 404;
    }
    assert(notFoundUpdateBlocked, 'Bắt đúng lỗi khi cập nhật ID nhân sự không tồn tại (404 Not Found)');

    // 4.3. Kiểm thử cập nhật với vai trò không hợp lệ (400 Bad Request)
    let invalidRoleBlocked = false;
    try {
      await StaffService.updateStaff(createdTeacherId!, { roleCode: 'INVALID_ROLE' as any });
    } catch (err: any) {
      invalidRoleBlocked = err.statusCode === 400;
    }
    assert(invalidRoleBlocked, 'Chặn cập nhật mã vai trò không hợp lệ (400 Bad Request)');

    // -------------------------------------------------------------
    // TEST 5: Khóa & Vô hiệu hóa tài khoản (PATCH /api/staff/:id/status)
    // -------------------------------------------------------------
    console.log('\n📌 5. Kiểm thử Khóa / Kích hoạt tài khoản nhân viên:');
    const adminUserId = 1; // ID của tamminh (Admin)

    // Khóa tài khoản nhân viên vừa tạo
    const deactivated = await StaffService.updateStaffStatus(createdTeacherId!, adminUserId, false);
    assert(deactivated.is_active === false, 'Vô hiệu hóa / khóa tài khoản thành công (is_active = false)');

    // Kiểm thử đăng nhập tài khoản vừa bị khóa -> Phải ném lỗi 403 Forbidden
    let loginBlocked = false;
    try {
      await AuthService.login({
        username: testUsername,
        password: 'Password@123',
      });
    } catch (err: any) {
      loginBlocked = err.statusCode === 403;
    }
    assert(loginBlocked, 'Hệ thống chặn đăng nhập tài khoản bị khóa thành công (403 Forbidden)');

    // Kiểm tra an toàn: Chặn Admin tự khóa chính mình
    let selfLockBlocked = false;
    try {
      await StaffService.updateStaffStatus(adminUserId, adminUserId, false);
    } catch (err: any) {
      selfLockBlocked = err.statusCode === 400;
    }
    assert(selfLockBlocked, 'Chặn thành công hành vi Quản trị viên tự khóa tài khoản của chính mình (400 Bad Request)');

    // Kích hoạt lại tài khoản
    const reactivated = await StaffService.updateStaffStatus(createdTeacherId!, adminUserId, true);
    assert(reactivated.is_active === true, 'Kích hoạt lại tài khoản thành công (is_active = true)');

    // -------------------------------------------------------------
    // TEST 6: Đặt lại mật khẩu nhân viên (POST /api/staff/:id/reset-password)
    // -------------------------------------------------------------
    console.log('\n📌 6. Kiểm thử Đặt lại mật khẩu nhân viên:');
    const resetResult = await StaffService.resetPassword(createdTeacherId!, adminUserId, 'NewPassword@2026');
    assert(Boolean(resetResult.temporaryPassword), `Admin đặt lại mật khẩu thành công: ${resetResult.temporaryPassword}`);

    // Đăng nhập thử với mật khẩu mới
    const loginWithNewPass = await AuthService.login({
      username: testUsername,
      password: 'NewPassword@2026',
    });
    assert(Boolean(loginWithNewPass.tokens.accessToken), 'Đăng nhập thành công với mật khẩu mới cấp lại');

    // -------------------------------------------------------------
    // TEST 7: Quản lý Đội ngũ Giảng viên (GET /api/staff/teachers)
    // -------------------------------------------------------------
    console.log('\n📌 7. Kiểm thử Lấy danh sách Đội ngũ Giảng viên:');
    const teachers = await StaffService.getTeachers();
    assert(teachers.length > 0, `Lấy danh sách giảng viên thành công (${teachers.length} giảng viên)`);
    const foundTeacher = teachers.find((t) => t.id === createdTeacherId);
    assert(Boolean(foundTeacher), 'Giảng viên vừa tạo hiển thị chính xác trong danh sách Giảng viên');

    // -------------------------------------------------------------
    // TEST 8: Xóa tài khoản nhân viên (DELETE /api/staff/:id)
    // -------------------------------------------------------------
    console.log('\n📌 8. Kiểm thử Xóa tài khoản nhân sự:');
    // Chặn Admin tự xóa chính mình
    let selfDeleteBlocked = false;
    try {
      await StaffService.deleteStaff(adminUserId, adminUserId);
    } catch (err: any) {
      selfDeleteBlocked = err.statusCode === 400;
    }
    assert(selfDeleteBlocked, 'Chặn thành công hành vi Quản trị viên tự xóa chính mình (400 Bad Request)');

    // Xóa tài khoản giáo viên thử nghiệm
    const deleteResult = await StaffService.deleteStaff(createdTeacherId!, adminUserId);
    assert(Boolean(deleteResult.message), 'Xóa tài khoản nhân sự thử nghiệm thành công');

    // Xác nhận đã xóa khỏi CSDL
    let notFoundAfterDelete = false;
    try {
      await StaffService.getStaffById(createdTeacherId!);
    } catch (err: any) {
      notFoundAfterDelete = err.statusCode === 404;
    }
    assert(notFoundAfterDelete, 'Xác nhận tài khoản đã được dọn dẹp khỏi CSDL (404 Not Found)');

  } catch (error: any) {
    console.error('❌ Lỗi ngoại lệ trong quá trình kiểm thử:', error);
    failed++;
  } finally {
    await pool.end();
  }

  console.log('\n================================================================');
  console.log(`🎉 TỔNG KẾT KIỂM THỬ: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStaffTests();
