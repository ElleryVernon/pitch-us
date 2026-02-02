import { getSlideById, upsertSlide } from "@/server/db/slides";
import { getPresentationById } from "@/server/db/presentations";
import { generateJson, generateText } from "@/server/llm";

import { errorResponse, jsonResponse } from "../utils/responses";

/**
 * Production-grade system prompt for slide JSON editing
 * Maintains professional VC-ready quality
 */
const editSlideSystemPrompt = `You are a professional pitch deck editor specializing in investor presentations for US venture capital audiences.

Your task is to modify the provided slide JSON content according to the user's requirements while maintaining:
- Professional American English suitable for Silicon Valley VCs
- Impactful, concise language (headlines max 8 words, bullets max 10 words)
- Data-driven content with specific metrics where available
- Consistent formatting and structure

Guidelines:
1. Preserve the JSON structure exactly - only modify content values
2. Keep the same data types for each field
3. Improve clarity and impact while following the user's instructions
4. Ensure all text is in professional English

Return ONLY the modified JSON object with no additional text or explanation.`;

/**
 * Production-grade system prompt for HTML editing
 * Ensures clean, semantic HTML output
 */
const htmlEditSystemPrompt = `You are an expert HTML editor for presentation slides.

Your task is to modify HTML content according to the user's requirements while:
- Maintaining clean, semantic HTML structure
- Preserving existing CSS classes and styling hooks
- Ensuring the output remains valid, well-formed HTML
- Keeping content professional and suitable for business presentations

Guidelines:
1. Only modify what is requested - preserve everything else
2. Do not add unnecessary tags or wrappers
3. Keep inline styles minimal
4. Ensure proper nesting and closing of all tags

Return ONLY the modified HTML with no additional text, code blocks, or explanation.`;

/**
 * Production-grade system prompt for slide-to-HTML conversion
 * Converts OXML slide data to clean HTML
 */
const slideToHtmlSystemPrompt = `You are a specialist in converting presentation slides to clean HTML.

Your task is to analyze the provided slide image and OXML data, then generate semantic HTML that:
- Accurately represents the slide's visual layout and content
- Uses clean, minimal HTML structure
- Includes appropriate semantic tags (h1-h6, p, ul, li, etc.)
- Is ready for further styling with CSS

Guidelines:
1. Create a logical heading hierarchy
2. Use lists for bullet points
3. Include image references where appropriate
4. Keep the HTML concise and readable
5. Do not include CSS or JavaScript

Return ONLY the HTML markup with no additional text or code blocks.`;

/**
 * Production-grade system prompt for HTML-to-React conversion
 * Generates clean React TSX components
 */
const htmlToReactSystemPrompt = `You are an expert React developer specializing in converting HTML to React components.

Your task is to convert the provided HTML into a clean, functional React TSX component that:
- Uses proper React conventions and best practices
- Converts HTML attributes to React equivalents (class → className, etc.)
- Uses proper JSX syntax throughout
- Is ready to be used in a Next.js application

Guidelines:
1. Create a functional component with proper TypeScript typing
2. Convert inline styles to React style objects if present
3. Handle event handlers appropriately
4. Ensure all JSX is valid and properly closed
5. Do not include import statements - just the component function
6. Export the component as default

Return ONLY the React component code with no additional text or explanation.`;

/**
 * Payload structure for editing slide JSON content.
 */
type SlideEditPayload = {
  id?: string;
  prompt?: string;
};

/**
 * Payload structure for editing slide HTML content.
 */
type SlideEditHtmlPayload = {
  id?: string;
  html?: string;
  prompt?: string;
};

/**
 * Payload structure for converting slide to HTML.
 */
type SlideToHtmlPayload = {
  image?: string;
  xml?: string;
};

/**
 * Payload structure for converting HTML to React component.
 */
type HtmlToReactPayload = {
  html?: string;
};

/**
 * Payload structure for editing HTML content.
 */
type HtmlEditPayload = {
  html?: string;
  prompt?: string;
};

