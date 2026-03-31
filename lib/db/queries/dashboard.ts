import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type DashboardSummary = {
  totalShipments: number;
  inTransitCount: number;
  deliveredCount: number;
  failedCount: number;
  returnedCount: number;
  pendingCodAmount: number;
  collectedCodAmount: number;
  failedCodAmount: number;
};

type ShipmentSummaryRow = {
  shipment_status: string;
  cod_status: string;
  cod_amount: number | string | null;
};

function createEmptyDashboardSummary(): DashboardSummary {
  return {
    totalShipments: 0,
    inTransitCount: 0,
    deliveredCount: 0,
    failedCount: 0,
    returnedCount: 0,
    pendingCodAmount: 0,
    collectedCodAmount: 0,
    failedCodAmount: 0,
  };
}

function parseCodAmount(value: number | string | null) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  return 0;
}

export async function getDashboardSummary(
  merchantId: string
): Promise<DashboardSummary> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('shipments')
    .select('shipment_status, cod_status, cod_amount')
    .eq('merchant_id', merchantId);

  if (error) {
    throw error;
  }

  const shipments = (data ?? []) as ShipmentSummaryRow[];
  const summary = createEmptyDashboardSummary();

  for (const shipment of shipments) {
    summary.totalShipments += 1;

    if (shipment.shipment_status === 'in_transit') {
      summary.inTransitCount += 1;
    }

    if (shipment.shipment_status === 'delivered') {
      summary.deliveredCount += 1;
    }

    if (shipment.shipment_status === 'cancelled') {
      summary.failedCount += 1;
    }

    if (shipment.shipment_status === 'returned') {
      summary.returnedCount += 1;
    }

    const codAmount = parseCodAmount(shipment.cod_amount);

    if (shipment.cod_status === 'pending') {
      summary.pendingCodAmount += codAmount;
    }

    if (shipment.cod_status === 'collected') {
      summary.collectedCodAmount += codAmount;
    }

    if (shipment.cod_status === 'failed') {
      summary.failedCodAmount += codAmount;
    }
  }

  return summary;
}
