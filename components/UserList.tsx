"use client";

import { useMemo, useState } from "react";
import type { IgUser } from "@/lib/parser";

type Props = {
  users: IgUser[];
  emptyLabel: string;
  hidden: Set<string>;
  onHiddenChange: (next: Set<string>) => void;
};

const BULK_HARD_CAP = 10;
const OPEN_DELAY_MS = 90;

export function UserList({ users, emptyLabel, hidden, onHiddenChange }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkNote, setBulkNote] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => !hidden.has(u.username))
      .filter((u) => (q ? u.username.toLowerCase().includes(q) : true));
  }, [users, query, hidden]);

  const visibleUsernames = useMemo(() => filtered.map((u) => u.username), [filtered]);
  const allVisibleSelected =
    visibleUsernames.length > 0 && visibleUsernames.every((u) => selected.has(u));

  function toggleOne(username: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const u of visibleUsernames) next.delete(u);
      } else {
        for (const u of visibleUsernames) next.add(u);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function markDone(username: string) {
    const next = new Set(hidden);
    next.add(username);
    onHiddenChange(next);
    setSelected((prev) => {
      if (!prev.has(username)) return prev;
      const nextSel = new Set(prev);
      nextSel.delete(username);
      return nextSel;
    });
  }

  async function openInTabs() {
    setBulkNote(null);

    // Si hay tildadas, procesa la selección. Si no, pagina por la lista visible.
    const fromSelection = selected.size > 0;
    const source = fromSelection
      ? filtered.filter((u) => selected.has(u.username))
      : filtered;

    if (source.length === 0) return;

    const toOpen = source.slice(0, BULK_HARD_CAP);
    const remaining = Math.max(0, source.length - BULK_HARD_CAP);

    setOpening(true);
    let blocked = 0;
    const opened: string[] = [];

    for (const u of toOpen) {
      const win = window.open(u.href, "_blank", "noopener,noreferrer");
      if (win) opened.push(u.username);
      else blocked++;
      await sleep(OPEN_DELAY_MS);
    }

    // Auto-ocultar los abiertos (el usuario ya los está procesando manualmente)
    if (opened.length > 0) {
      const nextHidden = new Set(hidden);
      for (const u of opened) nextHidden.add(u);
      onHiddenChange(nextHidden);
      setSelected((prev) => {
        const next = new Set(prev);
        for (const u of opened) next.delete(u);
        return next;
      });
    }

    if (blocked > 0) {
      setBulkNote(
        `⚠ El navegador bloqueó ${blocked} pestaña(s). Autorizá popups para este sitio y reintentá.`
      );
    } else if (remaining > 0) {
      const where = fromSelection ? "tildada(s)" : "visible(s)";
      setBulkNote(
        `✓ Abrí ${opened.length}. Quedan ${remaining} ${where} — click el botón otra vez para la próxima tanda.`
      );
    } else if (opened.length > 0) {
      setBulkNote(`✓ Abrí ${opened.length}. Ya procesaste todas.`);
    }
    setOpening(false);
  }

  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-8 text-center text-neutral-400">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar usuario..."
          className="min-w-0 flex-1 basis-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-pink-500 sm:basis-auto"
        />
        <span className="text-xs text-neutral-400 sm:text-sm">
          {filtered.length} de {users.length}
        </span>
        {hidden.size > 0 && (
          <button
            onClick={() => onHiddenChange(new Set())}
            className="ml-auto rounded-lg border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-800 sm:ml-0"
          >
            Restaurar ocultos ({hidden.size})
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-300">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={toggleAllVisible}
            className="h-5 w-5 accent-pink-500 sm:h-4 sm:w-4"
          />
          <span className="sm:hidden">
            {allVisibleSelected ? "Deseleccionar todos" : "Seleccionar todos"}
          </span>
          <span className="hidden sm:inline">
            {allVisibleSelected ? "Deseleccionar visibles" : "Seleccionar todos los visibles"}
          </span>
        </label>
        <div className="flex items-center gap-2 text-xs text-neutral-300">
          <span className="hidden text-neutral-500 sm:inline">·</span>
          <span>
            {selected.size} seleccionada{selected.size === 1 ? "" : "s"}
          </span>
          {selected.size > 0 && (
            <button
              onClick={clearSelection}
              className="text-neutral-400 underline hover:text-white"
            >
              limpiar
            </button>
          )}
        </div>
        <button
          onClick={openInTabs}
          disabled={(selected.size === 0 && filtered.length === 0) || opening}
          title={`Máx ${BULK_HARD_CAP} por tanda — abrir muchas pestañas puede trabar el navegador`}
          className="rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-2 text-xs font-medium text-white shadow shadow-pink-500/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:ml-auto sm:py-1.5"
        >
          {opening
            ? "Abriendo..."
            : selected.size > 0
            ? `Abrir ${Math.min(selected.size, BULK_HARD_CAP)} (de ${selected.size} tildadas)`
            : `Abrir próximas ${Math.min(filtered.length, BULK_HARD_CAP)} visibles`}
        </button>
        <p className="basis-full text-[11px] text-neutral-500 sm:basis-auto sm:text-right">
          Máx {BULK_HARD_CAP} por tanda
        </p>
      </div>

      {bulkNote && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            bulkNote.startsWith("✓")
              ? "border-emerald-900/60 bg-emerald-950/30 text-emerald-200"
              : "border-amber-900/50 bg-amber-950/30 text-amber-200"
          }`}
        >
          {bulkNote}
        </div>
      )}

      <ul className="divide-y divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-900/40">
        {filtered.map((u) => {
          const isSelected = selected.has(u.username);
          return (
            <li
              key={u.username}
              className={`flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 ${
                isSelected ? "bg-pink-500/5" : "hover:bg-neutral-900"
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleOne(u.username)}
                  className="h-5 w-5 shrink-0 accent-pink-500 sm:h-4 sm:w-4"
                  aria-label={`Seleccionar ${u.username}`}
                />
                <a
                  href={u.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 font-semibold text-white">
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-white group-hover:text-pink-400">
                      @{u.username}
                    </div>
                    {u.timestamp && (
                      <div className="truncate text-xs text-neutral-500">
                        Seguís desde {new Date(u.timestamp * 1000).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </a>
              </div>
              <div className="flex items-center gap-2 pl-8 sm:pl-0">
                <a
                  href={u.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-lg border border-neutral-700 px-3 py-1.5 text-center text-sm text-neutral-200 hover:border-pink-500 hover:text-pink-400 sm:flex-none"
                >
                  Ver perfil
                </a>
                <a
                  href={u.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => markDone(u.username)}
                  className="flex-1 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-1.5 text-center text-sm font-medium text-white hover:opacity-90 sm:flex-none"
                  title="Abre el perfil en Instagram para que dejes de seguirlo manualmente"
                >
                  Abrir y marcar
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
