import type { ShipmentStatus } from '@/lib/types/shipment';

import { Badge } from '@/components/ui/badge';

type ShipmentStatusBadgeProps = {
  status: ShipmentStatus;
};

const statusVariants: Record<
  ShipmentStatus,
  'neutral' | 'success' | 'warning' | 'danger'
> = {
  created: 'neutral',
  in_transit: 'warning',
  delivered: 'success',
  return_initiated: 'warning',
  returned: 'danger',
  cancelled: 'danger',
};

function formatStatusLabel(status: ShipmentStatus) {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function ShipmentStatusBadge({ status }: ShipmentStatusBadgeProps) {
  return <Badge variant={statusVariants[status]}>{formatStatusLabel(status)}</Badge>;
}
