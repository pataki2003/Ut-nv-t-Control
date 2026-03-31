import Link from 'next/link';

import { notFound } from 'next/navigation';

import { requireMerchant } from '@/lib/auth/require-merchant';
import { ShipmentStatusBadge } from '@/components/shipments/shipment-status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getShipmentDetail } from '@/lib/db/queries/shipments';

type ShipmentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return '—';
  }

  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return '—';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp);
}

function formatCodAmount(value: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCodStatusLabel(status: string) {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getCodStatusVariant(status: string) {
  switch (status) {
    case 'collected':
      return 'success';
    case 'pending':
      return 'warning';
    case 'failed':
      return 'danger';
    default:
      return 'neutral';
  }
}

export default async function ShipmentDetailPage({
  params,
}: ShipmentDetailPageProps) {
  const auth = await requireMerchant();
  const { id } = await params;
  const shipment = await getShipmentDetail(auth.merchantId, id);

  if (!shipment) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">Shipment detail</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            {shipment.trackingNumber}
          </h1>
          <p className="text-sm leading-6 text-slate-600">
            Review the latest shipment state, linked return data, and status history.
          </p>
        </div>

        <Link href="/shipments">
          <Button type="button" variant="secondary">
            Back to shipments
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="gap-3">
            <CardTitle className="text-xl">Shipment overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pt-0 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">External order ID</p>
              <p className="text-sm text-slate-900">{shipment.orderNumber ?? '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">Customer name</p>
              <p className="text-sm text-slate-900">{shipment.recipientName ?? '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">Courier name</p>
              <p className="text-sm text-slate-900">{shipment.carrierName ?? '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">Last status at</p>
              <p className="text-sm text-slate-900">
                {formatDateTime(shipment.lastStatusAt)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500">Shipment status</p>
              <ShipmentStatusBadge status={shipment.shipmentStatus} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500">COD status</p>
              <Badge variant={getCodStatusVariant(shipment.codStatus)}>
                {formatCodStatusLabel(shipment.codStatus)}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">COD amount</p>
              <p className="text-sm text-slate-900">{formatCodAmount(shipment.codAmount)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">Return linked</p>
              <p className="text-sm text-slate-900">
                {shipment.returnRecord ? 'Yes' : 'No'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3">
            <CardTitle className="text-xl">Status history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {shipment.statusHistory.length === 0 ? (
              <p className="text-sm leading-6 text-slate-600">
                No status history is available for this shipment yet.
              </p>
            ) : (
              shipment.statusHistory.map((entry) => (
                <div
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  key={entry.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <ShipmentStatusBadge status={entry.status} />
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                      {formatDateTime(entry.createdAt)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Source: <span className="font-medium text-slate-900">{entry.source}</span>
                  </p>
                  {entry.note ? (
                    <p className="mt-2 text-sm leading-6 text-slate-700">{entry.note}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
