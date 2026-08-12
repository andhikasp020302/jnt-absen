# Absensi JNT BGR031A

Aplikasi absensi mobile-first (selfie + geofence) untuk cabang **JNT BGR031A**.
Ringan & cepat — bundle inti karyawan **~30 KB gzip**. Jalan di paket **gratis** (Vercel + Supabase).

## 🔗 Akses

| | |
|---|---|
| **URL aplikasi** | https://jnt-absensi.vercel.app |
| **Login admin** | Nama: `Admin` · Password: `Andhika2020!` (sebaiknya diganti) |

## ▶️ Langkah pertama (WAJIB sebelum karyawan absen)

1. Login admin → menu **Lokasi** (📍) → ketuk peta di titik kantor → atur **radius** → **Simpan Area**.
   Tanpa area aktif, karyawan tidak bisa absen (validasi geofence di server).
2. Karyawan buka URL → **Daftar** (nama + password) → status *pending*.
3. Admin → menu **Karyawan** → **Setujui**.
4. Karyawan login → **Absen Masuk / Pulang** (selfie kamera depan, timestamp + koordinat
   otomatis ter-*burn* ke foto, terkompres di HP sebelum upload).

## ⚙️ Fitur yang jalan otomatis

- **Kompresi foto di client** → WebP, target 100–300 KB + thumbnail. Dashboard admin pakai
  thumbnail; foto penuh hanya di-load saat diklik.
- **Geofence** divalidasi di server (haversine) — absen di luar radius ditolak.
- **Filter admin**: hari ini / minggu ini / bulan ini / pilih bulan (s.d. 3 bulan).
- **Auto-hapus** data > 3 bulan (foto + record) tiap hari 01:00 WIB via Vercel Cron.
- Kamera **depan saja** + resolusi wajar → foto kecil, upload cepat.

## 🧱 Stack

| Bagian | Teknologi |
|---|---|
| Frontend + API (monolith) | SvelteKit (Svelte 5) + TypeScript |
| Database | Supabase Postgres (indexed) |
| Storage foto | Supabase Storage (bucket privat, signed URL) |
| Auth | scrypt + cookie HMAC (`node:crypto`, tanpa dependency) |
| Peta admin | Leaflet (lazy — hanya di halaman admin) |
| Hosting | Vercel (Hobby / gratis, + Cron) |

## 🔄 Update / Deploy

Repo ini tersambung ke Vercel — **cukup `git push` ke `main`, Vercel auto-deploy.**

```bash
git add -A && git commit -m "pesan perubahan" && git push
```

Deploy manual (opsional): `vercel deploy --prod`

## 🔐 Environment Variables (di Vercel, 7 buah)

`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `STORAGE_BUCKET`,
`SESSION_SECRET`, `CRON_SECRET`, `RETENTION_DAYS`. Lihat `.env.example`.
`SUPABASE_SERVICE_KEY` rahasia (server-only, **tidak** ikut ter-commit).

## 🛠️ Utilitas

```bash
node scripts/seed-admin.mjs "Admin" "PasswordBaru"   # buat / ganti password admin
node scripts/check-db.mjs                             # tes koneksi DB + cek tabel
```

## 💻 Jalankan lokal

```bash
npm install
cp .env.example .env    # isi kredensial Supabase
npm run dev
```
