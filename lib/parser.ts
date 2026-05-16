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

// Instagram usernames: hasta 30 chars, [A-Za-z0-9._]. Defensa contra JSON manipulados.
const USERNAME_RE = /^[A-Za-z0-9._]{1,30}$/;

function entryToUser(e: StringListEntry): IgUser | null {
  const item = e.string_list_data?.[0];
  if (!item) return null;
  // En following.json el username viene en `title`. En followers_1.json viene en `value`.
  // Como fallback parseamos el href.
  const username =
    (item.value && item.value.trim()) ||
    (e.title && e.title.trim()) ||
    usernameFromHref(item.href);
  if (!username || !USERNAME_RE.test(username)) return null;
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

// Límites defensivos para evitar zip bombs y archivos abusivos. Estos están
// dimensionados con margen amplio sobre exportaciones reales de Instagram
// (que rara vez pasan de unos pocos MB de JSON).
const MAX_INPUT_FILE_BYTES = 100 * 1024 * 1024; // 100 MB por archivo subido (.zip o .json)
const MAX_JSON_BYTES = 50 * 1024 * 1024; // 50 MB descomprimidos por JSON individual
const MAX_TOTAL_DECOMPRESSED_BYTES = 200 * 1024 * 1024; // 200 MB totales descomprimidos del zip
const MAX_ZIP_ENTRIES = 2000; // tope al número de entries antes de mirar nada
// Solo nos interesan los JSONs de followers/following dentro del zip.
const TARGET_ZIP_ENTRY_RE =
  /(^|\/)connections\/followers_and_following\/(followers(_\d+)?|following)\.json$/i;

// Extrae solo los JSONs que nos interesan de un zip subido, en memoria, con
// validaciones contra zip bombs, path traversal y entries inesperados.
async function extractJsonsFromZip(
  file: File,
  warnings: string[]
): Promise<Array<{ name: string; text: string }>> {
  const { default: JSZip } = await import("jszip");
  const buf = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);

  const entries = Object.values(zip.files);
  if (entries.length > MAX_ZIP_ENTRIES) {
    throw new Error(
      `El ZIP tiene demasiados archivos (${entries.length}). Por seguridad solo proceso hasta ${MAX_ZIP_ENTRIES}.`
    );
  }

  const out: Array<{ name: string; text: string }> = [];
  let totalBytes = 0;
  let matched = 0;

  for (const entry of entries) {
    if (entry.dir) continue;
    // Defensa en profundidad contra path traversal: aunque leemos en memoria
    // y no escribimos al disco, descartamos nombres con `..` o rutas absolutas.
    const rawName = entry.name;
    if (rawName.includes("..") || rawName.startsWith("/") || /^[A-Za-z]:/.test(rawName)) {
      warnings.push(`Ignoré una entry con ruta sospechosa: ${rawName}`);
      continue;
    }
    if (!TARGET_ZIP_ENTRY_RE.test(rawName)) continue;

    matched++;
    const bytes = await entry.async("uint8array");
    if (bytes.byteLength > MAX_JSON_BYTES) {
      warnings.push(
        `Ignoré ${rawName}: pesa ${(bytes.byteLength / 1024 / 1024).toFixed(1)} MB descomprimido (máx ${MAX_JSON_BYTES / 1024 / 1024} MB).`
      );
      continue;
    }
    totalBytes += bytes.byteLength;
    if (totalBytes > MAX_TOTAL_DECOMPRESSED_BYTES) {
      throw new Error(
        "El contenido descomprimido del ZIP supera el límite de seguridad. ¿Es realmente una exportación de Instagram?"
      );
    }
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    // Usamos solo el basename del entry; el resto de la pipeline ya se maneja por nombre.
    const baseName = rawName.split("/").pop() ?? rawName;
    out.push({ name: baseName, text });
  }

  if (matched === 0) {
    warnings.push(
      `No encontré followers/following dentro del ZIP. Asegurate de descargar "Seguidores y seguidos" en formato JSON.`
    );
  }
  return out;
}

export async function parseFiles(files: File[]): Promise<ParsedExport> {
  let following: IgUser[] = [];
  let followers: IgUser[] = [];
  const warnings: string[] = [];

  type Pending = { name: string; json: unknown };
  const pending: Pending[] = [];

  // Paso 1: cada upload puede ser un .json suelto o un .zip que contiene los JSONs.
  // Recolectamos los textos crudos primero para parsearlos uniformemente abajo.
  const rawTexts: Array<{ name: string; text: string }> = [];

  for (const file of files) {
    if (file.size > MAX_INPUT_FILE_BYTES) {
      warnings.push(
        `Ignoré ${file.name}: pesa más de ${MAX_INPUT_FILE_BYTES / 1024 / 1024} MB.`
      );
      continue;
    }
    const name = file.name.toLowerCase();
    if (name.endsWith(".zip")) {
      try {
        const extracted = await extractJsonsFromZip(file, warnings);
        rawTexts.push(...extracted);
      } catch (e) {
        warnings.push(
          `No pude leer ${file.name}: ${e instanceof Error ? e.message : "ZIP inválido"}.`
        );
      }
      continue;
    }
    if (!name.endsWith(".json")) {
      warnings.push(`Ignoré ${file.name}: solo acepto .json o .zip.`);
      continue;
    }
    const text = await file.text();
    rawTexts.push({ name, text });
  }

  for (const { name, text } of rawTexts) {
    try {
      pending.push({ name: name.toLowerCase(), json: JSON.parse(text) });
    } catch {
      warnings.push(`No pude leer ${name} (JSON inválido).`);
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
