import { createClient } from "@sanity/client";

const projectId = process.env.SANITY_PROJECT_ID || "c558ki6i";
const dataset = process.env.SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;

if (!token) {
  console.error("SANITY_API_TOKEN required");
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: "2024-01-01", token, useCdn: false });

const args = process.argv.slice(2);
const [field, value] = args;

const FIELDS = ["bankName", "locationName", "advisorName"] as const;
if (!FIELDS.includes(field as (typeof FIELDS)[number])) {
  console.error(`Usage: tsx scripts/set-entity.ts <${FIELDS.join("|")}> "<value>"`);
  process.exit(1);
}

async function main() {
  const current = await client.fetch<Record<string, string>>(
    `*[_type == "storySettings"][0]`,
  );
  const before = { ...current };

  await client
    .patch("storySettings")
    .set({ [field]: value, _updatedAt: new Date().toISOString() })
    .commit();

  const after = await client.fetch<Record<string, string>>(`*[_type == "storySettings"][0]`);

  console.log(`field ${field} updated`);
  for (const f of FIELDS) {
    const changed = before[f] !== after[f] ? "  <-- changed" : "";
    console.log(`  ${f.padEnd(13)} ${before[f]} -> ${after[f]}${changed}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});