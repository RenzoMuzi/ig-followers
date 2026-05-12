"use client";

import { useMemo, useState } from "react";
import type { IgUser } from "@/lib/parser";

type Props = {
  users: IgUser[];
  emptyLabel: string;
};

const BULK_CONFIRM_THRESHOLD = 10;
const BULK_HARD_CAP = 50;
const OPEN_DELAY_MS = 90;

export function UserList({ users, emptyLabel }: Props) {
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState<Set<string>>(new Set());
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
    setHidden((prev) => {
      const next = new Set(prev);
      next.add(username);
      return next;
    });
    setSelected((prev) => {
      if (!prev.has(username)) return prev;
      const next = new Set(prev);
      next.delete(username);
      return next;
    });
  }

  async function openSelectedInTabs() {
    setBulkNote(null);
    const targets = filtered.filter((u) => selected.has(u.username));
    if (targets.length === 0) return;

    let toOpen = targets;
    if (targets.length > BULK_HARD_CAP) {
      const ok = confirm(
        `Tenés ${targets.length} seleccionadas pero el tope por tanda es ${BULK_HARD_CAP}. ` +
          `¿Abro las primeras ${BULK_HARD_CAP} ahora?`
      );
      if (!ok) return;
      toOpen = targets.slice(0, BULK_HARD_CAP);
    } else if (targets.length > BULK_CONFIRM_THRESHOLD) {
      const ok = confirm(
        `Voy a abrir ${targets.length} pestañas. ` +
          "Si el navegador bloquea popups, autorizá popups para localhost y reintentá. ¿Sigo?"
      );
      if (!ok) return;
    }

    setOpening(true);
    let blocked = 0;
    const opened: string[] = [];

    for (const u of toOpen) {
      const win = window.open(u.href, "_blank", "noopener,noreferrer");
      if (win) {
        opened.push(u.username);
      } else {
        blocked++;
      }
      await sleep(OPEN_DELAY_MS);
    }

    // Auto-ocultar los que sí abrieron (el usuario ya los está procesando manualmente)
    if (opened.length > 0) {
      setHidden((prev) => {
        const next = new Set(prev);
        for (const u of opened) next.add(u);
        return next;
      });
      setSelected((prev) => {
        const next = new Set(prev);
        for (const u of opened) next.delete(u);
        return next;
      });
    }

    if (blocked > 0) {
      setBulkNote(
        `El navegador bloqueó ${blocked} pestaña(s). Autorizá popups para este sitio y reintentá con los restantes.`
      );
    } else {
      setBulkNote(null);
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
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar usuario..."
          className="flex-1 min-w-[200px] rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-pink-500"
        />
        <span className="text-sm text-neutral-400">
          {filtered.length} de {users.length}
        </span>
        {hidden.size > 0 && (
          <button
            onClick={() => setHidden(new Set())}
            className="rounded-lg border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
          >
            Restaurar ocultos ({hidden.size})
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-300">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={toggleAllVisible}
            className="h-4 w-4 accent-pink-500"
          />
          {allVisibleSelected ? "Deseleccionar visibles" : "Seleccionar todos los visibles"}
        </label>
        <span className="text-xs text-neutral-500">·</span>
        <span className="text-xs text-neutral-300">
          {selected.size} seleccionada{selected.size === 1 ? "" : "s"}
        </span>
        {selected.size > 0 && (
          <button
            onClick={clearSelection}
            className="text-xs text-neutral-400 underline hover:text-white"
          >
            limpiar
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={openSelectedInTabs}
            disabled={selected.size === 0 || opening}
            className="rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow shadow-pink-500/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {opening ? "Abriendo..." : `Abrir ${selected.size || ""} en pestañas`}
          </button>
        </div>
      </div>

      {bulkNote && (
        <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 p-3 text-sm text-amber-200">
          {bulkNote}
        </div>
      )}

      <ul className="divide-y divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-900/40">
        {filtered.map((u) => {
          const isSelected = selected.has(u.username);
          return (
            <li
              key={u.username}
              className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${
                isSelected ? "bg-pink-500/5" : "hover:bg-neutral-900"
              }`}
            >
              <div className="flex flex-1 min-w-0 items-center gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleOne(u.username)}
                  className="h-4 w-4 shrink-0 accent-pink-500"
                  aria-label={`Seleccionar ${u.username}`}
                />
                <a
                  href={u.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-1 min-w-0 items-center gap-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 font-semibold text-white">
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-white group-hover:text-pink-400">
                      @{u.username}
                    </div>
                    {u.timestamp && (
                      <div className="text-xs text-neutral-500">
                        Seguís desde {new Date(u.timestamp * 1000).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </a>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={u.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-pink-500 hover:text-pink-400"
                >
                  Ver perfil
                </a>
                <a
                  href={u.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => markDone(u.username)}
                  className="rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                  title="Abre el perfil en Instagram para que dejes de seguirlo manualmente"
                >
                  Abrir y marcar hecho
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
