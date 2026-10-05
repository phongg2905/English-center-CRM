/**
 * Script kiểm thử tự động toàn diện phân hệ Quản lý Đào tạo, Khóa học, Lớp học, Xếp lớp & Thu học phí (BE-05)
 */
import { CourseService } from '../services/course.service.js';
import { ClassService } from '../services/class.service.js';
import { EnrollmentService } from '../services/enrollment.service.js';
import { logger } from '../utils/logger.js';

async function runAcademicTests() {
  console.log('================================================================');
  console.log('  TEST SUITE: PHÂN HỆ QUẢN LÝ ĐÀO TẠO & THU HỌC PHÍ (BE-05 / UC-03)');
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

  try {
    // -------------------------------------------------------------
    // TEST 1: CRUD Danh mục Khóa học (Courses)
    // -------------------------------------------------------------
    console.log('📌 1. Kiểm thử CRUD Danh mục Khóa học:');
    const initialCourses = await CourseService.getAllCourses();
    assert(initialCourses.length >= 5, `Lấy danh sách khóa học thành công (${initialCourses.length} khóa học)`);

    const newCourseCode = `TEST-CRS-${Date.now().toString().slice(-4)}`;
    const createdCourse = await CourseService.createCourse({
      courseCode: newCourseCode,
      courseName: 'Khóa học Thử nghiệm Chuyên sâu',
      totalLessons: 32,
      standardTuition: 7500000,
      minEntryScore: 5.0,
      maxEntryScore: 6.0,
      targetOutput: 'IELTS 6.5+',
      description: 'Khóa học phục vụ automated integration test',
    });
    assert(createdCourse.id > 0 && createdCourse.courseCode === newCourseCode, 'Tạo mới khóa học thành công');

    const updatedCourse = await CourseService.updateCourse(createdCourse.id, {
      courseName: 'Khóa học Thử nghiệm (Đã cập nhật)',
      standardTuition: 8000000,
    });
    assert(updatedCourse.standardTuition === 8000000, 'Cập nhật học phí khóa học thành công');

    // -------------------------------------------------------------
    // TEST 2: CRUD Lớp học Mở mới & Kiểm tra Sĩ số Khả dụng (Classes)
    // -------------------------------------------------------------
    console.log('\n📌 2. Kiểm thử CRUD Lớp học & Thuật toán Kiểm tra Sĩ số:');
    const initialClasses = await ClassService.getAllClasses();
    assert(initialClasses.length >= 3, `Lấy danh sách lớp học thành công (${initialClasses.length} lớp)`);

    const newClassCode = `CLS-TEST-${Date.now().toString().slice(-4)}`;
    const createdClass = await ClassService.createClass({
      courseId: createdCourse.id,
      classCode: newClassCode,
      className: 'Lớp Test Tối 2-4-6',
      scheduleDays: 'MON_WED_FRI',
      timeSlot: '18:00 - 19:30',
      room: 'Phòng Lab 301',
      teacherName: 'Mr. Test Teacher',
      startDate: '2026-11-01',
      maxCapacity: 2, // Đặt sức chứa nhỏ (2) để test khóa sĩ số tự động UC-SYS-02
    });
    assert(createdClass.id > 0 && createdClass.maxCapacity === 2, 'Tạo lớp học mở mới thành công với maxCapacity = 2');

    const avail1 = await ClassService.checkClassAvailability(createdClass.id);
    assert(avail1.availableSeats === 2 && !avail1.isFull, 'Thuật toán kiểm tra sĩ số khả dụng chính xác (2/2 chỗ trống)');

    // -------------------------------------------------------------
    // TEST 3: Endpoint Xếp lớp: Tự sinh mã STU-xxx & Đổi trạng thái Lead
    // -------------------------------------------------------------
    console.log('\n📌 3. Kiểm thử Xếp lớp, Tự sinh Mã STU-xxx & Khóa Sĩ số (UC-SYS-02):');
    const enrollment1 = await EnrollmentService.enrollStudent(
      {
        classId: createdClass.id,
        candidateInfo: {
          fullName: 'Học viên Test 1',
          phoneNumber: `0999${Date.now().toString().slice(-6)}`,
          email: 'test1@crm.edu.vn',
        },
        discountAmount: 500000,
        notes: 'Học bổng ưu đãi 500k',
      },
      1
    );
    assert(
      enrollment1.id > 0 && enrollment1.studentCode.startsWith('STU-'),
      `Xếp học viên 1 thành công, sinh mã học viên tự động: ${enrollment1.studentCode}`
    );
    assert(enrollment1.finalAmount === 7500000, 'Tính toán học phí sau giảm trừ chính xác (8,000,000 - 500,000 = 7,500,000)');

    const avail2 = await ClassService.checkClassAvailability(createdClass.id);
    assert(avail2.availableSeats === 1 && !avail2.isFull, 'Sĩ số sau ghi danh học viên 1: còn 1 chỗ trống');

    // Xếp học viên thứ 2 để lớp đạt tối đa (2/2)
    const enrollment2 = await EnrollmentService.enrollStudent(
      {
        classId: createdClass.id,
        candidateInfo: {
          fullName: 'Học viên Test 2',
          phoneNumber: `0988${Date.now().toString().slice(-6)}`,
          email: 'test2@crm.edu.vn',
        },
      },
      1
    );
    assert(
      enrollment2.id > 0 && enrollment2.studentCode.startsWith('STU-'),
      `Xếp học viên 2 thành công, sinh mã học viên tự động: ${enrollment2.studentCode}`
    );

    const avail3 = await ClassService.checkClassAvailability(createdClass.id);
    assert(avail3.availableSeats === 0 && avail3.isFull, '✅ Lớp đã tự động khóa ghi danh (isFull = true, 2/2 học viên) (UC-SYS-02)');

    // Thử xếp học viên thứ 3 vào lớp đã đầy -> Phải ném lỗi 409 Conflict
    let caughtConflict = false;
    try {
      await EnrollmentService.enrollStudent(
        {
          classId: createdClass.id,
          candidateInfo: {
            fullName: 'Học viên Test 3',
            phoneNumber: `0977${Date.now().toString().slice(-6)}`,
          },
        },
        1
      );
    } catch (err: any) {
      caughtConflict = err.statusCode === 409;
    }
    assert(caughtConflict, '✅ Chặn thành công học viên thứ 3 khi lớp đã FULL sĩ số (Bảo vệ toàn vẹn UC-SYS-02)');

    // -------------------------------------------------------------
    // TEST 4: Endpoint Thu học phí & Cấp Biên lai REC-xxx
    // -------------------------------------------------------------
    console.log('\n📌 4. Kiểm thử Thu Học Phí & Cấp Biên Lai (REC-xxx):');
    const payment1 = await EnrollmentService.recordPayment(
      enrollment1.id,
      {
        amount: 3000000,
        paymentMethod: 'BANK_TRANSFER',
        transactionReference: 'VNPAY-999888',
        notes: 'Đóng đợt 1',
      },
      1
    );
    assert(
      payment1.receipt.receiptCode.startsWith('REC-') && payment1.enrollment.paymentStatus === 'PARTIAL',
      `Thu đợt 1 thành công: Cấp biên lai ${payment1.receipt.receiptCode}, trạng thái thanh toán = PARTIAL`
    );

    const payment2 = await EnrollmentService.recordPayment(
      enrollment1.id,
      {
        amount: 4500000, // Đóng nốt số dư còn lại (7.5tr - 3tr = 4.5tr)
        paymentMethod: 'CASH',
        notes: 'Đóng hết đợt 2 tiền mặt',
      },
      1
    );
    assert(
      payment2.enrollment.paymentStatus === 'FULLY_PAID' && payment2.enrollment.balanceDue === 0,
      'Thu đợt 2 thành công: Cập nhật trạng thái thanh toán = FULLY_PAID, số dư nợ = 0 VND'
    );

    const receipts = await EnrollmentService.getPaymentReceipts(enrollment1.id);
    assert(receipts.length === 2, `Truy vấn lịch sử biên lai thành công (${receipts.length} biên lai)`);

    // -------------------------------------------------------------
    // TEST 5: Endpoint Chuyển Lớp (Class Transfer)
    // -------------------------------------------------------------
    console.log('\n📌 5. Kiểm thử Chuyển Lớp cho Học viên:');
    // Tạo thêm một lớp mở thứ 2 còn chỗ trống
    const targetClass = await ClassService.createClass({
      courseId: createdCourse.id,
      classCode: `CLS-TGT-${Date.now().toString().slice(-4)}`,
      className: 'Lớp Chuyển Đến Tối 3-5-7',
      scheduleDays: 'TUE_THU_SAT',
      timeSlot: '19:45 - 21:15',
      startDate: '2026-11-05',
      maxCapacity: 15,
    });

    const transferred = await EnrollmentService.transferClass(
      enrollment2.id,
      {
        newClassId: targetClass.id,
        reason: 'Học viên bận lịch thứ 4, xin chuyển sang lớp tối 3-5-7',
      },
      1
    );
    assert(
      transferred.classId === targetClass.id,
      `Chuyển lớp thành công cho ${transferred.studentCode} sang lớp ${transferred.classCode}`
    );

    // Kiểm tra lớp cũ đã giải phóng chỗ chưa (từ 2 giảm xuống 1)
    const availOld = await ClassService.checkClassAvailability(createdClass.id);
    assert(availOld.availableSeats === 1 && !availOld.isFull, 'Lớp cũ đã giải phóng chỗ thành công sau khi chuyển học viên đi');

    console.log('\n================================================================');
    console.log(`🎉 TỔNG KẾT KIỂM THỬ: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================');
  } catch (error: any) {
    console.error('❌ Lỗi ngoại lệ trong quá trình kiểm thử:', error);
  }
}

runAcademicTests();
