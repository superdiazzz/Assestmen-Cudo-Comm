export interface Clock {
  now(): number;
}

export class FakeClock implements Clock {
  public constructor(private currentTime: number) {}

  public now(): number {
    return this.currentTime;
  }

  public advanceBy(milliseconds: number): void {
    this.currentTime += milliseconds;
  }
}
