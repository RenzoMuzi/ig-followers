"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Uploader } from "@/components/Uploader";
import { UserList } from "@/components/UserList";
import {
  computeFansYouDontFollow,
  computeNotFollowingBack,
  parseFiles,
  type ParsedExport,
} from "@/lib/parser";
import { clearState, loadState, saveState, type Tab } from "@/lib/storage";

const GITHUB_URL = "https://github.com/RenzoMuzi/ig-followers";
const INSTAGRAM_URL = "https://www.instagram.com/renzomuzi/";

export default function Home() {
  const [parsed, setParsed] = useState<ParsedExport | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<Tab>("not_following_back");
  const [wantsUpload, setWantsUpload] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastSavedAtRef = useRef<number | null>(null);

  // Hidratar desde localStorage al montar
  useEffect(() => {
    const stored = loadState();
    if (stored) {
      setParsed(stored.parsed);
      setHidden(new Set(stored.hidden));
      setTab(stored.tab);
      lastSavedAtRef.current = stored.savedAt;
    }
    setHydrated(true);
  }, []);

  // Persistir cambios
  useEffect(() => {
    if (!hydrated) return;
    if (!parsed) return;
    const ok = saveState({ parsed, hidden: Array.from(hidden), tab });
    if (!ok) {
      setSaveError(
        "No pude guardar el estado en este navegador (puede ser por cuota de almacenamiento)."
      );
    } else {
      setSaveError(null);
      lastSavedAtRef.current = Date.now();
    }
  }, [hydrated, parsed, hidden, tab]);

  async function handleFiles(files: File[]) {
    setLoading(true);
    setError(null);
    try {
      const result = await parseFiles(files);
      if (result.following.length === 0 && result.followers.length === 0) {
        setError(
          "No encontré datos válidos. Asegurate de subir following.json y followers_1.json."
        );
      } else {
        setParsed(result);
        setWantsUpload(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido al leer los archivos");
    } finally {
      setLoading(false);
    }
  }

  function handleClearAll() {
    const ok = confirm(
      "Esto borra los datos guardados (listas y marcas de ocultos). ¿Confirmás?"
    );
    if (!ok) return;
    clearState();
    setParsed(null);
    setHidden(new Set());
    setTab("not_following_back");
    setWantsUpload(false);
    setError(null);
    setSaveError(null);
  }

  const notFollowingBack = useMemo(
    () => (parsed ? computeNotFollowingBack(parsed) : []),
    [parsed]
  );
  const fans = useMemo(() => (parsed ? computeFansYouDontFollow(parsed) : []), [parsed]);

  const missingFollowing = parsed?.following.length === 0;
  const missingFollowers = parsed?.followers.length === 0;

  const showUpload = wantsUpload || !parsed;

  return (
    <main className="mx-auto max-w-3xl px-3 py-6 sm:px-4 sm:py-10">
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
          {parsed &&
            (showUpload ? (
              <button
                onClick={() => setWantsUpload(false)}
                className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-pink-500 hover:text-pink-400"
              >
                ← Volver a la lista
              </button>
            ) : (
              <button
                onClick={() => setWantsUpload(true)}
                className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-pink-500 hover:text-pink-400"
                title="Mantiene tu progreso guardado"
              >
                Subir otros archivos
              </button>
            ))}
          <GitHubButton />
        </div>
      </header>

      {showUpload && (
        <section className="space-y-6">
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
                Elegí solo tu cuenta → en "Tipo de información" tildá{" "}
                <span className="font-semibold">Seguidores y seguidos</span>.
              </li>
              <li>
                Formato: <span className="font-mono text-pink-400">JSON</span> · Rango:{" "}
                <span className="font-semibold">Todo el tiempo</span>.
              </li>
              <li>Solicitá la descarga. Te llega por mail en unos minutos.</li>
              <li>
                Descargá el ZIP y <span className="font-semibold">extraelo</span>. Adentro, los
                archivos están en:
                <code className="mt-1 block break-all rounded-md bg-neutral-900/60 px-2.5 py-1.5 font-mono text-xs text-pink-400">
                  connections/followers_and_following/
                </code>
              </li>
              <li>
                Arrastrá <span className="font-mono text-pink-400">following.json</span> y{" "}
                <span className="font-mono text-pink-400">followers_1.json</span> acá abajo. Todo se
                procesa local.
              </li>
            </ol>
          </details>

          <Uploader onFiles={handleFiles} loading={loading} />

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

          {error && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {parsed && (
            <p className="text-xs text-neutral-500">
              Si subís nuevos archivos se van a reemplazar las listas, pero las cuentas que marcaste
              como ocultas se mantienen. Usá "Borrar todo guardado" para empezar de cero.
            </p>
          )}
        </section>
      )}

      {parsed && !showUpload && (
        <section className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Seguís" value={parsed.following.length} warn={missingFollowing} />
            <Stat label="Te siguen" value={parsed.followers.length} warn={missingFollowers} />
            <Stat
              label="No te devuelven el follow"
              value={notFollowingBack.length}
              highlight
            />
            <Stat label="Vos no los seguís" value={fans.length} />
          </div>

          {(missingFollowing || missingFollowers || parsed.warnings.length > 0) && (
            <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 p-4 text-sm text-amber-200">
              {missingFollowing && (
                <p>
                  ⚠ No encontré ningún <span className="font-mono">following.json</span>. Subí
                  también ese archivo para ver quién no te sigue de vuelta.
                </p>
              )}
              {missingFollowers && (
                <p>
                  ⚠ No encontré ningún <span className="font-mono">followers_1.json</span>. Subí
                  también ese archivo.
                </p>
              )}
              {parsed.warnings.map((w) => (
                <p key={w}>⚠ {w}</p>
              ))}
            </div>
          )}

          {saveError && (
            <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 p-4 text-sm text-amber-200">
              ⚠ {saveError}
            </div>
          )}

          <div className="-mx-4 flex gap-2 overflow-x-auto border-b border-neutral-800 px-4 sm:mx-0 sm:px-0">
            <TabButton
              active={tab === "not_following_back"}
              onClick={() => setTab("not_following_back")}
            >
              <span className="sm:hidden">No te devuelven ({notFollowingBack.length})</span>
              <span className="hidden sm:inline">
                Seguís y no te devuelven ({notFollowingBack.length})
              </span>
            </TabButton>
            <TabButton active={tab === "fans"} onClick={() => setTab("fans")}>
              <span className="sm:hidden">No los seguís ({fans.length})</span>
              <span className="hidden sm:inline">Te siguen y vos no ({fans.length})</span>
            </TabButton>
          </div>

          {tab === "not_following_back" ? (
            <UserList
              users={notFollowingBack}
              hidden={hidden}
              onHiddenChange={setHidden}
              emptyLabel={
                missingFollowing
                  ? "Falta following.json para calcular esta lista."
                  : "¡Todos los que seguís te siguen de vuelta!"
              }
            />
          ) : (
            <UserList
              users={fans}
              hidden={hidden}
              onHiddenChange={setHidden}
              emptyLabel={
                missingFollowers
                  ? "Falta followers_1.json para calcular esta lista."
                  : "Seguís a todos los que te siguen."
              }
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <p className="text-xs text-neutral-500">
              {lastSavedAtRef.current
                ? `Guardado automáticamente · última actualización ${new Date(
                    lastSavedAtRef.current
                  ).toLocaleString()}`
                : "Guardado automáticamente en este navegador"}
            </p>
            <button
              onClick={handleClearAll}
              className="text-xs text-neutral-500 underline hover:text-red-400"
            >
              Borrar todo guardado
            </button>
          </div>
        </section>
      )}

      <footer className="mt-12 flex flex-col items-center gap-3 border-t border-neutral-800 pt-8 pb-2">
        <p className="text-sm text-neutral-400">¿Te sirvió la app?</p>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-600 to-orange-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-pink-500/25 transition-opacity hover:opacity-90"
        >
          <InstagramMark className="h-4 w-4" />
          Seguime en Instagram
        </a>
      </footer>
    </main>
  );
}

function Stat({
  label,
  value,
  highlight,
  warn,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  warn?: boolean;
}) {
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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
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

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-1.97c-3.2.69-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.25 5.68.41.35.78 1.05.78 2.12v3.14c0 .31.21.67.79.56C20.22 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z"
      />
    </svg>
  );
}

function InstagramMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}
