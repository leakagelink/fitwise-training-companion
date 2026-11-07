import { motion } from "motion/react";

export interface Ring {
  label: string;
  value: number; // 0..1
  colorVar: string; // e.g. "var(--primary)"
}

export function ActivityRings({ rings, size = 148 }: { rings: Ring[]; size?: number }) {
  const stroke = 12;
  const gap = 4;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Daily activity rings">
      {rings.map((ring, i) => {
        const r = size / 2 - stroke / 2 - i * (stroke + gap);
        const c = 2 * Math.PI * r;
        const v = Math.max(0, Math.min(1, ring.value));
        return (
          <g key={ring.label} transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={ring.colorVar} strokeOpacity={0.15} strokeWidth={stroke} />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={ring.colorVar}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: c * (1 - v) }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
            />
          </g>
        );
      })}
    </svg>
  );
}
