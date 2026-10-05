/**
 * Định nghĩa Type & Interface cho phân hệ Placement Test (BE-04 / UC-02)
 * Quản lý ca thi, đặt lịch test, điểm danh, nhập điểm và gợi ý khóa học
 */

export type TestType = 'IELTS' | 'TOEIC' | 'GENERAL';
export type AttendanceStatus = 'SCHEDULED' | 'PRESENT' | 'ABSENT' | 'CANCELLED';

export interface PlacementTest {
  id: number;
  leadId: number;
  testDate: string; // YYYY-MM-DD
  timeSlot: string; // ví dụ: "09:00 - 10:30", "14:30 - 16:00", "18:00 - 19:30"
  room: string | null;
  testType: TestType;
  attendanceStatus: AttendanceStatus;
  listeningScore: number | null;
  readingScore: number | null;
  writingScore: number | null;
  speakingScore: number | null;
  overallScore: number | null;
  suggestedCourseId: number | null;
  examinerFeedback: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlacementTestWithDetails extends PlacementTest {
  leadFullName: string;
  leadPhoneNumber: string;
  leadEmail: string | null;
  leadInterest: string;
  assignedSalesId: number | null;
  assignedSalesName: string | null;
  suggestedCourseCode: string | null;
  suggestedCourseName: string | null;
  suggestedCourseMinScore?: number | null;
  suggestedCourseMaxScore?: number | null;
  suggestedCourseTuition?: number | null;
}

export interface BookTestDto {
  leadId: number;
  testDate: string; // YYYY-MM-DD
  timeSlot: string;
  room?: string;
  testType?: TestType;
  notes?: string;
}

export interface RecordScoreDto {
  listeningScore?: number;
  readingScore?: number;
  writingScore?: number;
  speakingScore?: number;
  overallScore?: number;
  examinerFeedback?: string;
  suggestedCourseId?: number;
}

export interface UpdateAttendanceDto {
  attendanceStatus: AttendanceStatus;
  notes?: string;
}

export interface PlacementTestFilterQuery {
  date?: string;
  startDate?: string;
  endDate?: string;
  timeSlot?: string;
  room?: string;
  testType?: TestType;
  attendanceStatus?: AttendanceStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'test_date' | 'created_at' | 'overall_score';
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedPlacementTests {
  tests: PlacementTestWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CourseSummary {
  id: number;
  courseCode: string;
  courseName: string;
  totalLessons: number;
  standardTuition: number;
  minEntryScore: number | null;
  maxEntryScore: number | null;
  targetOutput: string | null;
  description: string | null;
  isActive: boolean;
}

export interface ClassSummary {
  id: number;
  courseId: number;
  classCode: string;
  className: string;
  scheduleDays: string;
  timeSlot: string;
  room: string | null;
  teacherName: string | null;
  startDate: string;
  maxCapacity: number;
  currentEnrolled: number;
  availableSeats: number;
  status: string;
}

export interface CourseRecommendation {
  course: CourseSummary;
  matchScore: number;
  matchReason: string;
  availableClasses: ClassSummary[];
}

export interface ShiftSlotAvailability {
  testDate: string;
  timeSlot: string;
  room: string;
  totalBooked: number;
  maxCapacity: number;
  availableSeats: number;
  isFull: boolean;
}
