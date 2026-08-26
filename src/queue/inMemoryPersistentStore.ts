import type { DeliveryPayload, QueueItem } from "../domain/delivery";
import type { QueueItemUpdate, QueueStore } from "./queueStore";

export type PersistentQueueBacking = {
  items: QueueItem[];
};

export function createPersistentQueueBacking(): PersistentQueueBacking {
  return { items: [] };
}

function clonePayload(payload: DeliveryPayload): DeliveryPayload {
  return { ...payload };
}

function cloneItem(item: QueueItem): QueueItem {
  return {
    ...item,
    payload: clonePayload(item.payload),
  };
}

export class InMemoryPersistentStore implements QueueStore {
  public constructor(private readonly backing: PersistentQueueBacking) {}

  public async add(item: QueueItem): Promise<void> {
    this.backing.items.push(cloneItem(item));
  }

  public async list(): Promise<QueueItem[]> {
    return this.backing.items.map(cloneItem);
  }

  public async update(
    operationId: string,
    update: QueueItemUpdate,
  ): Promise<void> {
    const index = this.backing.items.findIndex(
      (item) => item.operationId === operationId,
    );

    if (index === -1) {
      throw new Error(`Queue item not found: ${operationId}`);
    }

    const current = this.backing.items[index];
    if (current === undefined) {
      throw new Error(`Queue item not found: ${operationId}`);
    }

    const updated = cloneItem(current);
    if (update.status !== undefined) {
      updated.status = update.status;
    }
    if (update.attempts !== undefined) {
      updated.attempts = update.attempts;
    }
    if ("nextAttemptAt" in update) {
      if (update.nextAttemptAt === undefined) {
        delete updated.nextAttemptAt;
      } else {
        updated.nextAttemptAt = update.nextAttemptAt;
      }
    }
    if ("lastError" in update) {
      if (update.lastError === undefined) {
        delete updated.lastError;
      } else {
        updated.lastError = update.lastError;
      }
    }

    this.backing.items[index] = updated;
  }

  public async remove(operationId: string): Promise<void> {
    this.backing.items = this.backing.items.filter(
      (item) => item.operationId !== operationId,
    );
  }
}
