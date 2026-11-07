-- Trading Artistry: Supabase Auth profile + row-level ownership.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  default_risk_pct numeric(6,3) not null default 1,
  default_currency text not null default 'USD' check (default_currency in ('USD','VND','EUR','GBP')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- The application server maps Supabase auth.uid() to public.users.open_id = 'supabase:' || auth.uid().
alter table public.users enable row level security;
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users for select using (open_id = 'supabase:' || auth.uid()::text);

alter table public.trades enable row level security;
drop policy if exists "trades_select_own" on public.trades;
drop policy if exists "trades_insert_own" on public.trades;
drop policy if exists "trades_update_own" on public.trades;
drop policy if exists "trades_delete_own" on public.trades;
create policy "trades_select_own" on public.trades for select using (user_id = (select id from public.users where open_id = 'supabase:' || auth.uid()::text));
create policy "trades_insert_own" on public.trades for insert with check (user_id = (select id from public.users where open_id = 'supabase:' || auth.uid()::text));
create policy "trades_update_own" on public.trades for update using (user_id = (select id from public.users where open_id = 'supabase:' || auth.uid()::text)) with check (user_id = (select id from public.users where open_id = 'supabase:' || auth.uid()::text));
create policy "trades_delete_own" on public.trades for delete using (user_id = (select id from public.users where open_id = 'supabase:' || auth.uid()::text));

-- New Supabase users get a profile row automatically.
create or replace function public.handle_new_user_profile()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into public.profiles (id, display_name, avatar_url) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), new.raw_user_meta_data->>'avatar_url') on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users for each row execute procedure public.handle_new_user_profile();
