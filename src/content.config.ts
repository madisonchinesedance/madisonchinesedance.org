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
  }),
});

export const collections = { pages };