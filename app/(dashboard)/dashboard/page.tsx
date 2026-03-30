import Link from 'next/link';

import { Card } from '@/components/ui/card';

const focusAreas = [
  {
    title: 'Shipments',
    href: '/shipments',
    description: 'Start with shipment sync, status visibility, and cash-on-delivery follow-up.',
  },
  {
    title: 'Returns',
    href: '/returns',
    description: 'Add intake, categorization, and owner workflows once operations are mapped.',
  },
  {
    title: 'Import',
    href: '/import',
    description: 'Use this area for CSV upload, carrier feeds, and validation jobs later on.',
  },
];

export default function DashboardPage() {
  return (
    <>
      <Card className="space-y-4 p-6">
        <p className="text-sm font-medium text-slate-500">Overview</p>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Build the control center one workflow at a time.
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            The dashboard is intentionally lightweight right now. Add live metrics,
            alerts, and role-aware actions once the first operational flows are
            ready for production.
          </p>
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-3">
        {focusAreas.map((item) => (
          <Card className="flex flex-col gap-4 p-6" key={item.title}>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-950">
                {item.title}
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </div>

            <Link
              className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
              href={item.href}
            >
              Open {item.title.toLowerCase()}
            </Link>
          </Card>
        ))}
      </section>
    </>
  );
}
