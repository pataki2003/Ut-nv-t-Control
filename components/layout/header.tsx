'use client';

import { usePathname } from 'next/navigation';

type SectionCopy = {
  title: string;
  description: string;
};

const sectionCopy: Record<string, SectionCopy> = {
  '/dashboard': {
    title: 'Dashboard',
    description: 'Track the current shipment picture and COD exposure at a glance.',
  },
  '/shipments': {
    title: 'Shipments',
    description: 'Review shipment records, status movement, and operational follow-up.',
  },
  '/returns': {
    title: 'Returns',
    description: 'Monitor return records, status progress, and linked shipment impact.',
  },
  '/import': {
    title: 'Imports',
    description: 'Upload shipment files and review import outcomes for the merchant.',
  },
};

function getSectionCopy(pathname: string): SectionCopy {
  const exactMatch = sectionCopy[pathname];

  if (exactMatch) {
    return exactMatch;
  }

  const partialMatch = Object.entries(sectionCopy).find(([key]) =>
    pathname.startsWith(`${key}/`)
  );

  return partialMatch?.[1] ?? sectionCopy['/dashboard'];
}

export function Header() {
  const pathname = usePathname();
  const currentSection = getSectionCopy(pathname);

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">Merchant workspace</p>
          <p className="truncate text-xl font-semibold tracking-tight text-slate-950">
            {currentSection.title}
          </p>
          <p className="hidden text-sm text-slate-600 sm:block">
            {currentSection.description}
          </p>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm">
          MVP dashboard
        </div>
      </div>
    </header>
  );
}
