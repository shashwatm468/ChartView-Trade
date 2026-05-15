import { CandlestickSeries, createChart, type IChartApi, type ISeriesApi } from "lightweight-charts";
import { useEffect, useRef } from "react";
import { generateChunkedCandles } from "../Data/candleEngine";

export default function Trail ({}) {

    const divRef = useRef <HTMLDivElement | null> (null);
    const chartRef = useRef<IChartApi | null> (null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null> (null);

    useEffect(()=>{
        if(!divRef.current) return;

        const chart = createChart(divRef.current, {
            autoSize: true,
            timeScale: {
                timeVisible: true,
                secondsVisible: true,
            },
        });
        chartRef.current = chart;
 
        const series = chart.addSeries(CandlestickSeries);
        seriesRef.current = series;

        const data = generateChunkedCandles(500,150)

        console.log(data.slice(0, 250));

        series.setData(data);

        
        

         return () => {
            chart.remove();
            chartRef.current = null;
            seriesRef.current = null;
        };

    },[])

    return (
        <div ref={divRef} className="w-[1000px] h-[600px]"></div>
    );
}