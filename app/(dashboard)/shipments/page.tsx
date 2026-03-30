import { Card } from '@/components/ui/card';

const shipmentPlaceholders = [
  'Carrier ingestion and shipment sync',
  'COD payment status tracking',
  'Operational follow-up queues',
];

export default function ShipmentsPage() {
  return (
    <>
      <Card className="space-y-3 p-6">
        <p className="text-sm font-medium text-slate-500">Shipments</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Shipment operations placeholder
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          This page is reserved for the shipment list, filters, and COD-related
          actions. Keep it focused on operational clarity instead of feature
          breadth.
        </p>
      </Card>

      <section className="grid gap-6 lg:grid-cols-3">
        {shipmentPlaceholders.map((item) => (
          <Card className="space-y-2 p-6" key={item}>
            <h2 className="text-base font-semibold text-slate-950">{item}</h2>
            <p className="text-sm leading-6 text-slate-600">
              Add the first real workflow here when shipment data and ownership
              rules are ready.
            </p>
          </Card>
        ))}
      </section>
    </>
  );
}
