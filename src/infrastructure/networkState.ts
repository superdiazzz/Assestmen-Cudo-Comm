export interface NetworkState {
  isOnline(): boolean;
}

export class MutableNetworkState implements NetworkState {
  public constructor(private online: boolean) {}

  public isOnline(): boolean {
    return this.online;
  }

  public setOnline(online: boolean): void {
    this.online = online;
  }
}
