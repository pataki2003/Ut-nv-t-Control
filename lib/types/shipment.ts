import type { ReturnRecord } from '@/lib/types/return';

export type ShipmentStatus =
  | 'created'
  | 'in_transit'
  | 'delivered'
  | 'return_initiated'
  | 'returned'
  | 'cancelled';

export type CodStatus =
  | 'pending'
  | 'collected'
  | 'remitted'
  | 'failed'
  | 'not_applicable';

export interface Shipment {
  id: string;
  merchantId: string;
  trackingNumber: string;
  orderNumber: string | null;
  carrierName: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  customerEmail: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  isReturned: boolean;
  codAmount: number;
  shipmentStatus: ShipmentStatus;
  codStatus: CodStatus;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentStatusHistoryEntry {
  id: string;
  merchantId: string;
  shipmentId: string;
  status: ShipmentStatus;
  source: string;
  note: string | null;
  changedBy: string | null;
  createdAt: string;
}

export interface ShipmentDetail extends Shipment {
  statusHistory: ShipmentStatusHistoryEntry[];
  returnRecord: ReturnRecord | null;
}
