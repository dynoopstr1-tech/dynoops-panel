-- Dynoops Yönetim Paneli — Ek Migration (5)
-- Bu dosyanın tamamını Supabase Dashboard > SQL Editor içine yapıştırıp "Run" deyin.

create table if not exists meetings (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid references customers(id) on delete set null,
  title             text not null,
  date              date not null,
  time              time not null,
  duration_minutes  int default 30,
  attendee_email    text,
  meet_link         text,
  status            text default 'planlandi', -- planlandi | tamamlandi | iptal
  note              text,
  created_at        timestamptz default now()
);

alter table meetings enable row level security;
create policy "authenticated_full_access" on meetings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create index if not exists idx_meetings_date on meetings(date);
create index if not exists idx_meetings_customer on meetings(customer_id);
