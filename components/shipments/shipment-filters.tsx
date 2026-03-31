import type { FormEventHandler } from 'react';

import { COD_STATUSES } from '@/lib/constants/cod-status';
import { SHIPMENT_STATUSES } from '@/lib/constants/shipment-status';
import type { CodStatus, ShipmentStatus } from '@/lib/types/shipment';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export type ShipmentFilterValues = {
  search: string;
  shipmentStatus: ShipmentStatus | '';
  codStatus: CodStatus | '';
  courierName: string;
};

type ShipmentFiltersProps = {
  initialValues: ShipmentFilterValues;
  isPending?: boolean;
  onReset: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

function formatOptionLabel(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function ShipmentFilters({
  initialValues,
  isPending = false,
  onReset,
  onSubmit,
}: ShipmentFiltersProps) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle className="text-xl">Filters</CardTitle>
        <p className="text-sm leading-6 text-slate-600">
          Search and narrow the list by shipment status, COD status, and courier.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Search</span>
              <Input
                defaultValue={initialValues.search}
                disabled={isPending}
                name="search"
                placeholder="Tracking number or external order ID"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Shipment status</span>
              <Select
                defaultValue={initialValues.shipmentStatus}
                disabled={isPending}
                name="shipmentStatus"
              >
                <option value="">All shipment statuses</option>
                {SHIPMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {formatOptionLabel(status)}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>COD status</span>
              <Select
                defaultValue={initialValues.codStatus}
                disabled={isPending}
                name="codStatus"
              >
                <option value="">All COD statuses</option>
                {COD_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {formatOptionLabel(status)}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Courier</span>
              <Input
                defaultValue={initialValues.courierName}
                disabled={isPending}
                name="courierName"
                placeholder="Filter by courier name"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={isPending} type="submit">
              Apply filters
            </Button>
            <Button
              disabled={isPending}
              onClick={onReset}
              type="button"
              variant="secondary"
            >
              Clear filters
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
