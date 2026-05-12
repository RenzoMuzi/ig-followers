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

export function loadState(): StoredState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredState;
    if (data?.v !== 1 || !data.parsed) return null;
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
