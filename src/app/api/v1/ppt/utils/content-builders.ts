import { jsonrepair } from "jsonrepair";
import { generateImageFromPrompt } from "@/server/images";
import { generateJson, generateJsonStream } from "@/server/llm";
import { buildDataFromSchema } from "@/server/schema";
import { toAppDataUrl } from "./storage";
import {
  ImageField,
  Outline,
  SlideDeltaHandler,
  SlideSchema,
} from "../types/streaming";
import {
  PLACEHOLDER_TEXT,
  TRANSPARENT_IMAGE_DATA_URL,
} from "./constants";
import { createSlideDeltaParser } from "./delta-parsers";

/**
 * Sanitizes and repairs malformed JSON from LLM responses.
 *
 * LLMs sometimes return JSON wrapped in markdown code fences or with minor
 * syntax errors. This function cleans the input and attempts to repair
 * common JSON issues like trailing commas, unescaped control characters,
 * and missing quotes.
 *
 * Process:
 * 1. Trims whitespace
 * 2. Removes markdown code fences (```json ... ```)
 * 3. Uses jsonrepair library to fix syntax errors
 *
 * @param input - Raw JSON string from LLM, potentially wrapped in markdown
 *   or containing syntax errors.
 * @returns A cleaned and repaired JSON string that should be parseable.
 *
 * @example
 * ```typescript
 * const raw = "```json\n{ \"key\": \"value\", }\n```";
 * const cleaned = sanitizeAndRepairJson(raw);
 * // Returns: "{ \"key\": \"value\" }"
 * ```
 */
export const sanitizeAndRepairJson = (input: string): string => {
  let cleaned = input.trim();
  // Strip markdown code fences if present
  const fencedMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch) {
    cleaned = fencedMatch[1].trim();
  }
  // Use jsonrepair to fix malformed JSON (control chars, trailing commas, etc.)
  return jsonrepair(cleaned);
};

/**
 * Production-grade system prompt for pitch deck outline generation
 * Modern enterprise style (Toss/OpenAI/Chronicle) for US VC audience
 */
const OUTLINES_SYSTEM_PROMPT = `You are a YC Group Partner reviewing pitch decks. Generate outlines that would pass YC and 500 Startups screening.

## DESIGN PHILOSOPHY
1. ONE NUMBER PER SLIDE - Each slide has ONE hero metric
2. 3-SECOND RULE - Instant comprehension
3. DATA AS DESIGN - Numbers ARE the visual
4. NO FLUFF - Every word must earn its place

## YC STANDARD SLIDE ORDER (MUST follow exactly):

1. INTRO - "[What] for [Who]" tagline
   VC looks for: Instant clarity on what you do
   GOOD: "Stripe for Healthcare" | BAD: "Innovative Platform"
   Outline example: "INTRO: K-Beauty Commerce for US Retailers - connecting Korean brands to American stores"

2. PROBLEM - ONE pain + ONE shocking stat
   VC looks for: Is this pain real? How big?
   Include: Source for stat (KOTRA, Gartner, etc.)
   Outline example: "PROBLEM: Hero $2.3B - US retailers lose $2.3B/yr failing to source K-beauty (KOTRA 2024)"

3. SOLUTION - "We [verb] X" + 3 outcomes
   VC looks for: Does it directly solve the problem?
   Outline example: "SOLUTION: We connect brands to buyers - 3x faster sourcing, verified quality, zero inventory risk"

4. MARKET - TAM as hero + SAM/SOM
   VC looks for: Is it big enough? Bottom-up math?
   Outline example: "MARKET: Hero $48B TAM - Global K-beauty $48B, US import $8B SAM, Initial $800M SOM"

5. TRACTION - MRR or ARR (realistic for stage)
   VC looks for: Hockey stick? Retention? Unit economics improving?
   SEED REALITY: $10K-100K MRR typical, NOT millions
   RED FLAG: $100M+ revenue at Seed = instant reject
   Outline example: "TRACTION: Hero $85K MRR - 127% MoM growth, 3 enterprise pilots, 94% retention"

6. BUSINESS MODEL - Revenue model + unit economics
   VC looks for: How do you make money? Path to profitability?
   Outline example: "BUSINESS MODEL: SaaS + transaction fee - $99/mo base + 2.9% GMV, LTV:CAC 4.2x"

7. COMPETITION - Your unique position
   VC looks for: Why will YOU win? (NOT competitor bashing)
   Outline example: "COMPETITION: Only player with verified sales data - vs. Influencer DBs (no proof), Agencies (high cost)"

8. TEAM - 3 people, founder-market fit
   VC looks for: Why is THIS team the one to win?
   Format: "Ex-[Company], [specific achievement]"
   Outline example: "TEAM: CEO Ex-Amazon (scaled K-beauty $50M), CTO Ex-Stripe (payments infra), COO Ex-Coupang"

9. ROADMAP - 3 phases, H1/H2 format
   VC looks for: Realistic milestones? Clear priorities?
   Outline example: "ROADMAP: H1 2026 beta + 10 brands, H2 2026 $500K ARR, 2027 Series A"

10. ASK - Funding + 3 use-of-funds
    VC looks for: Clear ask, specific allocation
    Outline example: "ASK: $2M Seed - 40% product, 35% GTM, 25% ops - target $1M ARR in 18mo"

## RED FLAGS TO AVOID:
- Generic taglines ("AI-powered solution")
- Unrealistic traction ($100M revenue at Seed)
- Number ranges ("$500M-$800M")
- Missing sources for market data
- "We have no competitors"
- Full sentences instead of phrases

## Output Format:
Return ONLY valid JSON:
{
  "slides": [
    { "content": "INTRO: [tagline] - [one line context]" },
    { "content": "PROBLEM: Hero [stat] - [pain point with source]" },
    ...
  ]
}

CRITICAL:
- No code fences, no markdown
- English only. Translate non-English terms; romanize names into Latin characters (no Hangul).
- Numbers: $48B, $1.8M, 127% (NO ranges)
- Each outline: 1 sentence with hero element identified`;

