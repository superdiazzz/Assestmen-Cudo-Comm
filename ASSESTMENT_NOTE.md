#ROOT CAUSE

**Request timeout (Point 4&5)**
Di `sync/deliverySync.ts`, method `submitItem()` men-generate **idempotency key** baru tiap kali submit. Persoalan tampak disini:

```
await this.api.submitDelivery(item.payload, {
  idempotencyKey: this.idGenerator.generate(), // ❌ key baru tiap percobaan
});
```
Padahal `FakeDeliveryApi` menyimpan submission berdasarkan `idemptencyKey`. Jadi ketika server sudah commit tapi responsenya timeout.

**Service dibuat ulang (Point 1)**
Jika retry lagi maka akan tercatat sebagai submission kedua. Jadi mestinya pakai `item.operationId` (identity yang stabil dan sudah dibuat sekali di `enqueue()`) sebagai idempotency key, bukan generate baru tiap attempt.

**Double tap (Point 2)**
`enqueue()` tidak cek apakah sudah ada item aktif untuk `taskId` yang sama -> `operationId` valid dan berbeda dibuat, masing-masing dapat idempotency key sendiri yang stabil. Ini bukan soal idempotency, tapi soal dedup di level bisnis/antrean

**Sinkronisasi bersamaan(Point 3)**
`sync()` tidak punya guard in-flight; kedua pemanggilan bisa mengambil snapshot store yang sama sebelum status sempat terupdate ke `syncing`, item yang sama bisa di proses lebih dari sekali dalam satu layer.

**Notes**
Pemicu timeout dan service berulang disebabkan oleh persoalan yang sama.

#Code Changes
1. `src/sync/deliverySync.ts` 
2. `jest.config.js`
3. `test/double-tap-enqueue.test.ts` -> bukti perbaikan point 2
4. `tests/concurrent-sync.test.ts` -> bukti perbaikan point 3
5. `tests/error-retry-policy.test.ts` -> bukti temporary error retry & permanent error tidak retry (poin 6 & 7).
6. `tests/service-recreated.test.ts` -> bukti queue tetap ada saat service dibuat ulang (poin 8).

Tools AI yang membantu Claude.Ai