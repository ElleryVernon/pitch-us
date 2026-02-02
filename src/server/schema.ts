/**
 * JSON schema utilities for fallback data generation.
 *
 * This module provides functions for generating placeholder data from JSON
 * schemas. Used as a fallback mechanism when LLM-based content generation
 * fails, ensuring that the application can still produce basic data structures
 * that match expected schemas.
 */

/**
 * Simplified JSON schema type for fallback data generation.
 *
 * Represents a subset of JSON Schema specification sufficient for generating
 * basic placeholder values. Supports common types (string, number, boolean,
 * array, object) and enum values. Used when LLM generation fails to create
 * minimal valid data structures.
 *
 * @property type - Optional JSON schema type ("string", "number", "integer",
 *   "boolean", "array", "object"). Determines what kind of value to generate.
 * @property properties - Optional object mapping property names to their
 *   schemas. Used for object types to define nested structure.
 * @property items - Optional schema for array items. Used for array types to
 *   define the structure of elements.
 * @property enum - Optional array of allowed string values. If present, one
 *   of these values will be selected.
 */
type JsonSchema = {
  type?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  enum?: string[];
};

/**
 * Infers a default value from a JSON schema.
 *
 * Recursively generates a placeholder value based on the schema structure.
 * The generated value matches the schema's type and structure but contains
 * minimal/default data. For objects, the seed string is used only for the
 * first property; other properties get empty/default values.
 *
 * This is a helper function used by buildDataFromSchema to recursively build
 * nested data structures from schemas.
 *
 * @param schema - JSON schema to infer a value from. Determines the type and
 *   structure of the generated value.
 * @param seed - Seed string to use for string values. For objects, only the
 *   first property gets this seed; others get empty strings.
 * @returns A placeholder value matching the schema structure. Type depends
 *   on schema.type: strings get the seed, numbers/integers get 0, booleans
 *   get false, arrays get single-element arrays, objects get objects with
 *   inferred property values.
 *
 * @remarks
 * This function generates minimal placeholder data, not realistic content.
 * It's intended as a last-resort fallback when LLM generation fails.
 */
const inferValue = (schema: JsonSchema, seed: string): unknown => {
  if (schema.enum && schema.enum.length > 0) {
    return schema.enum[0];
  }
  switch (schema.type) {
    case "string":
      return seed;
    case "number":
      return 0;
    case "integer":
      return 0;
    case "boolean":
      return false;
    case "array":
      return schema.items ? [inferValue(schema.items, seed)] : [];
    case "object":
    default: {
      const obj: Record<string, unknown> = {};
      if (schema.properties) {
        let first = true;
        for (const [key, value] of Object.entries(schema.properties)) {
          obj[key] = inferValue(value, first ? seed : "");
          first = false;
        }
      }
      return obj;
    }
  }
};

/**
 * Builds fallback data from a JSON schema when LLM generation fails.
 * This produces minimal/placeholder data based on schema structure.
 *
 * WARNING: This function is called as a fallback when LLM fails.
 * The resulting data will only have the seed value in the first field,
 * with empty/default values for all other fields.
 */
export const buildDataFromSchema = (
  schema: JsonSchema,
  seed: string,
): Record<string, unknown> => {
  console.warn(
    "⚠️ [buildDataFromSchema] Using fallback schema-based data generation",
  );
  console.warn("   This means LLM content generation failed!");
  console.warn("   Seed (outline):", seed?.substring(0, 80) || "(empty)");
  console.warn("   Schema type:", schema?.type || "(undefined)");
  console.warn(
    "   Schema properties:",
    Object.keys(schema?.properties || {}).join(", ") || "(none)",
  );

  const value = inferValue(schema, seed);
  if (typeof value === "object" && value && !Array.isArray(value)) {
    console.warn("   Generated fallback keys:", Object.keys(value).join(", "));
    return value as Record<string, unknown>;
  }
  console.warn("   Generated simple fallback: { content: ... }");
  return { content: value };
};
