import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

export type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({
  action,
  children,
  className,
  description,
  title,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center',
        className
      )}
      {...props}
    >
      <div className="mx-auto mb-4 h-10 w-10 rounded-full bg-white shadow-sm shadow-slate-950/[0.05]" />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
        <p className="mx-auto max-w-md text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>

      {children ? <div className="mt-4">{children}</div> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
