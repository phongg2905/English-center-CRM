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
  gradientColors?: [string, string];
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  delta,
  icon,
  sparklineData = [20, 25, 22, 30, 28, 35, 42, 38, 48, 55],
  color = '#7c3aed',
  gradientColors,
  className = '',
}) => {
  const startColor = gradientColors ? gradientColors[0] : color;
  const endColor = gradientColors ? gradientColors[1] : color;

  // Safe unique ID for SVG defs
  const safeId = title.replace(/[^a-zA-Z0-9]/g, '');

  // Generate SVG path points from sparklineData
  const min = Math.min(...sparklineData);
  const max = Math.max(...sparklineData);
  const range = max - min || 1;
  const width = 240;
  const height = 40;
  const step = width / (sparklineData.length - 1);

  const points = sparklineData
    .map((val, idx) => {
      const x = idx * step;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(' ');

  const pathD = `M ${points.split(' ').join(' L ')}`;
  const areaD = `M 0,${height} L ${points.split(' ').join(' L ')} L ${width},${height} Z`;

  return (
    <div className={`ui-stat-card ${className}`}>
      <div className="ui-stat-card-header">
        <span className="ui-stat-card-title">{title}</span>
        {icon && (
          <div
            className="ui-stat-card-icon"
            style={{
              background: `color-mix(in srgb, ${startColor} 12%, transparent)`,
              color: startColor,
              border: `1px solid color-mix(in srgb, ${startColor} 20%, transparent)`,
            }}
          >
            {icon}
          </div>
        )}
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
          {/* Luminous Glow Filter */}
          <filter id={`glow-${safeId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor={startColor} floodOpacity="0.35" />
          </filter>

          {/* Area Fill Gradient (Vertical drop) */}
          <linearGradient id={`area-${safeId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={startColor} stopOpacity="0.22" />
            <stop offset="85%" stopColor={endColor} stopOpacity="0.04" />
            <stop offset="100%" stopColor={endColor} stopOpacity="0.0" />
          </linearGradient>

          {/* Stroke Gradient (Horizontal ribbon flow) */}
          <linearGradient id={`stroke-${safeId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
        </defs>

        <path d={areaD} fill={`url(#area-${safeId})`} />
        <path
          d={pathD}
          fill="none"
          stroke={`url(#stroke-${safeId})`}
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#glow-${safeId})`}
        />
      </svg>
    </div>
  );
};
