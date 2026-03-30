import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils/cn';

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger';

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'border-slate-200 bg-slate-100 text-slate-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({
  className,
  variant = 'neutral',
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
