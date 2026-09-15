create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.invite_settings (
  id boolean primary key default true check (id),
  invite_hash text not null
);

create table if not exists public.parent_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 30),
  invite_verified boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create type public.chronicle_status as enum ('pending', 'published', 'rejected');
create type public.chronicle_category as enum ('milestone', 'funny', 'meeting', 'legend');

create table if not exists public.chronicle_entries (
  id bigint generated always as identity primary key,
  event_date date not null,
  title text not null check (char_length(title) between 1 and 80),
  description text not null check (char_length(description) between 1 and 2000),
  category public.chronicle_category not null,
  dog_names text[] not null check (cardinality(dog_names) > 0),
  image_url text,
  video_url text,
  audio_url text,
  status public.chronicle_status not null default 'pending',
  submitted_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.parent_profiles enable row level security;
alter table public.chronicle_entries enable row level security;

create policy "parents can read their own profile"
on public.parent_profiles for select to authenticated
using (id = auth.uid());

create policy "anyone can read published entries"
on public.chronicle_entries for select
using (
  status = 'published'
  or submitted_by = auth.uid()
  or exists (
    select 1 from public.parent_profiles p
    where p.id = auth.uid() and p.is_admin
  )
);

create policy "verified parents can submit pending entries"
on public.chronicle_entries for insert to authenticated
with check (
  submitted_by = auth.uid()
  and status = 'pending'
  and exists (
    select 1 from public.parent_profiles p
    where p.id = auth.uid() and p.invite_verified
  )
);

create policy "admins can review entries"
on public.chronicle_entries for update to authenticated
using (
  exists (select 1 from public.parent_profiles p where p.id = auth.uid() and p.is_admin)
)
with check (
  exists (select 1 from public.parent_profiles p where p.id = auth.uid() and p.is_admin)
);

create or replace function public.claim_invite(invite_code text, parent_nickname text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  configured_hash text;
  clean_nickname text := trim(parent_nickname);
begin
  select invite_hash into configured_hash from private.invite_settings where id = true;
  if auth.uid() is null or configured_hash is null or crypt(invite_code, configured_hash) <> configured_hash then
    return jsonb_build_object('ok', false);
  end if;
  if char_length(clean_nickname) < 1 or char_length(clean_nickname) > 30 then
    raise exception '昵称长度需要在 1 到 30 个字符之间';
  end if;
  insert into public.parent_profiles (id, nickname, invite_verified)
  values (auth.uid(), clean_nickname, true)
  on conflict (id) do update set nickname = excluded.nickname, invite_verified = true;
  return jsonb_build_object('ok', true, 'nickname', clean_nickname);
end;
$$;

revoke all on function public.claim_invite(text, text) from public, anon;
grant execute on function public.claim_invite(text, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chronicle-media',
  'chronicle-media',
  true,
  26214400,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime','audio/mpeg','audio/mp4','audio/wav','audio/ogg','audio/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "verified parents can upload chronicle media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'chronicle-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.parent_profiles p
    where p.id = auth.uid() and p.invite_verified
  )
);

-- 在 Supabase SQL Editor 中运行下面这条语句来设置或更换邀请码：
-- insert into private.invite_settings (id, invite_hash)
-- values (true, crypt('替换成你的邀请码', gen_salt('bf')))
-- on conflict (id) do update set invite_hash = excluded.invite_hash;

