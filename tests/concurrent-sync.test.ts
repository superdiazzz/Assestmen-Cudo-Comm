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
  taskId: "task-505",
  recipientName: "Citra",
  deliveredAt: "2026-08-26T13:00:00.000Z",
};

describe("overlapping synchronization calls", () => {
  it("submits a queued item once even when sync() runs concurrently", async () => {
    const store = new InMemoryPersistentStore(createPersistentQueueBacking());
    const api = new FakeDeliveryApi();
    const service = new DeliverySync(
      store,
      api,
      new SequentialIdGenerator(),
      new FakeClock(5_000),
      new MutableNetworkState(true),
    );

    await service.enqueue(delivery);

    await Promise.all([service.sync(), service.sync()]);

    expect(api.getReceivedRequests()).toHaveLength(1);
    expect(api.getSubmissionCount()).toBe(1);
    await expect(store.list()).resolves.toEqual([]);
  });

  it("still submits once when the in-flight request is slow to respond", async () => {
    const store = new InMemoryPersistentStore(createPersistentQueueBacking());
    const api = new FakeDeliveryApi("delayed-success");
    const service = new DeliverySync(
      store,
      api,
      new SequentialIdGenerator(),
      new FakeClock(5_000),
      new MutableNetworkState(true),
    );

    await service.enqueue(delivery);

    const syncA = service.sync();
    const syncB = service.sync();

    await api.waitForRequestCount(1);
    api.releaseDelayedResponses();
    await Promise.all([syncA, syncB]);

    expect(api.getReceivedRequests()).toHaveLength(1);
    expect(api.getSubmissionCount()).toBe(1);
  });
});
