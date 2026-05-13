import { DONATION_URL, INSTAGRAM_URL } from "@/lib/constants";
import { HeartIcon, InstagramMark } from "@/components/icons";

export function Footer() {
  return (
    <footer className="mt-12 flex flex-col items-center gap-3 border-t border-neutral-800 pt-8 pb-2">
      <p className="text-sm text-neutral-400">¿Te sirvió la app?</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-600 to-orange-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-pink-500/25 transition-opacity hover:opacity-90"
        >
          <InstagramMark className="h-4 w-4" />
          Seguime en Instagram
        </a>
        {DONATION_URL && (
          <a
            href={DONATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900 px-5 py-2 text-sm font-medium text-neutral-100 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
          >
            <HeartIcon className="h-4 w-4" />
            Invitame un café
          </a>
        )}
      </div>
      {DONATION_URL && (
        <p className="text-xs text-neutral-500">
          Se aceptan tarjetas de toda LatAm vía MercadoPago
        </p>
      )}
    </footer>
  );
}