/**
 * Production-grade system prompt for slide content generation
 * Modern enterprise style (Toss/OpenAI/Chronicle) for US VC
 */
const SLIDES_SYSTEM_PROMPT = `You are an elite pitch deck designer creating presentations for US VCs (YC, Sequoia, a16z).

CRITICAL: Generate content for ONE SINGLE SLIDE. Return a SINGLE JSON object.

## DESIGN RULES (Toss/OpenAI Style)
1. ONE HERO ELEMENT per slide - one dominant number
2. 3-SECOND RULE - instant comprehension
3. MINIMAL TEXT - numbers speak, words support
4. SINGLE VALUES ONLY - never "$X-$Y" ranges
5. NO REDUNDANCY - NEVER show the same number/metric twice on one slide (e.g., if hero stat shows "$6.7B", title must NOT include "$6.7B")

## CHARACTER LIMITS (STRICT)
- Headlines: 25 chars max
- Subtitles: 40 chars max (or OMIT entirely)
- Bullet points: 35 chars each
- Descriptions: 50 chars max
- Value fields: 8 chars max ("$48B", "$1.2M", "127%")
- Total per slide: Under 150 chars

## SLIDE-SPECIFIC RULES:

### INTRO
- title: "[What] for [Who]" format, 4-5 words
  GOOD: "Stripe for Healthcare", "AI Legal Assistant"
  BAD: "UGC Sales Platform", "Innovative Solution"
- subtitle: 2-3 words max ("Seed Round")
- summary: 1 sentence, 12 words max
- NEVER start with "We provide...", "Our platform...", "A solution..."

### PROBLEM
- title: Short + impactful, NO numbers in title ("The Hidden Gap", "Why Now")
- highlightStat.value: 8 chars max ("$47B", "18 days") - THIS is the hero number
- highlightStat.label: 3 words max ("Annual loss")
- painPoints: 3 items, 6 words each max
- NEVER repeat the same number in title AND highlightStat - title describes problem, stat quantifies it

### SOLUTION
- title: "We [verb] X" format, 5 words max
- pillars: 3 items, title 2 words, description 8 words

### MARKET
- title: 2-3 words ("Market Size", "The Opportunity") - NO specific numbers in title
- subtitle: OMIT or 5 words max, NO sentences, NO numbers
- segments: TAM/SAM/SOM - these are the hero elements
  - value: SINGLE number ("$48B", NOT "$45B-$50B")
  - note: 2-3 words ("Creator economy")
- NEVER put TAM/SAM/SOM numbers in title or subtitle

### TRACTION (CRITICAL - VC will scrutinize)
- title: 3 words max, NO metrics in title ("Our Growth", "Traction")
- metrics: Show REALISTIC numbers for stage - these are the hero elements
  - Seed stage: $10K-$100K MRR typical, NOT millions
  - value: "$85K", "127%", "3.2mo" (8 chars max)
  - change: "+18% MoM" format
- chartData: 4-6 points, raw numbers (50, 85, 120), NOT inflated
- NEVER put specific numbers in title that appear in metrics

### BUSINESS MODEL
- revenueStreams: 3 items
  - price: "$99/mo", "2.9% fee" format
  - notes: 4 words max
- unitEconomics: realistic for stage

### COMPETITION
- positioning: 1 sentence, 12 words max
- competitors: 3 items, strength/gap 3 words each
- edges: 3 items, 5 words each

### TEAM
- members: 3 people MAX
  - role: 2 words ("CEO", "CTO")
  - background: 8 words max, "Ex-[Company]" format
- advisors: 2 items, 4 words each

### ROADMAP
- phases: 3 items
  - timeline: "H1 2026", "Q3 2026" format
  - goals: 2 items, 4 words each

### ASK
- title: Action-focused, NO amount in title ("The Ask", "Join Our Round", "Partner With Us")
- amount: "$2M Seed" format - THIS is the hero number, displayed prominently
- runway: 2 words ("18mo runway")
- useOfFunds: 3 items, 4 words each
- milestones: 2 items, specific metrics
- NEVER repeat the raise amount in both title AND amount field - keep title generic, amount is the hero

## DATA RULES
- Chart mrr: raw numbers (50, 85, 120)
- Display values: "$85K", "127%", "+22%"
- Max 8 chars per value field

## OUTPUT RULES
- Return SINGLE flat JSON matching schema
- Do NOT wrap in code fences
- Do NOT use markdown (no asterisks)
- English only. Translate non-English terms; romanize names into Latin characters (no Hangul).
- NEVER use number ranges
- Keep ALL text compact`;