/**
 * Handles POST requests to edit slide JSON content using AI.
 *
 * Takes a slide's current JSON content and a user's edit instruction, then
 * uses an LLM to modify the content according to the instruction while
 * maintaining the JSON structure and professional quality standards.
 *
 * The function:
 * 1. Fetches the slide and its parent presentation
 * 2. Builds context from the original presentation source (prompt + documents)
 * 3. Sends current slide content and edit instruction to LLM
 * 4. Updates the slide with the modified content
 * 5. Preserves speaker notes if present in the generated content
 *
 * Request body:
 * - `id` (required): Unique identifier of the slide to edit
 * - `prompt` (required): Text instruction describing the desired changes
 *
 * The LLM is instructed to:
 * - Maintain professional VC-ready quality
 * - Preserve JSON structure exactly
 * - Use accurate data from the original source document
 * - Keep text concise and impactful
 *
 * @param request - The HTTP request object containing slide edit data.
 * @returns A JSON response containing the updated slide object with modified content.
 *
 * @throws Returns error responses for:
 *   - 400: Missing required `id` field
 *   - 404: Slide not found
 *
 * @example
 * ```typescript
 * // Request: POST /api/v1/slides/transform/edit-html
 * // Body: { id: "slide-123", prompt: "Change the revenue number to $5M" }
 * const response = await handleSlideEdit(request);
 * // Response: { id: "slide-123", content: { revenue: "$5M", ... }, ... }
 * ```
 */
export const handleSlideEdit = async (request: Request) => {
  const body = (await request.json()) as SlideEditPayload;
  const slideId = body.id;
  if (!slideId) {
    return errorResponse("id is required");
  }
  const slide = await getSlideById(slideId);
  if (!slide) {
    return errorResponse("Slide not found", 404);
  }

  // Get original presentation info and document content
  const presentation = await getPresentationById(slide.presentation);
  let sourceContext = "";

  if (presentation) {
    const documentContent = presentation.document_content || "";
    const userContent = presentation.content || "";

    // Combine user prompt and document content to create original context
    const fullSource = [userContent, documentContent]
      .filter(Boolean)
      .join("\n\n---\n\n");

    if (fullSource.trim()) {
      // Truncate if too long (approx 50,000 character limit)
      const maxLength = 50000;
      const truncatedSource =
        fullSource.length > maxLength
          ? fullSource.substring(0, maxLength) +
            "\n\n[... content truncated ...]"
          : fullSource;

      sourceContext = `## ORIGINAL PITCH DECK SOURCE (Reference for accurate data and context):
${truncatedSource}

`;
    }
  }

  try {
    const userPrompt = `${sourceContext}## CURRENT SLIDE JSON:
${JSON.stringify(slide.content, null, 2)}

## USER'S EDIT REQUEST:
${body.prompt}

## INSTRUCTIONS:
1. Apply the user's requested changes to the slide content
2. If the source document contains relevant data, use accurate numbers and facts from it
3. Maintain the exact JSON structure - do not add or remove fields
4. Keep all text in professional American English
5. Ensure headlines are impactful (max 8 words)
6. Keep bullet points concise (max 10 words each)
7. Return ONLY the modified JSON object`;

    const updatedContent = await generateJson(
      editSlideSystemPrompt,
      userPrompt,
    );
    // Replace while keeping existing slide ID (prevent new addition)
    const updatedSlide = await upsertSlide({
      id: slide.id,
      presentation: slide.presentation,
      layout_group: slide.layout_group,
      layout: slide.layout,
      slide_index: slide.slide_index,
      speaker_note:
        (
          updatedContent as Record<string, unknown>
        ).__speaker_note__?.toString() || slide.speaker_note,
      content: updatedContent as Record<string, unknown>,
      html_content: slide.html_content,
    });
    return jsonResponse(updatedSlide);
  } catch (error) {
    console.error("Slide edit failed:", error);
    return jsonResponse(slide);
  }
};

