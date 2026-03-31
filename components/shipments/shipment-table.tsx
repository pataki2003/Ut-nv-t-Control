'use client';

import type { KeyboardEvent } from 'react';

import type { Shipment } from '@/lib/types/shipment';

import { ShipmentStatusBadge } from '@/components/shipments/shipment-status-badge';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type ShipmentTableProps = {
  items: Shipment[];
  onRowClick: (shipmentId: string) => void;
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

function formatCodStatusLabel(status: Shipment['codStatus']) {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getCodStatusVariant(status: Shipment['codStatus']) {
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

export function ShipmentTable({ items, onRowClick }: ShipmentTableProps) {
  function handleRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    shipmentId: string
  ) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    onRowClick(shipmentId);
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tracking number</TableHead>
          <TableHead>External order ID</TableHead>
          <TableHead>Customer name</TableHead>
          <TableHead>Courier name</TableHead>
          <TableHead>Shipment status</TableHead>
          <TableHead>COD amount</TableHead>
          <TableHead>COD status</TableHead>
          <TableHead>Last status at</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((shipment) => (
          <TableRow
            className="cursor-pointer focus-within:bg-slate-50/80 focus:outline-none"
            key={shipment.id}
            onClick={() => onRowClick(shipment.id)}
            onKeyDown={(event) => handleRowKeyDown(event, shipment.id)}
            role="link"
            tabIndex={0}
          >
            <TableCell className="font-semibold text-slate-950">
              {shipment.trackingNumber}
            </TableCell>
            <TableCell>{shipment.orderNumber ?? '—'}</TableCell>
            <TableCell>{shipment.recipientName ?? '—'}</TableCell>
            <TableCell>{shipment.carrierName ?? '—'}</TableCell>
            <TableCell>
              <ShipmentStatusBadge status={shipment.shipmentStatus} />
            </TableCell>
            <TableCell className="font-medium text-slate-950">
              {formatCodAmount(shipment.codAmount)}
            </TableCell>
            <TableCell>
              <Badge variant={getCodStatusVariant(shipment.codStatus)}>
                {formatCodStatusLabel(shipment.codStatus)}
              </Badge>
            </TableCell>
            <TableCell>{formatDateTime(shipment.lastStatusAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
