import {
  NetworkError,
  ServerError,
  TimeoutError,
  ValidationError,
  type DeliveryApi,
} from "../api/deliveryApi";
import type { DeliveryPayload, QueueItem } from "../domain/delivery";
import type { Clock } from "../infrastructure/clock";
import type { IdGenerator } from "../infrastructure/idGenerator";
import type { NetworkState } from "../infrastructure/networkState";
import type { QueueStore } from "../queue/queueStore";

export type DeliverySyncOptions = {
  retryDelayMs?: number;
};

export class DeliverySync {
  private readonly retryDelayMs: number;

  public constructor(
    private readonly store: QueueStore,
    private readonly api: DeliveryApi,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
    private readonly networkState: NetworkState,
    options: DeliverySyncOptions = {},
  ) {
    this.retryDelayMs = options.retryDelayMs ?? 1_000;
  }

  public async enqueue(payload: DeliveryPayload): Promise<QueueItem> {
    const item: QueueItem = {
      taskId: payload.taskId,
      operationId: this.idGenerator.generate(),
      payload: { ...payload },
      status: "pending",
      attempts: 0,
    };

    await this.store.add(item);
    return { ...item, payload: { ...item.payload } };
  }

  public async sync(): Promise<void> {
    if (!this.networkState.isOnline()) {
      return;
    }

    const items = await this.store.list();
    const readyItems = items.filter(
      (item) =>
        item.status === "pending" &&
        (item.nextAttemptAt === undefined ||
          item.nextAttemptAt <= this.clock.now()),
    );

    for (const item of readyItems) {
      await this.submitItem(item);
    }
  }

  private async submitItem(item: QueueItem): Promise<void> {
    await this.store.update(item.operationId, {
      status: "syncing",
      attempts: item.attempts + 1,
      lastError: undefined,
    });

    try {
      await this.api.submitDelivery(item.payload, {
        idempotencyKey: this.idGenerator.generate(),
      });
      await this.store.remove(item.operationId);
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        await this.store.update(item.operationId, {
          status: "failed",
          attempts: item.attempts + 1,
          nextAttemptAt: undefined,
          lastError: error.message,
        });
        return;
      }

      if (
        error instanceof TimeoutError ||
        error instanceof NetworkError ||
        error instanceof ServerError
      ) {
        await this.store.update(item.operationId, {
          status: "pending",
          attempts: item.attempts + 1,
          nextAttemptAt: this.clock.now() + this.retryDelayMs,
          lastError: error.message,
        });
        return;
      }

      const message = error instanceof Error ? error.message : "Unknown error";
      await this.store.update(item.operationId, {
        status: "failed",
        attempts: item.attempts + 1,
        nextAttemptAt: undefined,
        lastError: message,
      });
    }
  }
}
