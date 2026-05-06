export class SMA {
  private period: number;
  private window: number[] = [];
  private sum = 0;

  constructor(period: number) {
    this.period = period;
  }

  update(value: number): number | null {
    this.window.push(value);
    this.sum += value;

    if (this.window.length < this.period) return null;

    if (this.window.length > this.period) {
      const removed = this.window.shift()!;
      this.sum -= removed;
    }

    return this.sum / this.period;
  }
}