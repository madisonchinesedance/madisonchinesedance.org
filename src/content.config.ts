import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const pages = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content",
  }),
  schema: z.object({
    title: z.string(),
    sections: z.array(
      z.object({
        layout: z
          .enum(["1-column", "2-columns", "3-columns", "4-columns"])
          .optional(),
        blocks: z.array(
          z.object({
            text: z.string(),
          }),
        ),
      }),
    ),
  }),
});

export const collections = { pages };