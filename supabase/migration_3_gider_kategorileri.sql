-- Dynoops Yönetim Paneli — Ek Migration (3)
-- Bu dosyanın tamamını Supabase Dashboard > SQL Editor içine yapıştırıp "Run" deyin.
-- Not: schema.sql ve migration_2_yeni_ozellikler.sql'e EK olarak çalıştırılır, mevcut veriyi silmez.

-- ---------------------------------------------------------------------------
-- Gider Kategorileri (isim + renk)
-- ---------------------------------------------------------------------------
create table if not exists expense_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  color      text default '#2E86C1',
  created_at timestamptz default now()
);

alter table expense_categories enable row level security;
create policy "authenticated_full_access" on expense_categories
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
