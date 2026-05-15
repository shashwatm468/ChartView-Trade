import Trial from "../ChartComponents/Trial5";

import type { Candle } from "../../Data/gbmEngine";
import WishlistButton from "../Here/WishlistButton";

type Props = {
  data: Candle[];
};

export default function Portfolio({ data }: Props) {
  return (
    <div className="bg-slate-500 h-screen w-full flex justify-evenly items-center">
      <Trial data={data} />
      <div className="flex bg-slate-950 px-3 py-1 rounded-sm gap-2">
        <WishlistButton/>
        <WishlistButton/>
      </div>
    </div>
  );
}