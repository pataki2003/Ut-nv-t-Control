'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { CodSummary } from '@/components/dashboard/cod-summary';
import { MetricCard } from '@/components/dashboard/metric-card';
import type { ApiResponse } from '@/lib/types/api';

type DashboardSummary = {
  totalShipments: number;
  inTransitCount: number;
  deliveredCount: number;
  failedCount: number;
  returnedCount: number;
  pendingCodAmount: number;
  collectedCodAmount: number;
  failedCodAmount: number;
};

type StatusState = 'loading' | 'success' | 'error';

function formatCount(value: number) {
  return new Intl.NumberFormat().format(value);
}

function isEmptySummary(summary: DashboardSummary) {
  return (
    summary.totalShipments === 0 &&
    summary.inTransitCount === 0 &&
    summary.deliveredCount === 0 &&
    summary.failedCount === 0 &&
    summary.returnedCount === 0 &&
    summary.pendingCodAmount === 0 &&
    summary.collectedCodAmount === 0 &&
    summary.failedCodAmount === 0
  );
}

async function getDashboardSummary(signal: AbortSignal): Promise<DashboardSummary> {
  const response = await fetch('/api/dashboard/summary', {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
    signal,
  });

  let payload: ApiResponse<DashboardSummary> | null = null;

  try {
    payload = (await response.json()) as ApiResponse<DashboardSummary>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || !payload.success) {
    const message =
      payload && !payload.success
        ? payload.error.message
        : 'Unable to load dashboard summary.';

    throw new Error(message);
  }

  return payload.data;
}

function LoadingOverview() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card className="h-full" key={index}>
            <CardHeader className="gap-3 pb-3">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
              <div className="h-10 w-20 animate-pulse rounded bg-slate-200" />
            </CardHeader>
            <CardContent>
              <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-72 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card className="h-full" key={index}>
              <CardHeader className="gap-3 pb-3">
                <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                <div className="h-10 w-24 animate-pulse rounded bg-slate-200" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export function StatusOverview() {
  const [status, setStatus] = useState<StatusState>('loading');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  function handleRetry() {
    setStatus('loading');
    setErrorMessage(null);
    setRequestVersion((currentVersion) => currentVersion + 1);
  }

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    void (async () => {
      try {
        const nextSummary = await getDashboardSummary(controller.signal);

        if (!isActive) {
          return;
        }

        setSummary(nextSummary);
        setStatus('success');
      } catch (error) {
        if (!isActive || controller.signal.aborted) {
          return;
        }

        setSummary(null);
        setStatus('error');
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load dashboard summary.'
        );
      }
    })();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [requestVersion]);

  if (status === 'loading') {
    return <LoadingOverview />;
  }

  if (status === 'error') {
    return (
      <EmptyState
        action={
          <Button onClick={handleRetry} type="button" variant="secondary">
            Retry
          </Button>
        }
        description={
          errorMessage ??
          'The summary could not be loaded right now. Try again in a moment.'
        }
        title="Dashboard summary unavailable"
      />
    );
  }

  if (!summary || isEmptySummary(summary)) {
    return (
      <EmptyState
        description="Once shipments start flowing into the system, the dashboard will show operational counts and COD totals here."
        title="No dashboard data yet"
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          description="All shipments currently tracked for this merchant."
          label="Total shipments"
          value={formatCount(summary.totalShipments)}
        />
        <MetricCard
          description="Shipments actively moving through the delivery journey."
          label="In transit"
          value={formatCount(summary.inTransitCount)}
        />
        <MetricCard
          description="Shipments marked as delivered and operationally complete."
          label="Delivered"
          value={formatCount(summary.deliveredCount)}
        />
        <MetricCard
          description="Shipments mapped to the cancelled status in the current MVP."
          label="Failed"
          value={formatCount(summary.failedCount)}
        />
        <MetricCard
          description="Shipments that have already been returned."
          label="Returned"
          value={formatCount(summary.returnedCount)}
        />
      </section>

      <CodSummary
        collectedCodAmount={summary.collectedCodAmount}
        failedCodAmount={summary.failedCodAmount}
        pendingCodAmount={summary.pendingCodAmount}
      />
    </div>
  );
}
