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

        // ✅ 1. Add AREA FIRST (background)
        const areaSeries = chart.addSeries(AreaSeries, {
            lineColor: "rgba(96,165,250,0.6)",
            topColor: "rgba(96,165,250,0.2)",
            bottomColor: "rgba(96,165,250,0.0)",
        });

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

        const rawData = generateChunkedCandles(500, 150);

        // ✅ Area from highs
        const areaData = rawData.map(c => ({
            time: c.time,
            value: c.high,
        }));

        areaSeries.setData(areaData);

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