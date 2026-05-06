import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  createSeriesMarkers,
  LineSeries,
  type ISeriesMarkersPluginApi,
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

  // IMPORTANT: use "any" to avoid TS mismatch with lightweight-charts markers API
  const candleRef = useRef<any>(null);
  const markerRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const sma20Ref = useRef<any>(null);
  const sma50Ref = useRef<any>(null);

  const sma20 = useRef(new SMA(20));
  const sma50 = useRef(new SMA(50));

  const prevState = useRef<"above" | "below" | null>(null);
  const markers = useRef<SeriesMarker<Time>[]>([]);

  // CREATE CHART
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: 900,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
    });

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
    markerRef.current = createSeriesMarkers(candle, []);
    sma20Ref.current = sma20Series;
    sma50Ref.current = sma50Series;

    return () => {
      markerRef.current = null;
      chart.remove();
    };
  }, []);

  // UPDATE LOGIC
  useEffect(() => {
    if (!candleRef.current || data.length === 0) return;

    const last = data[data.length - 1];
    const t = Math.floor(last.time) as Time;

    // candle update
    candleRef.current.update({
      time: t,
      open: last.open,
      high: last.high,
      low: last.low,
      close: last.close,
    });

    // SMA update
    const v20 = sma20.current.update(last.close);
    const v50 = sma50.current.update(last.close);

    if (v20 === null || v50 === null) return;

    sma20Ref.current.update({ time: t, value: v20 });
    sma50Ref.current.update({ time: t, value: v50 });

    // CROSSOVER LOGIC
    const state = v20 > v50 ? "above" : "below";

    if (prevState.current && prevState.current !== state) {
      const isBuy = state === "above";

      markers.current.push({
        time: t,
        position: isBuy ? "belowBar" : "aboveBar",
        color: isBuy ? "#26a69a" : "#ef5350",
        shape: isBuy ? "arrowUp" : "arrowDown",
        text: isBuy ? "BUY" : "SELL",
      });

      markerRef.current?.setMarkers(markers.current);
    }

    prevState.current = state;
  }, [data]);

  return <div ref={containerRef} className="h-screen w-screen" />;
}
