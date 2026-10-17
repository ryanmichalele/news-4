import {
  buildEntityMap,
  FALLBACK_SETTINGS,
  resolveEntities,
  type EntityMap,
  type StorySettings,
} from "./resolveEntities";
import type { StaticArticle } from "@/data/fallback";

export type ContentPayload = {
  settings: StorySettings | null;
  article: Partial<StaticArticle> | null;
};

export type LoadedContent<T> = {
  entities: EntityMap;
  article: T | null;
};

function toContent<T>(payload: ContentPayload): LoadedContent<T> {
  const settings: StorySettings = {
    ...FALLBACK_SETTINGS,
    ...(payload.settings ?? {}),
  };
  return {
    entities: buildEntityMap(settings),
    article: (payload.article ?? null) as T | null,
  };
}

/**
 * Fetches CMS content through the server-side proxy at /api/content.
 *
 * The HTTP cache is bypassed so a Studio edit is never hidden by a stale
 * intermediate. There is deliberately no If-None-Match / 304 path: the
 * response is only ~13KB, and conditional matching through intermediate
 * proxies proved unreliable — a changed payload could be answered with
 * "not modified" and the update silently lost. Always fetching is both
 * simpler and correct; the poller compares content itself and skips
 * re-rendering when nothing moved.
 *
 * Returns null on failure so the caller keeps showing what it already has.
 */
export async function loadContent<T>(): Promise<LoadedContent<T> | null> {
  try {
    const res = await fetch("/api/content", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`content proxy: ${res.status}`);
    return toContent<T>((await res.json()) as ContentPayload);
  } catch {
    return null;
  }
}

export function fallbackContent<T>(): LoadedContent<T> {
  return { entities: buildEntityMap(FALLBACK_SETTINGS), article: null };
}

export { resolveEntities };