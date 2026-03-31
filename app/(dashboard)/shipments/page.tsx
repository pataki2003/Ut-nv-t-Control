'use client';

import type { FormEvent } from 'react';
import { useEffect, useState, useTransition } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { ShipmentFilters, type ShipmentFilterValues } from '@/components/shipments/shipment-filters';
import { ShipmentTable } from '@/components/shipments/shipment-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/select';
import { COD_STATUSES } from '@/lib/constants/cod-status';
import { SHIPMENT_STATUSES } from '@/lib/constants/shipment-status';
import type { ApiResponse } from '@/lib/types/api';
import type { CodStatus, Shipment, ShipmentStatus } from '@/lib/types/shipment';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

type ShipmentListData = {
  items: Shipment[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type ShipmentListQueryState = ShipmentFilterValues & {
  page: number;
  pageSize: number;
};

type SearchParamsLike = {
  get: (name: string) => string | null;
};

type QueryContentProps = {
  filters: ShipmentListQueryState;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRowClick: (shipmentId: string) => void;
  queryString: string;
};

type FetchState =
  | {
      status: 'loading';
    }
  | {
      status: 'error';
      errorMessage: string;
    }
  | {
      status: 'success';
      data: ShipmentListData;
    };

function parsePositiveInteger(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return parsedValue;
}

function normalizeQueryValue(value: string | null) {
  return value?.trim() ?? '';
}

function isShipmentStatus(value: string): value is ShipmentStatus {
  return SHIPMENT_STATUSES.includes(value as ShipmentStatus);
}

function isCodStatus(value: string): value is CodStatus {
  return COD_STATUSES.includes(value as CodStatus);
}

function readQueryState(searchParams: SearchParamsLike): ShipmentListQueryState {
  const shipmentStatusValue = normalizeQueryValue(searchParams.get('shipmentStatus'));
  const codStatusValue = normalizeQueryValue(searchParams.get('codStatus'));

  return {
    page: parsePositiveInteger(searchParams.get('page'), DEFAULT_PAGE),
    pageSize: parsePositiveInteger(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE),
    search: normalizeQueryValue(searchParams.get('search')),
    shipmentStatus: isShipmentStatus(shipmentStatusValue) ? shipmentStatusValue : '',
    codStatus: isCodStatus(codStatusValue) ? codStatusValue : '',
    courierName: normalizeQueryValue(searchParams.get('courierName')),
  };
}

function buildQueryString(filters: ShipmentListQueryState) {
  const params = new URLSearchParams();

  if (filters.page !== DEFAULT_PAGE) {
    params.set('page', String(filters.page));
  }

  if (filters.pageSize !== DEFAULT_PAGE_SIZE) {
    params.set('pageSize', String(filters.pageSize));
  }

  if (filters.search) {
    params.set('search', filters.search);
  }

  if (filters.shipmentStatus) {
    params.set('shipmentStatus', filters.shipmentStatus);
  }

  if (filters.codStatus) {
    params.set('codStatus', filters.codStatus);
  }

  if (filters.courierName) {
    params.set('courierName', filters.courierName);
  }

  return params.toString();
}

function hasActiveFilters(filters: ShipmentListQueryState) {
  return Boolean(
    filters.search ||
      filters.shipmentStatus ||
      filters.codStatus ||
      filters.courierName
  );
}

async function getShipments(
  queryString: string,
  signal: AbortSignal
): Promise<ShipmentListData> {
  const requestPath = queryString ? `/api/shipments?${queryString}` : '/api/shipments';
  const response = await fetch(requestPath, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
    signal,
  });

  let payload: ApiResponse<ShipmentListData> | null = null;

  try {
    payload = (await response.json()) as ApiResponse<ShipmentListData>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || !payload.success) {
    const message =
      payload && !payload.success ? payload.error.message : 'Unable to load shipments.';

    throw new Error(message);
  }

  return payload.data;
}

function LoadingShipmentsState() {
  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-64 animate-pulse rounded bg-slate-200" />
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="grid gap-3 md:grid-cols-8" key={index}>
            {Array.from({ length: 8 }).map((__, cellIndex) => (
              <div
                className="h-10 animate-pulse rounded-xl bg-slate-100"
                key={cellIndex}
              />
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ShipmentsQueryContent({
  filters,
  onClearFilters,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  queryString,
}: QueryContentProps) {
  const [fetchState, setFetchState] = useState<FetchState>({
    status: 'loading',
  });
  const [requestVersion, setRequestVersion] = useState(0);

  function handleRetry() {
    setFetchState({
      status: 'loading',
    });
    setRequestVersion((currentVersion) => currentVersion + 1);
  }

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    void (async () => {
      try {
        const data = await getShipments(queryString, controller.signal);

        if (!isActive) {
          return;
        }

        setFetchState({
          status: 'success',
          data,
        });
      } catch (error) {
        if (!isActive || controller.signal.aborted) {
          return;
        }

        setFetchState({
          status: 'error',
          errorMessage:
            error instanceof Error ? error.message : 'Unable to load shipments.',
        });
      }
    })();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [queryString, requestVersion]);

  if (fetchState.status === 'loading') {
    return <LoadingShipmentsState />;
  }

  if (fetchState.status === 'error') {
    return (
      <EmptyState
        action={
          <Button onClick={handleRetry} type="button" variant="secondary">
            Retry
          </Button>
        }
        description={fetchState.errorMessage}
        title="Unable to load shipments"
      />
    );
  }

  const { data } = fetchState;

  if (data.totalCount === 0) {
    return (
      <EmptyState
        action={
          hasActiveFilters(filters) ? (
            <Button onClick={onClearFilters} type="button" variant="secondary">
              Clear filters
            </Button>
          ) : undefined
        }
        description={
          hasActiveFilters(filters)
            ? 'No shipments match the current search and filter combination.'
            : 'No shipments are available yet. Imported or manually created shipments will appear here.'
        }
        title={
          hasActiveFilters(filters) ? 'No matching shipments' : 'No shipments yet'
        }
      />
    );
  }

  const rangeStart = (data.page - 1) * data.pageSize + 1;
  const rangeEnd = Math.min(data.totalCount, data.page * data.pageSize);

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">Shipment list</CardTitle>
            <p className="text-sm leading-6 text-slate-600">
              Showing {rangeStart}-{rangeEnd} of {data.totalCount} shipments for the
              current merchant.
            </p>
          </div>

          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <span>Rows per page</span>
            <Select
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              value={String(data.pageSize)}
            >
              {PAGE_SIZE_OPTIONS.map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <ShipmentTable items={data.items} onRowClick={onRowClick} />

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">
            Page {data.page} of {Math.max(data.totalPages, 1)}
          </p>
          <div className="flex items-center gap-3">
            <Button
              disabled={data.page <= 1}
              onClick={() => onPageChange(data.page - 1)}
              type="button"
              variant="secondary"
            >
              Previous
            </Button>
            <Button
              disabled={data.totalPages === 0 || data.page >= data.totalPages}
              onClick={() => onPageChange(data.page + 1)}
              type="button"
              variant="secondary"
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ShipmentsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isNavigating, startTransition] = useTransition();
  const appliedFilters = readQueryState(searchParams);
  const queryString = buildQueryString(appliedFilters);

  function replaceFilters(nextFilters: ShipmentListQueryState) {
    const nextQueryString = buildQueryString(nextFilters);
    const nextUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;

    startTransition(() => {
      router.replace(nextUrl);
    });
  }

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const shipmentStatusValue = String(formData.get('shipmentStatus') ?? '').trim();
    const codStatusValue = String(formData.get('codStatus') ?? '').trim();

    replaceFilters({
      page: DEFAULT_PAGE,
      pageSize: appliedFilters.pageSize,
      search: String(formData.get('search') ?? '').trim(),
      shipmentStatus: isShipmentStatus(shipmentStatusValue)
        ? shipmentStatusValue
        : '',
      codStatus: isCodStatus(codStatusValue) ? codStatusValue : '',
      courierName: String(formData.get('courierName') ?? '').trim(),
    });
  }

  function handleClearFilters() {
    replaceFilters({
      page: DEFAULT_PAGE,
      pageSize: appliedFilters.pageSize,
      search: '',
      shipmentStatus: '',
      codStatus: '',
      courierName: '',
    });
  }

  function handlePageChange(page: number) {
    replaceFilters({
      ...appliedFilters,
      page,
    });
  }

  function handlePageSizeChange(pageSize: number) {
    replaceFilters({
      ...appliedFilters,
      page: DEFAULT_PAGE,
      pageSize,
    });
  }

  function handleRowClick(shipmentId: string) {
    router.push(`/shipments/${shipmentId}`);
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-6">
        <p className="text-sm font-medium text-slate-500">Shipments</p>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Review the shipment list with the filters operators actually need.
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Keep the table practical: search by tracking or external order ID,
            narrow by shipment or COD status, and scan the latest movement without
            leaving the list view.
          </p>
        </div>
      </Card>

      <ShipmentFilters
        initialValues={{
          search: appliedFilters.search,
          shipmentStatus: appliedFilters.shipmentStatus,
          codStatus: appliedFilters.codStatus,
          courierName: appliedFilters.courierName,
        }}
        isPending={isNavigating}
        key={queryString || 'default'}
        onReset={handleClearFilters}
        onSubmit={handleFilterSubmit}
      />

      <ShipmentsQueryContent
        filters={appliedFilters}
        key={queryString || 'default'}
        onClearFilters={handleClearFilters}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRowClick={handleRowClick}
        queryString={queryString}
      />
    </div>
  );
}
