import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Printer,
  History,
} from 'lucide-react';

import { AcademicService } from '../../services/academic.service';
import type {
  ClassEnrollmentItem,
  PaymentReceipt,
  PaymentMethod,
} from '../../types/academic';
import { Button } from '../../components/ui';

interface RecordPaymentModalProps {
  enrollment: ClassEnrollmentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedEnrollment: ClassEnrollmentItem, receipt: PaymentReceipt) => void;
  onPrintReceipt?: (receipt: PaymentReceipt, enrollment: ClassEnrollmentItem) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  enrollment,
  isOpen,
  onClose,
  onSuccess,
  onPrintReceipt,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [receiptsHistory, setReceiptsHistory] = useState<PaymentReceipt[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !enrollment) return;

    setErrorMsg(null);
    setNotes('');
    setTransactionRef('');
    setPaymentMethod('BANK_TRANSFER');

    // Default amount to balance due
    const remaining = Math.max(0, Number(enrollment.balanceDue || 0));
    setAmount(remaining);

    // Load receipts history
    loadReceipts(enrollment.id);
  }, [isOpen, enrollment]);

  const loadReceipts = async (enrollmentId: number) => {
    try {
      setIsLoadingHistory(true);
      const data = await AcademicService.getPaymentReceipts(enrollmentId);
      setReceiptsHistory(data);
    } catch (err) {
      console.error('Lỗi khi tải lịch sử biên lai thu tiền:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollment) return;
    setErrorMsg(null);

    if (amount <= 0) {
      setErrorMsg('Số tiền nộp phải lớn hơn 0 VNĐ');
      return;
    }

    if (amount > enrollment.balanceDue && enrollment.balanceDue > 0) {
      setErrorMsg(
        `Số tiền nộp (${amount.toLocaleString('vi-VN')} đ) không được vượt quá số dư còn thiếu (${enrollment.balanceDue.toLocaleString('vi-VN')} đ)`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await AcademicService.recordPayment(enrollment.id, {
        amount,
        paymentMethod,
        transactionReference: transactionRef.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      onSuccess(res.enrollment, res.receipt);
      onClose();

      if (onPrintReceipt) {
        onPrintReceipt(res.receipt, res.enrollment);
      }
    } catch (err: any) {
      console.error('Lỗi khi ghi nhận thanh toán học phí:', err);
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi ghi nhận thanh toán');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !enrollment) return null;

  const isFullyPaid = enrollment.paymentStatus === 'FULLY_PAID' || enrollment.balanceDue <= 0;

  return createPortal(
    <div className="classes-modal-overlay">
      <div
        className="classes-modal-container"
        style={{ maxWidth: '620px', width: '92vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="classes-modal-header" style={{ padding: '18px 24px' }}>
          <div className="classes-modal-title-group">
            <div className="classes-modal-icon-badge" style={{ background: '#fdf4ff', color: '#9333ea' }}>
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="classes-modal-title">Ghi Nhận Thu Học Phí</h3>
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
          {/* Học viên & Công nợ summary */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                  {enrollment.fullName}
                </div>
                <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{enrollment.phoneNumber}</span>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <span>Lớp:</span>
                  <strong style={{ color: '#0f172a' }}>{enrollment.className}</strong>
                  <span style={{ color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace' }}>({enrollment.classCode})</span>
                </div>
              </div>

              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '20px',
                  background: isFullyPaid
                    ? '#ecfdf5'
                    : Number(enrollment.balanceDue || 0) > 0
                    ? '#fef2f2'
                    : '#fff7ed',
                  color: isFullyPaid
                    ? '#059669'
                    : Number(enrollment.balanceDue || 0) > 0
                    ? '#dc2626'
                    : '#ea580c',
                  border: `1px solid ${isFullyPaid ? '#a7f3d0' : Number(enrollment.balanceDue || 0) > 0 ? '#fecaca' : '#fed7aa'}`,
                }}
              >
                {isFullyPaid
                  ? 'Đã nộp đủ'
                  : Number(enrollment.balanceDue || 0) > 0
                  ? 'Còn nợ'
                  : 'Chưa đóng'}
              </span>
            </div>

            {/* Financial Status Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                paddingTop: '10px',
                borderTop: '1px solid #e2e8f0',
                fontSize: '12px',
              }}
            >
              <div>
                <span style={{ color: '#64748b' }}>Phải nộp:</span>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                  {Number(enrollment.finalAmount).toLocaleString('vi-VN')} đ
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Đã nộp:</span>
                <div style={{ fontWeight: 700, color: '#16a34a', fontSize: '13px' }}>
                  {Number(enrollment.paidAmount).toLocaleString('vi-VN')} đ
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Còn nợ:</span>
                <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '13px' }}>
                  {Number(enrollment.balanceDue).toLocaleString('vi-VN')} đ
                </div>
              </div>
            </div>
          </div>

          {/* Form input fields */}
          {isFullyPaid ? (
            <div
              style={{
                padding: '16px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '10px',
                textAlign: 'center',
                color: '#166534',
                fontSize: '13.5px',
              }}
            >
              <CheckCircle2 size={24} style={{ margin: '0 auto 6px auto' }} />
              <div style={{ fontWeight: 700 }}>Học viên đã hoàn thành 100% học phí</div>
              <div style={{ fontSize: '12px', marginTop: '2px', color: '#15803d' }}>
                Không còn công nợ cho lớp học này.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="classes-form-group">
                <label className="classes-form-label">
                  Số tiền nộp (VNĐ) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  min={1000}
                  max={enrollment.balanceDue}
                  step={50000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="classes-form-input"
                  style={{ fontSize: '15px', fontWeight: 700 }}
                  required
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setAmount(enrollment.balanceDue)}
                    style={{
                      fontSize: '11px',
                      background: '#ede9fe',
                      color: '#6366f1',
                      border: 'none',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Đóng đủ: {Number(enrollment.balanceDue).toLocaleString('vi-VN')} đ
                  </button>
                  {enrollment.balanceDue > 2000000 && (
                    <button
                      type="button"
                      onClick={() => setAmount(2000000)}
                      style={{
                        fontSize: '11px',
                        background: '#f1f5f9',
                        color: '#475569',
                        border: 'none',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      2.000.000 đ
                    </button>
                  )}
                </div>
              </div>

              <div className="classes-form-row">
                <div className="classes-form-group">
                  <label className="classes-form-label">Hình thức thanh toán</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="classes-form-input"
                  >
                    <option value="BANK_TRANSFER">Chuyển khoản</option>
                    <option value="CASH">Tiền mặt</option>
                  </select>
                </div>

                <div className="classes-form-group">
                  <label className="classes-form-label">Mã tham chiếu</label>
                  <input
                    type="text"
                    placeholder="Mã giao dịch ngân hàng..."
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="classes-form-input"
                  />
                </div>
              </div>

              <div className="classes-form-group">
                <label className="classes-form-label">Ghi chú</label>
                <input
                  type="text"
                  placeholder="Ghi chú thêm nếu có..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="classes-form-input"
                />
              </div>
            </div>
          )}

          {/* LỊCH SỬ BIÊN LAI THU TRƯỚC ĐÓ */}
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              <History size={14} style={{ color: '#6366f1' }} />
              <span>Lịch sử biên lai ({receiptsHistory.length})</span>
            </div>

            {isLoadingHistory ? (
              <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '12px' }}>
                Đang tải lịch sử biên lai...
              </div>
            ) : receiptsHistory.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#94a3b8', background: '#f8fafc', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                Chưa có biên lai thu tiền nào cho hồ sơ này.
              </div>
            ) : (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                    <tr>
                      <th style={{ padding: '8px 10px' }}>Mã biên lai</th>
                      <th style={{ padding: '8px 10px' }}>Số tiền</th>
                      <th style={{ padding: '8px 10px' }}>Hình thức</th>
                      <th style={{ padding: '8px 10px' }}>Ngày thu</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptsHistory.map((rec) => (
                      <tr key={rec.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#4f46e5' }}>
                          {rec.receiptCode}
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>
                          {Number(rec.amount).toLocaleString('vi-VN')} đ
                        </td>
                        <td style={{ padding: '8px 10px', color: '#64748b' }}>
                          {rec.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}
                        </td>
                        <td style={{ padding: '8px 10px', color: '#64748b' }}>
                          {new Date(rec.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          {onPrintReceipt && (
                            <button
                              type="button"
                              onClick={() => onPrintReceipt(rec, enrollment)}
                              style={{
                                background: '#f1f5f9',
                                border: 'none',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: '#334155',
                              }}
                              title="In lại phiếu thu này"
                            >
                              <Printer size={11} /> In
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="classes-modal-footer" style={{ padding: '14px 0 0 0', marginTop: '10px' }}>
            <Button variant="glass" onClick={onClose} disabled={isSubmitting}>
              Đóng
            </Button>
            {!isFullyPaid && (
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
                iconLeft={<DollarSign size={15} />}
                style={{ background: '#9333ea', fontWeight: 600 }}
              >
                {isSubmitting ? 'Đang lưu...' : 'Xác nhận thu học phí'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
