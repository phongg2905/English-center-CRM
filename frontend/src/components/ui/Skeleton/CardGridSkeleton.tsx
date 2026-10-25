import React from 'react';
import { Skeleton } from './Skeleton';
import './Skeleton.css';

export interface CardGridSkeletonProps {
  count?: number;
}

export const CardGridSkeleton: React.FC<CardGridSkeletonProps> = ({
  count = 6,
}) => {
  return (
    <div className="card-grid-skeleton">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="card-grid-skeleton-item">
          {/* Avatar */}
          <Skeleton variant="circular" width={68} height={68} />

          {/* Teacher Name & Title */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%' }}>
            <Skeleton variant="text" width="60%" height={15} />
            <Skeleton variant="text" width="40%" height={12} />
          </div>

          {/* Skill / Specialization Pills */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Skeleton variant="pill" width={60} height={20} />
            <Skeleton variant="pill" width={50} height={20} />
          </div>

          {/* Stats Bar */}
          <div style={{ width: '100%', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton variant="text" width="45%" height={12} />
            <Skeleton variant="rounded" width={55} height={22} />
          </div>
        </div>
      ))}
    </div>
  );
};
