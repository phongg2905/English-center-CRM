import React from 'react';
import { Skeleton } from './Skeleton';
import './Skeleton.css';

export interface KanbanSkeletonProps {
  columns?: number;
  cardsPerColumn?: number;
}

export const KanbanSkeleton: React.FC<KanbanSkeletonProps> = ({
  columns = 5,
  cardsPerColumn = 3,
}) => {
  return (
    <div className="kanban-skeleton-board">
      {Array.from({ length: columns }).map((_, colIdx) => (
        <div key={colIdx} className="kanban-skeleton-col">
          {/* Column Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Skeleton variant="circular" width={10} height={10} />
              <Skeleton variant="text" width={110} height={15} />
            </div>
            <Skeleton variant="pill" width={26} height={18} />
          </div>

          {/* Cards in column */}
          {Array.from({ length: cardsPerColumn }).map((_, cardIdx) => (
            <div key={cardIdx} className="kanban-skeleton-card">
              {/* Header: Name + Temperature Pill */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Skeleton variant="text" width="55%" height={14} />
                <Skeleton variant="pill" width={50} height={18} />
              </div>

              {/* Phone & Date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Skeleton variant="text" width="70%" height={12} />
                <Skeleton variant="text" width="45%" height={11} />
              </div>

              {/* Tags & Action row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <Skeleton variant="rounded" width={75} height={20} />
                <Skeleton variant="circular" width={24} height={24} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
