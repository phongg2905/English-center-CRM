/**
 * DỰ ÁN: HỆ THỐNG QUẢN LÝ TUYỂN SINH & ĐÀO TẠO TRUNG TÂM NGOẠI NGỮ (EduFlow CRM)
 * MÃ TÀI LIỆU / TASK: [TEST-01] Kịch bản Kiểm thử Tích hợp (Integration Testing) & E2E Flow
 * TÁC GIẢ: Long Phạm (@longphm11) - QA / Backend Lead
 *
 * MÔ TẢ:
 * Script kiểm thử tích hợp tự động toàn diện (End-to-End Integration Test Suite) chạy trực tiếp
 * qua tầng HTTP RESTful API (Express App + JWT Middleware + RBAC + Controllers + Services + PostgreSQL):
 *   1. Kiểm thử Luồng khép kín (End-to-End Flow):
 *      Tiếp nhận Lead (UC-01) -> Tư vấn & Hẹn thi (UC-02) -> Điểm danh & Nhập điểm 4 kỹ năng + Gợi ý khóa học (UC-SYS-03)
 *      -> Mở lớp & Xếp lớp sinh mã STU-xxx + Chuyển Lead sang ENROLLED (UC-03) -> Thu học phí & Cấp biên lai REC-xxx.
 *   2. Kiểm thử Bảo mật Phân quyền RBAC:
 *      - Tư vấn viên (SALES) không xem được báo cáo doanh thu tài chính (GET /api/analytics/revenue -> 403 Forbidden)
 *      - Giáo vụ (ACADEMIC) không xóa được lớp học (DELETE /api/classes/:id -> 403 Forbidden)
 *      - Tư vấn viên (SALES) không được chấm điểm bài thi đầu vào (POST /api/placement-tests/:id/score -> 403 Forbidden)
 *      - Giáo vụ (ACADEMIC) không được tạo mới Lead tuyển sinh (POST /api/leads -> 403 Forbidden)
 *      - SALES & ACADEMIC không được truy cập quản trị nhân sự (GET /api/staff -> 403 Forbidden)
 *   3. Kiểm thử Ràng buộc Toàn vẹn Dữ liệu (Data Integrity & Business Rules):
 *      - Chống trùng số điện thoại Lead (BR-01 -> 409 Conflict)
 *      - Bắt buộc nhập lý do khi chuyển Lead sang LOST (BR-02 -> 400 Bad Request)
 *      - Chống đặt trùng lịch thi Placement Test cho cùng một Lead (BR-03 -> 409 Conflict)
 *      - Khóa sĩ số tự động khi lớp đạt tối đa 15/15 học viên, chặn học viên thứ 16 (BR-04 / UC-SYS-02 -> 409 Conflict)
 */

import { Server } from 'http';
import { AddressInfo } from 'net';
import { app } from '../app.js';
import { pool, testDbConnection } from '../database/pool.js';
import { ClassRepository } from '../repositories/class.repository.js';

interface TestCaseRecord {
  id: string;
  module: string;
  description: string;
  expected: string;
  actual: string;
  status: 'PASS' | 'FAIL';
}

const results: TestCaseRecord[] = [];
let passedCount = 0;
let failedCount = 0;

function recordAssertion(
  id: string,
  module: string,
  description: string,
  condition: boolean,
  expected: string,
  actual: string
): void {
  const status = condition ? 'PASS' : 'FAIL';
  results.push({ id, module, description, expected, actual, status });
  if (condition) {
    passedCount++;
    console.log(`  ✅ [${id}] [PASS] ${description}`);
    console.log(`       ↳ Expected: ${expected} | Actual: ${actual}`);
  } else {
    failedCount++;
    console.error(`  ❌ [${id}] [FAIL] ${description}`);
    console.error(`       ↳ Expected: ${expected} | Actual: ${actual}`);
  }
}

async function apiRequest(
  baseUrl: string,
  method: string,
  path: string,
  token?: string,
  body?: unknown
): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { status: response.status, data };
}

