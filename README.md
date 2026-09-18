# ISPPK SKSA v2.4.0

Webapp SK Sungai Abong untuk ISPPK PdP Guru & Murid.

## Source of truth 2026
`V2 Borang Instrumen ISPPK 2026 (Guru & Murid)` rasmi, 14 halaman.

- Bahagian A: Maklumat Pencerap
- Bahagian B: Maklumat Sekolah
- Bahagian C: Nama, Jantina, Opsyen
- Bahagian D: Mata Pelajaran, Bil. Murid Hadir, Tahun/Tingkatan, Tajuk/Topik, Masa PdP
- Bahagian E: Rubrik Guru /50
- Bahagian F: Rubrik Murid, 10 item /50
- Bahagian G: Jumlah /100
- Bahagian H: Refleksi
- Bahagian I: Rumusan + tandatangan pencerap

Data yang guru hantar dikunci daripada suntingan PIC. PIC hanya melengkapkan Bahagian H/I, tandatangan, status dan penghantaran Google Form.

## Patch v2.4.2
- PDF Bahagian C: jantina dibulatkan pada perkataan Lelaki/Perempuan, bukan tanda X.
- PDF Bahagian E dan F: skor dipaparkan sebagai highlight sel kuning lembut dengan bingkai, meniru PDF muat turun sistem rasmi; tiada tanda X atas teks rubrik.
- Tandatangan pencerap dibersihkan kepada PNG alpha-transparent semasa jana PDF, termasuk tandatangan lama yang pernah mempunyai latar putih.

## v2.5.1 — Lampiran RPH

- Guru boleh melampirkan RPH secara pilihan pada langkah akhir sebelum Hantar kepada PIC.
- Format: PDF, DOC, DOCX, JPG, PNG; maksimum 10 MB.
- Fail disimpan dalam bucket private Supabase `rph-uploads`.
- Selepas rekod dihantar, metadata dan fail RPH dikunci sebagai sebahagian data asal guru.
- PIC hanya boleh melihat / memuat turun RPH dan RPH dipadam bersama rekod jika PIC memadam rekod.
- Chrome extension / Google Form tidak diubah.


## v2.5.1
- Date picker dan time picker dibaiki untuk iPhone/iPad/Android.
- Peranti sentuh menggunakan input date/time native browser secara terus.
- Desktop kekal dengan paparan picker sedia ada.
