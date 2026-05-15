import { 
    CandlestickSeries, 
    AreaSeries, 
    createChart, 
    type IChartApi, 
    type ISeriesApi 
} from "lightweight-charts";

import { useEffect, useRef } from "react";
import { generateChunkedCandles } from "../Data/candleEngine";

export default function Trail () {

    const divRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

    useEffect(() => {
        if (!divRef.current) return;

        const chart = createChart(divRef.current, {
            autoSize: true,
            timeScale: {
                timeVisible: true,
                secondsVisible: true,
            },
        });
        chartRef.current = chart;
        const rawData = generateChunkedCandles(500, 150);

        // -------------------- AREA SERIES (R, B, D) --------------------

        // Add FIRST (so they stay behind candles)
        const rArea = chart.addSeries(AreaSeries, {
            lineColor: "rgba(34,197,94,0.6)",
            topColor: "rgba(34,197,94,0.2)",
            bottomColor: "rgba(34,197,94,0)",
        });

        const bArea = chart.addSeries(AreaSeries, {
            lineColor: "rgba(234,179,8,0.6)",
            topColor: "rgba(234,179,8,0.2)",
            bottomColor: "rgba(234,179,8,0)",
        });

        const dArea = chart.addSeries(AreaSeries, {
            lineColor: "rgba(239,68,68,0.6)",
            topColor: "rgba(239,68,68,0.2)",
            bottomColor: "rgba(239,68,68,0)",
        });

        // -------------------- DATA SPLIT --------------------

        // choose your value source (recommended: mid)
        const getValue = (c: typeof rawData[number]) => (c.high + c.low) / 2;

        const rData = rawData
            .filter(c => c.label === "R")
            .map(c => ({
                time: c.time,
                value: getValue(c),
            }));

        const bData = rawData
            .filter(c => c.label === "B")
            .map(c => ({
                time: c.time,
                value: getValue(c),
            }));

        const dData = rawData
            .filter(c => c.label === "D")
            .map(c => ({
                time: c.time,
                value: getValue(c),
            }));

        // -------------------- APPLY --------------------

        rArea.setData(rData);
        bArea.setData(bData);
        dArea.setData(dData);






        
        // ✅ 2. Add CANDLES SECOND (foreground)
        const series = chart.addSeries(CandlestickSeries);
        seriesRef.current = series;

        function getColor(label: "R" | "B" | "D" | "Q") {
            switch (label) {
                case "R": return "#22c55e";
                case "B": return "#eab308";
                case "D": return "#ef4444";
                case "Q": return "#a855f7";
            }
        }

        // ✅ Colored candles
        const coloredData = rawData.map(c => {
            const color = getColor(c.label);

            return {
                ...c,
                color,
                borderColor: color,
                wickColor: color,
            };
        });

        series.setData(coloredData);

        return () => {
            chart.remove();
            chartRef.current = null;
            seriesRef.current = null;
        };

    }, []);

    return (
        <div ref={divRef} className="w-[1000px] h-[600px]"></div>
    );
}