import { useEffect, useState } from "react";
import Trial from "../src/Components/Trial5";
import { generateNextCandle } from "./Data/gbmEngine";
import type { Candle } from "./Data/gbmEngine";

export default function App() {
  const [data, setData] = useState<Candle[]>([]);

  useEffect(() => {
    let lastClose = 380;
    let currentTime = Math.floor(Date.now() / 1000);
    const intervalSec = 60;

    const id = setInterval(() => {
      const candle = generateNextCandle(
        lastClose,
        currentTime,
        intervalSec
      );

      lastClose = candle.close;
      currentTime = candle.time;
      setData((prev) => [...prev, candle]);
    }, 100);

    return () => clearInterval(id);
  }, []);

  return (
  <>
    <div className="flex items-center justify-center h-screen">
      <Trial data={data} />
    </div>
  </>
);
}