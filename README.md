# Mobile Developer Practical Assessment

## Offline Queue Reliability

Repository ini berisi starter project TypeScript dan Jest untuk practical
assessment mengenai reliability antrean offline pada aplikasi mobile.

Instruksi sesi resmi, durasi, recording, dan metode pengumpulan hasil akan
disampaikan oleh HR. Jika terdapat perbedaan, ikuti dokumen terbaru yang
diberikan oleh HR.

## Requirements

- Node.js 22 atau lebih baru
- npm
- Git

## Setup dan Baseline

```bash
npm ci
npm run typecheck
npm test
```

Sebelum melakukan perubahan, hasil yang diharapkan adalah:

- `npm ci` berhasil.
- `npm run typecheck` berhasil.
- Dua test suite berhasil.
- `tests/timeout-after-commit.test.ts` gagal dengan hasil:

```text
Expected: 1
Received: 2
```

Kegagalan tersebut merupakan bagian dari baseline assessment. Jangan
memperbaikinya sebelum waktu pengerjaan resmi dimulai.

Jika baseline berbeda, tunjukkan hasil terminal dan informasikan kepada HR.

## Struktur Repository

```text
src/    TypeScript domain, queue, synchronization, API, dan infrastructure
tests/  Candidate-visible Jest tests
```

## Tugas Assessment

Baca [CANDIDATE_TASK.md](./CANDIDATE_TASK.md) sebelum mulai mengubah kode.

Jangan membuat pull request ke repository assessment utama dan jangan
memublikasikan solusi assessment dalam repository public.
