do $$
begin
  begin
    alter table public.csv_import_jobs
      rename column success_rows to successful_rows;
  exception
    when undefined_column then null;
    when duplicate_column then null;
  end;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'csv_import_jobs'
      and column_name = 'success_rows'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'csv_import_jobs'
      and column_name = 'successful_rows'
  ) then
    execute '
      update public.csv_import_jobs
      set successful_rows = coalesce(successful_rows, success_rows)
      where successful_rows is null
    ';
  end if;
end
$$;

alter table public.csv_import_jobs
  add column if not exists processed_rows integer;

alter table public.csv_import_jobs
  add column if not exists successful_rows integer;

alter table public.csv_import_jobs
  add column if not exists failed_rows integer;

update public.csv_import_jobs
set processed_rows = 0
where processed_rows is null;

update public.csv_import_jobs
set successful_rows = 0
where successful_rows is null;

update public.csv_import_jobs
set failed_rows = 0
where failed_rows is null;

alter table public.csv_import_jobs
  alter column processed_rows set default 0;

alter table public.csv_import_jobs
  alter column successful_rows set default 0;

alter table public.csv_import_jobs
  alter column failed_rows set default 0;

alter table public.csv_import_jobs
  alter column processed_rows set not null;

alter table public.csv_import_jobs
  alter column successful_rows set not null;

alter table public.csv_import_jobs
  alter column failed_rows set not null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'csv_import_jobs_success_rows_non_negative'
      and conrelid = 'public.csv_import_jobs'::regclass
  ) then
    alter table public.csv_import_jobs
      drop constraint csv_import_jobs_success_rows_non_negative;
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
    from pg_enum
    where enumlabel = 'completed_with_errors'
      and enumtypid = 'public.import_status'::regtype
  ) then
    alter type public.import_status add value 'completed_with_errors';
  end if;
end
$$;

alter table public.csv_import_jobs
  add column if not exists skipped_rows integer;

update public.csv_import_jobs
set skipped_rows = 0
where skipped_rows is null;

alter table public.csv_import_jobs
  alter column skipped_rows set default 0;

alter table public.csv_import_jobs
  alter column skipped_rows set not null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'csv_import_jobs_result_rows_lte_processed_rows'
      and conrelid = 'public.csv_import_jobs'::regclass
  ) then
    alter table public.csv_import_jobs
      drop constraint csv_import_jobs_result_rows_lte_processed_rows;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'csv_import_jobs_skipped_rows_non_negative'
      and conrelid = 'public.csv_import_jobs'::regclass
  ) then
    alter table public.csv_import_jobs
      add constraint csv_import_jobs_skipped_rows_non_negative
      check (skipped_rows >= 0);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'csv_import_jobs_result_and_skipped_rows_lte_processed_rows'
      and conrelid = 'public.csv_import_jobs'::regclass
  ) then
    alter table public.csv_import_jobs
      add constraint csv_import_jobs_result_and_skipped_rows_lte_processed_rows
      check (successful_rows + failed_rows + skipped_rows <= processed_rows);
  end if;
end
$$;
