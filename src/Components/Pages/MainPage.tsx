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
    <div className="bg-zinc-900 h-screen flex">
      {/* <LeftSection /> */}

      <div className="flex-1">

        {/* <div className="flex pl-1 pr-2 py-1 justify-between items-center">
          <div className="flex">
            {tabNames.map((item) => {
              return (
                <TabButtons
                  key={item}
                  ButtonName={item}
                  isActive={tab === item}
                  onClick={() => setTab(item)}
                />
              );
            })}
          </div>
          <div className="flex text-white">
            Profile
          </div>
        </div> */}


        <div>
          {tabContent[tab]}
        </div>

      </div>
    </div>
  );
}