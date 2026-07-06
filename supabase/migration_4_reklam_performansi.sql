-- Dynoops Yönetim Paneli — Ek Migration (4)
-- Bu dosyanın tamamını Supabase Dashboard > SQL Editor içine yapıştırıp "Run" deyin.
-- Not: Öncekilere EK olarak çalışır, mevcut veriyi silmez.

create table if not exists ad_performance (
  id                 uuid primary key default gen_random_uuid(),
  customer_id        uuid references customers(id) on delete cascade,
  platform           text not null,           -- google_ads | meta | tiktok
  year               int not null,
  month              int not null,             -- 1-12
  amount_spent       numeric default 0,        -- Harcanan Tutar
  purchase_value     numeric default 0,        -- Alışveriş Dönüşüm Değeri
  roas               numeric default 0,        -- ROAS
  add_to_cart_value  numeric default 0,        -- Sepete Ekleme Değeri
  note               text,
  created_at         timestamptz default now()
);

alter table ad_performance enable row level security;
create policy "authenticated_full_access" on ad_performance
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create index if not exists idx_ad_perf_customer on ad_performance(customer_id);
create index if not exists idx_ad_perf_period on ad_performance(year, month);
create index if not exists idx_ad_perf_platform on ad_performance(platform);
