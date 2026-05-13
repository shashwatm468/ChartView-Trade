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
import type { Candle } from "../Data/gbmEngine";

type Props = {
  data: Candle[];
};

type SignalLine = {
  time: Time;
  color: string;
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

  // ===== ENGINE STATE (RESET SAFE) =====
  const engineRef = useRef({
    sma20: new SMA(20),
    sma50: new SMA(50),
    prevState: null as "above" | "below" | null,
  });

  const markers = useRef<SeriesMarker<Time>[]>([]);
  const signalLines = useRef<SignalLine[]>([]);

  // ---------------- CANVAS INIT ----------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 500;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctxRef.current = ctx;
  }, []);

  // ---------------- DRAW LINES ----------------
  const redrawLines = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    const chart = chartRef.current;

    if (!ctx || !canvas || !chart) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    signalLines.current.forEach((line) => {
      const x = chart.timeScale().timeToCoordinate(line.time);
      // console.log("timetocoordinate-signalline",x)
      if (x == null) return;

      ctx.beginPath();
      ctx.setLineDash([6, 4]);
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, canvas.height);
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  };

  // ---------------- CHART INIT ----------------
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

    const candle = chart.addSeries(CandlestickSeries);

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

    markerRef.current = createSeriesMarkers(candle, []);

    // sync redraw on zoom/pan
    chart.timeScale().subscribeVisibleTimeRangeChange(() => {
      redrawLines();
    });

    return () => chart.remove();
  }, []);

  // ---------------- STREAM UPDATE ENGINE ----------------
  useEffect(() => {
    if (!candleRef.current || data.length === 0) return;

    const last = data[data.length - 1];
    const t = Math.floor(last.time) as Time;

    // ===== CANDLE UPDATE =====
    candleRef.current.update({
      time: t,
      open: last.open,
      high: last.high,
      low: last.low,
      close: last.close,
    });

    // ===== SMA UPDATE =====
    const engine = engineRef.current;

    const v20 = engine.sma20.update(last.close);
    const v50 = engine.sma50.update(last.close);

    if (v20 === null || v50 === null) return;

    sma20Ref.current.update({ time: t, value: v20 });
    sma50Ref.current.update({ time: t, value: v50 });

    // ===== CROSSOVER LOGIC =====
    const state: "above" | "below" = v20 > v50 ? "above" : "below";

    if (engine.prevState && engine.prevState !== state) {
      const isBuy = state === "above";

      const marker: SeriesMarker<Time> = {
        time: t,
        position: isBuy ? "belowBar" : "aboveBar",
        color: isBuy ? "#FFD700" : "#00FFFF",
        shape: isBuy ? "arrowUp" : "arrowDown",
        text: isBuy ? "BUY" : "SELL",
      };

      markers.current.push(marker);
      markerRef.current.setMarkers([...markers.current]);

      signalLines.current.push({
        time: t,
        color: isBuy ? "#FFD700" : "#00FFFF",
      });
      // console.log(t)
    }
    console.log(last.label)
    engine.prevState = state;

    // ===== REDRAW CANVAS =====
    redrawLines();
  }, [data]);
  
  return (
    <div ref={containerRef} className="relative w-[800px] h-[500px]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-50 pointer-events-none"
      />
    </div>
  );
}