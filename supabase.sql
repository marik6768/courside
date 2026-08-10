-- COURTSIDE cloud CMS
-- Run this whole file in Supabase SQL Editor.
-- After creating your admin user in Authentication > Users,
-- run the final UPDATE using your own email.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

drop policy if exists "profiles own read" on public.profiles;
create policy "profiles own read"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create table if not exists public.site_content (
  id integer primary key default 1 check (id = 1),
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

drop policy if exists "public can read site content" on public.site_content;
create policy "public can read site content"
on public.site_content for select
to anon, authenticated
using (true);

drop policy if exists "admins can insert site content" on public.site_content;
create policy "admins can insert site content"
on public.site_content for insert
to authenticated
with check ((select public.is_admin()));

drop policy if exists "admins can update site content" on public.site_content;
create policy "admins can update site content"
on public.site_content for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

insert into public.site_content (id, payload)
values (1, '{"site": {"headline": "NBA\nразобранная\nпо цифрам.", "intro": "COURTSIDE объединяет статистику NBA, аналитические рейтинги, прогнозы и GI в один цифровой баскетбольный альбом.", "season": "2025–26", "model": "GI v1.0"}, "forecast": {"mvp": "Nikola Jokić", "dpoy": "Victor Wembanyama", "roy": "Cam Boozer", "mip": "Stephon Castle", "champion": "Oklahoma City Thunder", "confidence": 72, "text": "Наша задача не угадать будущее, а ясно показать, почему этот прогноз имеет смысл."}, "gi": {"title": "Game Impact Index", "text": "GI оценивает влияние игрока через продуктивность, эффективность, создание моментов, защиту, стабильность и контекст побед. Это отдельная аналитическая шкала, а не замена обычной статистике."}, "players": [["Nikola Jokić", "DEN", "C", 27.1, 12.9, 10.2, 65.2, 98.0], ["Shai Gilgeous-Alexander", "OKC", "G", 31.1, 5.4, 6.8, 63.1, 97.0], ["Luka Dončić", "LAL", "G", 33.5, 8.7, 8.9, 62.4, 96.0], ["Victor Wembanyama", "SAS", "C", 24.8, 11.9, 4.3, 61.8, 95.0], ["Giannis Antetokounmpo", "MIL", "F", 29.7, 11.5, 6.4, 65.0, 94.0], ["Anthony Edwards", "MIN", "G", 28.8, 5.6, 5.0, 58.4, 92.0], ["Jayson Tatum", "BOS", "F", 27.4, 8.9, 5.7, 60.1, 91.0], ["Kevin Durant", "HOU", "F", 25.8, 6.2, 4.8, 64.0, 90.0], ["Stephen Curry", "GSW", "G", 26.7, 4.5, 6.1, 63.8, 89.0], ["Donovan Mitchell", "CLE", "G", 27.1, 5.0, 5.8, 59.9, 88.0], ["Bam Adebayo", "MIA", "C", 23.4, 9.8, 4.6, 62.0, 87.0], ["De'Aaron Fox", "SAS", "G", 24.9, 4.2, 6.8, 57.9, 86.0], ["Jaylen Brown", "PHI", "F", 28.7, 6.4, 4.9, 59.3, 85.0], ["Karl-Anthony Towns", "NYK", "C", 22.8, 11.9, 3.1, 64.7, 84.0], ["Jalen Brunson", "NYK", "G", 27.9, 3.1, 7.4, 58.8, 83.0], ["Cade Cunningham", "DET", "G", 26.1, 6.1, 9.3, 56.9, 82.0], ["Paolo Banchero", "ORL", "F", 23.9, 8.1, 5.1, 57.2, 81.0], ["Tyrese Haliburton", "IND", "G", 18.2, 3.7, 10.6, 60.4, 80.0], ["LeBron James", "LAL", "F", 23.6, 6.8, 7.9, 61.2, 79.0], ["Chet Holmgren", "OKC", "C", 19.7, 9.1, 2.9, 64.3, 78.0], ["Alperen Şengün", "HOU", "C", 20.8, 10.4, 5.1, 59.8, 77.0], ["Jalen Williams", "OKC", "F", 23.1, 5.9, 5.4, 61.1, 76.0], ["Franz Wagner", "ORL", "F", 24.1, 5.8, 4.8, 59.7, 75.0], ["Scottie Barnes", "TOR", "F", 19.4, 7.8, 6.2, 55.8, 74.0], ["Evan Mobley", "CLE", "C", 17.8, 9.5, 3.6, 62.2, 73.0]], "goat": [["Michael Jordan", "CHI", "984.7"], ["LeBron James", "LAL", "979.8"], ["Nikola Jokić", "DEN", "971.9"], ["Kareem Abdul-Jabbar", "MIL / LAL", "967.4"], ["Bill Russell", "BOS", "963.8"], ["Tim Duncan", "SAS", "958.6"], ["Magic Johnson", "LAL", "955.2"], ["Larry Bird", "BOS", "953.9"], ["Stephen Curry", "GSW", "949.7"], ["Shaquille O'Neal", "LAL / MIA", "947.8"]], "news": [{"title": "Почему GI не равен обычной статистике", "tag": "ANALYSIS", "text": "Очки показывают результат. GI пытается разобрать влияние на сам ход игры.", "image": "nba-2.jpg"}, {"title": "Что будет определять сезон 2026–27", "tag": "FORECAST", "text": "Ротации, здоровье лидеров и рост молодых звёзд могут перевернуть ожидания.", "image": "nba-1.jpg"}, {"title": "Чемпионство как точка отсчёта", "tag": "ESSAY", "text": "Победа меняет не только таблицу, но и исторический вес команды.", "image": "nba-3.jpg"}], "photos": {"hero": "nba-1.jpg", "gi": "nba-2.jpg", "goat": "nba-3.jpg", "stats": "nba-4.jpg"}}'::jsonb)
on conflict (id) do nothing;

-- Public image bucket.
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do update set public = true;

drop policy if exists "public can view site images" on storage.objects;
create policy "public can view site images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'site-images');

drop policy if exists "admins can upload site images" on storage.objects;
create policy "admins can upload site images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'site-images' and (select public.is_admin()));

drop policy if exists "admins can update site images" on storage.objects;
create policy "admins can update site images"
on storage.objects for update
to authenticated
using (bucket_id = 'site-images' and (select public.is_admin()))
with check (bucket_id = 'site-images' and (select public.is_admin()));

drop policy if exists "admins can delete site images" on storage.objects;
create policy "admins can delete site images"
on storage.objects for delete
to authenticated
using (bucket_id = 'site-images' and (select public.is_admin()));

-- IMPORTANT: after you create your account in Supabase Authentication,
-- replace the email below and run:
-- update public.profiles set is_admin = true where email = 'YOUR_EMAIL_HERE';
