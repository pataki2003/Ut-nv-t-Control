import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="flex flex-col justify-center gap-6">
          <div className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-600 shadow-sm">
            MVP scaffold
          </div>

          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              A lean operations hub for COD shipments, returns, and imports.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              This first pass is intentionally focused on structure, clarity, and
              room to grow. Authentication, Supabase, and business workflows come
              next.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <p className="text-sm font-medium text-slate-500">Shipments</p>
              <p className="mt-2 text-sm text-slate-600">
                Centralize COD shipment tracking and follow-up workflows.
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm font-medium text-slate-500">Returns</p>
              <p className="mt-2 text-sm text-slate-600">
                Keep return handling visible and easy to action.
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm font-medium text-slate-500">Import</p>
              <p className="mt-2 text-sm text-slate-600">
                Prepare the app for CSV or carrier data ingestion later on.
              </p>
            </Card>
          </div>
        </section>

        <Card className="mx-auto w-full max-w-md p-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Sign in
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Authentication is not connected yet. This screen is here to define
              the flow and keep the first scaffold production-shaped.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>Work email</span>
              <Input
                autoComplete="email"
                placeholder="founder@utanvetcontrol.hu"
                type="email"
              />
            </label>

            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>Password</span>
              <Input
                autoComplete="current-password"
                placeholder="Coming soon"
                type="password"
              />
            </label>

            <Button className="w-full" disabled>
              Authentication coming soon
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
