import React from 'react';
import { Skeleton } from './Skeleton';
import './Skeleton.css';

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  showHeader = true,
}) => {
  return (
    <div className="table-skeleton-container">
      {showHeader && (
        <div className="table-skeleton-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Skeleton variant="rounded" width={18} height={18} />
            <Skeleton variant="text" width={140} height={14} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Skeleton variant="text" width={100} height={14} />
            <Skeleton variant="text" width={80} height={14} />
            <Skeleton variant="text" width={90} height={14} />
            <Skeleton variant="text" width={60} height={14} />
          </div>
        </div>
      )}

      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="table-skeleton-row">
          {/* Checkbox */}
          <Skeleton variant="rounded" width={18} height={18} />

          {/* Avatar + Main info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px', flex: 1.5 }}>
            <Skeleton variant="circular" width={38} height={38} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <Skeleton variant="text" width="65%" height={14} />
              <Skeleton variant="text" width="45%" height={11} />
            </div>
          </div>

          {/* Secondary Info (Course / Class) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Skeleton variant="text" width="70%" height={13} />
            <Skeleton variant="text" width="50%" height={11} />
          </div>

          {/* Status Badge */}
          <div style={{ width: '100px', display: 'flex', justifyContent: 'center' }}>
            <Skeleton variant="pill" width={75} height={22} />
          </div>

          {/* Meta Date */}
          <div style={{ width: '110px' }}>
            <Skeleton variant="text" width={85} height={12} />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '80px', justifyContent: 'flex-end' }}>
            <Skeleton variant="rounded" width={28} height={28} />
            <Skeleton variant="rounded" width={28} height={28} />
          </div>
        </div>
      ))}
    </div>
  );
};
