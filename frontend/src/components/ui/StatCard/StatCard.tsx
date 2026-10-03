import React from 'react';
import './StatCard.css';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  delta?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  sparklineData?: number[];
  color?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  delta,
  icon,
  sparklineData = [20, 25, 22, 30, 28, 35, 42, 38, 48, 55],
  color = '#7c3aed',
  className = '',
}) => {
  // Generate SVG path points from sparklineData
  const min = Math.min(...sparklineData);
  const max = Math.max(...sparklineData);
  const range = max - min || 1;
  const width = 240;
  const height = 36;
  const step = width / (sparklineData.length - 1);

  const points = sparklineData
    .map((val, idx) => {
      const x = idx * step;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  const pathD = `M ${points.split(' ').join(' L ')}`;
  const areaD = `M 0,${height} L ${points.split(' ').join(' L ')} L ${width},${height} Z`;

  return (
    <div className={`ui-stat-card ${className}`}>
      <div className="ui-stat-card-header">
        <span className="ui-stat-card-title">{title}</span>
        {icon && <div className="ui-stat-card-icon">{icon}</div>}
      </div>

      <div className="ui-stat-card-main">
        <div className="ui-stat-card-value">{value}</div>
        {delta && (
          <span className={`ui-stat-card-delta ${delta.isPositive ? 'positive' : 'negative'}`}>
            {delta.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {delta.value}
          </span>
        )}
      </div>

      <svg className="ui-stat-sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#grad-${title.replace(/\s+/g, '')})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};
