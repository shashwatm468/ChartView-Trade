import { useEffect, useState } from "react";
import Trial from "../src/Components/Trial5";

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

function step(prev: number) {
  const drift = 0.0002;
  const vol = 0.01;
  const rand = (Math.random() - 0.5) * vol;
  return prev * (1 + drift + rand);
}

export default function App() {
  const [data, setData] = useState<Candle[]>([]);

  useEffect(() => {
    let price = 380;
    let time = Math.floor(Date.now() / 1000);

    const id = setInterval(() => {
      const open = price;
      const close = step(price);

      const candle: Candle = {
        time,
        open,
        high: Math.max(open, close),
        low: Math.min(open, close),
        close,
      };

      price = close;
      time += 60;

      setData((p) => [...p, candle]);
    }, 300);

    return () => clearInterval(id);
  }, []);

  return <Trial data={data} />;
}