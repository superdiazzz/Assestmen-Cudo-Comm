import type { DeliveryPayload } from "../domain/delivery";

export type DeliverySubmissionResult = {
  submissionId: string;
  taskId: string;
};

export interface DeliveryApi {
  submitDelivery(
    payload: DeliveryPayload,
    options: { idempotencyKey: string },
  ): Promise<DeliverySubmissionResult>;
}

export class TimeoutError extends Error {
  public constructor(message = "The request timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

export class NetworkError extends Error {
  public constructor(message = "The network request failed") {
    super(message);
    this.name = "NetworkError";
  }
}

export class ServerError extends Error {
  public constructor(message = "The server could not process the request") {
    super(message);
    this.name = "ServerError";
  }
}

export class ValidationError extends Error {
  public constructor(message = "The delivery submission is invalid") {
    super(message);
    this.name = "ValidationError";
  }
}
