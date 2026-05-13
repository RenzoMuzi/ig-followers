import { GITHUB_URL } from "@/lib/constants";
import { GitHubMark } from "@/components/icons";

type Props = {
  actions?: React.ReactNode;
};

export function SiteHeader({ actions }: Props) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <div>
        <h1 className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-3xl font-bold text-transparent">
          IG Non-Followers
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Descubrí quién no te sigue de vuelta usando la exportación de datos de Instagram.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        {actions}
        <GitHubButton />
      </div>
    </header>
  );
}

function GitHubButton() {
  return (
    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 transition-colors hover:border-pink-500 hover:text-pink-400"
      title="Mirá el código — todo open source"
    >
      <GitHubMark className="h-4 w-4" />
      <span>Ver código</span>
    </a>
  );
}
