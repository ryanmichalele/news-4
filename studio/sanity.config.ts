import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemaTypes";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || "c558ki6i";
const dataset = process.env.SANITY_STUDIO_DATASET || "production";

export default defineConfig({
  name: "default",
  title: "CWN Story Studio",
  projectId,
  dataset,
  basePath: "/",
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            S.listItem()
              .title("Story Settings")
              .id("storySettings")
              .child(
                S.document()
                  .schemaType("storySettings")
                  .documentId("storySettings")
              ),
            S.divider(),
            S.documentTypeListItem("article").title("Article"),
          ]),
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
});