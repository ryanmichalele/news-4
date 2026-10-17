import { createClient } from "@sanity/client";
import { staticArticle } from "../src/data/fallback";

const projectId = process.env.SANITY_PROJECT_ID || "c558ki6i";
const dataset = process.env.SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;

if (!token) {
  console.error("SANITY_API_TOKEN is required. Refusing to seed without a write token.");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  token,
  useCdn: false,
});

const storySettings = {
  _id: "storySettings",
  _type: "storySettings",
  bankName: "Edward Jones",
  locationName: "Louisiana",
  advisorName: "Beau Wilson",
  bankKey: "Edward Jones",
  locationKey: "Louisiana",
  advisorKey: "Beau Wilson",
};

const article = { _id: "article", _type: "article", ...staticArticle };

async function main() {
  console.log(`Seeding ${projectId} / ${dataset}`);

  const t = storySettings as unknown as Record<string, unknown>;
  t._createdAt = new Date().toISOString();
  t._updatedAt = new Date().toISOString();

  await client.createOrReplace(storySettings);
  console.log("  seeded storySettings (bank, location, advisor)");

  const a = article as unknown as Record<string, unknown>;
  a._createdAt = new Date().toISOString();
  a._updatedAt = new Date().toISOString();

  await client.createOrReplace(article);
  console.log("  seeded article");
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});