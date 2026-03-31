alter table public.shipments
  add column if not exists customer_email text;

alter table public.shipments
  add column if not exists delivery_address text;

alter table public.shipments
  add column if not exists notes text;
