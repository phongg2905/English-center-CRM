import { query, isDbAvailable } from '../database/pool.js';
import {
  PlacementTest,
  PlacementTestWithDetails,
  BookTestDto,
  RecordScoreDto,
  PlacementTestFilterQuery,
  PaginatedPlacementTests,
  CourseSummary,
  ClassSummary,
  ShiftSlotAvailability,
  AttendanceStatus,
} from '../types/placement-test.types.js';
import { logger } from '../utils/logger.js';

// Cấu hình giới hạn sức chứa mặc định của phòng thi (10 thí sinh/phòng/ca)
export const MAX_ROOM_CAPACITY = 10;

// Mock Store khi chưa kết nối PostgreSQL (đồng bộ chuẩn seed_data.sql)
let mockPlacementTests: PlacementTestWithDetails[] = [
  {
    id: 1,
    leadId: 5,
    testDate: '2026-10-02',
    timeSlot: '14:30 - 16:00',
    room: 'Phòng Lab 201',
    testType: 'IELTS',
    attendanceStatus: 'SCHEDULED',
    listeningScore: null,
    readingScore: null,
    writingScore: null,
    speakingScore: null,
    overallScore: null,
    suggestedCourseId: null,
    examinerFeedback: 'Ca thi ngày mai, đã chuẩn bị đề và tai nghe.',
    createdAt: new Date('2026-10-01T10:00:00Z'),
    updatedAt: new Date('2026-10-01T10:00:00Z'),
    leadFullName: 'Nguyễn Hoàng Nam',
    leadPhoneNumber: '0912111005',
    leadEmail: 'nam.nguyenhoang@gmail.com',
    leadInterest: 'IELTS',
    assignedSalesId: 2,
    assignedSalesName: 'Long Phạm',
    suggestedCourseCode: null,
    suggestedCourseName: null,
  },
  {
    id: 2,
    leadId: 6,
    testDate: '2026-09-29',
    timeSlot: '09:00 - 10:30',
    room: 'Phòng Lab 201',
    testType: 'IELTS',
    attendanceStatus: 'PRESENT',
    listeningScore: 4.0,
    readingScore: 4.5,
    writingScore: 3.5,
    speakingScore: 4.0,
    overallScore: 4.0,
    suggestedCourseId: 1,
    examinerFeedback:
      'Phát âm chưa chuẩn âm đuôi, ngữ pháp viết câu đơn tốt nhưng chưa biết liên kết câu phức. Gợi ý học lớp Foundation.',
    createdAt: new Date('2026-09-28T09:00:00Z'),
    updatedAt: new Date('2026-09-29T11:00:00Z'),
    leadFullName: 'Trần Thu Hà',
    leadPhoneNumber: '0912111006',
    leadEmail: 'thuha.tran@gmail.com',
    leadInterest: 'IELTS',
    assignedSalesId: 2,
    assignedSalesName: 'Long Phạm',
    suggestedCourseCode: 'IELTS-FOUND',
    suggestedCourseName: 'IELTS Nền tảng (Foundation)',
    suggestedCourseMinScore: 3.0,
    suggestedCourseMaxScore: 4.5,
    suggestedCourseTuition: 6500000,
  },
  {
    id: 3,
    leadId: 7,
    testDate: '2026-09-28',
    timeSlot: '14:30 - 16:00',
    room: 'Phòng Lab 201',
    testType: 'IELTS',
    attendanceStatus: 'PRESENT',
    listeningScore: 5.0,
    readingScore: 5.5,
    writingScore: 4.5,
    speakingScore: 5.0,
    overallScore: 5.0,
    suggestedCourseId: 2,
    examinerFeedback:
      'Khả năng phản xạ nói khá tốt, phát âm rõ; cần trau dồi vốn từ vựng Task 2. Đủ tiêu chuẩn vào lớp Bứt phá Target 6.5.',
    createdAt: new Date('2026-09-27T14:00:00Z'),
    updatedAt: new Date('2026-09-28T16:30:00Z'),
    leadFullName: 'Đặng Minh Khôi',
    leadPhoneNumber: '0912111007',
    leadEmail: 'khoi.dang@gmail.com',
    leadInterest: 'IELTS',
    assignedSalesId: 2,
    assignedSalesName: 'Long Phạm',
    suggestedCourseCode: 'IELTS-FIGHT',
    suggestedCourseName: 'IELTS Bứt phá (Target 6.5)',
    suggestedCourseMinScore: 5.0,
    suggestedCourseMaxScore: 5.5,
    suggestedCourseTuition: 8500000,
  },
];