/**
 * Type guard to check if an object is an image field structure.
 *
 * Image fields in slide content have a special structure with __image_prompt__
 * and __image_url__ fields. This function identifies such objects so they can
 * be processed to generate actual images.
 *
 * @param obj - The object to check.
 * @returns True if the object has the structure of an ImageField (contains
 *   __image_prompt__ as a non-empty string).
 */
const isImageField = (obj: unknown): obj is ImageField => {
  if (typeof obj !== "object" || obj === null) return false;
  const record = obj as Record<string, unknown>;
  return (
    typeof record.__image_prompt__ === "string" &&
    record.__image_prompt__.length > 0
  );
};

/**
 * Checks if a JSON schema defines image fields.
 *
 * Determines if a schema has both __image_url__ and __image_prompt__ properties,
 * indicating that slides using this schema should include image generation.
 *
 * @param schema - The JSON schema to check.
 * @returns True if the schema contains both image field properties.
 */
const isImageSchema = (schema: SlideSchema): boolean => {
  return Boolean(
    schema.properties?.__image_url__ && schema.properties?.__image_prompt__,
  );
};

/**
 * Generates placeholder content that matches a JSON schema structure.
 *
 * Creates default/empty values for all fields defined in a schema, recursively
 * handling nested objects and arrays. This is used to create initial placeholder
 * slides before content is generated, ensuring the UI can display the slide
 * structure immediately.
 *
 * Value generation rules:
 * - enum: Uses first enum value
 * - string: Uses PLACEHOLDER_TEXT (single space)
 * - number/integer: Uses 0
 * - boolean: Uses false
 * - array: Creates array with preferred count (minItems, maxItems, or 3)
 * - object: Recursively processes all properties
 * - image schema: Creates image field with transparent placeholder
 *
 * @param schema - JSON schema object defining the structure to generate.
 * @returns A data structure matching the schema with placeholder values.
 *   The structure matches the schema exactly but with default/empty values.
 *
 * @example
 * ```typescript
 * const schema = {
 *   type: "object",
 *   properties: {
 *     title: { type: "string" },
 *     items: { type: "array", items: { type: "string" }, minItems: 2 }
 *   }
 * };
 * const placeholder = buildPlaceholderFromSchema(schema);
 * // Returns: { title: " ", items: [" ", " "] }
 * ```
 */
