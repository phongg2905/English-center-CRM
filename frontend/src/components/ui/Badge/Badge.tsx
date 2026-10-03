import React from 'react';
import './Badge.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'brand',
  dot = false,
  className = '',
  ...props
}) => {
  return (
    <span className={`ui-badge ui-badge-${variant} ${className}`} {...props}>
      {dot && <span className="ui-badge-dot" />}
      <span>{children}</span>
    </span>
  );
};
