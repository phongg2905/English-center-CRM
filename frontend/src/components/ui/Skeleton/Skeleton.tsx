import React from 'react';
import './Skeleton.css';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rounded' | 'rectangular' | 'pill';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  animate = true,
  className = '',
  style,
  ...props
}) => {
  const computedStyle: React.CSSProperties = {
    ...style,
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div
      className={`eduflow-skeleton eduflow-skeleton-${variant} ${animate ? 'eduflow-skeleton-animated' : ''} ${className}`.trim()}
      style={computedStyle}
      {...props}
    />
  );
};
