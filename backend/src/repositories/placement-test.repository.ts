import { query } from '../database/pool.js';
import {
  PlacementTest,
  PlacementTestWithDetails,
  BookTestDto,
  PlacementTestFilterQuery,
  PaginatedPlacementTests,
  CourseSummary,
  ClassSummary,
  ShiftSlotAvailability,
  AttendanceStatus,
} from '../types/placement-test.types.js';

// Cấu hình giới hạn sức chứa mặc định của phòng thi (10 thí sinh/phòng/ca)
export const MAX_ROOM_CAPACITY = 10;

export class PlacementTestRepository {
  /**
   * Lấy danh sách bài test phân trang kèm bộ lọc đa tiêu chí
   */
  static async findAll(filters: PlacementTestFilterQuery): Promise<PaginatedPlacementTests> {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.date) {
      conditions.push(`pt.test_date = $${paramIndex++}`);
      params.push(filters.date);
    }

    if (filters.startDate) {
      conditions.push(`pt.test_date >= $${paramIndex++}`);
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push(`pt.test_date <= $${paramIndex++}`);
      params.push(filters.endDate);
    }

    if (filters.timeSlot) {
      conditions.push(`pt.time_slot = $${paramIndex++}`);
      params.push(filters.timeSlot);
    }

    if (filters.room) {
      conditions.push(`pt.room = $${paramIndex++}`);
      params.push(filters.room);
    }

    if (filters.testType) {
      conditions.push(`pt.test_type = $${paramIndex++}`);
      params.push(filters.testType);
    }

    if (filters.attendanceStatus) {
      conditions.push(`pt.attendance_status = $${paramIndex++}`);
      params.push(filters.attendanceStatus);
    }

