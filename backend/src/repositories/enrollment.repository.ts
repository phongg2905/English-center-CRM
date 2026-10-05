import { query } from '../database/pool.js';
import {
  Student,
  Enrollment,
  EnrollmentWithDetails,
  PaymentReceipt,
  PaymentMethod,
  PaymentStatus,
  EnrollmentStatus,
} from '../types/academic.types.js';
import { logger } from '../utils/logger.js';

let mockStudents: Student[] = [
  {
    id: 1,
    studentCode: 'STU-202609-0001',
    leadId: 1,
    fullName: 'Nguyễn Thị Thuỳ Dung',
    phoneNumber: '0912111001',
    email: 'thuydung.nguyen@gmail.com',
    dateOfBirth: '2004-05-12',
    address: 'Hà Nội',
    emergencyContactName: null,
    emergencyContactPhone: null,
    createdAt: new Date('2026-09-20T09:00:00Z'),
    updatedAt: new Date('2026-09-20T09:00:00Z'),
  },
];

let mockEnrollments: EnrollmentWithDetails[] = [];
let mockPayments: PaymentReceipt[] = [];

let nextStudentId = 2;
let nextEnrollmentId = 1;
let nextReceiptId = 1;

function mapRowToStudent(row: any): Student {
  return {
    id: Number(row.id),
    studentCode: row.student_code,
    leadId: row.lead_id !== null ? Number(row.lead_id) : null,
    fullName: row.full_name,
    phoneNumber: row.phone_number,
    email: row.email || null,
    dateOfBirth: row.date_of_birth ? String(row.date_of_birth).split('T')[0] : null,
    address: row.address || null,
    emergencyContactName: row.emergency_contact_name || null,
    emergencyContactPhone: row.emergency_contact_phone || null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapRowToEnrollmentWithDetails(row: any): EnrollmentWithDetails {
  const originalTuition = Number(row.original_tuition);
  const discountAmount = Number(row.discount_amount);
  const finalAmount = Number(row.final_amount);
  const paidAmount = Number(row.paid_amount || 0);
  const balanceDue = Math.max(0, finalAmount - paidAmount);

  return {
    id: Number(row.id),
    studentId: Number(row.student_id),
    classId: Number(row.class_id),
    consultantId: row.consultant_id !== null ? Number(row.consultant_id) : null,
    enrollmentDate: row.enrollment_date ? String(row.enrollment_date).split('T')[0] : '',
    originalTuition,
    discountAmount,
    finalAmount,
    paymentStatus: row.payment_status as PaymentStatus,
    status: row.status as EnrollmentStatus,
    notes: row.notes || null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    studentCode: row.student_code || '',
    fullName: row.full_name || '',
    phoneNumber: row.phone_number || '',
    email: row.email || null,
    classCode: row.class_code || '',
    className: row.class_name || '',
    courseId: Number(row.course_id || 0),
    courseCode: row.course_code || '',
    courseName: row.course_name || '',
    consultantName: row.consultant_name || null,
    paidAmount,
    balanceDue,
  };
}

function mapRowToPaymentReceipt(row: any): PaymentReceipt {
  return {
    id: Number(row.id),
    enrollmentId: Number(row.enrollment_id),
    receiptCode: row.receipt_code,
    amount: Number(row.amount),
    paymentMethod: row.payment_method as PaymentMethod,
    transactionReference: row.transaction_reference || null,
    receiverId: Number(row.receiver_id),
    paidAt: new Date(row.paid_at),
    notes: row.notes || null,
    receiverName: row.receiver_name || undefined,
  };
}

export class EnrollmentRepository {
  static async generateNextStudentCode(): Promise<string> {
    try {
      const now = new Date();
      const prefix = `STU-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      const sql = `
        SELECT student_code FROM students
        WHERE student_code LIKE $1
        ORDER BY id DESC LIMIT 1
      `;
      const res = await query(sql, [`${prefix}-%`]);
      let seq = 1;
      if (res.rows.length > 0) {
        const lastCode = res.rows[0].student_code;
        const parts = lastCode.split('-');
        if (parts.length === 3) {
          const num = parseInt(parts[2], 10);
          if (!isNaN(num)) seq = num + 1;
        }
      }
      return `${prefix}-${String(seq).padStart(4, '0')}`;
    } catch (err) {
      const now = new Date();
      const prefix = `STU-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      return `${prefix}-${String(nextStudentId).padStart(4, '0')}`;
    }
  }

  static async generateNextReceiptCode(): Promise<string> {
    try {
      const now = new Date();
      const prefix = `REC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      const sql = `
        SELECT receipt_code FROM payment_receipts
        WHERE receipt_code LIKE $1
        ORDER BY id DESC LIMIT 1
      `;
      const res = await query(sql, [`${prefix}-%`]);
      let seq = 1;
      if (res.rows.length > 0) {
        const lastCode = res.rows[0].receipt_code;
        const parts = lastCode.split('-');
        if (parts.length === 3) {
          const num = parseInt(parts[2], 10);
          if (!isNaN(num)) seq = num + 1;
        }
      }
      return `${prefix}-${String(seq).padStart(4, '0')}`;
    } catch (err) {
      const now = new Date();
      const prefix = `REC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      return `${prefix}-${String(nextReceiptId).padStart(4, '0')}`;
    }
  }

  static async findStudentByLeadId(leadId: number): Promise<Student | null> {
    try {
      const sql = `SELECT * FROM students WHERE lead_id = $1`;
      const res = await query(sql, [leadId]);
      if (res.rows.length === 0) return null;
      return mapRowToStudent(res.rows[0]);
    } catch (err) {
      return mockStudents.find((s) => s.leadId === leadId) || null;
    }
  }

  static async findStudentByPhone(phone: string): Promise<Student | null> {
    try {
      const sql = `SELECT * FROM students WHERE phone_number = $1`;
      const res = await query(sql, [phone]);
      if (res.rows.length === 0) return null;
      return mapRowToStudent(res.rows[0]);
    } catch (err) {
      return mockStudents.find((s) => s.phoneNumber === phone) || null;
    }
  }

  static async findStudentById(id: number): Promise<Student | null> {
    try {
      const sql = `SELECT * FROM students WHERE id = $1`;
      const res = await query(sql, [id]);
      if (res.rows.length === 0) return null;
      return mapRowToStudent(res.rows[0]);
    } catch (err) {
      return mockStudents.find((s) => s.id === id) || null;
    }
  }

  static async createStudent(dto: {
    studentCode: string;
    leadId?: number | null;
    fullName: string;
    phoneNumber: string;
    email?: string | null;
    dateOfBirth?: string | null;
    address?: string | null;
  }): Promise<Student> {
    try {
      const sql = `
        INSERT INTO students (
          student_code, lead_id, full_name, phone_number, email, date_of_birth, address
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const params = [
        dto.studentCode,
        dto.leadId ?? null,
        dto.fullName.trim(),
        dto.phoneNumber.trim(),
        dto.email?.trim() || null,
        dto.dateOfBirth || null,
        dto.address?.trim() || null,
      ];
      const res = await query(sql, params);
      return mapRowToStudent(res.rows[0]);
    } catch (err) {
      logger.warn('EnrollmentRepository.createStudent: Fallback sang Mock Store');
      const now = new Date();
      const s: Student = {
        id: nextStudentId++,
        studentCode: dto.studentCode,
        leadId: dto.leadId ?? null,
        fullName: dto.fullName.trim(),
        phoneNumber: dto.phoneNumber.trim(),
        email: dto.email?.trim() || null,
        dateOfBirth: dto.dateOfBirth || null,
        address: dto.address?.trim() || null,
        emergencyContactName: null,
        emergencyContactPhone: null,
        createdAt: now,
        updatedAt: now,
      };
      mockStudents.push(s);
      return s;
    }
  }

  static async findEnrollmentByStudentAndClass(
    studentId: number,
    classId: number
  ): Promise<Enrollment | null> {
    try {
      const sql = `SELECT * FROM enrollments WHERE student_id = $1 AND class_id = $2`;
      const res = await query(sql, [studentId, classId]);
      if (res.rows.length === 0) return null;
      return {
        id: Number(res.rows[0].id),
        studentId: Number(res.rows[0].student_id),
        classId: Number(res.rows[0].class_id),
        consultantId: res.rows[0].consultant_id !== null ? Number(res.rows[0].consultant_id) : null,
        enrollmentDate: String(res.rows[0].enrollment_date).split('T')[0],
        originalTuition: Number(res.rows[0].original_tuition),
        discountAmount: Number(res.rows[0].discount_amount),
        finalAmount: Number(res.rows[0].final_amount),
        paymentStatus: res.rows[0].payment_status,
        status: res.rows[0].status,
        notes: res.rows[0].notes,
        createdAt: new Date(res.rows[0].created_at),
        updatedAt: new Date(res.rows[0].updated_at),
      };
    } catch (err) {
      return (
        mockEnrollments.find((e) => e.studentId === studentId && e.classId === classId) || null
      );
    }
  }

  static async createEnrollment(dto: {
    studentId: number;
    classId: number;
    consultantId?: number | null;
    originalTuition: number;
    discountAmount: number;
    finalAmount: number;
    notes?: string | null;
  }): Promise<EnrollmentWithDetails> {
    try {
      const sql = `
        INSERT INTO enrollments (
          student_id, class_id, consultant_id, original_tuition,
          discount_amount, final_amount, payment_status, status, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'UNPAID', 'ENROLLED', $7)
        RETURNING id
      `;
      const params = [
        dto.studentId,
        dto.classId,
        dto.consultantId ?? null,
        dto.originalTuition,
        dto.discountAmount,
        dto.finalAmount,
        dto.notes ?? null,
      ];
      const res = await query(sql, params);
      const createdId = res.rows[0].id;
      const full = await this.findEnrollmentById(createdId);
      if (!full) throw new Error('Không thể tải thông tin ghi danh vừa tạo');
      return full;
    } catch (err) {
      logger.warn('EnrollmentRepository.createEnrollment: Fallback sang Mock Store');
      const now = new Date();
      const student = mockStudents.find((s) => s.id === dto.studentId);
      const en: EnrollmentWithDetails = {
        id: nextEnrollmentId++,
        studentId: dto.studentId,
        classId: dto.classId,
        consultantId: dto.consultantId ?? null,
        enrollmentDate: now.toISOString().split('T')[0],
        originalTuition: dto.originalTuition,
        discountAmount: dto.discountAmount,
        finalAmount: dto.finalAmount,
        paymentStatus: 'UNPAID',
        status: 'ENROLLED',
        notes: dto.notes ?? null,
        studentCode: student?.studentCode || 'STU-001',
        fullName: student?.fullName || 'Học viên',
        phoneNumber: student?.phoneNumber || '',
        email: student?.email || null,
        classCode: 'CLASS-01',
        className: 'Lớp học',
        courseId: 1,
        courseCode: 'COURSE-01',
        courseName: 'Khóa học',
        consultantName: 'Tư vấn viên',
        paidAmount: 0,
        balanceDue: dto.finalAmount,
        createdAt: now,
        updatedAt: now,
      };
      mockEnrollments.push(en);
      return en;
    }
  }

  static async findEnrollmentById(id: number): Promise<EnrollmentWithDetails | null> {
    try {
      const sql = `
        SELECT e.*,
               s.student_code, s.full_name, s.phone_number, s.email,
               c.class_code, c.class_name, c.course_id,
               co.course_code, co.course_name,
               u.full_name AS consultant_name,
               COALESCE((SELECT SUM(amount) FROM payment_receipts WHERE enrollment_id = e.id), 0) AS paid_amount
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        JOIN classes c ON e.class_id = c.id
        JOIN courses co ON c.course_id = co.id
        LEFT JOIN users u ON e.consultant_id = u.id
        WHERE e.id = $1
      `;
      const res = await query(sql, [id]);
      if (res.rows.length === 0) return null;
      return mapRowToEnrollmentWithDetails(res.rows[0]);
    } catch (err) {
      return mockEnrollments.find((e) => e.id === id) || null;
    }
  }

  static async findEnrollments(filter?: {
    classId?: number;
    studentId?: number;
    paymentStatus?: string;
    status?: string;
    search?: string;
  }): Promise<EnrollmentWithDetails[]> {
    try {
      let sql = `
        SELECT e.*,
               s.student_code, s.full_name, s.phone_number, s.email,
               c.class_code, c.class_name, c.course_id,
               co.course_code, co.course_name,
               u.full_name AS consultant_name,
               COALESCE((SELECT SUM(amount) FROM payment_receipts WHERE enrollment_id = e.id), 0) AS paid_amount
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        JOIN classes c ON e.class_id = c.id
        JOIN courses co ON c.course_id = co.id
        LEFT JOIN users u ON e.consultant_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (filter?.classId) {
        params.push(filter.classId);
        sql += ` AND e.class_id = $${params.length}`;
      }
      if (filter?.studentId) {
        params.push(filter.studentId);
        sql += ` AND e.student_id = $${params.length}`;
      }
      if (filter?.paymentStatus) {
        params.push(filter.paymentStatus);
        sql += ` AND e.payment_status = $${params.length}`;
      }
      if (filter?.status) {
        params.push(filter.status);
        sql += ` AND e.status = $${params.length}`;
      }
      if (filter?.search) {
        params.push(`%${filter.search}%`);
        sql += ` AND (s.full_name ILIKE $${params.length} OR s.student_code ILIKE $${params.length} OR s.phone_number ILIKE $${params.length})`;
      }

      sql += ` ORDER BY e.id DESC`;

      const res = await query(sql, params);
      return res.rows.map(mapRowToEnrollmentWithDetails);
    } catch (err) {
      let list = [...mockEnrollments];
      if (filter?.classId) list = list.filter((e) => e.classId === filter.classId);
      if (filter?.studentId) list = list.filter((e) => e.studentId === filter.studentId);
      if (filter?.paymentStatus) list = list.filter((e) => e.paymentStatus === filter.paymentStatus);
      if (filter?.status) list = list.filter((e) => e.status === filter.status);
      return list;
    }
  }

  static async updateEnrollment(
    id: number,
    fields: {
      classId?: number;
      paymentStatus?: PaymentStatus;
      status?: EnrollmentStatus;
      notes?: string;
    }
  ): Promise<EnrollmentWithDetails | null> {
    try {
      const updates: string[] = [];
      const params: any[] = [id];

      if (fields.classId !== undefined) {
        params.push(fields.classId);
        updates.push(`class_id = $${params.length}`);
      }
      if (fields.paymentStatus !== undefined) {
        params.push(fields.paymentStatus);
        updates.push(`payment_status = $${params.length}`);
      }
      if (fields.status !== undefined) {
        params.push(fields.status);
        updates.push(`status = $${params.length}`);
      }
      if (fields.notes !== undefined) {
        params.push(fields.notes);
        updates.push(`notes = $${params.length}`);
      }

      if (updates.length > 0) {
        const sql = `
          UPDATE enrollments
          SET ${updates.join(', ')}
          WHERE id = $1
        `;
        await query(sql, params);
      }

      return this.findEnrollmentById(id);
    } catch (err) {
      const idx = mockEnrollments.findIndex((e) => e.id === id);
      if (idx === -1) return null;
      mockEnrollments[idx] = {
        ...mockEnrollments[idx],
        ...fields,
        updatedAt: new Date(),
      };
      return mockEnrollments[idx];
    }
  }

  static async createPaymentReceipt(dto: {
    enrollmentId: number;
    receiptCode: string;
    amount: number;
    paymentMethod: PaymentMethod;
    transactionReference?: string | null;
    receiverId: number;
    notes?: string | null;
  }): Promise<PaymentReceipt> {
    try {
      const sql = `
        INSERT INTO payment_receipts (
          enrollment_id, receipt_code, amount, payment_method,
          transaction_reference, receiver_id, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const params = [
        dto.enrollmentId,
        dto.receiptCode,
        dto.amount,
        dto.paymentMethod,
        dto.transactionReference ?? null,
        dto.receiverId,
        dto.notes ?? null,
      ];
      const res = await query(sql, params);
      return mapRowToPaymentReceipt(res.rows[0]);
    } catch (err) {
      logger.warn('EnrollmentRepository.createPaymentReceipt: Fallback sang Mock Store');
      const p: PaymentReceipt = {
        id: nextReceiptId++,
        enrollmentId: dto.enrollmentId,
        receiptCode: dto.receiptCode,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        transactionReference: dto.transactionReference ?? null,
        receiverId: dto.receiverId,
        paidAt: new Date(),
        notes: dto.notes ?? null,
      };
      mockPayments.push(p);

      // Cập nhật paidAmount trong mockEnrollments
      const en = mockEnrollments.find((e) => e.id === dto.enrollmentId);
      if (en) {
        en.paidAmount += dto.amount;
        en.balanceDue = Math.max(0, en.finalAmount - en.paidAmount);
        en.paymentStatus = en.paidAmount >= en.finalAmount ? 'FULLY_PAID' : 'PARTIAL';
      }

      return p;
    }
  }

  static async getPaymentReceipts(enrollmentId: number): Promise<PaymentReceipt[]> {
    try {
      const sql = `
        SELECT p.*, u.full_name AS receiver_name
        FROM payment_receipts p
        JOIN users u ON p.receiver_id = u.id
        WHERE p.enrollment_id = $1
        ORDER BY p.id DESC
      `;
      const res = await query(sql, [enrollmentId]);
      return res.rows.map(mapRowToPaymentReceipt);
    } catch (err) {
      return mockPayments.filter((p) => p.enrollmentId === enrollmentId);
    }
  }

  static async updateLeadToEnrolled(leadId: number): Promise<void> {
    try {
      const sql = `
        UPDATE leads
        SET pipeline_stage = 'ENROLLED',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      await query(sql, [leadId]);
    } catch (err) {
      logger.warn(`EnrollmentRepository: Không thể cập nhật trạng thái Lead #${leadId} sang ENROLLED (hoặc đang dùng mock)`);
    }
  }
}
