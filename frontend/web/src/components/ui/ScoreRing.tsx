'use client';
import { cn } from '@/lib/utils';

interface ScoreRingProps {
  score: number;       // 0–100
  size?: number;       // px
  strokeWidth?: number;
  label?: string;
  color?: string;
  className?: string;
}

export function ScoreRing({
  score,
  size = 80,
  strokeWidth = 7,
  label,
  color,
  className,
}: ScoreRingProps) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  const autoColor =
    score >= 75 ? '#10b981' :
    score >= 50 ? '#f59e0b' :
                  '#f43f5e';

  const strokeColor = color || autoColor;

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <svg width={size} height={size} role="img" aria-label={`Score: ${score}%`}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="#2a2a45" strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        {/* Value */}
        <text
          x="50%" y="50%"
          dominantBaseline="middle" textAnchor="middle"
          fill="white" fontSize={size * 0.22} fontWeight="700"
        >
          {score}
        </text>
      </svg>
      {label && <p className="text-xs text-slate-400 text-center">{label}</p>}
    </div>
  );
}
