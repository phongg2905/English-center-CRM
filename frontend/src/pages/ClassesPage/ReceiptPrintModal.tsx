import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer } from 'lucide-react';

import type { ClassEnrollmentItem, PaymentReceipt } from '../../types/academic';
import { Button } from '../../components/ui';

interface ReceiptPrintModalProps {
  receipt: PaymentReceipt | null;
  enrollment: ClassEnrollmentItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  receipt,
  enrollment,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !receipt || !enrollment) return null;

  const handlePrint = () => {
    window.print();
  };

  const receiptDate = new Date(receipt.createdAt || Date.now());
  const formattedDate = `Ngày ${receiptDate.getDate()} tháng ${
    receiptDate.getMonth() + 1
  } năm ${receiptDate.getFullYear()}`;

  // Helper number to words (basic Vietnamese representation)
  const formatAmountWords = (num: number): string => {
    if (num <= 0) return 'Không đồng';
    // Friendly approximation
    return `${num.toLocaleString('vi-VN')} Việt Nam Đồng`;
  };

  return createPortal(
    <div className="classes-modal-overlay print-modal-overlay">
      <div
        className="classes-modal-container print-modal-container"
        style={{ maxWidth: '680px', width: '92vw', background: '#ffffff' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL ACTIONS BAR (Hidden on Print) */}
        <div
          className="print-hide"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#1e1b4b' }}>
              Phiếu thu ({receipt.receiptCode})
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="primary"
              size="sm"
              iconLeft={<Printer size={14} />}
              onClick={handlePrint}
              style={{ background: '#2563eb', fontWeight: 600 }}
            >
              In phiếu thu
            </Button>
            <button
              type="button"
              className="classes-modal-close-btn"
              onClick={onClose}
              title="Đóng"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT DOCUMENT */}
        <div
          id="printable-receipt-area"
          style={{
            padding: '36px 40px',
            color: '#0f172a',
            fontFamily: "'Quicksand', 'Segoe UI', Roboto, sans-serif",
            background: '#ffffff',
          }}
        >
          {/* Header & Logo */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #0f172a',
              paddingBottom: '16px',
              marginBottom: '20px',
            }}
          >
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e1b4b', textTransform: 'uppercase' }}>
                TRUNG TÂM ANH NGỮ QUỐC TẾ EDUFLOW
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px' }}>
                Hệ thống Quản lý Đào tạo & Khảo thí Tiếng Anh Chuyên sâu
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Hotline: 1900 6868 • Email: academic@eduflow.edu.vn • Website: eduflow.vn
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Mẫu số: 01-TT/HP
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#4f46e5', marginTop: '4px' }}>
                {receipt.receiptCode}
              </div>
            </div>
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#0f172a',
                margin: '0 0 6px 0',
                letterSpacing: '0.5px',
              }}
            >
              BIÊN LAI THU TIỀN HỌC PHÍ
            </h2>
            <div style={{ fontSize: '12.5px', fontStyle: 'italic', color: '#64748b' }}>
              {formattedDate}
            </div>
          </div>

          {/* Info Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginBottom: '24px' }}>
            <div style={{ display: 'flex' }}>
              <span style={{ width: '160px', color: '#475569' }}>Họ và tên học viên:</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{enrollment.fullName}</span>
            </div>

            <div style={{ display: 'flex' }}>
              <span style={{ width: '160px', color: '#475569' }}>Mã số học viên:</span>
              <span style={{ fontWeight: 800, color: '#4f46e5' }}>{enrollment.studentCode}</span>
            </div>

            <div style={{ display: 'flex' }}>
              <span style={{ width: '160px', color: '#475569' }}>Số điện thoại:</span>
              <span style={{ fontWeight: 600 }}>{enrollment.phoneNumber}</span>
              {enrollment.email && (
                <span style={{ marginLeft: '24px', color: '#64748b' }}>
                  Email: {enrollment.email}
                </span>
              )}
            </div>

            <div style={{ display: 'flex' }}>
              <span style={{ width: '160px', color: '#475569' }}>Khóa học / Lớp học:</span>
              <span style={{ fontWeight: 600 }}>
                {enrollment.courseName} — Lớp: <strong>{enrollment.className} ({enrollment.classCode})</strong>
              </span>
            </div>

            <div style={{ display: 'flex' }}>
              <span style={{ width: '160px', color: '#475569' }}>Số tiền đã nộp:</span>
              <span style={{ fontWeight: 800, fontSize: '16px', color: '#16a34a' }}>
                {Number(receipt.amount).toLocaleString('vi-VN')} VNĐ
              </span>
            </div>

            <div style={{ display: 'flex' }}>
              <span style={{ width: '160px', color: '#475569' }}>Viết bằng chữ:</span>
              <span style={{ fontWeight: 600, fontStyle: 'italic' }}>
                {formatAmountWords(receipt.amount)}
              </span>
            </div>

            <div style={{ display: 'flex' }}>
              <span style={{ width: '160px', color: '#475569' }}>Hình thức thanh toán:</span>
              <span style={{ fontWeight: 600 }}>
                {receipt.paymentMethod === 'BANK_TRANSFER'
                  ? `Chuyển khoản ngân hàng ${
                      receipt.transactionReference ? `(Mã giao dịch: ${receipt.transactionReference})` : ''
                    }`
                  : 'Tiền mặt tại quầy'}
              </span>
            </div>

            {receipt.notes && (
              <div style={{ display: 'flex' }}>
                <span style={{ width: '160px', color: '#475569' }}>Nội dung thu:</span>
                <span>{receipt.notes}</span>
              </div>
            )}
          </div>

          {/* Financial summary note */}
          <div
            style={{
              padding: '12px 16px',
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '8px',
              fontSize: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '32px',
            }}
          >
            <span>Tổng học phí: {Number(enrollment.finalAmount).toLocaleString('vi-VN')} đ</span>
            <span>Tổng đã đóng: {Number(enrollment.paidAmount).toLocaleString('vi-VN')} đ</span>
            <span style={{ fontWeight: 700, color: enrollment.balanceDue > 0 ? '#dc2626' : '#16a34a' }}>
              Còn nợ: {Number(enrollment.balanceDue).toLocaleString('vi-VN')} đ
            </span>
          </div>

          {/* Signatures Area */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              textAlign: 'center',
              fontSize: '12.5px',
              marginTop: '20px',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>Người nộp tiền</div>
              <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                (Ký và ghi rõ họ tên)
              </div>
              <div style={{ height: '70px' }} />
              <div style={{ fontWeight: 600 }}>{enrollment.fullName}</div>
            </div>

            <div>
              <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>Người lập phiếu / Thủ quỹ</div>
              <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                (Ký, đóng dấu và ghi rõ họ tên)
              </div>
              <div style={{ height: '70px' }} />
              <div style={{ fontWeight: 600 }}>{receipt.receiverName || 'Bộ phận Giáo vụ / Thu ngân'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
