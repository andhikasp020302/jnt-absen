-- ============================================================
--  JNT BGR031A - Absensi  |  Database schema (PostgreSQL / Supabase)
--  Jalankan sekali di Supabase Dashboard -> SQL Editor.
-- ============================================================

-- Users (karyawan & admin)
create table if not exists users (
  id            bigint generated always as identity primary key,
  name          text        not null,
  username      text        not null unique,       -- login pakai ini (nama unik)
  password_hash text        not null,
  role          text        not null default 'employee'  check (role in ('admin','employee')),
  status        text        not null default 'pending'   check (status in ('pending','approved','rejected')),
  created_at    timestamptz not null default now()
);
create index if not exists idx_users_status on users(status);

-- Area geofence (poligon 4 titik) yang di-set admin.
-- lat/lng menyimpan titik pusat (centroid) untuk keperluan peta.
-- polygon menyimpan array sudut area: [{"lat":..,"lng":..}, x4].
create table if not exists locations (
  id         bigint generated always as identity primary key,
  name       text             not null,
  lat        double precision,
  lng        double precision,
  radius_m   integer,
  polygon    jsonb,
  active     boolean          not null default true,
  created_at timestamptz      not null default now()
);

-- Data absensi
create table if not exists attendance (
  id              bigint generated always as identity primary key,
  user_id         bigint      not null references users(id) on delete cascade,
  type            text        not null check (type in ('in','out')),
  photo_path      text        not null,             -- path foto terkompres di storage
  thumb_path      text,                             -- path thumbnail di storage
  lat             double precision not null,
  lng             double precision not null,
  location_id     bigint      references locations(id) on delete set null,
  distance_m      integer,                          -- jarak ke titik saat absen
  created_at      timestamptz not null default now(),
  attendance_date date        not null default (now() at time zone 'Asia/Jakarta')::date
);
create index if not exists idx_att_user_date on attendance(user_id, attendance_date desc);
create index if not exists idx_att_date      on attendance(attendance_date desc);
create index if not exists idx_att_created   on attendance(created_at);

-- Storage bucket privat untuk foto (idempotent)
insert into storage.buckets (id, name, public)
values ('absensi', 'absensi', false)
on conflict (id) do nothing;
