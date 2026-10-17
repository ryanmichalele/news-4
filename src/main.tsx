import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { loadContent, resolveEntities } from "./sanity/client";
import type { StaticArticle } from "./data/fallback";

/**
 * How long the first paint may wait for CMS content.
 *
 * The preload exists so the page renders the editor's live copy from the very
 * first frame instead of the bundled fallback. If the request stalls (flaky
 * network, captive portal) we stop waiting and render the fallback rather than
 * leaving the visitor on a blank page; background polling picks up the CMS copy
 * as soon as it becomes reachable.
 */
const PRELOAD_TIMEOUT_MS = 2500;

function applyHead(article: Partial<StaticArticle> | null, entities: Parameters<typeof resolveEntities>[1]) {
  if (!article) return;

  if (article.title) {
    document.title = resolveEntities(article.title, entities);
  }

  const meta = document.querySelector('meta[name="description"]');
  if (meta && article.dek) {
    meta.setAttribute("content", resolveEntities(article.dek, entities));
  }
}

async function bootstrap() {
  // Resolve before the first render so no visitor ever sees the stale fallback
  // copy flash and then swap to the CMS copy.
  const preload = await Promise.race([
    loadContent<Partial<StaticArticle>>(),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), PRELOAD_TIMEOUT_MS)),
  ]);

  if (preload) applyHead(preload.article, preload.entities);

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App initialContent={preload} />
    </StrictMode>
  );
}

bootstrap();
