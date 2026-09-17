# ISPPK SKSA - Sistem Multi-Tahun

Webapp dalaman SK Sungai Abong (JBA5095) untuk Instrumen Standard Penilaian Pembudayaan KBAT (PdP Guru & Murid).

Versi 2.0 telah direka semula supaya **2026 hanyalah versi instrumen pertama**, bukan tahun yang di-hardcode ke seluruh sistem. Rekod disimpan bersama `instrument_version_id` dan snapshot tahun/tajuk, jadi penambahan 2027 atau tahun seterusnya tidak mengubah rekod lama.

## Fungsi utama

- Pengisian guru berperingkat: maklumat PdP → rubrik guru → rubrik murid → refleksi.
- Searchable dropdown guru, kelas dan mata pelajaran.
- Master guru awal: No. 1-46 daripada senarai sekolah, No. 30 dibuang, No. 42 dibuang, tambah SYUHADA BINTI MD SARIP.
- 18 kelas: Tahun 1-6 × Ibnu Sina / Ibnu Khaldun / Ibnu Battutah.
- Tarikh melalui calendar picker `DD/MM/YYYY`, masa melalui time picker.
- Skor dikira berdasarkan konfigurasi versi instrumen, bukan nombor hardcode pada halaman.
- Dashboard PIC boleh tapis rekod mengikut tahun.
- Tab **Versi Instrumen** untuk melihat versi aktif/default dan menyediakan draf tahun baharu.
- Setiap versi boleh mempunyai rubrik, skor maksimum, tahap pencapaian, template PDF dan Google Form mapping yang berbeza.
- PDF rasmi dijana menggunakan template yang terikat kepada versi rekod.
- Google Form mapping disimpan mengikut versi; mapping 2026 telah tersedia.
- Mode demo localStorage jika Supabase belum disambungkan.

## Struktur multi-tahun

Versi rasmi 2026 berada di:

- `src/instruments/isppk2026.ts`
- `public/templates/2026/ISPPK.pdf`
- `docs/google-form-mappings/2026.json`

Registry versi berada di:

- `src/instruments/registry.ts`

Apabila versi 2027 rasmi diterima, jangan ubah data 2026. Tambah konfigurasi/version baharu, template PDF baharu dan Google Form mapping baharu. Jika layout PDF 2027 sama dengan 2026, renderer sedia ada boleh digunakan semula. Jika layout berubah, tambah `pdfLayoutKey`/renderer baharu sahaja tanpa rombak borang, dashboard atau rekod lama.

## Menyediakan tahun baharu

PIC mempunyai tab **Versi Instrumen**. Fungsi `Duplikasi Sebagai Draf`:

- menyalin struktur rubrik versi sumber,
- menukar ID/kod kepada tahun baharu,
- menetapkan versi baharu sebagai **tidak aktif**,
- mengosongkan Google Form mapping,
- mengekalkan rekod tahun lama tanpa perubahan.

Draf hanya patut diaktifkan selepas PDF/rubrik/Google Form rasmi tahun tersebut disemak.

## Jalankan secara local

```bash
npm install
cp .env.example .env
npm run dev
```

Buka `http://localhost:5173`.

### Mode demo

Jika `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` kosong, aplikasi menggunakan localStorage browser.

PIN PIC demo lalai: `2468` (ubah melalui `VITE_DEMO_PIC_PIN`).

> Mode demo hanya untuk ujian UI pada satu browser. Untuk kegunaan sebenar ramai guru/peranti, sambungkan Supabase.

## Supabase

Backend production menggunakan project Supabase **ISPPK SKSA** yang berasingan daripada project Kokurikulum. Schema adalah multi-tahun.

Migration:

1. `001_init.sql` - schema utama, RLS, seed 2026, 45 guru, 18 kelas dan subjek.
2. `002_keepalive_activity.sql` - heartbeat `pg_cron` setiap 6 jam sebagai perlindungan best-effort terhadap inactivity pada Free plan.
3. `003_security_and_performance_hardening.sql` - hardening RLS/functions, private heartbeat dan indeks FK.

> Supabase Free masih mempunyai polisi auto-pause di peringkat platform. Heartbeat membantu menghasilkan aktiviti berkala tetapi bukan jaminan rasmi; plan berbayar ialah satu-satunya jaminan rasmi tiada auto-pause.

Cipta akaun PIC dalam Supabase Authentication, kemudian promosikan akaun tersebut:

```sql
update public.profiles
set role='pic'
where id=(select id from auth.users where email='EMAIL_PIC');
```

Isi environment variables di Vercel/`.env`:

```env
VITE_SUPABASE_URL=https://lqtogsgixciyakijfvkb.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=PASTE_PUBLISHABLE_KEY
```

`VITE_SUPABASE_ANON_KEY` masih diterima sebagai fallback untuk deployment lama, tetapi publishable key moden lebih digalakkan.

Untuk submission guru tanpa login, aplikasi menggunakan `INSERT` sahaja. PIC yang sudah login menggunakan `upsert/update`; ini sepadan dengan RLS production.

## GitHub / Vercel

Projek ialah React + TypeScript + Vite SPA dan sesuai untuk GitHub/Vercel.

```bash
npm run build
```

Output: `dist/`.

`vercel.json` dan `netlify.toml` disertakan untuk SPA routing.

## Chrome extension

Extension dibina selepas webapp/database stabil. Ia akan membaca versi instrumen pada rekod. Extension hanya akan autofill jika versi tersebut mempunyai Google Form mapping yang sah dan fingerprint form sepadan.

## Vercel build fix 2.1.1
- Added Vite client environment type reference (`src/vite-env.d.ts`) so `import.meta.env` compiles under TypeScript.
- Removed unnecessary `allowImportingTsExtensions` from `tsconfig.node.json` to avoid TS5096 on Vercel.

## v2.2.0 - Official 2026 instrument parity + PIC delete
- Bahagian A-I disusun mengikut borang rasmi 2026.
- Rubrik Guru memaparkan kesemua 5 penerangan skor dengan wording daripada PDF rasmi.
- Rubrik Murid dan Panduan Skor menggunakan wording rasmi.
- Bahagian G memaparkan pengiraan dan rujukan tahap pencapaian rasmi.
- Bahagian H/I menggunakan soalan/refleksi/rumusan rasmi.
- PDF kekal menggunakan template rasmi 14 muka surat.
- Padam rekod tersedia hanya dalam dashboard/rekod PIC dan masih dilindungi RLS Supabase.


## v2.3.0 — borang Guru/Murid penuh
- Bahagian A-D ikut borang Guru/Murid yang dibekalkan, termasuk Bahagian C Maklumat Guru Yang Dicerap lengkap.
- Rubrik Murid menggunakan 14 item, maksimum 70.
- Pemantau dipilih daripada master Pegawai Penilai PBPPP dan tidak dikunci mengikut PYD.
- PIC boleh urus master Pemantau serta memadam rekod.
