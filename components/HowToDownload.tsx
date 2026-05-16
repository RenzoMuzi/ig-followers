export function HowToDownload() {
  return (
    <details className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 text-sm text-neutral-300">
      <summary className="cursor-pointer font-medium text-white">
        ¿Cómo descargo mis datos de Instagram?
      </summary>

      <div className="mt-3 rounded-lg border border-pink-500/30 bg-pink-500/5 p-3">
        <p className="text-xs uppercase tracking-wide text-pink-400">Atajo</p>
        <p className="mt-1">Andá directo al Centro de cuentas con tu cuenta logueada:</p>
        <a
          href="https://accountscenter.instagram.com/info_and_permissions/dyi/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block break-all rounded-md bg-neutral-900/60 px-2.5 py-1.5 font-mono text-xs text-pink-400 underline hover:text-pink-300 sm:text-sm"
        >
          accountscenter.instagram.com/info_and_permissions/dyi/
        </a>
        <p className="mt-2 text-xs text-neutral-400">Y saltá al paso 2 de abajo.</p>
      </div>

      <p className="mt-4 text-xs uppercase tracking-wide text-neutral-500">
        O paso a paso desde Instagram:
      </p>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        <li>
          Instagram → Configuración → Centro de cuentas → Tu información y permisos →
          Descargar tu información.
        </li>
        <li>
          Elegí solo tu cuenta → en &quot;Tipo de información&quot; tildá{" "}
          <span className="font-semibold">Seguidores y seguidos</span>.
        </li>
        <li>
          Formato: <span className="font-mono text-pink-400">JSON</span> · Rango:{" "}
          <span className="font-semibold">Todo el tiempo</span>.
        </li>
        <li>Solicitá la descarga. Te llega por mail en unos minutos.</li>
        <li>
          Descargá el ZIP y arrastralo directamente acá abajo. Todo se procesa local en
          tu navegador y solo se leen los JSON de seguidores/seguidos que están en:
          <code className="mt-1 block break-all rounded-md bg-neutral-900/60 px-2.5 py-1.5 font-mono text-xs text-pink-400">
            connections/followers_and_following/
          </code>
        </li>
        <li>
          También podés extraer el ZIP y subir{" "}
          <span className="font-mono text-pink-400">following.json</span> y{" "}
          <span className="font-mono text-pink-400">followers_1.json</span> sueltos si
          preferís.
        </li>
      </ol>
    </details>
  );
}
