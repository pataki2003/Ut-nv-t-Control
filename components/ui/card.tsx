import type { HTMLAttributes } from 'react';

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white/85 p-6 shadow-sm shadow-slate-950/[0.04] backdrop-blur ${className}`.trim()}
      {...props}
    />
  );
}
