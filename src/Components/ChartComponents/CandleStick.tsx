import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  createChart,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type SeriesMarker,
  type SeriesType,
  type UTCTimestamp,
} from "lightweight-charts";
import { candles, trades, type CandlePhase } from "../Data/staticdata";

type Candle = (typeof candles)[number];

const phaseStyles: Record<
  CandlePhase,
  { label: string; border: string; fill: string }
> = {
  R: {
    label: "Rig Rally",
    border: "#20c96b",
    fill: "rgba(32, 201, 107, 0.1)",
  },
  B: {
    label: "Small Base",
    border: "#f2bd24",
    fill: "rgba(242, 189, 36, 0.12)",
  },
  D: {
    label: "Big Drop",
    border: "#c94635",
    fill: "rgba(201, 70, 53, 0.1)",
  },
};

const phaseSegments = candles.reduce<
  { phase: CandlePhase; candles: Candle[] }[]
>((segments, candle) => {
  const previous = segments[segments.length - 1];

  if (previous?.phase === candle.label) {
    previous.candles.push(candle);
  } else {
    segments.push({ phase: candle.label, candles: [candle] });
  }

  return segments;
}, []);

const chartData = candles.map(({ time, open, high, low, close }) => ({
  time,
  open,
  high,
  low,
  close,
}));

export default function Chart() {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const container = chartRef.current;
    const chart = createChart(container, {
      width: container.clientWidth || 900,
      height: container.clientHeight || 640,
      layout: {
        background: { color: "#f8fafc" },
        textColor: "#475569",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.16)" },
        horzLines: { color: "rgba(148, 163, 184, 0.16)" },
      },
      rightPriceScale: {
        borderColor: "rgba(100, 116, 139, 0.28)",
        scaleMargins: {
          top: 0.1,
          bottom: 0.12,
        },
      },
      timeScale: {
        borderColor: "rgba(100, 116, 139, 0.28)",
        timeVisible: true,
        barSpacing: 18,
        minBarSpacing: 8,
        rightOffset: 6,
      },
      crosshair: {
        vertLine: { color: "rgba(71, 85, 105, 0.32)" },
        horzLine: { color: "rgba(71, 85, 105, 0.32)" },
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#52d181",
      downColor: "#bf4a3a",
      borderUpColor: "#52d181",
      borderDownColor: "#bf4a3a",
      wickUpColor: "#52d181",
      wickDownColor: "#bf4a3a",
    });

    series.setData(chartData);

    createSeriesMarkers(
      series,
      trades.map<SeriesMarker<UTCTimestamp>>((trade) => ({
        time: trade.time,
        position: trade.side === "BUY" ? "belowBar" : "aboveBar",
        shape: trade.side === "BUY" ? "arrowUp" : "arrowDown",
        color: trade.side === "BUY" ? "#16a34a" : "#dc2626",
        text: `${trade.side} ${trade.price.toFixed(2)}`,
      }))
    );

    const priceLines = trades.map((trade) =>
      series.createPriceLine({
        price: trade.price,
        color: trade.side === "BUY" ? "#16a34a" : "#dc2626",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: trade.side,
      })
    );

    const setTradingViewRange = () => {
      chart.timeScale().setVisibleLogicalRange({
        from: -2,
        to: candles.length + 18,
      });
    };

    setTradingViewRange();

    const overlays = phaseSegments.map((segment) => {
      const style = phaseStyles[segment.phase];
      return createOverlay(container, style.label, style.border, style.fill);
    });

    const drawOverlays = () => {
      phaseSegments.forEach((segment, index) => {
        positionOverlay(chart, series, overlays[index], segment.candles);
      });
    };

    drawOverlays();
    chart.timeScale().subscribeVisibleLogicalRangeChange(drawOverlays);

    const resizeObserver = new ResizeObserver(([entry]) => {
      chart.applyOptions({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
      setTradingViewRange();
      drawOverlays();
    });

    resizeObserver.observe(container);

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(drawOverlays);
      resizeObserver.disconnect();
      overlays.forEach((overlay) => overlay.remove());
      priceLines.forEach((line) => series.removePriceLine(line));
      chart.remove();
    };
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "#e8edf3",
        color: "#0f172a",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <section
        style={{
          height: "calc(100vh - 48px)",
          minHeight: 620,
          border: "1px solid #cbd5e1",
          borderRadius: 8,
          overflow: "hidden",
          background: "#f8fafc",
          boxShadow: "0 22px 55px rgba(15, 23, 42, 0.18)",
          display: "grid",
          gridTemplateRows: "auto minmax(0, 1fr)",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: "16px 20px",
            borderBottom: "1px solid #d7dee8",
            background: "#ffffff",
          }}
        >
          <div>
            <div style={{ color: "#64748b", fontSize: 13 }}>Trading Chart</div>
            <h1 style={{ margin: 0, fontSize: 22 }}>
              Big Move, Small Base, Big Move
            </h1>
          </div>

          <div style={{ display: "flex", gap: 10, fontSize: 13 }}>
            <Legend color={phaseStyles.R.border} label="Rally" />
            <Legend color={phaseStyles.B.border} label="Base" />
            <Legend color={phaseStyles.D.border} label="Drop" />
            <Legend color="#16a34a" label="Buy" />
            <Legend color="#dc2626" label="Sell" />
          </div>
        </header>

        <div
          ref={chartRef}
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        />
      </section>
    </main>
  );
}