let nextTestId = 4;

// Mock Courses
const mockCourses: CourseSummary[] = [
  {
    id: 1,
    courseCode: 'IELTS-FOUND',
    courseName: 'IELTS Nền tảng (Foundation)',
    totalLessons: 24,
    standardTuition: 6500000,
    minEntryScore: 3.0,
    maxEntryScore: 4.5,
    targetOutput: 'IELTS 4.5 - 5.5',
    description: 'Xây dựng ngữ pháp cốt lõi, phát âm chuẩn IPA và từ vựng học thuật cơ bản.',
    isActive: true,
  },
  {
    id: 2,
    courseCode: 'IELTS-FIGHT',
    courseName: 'IELTS Bứt phá (Target 6.5)',
    totalLessons: 30,
    standardTuition: 8500000,
    minEntryScore: 5.0,
    maxEntryScore: 5.5,
    targetOutput: 'IELTS 6.0 - 6.5',
    description: 'Rèn luyện chiến thuật giải đề 4 kỹ năng, tối ưu hóa điểm Writing Task 2 & Speaking.',
    isActive: true,
  },
  {
    id: 3,
    courseCode: 'IELTS-MAST',
    courseName: 'IELTS Chuyên sâu (Master 7.5+)',
    totalLessons: 36,
    standardTuition: 11500000,
    minEntryScore: 6.5,
    maxEntryScore: 7.0,
    targetOutput: 'IELTS 7.5+',
    description: 'Nâng tầm tư duy biện luận, từ vựng C1-C2 và hoàn thiện tiêu chí Coherence & Lexical.',
    isActive: true,
  },
  {
    id: 4,
    courseCode: 'TOEIC-500',
    courseName: 'TOEIC Cấp tốc 550+',
    totalLessons: 20,
    standardTuition: 4500000,
    minEntryScore: 0.0,
    maxEntryScore: 4.0,
    targetOutput: 'TOEIC 550 - 650',
    description: 'Khóa học ôn thi TOEIC 2 kỹ năng Nghe - Đọc cho sinh viên chuẩn bị tốt nghiệp.',
    isActive: true,
  },
  {
    id: 5,
    courseCode: 'COMM-PRO',
    courseName: 'Tiếng Anh Giao tiếp Đi làm',
    totalLessons: 24,
    standardTuition: 5200000,
    minEntryScore: 0.0,
    maxEntryScore: 9.0,
    targetOutput: 'B1 CEFR Phản xạ',
    description: 'Giao tiếp tình huống công sở, thuyết trình, viết email chuyên nghiệp cho người đi làm.',
    isActive: true,
  },
];

// Mock Classes
const mockClasses: ClassSummary[] = [
  {
    id: 1,
    courseId: 2,
    classCode: 'IELTS-K26-T246',
    className: 'IELTS Bứt phá K26 (Tối 2-4-6)',
    scheduleDays: 'MON_WED_FRI',
    timeSlot: '18:00 - 19:30',
    room: 'Phòng 302',
    teacherName: 'Ms. Emily Nguyễn (8.5 IELTS)',
    startDate: '2026-10-15',
    maxCapacity: 15,
    currentEnrolled: 0,
    availableSeats: 15,
    status: 'OPEN',
  },
  {
    id: 2,
    courseId: 2,
    classCode: 'IELTS-K27-T357',
    className: 'IELTS Bứt phá K27 (Tối 3-5-7)',
    scheduleDays: 'TUE_THU_SAT',
    timeSlot: '19:45 - 21:15',
    room: 'Phòng 201',
    teacherName: 'Mr. David Trần (8.0 IELTS)',
    startDate: '2026-10-20',
    maxCapacity: 12,
    currentEnrolled: 0,
    availableSeats: 12,
    status: 'OPEN',
  },
  {
    id: 3,
    courseId: 1,
    classCode: 'IELTS-F20-T246',
    className: 'IELTS Nền tảng F20',
    scheduleDays: 'MON_WED_FRI',
    timeSlot: '19:45 - 21:15',
    room: 'Phòng 101',
    teacherName: 'Ms. Sarah Lê (8.0 IELTS)',
    startDate: '2026-10-18',
    maxCapacity: 15,
    currentEnrolled: 0,
    availableSeats: 15,
    status: 'OPEN',
  },
];