async function loginHelper(baseUrl: string, username: string): Promise<{ token: string; user: any }> {
  let res = await apiRequest(baseUrl, 'POST', '/api/auth/login', undefined, {
    username,
    password: 'Password@123',
  });
  if (res.status !== 200) {
    res = await apiRequest(baseUrl, 'POST', '/api/auth/login', undefined, {
      username,
      password: '123456',
    });
  }
  const accessToken = res.data?.data?.tokens?.accessToken || res.data?.data?.accessToken;
  if (res.status !== 200 || !accessToken) {
    throw new Error(`Không thể đăng nhập tài khoản ${username}: HTTP ${res.status}`);
  }
  return {
    token: accessToken,
    user: res.data.data.user,
  };
}

async function runIntegrationTestSuite(): Promise<void> {
  console.log('========================================================================================');
  console.log('  🚀 [TEST-01] KỊCH BẢN KIỂM THỬ TÍCH HỢP HỆ THỐNG (E2E, RBAC & DATA INTEGRITY SUITE)');
  console.log('========================================================================================\n');

  const dbHealth = await testDbConnection();
  console.log(
    `💾 Trạng thái CSDL: ${
      dbHealth.connected
        ? `PostgreSQL Connected (${dbHealth.database} - ${dbHealth.latencyMs}ms)`
        : 'In-Memory Fallback Store'
    }\n`
  );

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  // Các ID tạo ra trong quá trình test để dọn dẹp cuối phiên
  let createdLeadId: number | null = null;
  let secondLeadId: number | null = null;
  let createdTestId: number | null = null;
  let createdCourseId: number | null = null;
  let createdClassId: number | null = null;
  let createdEnrollmentId: number | null = null;
  let createdStudentId: number | null = null;

  try {
    // =========================================================================
    // PHẦN 1: XÁC THỰC JWT & PHIÊN ĐĂNG NHẬP ĐA VAI TRÒ (UC-05)
    // =========================================================================
    console.log('📌 PHẦN 1: KIỂM THỬ XÁC THỰC JWT & ĐĂNG NHẬP ĐA VAI TRÒ (UC-05)');

    const unauthRes = await apiRequest(baseUrl, 'GET', '/api/leads');
    recordAssertion(
      'TC-AUTH-01',
      'UC-05 (Auth)',
      'Chặn truy cập API bảo vệ khi không đính kèm JWT Bearer Token',
      unauthRes.status === 401,
      'HTTP 401 Unauthorized',
      `HTTP ${unauthRes.status} (${unauthRes.data?.message || ''})`
    );

    const salesAuth = await loginHelper(baseUrl, 'longpham');
    const academicAuth = await loginHelper(baseUrl, 'phongpham');
    const adminAuth = await loginHelper(baseUrl, 'tamminh');

    recordAssertion(
      'TC-AUTH-02',
      'UC-05 (Auth)',
      'Đăng nhập thành công 3 vai trò: SALES (longpham), ACADEMIC (phongpham), ADMIN (tamminh)',
      salesAuth.user.role === 'SALES' &&
        academicAuth.user.role === 'ACADEMIC' &&
        adminAuth.user.role === 'ADMIN',
      'Roles = [SALES, ACADEMIC, ADMIN]',
      `Roles = [${salesAuth.user.role}, ${academicAuth.user.role}, ${adminAuth.user.role}]`
    );

    // =========================================================================
    // PHẦN 2: KIỂM THỬ LUỒNG KHÉP KÍN END-TO-END (LEAD -> TEST -> SCORE -> ENROLL -> PAYMENT)
    // =========================================================================
    console.log('\n📌 PHẦN 2: KIỂM THỬ LUỒNG NGHIỆP VỤ KHÉP KÍN (END-TO-END CLOSED-LOOP WORKFLOW)');

    const uniqueSuffix = Date.now().toString().slice(-6);
    const e2ePhone = `0987${uniqueSuffix}`;
    const e2eEmail = `e2e.student.${uniqueSuffix}@crm.edu.vn`;

    // Bước 2.1: Tư vấn viên tiếp nhận Lead mới (UC-01)
    const createLeadRes = await apiRequest(baseUrl, 'POST', '/api/leads', salesAuth.token, {
      fullName: 'Nguyễn Hoàng Tích Hợp (E2E)',
      phoneNumber: e2ePhone,
      email: e2eEmail,
      interest: 'IELTS',
      sourceChannel: 'FB_ADS',
      notes: 'Học viên đăng ký qua chiến dịch Facebook Ads tháng 10, mục tiêu IELTS 6.5',
    });
    const leadData = createLeadRes.data?.data;
    createdLeadId = leadData?.id || null;

    recordAssertion(
      'TC-E2E-01',
      'UC-01 (Lead)',
      'Bước 1: Tiếp nhận Lead mới vào phễu tuyển sinh (POST /api/leads)',
      createLeadRes.status === 201 && leadData?.pipelineStage === 'NEW' && leadData?.phoneNumber === e2ePhone,
      'HTTP 201 Created, pipelineStage = NEW',
      `HTTP ${createLeadRes.status}, Lead ID = ${createdLeadId}, pipelineStage = ${leadData?.pipelineStage}`
    );

    // Bước 2.2: Tư vấn viên ghi nhật ký cuộc gọi -> Lead tự động chuyển sang CONTACTING (UC-01)
    const consultRes = await apiRequest(
      baseUrl,
      'POST',
      `/api/leads/${createdLeadId}/consultations`,
      salesAuth.token,
      {
        interactionType: 'PHONE_CALL',
        potentialLevel: 'HOT',
        content: 'Đã gọi tư vấn lộ trình IELTS, học viên đồng ý đặt lịch thi đầu vào cuối tuần.',
      }
    );
    const leadAfterConsultRes = await apiRequest(baseUrl, 'GET', `/api/leads/${createdLeadId}`, salesAuth.token);
    const stageAfterConsult = leadAfterConsultRes.data?.data?.pipelineStage;

    recordAssertion(
      'TC-E2E-02',
      'UC-01 (Lead)',
      'Bước 2: Ghi nhật ký tư vấn & Tự động chuyển trạng thái Lead từ NEW -> CONTACTING',
      consultRes.status === 201 && stageAfterConsult === 'CONTACTING',
      'HTTP 201 Created, Lead pipelineStage = CONTACTING',
      `HTTP ${consultRes.status}, Lead pipelineStage = ${stageAfterConsult}`
    );

    // Bước 2.3: Đặt lịch thi xếp lớp Placement Test -> Lead tự động chuyển sang TEST_SCHEDULED (UC-02)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const testDateStr = futureDate.toISOString().split('T')[0];

    const bookTestRes = await apiRequest(baseUrl, 'POST', '/api/placement-tests/book', salesAuth.token, {
      leadId: createdLeadId,
      testDate: testDateStr,
      timeSlot: '09:00 - 10:30',
      room: 'Phòng Lab E2E-101',
      testType: 'IELTS',
      notes: 'Ca thi sáng thứ Bảy (4 kỹ năng)',
    });
    const testData = bookTestRes.data?.data;
    createdTestId = testData?.id || null;

    const leadAfterBookRes = await apiRequest(baseUrl, 'GET', `/api/leads/${createdLeadId}`, salesAuth.token);
    const stageAfterBook = leadAfterBookRes.data?.data?.pipelineStage;

    recordAssertion(
      'TC-E2E-03',
      'UC-02 (Placement Test)',
      'Bước 3: Đặt lịch thi Placement Test & Đồng bộ trạng thái Lead sang TEST_SCHEDULED',
      bookTestRes.status === 201 &&
        testData?.attendanceStatus === 'SCHEDULED' &&
        stageAfterBook === 'TEST_SCHEDULED',
      'HTTP 201 Created, attendanceStatus = SCHEDULED, Lead pipelineStage = TEST_SCHEDULED',
      `HTTP ${bookTestRes.status}, Test ID = ${createdTestId}, attendance = ${testData?.attendanceStatus}, Lead stage = ${stageAfterBook}`
    );

    // Bước 2.4: Giáo vụ điểm danh thí sinh có mặt (PRESENT) (UC-02)
    const attendRes = await apiRequest(
      baseUrl,
      'PATCH',
      `/api/placement-tests/${createdTestId}/attendance`,
      academicAuth.token,
      {
        attendanceStatus: 'PRESENT',
        notes: 'Thí sinh đến đúng giờ, đã kiểm tra CCCD',
      }
    );

    recordAssertion(
      'TC-E2E-04',
      'UC-02 (Placement Test)',
      'Bước 4: Giáo vụ điểm danh thí sinh dự thi (PATCH /api/placement-tests/:id/attendance)',
      attendRes.status === 200 && attendRes.data?.data?.attendanceStatus === 'PRESENT',
      'HTTP 200 OK, attendanceStatus = PRESENT',
      `HTTP ${attendRes.status}, attendanceStatus = ${attendRes.data?.data?.attendanceStatus}`
    );

    // Bước 2.5: Giáo vụ nhập điểm 4 kỹ năng & Hệ thống tự động gợi ý khóa học (UC-02 / UC-SYS-03)
    const scoreRes = await apiRequest(
      baseUrl,
      'POST',
      `/api/placement-tests/${createdTestId}/score`,
      academicAuth.token,
      {
        listeningScore: 5.5,
        readingScore: 5.5,
        writingScore: 5.0,
        speakingScore: 5.0,
        examinerFeedback: 'Nền tảng từ vựng tốt, cần cải thiện kỹ năng viết Task 2 và phản xạ Speaking Part 3.',
      }
    );
    const scoredTest = scoreRes.data?.data?.test;
    const recommendation = scoreRes.data?.data?.recommendation;

    recordAssertion(
      'TC-E2E-05',
      'UC-02 / UC-SYS-03',
      'Bước 5: Nhập điểm 4 kỹ năng (5.5, 5.5, 5.0, 5.0) -> Tự động tính Overall 5.5 & Gợi ý khóa học',
      scoreRes.status === 200 &&
        Number(scoredTest?.overallScore) === 5.5 &&
        Boolean(recommendation?.course?.courseCode),
      'HTTP 200 OK, overallScore = 5.5, recommendedCourse != null',
      `HTTP ${scoreRes.status}, overallScore = ${scoredTest?.overallScore}, recommended = ${recommendation?.course?.courseCode} (${recommendation?.course?.courseName})`
    );

    // Bước 2.6: Giáo vụ khởi tạo Khóa học & Lớp học tiêu chuẩn (maxCapacity = 15) (UC-03)
    const courseRes = await apiRequest(baseUrl, 'POST', '/api/courses', academicAuth.token, {
      courseCode: `IELTS-E2E-${uniqueSuffix}`,
      courseName: 'IELTS Intensive 5.5 - 6.5 (E2E Test)',
      totalLessons: 36,
      standardTuition: 8500000,
      minEntryScore: 5.0,
      maxEntryScore: 6.0,
      targetOutput: 'IELTS 6.5+',
      description: 'Khóa học phục vụ kiểm thử tích hợp E2E TEST-01',
    });
    createdCourseId = courseRes.data?.data?.id || null;

    const classRes = await apiRequest(baseUrl, 'POST', '/api/classes', academicAuth.token, {
      courseId: createdCourseId,
      classCode: `CLS-E2E-${uniqueSuffix}`,
      className: 'Lớp IELTS E2E Tối 2-4-6',
      scheduleDays: 'MON_WED_FRI',
      timeSlot: '18:00 - 19:30',
      room: 'Phòng 302',
      teacherName: 'Ms. Nguyễn Lan Anh (IELTS 8.5)',
      startDate: '2026-11-15',
      maxCapacity: 15,
    });
    createdClassId = classRes.data?.data?.id || null;

    recordAssertion(
      'TC-E2E-06',
      'UC-03 (Academic)',
      'Bước 6: Giáo vụ mở Lớp học mới với trần sĩ số chuẩn maxCapacity = 15 học viên',
      classRes.status === 201 &&
        createdClassId !== null &&
        classRes.data?.data?.maxCapacity === 15,
      'HTTP 201 Created, maxCapacity = 15',
      `HTTP ${classRes.status}, Class ID = ${createdClassId}, maxCapacity = ${classRes.data?.data?.maxCapacity}`
    );

    // Bước 2.7: Xếp lớp cho Lead -> Tự sinh mã STU-xxx & Tự động chuyển Lead sang ENROLLED (UC-03)
    const enrollRes = await apiRequest(baseUrl, 'POST', '/api/enrollments', salesAuth.token, {
      leadId: createdLeadId,
      classId: createdClassId,
      discountAmount: 500000,
      notes: 'Ưu đãi học bổng đăng ký sớm sau khi thi Placement Test',
    });
    const enrollmentData = enrollRes.data?.data;
    createdEnrollmentId = enrollmentData?.id || null;
    createdStudentId = enrollmentData?.studentId || null;

    const leadAfterEnrollRes = await apiRequest(baseUrl, 'GET', `/api/leads/${createdLeadId}`, salesAuth.token);
    const stageAfterEnroll = leadAfterEnrollRes.data?.data?.pipelineStage;

    recordAssertion(
      'TC-E2E-07',
      'UC-03 (Enrollment)',
      'Bước 7: Xếp lớp cho Lead -> Sinh mã học viên STU-xxx, tính học phí 8,000,000đ & Chuyển Lead sang ENROLLED',
      enrollRes.status === 201 &&
        Boolean(enrollmentData?.studentCode?.startsWith('STU-')) &&
        Number(enrollmentData?.finalAmount) === 8000000 &&
        stageAfterEnroll === 'ENROLLED',
      'HTTP 201 Created, studentCode = STU-*, finalAmount = 8,000,000, Lead pipelineStage = ENROLLED',
      `HTTP ${enrollRes.status}, studentCode = ${enrollmentData?.studentCode}, finalAmount = ${enrollmentData?.finalAmount}, Lead stage = ${stageAfterEnroll}`
    );

    // Bước 2.8: Thu học phí & Cấp biên lai điện tử REC-xxx (UC-03)
    const payment1Res = await apiRequest(
      baseUrl,
      'POST',
      `/api/enrollments/${createdEnrollmentId}/payments`,
      salesAuth.token,
      {
        amount: 5000000,
        paymentMethod: 'BANK_TRANSFER',
        transactionReference: `VCB-E2E-${uniqueSuffix}`,
        notes: 'Thu học phí đợt 1 qua chuyển khoản ngân hàng',
      }
    );
    const receipt1 = payment1Res.data?.data?.receipt;
    const enrollAfterPay1 = payment1Res.data?.data?.enrollment;

    recordAssertion(
      'TC-E2E-08',
      'UC-03 (Payment)',
      'Bước 8a: Thu học phí đợt 1 (5,000,000đ) -> Cấp biên lai REC-xxx, trạng thái PARTIAL, dư nợ 3,000,000đ',
      payment1Res.status === 201 &&
        Boolean(receipt1?.receiptCode?.startsWith('REC-')) &&
        enrollAfterPay1?.paymentStatus === 'PARTIAL' &&
        Number(enrollAfterPay1?.balanceDue) === 3000000,
      'HTTP 201 Created, receiptCode = REC-*, paymentStatus = PARTIAL, balanceDue = 3,000,000',
      `HTTP ${payment1Res.status}, receiptCode = ${receipt1?.receiptCode}, status = ${enrollAfterPay1?.paymentStatus}, balanceDue = ${enrollAfterPay1?.balanceDue}`
    );

    const payment2Res = await apiRequest(
      baseUrl,
      'POST',
      `/api/enrollments/${createdEnrollmentId}/payments`,
      academicAuth.token,
      {
        amount: 3000000,
        paymentMethod: 'CASH',
        notes: 'Thu nốt học phí đợt 2 bằng tiền mặt tại quầy',
      }
    );
    const receipt2 = payment2Res.data?.data?.receipt;
    const enrollAfterPay2 = payment2Res.data?.data?.enrollment;

    recordAssertion(
      'TC-E2E-09',
      'UC-03 (Payment)',
      'Bước 8b: Thu hoàn tất học phí đợt 2 (3,000,000đ) -> Trạng thái FULLY_PAID, dư nợ = 0đ',
      payment2Res.status === 201 &&
        Boolean(receipt2?.receiptCode?.startsWith('REC-')) &&
        enrollAfterPay2?.paymentStatus === 'FULLY_PAID' &&
        Number(enrollAfterPay2?.balanceDue) === 0,
      'HTTP 201 Created, paymentStatus = FULLY_PAID, balanceDue = 0',
      `HTTP ${payment2Res.status}, receiptCode = ${receipt2?.receiptCode}, status = ${enrollAfterPay2?.paymentStatus}, balanceDue = ${enrollAfterPay2?.balanceDue}`
    );

    // =========================================================================
    // PHẦN 3: KIỂM THỬ BẢO MẬT PHÂN QUYỀN RBAC (ROLE-BASED ACCESS CONTROL)
    // =========================================================================
    console.log('\n📌 PHẦN 3: KIỂM THỬ BẢO MẬT PHÂN QUYỀN RBAC (ROLE-BASED ACCESS CONTROL MATRIX)');

    // 3.1: Tư vấn viên (SALES) không xem được báo cáo doanh thu tài chính
    const salesRevenueRes = await apiRequest(
      baseUrl,
      'GET',
      '/api/analytics/revenue',
      salesAuth.token
    );
    recordAssertion(
      'TC-RBAC-01',
      'RBAC Security',
      'Tư vấn viên (SALES) bị chặn khi truy cập Báo cáo Doanh thu Tài chính (GET /api/analytics/revenue)',
      salesRevenueRes.status === 403,
      'HTTP 403 Forbidden',
      `HTTP ${salesRevenueRes.status} (${salesRevenueRes.data?.message || ''})`
    );

    // 3.2: Giáo vụ (ACADEMIC) không xóa được lớp học
    const academicDeleteClassRes = await apiRequest(
      baseUrl,
      'DELETE',
      `/api/classes/${createdClassId}`,
      academicAuth.token
    );
    recordAssertion(
      'TC-RBAC-02',
      'RBAC Security',
      'Giáo vụ (ACADEMIC) bị chặn khi thực hiện Xóa lớp học (DELETE /api/classes/:id)',
      academicDeleteClassRes.status === 403,
      'HTTP 403 Forbidden',
      `HTTP ${academicDeleteClassRes.status} (${academicDeleteClassRes.data?.message || ''})`
    );

    // 3.3: Tư vấn viên (SALES) không được tạo hoặc xóa lớp học
    const salesCreateClassRes = await apiRequest(
      baseUrl,
      'POST',
      '/api/classes',
      salesAuth.token,
      {
        courseId: createdCourseId,
        classCode: 'UNAUTH-CLS',
        className: 'Lớp Trái Phép',
        scheduleDays: 'MON_WED_FRI',
        timeSlot: '18:00 - 19:30',
        startDate: '2026-12-01',
      }
    );
    recordAssertion(
      'TC-RBAC-03',
      'RBAC Security',
      'Tư vấn viên (SALES) bị chặn khi Tạo lớp học mới (POST /api/classes)',
      salesCreateClassRes.status === 403,
      'HTTP 403 Forbidden',
      `HTTP ${salesCreateClassRes.status} (${salesCreateClassRes.data?.message || ''})`
    );

    // 3.4: Tư vấn viên (SALES) không được chấm điểm bài thi đầu vào
    const salesScoreRes = await apiRequest(
      baseUrl,
      'POST',
      `/api/placement-tests/${createdTestId}/score`,
      salesAuth.token,
      {
        listeningScore: 8.0,
        readingScore: 8.0,
        writingScore: 8.0,
        speakingScore: 8.0,
      }
    );
    recordAssertion(
      'TC-RBAC-04',
      'RBAC Security',
      'Tư vấn viên (SALES) bị chặn khi Nhập điểm thi đầu vào (POST /api/placement-tests/:id/score)',
      salesScoreRes.status === 403,
      'HTTP 403 Forbidden',
      `HTTP ${salesScoreRes.status} (${salesScoreRes.data?.message || ''})`
    );

    // 3.5: Giáo vụ (ACADEMIC) không được thêm mới Lead vào phễu Sales
    const academicCreateLeadRes = await apiRequest(
      baseUrl,
      'POST',
      '/api/leads',
      academicAuth.token,
      {
        fullName: 'Lead Trái Quyền',
        phoneNumber: '0911222333',
        interest: 'IELTS',
        sourceChannel: 'WALK_IN',
      }
    );
    recordAssertion(
      'TC-RBAC-05',
      'RBAC Security',
      'Giáo vụ (ACADEMIC) bị chặn khi Tạo mới Lead tuyển sinh (POST /api/leads)',
      academicCreateLeadRes.status === 403,
      'HTTP 403 Forbidden',
      `HTTP ${academicCreateLeadRes.status} (${academicCreateLeadRes.data?.message || ''})`
    );

    // 3.6: SALES và ACADEMIC bị chặn khi truy cập Quản trị Nhân sự (GET /api/staff)
    const salesStaffRes = await apiRequest(baseUrl, 'GET', '/api/staff', salesAuth.token);
    const academicStaffRes = await apiRequest(baseUrl, 'GET', '/api/staff', academicAuth.token);
    recordAssertion(
      'TC-RBAC-06',
      'RBAC Security',
      'SALES và ACADEMIC bị chặn khi truy cập Danh sách Tài khoản Nhân sự (GET /api/staff - Admin Only)',
      salesStaffRes.status === 403 && academicStaffRes.status === 403,
      'SALES = 403 Forbidden, ACADEMIC = 403 Forbidden',
      `SALES = HTTP ${salesStaffRes.status}, ACADEMIC = HTTP ${academicStaffRes.status}`
    );

    // =========================================================================
    // PHẦN 4: KIỂM THỬ RÀNG BUỘC DỮ LIỆU & QUY TẮC NGHIỆP VỤ (DATA INTEGRITY)
    // =========================================================================
    console.log('\n📌 PHẦN 4: KIỂM THỬ RÀNG BUỘC TOÀN VẸN DỮ LIỆU (DATA INTEGRITY & BUSINESS RULES)');

    // 4.1: Kiểm thử trùng số điện thoại Lead (BR-01)
    const duplicateLeadRes = await apiRequest(baseUrl, 'POST', '/api/leads', salesAuth.token, {
      fullName: 'Khách Hàng Trùng Số Điện Thoại',
      phoneNumber: e2ePhone, // Trùng với số điện thoại của Lead đã tạo ở Bước 1
      interest: 'TOEIC',
      sourceChannel: 'HOTLINE',
    });
    recordAssertion(
      'TC-DATA-01',
      'BR-01 (Unique Phone)',
      'Chặn tạo Lead trùng số điện thoại đã tồn tại trong hệ thống (BR-01)',
      duplicateLeadRes.status === 409,
      'HTTP 409 Conflict',
      `HTTP ${duplicateLeadRes.status} (${duplicateLeadRes.data?.message || ''})`
    );

    // 4.2: Kiểm thử chuyển Lead sang LOST nhưng không nhập lý do thất bại (BR-02)
    const secondLeadRes = await apiRequest(baseUrl, 'POST', '/api/leads', salesAuth.token, {
      fullName: 'Lê Thị Kiểm Thử Ràng Buộc',
      phoneNumber: `0966${uniqueSuffix}`,
      interest: 'TOEIC',
      sourceChannel: 'WEBSITE',
    });
    secondLeadId = secondLeadRes.data?.data?.id || null;

    const lostWithoutReasonRes = await apiRequest(
      baseUrl,
      'PATCH',
      `/api/leads/${secondLeadId}/status`,
      salesAuth.token,
      {
        pipelineStage: 'LOST',
      }
    );
    recordAssertion(
      'TC-DATA-02',
      'BR-02 (Lost Reason)',
      'Chặn chuyển trạng thái Lead sang LOST nếu bỏ trống lý do hủy (lostReason)',
      lostWithoutReasonRes.status === 400,
      'HTTP 400 Bad Request',
      `HTTP ${lostWithoutReasonRes.status} (${lostWithoutReasonRes.data?.message || ''})`
    );

    // 4.3: Kiểm thử chống đặt lịch thi trùng cho cùng một Lead đang có lịch SCHEDULED (BR-03)
    const firstBookSecondLead = await apiRequest(
      baseUrl,
      'POST',
      '/api/placement-tests/book',
      salesAuth.token,
      {
        leadId: secondLeadId,
        testDate: testDateStr,
        timeSlot: '14:00 - 15:30',
        room: 'Phòng Lab E2E-102',
        testType: 'TOEIC',
      }
    );
    const secondLeadTestId = firstBookSecondLead.data?.data?.id;

    const duplicateBookRes = await apiRequest(
      baseUrl,
      'POST',
      '/api/placement-tests/book',
      salesAuth.token,
      {
        leadId: secondLeadId,
        testDate: testDateStr,
        timeSlot: '18:00 - 19:30',
        room: 'Phòng Lab E2E-102',
        testType: 'TOEIC',
      }
    );
    recordAssertion(
      'TC-DATA-03',
      'BR-03 (Anti-Collision)',
      'Chặn đặt lịch thi Placement Test trùng khi thí sinh đang có ca thi SCHEDULED chưa hoàn tất',
      duplicateBookRes.status === 409,
      'HTTP 409 Conflict',
      `HTTP ${duplicateBookRes.status} (${duplicateBookRes.data?.message || ''})`
    );

    if (secondLeadTestId) {
      await apiRequest(baseUrl, 'DELETE', `/api/placement-tests/${secondLeadTestId}`, adminAuth.token);
    }

    // 4.4: Kiểm thử Ràng buộc Sĩ số Tối đa 15 học viên/lớp (BR-04 / UC-SYS-02)
    // Giả lập lớp học đạt ngưỡng trần 15/15 học viên và kiểm tra tự động khóa ghi danh học viên thứ 16
    if (createdClassId) {
      await ClassRepository.updateCurrentEnrolled(createdClassId, 15, true);

      const availRes = await apiRequest(
        baseUrl,
        'GET',
        `/api/classes/${createdClassId}/availability`,
        salesAuth.token
      );
      const availInfo = availRes.data?.data;

      const overflowEnrollRes = await apiRequest(
        baseUrl,
        'POST',
        '/api/enrollments',
        salesAuth.token,
        {
          leadId: secondLeadId,
          classId: createdClassId,
          notes: 'Thử ghi danh học viên thứ 16 vượt quá trần 15 học viên/lớp',
        }
      );

      recordAssertion(
        'TC-DATA-04',
        'BR-04 / UC-SYS-02',
        'Chặn ghi danh học viên thứ 16 khi lớp đã chạm trần 15/15 học viên (Auto-Lock Capacity)',
        availInfo?.isFull === true &&
          availInfo?.availableSeats === 0 &&
          overflowEnrollRes.status === 409,
        'isFull = true, availableSeats = 0, HTTP 409 Conflict',
        `isFull = ${availInfo?.isFull}, availableSeats = ${availInfo?.availableSeats}, HTTP ${overflowEnrollRes.status} (${overflowEnrollRes.data?.message || ''})`
      );
    }

    // =========================================================================
    // TỔNG KẾT KẾT QUẢ CHẠY KIỂM THỬ TÍCH HỢP
    // =========================================================================
    console.log('\n========================================================================================');
    console.log(`🎯 TỔNG KẾT [TEST-01] INTEGRATION SUITE: ${passedCount}/${results.length} PASSED | ${failedCount} FAILED`);
    console.log('========================================================================================');

    if (failedCount > 0) {
      process.exitCode = 1;
    }
  } catch (error: any) {
    console.error('❌ Lỗi nghiêm trọng trong quá trình chạy kiểm thử tích hợp:', error);
    process.exitCode = 1;
  } finally {
    // Dọn dẹp sạch sẽ dữ liệu kiểm thử tạm thời
    try {
      if (dbHealth.connected) {
        if (createdEnrollmentId) {
          await pool.query('DELETE FROM payment_receipts WHERE enrollment_id = $1', [createdEnrollmentId]);
          await pool.query('DELETE FROM enrollments WHERE id = $1', [createdEnrollmentId]);
        }
        if (createdStudentId) {
          await pool.query('DELETE FROM students WHERE id = $1', [createdStudentId]);
        }
        if (createdTestId) {
          await pool.query('DELETE FROM placement_tests WHERE id = $1', [createdTestId]);
        }
        if (createdClassId) {
          await pool.query('DELETE FROM classes WHERE id = $1', [createdClassId]);
        }
        if (createdCourseId) {
          await pool.query('DELETE FROM courses WHERE id = $1', [createdCourseId]);
        }
        if (createdLeadId) {
          await pool.query('DELETE FROM interaction_logs WHERE lead_id = $1', [createdLeadId]);
          await pool.query('DELETE FROM leads WHERE id = $1', [createdLeadId]);
        }
        if (secondLeadId) {
          await pool.query('DELETE FROM placement_tests WHERE lead_id = $1', [secondLeadId]);
          await pool.query('DELETE FROM interaction_logs WHERE lead_id = $1', [secondLeadId]);
          await pool.query('DELETE FROM leads WHERE id = $1', [secondLeadId]);
        }
      }
      console.log('🧹 Đã dọn dẹp toàn bộ bản ghi kiểm thử tạm thời thành công.');
    } catch (cleanupErr: any) {
      console.warn('⚠️ Cảnh báo khi dọn dẹp dữ liệu test:', cleanupErr.message);
    }

    server.close();
    try {
      await pool.end();
    } catch {}
  }
}

runIntegrationTestSuite();
