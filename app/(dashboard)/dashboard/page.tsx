import { StatusOverview } from '@/components/dashboard/status-overview';
import { Card } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <>
      <Card className="space-y-4 p-6">
        <p className="text-sm font-medium text-slate-500">Operations summary</p>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Keep the daily shipment picture visible and operationally calm.
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            This dashboard focuses on the key merchant totals first: shipment
            volume, status distribution, and COD exposure. Add deeper workflow
            actions once the shipment, return, and import surfaces mature.
          </p>
        </div>
      </Card>

      <StatusOverview />
    </>
  );
}
