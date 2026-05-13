export class RSI {
  private period: number;

  private gains: number[] = [];

  private losses: number[] = [];

  private prevClose: number | null = null;

  constructor(period: number) {
    this.period = period;
  }

  update(close: number): number | null {
    // first candle
    if (this.prevClose === null) {
      this.prevClose = close;

      return null;
    }

    // price change
    const change = close - this.prevClose;

    // gain/loss separation
    const gain = Math.max(change, 0);

    const loss = Math.max(-change, 0);

    // store values
    this.gains.push(gain);

    this.losses.push(loss);

    // maintain rolling window
    if (this.gains.length > this.period) {
      this.gains.shift();

      this.losses.shift();
    }

    this.prevClose = close;

    // not enough data yet
    if (this.gains.length < this.period) {
      return null;
    }

    // average gain/loss
    const avgGain =
      this.gains.reduce((a, b) => a + b, 0) / this.period;

    const avgLoss =
      this.losses.reduce((a, b) => a + b, 0) / this.period;

    // prevent divide by zero
    if (avgLoss === 0) {
      return 100;
    }

    const rs = avgGain / avgLoss;

    // RSI formula
    const rsi = 100 - 100 / (1 + rs);

    return rsi;
  }
}