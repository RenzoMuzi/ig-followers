import { GITHUB_URL } from "@/lib/constants";
import { GitHubMark } from "@/components/icons";

export function OpenSourceBanner() {
  return (
    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4 text-sm text-neutral-300 transition-colors hover:border-emerald-700/70 hover:bg-emerald-950/30"
    >
      <GitHubMark className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
      <span>
        <span className="font-medium text-white">100% open source.</span> Revisá el código en
        GitHub para comprobar que la app no toca, guarda ni envía tus datos a ningún lado —
        todo corre en tu navegador.{" "}
        <span className="text-emerald-300 underline">github.com/RenzoMuzi/ig-followers →</span>
      </span>
    </a>
  );
}
