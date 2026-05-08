import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  createSeriesMarkers,
  type SeriesMarker,
  type Time,
} from "lightweight-charts";
import { SMA } from "../Data/smaEngine";

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type Props = {
  data: Candle[];
};

export default function Trial({ data }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const chartRef = useRef<any>(null);

  const candleRef = useRef<any>(null);
  const sma20Ref = useRef<any>(null);
  const sma50Ref = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const sma20 = useRef(new SMA(20));
  const sma50 = useRef(new SMA(50));

  const prevState = useRef<"above" | "below" | null>(null);

  const markers = useRef<SeriesMarker<Time>[]>([]);

  // ---------------- SIGNAL LINES ----------------
  const signalLines = useRef<
    {
      time: Time;
      color: string;
    }[]
  >([]);

  // ---------------- CANVAS SETUP ----------------
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 500;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctxRef.current = ctx;
  }, []);

  // ---------------- REDRAW LINES ----------------
  const redrawLines = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas || !chartRef.current) return;
    // clear old draiwngs
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    signalLines.current.forEach((line) => {
      const x = chartRef.current
        .timeScale()
        .timeToCoordinate(line.time);
      if (x === null || x === undefined) return;
      ctx.beginPath();
      ctx.setLineDash([7, 1]);
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, canvas.height - 28);
      ctx.lineWidth = 1;
      ctx.strokeStyle = line.color;
      ctx.stroke();
    });
  };

  // ---------------- CREATE CHART ----------------
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
    });

    chartRef.current = chart;

    // Candles
    const candle = chart.addSeries(CandlestickSeries);

    // SMAs
    const sma20Series = chart.addSeries(LineSeries, {
      color: "orange",
      lineWidth: 2,
    });

    const sma50Series = chart.addSeries(LineSeries, {
      color: "blue",
      lineWidth: 2,
    });

    candleRef.current = candle;
    sma20Ref.current = sma20Series;
    sma50Ref.current = sma50Series;

    // Marker manager
    markerRef.current = createSeriesMarkers(candle, []);

    return () => chart.remove();
  }, []);

  // ---------------- UPDATE DATA ----------------
  useEffect(() => {
    if (!candleRef.current || data.length === 0) return;

    const last = data[data.length - 1];

    const t = Math.floor(last.time) as Time;

    // ---------------- CANDLE UPDATE ----------------
    candleRef.current.update({
      time: t,
      open: last.open,
      high: last.high,
      low: last.low,
      close: last.close,
    });

    // ---------------- SMA UPDATE ----------------
    const v20 = sma20.current.update(last.close);

    const v50 = sma50.current.update(last.close);

    if (v20 === null || v50 === null) return;

    sma20Ref.current.update({
      time: t,
      value: v20,
    });

    sma50Ref.current.update({
      time: t,
      value: v50,
    });

    // ---------------- CROSSOVER STATE ----------------
    const state = v20 > v50 ? "above" : "below";

    if (prevState.current && prevState.current !== state) {
      const isBuy = state === "above";

      // ---------------- MARKERS ----------------
      const marker: SeriesMarker<Time> = {
        time: t,
        position: isBuy ? "belowBar" : "aboveBar",
        color: isBuy ? "#FFD700" : "#00FFFF",
        shape: isBuy ? "arrowUp" : "arrowDown",
        text: isBuy ? "BUY" : "SELL",
      };

      markers.current.push(marker);

      markerRef.current.setMarkers(markers.current);

      // ---------------- SIGNAL LINE STATE ----------------
      signalLines.current.push({
        time: t,
        color: isBuy ? "#FFD700" : "#00FFFF",
      });

      // ---------------- REDRAW ----------------
      // redrawLines();
    }
    redrawLines();
    prevState.current = state;
  }, [data]);

  return (
    <div
      ref={containerRef}
      className="relative w-[800px] h-[500px]"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-50 pointer-events-none w-[800px] h-[500px]"
      />
    </div>
  );
}