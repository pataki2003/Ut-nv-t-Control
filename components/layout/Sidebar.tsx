'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavigationItem = {
  href: string;
  label: string;
  description: string;
};

const navigation: NavigationItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    description: 'Overview and priorities',
  },
  {
    href: '/shipments',
    label: 'Shipments',
    description: 'COD shipment workflows',
  },
  {
    href: '/returns',
    label: 'Returns',
    description: 'Return handling and recovery',
  },
  {
    href: '/import',
    label: 'Import',
    description: 'Inbound file and feed ingestion',
  },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-slate-200/80 bg-white/80 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col gap-6 px-4 py-5 sm:px-6 lg:px-5">
        <div className="space-y-2 px-2">
          <Link className="inline-flex flex-col gap-1" href="/dashboard">
            <span className="text-lg font-semibold tracking-tight text-slate-950">
              Utánvét Control
            </span>
            <span className="text-sm leading-6 text-slate-500">
              Clean operational scaffolding for a solo founder.
            </span>
          </Link>
        </div>

        <nav aria-label="Primary" className="overflow-x-auto">
          <ul className="flex gap-2 pb-1 lg:flex-col lg:pb-0">
            {navigation.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <li className="min-w-[220px] lg:min-w-0" key={item.href}>
                  <Link
                    className={`flex flex-col gap-1 rounded-2xl border px-4 py-3 transition ${
                      active
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                        : 'border-slate-200 bg-white/70 text-slate-700 hover:border-slate-300 hover:bg-white'
                    }`}
                    href={item.href}
                  >
                    <span className="text-sm font-semibold">{item.label}</span>
                    <span
                      className={`text-sm leading-5 ${
                        active ? 'text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      {item.description}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <CardNote />
      </div>
    </aside>
  );
}

function CardNote() {
  return (
    <div className="hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm leading-6 text-slate-600 lg:block">
      Auth, database wiring, and live business logic are intentionally left out of
      this first scaffold.
    </div>
  );
}
