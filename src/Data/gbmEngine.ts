export type Phase = "R" | "B" | "D";

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  label: Phase | "random";
};

// ---------------- NORMAL DISTRIBUTION ----------------
function randn() {
  let u = 0,
    v = 0;

  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();

  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ---------------- REGIME SWITCHING ----------------
function getRegime() {
  const r = Math.random();

  if (r < 0.33) return { mu: 0.0006, vol: 0.012 }; // bullish
  if (r < 0.66) return { mu: -0.0006, vol: 0.014 }; // bearish

  return { mu: 0.0001, vol: 0.008 }; // sideways
}

// ---------------- NEWS SHOCK ----------------
function newsJump() {
  if (Math.random() < 0.03) {
    return randn() * 0.06;
  }

  return 0;
}

// ---------------- STRUCTURE ENGINE ----------------
type StructureState = {
  active: boolean;
  phases: Phase[];
  index: number;
  remaining: number;
};

const structureState: StructureState = {
  active: false,
  phases: [],
  index: 0,
  remaining: 0,
};

// possible structure templates
function generateStructure(): Phase[] {
  const patterns: Phase[][] = [
    ["R", "B", "D"],
    ["R", "B", "R"],
    ["D", "B", "D"],
    ["D", "B", "R"],
  ];

  return patterns[Math.floor(Math.random() * patterns.length)];
}

// maybe start a new structure
function maybeStartStructure() {
  if (!structureState.active && Math.random() < 0.008) {
    structureState.active = true;

    structureState.phases = generateStructure();

    structureState.index = 0;

    structureState.remaining = Math.floor(5 + Math.random() * 6);
  }
}

// get current label for candle
function getStructureLabel(): Phase | "random" {
  // no active structure
  if (!structureState.active) {
    return "random";
  }

  const phase = structureState.phases[structureState.index];

  structureState.remaining--;

  // move to next phase
  if (structureState.remaining <= 0) {
    structureState.index++;

    // structure completed
    if (structureState.index >= structureState.phases.length) {
      structureState.active = false;

      return "random";
    }

    // next phase candle count
    structureState.remaining = Math.floor(4 + Math.random() * 6);
  }

  return phase;
}

// ---------------- MAIN ENGINE ----------------
export function generateNextCandle(
  prevClose: number,
  time: number,
  intervalSec: number
): Candle {
  const regime = getRegime();

  maybeStartStructure();

  let mu = regime.mu;
  let vol = regime.vol;

  // volatility randomness
  vol = vol * (1 + randn() * 0.15);

  vol = Math.max(0.002, Math.min(vol, 0.05));

  const open = prevClose;

  const Z = randn();

  const jump = newsJump();

  // GBM core
  const close =
    open * Math.exp((mu - 0.5 * vol * vol) + vol * Z + jump);

  // wick simulation
  const wick = 0.003 + Math.random() * 0.01;

  const high = Math.max(open, close) * (1 + wick);

  const low = Math.min(open, close) * (1 - wick);

  // STRUCTURE LABEL
  const label = getStructureLabel();

  return {
    time: time + intervalSec,
    open,
    high,
    low,
    close,
    label,
  };
}