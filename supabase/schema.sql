-- Dynoops Yönetim Paneli — Veritabanı Şeması
-- Bu dosyanın tamamını Supabase Dashboard > SQL Editor içine yapıştırıp "Run" deyin.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Müşteriler (Cari)
-- ---------------------------------------------------------------------------
create table if not exists customers (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  contact      text,
  phone        text,
  email        text,
  tax_no       text,
  sector       text,
  monthly_fee  numeric default 0,
  start_date   date,
  status       text default 'aktif',   -- aktif | pasif
  note         text,
  created_at   timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Ödemeler
-- ---------------------------------------------------------------------------
create table if not exists payments (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid references customers(id) on delete set null,
  year         int not null,
  month        int not null,           -- 1-12
  amount       numeric default 0,
  status       text default 'bekliyor', -- odendi | bekliyor | gecikti
  paid_date    date,
  note         text,
  created_at   timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Teklifler
-- ---------------------------------------------------------------------------
create table if not exists proposals (
  id             uuid primary key default gen_random_uuid(),
  customer_name  text,
  date           date,
  intro          text,
  bullets        jsonb default '[]',
  categories     jsonb default '[]',
  pricing_items  jsonb default '[]',
  special_price  numeric default 0,
  created_at     timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Satır Güvenliği (RLS): sadece giriş yapmış (authenticated) kullanıcılar
-- okuyabilir / yazabilir. Ekibinizdeki herkes tek bir Supabase projesini
-- paylaşır; kullanıcıları Supabase Dashboard > Authentication kısmından
-- elle ekleyeceksiniz (bkz. README.md).
-- ---------------------------------------------------------------------------
alter table customers enable row level security;
alter table payments  enable row level security;
alter table proposals enable row level security;

create policy "authenticated_full_access" on customers
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_full_access" on payments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_full_access" on proposals
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Faydalı indeksler
-- ---------------------------------------------------------------------------
create index if not exists idx_payments_customer on payments(customer_id);
create index if not exists idx_payments_period on payments(year, month);
