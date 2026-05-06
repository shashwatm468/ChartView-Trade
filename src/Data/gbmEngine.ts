export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};


function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function getRegime() {
  const r = Math.random();

  if (r < 0.33) return { mu: 0.0006, vol: 0.012 };   // bullish
  if (r < 0.66) return { mu: -0.0006, vol: 0.014 };  // bearish
  return { mu: 0.0001, vol: 0.008 };                 // sideways
}

function newsJump() {
  if (Math.random() < 0.03) return randn() * 0.06;
  return 0;
}

export function generateNextCandle(
  prevClose: number,
  time: number,
  intervalSec: number
): Candle {
  const regime = getRegime();

  // console.log("ENGINE input time:", time);

  let mu = regime.mu;
  let vol = regime.vol;

  vol = vol * (1 + randn() * 0.15);
  vol = Math.max(0.002, Math.min(vol, 0.05));

  const open = prevClose;

  const Z = randn();
  const jump = newsJump();

  const close =
    open *
    Math.exp(
      (mu - 0.5 * vol * vol) +
      vol * Z +
      jump
    );

  const wick = 0.003 + Math.random() * 0.01;

  const high = Math.max(open, close) * (1 + wick);
  const low = Math.min(open, close) * (1 - wick);

//   console.log("ENGINE output candle:", {
//   time,
//   open,
//   high,
//   low,
//   close,
// });

  return {
    time: time + intervalSec, // IMPORTANT FIX
    open,
    high,
    low,
    close,
  };
}