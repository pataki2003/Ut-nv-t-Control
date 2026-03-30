create or replace function public.current_merchant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select merchant_id
  from public.profiles
  where id = auth.uid()
  limit 1
$$;

revoke all on function public.current_merchant_id() from public;
grant execute on function public.current_merchant_id() to authenticated;

alter table public.merchants enable row level security;
alter table public.profiles enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_status_history enable row level security;
alter table public.returns enable row level security;
alter table public.csv_import_jobs enable row level security;

drop policy if exists merchants_select_same_merchant on public.merchants;
create policy merchants_select_same_merchant
on public.merchants
for select
to authenticated
using (id = public.current_merchant_id());

drop policy if exists profiles_select_same_merchant on public.profiles;
create policy profiles_select_same_merchant
on public.profiles
for select
to authenticated
using (merchant_id = public.current_merchant_id());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and merchant_id = public.current_merchant_id()
);

drop policy if exists shipments_select_same_merchant on public.shipments;
create policy shipments_select_same_merchant
on public.shipments
for select
to authenticated
using (merchant_id = public.current_merchant_id());

drop policy if exists shipments_insert_same_merchant on public.shipments;
create policy shipments_insert_same_merchant
on public.shipments
for insert
to authenticated
with check (merchant_id = public.current_merchant_id());

drop policy if exists shipments_update_same_merchant on public.shipments;
create policy shipments_update_same_merchant
on public.shipments
for update
to authenticated
using (merchant_id = public.current_merchant_id())
with check (merchant_id = public.current_merchant_id());

drop policy if exists shipment_status_history_select_same_merchant on public.shipment_status_history;
create policy shipment_status_history_select_same_merchant
on public.shipment_status_history
for select
to authenticated
using (merchant_id = public.current_merchant_id());

drop policy if exists shipment_status_history_insert_same_merchant on public.shipment_status_history;
create policy shipment_status_history_insert_same_merchant
on public.shipment_status_history
for insert
to authenticated
with check (merchant_id = public.current_merchant_id());

drop policy if exists shipment_status_history_update_same_merchant on public.shipment_status_history;
create policy shipment_status_history_update_same_merchant
on public.shipment_status_history
for update
to authenticated
using (merchant_id = public.current_merchant_id())
with check (merchant_id = public.current_merchant_id());

drop policy if exists returns_select_same_merchant on public.returns;
create policy returns_select_same_merchant
on public.returns
for select
to authenticated
using (merchant_id = public.current_merchant_id());

drop policy if exists returns_insert_same_merchant on public.returns;
create policy returns_insert_same_merchant
on public.returns
for insert
to authenticated
with check (merchant_id = public.current_merchant_id());

drop policy if exists returns_update_same_merchant on public.returns;
create policy returns_update_same_merchant
on public.returns
for update
to authenticated
using (merchant_id = public.current_merchant_id())
with check (merchant_id = public.current_merchant_id());

drop policy if exists csv_import_jobs_select_same_merchant on public.csv_import_jobs;
create policy csv_import_jobs_select_same_merchant
on public.csv_import_jobs
for select
to authenticated
using (merchant_id = public.current_merchant_id());

drop policy if exists csv_import_jobs_insert_same_merchant on public.csv_import_jobs;
create policy csv_import_jobs_insert_same_merchant
on public.csv_import_jobs
for insert
to authenticated
with check (merchant_id = public.current_merchant_id());

drop policy if exists csv_import_jobs_update_same_merchant on public.csv_import_jobs;
create policy csv_import_jobs_update_same_merchant
on public.csv_import_jobs
for update
to authenticated
using (merchant_id = public.current_merchant_id())
with check (merchant_id = public.current_merchant_id());
