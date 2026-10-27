import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ArrowRightLeft,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

import { AcademicService } from '../../services/academic.service';
import type {
  ClassItem,
  ClassEnrollmentItem,
  TransferClassPayload,
} from '../../types/academic';
import { Button } from '../../components/ui';

interface TransferClassModalProps {
  enrollment: ClassEnrollmentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedEnrollment: ClassEnrollmentItem) => void;
}

export const TransferClassModal: React.FC<TransferClassModalProps> = ({
  enrollment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [currentClass, setCurrentClass] = useState<ClassItem | null>(null);
  const [selectedNewClassId, setSelectedNewClassId] = useState<number | null>(null);
  const [transferReason, setTransferReason] = useState<string>('');

  const [isLoadingClasses, setIsLoadingClasses] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !enrollment) return;

    setErrorMsg(null);
    setSelectedNewClassId(null);
    setTransferReason('');

    const loadAvailableClasses = async () => {
      try {
        setIsLoadingClasses(true);
        const all = await AcademicService.getClasses();
        const current = all.find((c) => c.id === enrollment.classId) || null;
        setCurrentClass(current);
        const filtered = all.filter((c) => c.id !== enrollment.classId);
        setClasses(filtered);

        const firstAvailable = filtered.find(
          (c) => !c.isFull && c.currentEnrolled < c.maxCapacity && c.status === 'OPEN'
        );
        if (firstAvailable) {
          setSelectedNewClassId(firstAvailable.id);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách lớp học chuyển đến:', err);
        setErrorMsg('Không thể tải danh sách lớp học khả dụng');
      } finally {
        setIsLoadingClasses(false);
      }
    };

    loadAvailableClasses();
  }, [isOpen, enrollment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollment) return;
    setErrorMsg(null);

    if (!selectedNewClassId) {
      setErrorMsg('Vui lòng chọn một lớp học mới để chuyển đến');
      return;
    }

    const targetClass = classes.find((c) => c.id === selectedNewClassId);
    if (!targetClass) {
      setErrorMsg('Lớp học đã chọn không hợp lệ');
      return;
    }

    if (targetClass.isFull || targetClass.currentEnrolled >= targetClass.maxCapacity) {
      setErrorMsg(
        `Lớp ${targetClass.className} đã đầy sĩ số (${targetClass.currentEnrolled}/${targetClass.maxCapacity}). Vui lòng chọn lớp học khác còn chỗ.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: TransferClassPayload = {
        newClassId: selectedNewClassId,
        reason: transferReason.trim() || undefined,
      };

      const updated = await AcademicService.transferClass(enrollment.id, payload);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi thực hiện chuyển lớp học viên:', err);
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi chuyển lớp học viên');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !enrollment) return null;

  const selectedNewClass = classes.find((c) => c.id === selectedNewClassId);

  const currentSchedule = currentClass
    ? `${currentClass.scheduleDays === 'MON_WED_FRI' ? 'T2-4-6' : currentClass.scheduleDays === 'TUE_THU_SAT' ? 'T3-5-7' : 'Cuối tuần'}, ${currentClass.timeSlot}`
    : '';

  const selectedNewSchedule = selectedNewClass
    ? `${selectedNewClass.scheduleDays === 'MON_WED_FRI' ? 'T2-4-6' : selectedNewClass.scheduleDays === 'TUE_THU_SAT' ? 'T3-5-7' : 'Cuối tuần'}, ${selectedNewClass.timeSlot}`
    : '';

  return createPortal(
    <div className="classes-modal-overlay">
      <div
        className="classes-modal-container"
        style={{ maxWidth: '640px', width: '92vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="classes-modal-header" style={{ padding: '18px 24px' }}>
          <div className="classes-modal-title-group">
            <div className="classes-modal-icon-badge" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h3 className="classes-modal-title">Chuyển Lớp Học Viên</h3>
            </div>
          </div>
          <button type="button" className="classes-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* ERROR MSG */}
        {errorMsg && (
          <div
            style={{
              margin: '14px 24px 0 24px',
              padding: '10px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#dc2626',
              fontSize: '13px',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* BODY */}
        <form onSubmit={handleSubmit} style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Thông tin học viên & Trực quan chuyển từ lớp sang lớp */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Học viên */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px' }}>
              <strong style={{ color: '#0f172a' }}>{enrollment.fullName}</strong>
              <span style={{ color: '#94a3b8' }}>•</span>
              <span style={{ color: '#475569', fontSize: '13px' }}>{enrollment.phoneNumber}</span>
            </div>

            {/* Trực quan từ lớp này sang lớp khác */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              {/* Box 1: Từ lớp hiện tại */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '10px 14px',
                }}
              >
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                  Từ lớp
                </div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {enrollment.className}
                </div>
                {currentSchedule && (
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                    {currentSchedule}
                  </div>
                )}
              </div>

              {/* Icon mũi tên chuyển sang */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#e0f2fe',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ArrowRight size={16} />
              </div>

              {/* Box 2: Sang lớp mới */}
              <div
                style={{
                  background: selectedNewClass ? '#f0f9ff' : '#ffffff',
                  border: selectedNewClass ? '1.5px solid #0284c7' : '1.5px dashed #cbd5e1',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: selectedNewClass ? '#0284c7' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                  Sang lớp
                </div>
                {selectedNewClass ? (
                  <>
                    <div style={{ fontWeight: 700, color: '#0369a1', fontSize: '13.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selectedNewClass.className}
                    </div>
                    {selectedNewSchedule && (
                      <div style={{ fontSize: '11.5px', color: '#0284c7', marginTop: '2px' }}>
                        {selectedNewSchedule}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', marginTop: '4px' }}>
                    Chọn 1 lớp ở bảng bên dưới
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Danh sách lớp học chuyển đến */}
          <div>
            <label className="classes-form-label" style={{ marginBottom: '8px', display: 'block' }}>
              Chọn lớp chuyển đến <span style={{ color: '#ef4444' }}>*</span>
            </label>

            {isLoadingClasses ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '13px' }}>
                Đang tải danh sách lớp học...
              </div>
            ) : classes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: '8px', color: '#64748b', fontSize: '13px' }}>
                Không tìm thấy lớp học nào khác còn mở để tiếp nhận chuyển lớp.
              </div>
            ) : (
              <>
                {/* Header hàng cột cho danh sách lớp */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr) 90px',
                    gap: '12px',
                    padding: '0 12px 6px 12px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#64748b',
                  }}
                >
                  <span>Lớp học</span>
                  <span>Lịch học</span>
                  <span style={{ textAlign: 'right' }}>Chỗ trống</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
                  {classes.map((cls) => {
                    const isSelected = selectedNewClassId === cls.id;
                    const isFull = cls.isFull || cls.currentEnrolled >= cls.maxCapacity || cls.status === 'FULL';
                    const schedule = `${cls.scheduleDays === 'MON_WED_FRI' ? 'T2-4-6' : cls.scheduleDays === 'TUE_THU_SAT' ? 'T3-5-7' : 'Cuối tuần'}, ${cls.timeSlot}`;
                    const available = cls.availableSeats ?? (cls.maxCapacity - cls.currentEnrolled);

                    return (
                      <div
                        key={cls.id}
                        onClick={() => {
                          if (!isFull) setSelectedNewClassId(cls.id);
                        }}
                        style={{
                          border: isSelected ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '9px 12px',
                          background: isSelected ? '#f0f9ff' : '#ffffff',
                          cursor: isFull ? 'not-allowed' : 'pointer',
                          opacity: isFull ? 0.5 : 1,
                          display: 'grid',
                          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr) 90px',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 1px 3px rgba(2, 132, 199, 0.12)' : 'none',
                        }}
                      >
                        {/* Cột 1: Tên lớp */}
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: isSelected ? 700 : 600,
                              color: isSelected ? '#0369a1' : '#0f172a',
                              fontSize: '13px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {cls.className}
                          </div>
                        </div>

                        {/* Cột 2: Lịch học */}
                        <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {schedule}
                        </span>

                        {/* Cột 3: Tình trạng chỗ */}
                        <div style={{ textAlign: 'right' }}>
                          {isFull ? (
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#b91c1c', background: '#fee2e2', padding: '2px 7px', borderRadius: '4px', display: 'inline-block' }}>
                              Đã đầy
                            </span>
                          ) : (
                            <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '2px 7px', borderRadius: '4px', display: 'inline-block' }}>
                              Còn {available} chỗ
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Lý do chuyển lớp */}
          <div className="classes-form-group">
            <label className="classes-form-label">
              Lý do chuyển lớp
            </label>
            <textarea
              rows={2}
              placeholder="Nhập lý do chuyển lớp học..."
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              className="classes-form-input"
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* FOOTER */}
          <div className="classes-modal-footer" style={{ padding: '14px 0 0 0', marginTop: '10px' }}>
            <Button variant="glass" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting || !selectedNewClassId}
              iconLeft={<ArrowRightLeft size={15} />}
              style={{ background: '#0284c7', fontWeight: 600 }}
            >
              {isSubmitting ? 'Đang chuyển...' : 'Chuyển lớp'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
