alter table public.shipment_status_history
  add column if not exists source text;

update public.shipment_status_history
set source = 'system'
where source is null;

alter table public.shipment_status_history
  alter column source set default 'system';

alter table public.shipment_status_history
  alter column source set not null;
