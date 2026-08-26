export interface IdGenerator {
  generate(): string;
}

export class SequentialIdGenerator implements IdGenerator {
  private nextValue = 1;

  public constructor(private readonly prefix = "operation") {}

  public generate(): string {
    const value = `${this.prefix}-${this.nextValue}`;
    this.nextValue += 1;
    return value;
  }
}
