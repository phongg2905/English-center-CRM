import { EnrollmentRepository } from '../repositories/enrollment.repository.js';
import { ClassRepository } from '../repositories/class.repository.js';
import { LeadRepository } from '../repositories/lead.repository.js';
import {
  EnrollStudentDto,
  EnrollmentWithDetails,
  RecordPaymentDto,
  PaymentReceipt,
  TransferClassDto,
  Student,
} from '../types/academic.types.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export class EnrollmentService {
  /**
   * Endpoint Xếp lớp: Tự động sinh Mã học viên duy nhất (STU-xxx),
   * chuyển trạng thái Lead sang ENROLLED, kiểm tra khóa sĩ số tự động (UC-03 / UC-SYS-02)
   */
  static async enrollStudent(dto: EnrollStudentDto, consultantId: number): Promise<EnrollmentWithDetails> {
    if (!dto.classId) {
      throw AppError.badRequest('ID lớp học (classId) là bắt buộc');
    }

    // 1. Kiểm tra lớp học tồn tại & thuật toán khóa sĩ số tự động (UC-SYS-02)
    const cls = await ClassRepository.findById(dto.classId);
    if (!cls) {
      throw AppError.notFound(`Không tìm thấy lớp học với ID = ${dto.classId}`);
    }

    if (cls.status === 'COMPLETED') {
      throw AppError.badRequest('Lớp học này đã kết thúc, không thể xếp học viên vào');
    }

    if (cls.isFull || cls.currentEnrolled >= cls.maxCapacity || cls.status === 'FULL') {
      throw AppError.conflict(
        `Lớp học '${cls.classCode}' đã đạt sĩ số tối đa (${cls.currentEnrolled}/${cls.maxCapacity}) và đã bị khóa tự động (UC-SYS-02). Vui lòng chọn lớp học khác còn chỗ.`
      );
    }

    // 2. Xác định hoặc tạo mới hồ sơ học viên (students)
    let student: Student | null = null;

    if (dto.studentId) {
      student = await EnrollmentRepository.findStudentById(dto.studentId);
      if (!student) {
        throw AppError.notFound(`Không tìm thấy học viên với ID = ${dto.studentId}`);
      }
    } else if (dto.leadId) {
      // Tìm xem Lead này đã được chuyển thành Student trước đó chưa
      student = await EnrollmentRepository.findStudentByLeadId(dto.leadId);

      if (!student) {
        // Lấy thông tin Lead
        const lead = await LeadRepository.findById(dto.leadId);
        if (!lead) {
          throw AppError.notFound(`Không tìm thấy khách hàng tiềm năng (Lead) với ID = ${dto.leadId}`);
        }

        // Kiểm tra xem số điện thoại của Lead đã trùng với học viên nào chưa
        const existingStudent = await EnrollmentRepository.findStudentByPhone(lead.phoneNumber);
        if (existingStudent) {
          student = existingStudent;
        } else {
          // Sinh mã học viên duy nhất dạng STU-YYYYMM-XXXX
          const studentCode = await EnrollmentRepository.generateNextStudentCode();
          student = await EnrollmentRepository.createStudent({
            studentCode,
            leadId: dto.leadId,
            fullName: dto.candidateInfo?.fullName || lead.fullName,
            phoneNumber: dto.candidateInfo?.phoneNumber || lead.phoneNumber,
            email: dto.candidateInfo?.email || lead.email,
            dateOfBirth: dto.candidateInfo?.dateOfBirth,
            address: dto.candidateInfo?.address,
          });
          logger.info(`Đã tạo hồ sơ học viên mới: ${studentCode} cho Lead #${dto.leadId}`);
        }

        // Chuyển trạng thái Lead sang ENROLLED
        await EnrollmentRepository.updateLeadToEnrolled(dto.leadId);
      }
    } else if (dto.candidateInfo) {
      // Trường hợp thí sinh tự do / vãng lai chưa có trong Lead
      const { fullName, phoneNumber, email, dateOfBirth, address } = dto.candidateInfo;
      if (!fullName || !phoneNumber) {
        throw AppError.badRequest('Họ tên và Số điện thoại học viên là bắt buộc');
      }

      const existingStudent = await EnrollmentRepository.findStudentByPhone(phoneNumber);
      if (existingStudent) {
        student = existingStudent;
      } else {
        const studentCode = await EnrollmentRepository.generateNextStudentCode();
        student = await EnrollmentRepository.createStudent({
          studentCode,
          fullName,
          phoneNumber,
          email,
          dateOfBirth,
          address,
        });
        logger.info(`Đã tạo hồ sơ học viên vãng lai: ${studentCode} (${fullName})`);
      }
    } else {
      throw AppError.badRequest('Cần cung cấp leadId, studentId hoặc candidateInfo để xếp lớp');
    }

    if (!student) {
      throw AppError.internal('Không thể khởi tạo hoặc xác thực thông tin học viên');
    }

    // 3. Kiểm tra trùng lặp ghi danh: Học viên đã ở trong lớp này chưa
    const existingEnrollment = await EnrollmentRepository.findEnrollmentByStudentAndClass(
      student.id,
      cls.id
    );
    if (existingEnrollment && existingEnrollment.status === 'ENROLLED') {
      throw AppError.conflict(
        `Học viên '${student.fullName}' (${student.studentCode}) đã được xếp vào lớp '${cls.classCode}' rồi`
      );
    }

    // 4. Tính toán học phí chuẩn & ưu đãi
    const originalTuition = cls.standardTuition;
    const discountAmount = Math.max(0, Number(dto.discountAmount || 0));
    const finalAmount = Math.max(0, originalTuition - discountAmount);

    // 5. Ghi danh học viên vào lớp (bảng enrollments)
    const enrollment = await EnrollmentRepository.createEnrollment({
      studentId: student.id,
      classId: cls.id,
      consultantId,
      originalTuition,
      discountAmount,
      finalAmount,
      notes: dto.notes,
    });

    // Cập nhật sĩ số lớp (phục vụ cả mock fallback lẫn DB trigger)
    const newCount = cls.currentEnrolled + 1;
    await ClassRepository.updateCurrentEnrolled(cls.id, newCount, newCount >= cls.maxCapacity);

    logger.info(
      `✅ Xếp lớp thành công: Học viên ${student.studentCode} -> Lớp ${cls.classCode}. Sĩ số hiện tại: ${newCount}/${cls.maxCapacity}`
    );

    return enrollment;
  }

  /**
   * Endpoint Ghi nhận Thanh toán Học phí & Cấp Biên lai (Receipt)
   */
  static async recordPayment(
    enrollmentId: number,
    dto: RecordPaymentDto,
    receiverId: number
  ): Promise<{ receipt: PaymentReceipt; enrollment: EnrollmentWithDetails }> {
    if (!dto.amount || dto.amount <= 0) {
      throw AppError.badRequest('Số tiền đóng học phí phải lớn hơn 0');
    }
    if (!dto.paymentMethod || !['CASH', 'BANK_TRANSFER'].includes(dto.paymentMethod)) {
      throw AppError.badRequest("Phương thức thanh toán phải là 'CASH' (Tiền mặt) hoặc 'BANK_TRANSFER' (Chuyển khoản)");
    }

    const enrollment = await EnrollmentRepository.findEnrollmentById(enrollmentId);
    if (!enrollment) {
      throw AppError.notFound(`Không tìm thấy hồ sơ ghi danh với ID = ${enrollmentId}`);
    }

    if (enrollment.status === 'DROPPED') {
      throw AppError.badRequest('Học viên đã thôi học / hủy lớp, không thể thu học phí');
    }

    if (enrollment.balanceDue <= 0 && enrollment.paymentStatus === 'FULLY_PAID') {
      throw AppError.badRequest('Hồ sơ ghi danh này đã hoàn thành 100% học phí, không còn số dư phải đóng');
    }

    // Sinh mã biên lai thu tiền duy nhất: REC-YYYYMM-XXXX
    const receiptCode = await EnrollmentRepository.generateNextReceiptCode();

    const receipt = await EnrollmentRepository.createPaymentReceipt({
      enrollmentId,
      receiptCode,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      transactionReference: dto.transactionReference,
      receiverId,
      notes: dto.notes,
    });

    // Cập nhật trạng thái thanh toán của hồ sơ ghi danh
    const newPaidTotal = enrollment.paidAmount + dto.amount;
    const newPaymentStatus = newPaidTotal >= enrollment.finalAmount ? 'FULLY_PAID' : 'PARTIAL';

    const updatedEnrollment = await EnrollmentRepository.updateEnrollment(enrollmentId, {
      paymentStatus: newPaymentStatus,
    });

    if (!updatedEnrollment) {
      throw AppError.internal('Lỗi cập nhật trạng thái thanh toán hồ sơ ghi danh');
    }

    logger.info(
      `✅ Thu học phí thành công: Biên lai ${receiptCode} - Số tiền: ${dto.amount.toLocaleString()} VND cho ${updatedEnrollment.studentCode}`
    );

    return {
      receipt,
      enrollment: updatedEnrollment,
    };
  }

  /**
   * Endpoint Chuyển lớp cho Học viên (Class Transfer)
   */
  static async transferClass(
    enrollmentId: number,
    dto: TransferClassDto,
    userId: number
  ): Promise<EnrollmentWithDetails> {
    if (!dto.newClassId) {
      throw AppError.badRequest('Cần cung cấp newClassId để chuyển lớp');
    }

    const enrollment = await EnrollmentRepository.findEnrollmentById(enrollmentId);
    if (!enrollment) {
      throw AppError.notFound(`Không tìm thấy hồ sơ ghi danh với ID = ${enrollmentId}`);
    }

    if (enrollment.classId === dto.newClassId) {
      throw AppError.badRequest('Lớp mới trùng với lớp học viên đang theo học');
    }

    // Kiểm tra lớp mới có tồn tại và còn chỗ không
    const newClass = await ClassRepository.findById(dto.newClassId);
    if (!newClass) {
      throw AppError.notFound(`Không tìm thấy lớp học chuyển đến với ID = ${dto.newClassId}`);
    }

    if (newClass.isFull || newClass.availableSeats <= 0 || newClass.status === 'FULL') {
      throw AppError.conflict(
        `Lớp học mới '${newClass.classCode}' đã đầy sĩ số (${newClass.currentEnrolled}/${newClass.maxCapacity}), không thể tiếp nhận chuyển lớp`
      );
    }

    // Kiểm tra học viên đã có trong lớp mới chưa
    const existing = await EnrollmentRepository.findEnrollmentByStudentAndClass(
      enrollment.studentId,
      newClass.id
    );
    if (existing && existing.status === 'ENROLLED') {
      throw AppError.conflict(`Học viên đã có một ghi danh đang hoạt động trong lớp '${newClass.classCode}'`);
    }

    const transferNote = `[Chuyển lớp từ ${enrollment.classCode} sang ${newClass.classCode} vào ${new Date().toLocaleDateString('vi-VN')}] Lý do: ${dto.reason || 'Yêu cầu của học viên'}`;
    const combinedNotes = enrollment.notes ? `${enrollment.notes}\n${transferNote}` : transferNote;

    // Cập nhật lớp học mới trong bảng enrollments
    const updated = await EnrollmentRepository.updateEnrollment(enrollmentId, {
      classId: newClass.id,
      notes: combinedNotes,
    });

    if (!updated) {
      throw AppError.internal('Lỗi khi chuyển lớp cho học viên');
    }

    // Đồng bộ lại sĩ số cả 2 lớp (hỗ trợ mock fallback)
    const oldClass = await ClassRepository.findById(enrollment.classId);
    if (oldClass) {
      const oldNewCount = Math.max(0, oldClass.currentEnrolled - 1);
      await ClassRepository.updateCurrentEnrolled(oldClass.id, oldNewCount, false);
    }
    const newNewCount = newClass.currentEnrolled + 1;
    await ClassRepository.updateCurrentEnrolled(newClass.id, newNewCount, newNewCount >= newClass.maxCapacity);

    logger.info(
      `✅ Chuyển lớp thành công cho ${enrollment.studentCode}: ${enrollment.classCode} -> ${newClass.classCode}`
    );

    return updated;
  }

  static async getEnrollmentById(id: number): Promise<EnrollmentWithDetails> {
    const en = await EnrollmentRepository.findEnrollmentById(id);
    if (!en) {
      throw AppError.notFound(`Không tìm thấy hồ sơ ghi danh với ID = ${id}`);
    }
    return en;
  }

  static async getEnrollments(filter?: {
    classId?: number;
    studentId?: number;
    paymentStatus?: string;
    status?: string;
    search?: string;
  }): Promise<EnrollmentWithDetails[]> {
    return EnrollmentRepository.findEnrollments(filter);
  }

  static async getPaymentReceipts(enrollmentId: number): Promise<PaymentReceipt[]> {
    return EnrollmentRepository.getPaymentReceipts(enrollmentId);
  }
}