/**
 * Handles POST requests to edit slide HTML content using AI.
 *
 * Similar to handleSlideEdit but works with HTML content instead of JSON.
 * Takes a slide's HTML content and a user's edit instruction, then uses an
 * LLM to modify the HTML while maintaining structure and semantic correctness.
 *
 * Request body:
 * - `id` (required): Unique identifier of the slide to edit
 * - `html` (optional): HTML content to edit (uses slide's html_content if not provided)
 * - `prompt` (required): Text instruction describing the desired changes
 *
 * @param request - The HTTP request object containing HTML edit data.
 * @returns A JSON response containing the updated slide object with modified HTML.
 *
 * @throws Returns error responses for:
 *   - 400: Missing required fields or no HTML content available
 *   - 404: Slide not found
 */
export const handleSlideEditHtml = async (request: Request) => {
  const body = (await request.json()) as SlideEditHtmlPayload;
  const slideId = body.id;
  if (!slideId) {
    return errorResponse("id is required");
  }
  const slide = await getSlideById(slideId);
  if (!slide) {
    return errorResponse("Slide not found", 404);
  }
  if (!body.html && !slide.html_content) {
    return errorResponse("No HTML to edit");
  }

  // Get original presentation info and document content
  const presentation = await getPresentationById(slide.presentation);
  let sourceContext = "";

  if (presentation) {
    const documentContent = presentation.document_content || "";
    const userContent = presentation.content || "";

    const fullSource = [userContent, documentContent]
      .filter(Boolean)
      .join("\n\n---\n\n");

    if (fullSource.trim()) {
      const maxLength = 50000;
      const truncatedSource =
        fullSource.length > maxLength
          ? fullSource.substring(0, maxLength) +
            "\n\n[... content truncated ...]"
          : fullSource;

      sourceContext = `## ORIGINAL PITCH DECK SOURCE (Reference for accurate data and context):
${truncatedSource}

`;
    }
  }

  try {
    const userPrompt = `${sourceContext}## CURRENT HTML:
${body.html || slide.html_content}

## EDIT REQUEST:
${body.prompt}

## INSTRUCTIONS:
1. Apply the requested changes to the HTML content
2. If the source document contains relevant data, use accurate numbers and facts from it
3. Preserve the overall structure and CSS classes
4. Keep the HTML clean and semantic
5. Ensure proper tag nesting and closing
6. Return ONLY the modified HTML, no code blocks or explanation`;

    const html = await generateText(htmlEditSystemPrompt, userPrompt);
    // Replace while keeping existing slide ID (prevent new addition)
    const updated = await upsertSlide({
      ...slide,
      id: slide.id,
      html_content: html,
      content: slide.content,
    });
    return jsonResponse(updated);
  } catch (error) {
    console.error("Slide HTML edit failed:", error);
    return jsonResponse(slide);
  }
};

/**
 * Handles POST requests to convert slide image/OXML data to HTML.
 *
 * Takes a slide image (screenshot) and optional OXML (Office Open XML) data,
 * then uses an LLM to analyze the visual structure and generate semantic HTML
 * that represents the slide's content and layout.
 *
 * This is useful for importing slides from PowerPoint files or converting
 * slide images into editable HTML format.
 *
 * Request body:
 * - `image` (required): Path or URL to the slide image
 * - `xml` (optional): OXML data from PowerPoint file
 *
 * @param request - The HTTP request object containing conversion data.
 * @returns A JSON response containing:
 *   - `success`: Boolean indicating operation success
 *   - `html`: Generated HTML markup representing the slide
 *
 * @throws Returns error responses for:
 *   - 400: Missing required `image` field
 *   - 500: Conversion failed
 */
export const handleSlideToHtml = async (request: Request) => {
  const body = (await request.json()) as SlideToHtmlPayload;
  if (!body.image) {
    return errorResponse("image is required");
  }
  try {
    const userPrompt = `## SLIDE IMAGE PATH:
${body.image}

## OXML DATA (if available):
${body.xml || "No OXML data provided"}

## INSTRUCTIONS:
1. Analyze the slide structure and content
2. Generate clean, semantic HTML that represents the slide
3. Use appropriate heading tags (h1-h6) for titles
4. Use unordered lists for bullet points
5. Include image references with proper alt text
6. Keep the HTML minimal and well-structured
7. Return ONLY the HTML markup, no code blocks or explanation`;

    const html = await generateText(slideToHtmlSystemPrompt, userPrompt);
    return jsonResponse({ success: true, html });
  } catch (error) {
    console.error("Slide to HTML failed:", error);
    return jsonResponse(
      { success: false, detail: "Failed to convert slide" },
      500,
    );
  }
};

