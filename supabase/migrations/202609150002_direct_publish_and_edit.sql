alter table public.chronicle_entries
  alter column status set default 'published';

update public.chronicle_entries
set status = 'published', reviewed_at = now()
where status = 'pending';

drop policy if exists "verified parents can submit pending entries" on public.chronicle_entries;
create policy "verified parents can publish entries"
on public.chronicle_entries for insert to authenticated
with check (
  submitted_by = auth.uid()
  and status = 'published'
  and exists (
    select 1 from public.parent_profiles p
    where p.id = auth.uid() and p.invite_verified
  )
);

create policy "authors can edit their entries"
on public.chronicle_entries for update to authenticated
using (
  submitted_by = auth.uid()
  and exists (
    select 1 from public.parent_profiles p
    where p.id = auth.uid() and p.invite_verified
  )
)
with check (
  submitted_by = auth.uid()
  and status = 'published'
  and exists (
    select 1 from public.parent_profiles p
    where p.id = auth.uid() and p.invite_verified
  )
);

update public.parent_profiles
set is_admin = true
where nickname = '马克';
