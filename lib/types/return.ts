export type ReturnStatus =
  | 'requested'
  | 'in_transit'
  | 'received'
  | 'resolved'
  | 'cancelled';

export interface ReturnShipmentSummary {
  id: string;
  trackingNumber: string;
  orderNumber: string | null;
  recipientName: string | null;
}

export interface ReturnRecord {
  id: string;
  merchantId: string;
  shipmentId: string;
  returnStatus: ReturnStatus;
  reason: string | null;
  notes: string | null;
  receivedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  shipment?: ReturnShipmentSummary | null;
}
