/**
 * End-to-end verification against the LIVE deployed site.
 * Fetches the real /api/content payload and applies the same render-time
 * resolution the browser performs, then counts what a visitor would see.
 */

const SITE = process.argv[2] || "https://cnn-news-netlify.netlify.app";

const OLD = ["Edward Jones", "Louisiana", "Beau Wilson"];
const NEW = ["Wells Fargo", "Texas", "Dana Reyes"];

type Payload = {
  settings: { bankName: string; locationName: string; advisorName: string } | null;
  article: Record<string, unknown> | null;
};

async function main() {
  const res = await fetch(`${SITE}/api/content`);
  if (!res.ok) throw new Error(`content proxy returned ${res.status}`);
  const payload = (await res.json()) as Payload;

  const s = payload.settings;
  if (!s) throw new Error("no storySettings in payload");

  const map = [
    { find: "Edward Jones", replace: s.bankName },
    { find: "Louisiana", replace: s.locationName },
    { find: "Beau Wilson", replace: s.advisorName },
  ];

  const raw = JSON.stringify(payload.article);
  let rendered = raw;
  for (const { find, replace } of map) {
    if (!find || find === replace) continue;
    const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<![A-Za-z0-9])(${escaped})(['’\u2019]s\\b|(?=['’\u2019]\\b)|\\b)`, "g");
    rendered = rendered.replace(re, `${replace}$2`);
  }

  console.log(`CMS values: bank=${s.bankName} | location=${s.locationName} | advisor=${s.advisorName}\n`);

  const currentValues = [s.bankName, s.locationName, s.advisorName];

  console.log("What the visitor sees:");
  let stale = 0;
  for (const [i, oldName] of OLD.entries()) {
    const remaining = (rendered.match(new RegExp(oldName, "g")) || []).length;
    const fresh = (rendered.match(new RegExp(NEW[i], "g")) || []).length;
    const isUnchanged = currentValues[i] === oldName;
    let status: string;
    if (isUnchanged) {
      status = "field not edited - old value expected";
    } else if (remaining === 0) {
      status = `OK all ${fresh} replaced`;
    } else {
      status = `FAIL ${remaining} stale`;
      stale += remaining;
    }
    console.log(`  ${oldName.padEnd(14)} -> ${NEW[i].padEnd(13)} ${status}`);
  }

  console.log(`\nTotal stale occurrences a visitor would see: ${stale}`);
  process.exit(stale === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});