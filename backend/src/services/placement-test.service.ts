import { PlacementTestRepository, MAX_ROOM_CAPACITY } from '../repositories/placement-test.repository.js';
import { LeadRepository } from '../repositories/lead.repository.js';
import {
  PlacementTestWithDetails,
  BookTestDto,
  RecordScoreDto,
  UpdateAttendanceDto,
  PlacementTestFilterQuery,
  PaginatedPlacementTests,
  CourseRecommendation,
  ShiftSlotAvailability,
  CourseSummary,
  ClassSummary,
} from '../types/placement-test.types.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export class PlacementTestService {
  /**
   * Tính điểm IELTS Overall chuẩn quốc tế theo quy tắc làm tròn 0.25 / 0.75
   */
  static calculateIeltsOverall(
    listening?: number | null,
    reading?: number | null,
    writing?: number | null,
    speaking?: number | null
  ): number | null {
    const scores = [listening, reading, writing, speaking].filter(
      (s): s is number => typeof s === 'number' && !isNaN(s)
    );

    if (scores.length === 0) return null;

    const avg = scores.reduce((sum, val) => sum + val, 0) / scores.length;
    const whole = Math.floor(avg);
    const decimal = avg - whole;

    let rounded = whole;
    if (decimal < 0.25) {
      rounded = whole;
    } else if (decimal < 0.75) {
      rounded = whole + 0.5;
    } else {
      rounded = whole + 1.0;
    }

    return Math.min(9.0, Math.max(0.0, rounded));
  }

  /**
   * Đặt lịch thi Placement Test cho Lead (Book Test)
   * Chống trùng lịch & kiểm tra quá tải phòng thi (UC-02)
   */
  static async bookTest(
    dto: BookTestDto,
    userId: number,
    userRole: string
  ): Promise<PlacementTestWithDetails> {
    // 1. Kiểm tra Lead có tồn tại không
    const lead = await LeadRepository.findById(dto.leadId);
    if (!lead) {
      throw AppError.notFound(`Không tìm thấy hồ sơ Lead với ID = ${dto.leadId}`);
    }

    // 2. Kiểm tra ngày thi hợp lệ (định dạng YYYY-MM-DD và không thể ở quá khứ)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dto.testDate || !dateRegex.test(dto.testDate)) {
      throw AppError.badRequest('Ngày thi không hợp lệ. Định dạng yêu cầu: YYYY-MM-DD');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (dto.testDate < todayStr) {
      throw AppError.badRequest('Ngày thi không thể là ngày trong quá khứ');
    }

    if (!dto.timeSlot || dto.timeSlot.trim().length === 0) {
      throw AppError.badRequest('Khung giờ thi (timeSlot) không được để trống');
    }

    const room = dto.room && dto.room.trim() ? dto.room.trim() : 'Phòng Lab 201';
    const testType = dto.testType || (lead.interest as any) || 'IELTS';

    // 3. Kiểm tra chống trùng lịch (Anti-collision Check):
    // Lead không được có bài thi khác đang ở trạng thái SCHEDULED trong tương lai hoặc cùng ngày
    const existingActiveTest = await PlacementTestRepository.findActiveByLeadId(dto.leadId);
    if (existingActiveTest) {
      throw AppError.conflict(
        `Lead "${lead.fullName}" hiện đã có lịch thi chưa hoàn tất vào ngày ${existingActiveTest.testDate} (Ca: ${existingActiveTest.timeSlot}). Vui lòng cập nhật hoặc hủy lịch cũ trước khi tạo lịch mới.`
      );
    }

    // 4. Kiểm tra sức chứa phòng thi (Room Capacity Check):
    const currentOccupancy = await PlacementTestRepository.countRoomOccupancy(
      dto.testDate,
      dto.timeSlot,
      room
    );

    if (currentOccupancy >= MAX_ROOM_CAPACITY) {
      throw AppError.badRequest(
        `Phòng thi "${room}" trong ca "${dto.timeSlot}" ngày ${dto.testDate} đã đủ sức chứa tối đa (${currentOccupancy}/${MAX_ROOM_CAPACITY} thí sinh). Vui lòng chọn phòng thi hoặc ca thi khác.`
      );
    }

    // 5. Tạo lịch thi mới
    const createdTest = await PlacementTestRepository.create({
      leadId: dto.leadId,
      testDate: dto.testDate,
      timeSlot: dto.timeSlot,
      room,
      testType,
      notes: dto.notes,
    });

    // 6. Tự động đồng bộ trạng thái Lead sang "TEST_SCHEDULED" (Khớp với SRS FR-TEST-01 & BPMN)
    if (lead.pipelineStage !== 'ENROLLED' && lead.pipelineStage !== 'LOST') {
      try {
        await LeadRepository.updateStatus(dto.leadId, 'TEST_SCHEDULED');
      } catch (err: any) {
        logger.warn('Cập nhật pipelineStage sang TEST_SCHEDULED cho Lead thất bại:', err.message);
      }
    }

    // 7. Ghi nhận vào Nhật ký chăm sóc (Interaction Log)
    try {
      await LeadRepository.createInteraction(dto.leadId, userId, {
        interactionType: 'SYSTEM_NOTE',
        potentialLevel: 'HOT',
        content: `Đã đặt lịch hẹn kiểm tra trình độ (${testType}) vào ngày ${dto.testDate} (${dto.timeSlot}) tại ${room}.`,
      });
    } catch (err: any) {
      logger.warn('Ghi log tương tác đặt lịch thi thất bại:', err.message);
    }

    logger.info(
      `✅ Đặt lịch thi thành công: Test ID=${createdTest.id} cho Lead "${lead.fullName}" ngày ${dto.testDate} (${dto.timeSlot})`
    );

    return createdTest;
  }

  /**
   * Lấy danh sách các bài thi phân trang, lọc theo ngày/tuần/phòng/thí sinh
   */
  static async getTests(filters: PlacementTestFilterQuery): Promise<PaginatedPlacementTests> {
    return PlacementTestRepository.findAll(filters);
  }

  /**
   * Lấy chi tiết bài thi theo ID (kèm thông tin lớp học gợi ý nếu đã có điểm)
   */
  static async getTestById(
    id: number
  ): Promise<{ test: PlacementTestWithDetails; recommendedClasses?: ClassSummary[] }> {
    const test = await PlacementTestRepository.findById(id);
    if (!test) {
      throw AppError.notFound(`Không tìm thấy bài thi với ID = ${id}`);
    }

    let recommendedClasses: ClassSummary[] = [];
    if (test.suggestedCourseId) {
      recommendedClasses = await PlacementTestRepository.getOpenClassesByCourseId(
        test.suggestedCourseId
      );
    }

    return { test, recommendedClasses };
  }

  /**
   * Điểm danh thí sinh trong ca thi (PRESENT / ABSENT / CANCELLED)
   */
  static async updateAttendance(
    id: number,
    dto: UpdateAttendanceDto,
    userId: number,
    userRole: string
  ): Promise<PlacementTestWithDetails> {
    const test = await PlacementTestRepository.findById(id);
    if (!test) {
      throw AppError.notFound(`Không tìm thấy bài thi với ID = ${id}`);
    }

    const validStatuses = ['SCHEDULED', 'PRESENT', 'ABSENT', 'CANCELLED'];
    if (!validStatuses.includes(dto.attendanceStatus)) {
      throw AppError.badRequest(
        `Trạng thái điểm danh không hợp lệ. Các giá trị cho phép: ${validStatuses.join(', ')}`
      );
    }

    const updated = await PlacementTestRepository.updateAttendance(
      id,
      dto.attendanceStatus,
      dto.notes
    );

    if (!updated) {
      throw AppError.internal('Cập nhật trạng thái điểm danh thất bại');
    }

    // Nếu vắng mặt, ghi log để Sales gọi hẹn lịch lại theo BPMN EX-03
    if (dto.attendanceStatus === 'ABSENT') {
      try {
        await LeadRepository.createInteraction(test.leadId, userId, {
          interactionType: 'SYSTEM_NOTE',
          potentialLevel: 'WARM',
          content: `Thí sinh vắng mặt ca thi ngày ${test.testDate} (${test.timeSlot}). Ghi chú: ${dto.notes || 'Không có'}. Cần liên hệ sắp xếp ca thi lại.`,
        });
      } catch (err: any) {
        logger.warn('Ghi log điểm danh vắng mặt thất bại:', err.message);
      }
    }

    logger.info(`✅ Điểm danh bài thi ID=${id}: Trạng thái = ${dto.attendanceStatus}`);
    return updated;
  }

  /**
   * Thuật toán tự động đề xuất khóa học phù hợp dựa trên phổ điểm và mục tiêu (UC-SYS-03)
   */
  static async recommendCourse(
    overallScore: number,
    testType: string,
    leadInterest?: string
  ): Promise<CourseRecommendation> {
    const allCourses = await PlacementTestRepository.getActiveCourses();

    if (allCourses.length === 0) {
      throw AppError.notFound('Hệ thống chưa có khóa học nào đang mở kích hoạt');
    }

    // Ưu tiên lọc khóa học theo Test Type / Nhu cầu của học viên
    const targetCategory = (leadInterest || testType).toUpperCase();
    let eligibleCourses = allCourses;

    if (targetCategory.includes('IELTS')) {
      eligibleCourses = allCourses.filter((c) => c.courseCode.includes('IELTS'));
    } else if (targetCategory.includes('TOEIC')) {
      eligibleCourses = allCourses.filter((c) => c.courseCode.includes('TOEIC'));
    } else if (targetCategory.includes('COMM')) {
      eligibleCourses = allCourses.filter((c) => c.courseCode.includes('COMM'));
    }

    if (eligibleCourses.length === 0) {
      eligibleCourses = allCourses;
    }

    // Thuật toán so khớp điểm đầu vào:
    // Tìm khóa học mà overallScore nằm trong khoảng [minEntryScore, maxEntryScore]
    let matchedCourse: CourseSummary | undefined;
    let matchReason = '';

    // 1. So khớp chính xác trong khoảng entry score
    matchedCourse = eligibleCourses.find(
      (c) =>
        c.minEntryScore !== null &&
        c.maxEntryScore !== null &&
        overallScore >= c.minEntryScore &&
        overallScore <= c.maxEntryScore
    );

    if (matchedCourse) {
      matchReason = `Điểm Overall ${overallScore} phù hợp hoàn hảo với chuẩn đầu vào (${matchedCourse.minEntryScore} - ${matchedCourse.maxEntryScore}) của khóa học. Mục tiêu đầu ra: ${matchedCourse.targetOutput}.`;
    } else {
      // 2. Nếu điểm thấp hơn mức tối thiểu của tất cả các khóa -> Khuyên học khóa Foundation thấp nhất
      const sortedByMin = [...eligibleCourses].sort(
        (a, b) => (a.minEntryScore ?? 0) - (b.minEntryScore ?? 0)
      );
      const lowestCourse = sortedByMin[0];

      if (lowestCourse && overallScore < (lowestCourse.minEntryScore ?? 0)) {
        matchedCourse = lowestCourse;
        matchReason = `Điểm Overall ${overallScore} cần củng cố nền tảng cơ bản trước. Đề xuất học khóa Nền tảng ${lowestCourse.courseName} để xây dựng kiến thức cốt lõi.`;
      } else {
        // 3. Nếu điểm cao hơn mức tối đa của tất cả các khóa -> Khuyên học khóa Nâng cao cao nhất
        const highestCourse = sortedByMin[sortedByMin.length - 1];
        matchedCourse = highestCourse;
        matchReason = `Điểm Overall ${overallScore} đạt mức xuất sắc. Đề xuất khóa học Chuyên sâu ${highestCourse.courseName} để chinh phục mục tiêu cao nhất.`;
      }
    }

    // Lấy danh sách các lớp học mở khả dụng cho khóa học này
    const availableClasses = await PlacementTestRepository.getOpenClassesByCourseId(
      matchedCourse.id
    );

    return {
      course: matchedCourse,
      matchScore: overallScore,
      matchReason,
      availableClasses,
    };
  }

  /**
   * Nhập điểm 4 kỹ năng & Kích hoạt Thuật toán Đề xuất Khóa học (UC-02 / UC-SYS-03)
   */
  static async recordScore(
    id: number,
    dto: RecordScoreDto,
    userId: number,
    userRole: string
  ): Promise<{ test: PlacementTestWithDetails; recommendation: CourseRecommendation }> {
    const test = await PlacementTestRepository.findById(id);
    if (!test) {
      throw AppError.notFound(`Không tìm thấy bài thi với ID = ${id}`);
    }

    // Kiểm tra thang điểm hợp lệ (0.0 - 9.0)
    const scoreFields: Array<[string, number | undefined]> = [
      ['Listening', dto.listeningScore],
      ['Reading', dto.readingScore],
      ['Writing', dto.writingScore],
      ['Speaking', dto.speakingScore],
      ['Overall', dto.overallScore],
    ];

    for (const [name, val] of scoreFields) {
      if (typeof val === 'number') {
        if (isNaN(val) || val < 0.0 || val > 9.0) {
          throw AppError.badRequest(`Điểm ${name} không hợp lệ (${val}). Điểm số phải từ 0.0 đến 9.0`);
        }
      }
    }

    // Tự động tính Overall Score theo chuẩn quốc tế nếu chưa được nhập thủ công
    let overallScore = dto.overallScore;
    if (typeof overallScore !== 'number') {
      overallScore =
        this.calculateIeltsOverall(
          dto.listeningScore ?? test.listeningScore,
          dto.readingScore ?? test.readingScore,
          dto.writingScore ?? test.writingScore,
          dto.speakingScore ?? test.speakingScore
        ) ?? undefined;
    }

    const effectiveOverall = overallScore ?? 0.0;

    // Kích hoạt thuật toán tự động gợi ý khóa học (UC-SYS-03)
    let suggestedCourseId = dto.suggestedCourseId;
    let recommendation: CourseRecommendation;

    if (!suggestedCourseId) {
      recommendation = await this.recommendCourse(
        effectiveOverall,
        test.testType,
        test.leadInterest
      );
      suggestedCourseId = recommendation.course.id;
    } else {
      const allCourses = await PlacementTestRepository.getActiveCourses();
      const chosen = allCourses.find((c) => c.id === suggestedCourseId);
      if (!chosen) {
        throw AppError.notFound(`Không tìm thấy khóa học với ID = ${suggestedCourseId}`);
      }
      const openClasses = await PlacementTestRepository.getOpenClassesByCourseId(chosen.id);
      recommendation = {
        course: chosen,
        matchScore: effectiveOverall,
        matchReason: `Khóa học được cán bộ chuyên môn chỉ định thủ công. Mục tiêu đầu ra: ${chosen.targetOutput}.`,
        availableClasses: openClasses,
      };
    }

    // Cập nhật điểm số vào CSDL
    const updated = await PlacementTestRepository.updateScore(id, {
      listeningScore: dto.listeningScore ?? test.listeningScore,
      readingScore: dto.readingScore ?? test.readingScore,
      writingScore: dto.writingScore ?? test.writingScore,
      speakingScore: dto.speakingScore ?? test.speakingScore,
      overallScore: overallScore ?? test.overallScore,
      suggestedCourseId,
      examinerFeedback: dto.examinerFeedback,
    });

    if (!updated) {
      throw AppError.internal('Lưu điểm thi vào hệ thống thất bại');
    }

    // Ghi nhận vào Nhật ký chăm sóc của Lead
    try {
      await LeadRepository.createInteraction(test.leadId, userId, {
        interactionType: 'SYSTEM_NOTE',
        potentialLevel: 'HOT',
        content: `Đã có kết quả Placement Test: Overall ${effectiveOverall} (L: ${updated.listeningScore ?? '-'}, R: ${updated.readingScore ?? '-'}, W: ${updated.writingScore ?? '-'}, S: ${updated.speakingScore ?? '-'}). Đề xuất khóa học: ${recommendation.course.courseName}.`,
      });
    } catch (err: any) {
      logger.warn('Ghi log kết quả điểm thi thất bại:', err.message);
    }

    logger.info(
      `✅ Nhập điểm thi thành công ID=${id}: Overall=${overallScore}, Đề xuất khóa học "${recommendation.course.courseName}"`
    );

    return { test: updated, recommendation };
  }

  /**
   * Hủy lịch thi
   */
  static async cancelTest(id: number, userId: number): Promise<boolean> {
    const test = await PlacementTestRepository.findById(id);
    if (!test) {
      throw AppError.notFound(`Không tìm thấy bài thi với ID = ${id}`);
    }

    const success = await PlacementTestRepository.cancel(id);
    if (success) {
      try {
        await LeadRepository.createInteraction(test.leadId, userId, {
          interactionType: 'SYSTEM_NOTE',
          potentialLevel: 'COLD',
          content: `Đã hủy lịch thi ngày ${test.testDate} (${test.timeSlot}).`,
        });
      } catch (err: any) {
        logger.warn('Ghi log hủy lịch thi thất bại:', err.message);
      }
    }
    return success;
  }

  /**
   * Xóa hoàn toàn một thí sinh khỏi ca thi
   */
  static async deleteTest(id: number): Promise<boolean> {
    return PlacementTestRepository.delete(id);
  }

  /**
   * Hủy và xóa toàn bộ một ca thi
   */
  static async deleteShift(date: string, timeSlot: string, room?: string): Promise<number> {
    return PlacementTestRepository.deleteShift(date, timeSlot, room);
  }

  /**
   * Lấy tình trạng sức chứa ca thi & phòng thi theo khoảng thời gian (phục vụ Calendar View)
   */
  static async getShiftsAvailability(
    startDate: string,
    endDate: string,
    room?: string
  ): Promise<ShiftSlotAvailability[]> {
    if (!startDate || !endDate) {
      const today = new Date();
      startDate = today.toISOString().split('T')[0];
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 14);
      endDate = nextWeek.toISOString().split('T')[0];
    }
    return PlacementTestRepository.getShiftsAvailability(startDate, endDate, room);
  }
}
