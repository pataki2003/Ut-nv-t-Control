import { MetricCard } from '@/components/dashboard/metric-card';

type CodSummaryProps = {
  pendingCodAmount: number;
  collectedCodAmount: number;
  failedCodAmount: number;
};

function formatAmount(value: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function CodSummary({
  collectedCodAmount,
  failedCodAmount,
  pendingCodAmount,
}: CodSummaryProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">
          COD summary
        </h2>
        <p className="text-sm leading-6 text-slate-600">
          Follow the merchant&apos;s current cash-on-delivery exposure across pending,
          collected, and failed payment states.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          description="Outstanding COD amount that still needs collection."
          label="Pending COD"
          value={formatAmount(pendingCodAmount)}
        />
        <MetricCard
          description="COD amount already collected from successful deliveries."
          label="Collected COD"
          value={formatAmount(collectedCodAmount)}
        />
        <MetricCard
          description="COD amount tied to failed payment collection attempts."
          label="Failed COD"
          value={formatAmount(failedCodAmount)}
        />
      </div>
    </section>
  );
}
