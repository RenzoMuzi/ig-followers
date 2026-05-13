"use client";

type Props = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

export function TabButton({ active, onClick, children }: Props) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-pink-500 text-white"
          : "border-transparent text-neutral-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
