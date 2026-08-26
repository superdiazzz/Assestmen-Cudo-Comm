export type DeliveryPayload = {
  taskId: string;
  recipientName: string;
  deliveredAt: string;
  notes?: string;
};

export type QueueStatus = "pending" | "syncing" | "failed";

export type QueueItem = {
  taskId: string;
  operationId: string;
  payload: DeliveryPayload;
  status: QueueStatus;
  attempts: number;
  nextAttemptAt?: number;
  lastError?: string;
};
