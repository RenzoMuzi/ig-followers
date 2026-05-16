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

type DetectedKind = "following" | "followers" | "pending" | null;

// Formato distinto al de followers/following: objetos con `label_values` que
// contienen pares { label, value }. Lo usan los pending_follow_requests.json.
type LabelValuesEntry = {
  timestamp?: number;
  label_values?: Array<{ label?: string; value?: string }>;
};

function labelValuesEntryToUser(e: LabelValuesEntry): IgUser | null {
  const lv = e.label_values;
  if (!Array.isArray(lv)) return null;
  let username: string | undefined;
  for (const pair of lv) {
    if (pair?.label === "Username" && typeof pair.value === "string") {
      username = pair.value.trim();
      break;
    }
  }
  if (!username || !USERNAME_RE.test(username)) return null;
  return {
    username,
    href: `https://www.instagram.com/${username}`,
    timestamp: e.timestamp,
  };
}

/**
 * Detecta si un JSON parseado pertenece a "following" o "followers" mirando
 * su estructura. Si el JSON es un array (ambos archivos vienen como array
 * en exportaciones recientes), devuelve kind=null y se resuelve por nombre.
 */
type DetectResult =
  | { kind: DetectedKind; format: "string_list"; entries: StringListEntry[] }
  | { kind: DetectedKind; format: "label_values"; entries: LabelValuesEntry[] }
  | { kind: null; format: "unknown"; entries: [] };

function detect(json: unknown): DetectResult {
  if (json && typeof json === "object" && !Array.isArray(json)) {
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj.relationships_following)) {
      return {
        kind: "following",
        format: "string_list",
        entries: obj.relationships_following as StringListEntry[],
      };
    }
    if (Array.isArray(obj.relationships_followers)) {
      return {
        kind: "followers",
        format: "string_list",
        entries: obj.relationships_followers as StringListEntry[],
      };
    }
    if (Array.isArray(obj.relationships_follow_requests_sent)) {
      return {
        kind: "pending",
        format: "string_list",
        entries: obj.relationships_follow_requests_sent as StringListEntry[],
      };
    }
    // formatos viejos: una sola key con la lista adentro
    for (const v of Object.values(obj)) {
      if (Array.isArray(v) && v.length && (v[0] as StringListEntry)?.string_list_data) {
        return { kind: null, format: "string_list", entries: v as StringListEntry[] };
      }
    }
  }
  // Array top-level: puede ser cualquiera de los formatos. Lo desambiguamos por
  // la forma del primer elemento.
  if (Array.isArray(json)) {
    const first = json[0] as Record<string, unknown> | undefined;
    if (first && Array.isArray((first as LabelValuesEntry).label_values)) {
      return { kind: null, format: "label_values", entries: json as LabelValuesEntry[] };
    }
    return { kind: null, format: "string_list", entries: json as StringListEntry[] };
  }
  return { kind: null, format: "unknown", entries: [] };
}

function kindFromName(name: string): DetectedKind {
  // Pending va primero: contiene "follow_requests" en el nombre y queremos
  // diferenciarlo claramente de followers/following.
  if (name.includes("pending_follow_requests")) return "pending";
  if (name.includes("follow_requests_sent")) return "pending";
  if (name.includes("following")) return "following";
  if (name.includes("followers")) return "followers";
  return null;
}

// Una warning estructurada: el parser no conoce los textos finales, solo emite
// claves i18n + parámetros. La UI traduce.
export type ParserWarning = {
  key: string;
  params?: Record<string, string | number>;
};

export type ParsedExport = {
  following: IgUser[];
  followers: IgUser[];
  pending: IgUser[];
  warnings: ParserWarning[];
};

// Sentinel para llevar { key, params } a través de `throw`. La idea: que
// extractJsonsFromZip pueda abortar con un mensaje localizable y que parseFiles
// lo capture sin parsear strings.
class TranslatableError extends Error {
  constructor(public i18nKey: string, public i18nParams?: Record<string, string | number>) {
    super(i18nKey);
  }
}

// Límites defensivos para evitar zip bombs y archivos abusivos. Estos están
// dimensionados con margen amplio sobre exportaciones reales de Instagram
// (que rara vez pasan de unos pocos MB de JSON).
const MAX_INPUT_FILE_BYTES = 100 * 1024 * 1024; // 100 MB por archivo subido (.zip o .json)
const MAX_JSON_BYTES = 50 * 1024 * 1024; // 50 MB descomprimidos por JSON individual
const MAX_TOTAL_DECOMPRESSED_BYTES = 200 * 1024 * 1024; // 200 MB totales descomprimidos del zip
const MAX_ZIP_ENTRIES = 2000; // tope al número de entries antes de mirar nada
// Solo nos interesan los JSONs de followers/following dentro del zip.
const TARGET_ZIP_ENTRY_RE =
  /(^|\/)connections\/followers_and_following\/(followers(_\d+)?|following|pending_follow_requests)\.json$/i;

