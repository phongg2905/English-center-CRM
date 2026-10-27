import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  Printer,
  Sparkles,
} from 'lucide-react';

import { AcademicService } from '../../services/academic.service';
import { LeadService } from '../../services/lead.service';
import type {
  ClassItem,
  CourseItem,
  ClassEnrollmentItem,
  PaymentReceipt,
  PaymentMethod,
} from '../../types/academic';
import type { LeadWithDetails } from '../../types/lead';
import { Button } from '../../components/ui';

interface EnrollStudentWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEnrollment?: ClassEnrollmentItem) => void;
  initialClassId?: number;
  initialLeadId?: number;
  onPrintReceipt?: (receipt: PaymentReceipt, enrollment: ClassEnrollmentItem) => void;
}

type WizardStep = 1 | 2 | 3 | 4;

const STAGE_LABEL_MAP: Record<string, string> = {
  NEW: 'Lead mới',
  CONTACTING: 'Đang tư vấn',
  TEST_SCHEDULED: 'Đã hẹn test',
  ENROLLED: 'Đã nhập học',
  LOST: 'Ngưng theo dõi',
};

export const EnrollStudentWizardModal: React.FC<EnrollStudentWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialClassId,
  initialLeadId,
  onPrintReceipt,
}) => {
  // Stepper state
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Meta data (seed from cache immediately if available)
  const [courses, setCourses] = useState<CourseItem[]>(() => AcademicService.peekCourses() || []);
  const [classes, setClasses] = useState<ClassItem[]>(() => AcademicService.peekClasses() || []);
  const [leads, setLeads] = useState<LeadWithDetails[]>([]);

  // Search & Filter
  const [leadSearchQuery, setLeadSearchQuery] = useState<string>('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('ALL');

  // Candidate Mode: 'LEAD' | 'MANUAL'
  const [candidateMode, setCandidateMode] = useState<'LEAD' | 'MANUAL'>('LEAD');
  const [selectedLead, setSelectedLead] = useState<LeadWithDetails | null>(null);

  // Manual Candidate Form
  const [manualFullName, setManualFullName] = useState<string>('');
  const [manualPhone, setManualPhone] = useState<string>('');
  const [manualEmail, setManualEmail] = useState<string>('');
  const [manualDob, setManualDob] = useState<string>('');
  const [manualAddress, setManualAddress] = useState<string>('');

  // Selected Class
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);

  // Step 3: Tuition & Payment
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [enrollmentNotes, setEnrollmentNotes] = useState<string>('');
  const [collectPaymentNow, setCollectPaymentNow] = useState<boolean>(true);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('Thu học phí đợt 1 khi nhập học');

  // Step 4: Success Result
  const [createdEnrollment, setCreatedEnrollment] = useState<ClassEnrollmentItem | null>(null);
  const [createdReceipt, setCreatedReceipt] = useState<PaymentReceipt | null>(null);

  // Loading & Error States
  const [isLoadingMeta, setIsLoadingMeta] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load Data on Open
  useEffect(() => {
    if (!isOpen) return;

    // Reset state
    setCurrentStep(1);
    setSelectedLead(null);
    setManualFullName('');
    setManualPhone('');
    setManualEmail('');
    setManualDob('');
    setManualAddress('');
    setSelectedClass(null);
    setDiscountAmount(0);
    setEnrollmentNotes('');
    setCollectPaymentNow(true);
    setCreatedEnrollment(null);
    setCreatedReceipt(null);
    setErrorMsg(null);

    const loadMeta = async () => {
      try {
        const hasCached = Boolean(AcademicService.peekCourses() && AcademicService.peekClasses());
        if (!hasCached) setIsLoadingMeta(true);

        const [cList, clsList, leadsData] = await Promise.all([
          AcademicService.getCourses(),
          AcademicService.getClasses(),
          LeadService.getLeads({ limit: 80 }).catch(() => ({ leads: [] })),
        ]);
        setCourses(cList);
        setClasses(clsList);

        // Prioritize non-enrolled leads at top
        const rawLeads: LeadWithDetails[] = leadsData.leads || [];
        const priorityRank: Record<string, number> = {
          TEST_SCHEDULED: 1,
          CONTACTING: 2,
          NEW: 3,
          ENROLLED: 4,
          LOST: 5,
        };
        const sortedLeads = [...rawLeads].sort(
          (a, b) => (priorityRank[a.pipelineStage] || 9) - (priorityRank[b.pipelineStage] || 9)
        );
        setLeads(sortedLeads);

        if (initialLeadId) {
          const matchedLead = sortedLeads.find((l) => l.id === initialLeadId);
          if (matchedLead) {
            setCandidateMode('LEAD');
            setSelectedLead(matchedLead);
          } else {
            LeadService.getLeadById(initialLeadId)
              .then((lead) => {
                if (lead) {
                  setLeads((prev) => [lead, ...prev.filter((p) => p.id !== lead.id)]);
                  setCandidateMode('LEAD');
                  setSelectedLead(lead);
                }
              })
              .catch(() => {});
          }
        }

        if (initialClassId) {
          const match = clsList.find((c) => c.id === initialClassId);
          if (match && !match.isFull && match.currentEnrolled < match.maxCapacity) {
            setSelectedClass(match);
            setPaymentAmount(match.standardTuition);
          }
        }
      } catch (err: any) {
        console.error('Lỗi khi tải dữ liệu cho Wizard xếp lớp:', err);
        setErrorMsg('Không thể tải danh sách khóa học và lớp học');
      } finally {
        setIsLoadingMeta(false);
      }
    };

    loadMeta();
  }, [isOpen, initialClassId, initialLeadId]);

  // Recalculate default payment amount when class or discount changes
  useEffect(() => {
    if (selectedClass) {
      const netTuition = Math.max(0, (selectedClass.standardTuition || 0) - discountAmount);
      if (collectPaymentNow && (paymentAmount === 0 || paymentAmount > netTuition)) {
        setPaymentAmount(netTuition);
      }
    }
  }, [selectedClass, discountAmount, collectPaymentNow]);

  // Filter leads
  const filteredLeads = leads.filter((l) => {
    const q = leadSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      l.fullName.toLowerCase().includes(q) ||
      l.phoneNumber.includes(q) ||
      (l.email && l.email.toLowerCase().includes(q))
    );
  });

  // Filter classes
  const filteredClasses = classes.filter((c) => {
    if (selectedCourseFilter !== 'ALL' && c.courseId.toString() !== selectedCourseFilter) {
      return false;
    }
    return true;
  });

  // Navigation handlers
  const handleNextFromStep1 = () => {
    setErrorMsg(null);
    if (candidateMode === 'LEAD') {
      if (!selectedLead) {
        setErrorMsg('Vui lòng chọn một học viên/khách hàng từ danh sách Lead');
        return;
      }
    } else {
      if (!manualFullName.trim() || !manualPhone.trim()) {
        setErrorMsg('Họ tên và Số điện thoại học viên là bắt buộc');
        return;
      }
      const cleanPhone = manualPhone.trim().replace(/\s+/g, '');
      if (!/^0\d{9}$/.test(cleanPhone)) {
        setErrorMsg('Số điện thoại học viên phải gồm đúng 10 chữ số (bắt đầu bằng số 0)');
        return;
      }
    }
    setCurrentStep(2);
  };

  const handleNextFromStep2 = () => {
    setErrorMsg(null);
    if (!selectedClass) {
      setErrorMsg('Vui lòng chọn một lớp học còn sĩ số khả dụng');
      return;
    }
    if (selectedClass.isFull || selectedClass.currentEnrolled >= selectedClass.maxCapacity) {
      setErrorMsg(
        `Lớp ${selectedClass.classCode} đã đạt sĩ số tối đa (${selectedClass.currentEnrolled}/${selectedClass.maxCapacity}). Vui lòng chọn lớp khác.`
      );
      return;
    }

    const netTuition = Math.max(0, (selectedClass.standardTuition || 0) - discountAmount);
    setPaymentAmount(netTuition);
    setCurrentStep(3);
  };

  // Submit Enrollment & Initial Payment
  const handleSubmitEnrollment = async () => {
    if (!selectedClass) return;
    setErrorMsg(null);

    const netTuition = Math.max(0, (selectedClass.standardTuition || 0) - discountAmount);
    if (collectPaymentNow) {
      if (paymentAmount <= 0) {
        setErrorMsg('Số tiền nộp phải lớn hơn 0 khi chọn ghi nhận đóng học phí');
        return;
      }
      if (paymentAmount > netTuition) {
        setErrorMsg('Số tiền nộp không được vượt quá học phí thực tế sau chiết khấu');
        return;
      }
    }

    try {
      setIsSubmitting(true);

      // 1. Prepare Enrollment Payload
      const payload: any = {
        classId: selectedClass.id,
        discountAmount: discountAmount || 0,
        notes: enrollmentNotes.trim() || undefined,
      };

      if (candidateMode === 'LEAD' && selectedLead) {
        payload.leadId = selectedLead.id;
      } else {
        payload.candidateInfo = {
          fullName: manualFullName.trim(),
          phoneNumber: manualPhone.trim().replace(/\s+/g, ''),
          email: manualEmail.trim() || undefined,
          dateOfBirth: manualDob || undefined,
          address: manualAddress.trim() || undefined,
        };
      }

      // 2. Call Enroll API
      const enrollmentRes = await AcademicService.enrollStudent(payload);
      setCreatedEnrollment(enrollmentRes);

      // 3. If collect payment now, record payment
      let receiptRes: PaymentReceipt | null = null;
      if (collectPaymentNow && paymentAmount > 0) {
        const payRes = await AcademicService.recordPayment(enrollmentRes.id, {
          amount: paymentAmount,
          paymentMethod,
          transactionReference: transactionRef.trim() || undefined,
          notes: paymentNotes.trim() || undefined,
        });
        receiptRes = payRes.receipt;
        setCreatedReceipt(receiptRes);
        setCreatedEnrollment(payRes.enrollment);
      }

      // Move to Step 4 (Success / Student Card)
      setCurrentStep(4);
    } catch (err: any) {
      console.error('Lỗi khi xếp lớp học viên:', err);
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi thực hiện xếp lớp học viên';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="classes-modal-overlay">
      <div
        className="classes-modal-container"
        style={{ maxWidth: '820px', width: '92vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="classes-modal-header" style={{ padding: '18px 24px' }}>
          <div className="classes-modal-title-group">
            <div className="classes-modal-icon-badge" style={{ background: '#ede9fe', color: '#6366f1' }}>
              <Users size={20} />
            </div>
            <div>
              <h3 className="classes-modal-title">Xếp Lớp & Ghi Danh Học Viên</h3>
            </div>
          </div>
          {currentStep !== 4 && (
            <button
              type="button"
              className="classes-modal-close-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* STEPPER PROGRESS BAR (Hidden on Step 4 Success) */}
        {currentStep !== 4 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 24px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: currentStep >= 1 ? '#4f46e5' : '#cbd5e1',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                1
              </span>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: currentStep === 1 ? 700 : 500,
                  color: currentStep === 1 ? '#1e1b4b' : '#64748b',
                }}
              >
                Học viên
              </span>
            </div>

            <div style={{ flex: 1, height: '2px', background: currentStep >= 2 ? '#4f46e5' : '#e2e8f0', margin: '0 12px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: currentStep >= 2 ? '#4f46e5' : '#cbd5e1',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                2
              </span>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: currentStep === 2 ? 700 : 500,
                  color: currentStep === 2 ? '#1e1b4b' : '#64748b',
                }}
              >
                Lớp học
              </span>
            </div>

            <div style={{ flex: 1, height: '2px', background: currentStep >= 3 ? '#4f46e5' : '#e2e8f0', margin: '0 12px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: currentStep >= 3 ? '#4f46e5' : '#cbd5e1',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                3
              </span>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: currentStep === 3 ? 700 : 500,
                  color: currentStep === 3 ? '#1e1b4b' : '#64748b',
                }}
              >
                Học phí & Biên lai
              </span>
            </div>
          </div>
        )}

        {/* ERROR NOTIFICATION */}
        {errorMsg && (
          <div
            style={{
              margin: '16px 24px 0 24px',
              padding: '12px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#dc2626',
              fontSize: '13px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* MODAL BODY */}
        <div style={{ padding: '20px 24px', maxHeight: '68vh', overflowY: 'auto' }}>
          {/* ========================================================================= */}
          {/* BƯỚC 1: CHỌN HỌC VIÊN                                                    */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div>
              {/* Switch Mode: Chọn Lead có sẵn vs Nhập mới */}
              <div
                style={{
                  display: 'flex',
                  background: '#f1f5f9',
                  padding: '4px',
                  borderRadius: '10px',
                  marginBottom: '18px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setCandidateMode('LEAD')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    background: candidateMode === 'LEAD' ? '#ffffff' : 'transparent',
                    color: candidateMode === 'LEAD' ? '#4f46e5' : '#64748b',
                    boxShadow: candidateMode === 'LEAD' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Chọn từ danh sách Lead ({leads.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCandidateMode('MANUAL')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    background: candidateMode === 'MANUAL' ? '#ffffff' : 'transparent',
                    color: candidateMode === 'MANUAL' ? '#4f46e5' : '#64748b',
                    boxShadow: candidateMode === 'MANUAL' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  + Thêm học viên mới trực tiếp
                </button>
              </div>

              {candidateMode === 'LEAD' ? (
                <div>
                  {/* Lead Search Input */}
                  <div
                    style={{
                      position: 'relative',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Search
                      size={15}
                      style={{ position: 'absolute', left: '12px', color: '#94a3b8' }}
                    />
                    <input
                      type="text"
                      placeholder="Tìm kiếm lead theo tên, SĐT, email..."
                      value={leadSearchQuery}
                      onChange={(e) => setLeadSearchQuery(e.target.value)}
                      className="classes-form-input"
                      style={{ paddingLeft: '36px', width: '100%' }}
                    />
                  </div>

                  {/* Leads List Box */}
                  <div
                    style={{
                      maxHeight: '280px',
                      overflowY: 'auto',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      background: '#ffffff',
                    }}
                  >
                    {isLoadingMeta ? (
                      <div style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>
                        Đang tải danh sách lead...
                      </div>
                    ) : filteredLeads.length === 0 ? (
                      <div style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>
                        Không tìm thấy hồ sơ lead nào phù hợp.
                      </div>
                    ) : (
                      filteredLeads.map((lead) => {
                        const isSelected = selectedLead?.id === lead.id;
                        return (
                          <div
                            key={lead.id}
                            onClick={() => setSelectedLead(lead)}
                            style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid #f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              background: isSelected ? '#f5f3ff' : 'transparent',
                              transition: 'background 0.15s',
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontWeight: 600,
                                  color: isSelected ? '#4f46e5' : '#0f172a',
                                  fontSize: '13.5px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                }}
                              >
                                <span>{lead.fullName}</span>
                                {lead.interest && (
                                  <span
                                    style={{
                                      fontSize: '10.5px',
                                      fontWeight: 700,
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      background: '#eff6ff',
                                      color: '#2563eb',
                                    }}
                                  >
                                    {lead.interest}
                                  </span>
                                )}
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  fontSize: '12px',
                                  color: '#64748b',
                                  marginTop: '2px',
                                }}
                              >
                                <span>📞 {lead.phoneNumber}</span>
                                {lead.email && <span>✉️ {lead.email}</span>}
                                {lead.sourceChannel && (
                                  <span
                                    style={{
                                      background: '#f1f5f9',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                    }}
                                  >
                                    {lead.sourceChannel}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background:
                                    lead.pipelineStage === 'ENROLLED'
                                      ? '#dcfce7'
                                      : lead.pipelineStage === 'TEST_SCHEDULED'
                                      ? '#e0e7ff'
                                      : '#f1f5f9',
                                  color:
                                    lead.pipelineStage === 'ENROLLED'
                                      ? '#166534'
                                      : lead.pipelineStage === 'TEST_SCHEDULED'
                                      ? '#4338ca'
                                      : '#475569',
                                }}
                              >
                                {STAGE_LABEL_MAP[lead.pipelineStage] || lead.pipelineStage}
                              </span>
                              {isSelected && <CheckCircle2 size={18} style={{ color: '#4f46e5' }} />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                /* Manual Candidate Form */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="classes-form-row">
                    <div className="classes-form-group">
                      <label className="classes-form-label">
                        Họ và tên học viên <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Nguyễn Văn Anh"
                        value={manualFullName}
                        onChange={(e) => setManualFullName(e.target.value)}
                        className="classes-form-input"
                      />
                    </div>
                    <div className="classes-form-group">
                      <label className="classes-form-label">
                        Số điện thoại (10 số) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="VD: 0912345678"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        className="classes-form-input"
                      />
                    </div>
                  </div>

                  <div className="classes-form-row">
                    <div className="classes-form-group">
                      <label className="classes-form-label">Email học viên</label>
                      <input
                        type="email"
                        placeholder="VD: student@gmail.com"
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        className="classes-form-input"
                      />
                    </div>
                    <div className="classes-form-group">
                      <label className="classes-form-label">Ngày sinh</label>
                      <input
                        type="date"
                        value={manualDob}
                        onChange={(e) => setManualDob(e.target.value)}
                        className="classes-form-input"
                      />
                    </div>
                  </div>

                  <div className="classes-form-group">
                    <label className="classes-form-label">Địa chỉ liên hệ</label>
                    <input
                      type="text"
                      placeholder="VD: 120 Nguyễn Thị Minh Khai, Quận 3, TP.HCM"
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      className="classes-form-input"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* BƯỚC 2: CHỌN LỚP HỌC KHẢ DỤNG                                             */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div>
              {/* Course filter selector */}
              <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  Khóa học:
                </span>
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  className="classes-form-input"
                  style={{ width: 'auto', flex: 1 }}
                >
                  <option value="ALL">Tất cả ({classes.length} lớp)</option>
                  {courses.map((crs) => (
                    <option key={crs.id} value={crs.id.toString()}>
                      {crs.courseCode} - {crs.courseName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Header hàng cột cho danh sách lớp */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr) 105px',
                  gap: '12px',
                  padding: '0 12px 6px 12px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: '#64748b',
                }}
              >
                <span>Lớp học & Giảng viên</span>
                <span>Lịch học & Phòng</span>
                <span style={{ textAlign: 'right' }}>Chỗ trống</span>
              </div>

              {/* Danh sách lớp học khả dụng */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxHeight: '320px',
                  overflowY: 'auto',
                }}
              >
                {filteredClasses.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    Không có lớp học nào khả dụng với bộ lọc hiện tại.
                  </div>
                ) : (
                  filteredClasses.map((cls) => {
                    const isSelected = selectedClass?.id === cls.id;
                    const isFull =
                      cls.isFull || cls.currentEnrolled >= cls.maxCapacity || cls.status === 'FULL';
                    const schedule = `${cls.scheduleDays === 'MON_WED_FRI' ? 'T2-4-6' : cls.scheduleDays === 'TUE_THU_SAT' ? 'T3-5-7' : 'Cuối tuần'} • ${cls.timeSlot}`;
                    const available = cls.availableSeats ?? (cls.maxCapacity - cls.currentEnrolled);

                    return (
                      <div
                        key={cls.id}
                        onClick={() => {
                          if (!isFull) setSelectedClass(cls);
                        }}
                        style={{
                          border: isSelected ? '1.5px solid #4f46e5' : '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '9px 12px',
                          background: isSelected ? '#faf5ff' : '#ffffff',
                          cursor: isFull ? 'not-allowed' : 'pointer',
                          opacity: isFull ? 0.5 : 1,
                          transition: 'all 0.15s ease',
                          display: 'grid',
                          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr) 105px',
                          alignItems: 'center',
                          gap: '12px',
                          boxShadow: isSelected ? '0 1px 3px rgba(79, 70, 229, 0.12)' : 'none',
                        }}
                      >
                        {/* Cột 1: Tên lớp (Dòng 1) & Mã lớp + GV (Dòng 2) */}
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: isSelected ? 700 : 600,
                              color: isSelected ? '#4f46e5' : '#0f172a',
                              fontSize: '13px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {cls.className}
                          </div>
                          <div
                            style={{
                              fontSize: '11px',
                              color: isSelected ? '#6366f1' : '#64748b',
                              marginTop: '2px',
                              lineHeight: '13px',
                            }}
                          >
                            <span style={{ fontFamily: 'monospace' }}>{cls.classCode}</span>
                            {cls.teacherName ? ` • GV: ${cls.teacherName}` : ''}
                          </div>
                        </div>

                        {/* Cột 2: Lịch học */}
                        <div style={{ fontSize: '12px', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <div>{schedule}</div>
                          {cls.room && <div style={{ fontSize: '11px', color: '#94a3b8' }}>{cls.room}</div>}
                        </div>

                        {/* Cột 3: Tình trạng chỗ */}
                        <div style={{ textAlign: 'right' }}>
                          {isFull ? (
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#b91c1c', background: '#fee2e2', padding: '2px 7px', borderRadius: '4px', display: 'inline-block' }}>
                              Đã đầy ({cls.currentEnrolled}/{cls.maxCapacity})
                            </span>
                          ) : (
                            <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '2px 7px', borderRadius: '4px', display: 'inline-block' }}>
                              Còn {available} chỗ ({cls.currentEnrolled}/{cls.maxCapacity})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* BƯỚC 3: XÁC NHẬN SĨ SỐ, HỌC PHÍ & BIÊN LAI                               */}
          {/* ========================================================================= */}
          {currentStep === 3 && selectedClass && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Tóm tắt học viên & lớp học gọn gàng */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '13px',
                }}
              >
                <div>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>Học viên: </span>
                  <strong style={{ color: '#0f172a' }}>{candidateMode === 'LEAD' ? selectedLead?.fullName : manualFullName}</strong>
                  <span style={{ color: '#94a3b8', margin: '0 6px' }}>•</span>
                  <span style={{ color: '#475569', fontSize: '12.5px' }}>
                    {candidateMode === 'LEAD' ? selectedLead?.phoneNumber : manualPhone}
                  </span>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>Lớp: </span>
                  <strong style={{ color: '#0f172a' }}>{selectedClass.className}</strong>
                  <span style={{ color: '#94a3b8', fontSize: '12px', marginLeft: '6px', fontFamily: 'monospace' }}>
                    ({selectedClass.classCode})
                  </span>
                  <span style={{ color: '#64748b', fontSize: '12px', marginLeft: '6px' }}>
                    · Sĩ số: {selectedClass.currentEnrolled + 1}/{selectedClass.maxCapacity}
                  </span>
                </div>
              </div>

              {/* Bảng tính toán học phí & chiết khấu */}
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  background: '#ffffff',
                }}
              >
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  Học phí & Ưu đãi
                </h4>

                <div className="classes-form-row">
                  <div className="classes-form-group">
                    <label className="classes-form-label">Học phí niêm yết</label>
                    <input
                      type="text"
                      disabled
                      value={`${selectedClass.standardTuition.toLocaleString('vi-VN')} đ`}
                      className="classes-form-input"
                      style={{ background: '#f1f5f9', fontWeight: 600 }}
                    />
                  </div>

                  <div className="classes-form-group">
                    <label className="classes-form-label">Chiết khấu / Học bổng (VNĐ)</label>
                    <input
                      type="number"
                      min={0}
                      max={selectedClass.standardTuition}
                      step={100000}
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      className="classes-form-input"
                      placeholder="0"
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {[
                        { label: '0đ', val: 0 },
                        { label: '-5%', val: Math.round((selectedClass.standardTuition * 0.05) / 10000) * 10000 },
                        { label: '-10%', val: Math.round((selectedClass.standardTuition * 0.1) / 10000) * 10000 },
                        { label: '-500k', val: 500000 },
                        { label: '-1 Triệu', val: 1000000 },
                      ].map((chip) => (
                        <button
                          key={chip.label}
                          type="button"
                          onClick={() => setDiscountAmount(Math.min(selectedClass.standardTuition, chip.val))}
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: discountAmount === chip.val ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                            background: discountAmount === chip.val ? '#ede9fe' : '#f8fafc',
                            color: discountAmount === chip.val ? '#4f46e5' : '#475569',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Final Amount Highlight */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: '#f5f3ff',
                    borderRadius: '8px',
                    marginTop: '8px',
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#4338ca', fontSize: '13px' }}>
                    Thực thu sau ưu đãi:
                  </span>
                  <span style={{ fontWeight: 800, color: '#4f46e5', fontSize: '16px' }}>
                    {Math.max(0, selectedClass.standardTuition - discountAmount).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* Tùy chọn thu học phí ban đầu ngay */}
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  background: collectPaymentNow ? '#fdf4ff' : '#ffffff',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      fontSize: '13.5px',
                      color: '#0f172a',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={collectPaymentNow}
                      onChange={(e) => setCollectPaymentNow(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#4f46e5' }}
                    />
                    <span>Thu học phí & Xuất biên lai ngay</span>
                  </label>
                </div>

                {collectPaymentNow && (
                  <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="classes-form-row">
                      <div className="classes-form-group">
                        <label className="classes-form-label">
                          Số tiền nộp đợt này (VNĐ) <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="number"
                          min={1000}
                          max={Math.max(0, selectedClass.standardTuition - discountAmount)}
                          step={100000}
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(Number(e.target.value))}
                          className="classes-form-input"
                        />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                          <button
                            type="button"
                            onClick={() =>
                              setPaymentAmount(Math.max(0, selectedClass.standardTuition - discountAmount))
                            }
                            style={{
                              fontSize: '11px',
                              background: '#ede9fe',
                              color: '#6366f1',
                              border: 'none',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            Đóng đủ 100%
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPaymentAmount(
                                Math.round((Math.max(0, selectedClass.standardTuition - discountAmount) * 0.5) / 10000) *
                                  10000
                              )
                            }
                            style={{
                              fontSize: '11px',
                              background: '#f1f5f9',
                              color: '#475569',
                              border: 'none',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            Đặt cọc 50%
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPaymentAmount(
                                Math.min(2000000, Math.max(0, selectedClass.standardTuition - discountAmount))
                              )
                            }
                            style={{
                              fontSize: '11px',
                              background: '#f1f5f9',
                              color: '#475569',
                              border: 'none',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            Cọc 2.000.000đ
                          </button>
                        </div>
                      </div>

                      <div className="classes-form-group">
                        <label className="classes-form-label">Hình thức thanh toán</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="classes-form-input"
                        >
                          <option value="BANK_TRANSFER">Chuyển khoản ngân hàng (QR)</option>
                          <option value="CASH">Tiền mặt tại quầy</option>
                        </select>
                      </div>
                    </div>

                    {paymentMethod === 'BANK_TRANSFER' && (
                      <div className="classes-form-group">
                        <label className="classes-form-label">Mã tham chiếu giao dịch</label>
                        <input
                          type="text"
                          placeholder="VD: FT2610889123 - Vietcombank..."
                          value={transactionRef}
                          onChange={(e) => setTransactionRef(e.target.value)}
                          className="classes-form-input"
                        />
                      </div>
                    )}

                    <div className="classes-form-group">
                      <label className="classes-form-label">Ghi chú biên lai</label>
                      <input
                        type="text"
                        placeholder="Ghi chú thêm nếu có..."
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        className="classes-form-input"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="classes-form-group">
                <label className="classes-form-label">Ghi chú hồ sơ đào tạo</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm về nguyện vọng, cam kết đầu ra của học viên..."
                  value={enrollmentNotes}
                  onChange={(e) => setEnrollmentNotes(e.target.value)}
                  className="classes-form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* BƯỚC 4: THÀNH CÔNG & THẺ HỌC VIÊN CHÍNH THỨC                             */}
          {/* ========================================================================= */}
          {currentStep === 4 && createdEnrollment && (
            <div style={{ textAlign: 'center', padding: '16px 8px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                }}
              >
                <Sparkles size={28} />
              </div>

              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                Xếp Lớp Thành Công
              </h3>
              <p style={{ margin: '0 0 18px 0', fontSize: '13px', color: '#64748b' }}>
                Học viên đã được ghi danh vào lớp thành công.
              </p>

              {/* THẺ HỌC VIÊN */}
              <div
                style={{
                  maxWidth: '460px',
                  margin: '0 auto 20px auto',
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  color: '#ffffff',
                  textAlign: 'left',
                  boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Background watermarks */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80' }} />
                    <span style={{ fontSize: '11px', letterSpacing: '1px', fontWeight: 700, color: '#c7d2fe' }}>
                      THẺ HỌC VIÊN
                    </span>
                  </div>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {createdEnrollment.paymentStatus === 'FULLY_PAID'
                      ? 'Đã nộp đủ'
                      : createdEnrollment.paymentStatus === 'PARTIAL'
                      ? 'Nộp một phần'
                      : 'Chưa đóng phí'}
                  </span>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Mã học viên
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', letterSpacing: '1px' }}>
                    {createdEnrollment.studentCode}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#a5b4fc' }}>Họ và tên</div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{createdEnrollment.fullName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#a5b4fc' }}>Lớp học</div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{createdEnrollment.classCode}</div>
                  </div>
                </div>

                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#c7d2fe' }}>
                  <span>Đã nộp: {Number(createdEnrollment.paidAmount || 0).toLocaleString('vi-VN')} đ</span>
                  <span>Còn nợ: {Number(createdEnrollment.balanceDue || 0).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              {/* ACTION BUTTONS ON SUCCESS */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                {createdReceipt && onPrintReceipt && (
                  <Button
                    variant="glass"
                    iconLeft={<Printer size={15} />}
                    onClick={() => onPrintReceipt(createdReceipt, createdEnrollment)}
                  >
                    In biên lai
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={() => {
                    onSuccess(createdEnrollment);
                    onClose();
                  }}
                  style={{ background: '#4f46e5', fontWeight: 600 }}
                >
                  Hoàn tất
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        {currentStep !== 4 && (
          <div className="classes-modal-footer" style={{ padding: '14px 24px', justifyContent: 'space-between' }}>
            {currentStep > 1 ? (
              <Button
                variant="glass"
                size="sm"
                iconLeft={<ArrowLeft size={14} />}
                onClick={() => setCurrentStep((prev) => (prev - 1) as WizardStep)}
                disabled={isSubmitting}
              >
                Quay lại
              </Button>
            ) : (
              <Button variant="glass" size="sm" onClick={onClose} disabled={isSubmitting}>
                Hủy
              </Button>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              {currentStep === 1 && (
                <Button
                  variant="primary"
                  size="sm"
                  iconRight={<ArrowRight size={14} />}
                  onClick={handleNextFromStep1}
                  style={{ background: '#4f46e5', fontWeight: 600 }}
                >
                  Tiếp tục
                </Button>
              )}

              {currentStep === 2 && (
                <Button
                  variant="primary"
                  size="sm"
                  iconRight={<ArrowRight size={14} />}
                  onClick={handleNextFromStep2}
                  style={{ background: '#4f46e5', fontWeight: 600 }}
                >
                  Tiếp tục
                </Button>
              )}

              {currentStep === 3 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmitEnrollment}
                  disabled={isSubmitting}
                  iconLeft={<UserCheck size={14} />}
                  style={{ background: '#4f46e5', fontWeight: 600 }}
                >
                  {isSubmitting ? 'Đang lưu...' : 'Xác nhận xếp lớp'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
