import type { UTCTimestamp } from "lightweight-charts";

export type Candle = {
    time: UTCTimestamp;
    open: number;
    high: number;
    low: number;
    close: number;
};

export type LabeledCandle = Candle & {
    label: "R" | "B" | "D" | "Q";
    group: "RBR" | "RBD" | "DBR" | "DBD" | "RANDOM";
};

// -------------------- helpers --------------------

function rand(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number) {
    return Math.floor(rand(min, max + 1));
}

function createCandle(
    price: number,
    type: "R" | "D" | "B" | "Q",
    time: UTCTimestamp
): Candle {
    const open = price;
    let close = open;

    if (type === "R") {
        close = open + rand(0.5, 3);
    } else if (type === "D") {
        close = open - rand(0.5, 3);
    } else {
        // B or Q → sideways/random
        close = open + rand(-2, 2);
    }

    const high = Math.max(open, close) + rand(0, 1.5);
    const low = Math.min(open, close) - rand(0, 1.5);

    return { time, open, high, low, close };
}

// -------------------- core engine --------------------

export function generateChunkedCandles(
    total: number,
    startPrice: number
): LabeledCandle[] {
    const result: LabeledCandle[] = [];

    let price = startPrice;
    let time = Math.floor(Date.now() / 1000) as UTCTimestamp;

    const patterns: ("RBR" | "RBD" | "DBR" | "DBD")[] = [
        "RBR",
        "RBD",
        "DBR",
        "DBD",
    ];

    while (result.length < total) {
        const usePattern = Math.random() > 0.4; // ~60% pattern, 40% random

        // -------------------- PATTERN CHUNK --------------------
        if (usePattern) {
            const pattern = patterns[randInt(0, patterns.length - 1)];

            const segments = pattern.split("") as ("R" | "B" | "D")[];

            const lengths = [
                randInt(3, 7),
                randInt(4, 10),
                randInt(3, 7),
            ];

            for (let s = 0; s < 3; s++) {
                const type = segments[s];
                const len = lengths[s];

                for (let i = 0; i < len && result.length < total; i++) {
                    const c = createCandle(price, type, time);

                    result.push({
                        ...c,
                        label: type,
                        group: pattern,
                    });

                    price = c.close;
                    time = (time + 60) as UTCTimestamp;
                }
            }
        }

        // -------------------- RANDOM CHUNK --------------------
        else {
            const len = randInt(5, 15);

            for (let i = 0; i < len && result.length < total; i++) {
                // random behavior
                const r = Math.random();

                let type: "R" | "D" | "B";
                if (r < 0.33) type = "R";
                else if (r < 0.66) type = "D";
                else type = "B";

                const c = createCandle(price, "Q", time);

                result.push({
                    ...c,
                    label: "Q",
                    group: "RANDOM",
                });

                price = c.close;
                time = (time + 60) as UTCTimestamp;
            }
        }
    }

    return result;
}