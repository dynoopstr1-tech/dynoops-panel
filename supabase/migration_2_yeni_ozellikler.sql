-- Dynoops Yönetim Paneli — Ek Migration (2)
-- Bu dosyanın tamamını Supabase Dashboard > SQL Editor içine yapıştırıp "Run" deyin.
-- Not: Bu dosya, daha önce çalıştırdığınız schema.sql'e EK olarak çalıştırılır, onu silmez.

-- ---------------------------------------------------------------------------
-- Sektörler (tanımlı sektör listesi)
-- ---------------------------------------------------------------------------
create table if not exists sectors (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz default now()
);

alter table sectors enable row level security;
create policy "authenticated_full_access" on sectors
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Müşterilere yeni alanlar: Ortaklık %, Ciro Alt Limiti, Komisyon %
-- ---------------------------------------------------------------------------
alter table customers add column if not exists partnership_percent numeric default 0;
alter table customers add column if not exists alt_limit numeric default 0;
alter table customers add column if not exists commission_percent numeric default 0;

-- ---------------------------------------------------------------------------
-- Ödemelere ödeme tipi (tam / kısmi)
-- ---------------------------------------------------------------------------
alter table payments add column if not exists payment_type text default 'tam';

-- ---------------------------------------------------------------------------
-- Ciro / Komisyon Hesaplama kayıtları
-- ---------------------------------------------------------------------------
create table if not exists revenue_records (
  id                 uuid primary key default gen_random_uuid(),
  customer_id        uuid references customers(id) on delete set null,
  year               int not null,
  month              int not null,
  ciro               numeric default 0,
  alt_limit          numeric default 0,
  commission_percent numeric default 0,
  commission_amount  numeric default 0,
  status             text default 'bekliyor', -- bekliyor | tahsil_edildi
  note               text,
  created_at         timestamptz default now()
);

alter table revenue_records enable row level security;
create policy "authenticated_full_access" on revenue_records
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create index if not exists idx_revenue_customer on revenue_records(customer_id);
create index if not exists idx_revenue_period on revenue_records(year, month);

-- ---------------------------------------------------------------------------
-- Gider Kalemleri
-- ---------------------------------------------------------------------------
create table if not exists expenses (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  category   text,
  amount     numeric default 0,
  date       date default now(),
  note       text,
  created_at timestamptz default now()
);

alter table expenses enable row level security;
create policy "authenticated_full_access" on expenses
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create index if not exists idx_expenses_date on expenses(date);