export const buildPlaceholderFromSchema = (schema: SlideSchema): unknown => {
  if (schema.enum && schema.enum.length > 0) {
    return schema.enum[0];
  }
  if (schema.type === "string") return PLACEHOLDER_TEXT;
  if (schema.type === "number" || schema.type === "integer") return 0;
  if (schema.type === "boolean") return false;
  if (schema.type === "array") {
    const itemSchema = schema.items ?? {};
    const minItems =
      typeof schema.minItems === "number" ? schema.minItems : undefined;
    const maxItems =
      typeof schema.maxItems === "number" ? schema.maxItems : undefined;
    const preferredCount =
      typeof minItems === "number" && minItems > 0
        ? minItems
        : typeof maxItems === "number" && maxItems > 0
          ? maxItems
          : 3;
    const count = Math.max(1, Math.min(preferredCount, 6));
    return Array.from({ length: count }, () =>
      buildPlaceholderFromSchema(itemSchema),
    );
  }
  const props = schema.properties ?? {};
  if (isImageSchema(schema)) {
    return {
      __image_url__: TRANSPARENT_IMAGE_DATA_URL,
      __image_prompt__: PLACEHOLDER_TEXT,
    };
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    result[key] = buildPlaceholderFromSchema(value as SlideSchema);
  }
  return result;
};

/**
 * Processes image fields in slide content by generating or fetching actual images.
 *
 * Recursively traverses slide content to find image fields (objects with
 * __image_prompt__), generates images from the prompts using AI, and replaces
 * the image fields with actual image URLs. Handles nested structures including
 * objects and arrays.
 *
 * Process:
 * 1. Traverses content recursively (objects and arrays)
 * 2. Identifies image fields by checking for __image_prompt__
 * 3. Generates image from prompt (with retry logic)
 * 4. Replaces __image_url__ with generated image URL
 * 5. Returns processed content with all images resolved
 *
 * Error handling:
 * - Retries image generation up to 2 times on failure
 * - If all retries fail, sets __image_url__ to empty string (template fallback used)
 * - Continues processing other images even if one fails
 *
 * @param content - Slide content object (potentially nested) containing image fields.
 * @returns Promise that resolves to the same content structure with all
 *   __image_url__ fields populated with actual image URLs (or empty strings
 *   if generation failed).
 *
 * @example
 * ```typescript
 * const content = {
 *   title: "Slide Title",
 *   heroImage: { __image_prompt__: "sunset over mountains", __image_url__: "" }
 * };
 * const processed = await processImagesInContent(content);
 * // Returns: { title: "Slide Title", heroImage: { __image_url__: "/app_data/images/..." } }
 * ```
 */
export const processImagesInContent = async (
  content: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const processValue = async (value: unknown): Promise<unknown> => {
    // Handle arrays
    if (Array.isArray(value)) {
      return Promise.all(value.map(processValue));
    }

    // Handle objects
    if (typeof value === "object" && value !== null) {
      const obj = value as Record<string, unknown>;

      // If it's an image field, fetch the image
      if (isImageField(obj)) {
        const prompt = obj.__image_prompt__ as string;
        const maxRetries = 2;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const imageResult = await generateImageFromPrompt(prompt);
            // Use Supabase URL (https://) as-is, convert local paths
            const imageUrl = imageResult.startsWith("http")
              ? imageResult
              : toAppDataUrl(imageResult);
            return {
              ...obj,
              __image_url__: imageUrl,
            };
          } catch (error) {
            if (attempt === maxRetries) {
              // All attempts failed - return empty URL (template's fallback image will be used)
              return {
                ...obj,
                __image_url__: "",
              };
            }
            // Wait before retry
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
        return obj; // fallback (should not reach here)
      }

      // For regular objects, process recursively
      const processed: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(obj)) {
        processed[key] = await processValue(val);
      }
      return processed;
    }

    // Return primitive values (string, number, boolean, etc.) as-is
    return value;
  };

  return (await processValue(content)) as Record<string, unknown>;
};

