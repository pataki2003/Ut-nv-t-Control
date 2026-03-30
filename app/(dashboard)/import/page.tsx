import { Card } from '@/components/ui/Card';

const importStages = ['Upload source file', 'Validate records', 'Preview changes'];

export default function ImportPage() {
  return (
    <>
      <Card className="space-y-3">
        <p className="text-sm font-medium text-slate-500">Import</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Data import placeholder
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          This page is the future home of CSV imports, validation feedback, and
          carrier data ingestion. For now it marks the route and layout contract.
        </p>
      </Card>

      <section className="grid gap-6 md:grid-cols-3">
        {importStages.map((stage, index) => (
          <Card className="space-y-2" key={stage}>
            <p className="text-sm font-medium text-slate-500">Step {index + 1}</p>
            <h2 className="text-base font-semibold text-slate-950">{stage}</h2>
            <p className="text-sm leading-6 text-slate-600">
              Add implementation details once the import format and validation
              rules are finalized.
            </p>
          </Card>
        ))}
      </section>
    </>
  );
}
