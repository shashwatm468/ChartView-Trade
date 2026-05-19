import { useEffect, useRef, useState } from "react";

import MainPage from "./Components/Pages/MainPage";

import {
  generateNextCandle,
  type Candle,
} from "./Data/gbmEngine";

export default function App() {
  const [data, setData] = useState<Candle[]>([]);

  // =====================================================
  // PLAYBACK SETTINGS
  // =====================================================

  const [speed, setSpeed] =
    useState(100);

  const [isPlaying, setIsPlaying] =
    useState(true);

  const [rewindStep, setRewindStep] =
    useState(50);

  // =====================================================
  // DATE FILTER
  // =====================================================

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  // =====================================================
  // ENGINE STATE
  // =====================================================

  const lastCloseRef = useRef(380);

  const currentTimeRef = useRef(
    Math.floor(Date.now() / 1000)
  );

  const intervalSec = 60;

  // full replay history
  const fullHistoryRef = useRef<
    Candle[]
  >([]);

  // replay cursor
  const pointerRef = useRef(0);

  // =====================================================
  // INITIAL HISTORY GENERATION
  // =====================================================

  useEffect(() => {
    const generated: Candle[] = [];

    let close =
      lastCloseRef.current;

    let time =
      currentTimeRef.current;

    // preload candles
    for (let i = 0; i < 1000; i++) {
      const candle =
        generateNextCandle(
          close,
          time,
          intervalSec
        );

      generated.push(candle);

      close = candle.close;

      time = candle.time;
    }

    fullHistoryRef.current =
      generated;

    // initial visible candles
    const initial =
      generated.slice(0, 50);

    setData(initial);

    pointerRef.current = 50;

    lastCloseRef.current =
      generated[
        generated.length - 1
      ].close;

    currentTimeRef.current =
      generated[
        generated.length - 1
      ].time;
  }, []);

  // =====================================================
  // PLAYBACK LOOP
  // =====================================================

  useEffect(() => {
    if (!isPlaying) return;

    const id = setInterval(() => {
      const history =
        fullHistoryRef.current;

      // generate more candles if needed
      if (
        pointerRef.current >=
        history.length
      ) {
        const candle =
          generateNextCandle(
            lastCloseRef.current,
            currentTimeRef.current,
            intervalSec
          );

        history.push(candle);

        lastCloseRef.current =
          candle.close;

        currentTimeRef.current =
          candle.time;
      }

      pointerRef.current++;

      setData(
        history.slice(
          0,
          pointerRef.current
        )
      );
    }, speed);

    return () => clearInterval(id);
  }, [speed, isPlaying]);

  // =====================================================
  // PLAYBACK CONTROLS
  // =====================================================

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handleRewind = () => {
    setIsPlaying(false);

    pointerRef.current =
      Math.max(
        10,
        pointerRef.current -
          rewindStep
      );

    setData(
      fullHistoryRef.current.slice(
        0,
        pointerRef.current
      )
    );
  };

  // =====================================================
  // DATE FILTER LOGIC
  // =====================================================

  const handleApplyDateFilter =
    () => {
      if (!fromDate || !toDate)
        return;

      const from = Math.floor(
        new Date(
          fromDate
        ).getTime() / 1000
      );

      // include full end day
      const to =
        Math.floor(
          new Date(
            toDate
          ).getTime() / 1000
        ) + 86400;

      const filtered =
        fullHistoryRef.current.filter(
          (candle) =>
            candle.time >= from &&
            candle.time <= to
        );

      if (filtered.length === 0)
        return;

      setIsPlaying(false);

      pointerRef.current =
        filtered.length;

      setData(filtered);
    };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="p-4">
      {/* CONTROLS */}

      <div className="flex gap-4 mb-4 items-center flex-wrap">
        {/* PLAY */}

        <button
          onClick={handlePlay}
          className="border px-3 py-1"
        >
          ▶ Play
        </button>

        {/* SPEED */}

        <div className="flex items-center gap-2">
          <span>Speed:</span>

          <select
            value={speed}
            onChange={(e) =>
              setSpeed(
                Number(
                  e.target.value
                )
              )
            }
            className="border px-2 py-1"
          >
            <option value={1000}>
              1x
            </option>

            <option value={500}>
              2x
            </option>

            <option value={200}>
              5x
            </option>

            <option value={100}>
              10x
            </option>

            <option value={50}>
              20x
            </option>

            <option value={20}>
              50x
            </option>

            <option value={10}>
              100x
            </option>

            {/* <option value={1}>
              1000x
            </option> */}
          </select>
        </div>

        {/* PAUSE */}

        <button
          onClick={handlePause}
          className="border px-3 py-1"
        >
          ⏸ Pause
        </button>

        {/* REWIND */}

        <button
          onClick={handleRewind}
          className="border px-3 py-1"
        >
          ⏪ Rewind
        </button>

        {/* REWIND STEP */}

        <div className="flex items-center gap-2">
          <span>Jump:</span>

          <select
            value={rewindStep}
            onChange={(e) =>
              setRewindStep(
                Number(
                  e.target.value
                )
              )
            }
            className="border px-2 py-1"
          >
            <option value={1}>
              1
            </option>

            <option value={5}>
              5
            </option>

            <option value={10}>
              10
            </option>

            <option value={20}>
              20
            </option>

            <option value={50}>
              50
            </option>
          </select>
        </div>

        {/* FROM DATE */}

        <div className="flex items-center gap-2">
          <span>From:</span>

          <input
            type="date"
            value={fromDate}
            onChange={(e) =>
              setFromDate(
                e.target.value
              )
            }
            className="border px-2 py-1"
          />
        </div>

        {/* TO DATE */}

        <div className="flex items-center gap-2">
          <span>To:</span>

          <input
            type="date"
            value={toDate}
            onChange={(e) =>
              setToDate(
                e.target.value
              )
            }
            className="border px-2 py-1"
          />
        </div>

        {/* APPLY FILTER */}

        <button
          onClick={
            handleApplyDateFilter
          }
          className="border px-3 py-1"
        >
          Apply Range
        </button>
      </div>

      {/* CHART */}

      <MainPage data={data} />
    </div>
  );
}