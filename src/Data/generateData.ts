import type { CandlestickData, UTCTimestamp } from "lightweight-charts";

export type CandlePhase = "R" | "B" | "D";
export type TradeSide = "BUY" | "SELL";

export type MockCandle = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  label: CandlePhase;
  note: "big" | "small";
};

export type MockTrade = {
  time: UTCTimestamp;
  price: number;
  side: TradeSide;
  reason: string;
};

export type MockTradingData = {
  candles: MockCandle[];
  trades: MockTrade[];
};

export function generateTradingMockData(): MockTradingData {
  const start = 1700000300;
  const minute = 60;
  const time = (index: number) => (start + index * minute) as UTCTimestamp;

  const candles: MockCandle[] = [
    // Rally: big bullish candles into momentum.
    { time: time(0), open: 100.0, high: 102.4, low: 99.6, close: 102.0, label: "R", note: "big" },
    { time: time(1), open: 102.0, high: 105.1, low: 101.5, close: 104.6, label: "R", note: "big" },
    { time: time(2), open: 104.6, high: 107.8, low: 104.1, close: 107.1, label: "R", note: "big" },

    // Base: small-small compression after the move.
    { time: time(3), open: 107.1, high: 107.8, low: 106.4, close: 106.8, label: "B", note: "small" },
    { time: time(4), open: 106.8, high: 107.5, low: 106.2, close: 107.0, label: "B", note: "small" },
    { time: time(5), open: 107.0, high: 107.6, low: 106.5, close: 107.2, label: "B", note: "small" },

    // Buy on breakout: big candle leaves the base.
    { time: time(6), open: 107.2, high: 111.2, low: 106.9, close: 110.8, label: "R", note: "big" },
    { time: time(7), open: 110.8, high: 114.0, low: 110.1, close: 113.5, label: "R", note: "big" },
    { time: time(8), open: 113.5, high: 115.2, low: 112.6, close: 114.2, label: "R", note: "big" },

    // Distribution/base before the move fails.
    { time: time(9), open: 114.2, high: 115.0, low: 113.7, close: 114.0, label: "B", note: "small" },
    { time: time(10), open: 114.0, high: 114.8, low: 113.3, close: 113.8, label: "B", note: "small" },

    // Sell before/into the drop, then big red candles.
    { time: time(11), open: 113.8, high: 114.2, low: 110.1, close: 110.8, label: "D", note: "big" },
    { time: time(12), open: 110.8, high: 111.4, low: 107.2, close: 108.0, label: "D", note: "big" },
    { time: time(13), open: 108.0, high: 108.7, low: 104.8, close: 105.6, label: "D", note: "big" },

    // Small base after drop.
    { time: time(14), open: 105.6, high: 106.3, low: 104.9, close: 105.8, label: "B", note: "small" },
    { time: time(15), open: 105.8, high: 106.4, low: 105.1, close: 105.5, label: "B", note: "small" },

    // Another breakout leg: big after small-small.
    { time: time(16), open: 105.5, high: 109.0, low: 105.0, close: 108.5, label: "R", note: "big" },
    { time: time(17), open: 108.5, high: 111.5, low: 108.0, close: 110.9, label: "R", note: "big" },
  ];

  return {
    candles,
    trades: [
      {
        time: candles[6].time,
        price: 107.8,
        side: "BUY",
        reason: "Breakout above the tight base high",
      },
      {
        time: candles[10].time,
        price: 113.7,
        side: "SELL",
        reason: "Momentum stalls at the next small base",
      },
      {
        time: candles[16].time,
        price: 106.4,
        side: "BUY",
        reason: "Second breakout after drop-base compression",
      },
    ],
  };
}

export function generateCandlestickData(
  count: number,
  startPrice = 100
): CandlestickData<UTCTimestamp>[] {
  const mock = generateTradingMockData().candles;
  const priceOffset = startPrice - mock[0].open;

  if (count <= mock.length) {
    return mock.slice(0, count).map(({ time, open, high, low, close }) => ({
      time,
      open: open + priceOffset,
      high: high + priceOffset,
      low: low + priceOffset,
      close: close + priceOffset,
    }));
  }

  const data = mock.map(({ time, open, high, low, close }) => ({
    time,
    open: open + priceOffset,
    high: high + priceOffset,
    low: low + priceOffset,
    close: close + priceOffset,
  }));
  let previousClose = data[data.length - 1].close;

  for (let index = data.length; index < count; index += 1) {
    const open = previousClose;
    const close = Math.max(1, open + (index % 2 === 0 ? 1.2 : -0.8));
    const high = Math.max(open, close) + 0.8;
    const low = Math.min(open, close) - 0.8;

    data.push({
      time: (1700000300 + index * 60) as UTCTimestamp,
      open,
      high,
      low,
      close,
    });

    previousClose = close;
  }

  return data;
}
