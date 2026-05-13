type Props = {
  label: string;
  value: number;
  highlight?: boolean;
  warn?: boolean;
};

export function Stat({ label, value, highlight, warn }: Props) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        warn
          ? "border-amber-700/60 bg-amber-900/20"
          : highlight
          ? "border-pink-500/40 bg-pink-500/10"
          : "border-neutral-800 bg-neutral-900/40"
      }`}
    >
      <div className="text-2xl font-bold text-white">{value.toLocaleString()}</div>
      <div className="text-xs text-neutral-400">{label}</div>
    </div>
  );
}
