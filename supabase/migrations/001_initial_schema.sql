create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'shipment_status'
  ) then
    create type public.shipment_status as enum (
      'created',
      'in_transit',
      'delivered',
      'returned',
      'cancelled'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'cod_status'
  ) then
    create type public.cod_status as enum (
      'pending',
      'collected',
      'remitted',
      'failed',
      'not_applicable'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'return_status'
  ) then
    create type public.return_status as enum (
      'requested',
      'in_transit',
      'received',
      'resolved',
      'cancelled'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'import_status'
  ) then
    create type public.import_status as enum (
      'queued',
      'processing',
      'completed',
      'failed'
    );
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  merchant_id uuid not null references public.merchants (id) on delete restrict,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete restrict,
  tracking_number text not null,
  order_number text,
  carrier_name text,
  recipient_name text,
  recipient_phone text,
  cod_amount numeric(12, 2) not null default 0,
  shipment_status public.shipment_status not null default 'created',
  cod_status public.cod_status not null default 'pending',
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipment_status_history (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete restrict,
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  status public.shipment_status not null,
  note text,
  changed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete restrict,
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  return_status public.return_status not null default 'requested',
  reason text,
  notes text,
  received_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.csv_import_jobs (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete restrict,
  created_by uuid references auth.users (id) on delete set null,
  file_name text not null,
  import_status public.import_status not null default 'queued',
  total_rows integer not null default 0,
  processed_rows integer not null default 0,
  successful_rows integer not null default 0,
  failed_rows integer not null default 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