/**
 * Builds pitch deck outlines from document content and optional user prompt.
 *
 * Generates slide outlines (high-level descriptions) using an LLM. The function
 * prioritizes document content as the primary source of information, with user
 * prompt as additional instructions. If LLM generation fails, falls back to
 * a simple sentence-based extraction method.
 *
 * Process:
 * 1. If no content provided: returns placeholder outlines ("Slide 1", "Slide 2", etc.)
 * 2. Builds comprehensive prompt with document content and requirements
 * 3. Sends to LLM with VC pitch deck system prompt
 * 4. Parses JSON response to extract outlines
 * 5. If generation fails: falls back to sentence extraction from content
 *
 * The generated outlines follow VC pitch deck standards:
 * - Each outline identifies a hero element (one key metric)
 * - Uses concise, impactful language
 * - Extracts exact metrics from source documents
 * - Follows YC standard slide order
 *
 * @param promptContent - User-provided text prompt with instructions.
 *   Can be empty if only document content is available.
 * @param documentContent - Extracted text from uploaded files (PDF, DOCX, etc.).
 *   Used as the primary source of information for outline generation.
 * @param nSlides - Target number of slides to generate outlines for.
 * @returns Promise that resolves to an array of Outline objects, each containing
 *   a `content` field with a text description of the slide.
 *
 * @example
 * ```typescript
 * const outlines = await buildOutlines(
 *   "Focus on growth metrics",
 *   "Company revenue: $10M ARR, 200% YoY growth...",
 *   12
 * );
 * // Returns: [{ content: "INTRO: ..." }, { content: "PROBLEM: ..." }, ...]
 * ```
 */
export const buildOutlines = async (
  promptContent: string,
  documentContent: string,
  nSlides: number,
): Promise<Outline[]> => {
  // If no content at all, return placeholder slides
  if (!promptContent && !documentContent) {
    return Array.from({ length: nSlides }, (_, idx) => ({
      content: `Slide ${idx + 1}`,
    }));
  }

  try {
    // Build the user prompt with document content as primary source
    let userPrompt = "";

    if (documentContent) {
      userPrompt += `## SOURCE DOCUMENT CONTENT:\n${documentContent}\n\n`;
    }

    if (promptContent) {
      userPrompt += `## ADDITIONAL INSTRUCTIONS FROM USER:\n${promptContent}\n\n`;
    }

    userPrompt += `## REQUIREMENTS (Modern Toss/OpenAI Style):
- Number of slides: ${nSlides}
- Language: English (US)
- Audience: US Venture Capital investors (Sequoia, a16z, YC)

## CRITICAL INSTRUCTIONS:
1. Each outline MUST identify the HERO ELEMENT (ONE big number/stat)
2. Headlines: 3-5 words MAX, create intrigue
3. Extract EXACT metrics from source: "$48B", "$1.2M ARR", "+127%"
4. NEVER use ranges like "$X-$Y" - pick ONE specific number
5. Format: "[SLIDE TYPE] - Hero: [METRIC] | Supporting: [2-3 points]"
6. If source lacks data, use placeholder: "[HERO: $XM needed]"
7. NO paragraphs, NO markdown formatting
8. English only. Translate non-English terms; romanize names into Latin characters (no Hangul).

## OUTPUT FORMAT:
Return JSON: { "slides": [{ "content": "..." }, ...] }
Do NOT wrap in code fences.

Generate a modern, data-forward pitch deck outline.`;

    const json = await generateJson(OUTLINES_SYSTEM_PROMPT, userPrompt);
    const parsed = json as { slides?: Outline[] };

    if (Array.isArray(parsed.slides) && parsed.slides.length > 0) {
      return parsed.slides;
    }
  } catch (error) {
    console.error("Outline generation failed:", error);
  }

  // Fallback: Create basic outlines from content
  const sourceContent = documentContent || promptContent;
  const sentences = sourceContent
    .split(/[\n\.]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => s.length > 10);

  const slides = Array.from({ length: nSlides }, (_, idx) => ({
    content:
      sentences[idx] || `Slide ${idx + 1}: Key point from your pitch deck`,
  }));

  return slides;
};

