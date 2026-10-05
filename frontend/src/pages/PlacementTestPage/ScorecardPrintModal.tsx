import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  FileCheck,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import type { PlacementTestWithDetails } from '../../types/placement-test';

interface ScorecardPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: PlacementTestWithDetails;
  scores: {
    listening: number;
    reading: number;
    writing: number;
    speaking: number;
    overall: number;
    feedback: string;
  };
  recommendedCourse?: {
    courseName: string;
    courseCode: string;
    targetOutput?: string | null;
  } | null;
}

export const ScorecardPrintModal: React.FC<ScorecardPrintModalProps> = ({
  isOpen,
  onClose,
  test,
  scores,
  recommendedCourse,
}) => {
  const [fitToScreen, setFitToScreen] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getCefr = (score: number) => {
    if (score >= 8.5) return { code: 'C2', name: 'Proficient (Thành thạo)' };
    if (score >= 7.0) return { code: 'C1', name: 'Advanced (Cao cấp)' };
    if (score >= 5.5) return { code: 'B2', name: 'Upper-Inter (Trung cao cấp)' };
    if (score >= 4.0) return { code: 'B1', name: 'Intermediate (Trung cấp)' };
    return { code: 'A2', name: 'Pre-Inter (Sơ trung cấp)' };
  };

  const getSkillDescriptor = (skill: 'listening' | 'reading' | 'writing' | 'speaking', score: number) => {
    if (skill === 'listening') {
      if (score >= 7.5) return 'Nghe hiểu xuất sắc các bài đàm thoại và thuyết trình học thuật chuyên sâu; bắt chi tiết tinh tế.';
      if (score >= 6.0) return 'Nắm bắt tốt ý chính và thông tin quan trọng trong bài nghe; xử lý tốt tốc độ nói tự nhiên.';
      if (score >= 5.0) return 'Nghe hiểu ngữ cảnh thường nhật; cần rèn luyện thêm kỹ năng lọc từ đồng nghĩa (paraphrase).';
      return 'Cần tích lũy thêm vốn từ vựng nền tảng và cải thiện phản xạ nhận diện ngữ âm.';
    }
    if (skill === 'reading') {
      if (score >= 7.5) return 'Phân tích văn bản học thuật xuất sắc; suy luận ngữ nghĩa và xác định quan điểm tác giả chính xác.';
      if (score >= 6.0) return 'Đọc hiểu tốt bài dài; kỹ năng Skimming & Scanning định vị từ khóa trong đoạn văn hiệu quả.';
      if (score >= 5.0) return 'Hiểu nội dung văn bản đơn giản; còn gặp khó khăn với câu phức và thuật ngữ chuyên ngành.';
      return 'Cần mở rộng vốn từ học thuật cốt lõi và phương pháp định vị thông tin nhanh.';
    }
    if (skill === 'writing') {
      if (score >= 7.5) return 'Lập luận chặt chẽ, luận điểm sâu sắc; kiểm soát tốt cấu trúc câu phức và từ vựng phong phú.';
      if (score >= 6.0) return 'Bố cục bài viết mạch lạc, liên kết ý logic; ngữ pháp tương đối chuẩn xác, phát triển ý rõ ràng.';
      if (score >= 5.0) return 'Trình bày được quan điểm cơ bản; liên kết đoạn còn đơn giản, cần mở rộng cấu trúc câu ghép.';
      return 'Cần chuẩn hóa ngữ pháp nền tảng, học cách lập dàn ý và phát triển câu luận điểm.';
    }
    // speaking
    if (score >= 7.5) return 'Phát âm tự nhiên chuẩn ngữ điệu; phản xạ lưu loát, diễn đạt mạch lạc các chủ đề trừu tượng.';
    if (score >= 6.0) return 'Phát âm rõ ràng, tự tin giao tiếp; độ trôi chảy tốt, từ vựng phong phú ở chủ đề quen thuộc.';
    if (score >= 5.0) return 'Giao tiếp tương đối trôi chảy ở chủ đề thường ngày; còn ngập ngừng khi triển khai ý mở rộng.';
    return 'Cần rèn luyện chuẩn hóa phát âm IPA, tăng độ tự tin và mở rộng phản xạ đối thoại hai chiều.';
  };

  const overallCefr = getCefr(scores.overall);
  const currentDate = new Date();
  const formattedDate = `${String(currentDate.getDate()).padStart(2, '0')}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${currentDate.getFullYear()}`;
  const testCode = `PT-${String(test.id || 1).padStart(6, '0')}`;

  return createPortal(
    <div className="pt-modal-backdrop pt-scorecard-backdrop" onClick={onClose}>
      <div
        className="pt-modal-dialog pt-scorecard-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Action Header - Fixed at Top (Hidden during print) */}
        <div className="pt-scorecard-actions-bar no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #ec4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              <FileCheck size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: '#2e1065' }}>
                Phiếu Báo Điểm Test Đầu Vào
              </h3>
              <p style={{ margin: '1px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
                Mã hồ sơ: <strong>{testCode}</strong> • Thí sinh: <strong>{test.leadFullName}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* View Mode Toggle: Fit to screen vs 100% */}
            <button
              type="button"
              className="pt-btn-scale-toggle"
              onClick={() => setFitToScreen(!fitToScreen)}
              title={fitToScreen ? 'Chuyển sang kích thước chuẩn 100%' : 'Thu gọn vừa vặn toàn màn hình'}
            >
              {fitToScreen ? (
                <>
                  <Maximize2 size={14} /> <span>Kích thước chuẩn 100%</span>
                </>
              ) : (
                <>
                  <Minimize2 size={14} /> <span>Xem vừa màn hình</span>
                </>
              )}
            </button>

            {/* Print / Save PDF Button */}
            <button
              type="button"
              className="pt-btn-print-primary"
              onClick={handlePrint}
            >
              <Printer size={15} /> <span>In Phiếu / Lưu PDF</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              className="pt-modal-close-btn"
              onClick={onClose}
              title="Đóng (ESC)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Scorecard Sheet Scroll Wrapper */}
        <div className="pt-scorecard-scroll-wrapper">
          <div
            className={`pt-modern-scorecard-sheet pt-oxford-sheet ${fitToScreen ? 'fit-mode' : ''}`}
            id="printable-scorecard"
          >
            {/* Top-Right Embossed Watermark Seal */}
            <div className="pt-oxford-watermark" aria-hidden="true">
              <svg viewBox="0 0 120 120" width="88" height="88">
                <defs>
                  <path id="wm-arc-top" d="M 19,60 A 41,41 0 0,1 101,60" fill="none" />
                  <path id="wm-arc-bot" d="M 101,60 A 41,41 0 0,1 19,60" fill="none" />
                </defs>
                <circle cx="60" cy="60" r="54" fill="none" stroke="#1c1917" strokeWidth="1.2" strokeDasharray="3 2" />
                <circle cx="60" cy="60" r="48" fill="none" stroke="#1c1917" strokeWidth="1.4" />
                <circle cx="60" cy="60" r="32" fill="none" stroke="#1c1917" strokeWidth="0.9" />
                <circle cx="21" cy="60" r="1.5" fill="#1c1917" />
                <circle cx="99" cy="60" r="1.5" fill="#1c1917" />
                <path d="M 60,42 L 80,51 L 60,60 L 40,51 Z" fill="#1c1917" />
                <path d="M 47,56 L 47,64 C 47,69 73,69 73,64 L 73,56" fill="none" stroke="#1c1917" strokeWidth="2" />
                <path d="M 78,51 L 78,65" stroke="#1c1917" strokeWidth="1.4" />
                <circle cx="78" cy="66" r="1.8" fill="#1c1917" />
                <text fontSize="6.5" fontFamily="'Playfair Display', Georgia, serif" fontWeight="bold" fill="#1c1917" letterSpacing="0.8">
                  <textPath href="#wm-arc-top" startOffset="50%" textAnchor="middle">CERTIFICATE OF EVALUATION</textPath>
                </text>
                <text fontSize="6.5" fontFamily="'Playfair Display', Georgia, serif" fontWeight="bold" fill="#1c1917" letterSpacing="0.8">
                  <textPath href="#wm-arc-bot" startOffset="50%" textAnchor="middle">UNIVERSITY OF EXCELLENCE</textPath>
                </text>
              </svg>
            </div>

            {/* Header: Centered Brand & Classical Typography */}
            <div className="pt-oxford-header">
              <div className="pt-oxford-brand">
                <svg viewBox="0 0 48 48" width="42" height="42" fill="#1c1917" className="pt-oxford-brand-cap">
                  <path d="M 24,10 L 44,20 L 24,30 L 4,20 Z" />
                  <path d="M 13,24.5 L 13,33 C 13,39 35,39 35,33 L 35,24.5" fill="none" stroke="#1c1917" strokeWidth="2.8" strokeLinecap="round" />
                  <path d="M 40,21 L 40,33" stroke="#1c1917" strokeWidth="2.4" strokeLinecap="round" />
                  <circle cx="40" cy="34.5" r="2.2" fill="#1c1917" />
                </svg>
                <span className="pt-oxford-brand-text">EduFlow CRM</span>
              </div>
              <h1 className="pt-oxford-main-title">
                PHIẾU BÁO ĐIỂM<br />KẾT QUẢ THI
              </h1>
              <div className="pt-oxford-sub-title">(PLACEMENT TEST SCORECARD)</div>
            </div>

            {/* Candidate Profile Bar */}
            <div className="pt-oxford-profile-row">
              <div className="oxford-prof-col name-col">
                <span className="oxford-prof-lbl">Candidate Profile</span>
                <div className="oxford-prof-val">{test.leadFullName?.toUpperCase() || 'NGUYỄN VĂN AN'}</div>
              </div>
              <div className="oxford-prof-col id-col">
                <span className="oxford-prof-lbl">ID</span>
                <div className="oxford-prof-val">{testCode}</div>
              </div>
            </div>

            {/* Core 4-Skill Diagnostic Assessment Table */}
            <table className="pt-oxford-table">
              <thead>
                <tr>
                  <th style={{ width: '18%', textAlign: 'left' }}>Skill</th>
                  <th style={{ width: '12%', textAlign: 'center' }}>Score</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>CEFR Level</th>
                  <th style={{ width: '55%', textAlign: 'left' }}>Teacher Assessment</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="skill-name">Listening</td>
                  <td className="skill-score">{scores.listening.toFixed(1)}</td>
                  <td className="skill-cefr">{getCefr(scores.listening).code}</td>
                  <td className="skill-desc">{getSkillDescriptor('listening', scores.listening)}</td>
                </tr>
                <tr>
                  <td className="skill-name">Reading</td>
                  <td className="skill-score">{scores.reading.toFixed(1)}</td>
                  <td className="skill-cefr">{getCefr(scores.reading).code}</td>
                  <td className="skill-desc">{getSkillDescriptor('reading', scores.reading)}</td>
                </tr>
                <tr>
                  <td className="skill-name">Writing</td>
                  <td className="skill-score">{scores.writing.toFixed(1)}</td>
                  <td className="skill-cefr">{getCefr(scores.writing).code}</td>
                  <td className="skill-desc">{getSkillDescriptor('writing', scores.writing)}</td>
                </tr>
                <tr>
                  <td className="skill-name">Speaking</td>
                  <td className="skill-score">{scores.speaking.toFixed(1)}</td>
                  <td className="skill-cefr">{getCefr(scores.speaking).code}</td>
                  <td className="skill-desc">{getSkillDescriptor('speaking', scores.speaking)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="oxford-total-row">
                  <td className="total-lbl">OVERALL BAND</td>
                  <td className="total-score">{scores.overall.toFixed(1)}</td>
                  <td className="total-cefr">{overallCefr.code}</td>
                  <td className="total-desc">
                    <strong>Lộ trình đề xuất:</strong> {recommendedCourse?.courseName || 'Khóa học IELTS Fighter Target 6.5+'} (Cam kết đầu ra: {recommendedCourse?.targetOutput || 'Band 6.5+'})
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Diagnostic Feedback / Examiner Notes */}
            {scores.feedback && (
              <div className="pt-oxford-notes">
                <strong>Ghi chú chuyên môn:</strong> {scores.feedback}
              </div>
            )}

            {/* Footer: Signatures & Official Examination Seal */}
            <div className="pt-oxford-footer">
              <div className="oxford-sig-col">
                <div className="oxford-sig-handwriting">EduFlow</div>
                <div className="oxford-sig-line" />
                <strong className="oxford-sig-title">EduFlow Registrar</strong>
                <span className="oxford-sig-date">{formattedDate}</span>
              </div>

              <div className="oxford-seal-col">
                <div className="oxford-seal-stamp">
                  <svg viewBox="0 0 120 120" width="82" height="82">
                    <defs>
                      <path id="seal-arc-top" d="M 19,60 A 41,41 0 0,1 101,60" fill="none" />
                      <path id="seal-arc-bot" d="M 101,60 A 41,41 0 0,1 19,60" fill="none" />
                    </defs>
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#1c1917" strokeWidth="1.8" strokeDasharray="3 2" />
                    <circle cx="60" cy="60" r="48" fill="none" stroke="#1c1917" strokeWidth="1.6" />
                    <circle cx="60" cy="60" r="32" fill="none" stroke="#1c1917" strokeWidth="1" />
                    <circle cx="21" cy="60" r="1.6" fill="#1c1917" />
                    <circle cx="99" cy="60" r="1.6" fill="#1c1917" />
                    <path d="M 60,42 L 80,51 L 60,60 L 40,51 Z" fill="#1c1917" />
                    <path d="M 47,56 L 47,64 C 47,69 73,69 73,64 L 73,56" fill="none" stroke="#1c1917" strokeWidth="2.2" />
                    <path d="M 78,51 L 78,65" stroke="#1c1917" strokeWidth="1.5" />
                    <circle cx="78" cy="66" r="2" fill="#1c1917" />
                    <text fontSize="6.5" fontFamily="'Playfair Display', Georgia, serif" fontWeight="bold" fill="#1c1917" letterSpacing="0.8">
                      <textPath href="#seal-arc-top" startOffset="50%" textAnchor="middle">CERTIFICATE OF EVALUATION</textPath>
                    </text>
                    <text fontSize="6.5" fontFamily="'Playfair Display', Georgia, serif" fontWeight="bold" fill="#1c1917" letterSpacing="0.8">
                      <textPath href="#seal-arc-bot" startOffset="50%" textAnchor="middle">UNIVERSITY OF EXCELLENCE</textPath>
                    </text>
                  </svg>
                </div>
              </div>

              <div className="oxford-sig-col">
                <div className="oxford-sig-handwriting director">EduFlow</div>
                <div className="oxford-sig-line" />
                <strong className="oxford-sig-title">EduFlow Registrar</strong>
                <span className="oxford-sig-date">{formattedDate}</span>
              </div>
            </div>

            {/* Disclaimer line */}
            <div className="pt-oxford-disclaimer">
              * Phiếu báo điểm kiểm tra năng lực đầu vào này được cấp chính thức bởi Trung tâm Anh ngữ EduFlow, có giá trị học thuật làm căn cứ xếp lớp và đào tạo.
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
