import {
  CandlestickSeries,
  createChart,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import { generateChunkedCandles } from "../Data/candleEngine";

type TwoPointLine = {
  t1: number;
  y1: number;
  t2: number;
  y2: number;
};

export default function Trail() {
  const divRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!divRef.current) return;

    const data = generateChunkedCandles(500, 150);

    const chart = createChart(divRef.current, {
      autoSize: true,
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
    });

    chartRef.current = chart;

    // ✅ Candles
    const candleSeries = chart.addSeries(CandlestickSeries);
    candleRef.current = candleSeries;
    candleSeries.setData(data);

    // 🔥 Each line = its own series (fully independent)
    const lines: TwoPointLine[] = [
  { t1: data[50].time as number,  y1: data[50].close,  t2: data[60].time as number,  y2: data[60].close },
  { t1: data[120].time as number, y1: data[120].close, t2: data[140].time as number, y2: data[140].close },
  { t1: data[200].time as number, y1: data[200].close, t2: data[230].time as number, y2: data[230].close },
];

    const lineSeriesList: ISeriesApi<"Line">[] = [];

    for (const line of lines) {
      const series = chart.addSeries(LineSeries, {
  lineStyle: 2,
  lineWidth: 2,

  // 🔥 remove label/price clutter
  lastValueVisible: false,
  priceLineVisible: false,
  crosshairMarkerVisible: false,
});

      series.setData([
        { time: line.t1, value: line.y1 },
        { time: line.t2, value: line.y2 },
      ]);

      lineSeriesList.push(series);
    }

    return () => {
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
    };
  }, []);

  useEffect(() => {
    // overlay event listeners
  }, []);

  return (
  <div className="relative w-[1000px] h-[600px]">
    <div ref={divRef} className="absolute inset-0" />

    {/* overlay layer */}
    <div
      ref={overlayRef}
      className="absolute inset-0 z-10"
      style={{ cursor: "crosshair" }}
    />
  </div>
);
}