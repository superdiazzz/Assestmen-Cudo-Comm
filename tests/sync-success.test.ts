import {
  DeliverySync,
  FakeClock,
  FakeDeliveryApi,
  InMemoryPersistentStore,
  MutableNetworkState,
  SequentialIdGenerator,
  createPersistentQueueBacking,
  type DeliveryPayload,
} from "../src";

const delivery: DeliveryPayload = {
  taskId: "task-202",
  recipientName: "Rafi",
  deliveredAt: "2026-08-26T10:00:00.000Z",
  notes: "Left with reception",
};

describe("successful synchronization", () => {
  it("submits and removes a pending delivery while online", async () => {
    const store = new InMemoryPersistentStore(createPersistentQueueBacking());
    const api = new FakeDeliveryApi();
    const service = new DeliverySync(
      store,
      api,
      new SequentialIdGenerator(),
      new FakeClock(2_000),
      new MutableNetworkState(true),
    );

    await service.enqueue(delivery);
    await service.sync();

    await expect(store.list()).resolves.toEqual([]);
    expect(api.getSubmissionCount()).toBe(1);
    expect(api.getReceivedRequests()).toHaveLength(1);
  });
});
