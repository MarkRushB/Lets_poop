alter table public.chronicle_entries
  add column if not exists deleted_at timestamptz;

drop policy if exists "anyone can read published entries" on public.chronicle_entries;
create policy "anyone can read active published entries"
on public.chronicle_entries for select
using (
  (status = 'published' and deleted_at is null)
  or submitted_by = auth.uid()
  or exists (
    select 1 from public.parent_profiles p
    where p.id = auth.uid() and p.is_admin
  )
);

create index if not exists chronicle_entries_published_active_idx
on public.chronicle_entries (event_date)
where status = 'published' and deleted_at is null;
