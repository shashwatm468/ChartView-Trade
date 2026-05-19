type ButtonProps = {
  ButtonName: string;
  onClick: () => void;
  isActive: boolean;
};

export default function TabButtons({
  ButtonName,
  onClick,
  isActive,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
      px-14 py-2
      rounded-sm
      border-[1px]
      border-black

      ${
        isActive
          ? "bg-gradient-to-r from-[#2d2a30] to-[#231925] text-white border-[#1e0f27]"
          : " bg-[#2e2c30] text-zinc-300 hover:text-violet-300 hover:bg-zinc-700"
      }
      `}
    >
      {ButtonName}
    </button>
  );
}