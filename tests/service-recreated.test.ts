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
  taskId: "task-707",
  recipientName: "Eka",
  deliveredAt: "2026-08-26T15:00:00.000Z",
};

describe("service recreated after an app restart", () => {
  it("keeps the queued item and still submits it exactly once", async () => {
    const backing = createPersistentQueueBacking();
    const api = new FakeDeliveryApi();
    const idGenerator = new SequentialIdGenerator();

    const serviceBeforeRestart = new DeliverySync(
      new InMemoryPersistentStore(backing),
      api,
      idGenerator,
      new FakeClock(8_000),
      new MutableNetworkState(false),
    );
    const enqueued = await serviceBeforeRestart.enqueue(delivery);

    // Simulate the app process being killed and restarted: a brand new
    // store and service are constructed, but the underlying persisted
    // backing is reloaded as-is.
    const storeAfterRestart = new InMemoryPersistentStore(backing);
    const serviceAfterRestart = new DeliverySync(
      storeAfterRestart,
      api,
      idGenerator,
      new FakeClock(8_500),
      new MutableNetworkState(true),
    );

    await expect(storeAfterRestart.list()).resolves.toEqual([
      expect.objectContaining({ operationId: enqueued.operationId }),
    ]);

    await serviceAfterRestart.sync();

    expect(api.getSubmissionCount()).toBe(1);
    await expect(storeAfterRestart.list()).resolves.toEqual([]);
  });
});