function createOverlay(
  container: HTMLDivElement,
  label: string,
  border: string,
  fill: string
) {
  const overlay = document.createElement("div");
  const badge = document.createElement("div");

  overlay.style.position = "absolute";
  overlay.style.pointerEvents = "none";
  overlay.style.border = `1.5px solid ${border}`;
  overlay.style.borderRadius = "4px";
  overlay.style.background = fill;
  overlay.style.boxShadow = `inset 0 0 0 1px ${border}22`;
  overlay.style.zIndex = "10";
  overlay.style.display = "none";

  badge.textContent = label;
  badge.style.position = "absolute";
  badge.style.top = "4px";
  badge.style.left = "4px";
  badge.style.padding = "3px 6px";
  badge.style.borderRadius = "4px";
  badge.style.background = "#ffffff";
  badge.style.border = `1px solid ${border}`;
  badge.style.color = border;
  badge.style.fontSize = "11px";
  badge.style.fontWeight = "800";

  overlay.appendChild(badge);
  container.appendChild(overlay);

  return overlay;
}

function positionOverlay(
  chart: IChartApi,
  series: ISeriesApi<SeriesType>,
  overlay: HTMLDivElement,
  segmentCandles: Candle[]
) {
  const first = segmentCandles[0];
  const last = segmentCandles[segmentCandles.length - 1];

  if (!first || !last) {
    overlay.style.display = "none";
    return;
  }

  const startX = chart.timeScale().timeToCoordinate(first.time);
  const endX = chart.timeScale().timeToCoordinate(last.time);
  const highY = series.priceToCoordinate(
    Math.max(...segmentCandles.map((c) => c.high))
  );
  const lowY = series.priceToCoordinate(
    Math.min(...segmentCandles.map((c) => c.low))
  );

  if (startX === null || endX === null || highY === null || lowY === null) {
    overlay.style.display = "none";
    return;
  }

  const halfBarWidth = chart.timeScale().options().barSpacing / 2;
  const horizontalGap = 3;
  const verticalPadding = 6;
  const left = Math.min(startX, endX) - halfBarWidth + horizontalGap;
  const right = Math.max(startX, endX) + halfBarWidth - horizontalGap;
  const top = Math.min(highY, lowY) - verticalPadding;
  const bottom = Math.max(highY, lowY) + verticalPadding;

  overlay.style.display = "block";
  overlay.style.left = `${left}px`;
  overlay.style.top = `${top}px`;
  overlay.style.width = `${right - left}px`;
  overlay.style.height = `${bottom - top}px`;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        border: "1px solid #cbd5e1",
        borderRadius: 6,
        padding: "7px 10px",
        color: "#334155",
        background: "#f8fafc",
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 2,
          background: color,
          boxShadow: `0 0 0 3px ${color}24`,
        }}
      />
      {label}
    </div>
  );
}
