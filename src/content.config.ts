import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const blockLayout = z.enum(["1-column", "2-columns", "3-columns", "4-columns"]);
const blockVariant = z.enum(["none", "card"]);
interface BlockData {
  text?: string;
  image?: {
    src: string;
    alt: string;
    size?: "small" | "medium" | "large" | "full";
    crop?: "landscape" | "square" | "portrait" | "natural";
  };
  gallery?: {
    images: { src: string; alt: string }[];
    controls?: boolean;
    autoscroll?: boolean;
    interval?: number;
    navigation?: "thumbnails" | "dots" | "none";
    size?: "small" | "medium" | "large" | "full";
    crop?: "landscape" | "square" | "portrait" | "natural";
  };
  button?: {
    label: string;
    href: string;
    variant?: "primary" | "secondary" | "tertiary" | "text";
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
      image: z.object({
        src: z.string(),
        alt: z.string(),
        size: z.enum(["small", "medium", "large", "full"]).optional(),
        crop: z.enum(["landscape", "square", "portrait", "natural"]).optional(),
      }),
    }),
    z.object({
      gallery: z.object({
        images: z.array(z.object({ src: z.string(), alt: z.string() })),
        controls: z.boolean().optional(),
        autoscroll: z.boolean().optional(),
        interval: z.number().positive().optional(),
        navigation: z.enum(["thumbnails", "dots", "none"]).optional(),
        size: z.enum(["small", "medium", "large", "full"]).optional(),
        crop: z
          .enum(["landscape", "square", "portrait", "natural"])
          .optional(),
      }),
    }),
    z.object({
      button: z.object({
        label: z.string(),
        href: z.string(),
        variant: z.enum(["primary", "secondary", "tertiary", "text"]).optional(),
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