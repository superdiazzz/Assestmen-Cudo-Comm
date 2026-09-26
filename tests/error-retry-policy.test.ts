import {
  FakeClock,
  FakeDeliveryApi,
  InMemoryPersistentStore,
  MutableNetworkState,
  SequentialIdGenerator,
  createPersistentQueueBacking,
  type DeliveryPayload,
} from "../src";
import { DeliverySync } from "../src/sync/deliverySync"


const delivery: DeliveryPayload = {
  taskId: "task-606",
  recipientName: "Dewi",
  deliveredAt: "2026-08-26T14:00:00.000Z",
};

describe("retry policy", () => {
  it("retries a temporary (network) error after the backoff window", async () => {
    const store = new InMemoryPersistentStore(createPersistentQueueBacking());
    const api = new FakeDeliveryApi("network-error");
    const clock = new FakeClock(6_000);
    const service = new DeliverySync(
      store,
      api,
      new SequentialIdGenerator(),
      clock,
      new MutableNetworkState(true),
    );

    await service.enqueue(delivery);
    await service.sync();

    await expect(store.list()).resolves.toEqual([
      expect.objectContaining({ status: "pending", attempts: 1 }),
    ]);
    expect(api.getSubmissionCount()).toBe(0);

    // Too soon: still inside the backoff window, so no new request yet.
    await service.sync();
    expect(api.getReceivedRequests()).toHaveLength(1);

    // Backoff has elapsed and the transient error is now gone: the retry
    // reuses the same operation identity and succeeds.
    api.setMode("success");
    clock.advanceBy(1_000);
    await service.sync();

    await expect(store.list()).resolves.toEqual([]);
    expect(api.getSubmissionCount()).toBe(1);
    expect(api.getReceivedRequests()).toHaveLength(2);
    expect(
      new Set(api.getReceivedRequests().map((request) => request.idempotencyKey))
        .size,
    ).toBe(1);
  });

  it("does not retry a permanent (validation) error", async () => {
    const store = new InMemoryPersistentStore(createPersistentQueueBacking());
    const api = new FakeDeliveryApi("validation-error");
    const clock = new FakeClock(7_000);
    const service = new DeliverySync(
      store,
      api,
      new SequentialIdGenerator(),
      clock,
      new MutableNetworkState(true),
    );

    await service.enqueue(delivery);
    await service.sync();

    await expect(store.list()).resolves.toEqual([
      expect.objectContaining({ status: "failed", attempts: 1 }),
    ]);

    clock.advanceBy(1_000_000);
    await service.sync();

    expect(api.getReceivedRequests()).toHaveLength(1);
    await expect(store.list()).resolves.toEqual([
      expect.objectContaining({ status: "failed", attempts: 1 }),
    ]);
  });
});
