do $$
begin
  if not exists (
    select 1
    from pg_enum
    where enumlabel = 'return_initiated'
      and enumtypid = 'public.shipment_status'::regtype
  ) then
    alter type public.shipment_status add value 'return_initiated';
  end if;
end
$$;

alter table public.shipments
  add column if not exists is_returned boolean;

update public.shipments
set is_returned = true
where shipment_status = 'returned'
  and coalesce(is_returned, false) = false;

alter table public.shipments
  alter column is_returned set default false;

update public.shipments
set is_returned = false
where is_returned is null;

alter table public.shipments
  alter column is_returned set not null;
