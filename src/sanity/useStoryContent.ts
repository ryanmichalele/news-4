import { useEffect, useRef, useState } from "react";
import { fallbackContent, loadContent, type LoadedContent } from "./client";
import { buildEntityMap, FALLBACK_SETTINGS, type EntityMap } from "./resolveEntities";
import { staticArticle, type StaticArticle } from "@/data/fallback";

type ContentState = {
  article: StaticArticle;
  entities: EntityMap;
  loading: boolean;
};

export type InitialContent = LoadedContent<Partial<StaticArticle>> | null;

function seedState(initial?: InitialContent): ContentState {
  // Without a preload there is nothing authentic to show yet, so keep the
  // bundled fallback and stay in the loading state until the first poll lands.
  if (!initial) {
    return {
      article: staticArticle,
      entities: buildEntityMap(FALLBACK_SETTINGS),
      loading: true,
    };
  }
  return {
    article: { ...staticArticle, ...(initial.article ?? {}) },
    entities: initial.entities,
    loading: false,
  };
}

/**
 * Poll cadence.
 *
 * The response is ~13KB with no shared caching, so a short interval is cheap
 * and the only cost is a small request every 400ms while the tab is open.
 * Polling pauses in background tabs and resumes on visibilitychange.
 */
const POLL_MS = 400;

/**
 * Keeps the page on the latest CMS content.
 *
 * `initial` is the payload fetched before the first render (see main.tsx). When
 * present it becomes the initial state, so the editor's copy is on screen from
 * the first frame with no fallback-then-swap flicker. Polling still runs after
 * mount so further Studio edits appear on an open page without a manual
 * refresh.
 *
 * Falls back to the bundled static article whenever Sanity is unreachable,
 * empty or missing fields, so the page always renders.
 */
export function useStoryContent(initial?: InitialContent): ContentState {
  const [state, setState] = useState<ContentState>(() => seedState(initial));
  const preloaded = useRef(Boolean(initial));

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const apply = (next: {
      entities: EntityMap;
      article: Partial<StaticArticle> | null;
    }) => {
      if (!active) return;
      setState({
        article: { ...staticArticle, ...(next.article ?? {}) },
        entities: next.entities,
        loading: false,
      });
    };

    const poll = async () => {
      const result = await loadContent<Partial<StaticArticle>>();
      // null means a failed request — keep showing what we have and try again
      // shortly.
      if (result) apply(result);
      if (active) timer = setTimeout(poll, POLL_MS);
    };

    // Preloaded content is already on screen, so wait one interval before the
    // first background poll rather than immediately re-fetching the same bytes.
    if (preloaded.current) {
      timer = setTimeout(poll, POLL_MS);
    } else {
      // Nothing authentic yet; start polling immediately so fresh data fetches
      // right away.
      poll();
    }

    // Don't burn cycles on a background tab, but refresh the moment the
    // user comes back so they see the latest without waiting.
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        poll();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return state;
}

export { fallbackContent };
