# Candidate Task

## Skenario

Seorang kurir menyelesaikan pengiriman saat perangkat offline. Aplikasi
menyimpan data ke antrean lokal dan mengirimkannya ketika koneksi kembali
tersedia.

Dalam kondisi tertentu, satu pengiriman dapat tercatat lebih dari sekali
setelah:

- Request mengalami timeout.
- Pengguna menekan tombol dua kali.
- Dua proses sinkronisasi berjalan bersamaan.
- Service atau aplikasi dibuat ulang.

Target utama: satu tindakan bisnis dari pengguna hanya boleh menghasilkan
maksimal satu submission di server.

## Tugas Utama

Perbaiki implementasi agar:

1. Submission saat offline tetap masuk antrean.
2. Double tap tidak membuat dua antrean aktif untuk task yang sama.
3. Dua `sync()` yang berjalan bersamaan tidak memproses item yang sama.
4. Retry menggunakan operation identity yang sama.
5. Timeout setelah server menerima data tidak membuat submission baru.
6. Temporary error dapat dicoba kembali.
7. Permanent error tidak mengalami retry tanpa batas.
8. Queue state tetap tersedia ketika service dibuat ulang.
9. Test bersifat deterministic dan tidak bergantung pada timing yang tidak
   stabil.
10. Seluruh existing test tetap dipertahankan.

## Ketentuan Perubahan

Anda boleh:

- Mengubah kode di dalam `src/`.
- Menambahkan abstraction atau file baru.
- Menambahkan test di dalam `tests/`.
- Melakukan refactor untuk meningkatkan reliability dan kejelasan.

Anda tidak boleh:

- Menghapus atau melemahkan existing test.
- Menggunakan `skip`, `only`, atau menonaktifkan test.
- Mengubah assertion hanya agar test berhasil.
- Menyembunyikan error menggunakan empty `catch`.
- Membuat pull request ke repository assessment utama.
- Memublikasikan solusi assessment dalam repository public.

Hindari dependency baru. Jika diperlukan, jelaskan alasan dan trade-off-nya
dalam `ASSESSMENT_NOTES.md`.

## Alur yang Disarankan

1. Jalankan baseline.
2. Baca `README.md`, dokumen ini, dan test yang tersedia.
3. Telusuri alur dari enqueue hingga submission.
4. Identifikasi root cause.
5. Implementasikan perbaikan.
6. Tambahkan test yang relevan.
7. Jalankan seluruh validasi.
8. Review perubahan.
9. Lengkapi `ASSESSMENT_NOTES.md`.
10. Siapkan walkthrough akhir.

Tidak ada satu implementasi wajib. Gunakan pendekatan yang dapat dijelaskan
dan dipertanggungjawabkan.

## Catatan Teknis Kandidat

Buat file `ASSESSMENT_NOTES.md` yang berisi:

1. Root cause duplicate submission.
2. Ringkasan solusi.
3. Penanganan double tap, concurrent sync, retry, dan timeout.
4. Perbedaan temporary dan permanent error.
5. Cara queue state dipertahankan.
6. Test yang ditambahkan dan behavior yang dibuktikan.
7. Asumsi, trade-off, dan risiko yang masih tersisa.
8. Improvement yang diperlukan untuk production.
9. Penggunaan AI coding tools dan cara memvalidasi hasilnya.

Gunakan penjelasan yang singkat, jelas, dan teknis.

## AI-Assisted Development

Penggunaan AI diperbolehkan, termasuk autocomplete, chat assistant, AI coding
agent, dokumentasi, dan pencarian internet.

Jika menggunakan AI:

- Gunakan tool tersebut pada perangkat dan layar yang sedang dibagikan selama
  sesi.
- Tetap pahami seluruh perubahan yang dibuat.
- Review kode dan test yang dihasilkan.
- Jangan menerima atau menjalankan perubahan tanpa pemeriksaan.
- Validasi hasil melalui type-check, test, dan review diff.
- Catat nama tool, bagian yang dibantu, dan cara validasinya dalam
  `ASSESSMENT_NOTES.md`.

Aktivitas AI selama assessment dapat terlihat dalam screen recording. Tutup
seluruh percakapan AI pribadi atau yang tidak berkaitan dengan assessment
sebelum sesi dimulai.

Anda tidak perlu menunjukkan percakapan AI yang dibuat sebelum sesi. Penilaian
difokuskan pada kemampuan mengarahkan AI, memahami perubahan, meninjau hasil,
dan memvalidasi implementasi akhir.

## Validasi Akhir

Jalankan:

```bash
npm run typecheck
npm test
git diff
git status
```

Pastikan:

- Type-check berhasil.
- Seluruh test berhasil.
- Existing test tetap dipertahankan.
- Test tambahan membuktikan reliability solusi.
- `ASSESSMENT_NOTES.md` telah dilengkapi.

Kemudian buat commit lokal:

```bash
git add .
git commit -m "Complete mobile reliability assessment"
git rev-parse HEAD
```

Simpan commit SHA yang ditampilkan untuk proses pengumpulan. Ikuti metode
pengumpulan hasil yang diberikan oleh HR.