/**
 * Builds the user prompt for LLM-based slide content generation.
 *
 * Constructs a comprehensive prompt that includes:
 * - Current date/time in US Pacific timezone (for time-sensitive content)
 * - Source document content (truncated to token limits)
 * - Slide outline (what the slide should contain)
 * - JSON schema (structure the content must match)
 * - Detailed instructions for VC-ready content generation
 *
 * The prompt is designed to guide the LLM to generate content that:
 * - Matches the provided JSON schema exactly
 * - Uses accurate data from source documents
 * - Follows VC pitch deck quality standards
 * - Stays within character limits for each field type
 *
 * @param outline - Text description of what the slide should contain.
 * @param schema - JSON schema object defining the structure of slide content.
 * @param sourceDocument - Optional extracted text from uploaded documents.
 *   Truncated to 8000 characters to stay within token limits.
 * @returns A formatted string prompt ready to send to the LLM.
 */
const buildSlideUserPrompt = (
  outline: string,
  schema: Record<string, unknown>,
  sourceDocument?: string,
): string => {
  // Current date and time in US Pacific Time Zone (PST/PDT)
  const usDateTime = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  // Include source document if available, use only beginning if too long (token limit consideration)
  const maxSourceLength = 8000;
  const truncatedSource = sourceDocument
    ? sourceDocument.length > maxSourceLength
      ? sourceDocument.substring(0, maxSourceLength) +
        "\n\n[... content truncated ...]"
      : sourceDocument
    : "";

  const sourceSection = truncatedSource
    ? `## SOURCE DOCUMENT (Reference for accurate data and context):
${truncatedSource}

`
    : "";

  return `## CURRENT DATE & TIME (US Pacific):
${usDateTime}

${sourceSection}## SLIDE OUTLINE:
${outline}

## JSON SCHEMA TO FOLLOW:
${JSON.stringify(schema, null, 2)}

## CRITICAL INSTRUCTIONS (YC/500 Startups Standard):
1. IDENTIFY slide type and HERO ELEMENT (one dominant number)
2. CHARACTER LIMITS:
   - Headlines: 25 chars | Subtitles: 40 chars or OMIT
   - Bullets: 35 chars | Values: 8 chars max
3. NUMBER FORMATS: $48B, $1.2M, 127% (SINGLE values only)
4. NEVER use ranges ("$615M-$923M") - pick ONE number
5. TRACTION REALITY (Seed stage = $10K-100K MRR, NOT millions)
6. INTRO format: "[What] for [Who]" (e.g., "Stripe for Healthcare")
7. NO markdown (no asterisks), NO full sentences in subtitles
8. English only. Translate non-English terms; romanize names into Latin characters (no Hangul).
9. Extract from source, use realistic placeholders if missing
10. Total text: UNDER 150 chars per slide
11. Return flat JSON, no code fences.`;
};

/**
 * Generates slide content based on outline, schema, and source document.
 *
 * Uses an LLM to generate structured slide content that matches a JSON schema.
 * The content is generated to be professional, VC-ready, and follows the
 * outline's description while using accurate data from source documents.
 *
 * Process:
 * 1. Builds comprehensive prompt with outline, schema, and source document
 * 2. Sends to LLM with slide generation system prompt
 * 3. Parses JSON response
 * 4. Returns generated content matching the schema
 *
 * Error handling:
 * - If generation fails, falls back to schema-based placeholder content
 * - Uses buildDataFromSchema to create basic structure from schema
 *
 * @param outline - Text description of what the slide should contain.
 * @param schema - JSON schema object defining the structure of slide content.
 *   The generated content will match this schema exactly.
 * @param slideIndex - Optional zero-based index of the slide (for logging).
 * @param sourceDocument - Optional extracted text from uploaded documents.
 *   Used as context for generating accurate, data-driven content.
 * @returns Promise that resolves to a Record object matching the schema
 *   structure with generated content values.
 *
 * @example
 * ```typescript
 * const content = await buildSlideContent(
 *   "PROBLEM: Hero $2.3B - US retailers lose money...",
 *   { properties: { title: {...}, highlightStat: {...} } },
 *   1,
 *   "Document content..."
 * );
 * // Returns: { title: "The Hidden Gap", highlightStat: { value: "$2.3B", ... }, ... }
 * ```
 */
