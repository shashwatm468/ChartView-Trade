type ButtonProps = {
  ButtonName: string;
  onClick: () => void;
};

export default function TabButtons({
  ButtonName,
  onClick,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
      bg-slate-800
      text-white
      px-6 py-2
      rounded-tl-xl
      rounded-tr-md
      border-2
      border-gray-700
      relative
      -mr-3
      hover:text-violet-300
      hover:z-10
      hover:bg-slate-700
      active:bg-emerald-700
      transition-all
      duration-200
      "
    >
      {ButtonName}
    </button>
  );
}