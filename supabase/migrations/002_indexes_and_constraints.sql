do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shipments_merchant_id_tracking_number_key'
      and conrelid = 'public.shipments'::regclass
  ) then
    alter table public.shipments
      add constraint shipments_merchant_id_tracking_number_key
      unique (merchant_id, tracking_number);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'returns_shipment_id_key'
      and conrelid = 'public.returns'::regclass
  ) then
    alter table public.returns
      add constraint returns_shipment_id_key
      unique (shipment_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shipments_cod_amount_non_negative'
      and conrelid = 'public.shipments'::regclass
  ) then
    alter table public.shipments
      add constraint shipments_cod_amount_non_negative
      check (cod_amount >= 0);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'csv_import_jobs_total_rows_non_negative'
      and conrelid = 'public.csv_import_jobs'::regclass
  ) then
    alter table public.csv_import_jobs
      add constraint csv_import_jobs_total_rows_non_negative
      check (total_rows >= 0);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'csv_import_jobs_processed_rows_non_negative'
      and conrelid = 'public.csv_import_jobs'::regclass
  ) then
    alter table public.csv_import_jobs
      add constraint csv_import_jobs_processed_rows_non_negative
      check (processed_rows >= 0);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'csv_import_jobs_successful_rows_non_negative'
      and conrelid = 'public.csv_import_jobs'::regclass
  ) then
    alter table public.csv_import_jobs
      add constraint csv_import_jobs_successful_rows_non_negative
      check (successful_rows >= 0);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'csv_import_jobs_failed_rows_non_negative'
      and conrelid = 'public.csv_import_jobs'::regclass
  ) then
    alter table public.csv_import_jobs
      add constraint csv_import_jobs_failed_rows_non_negative
      check (failed_rows >= 0);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'csv_import_jobs_processed_rows_lte_total_rows'
      and conrelid = 'public.csv_import_jobs'::regclass
  ) then
    alter table public.csv_import_jobs
      add constraint csv_import_jobs_processed_rows_lte_total_rows
      check (processed_rows <= total_rows);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'csv_import_jobs_result_rows_lte_processed_rows'
      and conrelid = 'public.csv_import_jobs'::regclass
  ) then
    alter table public.csv_import_jobs
      add constraint csv_import_jobs_result_rows_lte_processed_rows
      check (successful_rows + failed_rows <= processed_rows);
  end if;
end
$$;

create index if not exists idx_profiles_merchant_id
  on public.profiles (merchant_id);

create index if not exists idx_shipments_merchant_status_created_at
  on public.shipments (merchant_id, shipment_status, created_at desc);

create index if not exists idx_shipments_merchant_cod_status_created_at
  on public.shipments (merchant_id, cod_status, created_at desc);

create index if not exists idx_shipment_status_history_merchant_shipment_created_at
  on public.shipment_status_history (merchant_id, shipment_id, created_at desc);

create index if not exists idx_returns_merchant_status_created_at
  on public.returns (merchant_id, return_status, created_at desc);

create index if not exists idx_csv_import_jobs_merchant_status_created_at
  on public.csv_import_jobs (merchant_id, import_status, created_at desc);

drop trigger if exists trg_merchants_set_updated_at on public.merchants;
create trigger trg_merchants_set_updated_at
before update on public.merchants
for each row
execute function public.set_updated_at();

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_shipments_set_updated_at on public.shipments;
create trigger trg_shipments_set_updated_at
before update on public.shipments
for each row
execute function public.set_updated_at();

drop trigger if exists trg_returns_set_updated_at on public.returns;
create trigger trg_returns_set_updated_at
before update on public.returns
for each row
execute function public.set_updated_at();

drop trigger if exists trg_csv_import_jobs_set_updated_at on public.csv_import_jobs;
create trigger trg_csv_import_jobs_set_updated_at
before update on public.csv_import_jobs
for each row
execute function public.set_updated_at();
