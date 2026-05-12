export type IgUser = {
  username: string;
  href: string;
  timestamp?: number;
};

type StringListEntry = {
  title?: string;
  string_list_data?: Array<{ href?: string; value?: string; timestamp?: number }>;
};

function usernameFromHref(href: string | undefined): string | null {
  if (!href) return null;
  try {
    const url = new URL(href);
    if (!url.hostname.toLowerCase().includes("instagram.com")) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    // Algunas hrefs vienen como /_u/<username> (deep-link a la app); saltamos ese segmento.
    const first = parts[0] === "_u" ? parts[1] : parts[0];
    return first || null;
  } catch {
    return null;
  }
}

function entryToUser(e: StringListEntry): IgUser | null {
  const item = e.string_list_data?.[0];
  if (!item) return null;
  // En following.json el username viene en `title`. En followers_1.json viene en `value`.
  // Como fallback parseamos el href.
  const username =
    (item.value && item.value.trim()) ||
    (e.title && e.title.trim()) ||
    usernameFromHref(item.href);
  if (!username) return null;
  return {
    username,
    href: `https://www.instagram.com/${username}`,
    timestamp: item.timestamp,
  };
}

type DetectedKind = "following" | "followers" | null;

/**
 * Detecta si un JSON parseado pertenece a "following" o "followers" mirando
 * su estructura. Si el JSON es un array (ambos archivos vienen como array
 * en exportaciones recientes), devuelve kind=null y se resuelve por nombre.
 */
function detect(json: unknown): { kind: DetectedKind; entries: StringListEntry[] } {
  if (json && typeof json === "object" && !Array.isArray(json)) {
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj.relationships_following)) {
      return { kind: "following", entries: obj.relationships_following as StringListEntry[] };
    }
    if (Array.isArray(obj.relationships_followers)) {
      return { kind: "followers", entries: obj.relationships_followers as StringListEntry[] };
    }
    // formatos viejos: una sola key con la lista adentro
    for (const v of Object.values(obj)) {
      if (Array.isArray(v) && v.length && (v[0] as StringListEntry)?.string_list_data) {
        return { kind: null, entries: v as StringListEntry[] };
      }
    }
  }
  // Array top-level: puede ser cualquiera de los dos en exportaciones nuevas.
  if (Array.isArray(json)) {
    return { kind: null, entries: json as StringListEntry[] };
  }
  return { kind: null, entries: [] };
}

function kindFromName(name: string): DetectedKind {
  // Importante: chequear "following" antes que "followers" no alcanza porque
  // ninguno es substring del otro, pero igual lo dejamos explícito.
  if (name.includes("following")) return "following";
  if (name.includes("followers")) return "followers";
  return null;
}

export type ParsedExport = {
  following: IgUser[];
  followers: IgUser[];
  warnings: string[];
};

export async function parseFiles(files: File[]): Promise<ParsedExport> {
  let following: IgUser[] = [];
  let followers: IgUser[] = [];
  const warnings: string[] = [];

  type Pending = { name: string; json: unknown };
  const pending: Pending[] = [];

  for (const file of files) {
    const name = file.name.toLowerCase();
    if (!name.endsWith(".json")) {
      warnings.push(`Ignoré ${file.name}: solo acepto archivos .json.`);
      continue;
    }
    const text = await file.text();
    try {
      pending.push({ name, json: JSON.parse(text) });
    } catch {
      warnings.push(`No pude leer ${file.name} (JSON inválido).`);
    }
  }

  for (const { name, json } of pending) {
    const { kind, entries } = detect(json);
    // Prioridad: estructura > nombre. Si la estructura es ambigua (array top-level),
    // usamos el nombre.
    const resolvedKind: DetectedKind = kind ?? kindFromName(name);
    const users = entries.map(entryToUser).filter((u): u is IgUser => u !== null);
    if (resolvedKind === "following") following = following.concat(users);
    else if (resolvedKind === "followers") followers = followers.concat(users);
    else warnings.push(`No pude identificar ${name} como followers o following.`);
  }

  return {
    following: dedupe(following),
    followers: dedupe(followers),
    warnings,
  };
}

function dedupe(list: IgUser[]): IgUser[] {
  const map = new Map<string, IgUser>();
  for (const u of list) {
    const key = u.username.toLowerCase();
    if (!map.has(key)) map.set(key, u);
  }
  return Array.from(map.values());
}

export function computeNotFollowingBack(parsed: ParsedExport): IgUser[] {
  const followerSet = new Set(parsed.followers.map((u) => u.username.toLowerCase()));
  return parsed.following
    .filter((u) => !followerSet.has(u.username.toLowerCase()))
    .sort((a, b) => a.username.localeCompare(b.username));
}

export function computeFansYouDontFollow(parsed: ParsedExport): IgUser[] {
  const followingSet = new Set(parsed.following.map((u) => u.username.toLowerCase()));
  return parsed.followers
    .filter((u) => !followingSet.has(u.username.toLowerCase()))
    .sort((a, b) => a.username.localeCompare(b.username));
}
