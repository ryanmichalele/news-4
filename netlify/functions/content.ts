import { createClient } from "@sanity/client";

/**
 * Server-side proxy for the private Sanity dataset.
 * Keeps the read token off the client: the browser only ever sees resolved
 * public content, never a credential.
 */

const projectId = process.env.SANITY_PROJECT_ID || "c558ki6i";
const dataset = process.env.SANITY_DATASET || "production";

const CONTENT_QUERY = `{
  "settings": *[_type == "storySettings"][0]{
    bankName, locationName, advisorName,
    bankKey, locationKey, advisorKey
  },
  "article": *[_type == "article"][0]{
    outlet, section, kicker, title, dek, byline,
    published, updated, readTime, location, heroCaption,
    tickerItems, editorNote, bodySections, quotes, timeline,
    timelineKicker, timelineHeading,
    protectEyebrow, protectHeading, protectBlurb, protectionTips,
    bottomLineEyebrow, bottomLineHeading, bottomLineBody,
    keyFacts, guidanceEyebrow, guidanceHeading, guidanceBlurb,
    scopeItems, whyItMatters, relatedStories,
    newsletterKicker, newsletterHeading, newsletterBlurb, stats
  }
}`;

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  token: process.env.SANITY_READ_TOKEN,
  useCdn: true,
});

/**
 * Per-instance memory cache.
 *
 * A warm instance serves repeat visitors without re-querying Sanity. Kept at
 * 1s so it can never delay an edit beyond the client's poll interval, and it
 * is per-instance so it never serves stale data across the fleet. A Sanity
 * CDN read is only ~45ms, so this is a minor optimisation — correctness of the
 * edit path matters far more than shaving it.
 */
type CacheEntry = { data: string; expiresAt: number };

const MEMORY_TTL_MS = 0;
let cache: CacheEntry | null = null;
/** De-duplicates concurrent misses so a burst triggers one Sanity query. */
let inflight: Promise<CacheEntry> | null = null;

async function loadContent(): Promise<CacheEntry> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache;

  if (!inflight) {
    inflight = client
      .fetch(CONTENT_QUERY)
      .then((data) => {
        const entry: CacheEntry = {
          data: JSON.stringify(data),
          expiresAt: Date.now() + MEMORY_TTL_MS,
        };
        cache = entry;
        return entry;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

const NO_STORE = "no-store, no-cache, must-revalidate";

export default async (request: Request): Promise<Response> => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = process.env.SANITY_READ_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: "server_misconfigured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Cache-Control": NO_STORE },
    });
  }

  try {
    const started = Date.now();
    const wasFresh = Boolean(cache && cache.expiresAt > Date.now());
    const entry = await loadContent();

    return new Response(entry.data, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Never shared-cached. The in-memory cache above is the only cache
        // here, and it is per-instance and short-lived; an edge cache is the
        // one thing that would hold back a Studio edit.
        "Cache-Control": NO_STORE,
        "Netlify-CDN-Cache-Control": NO_STORE,
        "Server-Timing": wasFresh
          ? "content;desc=mem"
          : `content;desc=sanity;dur=${Date.now() - started}`,
      },
    });
  } catch (err) {
    // Serve the last good copy rather than a hard error, so a transient
    // Sanity outage never takes the page down.
    if (cache) {
      return new Response(cache.data, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": NO_STORE,
          "X-Content-Stale": "1",
        },
      });
    }
    console.error("Sanity proxy failed", err);
    return new Response(JSON.stringify({ error: "content_unavailable" }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Cache-Control": NO_STORE },
    });
  }
};