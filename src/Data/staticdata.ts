import { generateTradingMockData } from "./generateData";
export type { CandlePhase, MockCandle, MockTrade } from "./generateData";

export const { candles, trades } = generateTradingMockData();
