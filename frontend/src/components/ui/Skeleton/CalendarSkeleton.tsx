import React from 'react';
import { Skeleton } from './Skeleton';
import './Skeleton.css';

export const CalendarSkeleton: React.FC = () => {
  return (
    <div
      style={{
        background: 'var(--glass-bg, rgba(255, 255, 255, 0.75))',
        backdropFilter: 'var(--glass-blur, blur(24px))',
        WebkitBackdropFilter: 'var(--glass-blur, blur(24px))',
        border: 'var(--glass-border-subtle, 1px solid rgba(226, 232, 240, 0.7))',
        borderRadius: 'var(--radius-lg, 20px)',
        padding: '20px',
        boxShadow: 'var(--glass-shadow-sm, 0 4px 16px -2px rgba(124, 58, 237, 0.04))',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Calendar Header Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Skeleton variant="rounded" width={32} height={32} />
          <Skeleton variant="rounded" width={32} height={32} />
          <Skeleton variant="text" width={180} height={18} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Skeleton variant="pill" width={70} height={28} />
        </div>
      </div>

      {/* 7 Days Columns Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '10px',
          width: '100%',
        }}
      >
        {Array.from({ length: 7 }).map((_, dayIdx) => (
          <div
            key={dayIdx}
            style={{
              background: 'rgba(248, 250, 252, 0.7)',
              borderRadius: '12px',
              padding: '12px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              minHeight: '400px',
              border: '1px solid #f1f5f9',
            }}
          >
            {/* Day Header (e.g. Thứ 2, 26/10) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <Skeleton variant="text" width="60%" height={13} />
              <Skeleton variant="pill" width={28} height={18} />
            </div>

            {/* 3 Shifts / Slots per day */}
            {Array.from({ length: 3 }).map((_, slotIdx) => (
              <div
                key={slotIdx}
                style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  padding: '10px',
                  border: '1px solid #f1f5f9',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Skeleton variant="text" width="55%" height={12} />
                  <Skeleton variant="pill" width={36} height={16} />
                </div>
                <Skeleton variant="text" width="80%" height={10} />
                <Skeleton variant="rounded" width="100%" height={20} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
