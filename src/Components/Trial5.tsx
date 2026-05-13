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
import type { Candle, Phase } from "../Data/gbmEngine";

type Props = {
  data: Candle[];
};

type SignalLine = {
  time: Time;
  color: string;
};

type StructureBox = {
  label: Phase;

  startTime: Time;
  endTime: Time;

  high: number;
  low: number;
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

  // ---------------- ENGINE STATE ----------------
  const engineRef = useRef({
    sma20: new SMA(20),
    sma50: new SMA(50),
    prevState: null as "above" | "below" | null,
  });

  // ---------------- SIGNAL STORAGE ----------------
  const markers = useRef<SeriesMarker<Time>[]>([]);

  const signalLines = useRef<SignalLine[]>([]);

  // ---------------- STRUCTURE BOX STORAGE ----------------
  const activeBoxRef = useRef<StructureBox | null>(null);

  const boxesRef = useRef<StructureBox[]>([]);

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

  // ---------------- BOX COLOR ----------------
  const getBoxColor = (label: Phase) => {
    // console.log(label);
  if (label === "R") return "#00FF00"; // green
  if (label === "B") return "#FFD700"; // yellow
  return "#FF0000"; // red (D)
};

  // ---------------- REDRAW ----------------
  const redrawOverlay = () => {
    const ctx = ctxRef.current;

    const canvas = canvasRef.current;

    const chart = chartRef.current;

    const candleSeries = candleRef.current;

    if (!ctx || !canvas || !chart || !candleSeries) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // =====================================================
    // DRAW STRUCTURE BOXES
    // =====================================================

    const allBoxes = [...boxesRef.current];

    if (activeBoxRef.current) {
      allBoxes.push(activeBoxRef.current);
    }

    allBoxes.forEach((box) => {
      const x1 = chart.timeScale().timeToCoordinate(box.startTime);

      const x2 = chart.timeScale().timeToCoordinate(box.endTime);

      const y1 = candleSeries.priceToCoordinate(box.high);

      const y2 = candleSeries.priceToCoordinate(box.low);

      if (
        x1 == null ||
        x2 == null ||
        y1 == null ||
        y2 == null
      ) {
        return;
      }

      const left = Math.min(x1, x2);

      const width = Math.abs(x2 - x1);

      const top = Math.min(y1, y2);

      const height = Math.abs(y2 - y1);

      const color = getBoxColor(box.label);

      // transparent fill
      ctx.save();

      ctx.globalAlpha = 0.15;

      ctx.fillStyle = color;

      ctx.fillRect(left, top, width, height);

      ctx.restore();

      // border
      ctx.beginPath();

      ctx.strokeStyle = color;

      ctx.lineWidth = 0.5;

      ctx.strokeRect(left, top, width, height);
    });

    // =====================================================
    // DRAW SIGNAL LINES
    // =====================================================

    signalLines.current.forEach((line) => {
      const x = chart.timeScale().timeToCoordinate(line.time);

      if (x == null) return;

      ctx.beginPath();

      ctx.setLineDash([6, 4]);

      ctx.moveTo(x + 0.5, 0);

      ctx.lineTo(x + 0.5, canvas.height);

      ctx.strokeStyle = line.color;

      ctx.lineWidth = 1;

      ctx.stroke();
    });

    ctx.setLineDash([]);
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

    // redraw on pan/zoom
    chart.timeScale().subscribeVisibleTimeRangeChange(() => {
      redrawOverlay();
    });

    return () => chart.remove();
  }, []);

  // ---------------- STREAM UPDATE ----------------
  useEffect(() => {
    if (!candleRef.current || data.length === 0) return;

    const last = data[data.length - 1];

    const t = Math.floor(last.time) as Time;

    // =====================================================
    // CANDLE UPDATE
    // =====================================================

    candleRef.current.update({
      time: t,
      open: last.open,
      high: last.high,
      low: last.low,
      close: last.close,
    });

    // =====================================================
    // SMA UPDATE
    // =====================================================

    const engine = engineRef.current;

    const v20 = engine.sma20.update(last.close);

    const v50 = engine.sma50.update(last.close);

    if (v20 === null || v50 === null) return;

    sma20Ref.current.update({
      time: t,
      value: v20,
    });

    sma50Ref.current.update({
      time: t,
      value: v50,
    });

    // =====================================================
    // CROSSOVER LOGIC
    // =====================================================

    const state: "above" | "below" =
      v20 > v50 ? "above" : "below";

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
    }

    engine.prevState = state;

    // =====================================================
    // STRUCTURE BOX ENGINE
    // =====================================================

    const label = last.label;

    // ---------- RANDOM ----------
    if (label === "random") {
      if (activeBoxRef.current) {
        boxesRef.current.push(activeBoxRef.current);

        activeBoxRef.current = null;
      }
    }

    // ---------- STRUCTURED ----------
    else {
      const active = activeBoxRef.current;

      // no active box
      if (!active) {
        activeBoxRef.current = {
          label,

          startTime: t,
          endTime: t,

          high: last.high,
          low: last.low,
        };
      }

      // same label -> extend box
      else if (active.label === label) {
        active.endTime = t;

        active.high = Math.max(active.high, last.high);

        active.low = Math.min(active.low, last.low);
      }

      // label changed -> finalize old + start new
      else {
        boxesRef.current.push(active);

        activeBoxRef.current = {
          label,

          startTime: t,
          endTime: t,

          high: last.high,
          low: last.low,
        };
      }
    }

    // =====================================================
    // REDRAW
    // =====================================================

    redrawOverlay();
  }, [data]);

  return (
    <div
      ref={containerRef}
      className="relative w-[800px] h-[500px]"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-50 pointer-events-none"
      />
    </div>
  );
}