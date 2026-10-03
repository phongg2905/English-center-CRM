/**
 * Types & Interfaces cho Phân hệ Placement Test (FE-04A / BE-04 / UC-02)
 * Quản lý lịch ca thi, điểm danh thí sinh và cảnh báo sức chứa phòng thi
 */

export type TestType = 'IELTS' | 'TOEIC' | 'GENERAL';

export type AttendanceStatus = 'SCHEDULED' | 'PRESENT' | 'ABSENT' | 'CANCELLED';

export interface PlacementTest {
  id: number;
  leadId: number;
  testDate: string; // YYYY-MM-DD
  timeSlot: string; // e.g., "09:00 - 10:30", "14:30 - 16:00", "18:00 - 19:30"
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
  createdAt: string;
  updatedAt: string;
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

export interface UpdateAttendanceDto {
  attendanceStatus: AttendanceStatus;
  notes?: string;
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

export interface PaginatedPlacementTestsResponse {
  tests: PlacementTestWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LeadSimple {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  status: string;
  targetSubject?: string;
  assignedTo?: string | null;
}