    if (filters.search) {
      conditions.push(`(l.full_name ILIKE $${paramIndex} OR l.phone_number ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) AS total
      FROM placement_tests pt
      JOIN leads l ON pt.lead_id = l.id
      ${whereClause}
    `;

    const sortColumn =
      filters.sortBy === 'overall_score'
        ? 'pt.overall_score'
        : filters.sortBy === 'created_at'
        ? 'pt.created_at'
        : 'pt.test_date';
    const sortDirection = filters.sortOrder === 'DESC' ? 'DESC' : 'ASC';

    const dataSql = `
      SELECT 
        pt.id,
        pt.lead_id AS "leadId",
        pt.test_date::text AS "testDate",
        pt.time_slot AS "timeSlot",
        pt.room,
        pt.test_type AS "testType",
        pt.attendance_status AS "attendanceStatus",
        pt.listening_score::float AS "listeningScore",
        pt.reading_score::float AS "readingScore",
        pt.writing_score::float AS "writingScore",
        pt.speaking_score::float AS "speakingScore",
        pt.overall_score::float AS "overallScore",
        pt.suggested_course_id AS "suggestedCourseId",
        pt.examiner_feedback AS "examinerFeedback",
        pt.created_at AS "createdAt",
        pt.updated_at AS "updatedAt",
        l.full_name AS "leadFullName",
        l.phone_number AS "leadPhoneNumber",
        l.email AS "leadEmail",
        l.interest AS "leadInterest",
        l.assigned_sales_id AS "assignedSalesId",
        u.full_name AS "assignedSalesName",
        c.course_code AS "suggestedCourseCode",
        c.course_name AS "suggestedCourseName",
        c.min_entry_score::float AS "suggestedCourseMinScore",
        c.max_entry_score::float AS "suggestedCourseMaxScore",
        c.standard_tuition::float AS "suggestedCourseTuition"
      FROM placement_tests pt
      JOIN leads l ON pt.lead_id = l.id
      LEFT JOIN users u ON l.assigned_sales_id = u.id
      LEFT JOIN courses c ON pt.suggested_course_id = c.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}, pt.time_slot ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const [countResult, dataResult] = await Promise.all([
      query(countSql, params),
      query(dataSql, [...params, limit, offset]),
    ]);

    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    return {
      tests: dataResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Lấy chi tiết một bài test theo ID
   */
  static async findById(id: number): Promise<PlacementTestWithDetails | null> {
    const sql = `
      SELECT 
        pt.id,
        pt.lead_id AS "leadId",
        pt.test_date::text AS "testDate",
        pt.time_slot AS "timeSlot",
        pt.room,
        pt.test_type AS "testType",
        pt.attendance_status AS "attendanceStatus",
        pt.listening_score::float AS "listeningScore",
        pt.reading_score::float AS "readingScore",
        pt.writing_score::float AS "writingScore",
        pt.speaking_score::float AS "speakingScore",
        pt.overall_score::float AS "overallScore",
        pt.suggested_course_id AS "suggestedCourseId",
        pt.examiner_feedback AS "examinerFeedback",
        pt.created_at AS "createdAt",
        pt.updated_at AS "updatedAt",
        l.full_name AS "leadFullName",
        l.phone_number AS "leadPhoneNumber",
        l.email AS "leadEmail",
        l.interest AS "leadInterest",
        l.assigned_sales_id AS "assignedSalesId",
        u.full_name AS "assignedSalesName",
        c.course_code AS "suggestedCourseCode",
        c.course_name AS "suggestedCourseName",
        c.min_entry_score::float AS "suggestedCourseMinScore",
        c.max_entry_score::float AS "suggestedCourseMaxScore",
        c.standard_tuition::float AS "suggestedCourseTuition"
      FROM placement_tests pt
      JOIN leads l ON pt.lead_id = l.id
      LEFT JOIN users u ON l.assigned_sales_id = u.id
      LEFT JOIN courses c ON pt.suggested_course_id = c.id
      WHERE pt.id = $1
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  }

  /**
   * Tìm bài test đang kích hoạt của một Lead (để kiểm tra chống đặt lịch trùng)
   */
  static async findActiveByLeadId(
    leadId: number,
    date?: string,
    timeSlot?: string
  ): Promise<PlacementTest | null> {
    let sql = `
      SELECT 
        id,
        lead_id AS "leadId",
        test_date::text AS "testDate",
        time_slot AS "timeSlot",
        room,
        test_type AS "testType",
        attendance_status AS "attendanceStatus",
        listening_score::float AS "listeningScore",
        reading_score::float AS "readingScore",
        writing_score::float AS "writingScore",
        speaking_score::float AS "speakingScore",
        overall_score::float AS "overallScore",
        suggested_course_id AS "suggestedCourseId",
        examiner_feedback AS "examinerFeedback",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM placement_tests
      WHERE lead_id = $1 AND attendance_status IN ('SCHEDULED')
    `;
    const params: any[] = [leadId];
    if (date && timeSlot) {
      sql += ` AND test_date = $2 AND time_slot = $3`;
      params.push(date, timeSlot);
    }
    sql += ` LIMIT 1`;
    const res = await query(sql, params);
    return res.rows[0] || null;
  }

  /**
   * Đếm số lượng thí sinh đã đăng ký trong một phòng và ca thi cụ thể
   */
  static async countRoomOccupancy(date: string, timeSlot: string, room: string): Promise<number> {
    const sql = `
      SELECT COUNT(*) AS count
      FROM placement_tests
      WHERE test_date = $1 AND time_slot = $2 AND room = $3 AND attendance_status != 'CANCELLED'
    `;
    const res = await query(sql, [date, timeSlot, room]);
    return parseInt(res.rows[0]?.count || '0', 10);
  }

  /**
   * Đặt lịch thi mới (Create Placement Test)
   */
  static async create(data: BookTestDto & { room: string; testType: string }): Promise<PlacementTestWithDetails> {
    const insertSql = `
      INSERT INTO placement_tests (
        lead_id, test_date, time_slot, room, test_type, attendance_status, examiner_feedback
      ) VALUES ($1, $2, $3, $4, $5, 'SCHEDULED', $6)
      RETURNING id
    `;
    const insertRes = await query(insertSql, [
      data.leadId,
      data.testDate,
      data.timeSlot,
      data.room,
      data.testType,
      data.notes || null,
    ]);
    const newId = insertRes.rows[0].id;
    const testWithDetails = await this.findById(newId);
    if (!testWithDetails) throw new Error('Không thể tải bài thi vừa tạo');
    return testWithDetails;
  }

  /**
   * Cập nhật trạng thái điểm danh thí sinh
   */
  static async updateAttendance(
    id: number,
    status: AttendanceStatus,
    notes?: string
  ): Promise<PlacementTestWithDetails | null> {
    const sql = `
      UPDATE placement_tests
      SET attendance_status = $1,
          examiner_feedback = COALESCE($2, examiner_feedback),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id
    `;
    await query(sql, [status, notes || null, id]);
    return this.findById(id);
  }

  /**
   * Nhập điểm 4 kỹ năng & cập nhật kết quả đánh giá năng lực
   */
  static async updateScore(
    id: number,
    data: {
      listeningScore: number | null;
      readingScore: number | null;
      writingScore: number | null;
      speakingScore: number | null;
      overallScore: number | null;
      suggestedCourseId: number | null;
      examinerFeedback?: string;
    }
  ): Promise<PlacementTestWithDetails | null> {
    const sql = `
      UPDATE placement_tests
      SET listening_score = $1,
          reading_score = $2,
          writing_score = $3,
          speaking_score = $4,
          overall_score = $5,
          suggested_course_id = $6,
          examiner_feedback = COALESCE($7, examiner_feedback),
          attendance_status = 'PRESENT',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING id
    `;
    await query(sql, [
      data.listeningScore,
      data.readingScore,
      data.writingScore,
      data.speakingScore,
      data.overallScore,
      data.suggestedCourseId,
      data.examinerFeedback || null,
      id,
    ]);
    return this.findById(id);
  }

  /**
   * Hủy lịch thi (Đánh dấu CANCELLED)
   */
  static async cancel(id: number): Promise<boolean> {
    const sql = `UPDATE placement_tests SET attendance_status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`;
    const res = await query(sql, [id]);
    return (res.rowCount || 0) > 0;
  }

  /**
   * Xóa hoàn toàn một thí sinh khỏi ca thi
   */
  static async delete(id: number): Promise<boolean> {
    const sql = `DELETE FROM placement_tests WHERE id = $1`;
    const res = await query(sql, [id]);
    return (res.rowCount || 0) > 0;
  }

  /**
   * Xóa / Hủy toàn bộ ca thi theo Ngày, Khung giờ và Phòng
   */
  static async deleteShift(date: string, timeSlot: string, room?: string): Promise<number> {
    let sql = `DELETE FROM placement_tests WHERE test_date = $1 AND time_slot = $2`;
    const params: any[] = [date, timeSlot];
    if (room && room !== 'ALL') {
      sql += ` AND (room = $3 OR room ILIKE $3)`;
      params.push(room);
    }
    const res = await query(sql, params);
    return res.rowCount || 0;
  }

  /**
   * Lấy danh mục tất cả khóa học đang kích hoạt
   */
  static async getActiveCourses(): Promise<CourseSummary[]> {
    const sql = `
      SELECT 
        id,
        course_code AS "courseCode",
        course_name AS "courseName",
        total_lessons AS "totalLessons",
        standard_tuition::float AS "standardTuition",
        min_entry_score::float AS "minEntryScore",
        max_entry_score::float AS "maxEntryScore",
        target_output AS "targetOutput",
        description,
        is_active AS "isActive"
      FROM courses
      WHERE is_active = TRUE
      ORDER BY min_entry_score ASC NULLS FIRST, id ASC
    `;
    const res = await query(sql);
    return res.rows;
  }

  /**
   * Lấy các lớp học đang mở tuyển sinh của một khóa học kèm sĩ số khả dụng
   */
  static async getOpenClassesByCourseId(courseId: number): Promise<ClassSummary[]> {
    const sql = `
      SELECT 
        id,
        course_id AS "courseId",
        class_code AS "classCode",
        class_name AS "className",
        schedule_days AS "scheduleDays",
        time_slot AS "timeSlot",
        room,
        teacher_name AS "teacherName",
        start_date::text AS "startDate",
        max_capacity AS "maxCapacity",
        current_enrolled AS "currentEnrolled",
        (max_capacity - current_enrolled) AS "availableSeats",
        status
      FROM classes
      WHERE course_id = $1 AND status = 'OPEN'
      ORDER BY start_date ASC
    `;
    const res = await query(sql, [courseId]);
    return res.rows;
  }

  /**
   * Lấy thông tin thống kê sức chứa và lịch ca thi theo ngày / tuần
   */
  static async getShiftsAvailability(
    startDate: string,
    endDate: string,
    room?: string
  ): Promise<ShiftSlotAvailability[]> {
    let sql = `
      SELECT 
        test_date::text AS "testDate",
        time_slot AS "timeSlot",
        COALESCE(room, 'Phòng Lab 201') AS "room",
        COUNT(*) AS "totalBooked"
      FROM placement_tests
      WHERE test_date >= $1 AND test_date <= $2 AND attendance_status != 'CANCELLED'
    `;
    const params: any[] = [startDate, endDate];
    if (room) {
      sql += ` AND room = $3`;
      params.push(room);
    }
    sql += ` GROUP BY test_date, time_slot, room ORDER BY test_date ASC, time_slot ASC`;

    const res = await query(sql, params);
    return res.rows.map((r: any) => {
      const booked = parseInt(r.totalBooked, 10);
      return {
        testDate: r.testDate,
        timeSlot: r.timeSlot,
        room: r.room,
        totalBooked: booked,
        maxCapacity: MAX_ROOM_CAPACITY,
        availableSeats: Math.max(0, MAX_ROOM_CAPACITY - booked),
        isFull: booked >= MAX_ROOM_CAPACITY,
      };
    });
  }
}
