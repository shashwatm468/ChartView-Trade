import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, ColorType, type IChartApi } from "lightweight-charts";
import { generateCandlestickData } from "../Data/generateData";

export default function CandleStickChart() {
  const divRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!divRef.current || chartRef.current) return;

    chartRef.current = createChart(divRef.current, {
      autoSize: true,
      layout: {
        background: {type: ColorType.Solid, color: "white"},
        // textColor: ""
        // fontSize: 50,
        // fontFamily: "",
      },
      grid: {
        // vertLines: {color: "green", visible: false},
        // horzLines: {color: "yellow", visible: false}
      },
      crosshair: {
        mode: 0,
        // vertLine: {color: "green", width: 4, style: LineStyle.Solid , visible: false, labelVisible: false}
        // horzLine: {color: "green", width: 4, style: LineStyle.Solid , visible: false, labelVisible: false}
        
      },
      timeScale: {
        // rightBarStaysOnScroll: false
        // borderVisible: false
        // borderColor: "red",
        // visible: false,
        // timeVisible: true,
        // secondsVisible: false,
        // fixLeftEdge: true
        // fixRightEdge: true
        // lockVisibleTimeRangeOnResize: true
        // rightOffset: 100
        // barSpacing: 
        // minBarSpacing: 10
        // shiftVisibleRangeOnNewBar: false based on live data, shifting chart to right when new candle arrives
        // allowShiftVisibleRangeOnWhitespaceReplacement: true live data, if new bar out of screen shift, flase dont
        // uniformDistribution spacing yes or no on gap days
      },
      rightPriceScale: {
        // borderColor: "red"
        scaleMargins: {
            // top: 0.2
            // bottom: 0.5
        },
        // autoScale: false
        // mode: 2 different modes, interesting
        // invertScale: true upsdiedoen basically
        // alignLabels: 
      },
      leftPriceScale: { //same as right
        visible: true, //it needs some series attached to it to be visible, also everythign is
        // attached to rightscale by default
        autoScale: true,
      },
      handleScroll: {
        // mouseWheel: true hmmm no idea
        // pressedMouseMove: false move when mouse is clicked
        // horzTouchDrag: true ??
        // vertTouchDrag
      },
      handleScale: {
        // mouseWheel: false, //zoom using mouse wheel off
        // pinch: true 
        // axisPressedMouseMove: false  move using axis scroll
        // axisDoubleClickReset: true  well as the name suggests
      },

      kineticScroll: {
        // mouse: true momentum
        // touch: true 
      },

      trackingMode: {
        // exitMode: 1 mobile related
      },

    //   watermarks blah blah 

    // localization well for different locals/area  tags numberformat timeformat dateformat



    });

    const series = chartRef.current.addSeries(CandlestickSeries);
    const data = generateCandlestickData(200, 200);
    series.setData(data); //bulk data// hostorical data//not live data//


  }, []);

  return <div className="h-[600px] w-[900px]" ref={divRef}></div>;
}

// this code and your code, why did we create extra seriesRef
