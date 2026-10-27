import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationBarProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  compact?: boolean;
  style?: React.CSSProperties;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  itemLabel = 'bản ghi',
  compact = false,
  style,
}) => {
  if (totalItems <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  // Build visible page numbers with ellipsis
  const getPageNumbers = (): (number | 'ellipsis-start' | 'ellipsis-end')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [1];
    if (safePage > 3) {
      pages.push('ellipsis-start');
    }
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (safePage < totalPages - 2) {
      pages.push('ellipsis-end');
    }
    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: compact ? '10px 14px' : '12px 18px',
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        borderRadius: compact ? '0 0 10px 10px' : '12px',
        fontSize: compact ? '12px' : '13px',
        color: '#475569',
        ...style,
      }}
    >
      {/* Left: Range Info & Page Size Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span>
          Hiển thị <strong style={{ color: '#0f172a' }}>{startItem}–{endItem}</strong> trên tổng{' '}
          <strong style={{ color: '#2563eb' }}>{totalItems}</strong> {itemLabel}
        </span>

        {onPageSizeChange && pageSizeOptions.length > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#94a3b8' }}>•</span>
            <span style={{ color: '#64748b', fontSize: '12px' }}>Mỗi trang:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#0f172a',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} {itemLabel}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: compact ? '4px 8px' : '5px 10px',
            borderRadius: '7px',
            border: '1px solid #e2e8f0',
            background: safePage <= 1 ? '#f8fafc' : '#ffffff',
            color: safePage <= 1 ? '#cbd5e1' : '#334155',
            fontSize: '12px',
            fontWeight: 600,
            cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <ChevronLeft size={14} />
          <span>Trước</span>
        </button>

        {pageNumbers.map((item) => {
          if (item === 'ellipsis-start' || item === 'ellipsis-end') {
            return (
              <span
                key={item}
                style={{
                  padding: '0 4px',
                  color: '#94a3b8',
                  fontWeight: 600,
                  userSelect: 'none',
                }}
              >
                ...
              </span>
            );
          }

          const isActive = item === safePage;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              style={{
                minWidth: compact ? '28px' : '32px',
                height: compact ? '28px' : '32px',
                padding: '0 6px',
                borderRadius: '7px',
                border: isActive ? '1px solid #2563eb' : '1px solid #e2e8f0',
                background: isActive ? '#2563eb' : '#ffffff',
                color: isActive ? '#ffffff' : '#334155',
                fontSize: '12.5px',
                fontWeight: isActive ? 700 : 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isActive ? '0 2px 6px rgba(37, 99, 235, 0.25)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {item}
            </button>
          );
        })}

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: compact ? '4px 8px' : '5px 10px',
            borderRadius: '7px',
            border: '1px solid #e2e8f0',
            background: safePage >= totalPages ? '#f8fafc' : '#ffffff',
            color: safePage >= totalPages ? '#cbd5e1' : '#334155',
            fontSize: '12px',
            fontWeight: 600,
            cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span>Sau</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