export const buildSlideContent = async (
  outline: string,
  schema: Record<string, unknown>,
  slideIndex?: number,
  sourceDocument?: string,
): Promise<Record<string, unknown>> => {
  try {
    const userPrompt = buildSlideUserPrompt(outline, schema, sourceDocument);
    const json = await generateJson(SLIDES_SYSTEM_PROMPT, userPrompt);
    return json as Record<string, unknown>;
  } catch (error) {
    console.error(
      `Slide content generation failed for slide ${slideIndex ?? "?"}:`,
      error,
    );
    return buildDataFromSchema(schema || {}, outline);
  }
};

/**
 * Generates slide content with real-time streaming support.
 *
 * Similar to buildSlideContent but uses streaming JSON generation to send
 * incremental updates as content is generated. This provides a responsive
 * user experience where fields appear progressively rather than all at once.
 *
 * Process:
 * 1. Builds comprehensive prompt with outline, schema, and source document
 * 2. Streams JSON tokens from LLM as they arrive
 * 3. Uses delta parser to extract field values from JSON stream
 * 4. Calls onDelta callback for each field update
 * 5. Accumulates tokens to build complete JSON
 * 6. Repairs and parses final JSON
 * 7. Returns complete content object
 *
 * The delta parser tracks JSON structure and extracts field values (e.g., "title",
 * "subtitle.value") as they become available, allowing the UI to update
 * incrementally.
 *
 * Error handling:
 * - If streaming fails, falls back to schema-based placeholder content
 * - Delta updates may be incomplete if generation fails mid-stream
 *
 * @param outline - Text description of what the slide should contain.
 * @param schema - JSON schema object defining the structure of slide content.
 * @param slideIndex - Zero-based index of the slide (used in delta updates).
 * @param sourceDocument - Optional extracted text from uploaded documents.
 * @param onDelta - Callback function called for each field update during streaming.
 *   Receives an object with `index`, `path` (field path like "title" or "items[0].value"),
 *   and `value` (current field value as a string).
 * @returns Promise that resolves to a Record object matching the schema
 *   structure with generated content values.
 *
 * @example
 * ```typescript
 * const content = await buildSlideContentStream({
 *   outline: "PROBLEM: Hero $2.3B...",
 *   schema: { properties: { title: {...} } },
 *   slideIndex: 1,
 *   sourceDocument: "...",
 *   onDelta: ({ index, path, value }) => {
 *     console.log(`Slide ${index}, field ${path}: ${value}`);
 *   }
 * });
 * ```
 */
export const buildSlideContentStream = async ({
  outline,
  schema,
  slideIndex,
  sourceDocument,
  onDelta,
}: {
  outline: string;
  schema: Record<string, unknown>;
  slideIndex: number;
  sourceDocument?: string;
  onDelta: SlideDeltaHandler;
}): Promise<Record<string, unknown>> => {
  try {
    const userPrompt = buildSlideUserPrompt(outline, schema, sourceDocument);
    const deltaParser = createSlideDeltaParser({
      slideIndex,
      minIntervalMs: 40,
      onDelta,
    });
    let accumulatedJson = "";

    for await (const token of generateJsonStream(
      SLIDES_SYSTEM_PROMPT,
      userPrompt,
    )) {
      accumulatedJson += token;
      deltaParser.push(token);
    }

    const repairedJson = sanitizeAndRepairJson(accumulatedJson);
    const parsed = JSON.parse(repairedJson) as Record<string, unknown>;
    return parsed;
  } catch (error) {
    console.error(`Slide stream failed for slide ${slideIndex}:`, error);
    return buildDataFromSchema(schema || {}, outline);
  }
};
