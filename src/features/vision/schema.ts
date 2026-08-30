import { z } from "zod";
import { defineRecordSchema } from "@/lib/repository";
import { lifePillarsSchema, type LifePillar } from "@/lib/validation/domain";

/**
 * Life Vision (Layer 8A) — the top of the planning cascade. A user keeps a small set of
 * vision items, each in a category and linked to one or more life pillars.
 */

export const LIFE_VISION_CATEGORIES = [
  "mission",
  "values",
  "purpose",
  "legacy",
  "direction-spiritual",
  "direction-personal",
  "direction-societal",
  "vision-statement",
  "future-self",
  "principle",
] as const;

export const lifeVisionCategorySchema = z.enum(LIFE_VISION_CATEGORIES);
export type LifeVisionCategory = (typeof LIFE_VISION_CATEGORIES)[number];

export interface LifeVisionCategoryMeta {
  label: string;
  description: string;
  /** Pillar this category naturally belongs to, pre-selected in the form. */
  defaultPillars: LifePillar[];
}

export const LIFE_VISION_CATEGORY_META: Record<LifeVisionCategory, LifeVisionCategoryMeta> = {
  mission: {
    label: "Personal mission",
    description: "Why you are here, in one or two sentences.",
    defaultPillars: ["spiritual", "personal", "societal"],
  },
  values: {
    label: "Core value",
    description: "A principle you will not trade away.",
    defaultPillars: ["personal"],
  },
  purpose: {
    label: "Life purpose",
    description: "The direction your life is oriented toward.",
    defaultPillars: ["spiritual", "personal", "societal"],
  },
  legacy: {
    label: "Desired legacy",
    description: "What you want to leave behind.",
    defaultPillars: ["societal"],
  },
  "direction-spiritual": {
    label: "Spiritual direction",
    description: "Where you are heading in faith, character, and service.",
    defaultPillars: ["spiritual"],
  },
  "direction-personal": {
    label: "Personal direction",
    description: "Where you are heading in health, growth, and relationships.",
    defaultPillars: ["personal"],
  },
  "direction-societal": {
    label: "Societal direction",
    description: "Where you are heading in work, leadership, and impact.",
    defaultPillars: ["societal"],
  },
  "vision-statement": {
    label: "Long-term vision statement",
    description: "A vivid picture of the future you are building toward.",
    defaultPillars: ["personal"],
  },
  "future-self": {
    label: "Future-self description",
    description: "Who you intend to become.",
    defaultPillars: ["personal"],
  },
  principle: {
    label: "Non-negotiable principle",
    description: "A rule you hold regardless of circumstances.",
    defaultPillars: ["personal"],
  },
};

const titleSchema = z
  .string()
  .trim()
  .min(1, "Give it a short title")
  .max(160, "Keep the title under 160 characters");
const contentSchema = z
  .string()
  .trim()
  .min(1, "Add some detail")
  .max(4000, "Keep it under 4000 characters");

export const lifeVisionSchema = defineRecordSchema({
  category: lifeVisionCategorySchema,
  title: z.string().trim().min(1).max(160),
  content: z.string().trim().min(1).max(4000),
  pillarIds: lifePillarsSchema,
});
export type LifeVision = z.infer<typeof lifeVisionSchema>;

export const lifeVisionCreateSchema = z.object({
  category: lifeVisionCategorySchema,
  title: titleSchema,
  content: contentSchema,
  pillarIds: lifePillarsSchema,
});
export type LifeVisionCreate = z.infer<typeof lifeVisionCreateSchema>;

export const lifeVisionUpdateSchema = lifeVisionCreateSchema.partial();
export type LifeVisionUpdate = z.infer<typeof lifeVisionUpdateSchema>;
