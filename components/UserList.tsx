"use client";

import { useMemo, useState } from "react";
import type { IgUser } from "@/lib/parser";

type Props = {
  users: IgUser[];
  emptyLabel: string;
};

export function UserList({ users, emptyLabel }: Props) {
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => !hidden.has(u.username))
      .filter((u) => (q ? u.username.toLowerCase().includes(q) : true));
  }, [users, query, hidden]);

  function markDone(username: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      next.add(username);
      return next;
    });
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

      <ul className="divide-y divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-900/40">
        {filtered.map((u) => (
          <li
            key={u.username}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-900"
          >
            <a
              href={u.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 font-semibold text-white">
                {u.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-white group-hover:text-pink-400">
                  @{u.username}
                </div>
                {u.timestamp && (
                  <div className="text-xs text-neutral-500">
                    Seguís desde {new Date(u.timestamp * 1000).toLocaleDateString()}
                  </div>
                )}
              </div>
            </a>
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
                Abrir IG y dejar de seguir
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
