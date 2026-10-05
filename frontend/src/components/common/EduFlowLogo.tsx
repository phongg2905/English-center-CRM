import React from 'react';
import eduflowLogoImg from '../../assets/brand/eduflow-logo.png';
import eduflowSquareImg from '../../assets/brand/eduflow-logo-square.png';

export interface EduFlowLogoProps {
  /** Chiều cao hiển thị của logo (px), mặc định 38px */
  size?: number;
  className?: string;
  /** Hiển thị chữ 'EduFlow CRM' bên cạnh logo */
  showText?: boolean;
  /** Màu chữ EduFlow khi showText = true */
  textColor?: string;
  /**
   * Biến thể:
   * - 'mark': Logo nguyên bản theo tỷ lệ thực (1.73 : 1)
   * - 'square': Logo căn giữa trong khung vuông 1:1 (thích hợp cho avatar, icon app)
   */
  variant?: 'mark' | 'square';
  style?: React.CSSProperties;
}

/**
 * Biểu tượng Logo chính thức của EduFlow CRM - Concept 1: Edu Cap & Flow
 * Trích xuất chuẩn xác 100% từ bản thiết kế demo gốc:
 * Mũ cử nhân 3D vát cạnh hoàng gia kết hợp cùng làn sóng năng lượng Cosmic Sunset.
 */
export const EduFlowLogo: React.FC<EduFlowLogoProps> = ({
  size = 38,
  className = '',
  showText = false,
  textColor = '#2e1065',
  variant = 'mark',
  style = {},
}) => {
  const imgSrc = variant === 'square' ? eduflowSquareImg : eduflowLogoImg;

  return (
    <div
      className={`eduflow-brand-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: Math.round(size * 0.24),
        userSelect: 'none',
        ...style,
      }}
    >
      <img
        src={imgSrc}
        alt="EduFlow CRM Logo"
        draggable={false}
        style={{
          height: `${size}px`,
          width: variant === 'square' ? `${size}px` : 'auto',
          maxHeight: '100%',
          objectFit: 'contain',
          display: 'block',
          filter: 'drop-shadow(0 2px 8px rgba(124, 58, 237, 0.22))',
        }}
      />

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
          <span
            style={{
              fontSize: `${Math.round(size * 0.44)}px`,
              fontWeight: 800,
              color: textColor,
              letterSpacing: '-0.02em',
              fontFamily: "'Quicksand', sans-serif",
            }}
          >
            EduFlow
          </span>
          <span
            style={{
              fontSize: `${Math.round(size * 0.22)}px`,
              fontWeight: 800,
              letterSpacing: '0.14em',
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textTransform: 'uppercase',
              fontFamily: "'Quicksand', sans-serif",
            }}
          >
            CRM
          </span>
        </div>
      )}
    </div>
  );
};

export default EduFlowLogo;
