/**
 * Database operations for templates and layout codes.
 *
 * This module provides functions for managing presentation templates and
 * custom layout code. Templates define reusable slide structures, while
 * layout codes store custom React/TypeScript code for dynamic slide layouts.
 */

import { prisma } from "../db";

/**
 * Template record structure stored in the database.
 *
 * Represents a reusable presentation template that defines slide structures
 * and layouts. Templates can be applied to new presentations to provide
 * consistent styling and structure.
 *
 * @property id - Unique identifier for the template.
 * @property name - Display name of the template (e.g., "Minimal Investor",
 *   "Data-Driven").
 * @property description - Optional description explaining the template's
 *   style or use case.
 * @property ordered - Whether slides in this template have a fixed order
 *   that must be maintained.
 * @property slides - JSON object containing template slide definitions and
 *   structure. Stored as JSON string in DB, parsed to object here.
 * @property created_at - ISO 8601 timestamp string of when the template was created.
 */
export type TemplateRecord = {
  id: string;
  name: string;
  description: string | null;
  ordered: boolean;
  slides: Record<string, unknown> | null;
  created_at: string;
};

/**
 * Layout code record structure stored in the database.
 *
 * Represents custom layout code (React/TypeScript) associated with a specific
 * presentation and layout. This code is dynamically compiled and executed to
 * render custom slide layouts.
 *
 * @property id - Unique identifier for the layout code record.
 * @property presentation - ID of the presentation this layout code belongs to.
 * @property layout_id - Unique identifier for the specific layout within the
 *   presentation.
 * @property layout_name - Human-readable name of the layout (e.g., "Custom Intro").
 * @property layout_code - The actual React/TypeScript code for the layout.
 *   This code is compiled and executed at runtime to render slides.
 * @property fonts - Optional array of font identifiers required by this layout.
 *   Used to ensure required fonts are loaded before rendering.
 * @property created_at - ISO 8601 timestamp string of when the layout code was created.
 * @property updated_at - ISO 8601 timestamp string of when the layout code was last updated.
 */
export type LayoutCodeRecord = {
  id: string;
  presentation: string;
  layout_id: string;
  layout_name: string;
  layout_code: string;
  fonts: string[] | null;
  created_at: string;
  updated_at: string;
};

const fromJson = <T>(value: unknown, fallback: T): T => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
};

const toJson = <T>(value: T): string | null => {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
};

const rowToTemplate = (
  row: {
    id: string;
    name: string;
    description: string | null;
    ordered: boolean;
    slides: string | null;
    created_at: Date;
  } | null,
): TemplateRecord | null => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    ordered: row.ordered,
    slides: fromJson<Record<string, unknown> | null>(row.slides, null),
    created_at: row.created_at.toISOString(),
  };
};

const rowToLayoutCode = (
  row: {
    id: string;
    presentation: string;
    layout_id: string;
    layout_name: string;
    layout_code: string;
    fonts: string | null;
    created_at: Date;
    updated_at: Date;
  } | null,
): LayoutCodeRecord | null => {
  if (!row) return null;
  return {
    id: row.id,
    presentation: row.presentation,
    layout_id: row.layout_id,
    layout_name: row.layout_name,
    layout_code: row.layout_code,
    fonts: fromJson<string[] | null>(row.fonts, null),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
};

export const upsertTemplate = async (
  payload: Omit<TemplateRecord, "created_at">,
): Promise<TemplateRecord> => {
  const now = new Date();

  const upserted = await prisma.template.upsert({
    where: { id: payload.id },
    update: {
      name: payload.name,
      description: payload.description,
      ordered: payload.ordered,
      slides: toJson(payload.slides),
    },
    create: {
      id: payload.id,
      name: payload.name,
      description: payload.description,
      ordered: payload.ordered,
      slides: toJson(payload.slides),
      created_at: now,
    },
  });

  return rowToTemplate(upserted)!;
};

export const getTemplateById = async (
  id: string,
): Promise<TemplateRecord | null> => {
  const row = await prisma.template.findUnique({
    where: { id },
  });
  return rowToTemplate(row);
};

export const listTemplates = async (): Promise<TemplateRecord[]> => {
  const rows = await prisma.template.findMany();
  return rows.map(rowToTemplate).filter((r): r is TemplateRecord => r !== null);
};

export const deleteTemplateById = async (id: string): Promise<boolean> => {
  try {
    await prisma.template.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
};

export const upsertLayoutCodes = async (
  layouts: Omit<LayoutCodeRecord, "created_at" | "updated_at">[],
): Promise<LayoutCodeRecord[]> => {
  const now = new Date();
  const results: LayoutCodeRecord[] = [];

  for (const layout of layouts) {
    const upserted = await prisma.presentationLayoutCode.upsert({
      where: { id: layout.id },
      update: {
        presentation: layout.presentation,
        layout_id: layout.layout_id,
        layout_name: layout.layout_name,
        layout_code: layout.layout_code,
        fonts: toJson(layout.fonts),
        updated_at: now,
      },
      create: {
        id: layout.id,
        presentation: layout.presentation,
        layout_id: layout.layout_id,
        layout_name: layout.layout_name,
        layout_code: layout.layout_code,
        fonts: toJson(layout.fonts),
        created_at: now,
        updated_at: now,
      },
    });

    results.push(rowToLayoutCode(upserted)!);
  }

  return results;
};

export const listLayoutCodesByPresentation = async (
  presentationId: string,
): Promise<LayoutCodeRecord[]> => {
  const rows = await prisma.presentationLayoutCode.findMany({
    where: { presentation: presentationId },
  });
  return rows
    .map(rowToLayoutCode)
    .filter((r): r is LayoutCodeRecord => r !== null);
};

export const deleteLayoutsByPresentation = async (
  presentationId: string,
): Promise<boolean> => {
  try {
    await prisma.presentationLayoutCode.deleteMany({
      where: { presentation: presentationId },
    });
    return true;
  } catch {
    return false;
  }
};
