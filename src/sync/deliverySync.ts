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

  // Tracks operationIds currently being submitted by THIS instance, so that
  // two overlapping sync() calls can never pick up and submit the same
  // queue item at the same time (see the in-flight guard in sync()).
  private readonly inFlightOperationIds = new Set<string>();

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
    // A "double tap" re-runs the same business action (e.g. the same
    // courier confirming the same task twice in a row) before the first
    // attempt has finished or failed permanently. Reuse the existing active
    // entry instead of creating a second queue item / operation identity
    // for the same task.
    const active = await this.findActiveItemForTask(payload.taskId);
    if (active !== undefined) {
      return { ...active, payload: { ...active.payload } };
    }

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
        !this.inFlightOperationIds.has(item.operationId) &&
        (item.nextAttemptAt === undefined ||
          item.nextAttemptAt <= this.clock.now()),
    );

    // Reserve every item synchronously (no `await` in between) before doing
    // any actual work. If another sync() call is already in flight, its own
    // reservation happened in its own uninterrupted synchronous section, so
    // whichever call reserves an item first is guaranteed to "win" it and
    // the other call's filter above will exclude it.
    for (const item of readyItems) {
      this.inFlightOperationIds.add(item.operationId);
    }

    try {
      for (const item of readyItems) {
        await this.submitItem(item);
      }
    } finally {
      for (const item of readyItems) {
        this.inFlightOperationIds.delete(item.operationId);
      }
    }
  }

  private async findActiveItemForTask(
    taskId: string,
  ): Promise<QueueItem | undefined> {
    const items = await this.store.list();
    return items.find(
      (item) =>
        item.taskId === taskId &&
        (item.status === "pending" || item.status === "syncing"),
    );
  }

  private async submitItem(item: QueueItem): Promise<void> {
    await this.store.update(item.operationId, {
      status: "syncing",
      attempts: item.attempts + 1,
      lastError: undefined,
    });

    try {
      await this.api.submitDelivery(item.payload, {
        idempotencyKey: item.operationId,
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
