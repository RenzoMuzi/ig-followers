import type { ParsedExport } from "@/lib/parser";

export type Tab = "not_following_back" | "fans";

const STORAGE_KEY = "ig-non-followers:state:v1";

export type StoredState = {
  v: 1;
  parsed: ParsedExport;
  hidden: string[];
  tab: Tab;
  savedAt: number;
};

function isValidStoredState(data: unknown): data is StoredState {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (d.v !== 1) return false;
  if (d.tab !== "not_following_back" && d.tab !== "fans") return false;
  if (!Array.isArray(d.hidden)) return false;
  if (!d.parsed || typeof d.parsed !== "object") return false;
  const parsed = d.parsed as Record<string, unknown>;
  if (!Array.isArray(parsed.following)) return false;
  if (!Array.isArray(parsed.followers)) return false;
  if (!Array.isArray(parsed.warnings)) return false;
  return true;
}

export function loadState(): StoredState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (!isValidStoredState(data)) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveState(state: Omit<StoredState, "v" | "savedAt">): boolean {
  if (typeof window === "undefined") return false;
  try {
    const payload: StoredState = { v: 1, savedAt: Date.now(), ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
