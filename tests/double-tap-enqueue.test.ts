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
  taskId: "task-404",
  recipientName: "Budi",
  deliveredAt: "2026-08-26T12:00:00.000Z",
};

describe("double tap on the same delivery task", () => {
  it("does not create a second active queue entry for the same task", async () => {
    const store = new InMemoryPersistentStore(createPersistentQueueBacking());
    const api = new FakeDeliveryApi();
    const service = new DeliverySync(
      store,
      api,
      new SequentialIdGenerator(),
      new FakeClock(4_000),
      new MutableNetworkState(false),
    );

    const first = await service.enqueue(delivery);
    const second = await service.enqueue(delivery);

    expect(second.operationId).toBe(first.operationId);
    await expect(store.list()).resolves.toHaveLength(1);
  });

  it("allows a new attempt once the previous one has finished", async () => {
    const store = new InMemoryPersistentStore(createPersistentQueueBacking());
    const api = new FakeDeliveryApi();
    const service = new DeliverySync(
      store,
      api,
      new SequentialIdGenerator(),
      new FakeClock(4_000),
      new MutableNetworkState(true),
    );

    const first = await service.enqueue(delivery);
    await service.sync();
    await expect(store.list()).resolves.toEqual([]);

    const second = await service.enqueue(delivery);

    expect(second.operationId).not.toBe(first.operationId);
    await expect(store.list()).resolves.toHaveLength(1);
  });
});
