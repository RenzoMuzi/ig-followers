"use client";

import { useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
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
  const { t, i18n } = useTranslation();
  const [parsed, setParsed] = useState<ParsedExport | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<Tab>("not_following_back");
  const [wantsUpload, setWantsUpload] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  // Hidratación desde localStorage: tiene que correr en un effect (no en el
  // initializer del useState) para no provocar mismatch de hidratación con el SSR.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = loadState();
    if (stored) {
      setParsed(stored.parsed);
      setHidden(new Set(stored.hidden));
      setTab(stored.tab);
      setLastSavedAt(stored.savedAt);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!parsed) return;
    const ok = saveState({ parsed, hidden: Array.from(hidden), tab });
    if (!ok) {
      setSaveError(t("errors.saveStorage"));
    } else {
      setSaveError(null);
      setLastSavedAt(Date.now());
    }
  }, [hydrated, parsed, hidden, tab, t]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleFiles(files: File[]) {
    setLoading(true);
    setError(null);
    try {
      const result = await parseFiles(files);
      if (
        result.following.length === 0 &&
        result.followers.length === 0 &&
        result.pending.length === 0
      ) {
        setError(t("errors.noValidData"));
      } else {
        // Si ya había datos previos y el nuevo upload solo trae algunas listas,
        // hacemos merge para no perder las que ya tenía cargadas (caso típico:
        // subir solo pending_follow_requests.json sin re-subir los otros dos).
        setParsed((prev) => {
          if (!prev) return result;
          return {
            following: result.following.length > 0 ? result.following : prev.following,
            followers: result.followers.length > 0 ? result.followers : prev.followers,
            pending: result.pending.length > 0 ? result.pending : prev.pending,
            warnings: result.warnings,
          };
        });
        setWantsUpload(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errors.unknown"));
    } finally {
      setLoading(false);
    }
  }

  function handleClearAll() {
    const ok = confirm(t("lists.confirmClear"));
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
  const pendingSent = useMemo(
    () =>
      parsed
        ? [...parsed.pending].sort((a, b) => a.username.localeCompare(b.username))
        : [],
    [parsed]
  );

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
        {t("header.backToList")}
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setWantsUpload(true)}
        className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-pink-500 hover:text-pink-400"
        title={t("header.uploadOthersTitle")}
      >
        {t("header.uploadOthers")}
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
            <p className="text-xs text-neutral-500">{t("lists.uploadNote")}</p>
          )}
        </section>
      )}

      {parsed && !showUpload && (
        <section className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat
              label={t("stats.youFollow")}
              value={parsed.following.length}
              warn={missingFollowing}
            />
            <Stat
              label={t("stats.yourFollowers")}
              value={parsed.followers.length}
              warn={missingFollowers}
            />
            <Stat
              label={t("stats.notFollowingBack")}
              value={notFollowingBack.length}
              highlight
            />
            <Stat label={t("stats.pendingSent")} value={pendingSent.length} />
            <Stat label={t("stats.fans")} value={fans.length} />
          </div>

          {(missingFollowing || missingFollowers || parsed.warnings.length > 0) && (
            <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 p-4 text-sm text-amber-200">
              {missingFollowing && (
                <p>
                  <Trans
                    i18nKey="warnings.missingFollowing"
                    components={[<span key="0" className="font-mono" />]}
                  />
                </p>
              )}
              {missingFollowers && (
                <p>
                  <Trans
                    i18nKey="warnings.missingFollowers"
                    components={[<span key="0" className="font-mono" />]}
                  />
                </p>
              )}
              {parsed.warnings.map((w, i) => (
                <p key={`${w.key}-${i}`}>⚠ {t(w.key, w.params)}</p>
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
              <span className="sm:hidden">
                {t("tabs.notFollowingBackShort", { count: notFollowingBack.length })}
              </span>
              <span className="hidden sm:inline">
                {t("tabs.notFollowingBackLong", { count: notFollowingBack.length })}
              </span>
            </TabButton>
            <TabButton active={tab === "pending"} onClick={() => setTab("pending")}>
              <span className="sm:hidden">
                {t("tabs.pendingShort", { count: pendingSent.length })}
              </span>
              <span className="hidden sm:inline">
                {t("tabs.pendingLong", { count: pendingSent.length })}
              </span>
            </TabButton>
            <TabButton active={tab === "fans"} onClick={() => setTab("fans")}>
              <span className="sm:hidden">
                {t("tabs.fansShort", { count: fans.length })}
              </span>
              <span className="hidden sm:inline">
                {t("tabs.fansLong", { count: fans.length })}
              </span>
            </TabButton>
          </div>

          {tab === "not_following_back" && (
            <UserList
              users={notFollowingBack}
              hidden={hidden}
              onHiddenChange={setHidden}
              emptyLabel={
                missingFollowing
                  ? t("lists.emptyMissingFollowing")
                  : t("lists.emptyAllFollowBack")
              }
            />
          )}
          {tab === "fans" && (
            <UserList
              users={fans}
              hidden={hidden}
              onHiddenChange={setHidden}
              emptyLabel={
                missingFollowers
                  ? t("lists.emptyMissingFollowers")
                  : t("lists.emptyAllFollowed")
              }
            />
          )}
          {tab === "pending" && (
            <UserList
              users={pendingSent}
              hidden={hidden}
              onHiddenChange={setHidden}
              emptyLabel={t("lists.emptyNoPending")}
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <p className="text-xs text-neutral-500">
              {lastSavedAt
                ? t("lists.savedAutoAt", {
                    date: new Date(lastSavedAt).toLocaleString(i18n.resolvedLanguage),
                  })
                : t("lists.savedAuto")}
            </p>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-neutral-500 underline hover:text-red-400"
            >
              {t("lists.clearAll")}
            </button>
          </div>
        </section>
      )}
    </>
  );
}