// Extrae solo los JSONs que nos interesan de un zip subido, en memoria, con
// validaciones contra zip bombs, path traversal y entries inesperados.
async function extractJsonsFromZip(
  file: File,
  warnings: ParserWarning[]
): Promise<Array<{ name: string; text: string }>> {
  const { default: JSZip } = await import("jszip");
  const buf = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);

  const entries = Object.values(zip.files);
  if (entries.length > MAX_ZIP_ENTRIES) {
    throw new TranslatableError("userList.warningTooManyEntries", {
      count: entries.length,
      max: MAX_ZIP_ENTRIES,
    });
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
      warnings.push({ key: "userList.warningSuspiciousPath", params: { name: rawName } });
      continue;
    }
    if (!TARGET_ZIP_ENTRY_RE.test(rawName)) continue;

    matched++;
    const bytes = await entry.async("uint8array");
    if (bytes.byteLength > MAX_JSON_BYTES) {
      warnings.push({
        key: "userList.warningEntryTooLarge",
        params: {
          name: rawName,
          mb: (bytes.byteLength / 1024 / 1024).toFixed(1),
          maxMb: MAX_JSON_BYTES / 1024 / 1024,
        },
      });
      continue;
    }
    totalBytes += bytes.byteLength;
    if (totalBytes > MAX_TOTAL_DECOMPRESSED_BYTES) {
      throw new TranslatableError("userList.warningTotalTooLarge");
    }
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    // Usamos solo el basename del entry; el resto de la pipeline ya se maneja por nombre.
    const baseName = rawName.split("/").pop() ?? rawName;
    out.push({ name: baseName, text });
  }

  if (matched === 0) {
    warnings.push({ key: "userList.warningNoFollowersInZip" });
  }
  return out;
}

export async function parseFiles(files: File[]): Promise<ParsedExport> {
  let following: IgUser[] = [];
  let followers: IgUser[] = [];
  let pending: IgUser[] = [];
  const warnings: ParserWarning[] = [];

  type ParsedJson = { name: string; json: unknown };
  const parsedJsons: ParsedJson[] = [];

  // Paso 1: cada upload puede ser un .json suelto o un .zip que contiene los JSONs.
  // Recolectamos los textos crudos primero para parsearlos uniformemente abajo.
  const rawTexts: Array<{ name: string; text: string }> = [];

  for (const file of files) {
    if (file.size > MAX_INPUT_FILE_BYTES) {
      warnings.push({
        key: "userList.warningTooLarge",
        params: { name: file.name, maxMb: MAX_INPUT_FILE_BYTES / 1024 / 1024 },
      });
      continue;
    }
    const name = file.name.toLowerCase();
    if (name.endsWith(".zip")) {
      try {
        const extracted = await extractJsonsFromZip(file, warnings);
        rawTexts.push(...extracted);
      } catch (e) {
        if (e instanceof TranslatableError) {
          warnings.push({ key: e.i18nKey, params: e.i18nParams });
        } else {
          warnings.push({
            key: "userList.warningZipInvalid",
            params: {
              name: file.name,
              message: e instanceof Error ? e.message : "",
            },
          });
        }
      }
      continue;
    }
    if (!name.endsWith(".json")) {
      warnings.push({ key: "userList.warningOnlyJson", params: { name: file.name } });
      continue;
    }
    const text = await file.text();
    rawTexts.push({ name, text });
  }

  for (const { name, text } of rawTexts) {
    try {
      parsedJsons.push({ name: name.toLowerCase(), json: JSON.parse(text) });
    } catch {
      warnings.push({ key: "userList.warningInvalidJson", params: { name } });
    }
  }

  for (const { name, json } of parsedJsons) {
    const detected = detect(json);
    // Prioridad: estructura > nombre. Si la estructura es ambigua, usamos el nombre.
    const resolvedKind: DetectedKind = detected.kind ?? kindFromName(name);
    const users =
      detected.format === "label_values"
        ? detected.entries
            .map(labelValuesEntryToUser)
            .filter((u): u is IgUser => u !== null)
        : detected.entries.map(entryToUser).filter((u): u is IgUser => u !== null);
    if (resolvedKind === "following") following = following.concat(users);
    else if (resolvedKind === "followers") followers = followers.concat(users);
    else if (resolvedKind === "pending") pending = pending.concat(users);
    else warnings.push({ key: "userList.warningIgnoredFile", params: { name } });
  }

  return {
    following: dedupe(following),
    followers: dedupe(followers),
    pending: dedupe(pending),
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
