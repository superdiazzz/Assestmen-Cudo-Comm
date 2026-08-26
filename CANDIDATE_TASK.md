# Candidate Task

## Skenario

Seorang kurir menyelesaikan pengiriman saat perangkat offline. Aplikasi
menyimpan data ke antrean lokal dan mengirimkannya ketika koneksi kembali
tersedia.

Dalam kondisi tertentu, satu pengiriman dapat tercatat lebih dari sekali
setelah request timeout, double tap, sinkronisasi bersamaan, atau service dibuat
ulang.

## Tujuan

Perbaiki implementasi agar satu tindakan bisnis dari pengguna menghasilkan
maksimal satu submission di server.

Solusi harus memastikan:

1. Submission saat offline tetap masuk antrean.
2. Double tap tidak membuat dua antrean aktif untuk task yang sama.
3. Dua `sync()` yang berjalan bersamaan tidak memproses item yang sama.
4. Retry menggunakan operation identity yang sama.
5. Timeout setelah server menerima data tidak membuat submission baru.
6. Temporary error dapat dicoba kembali.
7. Permanent error tidak mengalami retry tanpa batas.
8. Queue state tetap tersedia ketika service dibuat ulang.
9. Test bersifat deterministic.

## Ketentuan

Anda boleh mengubah kode di dalam `src/`, melakukan refactor, menambahkan file,
dan menambahkan test di dalam `tests/`.

Anda tidak boleh:

- Menghapus atau melemahkan existing test.
- Menggunakan `skip`, `only`, atau menonaktifkan test.
- Mengubah assertion hanya agar test berhasil.
- Menyembunyikan error menggunakan empty `catch`.

Hindari dependency baru. Jika diperlukan, jelaskan alasannya.

## Penggunaan AI

AI coding tools, autocomplete, dokumentasi, dan pencarian internet
diperbolehkan. Anda tetap bertanggung jawab untuk memahami, meninjau, dan
memvalidasi seluruh perubahan.

## Validasi

Jalankan:

```bash
npm run typecheck
npm test
```

Pastikan type-check dan seluruh test berhasil.
