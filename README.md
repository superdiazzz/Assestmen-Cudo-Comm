# Mobile Developer Practical Assessment

## Offline Queue Reliability

Starter project TypeScript dan Jest untuk assessment reliability antrean
offline pada aplikasi mobile.

## Requirements

- Node.js 22 atau lebih baru
- npm
- Git

## Menjalankan Project

```bash
git clone https://github.com/anggaprytn/mobile-reliability-assessment.git
cd mobile-reliability-assessment
npm ci
npm run typecheck
npm test
```

## Baseline

Sebelum melakukan perubahan:

- `npm ci` berhasil.
- `npm run typecheck` berhasil.
- Dua test suite berhasil.
- `tests/timeout-after-commit.test.ts` gagal dengan hasil:

```text
Expected: 1
Received: 2
```

## Tugas

Baca [CANDIDATE_TASK.md](./CANDIDATE_TASK.md).
