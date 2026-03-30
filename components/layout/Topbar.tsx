'use client';

import { usePathname } from 'next/navigation';

type SectionCopy = {
  title: string;
  description: string;
};

const sectionCopy: Record<string, SectionCopy> = {
  '/dashboard': {
    title: 'Dashboard',
    description: 'High-level overview for the first operational workflows.',
  },
  '/shipments': {
    title: 'Shipments',
    description: 'A future home for COD shipment monitoring and follow-up.',
  },
  '/returns': {
    title: 'Returns',
    description: 'Reserved for return handling, triage, and resolution.',
  },
  '/import': {
    title: 'Import',
    description: 'Prepared for file ingestion and validation flows.',
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

export function Topbar() {
  const pathname = usePathname();
  const currentSection = getSectionCopy(pathname);

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/75 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">Utánvét Control</p>
          <p className="truncate text-xl font-semibold tracking-tight text-slate-950">
            {currentSection.title}
          </p>
          <p className="hidden text-sm text-slate-600 sm:block">
            {currentSection.description}
          </p>
        </div>

        <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm">
          MVP scaffold
        </div>
      </div>
    </header>
  );
}