export class PlacementTestRepository {
  /**
   * Lấy danh sách bài test phân trang có lọc & tìm kiếm
   */
  static async findAll(filters: PlacementTestFilterQuery): Promise<PaginatedPlacementTests> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
    const offset = (page - 1) * limit;

    if (isDbAvailable()) {
      try {
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

        // Đếm tổng số bản ghi
        const countSql = `
          SELECT COUNT(*) AS total
          FROM placement_tests pt
          JOIN leads l ON pt.lead_id = l.id
          ${whereClause}
        `;

        // Lấy đồng thời cả tổng số bản ghi và dữ liệu qua Promise.all để giảm độ trễ mạng
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
      } catch (err: any) {
        logger.warn('Truy vấn CSDL cho placement_tests thất bại, chuyển về Mock Store:', err.message);
      }
    }

    // Mock In-Memory Implementation
    let filtered = [...mockPlacementTests];

    if (filters.date) {
      filtered = filtered.filter((t) => t.testDate === filters.date);
    }
    if (filters.startDate) {
      filtered = filtered.filter((t) => t.testDate >= filters.startDate!);
    }
    if (filters.endDate) {
      filtered = filtered.filter((t) => t.testDate <= filters.endDate!);
    }
    if (filters.timeSlot) {
      filtered = filtered.filter((t) => t.timeSlot === filters.timeSlot);
    }
    if (filters.room) {
      filtered = filtered.filter((t) => t.room === filters.room);
    }
    if (filters.testType) {
      filtered = filtered.filter((t) => t.testType === filters.testType);
    }
    if (filters.attendanceStatus) {
      filtered = filtered.filter((t) => t.attendanceStatus === filters.attendanceStatus);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.leadFullName.toLowerCase().includes(searchLower) ||
          t.leadPhoneNumber.includes(searchLower)
      );
    }

    // Sắp xếp
    filtered.sort((a, b) => {
      if (filters.sortBy === 'overall_score') {
        const scoreA = a.overallScore ?? -1;
        const scoreB = b.overallScore ?? -1;
        return filters.sortOrder === 'DESC' ? scoreB - scoreA : scoreA - scoreB;
      }
      if (filters.sortBy === 'created_at') {
        return filters.sortOrder === 'DESC'
          ? b.createdAt.getTime() - a.createdAt.getTime()
          : a.createdAt.getTime() - b.createdAt.getTime();
      }
      return filters.sortOrder === 'DESC'
        ? b.testDate.localeCompare(a.testDate)
        : a.testDate.localeCompare(b.testDate);
    });

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      tests: paginated,
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
    if (isDbAvailable()) {
      try {
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
      } catch (err: any) {
        logger.warn('Truy vấn CSDL findById thất bại, chuyển về Mock Store:', err.message);
      }
    }

    const test = mockPlacementTests.find((t) => t.id === id);
    return test || null;
  }

  /**
   * Tìm bài test đang kích hoạt của một Lead (để kiểm tra chống đặt lịch trùng)
   */
  static async findActiveByLeadId(
    leadId: number,
    date?: string,
    timeSlot?: string
  ): Promise<PlacementTest | null> {
    if (isDbAvailable()) {
      try {
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
      } catch (err: any) {
        logger.warn('findActiveByLeadId CSDL thất bại, chuyển sang Mock:', err.message);
      }
    }

    const found = mockPlacementTests.find((t) => {
      if (t.leadId !== leadId || t.attendanceStatus !== 'SCHEDULED') return false;
      if (date && timeSlot) {
        return t.testDate === date && t.timeSlot === timeSlot;
      }
      return true;
    });

    return found || null;
  }

  /**
   * Đếm số lượng thí sinh đã đăng ký trong một phòng và ca thi cụ thể (để kiểm tra quá tải sức chứa)
   */
  static async countRoomOccupancy(date: string, timeSlot: string, room: string): Promise<number> {
    if (isDbAvailable()) {
      try {
        const sql = `
          SELECT COUNT(*) AS count
          FROM placement_tests
          WHERE test_date = $1 AND time_slot = $2 AND room = $3 AND attendance_status != 'CANCELLED'
        `;
        const res = await query(sql, [date, timeSlot, room]);
        return parseInt(res.rows[0]?.count || '0', 10);
      } catch (err: any) {
        logger.warn('countRoomOccupancy CSDL thất bại:', err.message);
      }
    }

    return mockPlacementTests.filter(
      (t) =>
        t.testDate === date &&
        t.timeSlot === timeSlot &&
        t.room === room &&
        t.attendanceStatus !== 'CANCELLED'
    ).length;
  }

  /**
   * Đặt lịch thi mới (Create Placement Test)
   */
  static async create(data: BookTestDto & { room: string; testType: string }): Promise<PlacementTestWithDetails> {
    if (isDbAvailable()) {
      try {
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
        if (testWithDetails) return testWithDetails;
      } catch (err: any) {
        logger.warn('Lưu CSDL placement_tests thất bại, lưu vào Mock:', err.message);
      }
    }

    // Mock In-Memory Store
    const newTest: PlacementTestWithDetails = {
      id: nextTestId++,
      leadId: data.leadId,
      testDate: data.testDate,
      timeSlot: data.timeSlot,
      room: data.room,
      testType: data.testType as any,
      attendanceStatus: 'SCHEDULED',
      listeningScore: null,
      readingScore: null,
      writingScore: null,
      speakingScore: null,
      overallScore: null,
      suggestedCourseId: null,
      examinerFeedback: data.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      leadFullName: 'Thí sinh mới',
      leadPhoneNumber: '09xxxxxxxx',
      leadEmail: null,
      leadInterest: data.testType,
      assignedSalesId: null,
      assignedSalesName: null,
      suggestedCourseCode: null,
      suggestedCourseName: null,
    };
    mockPlacementTests.unshift(newTest);
    return newTest;
  }

  /**
   * Cập nhật trạng thái điểm danh thí sinh
   */
  static async updateAttendance(
    id: number,
    status: AttendanceStatus,
    notes?: string
  ): Promise<PlacementTestWithDetails | null> {
    if (isDbAvailable()) {
      try {
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
      } catch (err: any) {
        logger.warn('updateAttendance CSDL thất bại, update Mock:', err.message);
      }
    }

    const test = mockPlacementTests.find((t) => t.id === id);
    if (!test) return null;
    test.attendanceStatus = status;
    if (notes) test.examinerFeedback = notes;
    test.updatedAt = new Date();
    return test;
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
    if (isDbAvailable()) {
      try {
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
      } catch (err: any) {
        logger.warn('updateScore CSDL thất bại, update Mock:', err.message);
      }
    }

    const test = mockPlacementTests.find((t) => t.id === id);
    if (!test) return null;
    test.listeningScore = data.listeningScore;
    test.readingScore = data.readingScore;
    test.writingScore = data.writingScore;
    test.speakingScore = data.speakingScore;
    test.overallScore = data.overallScore;
    test.suggestedCourseId = data.suggestedCourseId;
    if (data.examinerFeedback) test.examinerFeedback = data.examinerFeedback;
    test.attendanceStatus = 'PRESENT';
    test.updatedAt = new Date();

    if (data.suggestedCourseId) {
      const course = mockCourses.find((c) => c.id === data.suggestedCourseId);
      if (course) {
        test.suggestedCourseCode = course.courseCode;
        test.suggestedCourseName = course.courseName;
        test.suggestedCourseMinScore = course.minEntryScore;
        test.suggestedCourseMaxScore = course.maxEntryScore;
        test.suggestedCourseTuition = course.standardTuition;
      }
    }

    return test;
  }

  /**
   * Hủy lịch thi (Đánh dấu CANCELLED)
   */
  static async cancel(id: number): Promise<boolean> {
    if (isDbAvailable()) {
      try {
        const sql = `UPDATE placement_tests SET attendance_status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`;
        await query(sql, [id]);
        return true;
      } catch (err: any) {
        logger.warn('cancel CSDL thất bại:', err.message);
      }
    }
    const test = mockPlacementTests.find((t) => t.id === id);
    if (test) {
      test.attendanceStatus = 'CANCELLED';
      test.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Xóa hoàn toàn một thí sinh khỏi ca thi
   */
  static async delete(id: number): Promise<boolean> {
    if (isDbAvailable()) {
      try {
        const sql = `DELETE FROM placement_tests WHERE id = $1`;
        const res = await query(sql, [id]);
        return (res.rowCount || 0) > 0;
      } catch (err: any) {
        logger.warn('delete CSDL thất bại:', err.message);
      }
    }
    const idx = mockPlacementTests.findIndex((t) => t.id === id);
    if (idx !== -1) {
      mockPlacementTests.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * Xóa / Hủy toàn bộ ca thi theo Ngày, Khung giờ và Phòng
   */
  static async deleteShift(date: string, timeSlot: string, room?: string): Promise<number> {
    if (isDbAvailable()) {
      try {
        let sql = `DELETE FROM placement_tests WHERE test_date = $1 AND time_slot = $2`;
        const params: any[] = [date, timeSlot];
        if (room && room !== 'ALL') {
          sql += ` AND (room = $3 OR room ILIKE $3)`;
          params.push(room);
        }
        const res = await query(sql, params);
        return res.rowCount || 0;
      } catch (err: any) {
        logger.warn('deleteShift CSDL thất bại:', err.message);
      }
    }
    const beforeCount = mockPlacementTests.length;
    mockPlacementTests = mockPlacementTests.filter((t) => {
      if (t.testDate !== date || t.timeSlot !== timeSlot) return true;
      if (room && room !== 'ALL' && t.room !== room) return true;
      return false;
    });
    return beforeCount - mockPlacementTests.length;
  }

  /**
   * Lấy danh mục tất cả khóa học đang kích hoạt
   */
  static async getActiveCourses(): Promise<CourseSummary[]> {
    if (isDbAvailable()) {
      try {
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
      } catch (err: any) {
        logger.warn('getActiveCourses CSDL thất bại, dùng Mock:', err.message);
      }
    }

    return mockCourses.filter((c) => c.isActive);
  }

  /**
   * Lấy các lớp học đang mở tuyển sinh của một khóa học kèm sĩ số khả dụng
   */
  static async getOpenClassesByCourseId(courseId: number): Promise<ClassSummary[]> {
    if (isDbAvailable()) {
      try {
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
      } catch (err: any) {
        logger.warn('getOpenClassesByCourseId CSDL thất bại, dùng Mock:', err.message);
      }
    }

    return mockClasses
      .filter((c) => c.courseId === courseId && c.status === 'OPEN')
      .map((c) => ({
        ...c,
        availableSeats: Math.max(0, c.maxCapacity - c.currentEnrolled),
      }));
  }

  /**
   * Lấy thông tin thống kê sức chứa và lịch ca thi theo ngày / tuần
   */
  static async getShiftsAvailability(
    startDate: string,
    endDate: string,
    room?: string
  ): Promise<ShiftSlotAvailability[]> {
    const defaultSlots = ['09:00 - 10:30', '14:30 - 16:00', '18:00 - 19:30'];
    const defaultRooms = room ? [room] : ['Phòng Lab 201', 'Phòng Lab 101', 'Phòng 302'];

    if (isDbAvailable()) {
      try {
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
      } catch (err: any) {
        logger.warn('getShiftsAvailability CSDL thất bại, dùng Mock:', err.message);
      }
    }

    // Mock aggregate
    const result: ShiftSlotAvailability[] = [];
    const testsInRange = mockPlacementTests.filter(
      (t) => t.testDate >= startDate && t.testDate <= endDate && t.attendanceStatus !== 'CANCELLED'
    );

    const map = new Map<string, number>();
    for (const t of testsInRange) {
      const r = t.room || 'Phòng Lab 201';
      if (room && r !== room) continue;
      const key = `${t.testDate}_${t.timeSlot}_${r}`;
      map.set(key, (map.get(key) || 0) + 1);
    }

    for (const [key, booked] of map.entries()) {
      const [testDate, timeSlot, r] = key.split('_');
      result.push({
        testDate,
        timeSlot,
        room: r,
        totalBooked: booked,
        maxCapacity: MAX_ROOM_CAPACITY,
        availableSeats: Math.max(0, MAX_ROOM_CAPACITY - booked),
        isFull: booked >= MAX_ROOM_CAPACITY,
      });
    }

    return result;
  }
}
