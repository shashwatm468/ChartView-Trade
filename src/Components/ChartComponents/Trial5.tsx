import { useEffect, useRef, useState } from "react";

import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  createSeriesMarkers,
} from "lightweight-charts";

import { SMA } from "../../Data/smaEngine";
import { RSI } from "../../Data/rsiEngine";
import { AO } from "../../Data/aoEngine";

import type { Candle, Phase } from "../../Data/gbmEngine";

type Props = {
  data: Candle[];
};

type SignalLine = {
  time: number;
  color: string;
};

type StructureBox = {
  label: Phase;
  startTime: number;
  endTime: number;
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

  const rsiRef = useRef<any>(null);

  const aoRef = useRef<any>(null);

  const markerRef = useRef<any>(null);

  // =========================================================
  // PANE TOGGLES
  // =========================================================

  const [showRSI, setShowRSI] = useState(true);
  const [showAO, setShowAO] = useState(true);

  // =========================================================
  // ENGINE
  // =========================================================

  const engineRef = useRef({
    sma20: new SMA(20),
    sma50: new SMA(50),
    rsi: new RSI(14),
    ao: new AO(5, 34),
    prevState: null as "above" | "below" | null,
  });

  // =========================================================
  // OVERLAY STORAGE
  // =========================================================

  const markers = useRef<any[]>([]);

  const signalLines = useRef<SignalLine[]>([]);

  const activeBoxRef = useRef<StructureBox | null>(null);

  const boxesRef = useRef<StructureBox[]>([]);

  // detect rewind
  const prevLengthRef = useRef(0);

  // =========================================================
  // CANVAS INIT
  // =========================================================

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 500;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctxRef.current = ctx;
  }, []);

  // =========================================================
  // BOX COLORS
  // =========================================================

  const getBoxColor = (label: Phase) => {
    if (label === "R") return "#00FF00";

    if (label === "B") return "#FFD700";

    return "#FF0000";
  };

  // =========================================================
  // OVERLAY DRAW
  // =========================================================

  const redrawOverlay = () => {
    const ctx = ctxRef.current;

    const canvas = canvasRef.current;

    const chart = chartRef.current;

    const candleSeries = candleRef.current;

    if (!ctx || !canvas || !chart || !candleSeries) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allBoxes = [...boxesRef.current];

    if (activeBoxRef.current) {
      allBoxes.push(activeBoxRef.current);
    }

    // ---------------- BOXES ----------------

    allBoxes.forEach((box) => {
      const x1 = chart.timeScale().timeToCoordinate(box.startTime);

      const x2 = chart.timeScale().timeToCoordinate(box.endTime);

      const y1 = candleSeries.priceToCoordinate(box.high);

      const y2 = candleSeries.priceToCoordinate(box.low);

      if (x1 == null || x2 == null || y1 == null || y2 == null) {
        return;
      }

      const left = Math.min(x1, x2);

      const width = Math.abs(x2 - x1);

      const top = Math.min(y1, y2);

      const height = Math.abs(y2 - y1);

      const color = getBoxColor(box.label);

      ctx.save();

      ctx.globalAlpha = 0.15;

      ctx.fillStyle = color;

      ctx.fillRect(left, top, width, height);

      ctx.restore();

      ctx.strokeStyle = color;

      ctx.lineWidth = 0.5;

      ctx.strokeRect(left, top, width, height);
    });

    // ---------------- SIGNAL LINES ----------------

    signalLines.current.forEach((line) => {
      const x = chart.timeScale().timeToCoordinate(line.time);

      if (x == null) return;

      ctx.beginPath();

      ctx.setLineDash([6, 4]);

      ctx.moveTo(x + 0.5, 0);

      ctx.lineTo(x + 0.5, canvas.height);

      ctx.strokeStyle = line.color;

      ctx.stroke();
    });

    ctx.setLineDash([]);
  };

  // =========================================================
  // CHART INIT
  // =========================================================

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
    });

    chartRef.current = chart;

    // ---------------- CANDLES ----------------

    const candle = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    // ---------------- SMA ----------------

    const sma20 = chart.addSeries(LineSeries, {
      color: "orange",
      lineWidth: 2,
    });

    const sma50 = chart.addSeries(LineSeries, {
      color: "blue",
      lineWidth: 2,
    });

    // ---------------- RSI ----------------

    const rsi = chart.addSeries(
      LineSeries,
      {
        color: "#6c4275",
        lineWidth: 2,
      },
      1
    );

    // ---------------- AO ----------------

    const ao = chart.addSeries(
      HistogramSeries,
      {
        base: 0,
      },
      2
    );

    candleRef.current = candle;

    sma20Ref.current = sma20;

    sma50Ref.current = sma50;

    rsiRef.current = rsi;

    aoRef.current = ao;

    markerRef.current = createSeriesMarkers(candle, []);

    // ---------------- DEFAULT PANE HEIGHTS ----------------
    // Keep them balanced and stable.
    const panes = chart.panes();

    if (panes.length >= 3) {
      panes[0].setHeight(300);
      panes[1].setHeight(100);
      panes[2].setHeight(100);
    }

    chart.timeScale().subscribeVisibleTimeRangeChange(() => {
      redrawOverlay();
    });

    return () => {
      chart.remove();
    };
  }, []);

  // =========================================================
  // PANE VISIBILITY / TRUE HIDE
  // =========================================================

  useEffect(() => {
    if (!chartRef.current || !rsiRef.current || !aoRef.current || !containerRef.current) {
      return;
    }

    const chart = chartRef.current;
    const panes = chart.panes();

    if (panes.length < 3) {
      return;
    }

    const mainPane = panes[0];
    const rsiPane = panes[1];
    const aoPane = panes[2];

    // Make the series actually invisible when toggled off
    rsiRef.current.applyOptions({
      visible: showRSI,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    aoRef.current.applyOptions({
      visible: showAO,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    // Then collapse the pane as much as possible.
    // Use 1px instead of 0px to avoid layout issues.
    if (showRSI && showAO) {
      mainPane.setHeight(300);
      rsiPane.setHeight(100);
      aoPane.setHeight(100);
    } else if (showRSI && !showAO) {
      mainPane.setHeight(400);
      rsiPane.setHeight(100);
      aoPane.setHeight(1);
    } else if (!showRSI && showAO) {
      mainPane.setHeight(400);
      rsiPane.setHeight(1);
      aoPane.setHeight(100);
    } else {
      mainPane.setHeight(500);
      rsiPane.setHeight(1);
      aoPane.setHeight(1);
    }

    requestAnimationFrame(() => {
      redrawOverlay();
    });
  }, [showRSI, showAO]);

  // =========================================================
  // STREAM / REWIND UPDATE
  // =========================================================

  useEffect(() => {
    if (!candleRef.current || data.length === 0) {
      return;
    }

    // =====================================================
    // REWIND DETECTED
    // =====================================================

    if (data.length < prevLengthRef.current) {
      // ---------------- RESET MAIN SERIES ----------------

      candleRef.current.setData(
        data.map((c) => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      );

      // ---------------- RESET ENGINES ----------------

      engineRef.current = {
        sma20: new SMA(20),
        sma50: new SMA(50),
        rsi: new RSI(14),
        ao: new AO(5, 34),
        prevState: null,
      };

      // ---------------- RESET VISUALS ----------------

      markers.current = [];

      signalLines.current = [];

      boxesRef.current = [];

      activeBoxRef.current = null;

      markerRef.current.setMarkers([]);

      // ---------------- REBUILD ----------------

      const sma20Data: any[] = [];

      const sma50Data: any[] = [];

      const rsiData: any[] = [];

      const aoData: any[] = [];

      const rebuiltMarkers: any[] = [];

      const rebuiltLines: SignalLine[] = [];

      const rebuiltBoxes: StructureBox[] = [];

      let activeBox: StructureBox | null = null;

      data.forEach((candle) => {
        const t = candle.time;

        const engine = engineRef.current;

        // ---------------- SMA ----------------

        const v20 = engine.sma20.update(candle.close);

        const v50 = engine.sma50.update(candle.close);

        if (v20 !== null) {
          sma20Data.push({
            time: t,
            value: v20,
          });
        }

        if (v50 !== null) {
          sma50Data.push({
            time: t,
            value: v50,
          });
        }

        // ---------------- RSI ----------------

        const rsiVal = engine.rsi.update(candle.close);

        if (rsiVal !== null) {
          rsiData.push({
            time: t,
            value: rsiVal,
          });
        }

        // ---------------- AO ----------------

        const aoVal = engine.ao.update(candle.high, candle.low);

        if (aoVal !== null) {
          aoData.push({
            time: t,
            value: aoVal,
            color: aoVal >= 0 ? "#26a69a" : "#ef5350",
          });
        }

        // ---------------- CROSSOVERS ----------------

        if (v20 !== null && v50 !== null) {
          const state = v20 > v50 ? "above" : "below";

          if (engine.prevState && engine.prevState !== state) {
            const isBuy = state === "above";

            rebuiltMarkers.push({
              time: t,
              position: isBuy ? "belowBar" : "aboveBar",
              color: isBuy ? "#FFD700" : "#00FFFF",
              shape: isBuy ? "arrowUp" : "arrowDown",
              text: isBuy ? "BUY" : "SELL",
            });

            rebuiltLines.push({
              time: t,
              color: isBuy ? "#FFD700" : "#00FFFF",
            });
          }

          engine.prevState = state;
        }

        // ---------------- STRUCTURE BOXES ----------------

        const label = candle.label;

        if (label === "random") {
          if (activeBox) {
            rebuiltBoxes.push(activeBox);
            activeBox = null;
          }
        } else {
          if (!activeBox) {
            activeBox = {
              label,
              startTime: t,
              endTime: t,
              high: candle.high,
              low: candle.low,
            };
          } else if (activeBox.label === label) {
            activeBox.endTime = t;

            activeBox.high = Math.max(activeBox.high, candle.high);

            activeBox.low = Math.min(activeBox.low, candle.low);
          } else {
            rebuiltBoxes.push(activeBox);

            activeBox = {
              label,
              startTime: t,
              endTime: t,
              high: candle.high,
              low: candle.low,
            };
          }
        }
      });

      // ---------------- APPLY REBUILT DATA ----------------

      sma20Ref.current.setData(sma20Data);

      sma50Ref.current.setData(sma50Data);

      rsiRef.current.setData(rsiData);

      aoRef.current.setData(aoData);

      markerRef.current.setMarkers(rebuiltMarkers);

      markers.current = rebuiltMarkers;

      signalLines.current = rebuiltLines;

      boxesRef.current = rebuiltBoxes;

      activeBoxRef.current = activeBox;

      prevLengthRef.current = data.length;

      redrawOverlay();

      return;
    }

    // =====================================================
    // NORMAL FORWARD UPDATE
    // =====================================================

    const last = data[data.length - 1];

    const t = last.time;

    candleRef.current.update({
      time: t,
      open: last.open,
      high: last.high,
      low: last.low,
      close: last.close,
    });

    const engine = engineRef.current;

    // ---------------- SMA ----------------

    const v20 = engine.sma20.update(last.close);

    const v50 = engine.sma50.update(last.close);

    if (v20 !== null) {
      sma20Ref.current.update({
        time: t,
        value: v20,
      });
    }

    if (v50 !== null) {
      sma50Ref.current.update({
        time: t,
        value: v50,
      });
    }

    // ---------------- RSI ----------------

    const rsiVal = engine.rsi.update(last.close);

    if (rsiVal !== null) {
      rsiRef.current.update({
        time: t,
        value: rsiVal,
      });
    }

    // ---------------- AO ----------------

    const aoVal = engine.ao.update(last.high, last.low);

    if (aoVal !== null) {
      aoRef.current.update({
        time: t,
        value: aoVal,
        color: aoVal >= 0 ? "#26a69a" : "#ef5350",
      });
    }

    // ---------------- CROSSOVER ----------------

    if (v20 !== null && v50 !== null) {
      const state = v20 > v50 ? "above" : "below";

      if (engine.prevState && engine.prevState !== state) {
        const isBuy = state === "above";

        const marker = {
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
    }

    // ---------------- STRUCTURE BOX ----------------

    const label = last.label;

    if (label === "random") {
      if (activeBoxRef.current) {
        boxesRef.current.push(activeBoxRef.current);

        activeBoxRef.current = null;
      }
    } else {
      const active = activeBoxRef.current;

      if (!active) {
        activeBoxRef.current = {
          label,
          startTime: t,
          endTime: t,
          high: last.high,
          low: last.low,
        };
      } else if (active.label === label) {
        active.endTime = t;

        active.high = Math.max(active.high, last.high);

        active.low = Math.min(active.low, last.low);
      } else {
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

    prevLengthRef.current = data.length;

    redrawOverlay();
  }, [data]);

  return (
    <div className="w-full">
      {/* CONTROLS */}
      <div className="mb-3 flex gap-3 items-center">
        <select
          value={showRSI ? "on" : "off"}
          onChange={(e) => setShowRSI(e.target.value === "on")}
          className="border px-2 py-1"
        >
          <option value="on">RSI ON</option>
          <option value="off">RSI OFF</option>
        </select>

        <select
          value={showAO ? "on" : "off"}
          onChange={(e) => setShowAO(e.target.value === "on")}
          className="border px-2 py-1"
        >
          <option value="on">AO ON</option>
          <option value="off">AO OFF</option>
        </select>
      </div>

      {/* CHART */}
      <div ref={containerRef} className="relative w-[800px] h-[500px]">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-50 pointer-events-none"
        />
      </div>
    </div>
  );
}