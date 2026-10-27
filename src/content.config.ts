import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const blockLayout = z.enum(["1-column", "2-columns", "3-columns", "4-columns"]);
const blockVariant = z.enum(["none", "card"]);
interface BlockData {
  text?: string;
  button?: {
    label: string;
    href: string;
    variant?: "primary" | "secondary" | "text";
    external?: boolean;
  };
  blocks?: BlockData[];
  layout?: "1-column" | "2-columns" | "3-columns" | "4-columns";
  variant?: "none" | "card";
}

const block: z.ZodType<BlockData> = z.lazy(() =>
  z.union([
    z.object({
      text: z.string(),
    }),
    z.object({
      button: z.object({
        label: z.string(),
        href: z.string(),
        variant: z.enum(["primary", "secondary", "text"]).optional(),
        external: z.boolean().optional(),
      }),
    }),
    z.object({
      blocks: z.array(block),
      layout: blockLayout.optional(),
      variant: blockVariant.optional(),
    }),
  ]),
);

const pages = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content",
  }),
  schema: z.object({
    title: z.string(),
    sections: z.array(
      z.object({
        layout: blockLayout.optional(),
        variant: blockVariant.optional(),
        blocks: z.array(block),
      }),
    ),
  }),
});

export const collections = { pages };