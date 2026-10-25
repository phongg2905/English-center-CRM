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
  }

  static async generateNextReceiptCode(): Promise<string> {
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
  }

  static async findStudentByLeadId(leadId: number): Promise<Student | null> {
    const sql = `SELECT * FROM students WHERE lead_id = $1`;
    const res = await query(sql, [leadId]);
    if (res.rows.length === 0) return null;
    return mapRowToStudent(res.rows[0]);
  }

  static async findStudentByPhone(phone: string): Promise<Student | null> {
    const sql = `SELECT * FROM students WHERE phone_number = $1`;
    const res = await query(sql, [phone]);
    if (res.rows.length === 0) return null;
    return mapRowToStudent(res.rows[0]);
  }

  static async findStudentById(id: number): Promise<Student | null> {
    const sql = `SELECT * FROM students WHERE id = $1`;
    const res = await query(sql, [id]);
    if (res.rows.length === 0) return null;
    return mapRowToStudent(res.rows[0]);
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
  }

  static async findEnrollmentByStudentAndClass(
    studentId: number,
    classId: number
  ): Promise<Enrollment | null> {
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
  }

  static async findEnrollmentById(id: number): Promise<EnrollmentWithDetails | null> {
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
  }

  static async findEnrollments(filter?: {
    classId?: number;
    studentId?: number;
    paymentStatus?: string;
    status?: string;
    search?: string;
  }): Promise<EnrollmentWithDetails[]> {
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
  }

  static async getPaymentReceipts(enrollmentId: number): Promise<PaymentReceipt[]> {
    const sql = `
      SELECT p.*, u.full_name AS receiver_name
      FROM payment_receipts p
      JOIN users u ON p.receiver_id = u.id
      WHERE p.enrollment_id = $1
      ORDER BY p.id DESC
    `;
    const res = await query(sql, [enrollmentId]);
    return res.rows.map(mapRowToPaymentReceipt);
  }

  static async updateLeadToEnrolled(leadId: number): Promise<void> {
    const sql = `
      UPDATE leads
      SET pipeline_stage = 'ENROLLED',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await query(sql, [leadId]);
  }
}
