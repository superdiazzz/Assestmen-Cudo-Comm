import type { QueueItem, QueueStatus } from "../domain/delivery";

export type QueueItemUpdate = {
  status?: QueueStatus;
  attempts?: number;
  nextAttemptAt?: number | undefined;
  lastError?: string | undefined;
};

export interface QueueStore {
  add(item: QueueItem): Promise<void>;
  list(): Promise<QueueItem[]>;
  update(operationId: string, update: QueueItemUpdate): Promise<void>;
  remove(operationId: string): Promise<void>;
}
