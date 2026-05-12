"use client";

import { useMemo, useState } from "react";
import { Uploader } from "@/components/Uploader";
import { UserList } from "@/components/UserList";
import {
  computeFansYouDontFollow,
  computeNotFollowingBack,
  parseFiles,
  type ParsedExport,
} from "@/lib/parser";

type Tab = "not_following_back" | "fans";

export default function Home() {
  const [parsed, setParsed] = useState<ParsedExport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("not_following_back");

  async function handleFiles(files: File[]) {
    setLoading(true);
    setError(null);
    try {
      const result = await parseFiles(files);
      if (result.following.length === 0 && result.followers.length === 0) {
        setError(
          "No encontré datos válidos. Asegurate de subir el ZIP completo o los archivos following.json y followers_1.json."
        );
        setParsed(null);
      } else {
        setParsed(result);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido al leer los archivos");
      setParsed(null);
    } finally {
      setLoading(false);
    }
  }

  const notFollowingBack = useMemo(
    () => (parsed ? computeNotFollowingBack(parsed) : []),
    [parsed]
  );
  const fans = useMemo(() => (parsed ? computeFansYouDontFollow(parsed) : []), [parsed]);

  const missingFollowing = parsed?.following.length === 0;
  const missingFollowers = parsed?.followers.length === 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-3xl font-bold text-transparent">
          IG Non-Followers
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Descubrí quién no te sigue de vuelta usando la exportación de datos de Instagram.
        </p>
      </header>

      {!parsed && (
        <section className="space-y-6">
          <details className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 text-sm text-neutral-300">
            <summary className="cursor-pointer font-medium text-white">
              ¿Cómo descargo mis datos de Instagram?
            </summary>
            <ol className="mt-3 list-decimal space-y-1 pl-5">
              <li>Abrí Instagram → Configuración.</li>
              <li>Centro de cuentas → Tu información y permisos → Descargar tu información.</li>
              <li>Elegí solo tu cuenta → en "Tipo de información" tildá Seguidores y seguidos.</li>
              <li>
                Formato: <span className="font-mono text-pink-400">JSON</span> · Rango:{" "}
                <span className="font-semibold">Todo el tiempo</span>.
              </li>
              <li>Solicitá la descarga. Te llega por mail en unos minutos.</li>
              <li>Descargá el ZIP y subílo acá abajo. Todo se procesa local.</li>
            </ol>
          </details>

          <Uploader onFiles={handleFiles} loading={loading} />

          {error && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
              {error}
            </div>
          )}
        </section>
      )}

      {parsed && (
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
                  también ese archivo (o el ZIP completo) para ver quién no te sigue de vuelta.
                </p>
              )}
              {missingFollowers && (
                <p>
                  ⚠ No encontré ningún <span className="font-mono">followers_1.json</span>. Subí
                  también ese archivo (o el ZIP completo).
                </p>
              )}
              {parsed.warnings.map((w) => (
                <p key={w}>⚠ {w}</p>
              ))}
            </div>
          )}

          <div className="flex gap-2 border-b border-neutral-800">
            <TabButton
              active={tab === "not_following_back"}
              onClick={() => setTab("not_following_back")}
            >
              Seguís y no te devuelven ({notFollowingBack.length})
            </TabButton>
            <TabButton active={tab === "fans"} onClick={() => setTab("fans")}>
              Te siguen y vos no ({fans.length})
            </TabButton>
          </div>

          {tab === "not_following_back" ? (
            <UserList
              users={notFollowingBack}
              emptyLabel={
                missingFollowing
                  ? "Falta following.json para calcular esta lista."
                  : "¡Todos los que seguís te siguen de vuelta!"
              }
            />
          ) : (
            <UserList
              users={fans}
              emptyLabel={
                missingFollowers
                  ? "Falta followers_1.json para calcular esta lista."
                  : "Seguís a todos los que te siguen."
              }
            />
          )}

          <button
            onClick={() => {
              setParsed(null);
              setError(null);
            }}
            className="text-sm text-neutral-400 underline hover:text-white"
          >
            Subir otros archivos
          </button>
        </section>
      )}
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
