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
  taskId: "task-101",
  recipientName: "Nadia",
  deliveredAt: "2026-08-26T09:00:00.000Z",
};

describe("offline enqueue", () => {
  it("persists a pending delivery without contacting the API", async () => {
    const store = new InMemoryPersistentStore(createPersistentQueueBacking());
    const api = new FakeDeliveryApi();
    const service = new DeliverySync(
      store,
      api,
      new SequentialIdGenerator(),
      new FakeClock(1_000),
      new MutableNetworkState(false),
    );

    const enqueued = await service.enqueue(delivery);

    expect(api.getReceivedRequests()).toHaveLength(0);
    await expect(store.list()).resolves.toEqual([
      expect.objectContaining({
        taskId: delivery.taskId,
        operationId: enqueued.operationId,
        status: "pending",
      }),
    ]);
    expect(enqueued.operationId).toBe("operation-1");
  });
});
