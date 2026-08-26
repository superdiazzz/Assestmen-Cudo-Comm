import type { DeliveryPayload } from "../domain/delivery";
import {
  NetworkError,
  ServerError,
  TimeoutError,
  ValidationError,
  type DeliveryApi,
  type DeliverySubmissionResult,
} from "./deliveryApi";

export type FakeDeliveryApiMode =
  | "success"
  | "timeout-after-commit-once"
  | "network-error"
  | "server-error"
  | "validation-error"
  | "delayed-success";

export type ReceivedRequest = {
  payload: DeliveryPayload;
  idempotencyKey: string;
};

type RequestWaiter = {
  count: number;
  resolve: () => void;
};

export class FakeDeliveryApi implements DeliveryApi {
  private readonly submissions = new Map<string, DeliverySubmissionResult>();
  private readonly requests: ReceivedRequest[] = [];
  private readonly requestWaiters: RequestWaiter[] = [];
  private mode: FakeDeliveryApiMode;
  private timeoutAfterCommitRemaining: number;
  private delayedResponse: Promise<void>;
  private releaseDelayedResponse: () => void = () => undefined;

  public constructor(mode: FakeDeliveryApiMode = "success") {
    this.mode = mode;
    this.timeoutAfterCommitRemaining =
      mode === "timeout-after-commit-once" ? 1 : 0;
    this.delayedResponse = Promise.resolve();
    this.configureDelay(mode);
  }

  public setMode(mode: FakeDeliveryApiMode): void {
    this.mode = mode;
    this.timeoutAfterCommitRemaining =
      mode === "timeout-after-commit-once" ? 1 : 0;
    this.configureDelay(mode);
  }

  public async submitDelivery(
    payload: DeliveryPayload,
    options: { idempotencyKey: string },
  ): Promise<DeliverySubmissionResult> {
    this.requests.push({
      payload: { ...payload },
      idempotencyKey: options.idempotencyKey,
    });
    this.resolveRequestWaiters();

    const existing = this.submissions.get(options.idempotencyKey);
    if (existing !== undefined) {
      return { ...existing };
    }

    if (this.mode === "network-error") {
      throw new NetworkError();
    }

    if (this.mode === "server-error") {
      throw new ServerError();
    }

    if (this.mode === "validation-error") {
      throw new ValidationError();
    }

    if (this.mode === "delayed-success") {
      await this.delayedResponse;
    }

    const result: DeliverySubmissionResult = {
      submissionId: `submission-${this.submissions.size + 1}`,
      taskId: payload.taskId,
    };
    this.submissions.set(options.idempotencyKey, result);

    if (
      this.mode === "timeout-after-commit-once" &&
      this.timeoutAfterCommitRemaining > 0
    ) {
      this.timeoutAfterCommitRemaining -= 1;
      throw new TimeoutError();
    }

    return { ...result };
  }

  public getSubmissionCount(): number {
    return this.submissions.size;
  }

  public getReceivedRequests(): ReceivedRequest[] {
    return this.requests.map((request) => ({
      payload: { ...request.payload },
      idempotencyKey: request.idempotencyKey,
    }));
  }

  public waitForRequestCount(count: number): Promise<void> {
    if (this.requests.length >= count) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.requestWaiters.push({ count, resolve });
    });
  }

  public releaseDelayedResponses(): void {
    this.releaseDelayedResponse();
  }

  private configureDelay(mode: FakeDeliveryApiMode): void {
    if (mode !== "delayed-success") {
      this.delayedResponse = Promise.resolve();
      this.releaseDelayedResponse = () => undefined;
      return;
    }

    this.delayedResponse = new Promise((resolve) => {
      this.releaseDelayedResponse = resolve;
    });
  }

  private resolveRequestWaiters(): void {
    for (let index = this.requestWaiters.length - 1; index >= 0; index -= 1) {
      const waiter = this.requestWaiters[index];
      if (waiter === undefined) {
        continue;
      }
      if (this.requests.length >= waiter.count) {
        this.requestWaiters.splice(index, 1);
        waiter.resolve();
      }
    }
  }
}