/**
 * Handles POST requests to convert HTML to a React TSX component.
 *
 * Takes HTML markup and converts it to a React functional component with
 * proper TypeScript typing. This is useful for creating reusable slide
 * components from HTML templates.
 *
 * The conversion:
 * - Converts HTML attributes to React equivalents (class → className)
 * - Converts inline styles to React style objects
 * - Ensures proper JSX syntax
 * - Adds TypeScript type annotations
 *
 * Request body:
 * - `html` (required): HTML markup to convert
 *
 * @param request - The HTTP request object containing HTML to convert.
 * @returns A JSON response containing:
 *   - `success`: Boolean indicating operation success
 *   - `react_component`: Generated React TSX component code
 *
 * @throws Returns error responses for:
 *   - 400: Missing required `html` field
 *   - 500: Conversion failed
 */
export const handleHtmlToReact = async (request: Request) => {
  const body = (await request.json()) as HtmlToReactPayload;
  if (!body.html) {
    return errorResponse("html is required");
  }
  try {
    const userPrompt = `## HTML TO CONVERT:
${body.html}

## INSTRUCTIONS:
1. Convert the HTML to a React functional component
2. Use TypeScript with proper type annotations
3. Convert class attributes to className
4. Convert inline styles to React style objects
5. Ensure all JSX is valid and properly formatted
6. Export the component as default
7. Do not include import statements
8. Return ONLY the component code, no code blocks or explanation

## EXAMPLE OUTPUT FORMAT:
const SlideComponent = () => {
  return (
    <div className="slide">
      ...content...
    </div>
  );
};

export default SlideComponent;`;

    const component = await generateText(htmlToReactSystemPrompt, userPrompt);
    return jsonResponse({ success: true, react_component: component });
  } catch (error) {
    console.error("HTML to React failed:", error);
    return jsonResponse(
      { success: false, detail: "Failed to convert HTML" },
      500,
    );
  }
};

/**
 * Handles POST requests to edit HTML content using AI.
 *
 * Takes HTML markup and a user's edit instruction, then uses an LLM to
 * modify the HTML according to the instruction while maintaining semantic
 * structure and CSS classes.
 *
 * Request body:
 * - `html` (required): HTML content to edit
 * - `prompt` (required): Text instruction describing the desired changes
 *
 * @param request - The HTTP request object containing HTML edit data.
 * @returns A JSON response containing:
 *   - `success`: Boolean indicating operation success
 *   - `edited_html`: Modified HTML markup
 *
 * @throws Returns error responses for:
 *   - 400: Missing required fields
 *   - 500: Edit operation failed
 */
export const handleHtmlEdit = async (request: Request) => {
  const body = (await request.json()) as HtmlEditPayload;
  if (!body.html || !body.prompt) {
    return errorResponse("html and prompt are required");
  }
  try {
    const userPrompt = `## CURRENT HTML:
${body.html}

## EDIT REQUEST:
${body.prompt}

## INSTRUCTIONS:
1. Apply the requested changes to the HTML
2. Maintain clean, semantic HTML structure
3. Preserve existing CSS classes unless specifically asked to change them
4. Ensure proper tag nesting and closing
5. Keep the output minimal and well-formatted
6. Return ONLY the modified HTML, no code blocks or explanation`;

    const html = await generateText(htmlEditSystemPrompt, userPrompt);
    return jsonResponse({ success: true, edited_html: html });
  } catch (error) {
    console.error("HTML edit failed:", error);
    return jsonResponse({ success: false, detail: "Failed to edit HTML" }, 500);
  }
};
