import { z } from "zod";

/**
 * Domain-wide primitive vocabularies shared by every feature schema. Values are stored
 * language-neutral (see the Final Master Prompt §21); display labels are an i18n concern.
 */

export const LIFE_PILLARS = ["spiritual", "personal", "societal"] as const;
export const lifePillarSchema = z.enum(LIFE_PILLARS);
export type LifePillar = (typeof LIFE_PILLARS)[number];

/** One or more pillars (most planning records link to at least one). */
export const lifePillarsSchema = z.array(lifePillarSchema).min(1).max(LIFE_PILLARS.length);

export const PRIORITIES = ["low", "medium", "high", "critical"] as const;
export const prioritySchema = z.enum(PRIORITIES);
export type Priority = (typeof PRIORITIES)[number];

/**
 * Progress / status of a plannable item. `active` and `archived` are the record-level
 * lifecycle; feature schemas may narrow or extend the domain status separately.
 */
export const RECORD_STATUSES = ["active", "archived"] as const;
export const recordStatusSchema = z.enum(RECORD_STATUSES);
export type RecordStatus = (typeof RECORD_STATUSES)[number];

export const MEASUREMENT_TYPES = ["binary", "count", "duration", "currency", "percent"] as const;
export const measurementTypeSchema = z.enum(MEASUREMENT_TYPES);
export type MeasurementType = (typeof MEASUREMENT_TYPES)[number];

/** A reference to another record by id (parent plan, linked goal, etc.). */
export const idRefSchema = z.string().trim().min(1).max(128);
