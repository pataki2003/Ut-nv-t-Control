import { Card } from '@/components/ui/card';

export default function ReturnsPage() {
  return (
    <>
      <Card className="space-y-3 p-6">
        <p className="text-sm font-medium text-slate-500">Returns</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Returns workspace placeholder
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Use this route for return intake, investigation, and follow-up
          resolution flows once the first return process is mapped.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-3 p-6">
          <h2 className="text-lg font-semibold text-slate-950">
            Planned surface area
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            A future version can include reason codes, owner assignment, evidence,
            and payout recovery status in one structured view.
          </p>
        </Card>

        <Card className="space-y-3 border-dashed p-6">
          <h2 className="text-lg font-semibold text-slate-950">
            Not implemented yet
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            No live data, forms, or queue logic is connected in this scaffold.
          </p>
        </Card>
      </div>
    </>
  );
}
