"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Uploader } from "@/components/Uploader";
import { UserList } from "@/components/UserList";
import { Stat } from "@/components/Stat";
import { TabButton } from "@/components/TabButton";
import { SiteHeader } from "@/components/SiteHeader";
import {
  computeFansYouDontFollow,
  computeNotFollowingBack,
  parseFiles,
  type ParsedExport,
} from "@/lib/parser";
import { clearState, loadState, saveState, type Tab } from "@/lib/storage";

type Props = {
  howToDownload: React.ReactNode;
  openSourceBanner: React.ReactNode;
};

export function DataApp({ howToDownload, openSourceBanner }: Props) {
  const [parsed, setParsed] = useState<ParsedExport | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<Tab>("not_following_back");
  const [wantsUpload, setWantsUpload] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastSavedAtRef = useRef<number | null>(null);

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

  const headerActions = parsed ? (
    showUpload ? (
      <button
        type="button"
        onClick={() => setWantsUpload(false)}
        className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-pink-500 hover:text-pink-400"
      >
        ← Volver a la lista
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setWantsUpload(true)}
        className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-pink-500 hover:text-pink-400"
        title="Mantiene tu progreso guardado"
      >
        Subir otros archivos
      </button>
    )
  ) : null;

  return (
    <>
      <SiteHeader actions={headerActions} />

      {showUpload && (
        <section className="space-y-6">
          {howToDownload}

          <Uploader onFiles={handleFiles} loading={loading} />

          {openSourceBanner}

          {error && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {parsed && (
            <p className="text-xs text-neutral-500">
              Si subís nuevos archivos se van a reemplazar las listas, pero las cuentas que
              marcaste como ocultas se mantienen. Usá &quot;Borrar todo guardado&quot; para
              empezar de cero.
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
                  ⚠ No encontré ningún <span className="font-mono">followers_1.json</span>.
                  Subí también ese archivo.
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

          <div
            role="tablist"
            className="-mx-4 flex gap-2 overflow-x-auto border-b border-neutral-800 px-4 sm:mx-0 sm:px-0"
          >
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
              type="button"
              onClick={handleClearAll}
              className="text-xs text-neutral-500 underline hover:text-red-400"
            >
              Borrar todo guardado
            </button>
          </div>
        </section>
      )}
    </>
  );
}
