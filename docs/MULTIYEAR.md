# Reka Bentuk Multi-Tahun

## Prinsip

1. Rekod pencerapan tidak bergantung kepada "tahun semasa" global.
2. Setiap rekod menyimpan `instrumentVersionId`, `instrumentYearSnapshot` dan `instrumentTitleSnapshot`.
3. Rubrik dan pengiraan datang daripada `InstrumentVersion`.
4. Template PDF dan Google Form mapping datang daripada versi yang sama.
5. Versi tahun lama tidak diubah apabila tahun baharu diwujudkan.

## InstrumentVersion

Setiap versi menyimpan:

- tahun dan kod versi,
- status aktif/default,
- rubric guru dan murid,
- domain serta skor maksimum,
- tahap pencapaian,
- lokasi template PDF,
- `pdfLayoutKey`,
- Google Form mapping versi tersebut.

## 2027 dan seterusnya

Jika instrumen kekal sama:

- duplikasi versi lama,
- semak PDF rasmi,
- pasang template PDF tahun baharu,
- pasang mapping Google Form tahun baharu,
- aktifkan selepas pengesahan.

Jika rubrik berubah:

- buat konfigurasi `InstrumentVersion` baharu,
- ubah item/domain dalam konfigurasi sahaja,
- halaman pengisian dan dashboard akan membaca config tersebut secara dinamik.

Jika layout PDF berubah:

- tambah renderer/layout key baharu dalam `src/lib/pdf.ts`,
- tidak perlu menukar struktur rekod atau UI utama.
