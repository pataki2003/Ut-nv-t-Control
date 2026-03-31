import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type MetricCardProps = {
  label: string;
  value: string;
  description: string;
};

export function MetricCard({ description, label, value }: MetricCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="gap-2 pb-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <CardTitle className="font-mono text-3xl tracking-tight text-slate-950">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </CardContent>
    </Card>
  );
}
