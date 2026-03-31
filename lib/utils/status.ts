import type { CodStatus, ShipmentStatus } from '@/lib/types/shipment';

type ShipmentTransitionMap = Record<ShipmentStatus, ShipmentStatus[]>;
type CodTransitionMap = Record<CodStatus, CodStatus[]>;

type ShipmentStatusContext = {
  deliveredAt: string | null;
  isReturned: boolean;
  codStatus: CodStatus;
};

type ShipmentStatusSideEffects = {
  deliveredAt: string | null;
  isReturned: boolean;
  nextCodStatus: CodStatus;
  shouldCreateReturn: boolean;
};

const allowedShipmentTransitions: ShipmentTransitionMap = {
  created: ['in_transit', 'cancelled', 'delivered', 'return_initiated', 'returned'],
  in_transit: ['delivered', 'cancelled', 'return_initiated', 'returned'],
  delivered: ['return_initiated', 'returned'],
  return_initiated: ['returned', 'cancelled'],
  returned: [],
  cancelled: [],
};

const allowedCodTransitions: CodTransitionMap = {
  not_applicable: ['pending'],
  pending: ['collected', 'failed', 'not_applicable'],
  failed: ['pending', 'collected', 'not_applicable'],
  collected: ['remitted'],
  remitted: [],
};

export function isAllowedShipmentTransition(
  from: ShipmentStatus,
  to: ShipmentStatus
) {
  if (from === to) {
    return true;
  }

  return allowedShipmentTransitions[from].includes(to);
}

export function isAllowedCodStatusTransition(from: CodStatus, to: CodStatus) {
  if (from === to) {
    return true;
  }

  return allowedCodTransitions[from].includes(to);
}

export function deriveShipmentSideEffects(
  currentShipment: ShipmentStatusContext,
  nextShipmentStatus: ShipmentStatus,
  nextCodStatus?: CodStatus
): ShipmentStatusSideEffects {
  const deliveredAt =
    nextShipmentStatus === 'delivered' && !currentShipment.deliveredAt
      ? new Date().toISOString()
      : currentShipment.deliveredAt;

  return {
    deliveredAt,
    isReturned:
      nextShipmentStatus === 'returned' ? true : currentShipment.isReturned,
    nextCodStatus: nextCodStatus ?? currentShipment.codStatus,
    shouldCreateReturn: nextShipmentStatus === 'return_initiated',
  };
}
