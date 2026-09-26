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
  taskId: "task-303",
  recipientName: "Sari",
  deliveredAt: "2026-08-26T11:00:00.000Z",
};

describe("timeout after the server commits a delivery", () => {
  it("keeps one server submission when synchronization is retried", async () => {
    const store = new InMemoryPersistentStore(createPersistentQueueBacking());
    const api = new FakeDeliveryApi("timeout-after-commit-once");
    const clock = new FakeClock(3_000);
    const service = new DeliverySync(
      store,
      api,
      new SequentialIdGenerator(),
      clock,
      new MutableNetworkState(true),
    );

    await service.enqueue(delivery);
    await service.sync();
    clock.advanceBy(1_000);
    await service.sync();

    expect(api.getSubmissionCount()).toBe(1);
  });
});
