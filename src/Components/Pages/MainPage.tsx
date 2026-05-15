import { useState } from "react";

import TabButtons from "../Here/TabButtons";
import LeftSection from "./LeftSection";

import Portfolio from "../Tabs/Portfolio";
import Strategies from "../Tabs/Strategies";
import Positions from "../Tabs/Positions";
import Execution from "../Tabs/Execution";
import BackTest from "../Tabs/BackTest";

import type { Candle } from "../../Data/gbmEngine";

const tabNames = [
  "Portfolio",
  "Strategies",
  "Positions",
  "Execution",
  "Backtest",
] as const;

type TabType = (typeof tabNames)[number];

type Props = {
  data: Candle[];
};

export default function MainPage({ data }: Props) {
  const [tab, setTab] = useState<TabType>("Portfolio");

  const tabContent: Record<TabType, React.ReactNode> = {
    Portfolio: <Portfolio data={data} />,
    Strategies: <Strategies />,
    Positions: <Positions />,
    Execution: <Execution />,
    Backtest: <BackTest />,
  };

  return (
    <div className="bg-zinc-800 h-screen flex">
      <LeftSection />

      <div className="flex-1">
        <div className="border-2 border-black flex">
          {tabNames.map((item) => {
            return (
              <TabButtons
                key={item}
                ButtonName={item}
                onClick={() => setTab(item)}
              />
            );
          })}
        </div>

        <div>
          {tabContent[tab]}
        </div>
      </div>
    </div>
  );
}