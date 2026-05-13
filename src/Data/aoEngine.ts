import { SMA } from "./smaEngine";

/**
 * Awesome Oscillator (AO)
 * AO = SMA(5, median price) - SMA(34, median price)
 *
 * Median price = (high + low) / 2
 */
export class AO {
  private fast: SMA;
  private slow: SMA;

  constructor(fastPeriod = 5, slowPeriod = 34) {
    this.fast = new SMA(fastPeriod);
    this.slow = new SMA(slowPeriod);
  }

  /**
   * Update AO value
   * Uses median price (HIGH + LOW) / 2
   */
  update(high: number, low: number): number | null {
    const medianPrice = (high + low) / 2;

    const fastValue = this.fast.update(medianPrice);
    const slowValue = this.slow.update(medianPrice);

    if (fastValue === null || slowValue === null) {
      return null;
    }

    return fastValue - slowValue;
  }
}
