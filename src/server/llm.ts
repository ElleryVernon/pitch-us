/**
 * LLM (Large Language Model) integration for content generation.
 *
 * This module provides functions for interacting with LLM services (primarily
 * OpenRouter) to generate text and JSON content for presentations. It handles
 * client initialization, model configuration, JSON parsing and repair, and
 * provides both synchronous and streaming interfaces for content generation.
 *
 * The module uses OpenRouter as a unified interface to access multiple LLM
 * providers, with support for custom models, API keys, and request headers.
 */

import OpenAI from "openai";
import { jsonrepair } from "jsonrepair";
import { getRuntimeConfig } from "./config";

/**
 * Creates and returns an OpenRouter client instance.
 *
 * Initializes an OpenAI-compatible client configured to use OpenRouter's API.
 * OpenRouter provides access to multiple LLM providers through a unified
 * interface. The client is configured with API key and optional headers
 * (HTTP-Referer and X-Title) for API identification.
 *
 * This function reads configuration from environment variables and throws
 * an error if the API key is not configured.
 *
 * @returns A configured OpenAI client instance pointing to OpenRouter's API.
 * @throws {Error} Throws an error if OPENROUTER_API_KEY is not configured
 *   in environment variables.
 *
 * @remarks
 * The client uses OpenAI's SDK but connects to OpenRouter's endpoint, allowing
 * access to models from multiple providers (OpenAI, Anthropic, etc.) through
 * a single API.
 */
const getOpenRouterClient = () => {
  const config = getRuntimeConfig();
  if (!config.OPENROUTER_API_KEY) {
    console.error("❌ OPENROUTER_API_KEY is not configured in environment");
    console.error("Please set OPENROUTER_API_KEY in your .env file");
    throw new Error("OPENROUTER_API_KEY is not configured");
  }
  const headers: Record<string, string> = {};
  if (config.OPENROUTER_SITE_URL) {
    headers["HTTP-Referer"] = config.OPENROUTER_SITE_URL;
  }
  if (config.OPENROUTER_APP_NAME) {
    headers["X-Title"] = config.OPENROUTER_APP_NAME;
  }
  return new OpenAI({
    apiKey: config.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: Object.keys(headers).length ? headers : undefined,
  });
};

/**
 * Gets the configured LLM model for general text generation.
 *
 * Retrieves the model identifier from configuration, with a default fallback
 * if not specified. This model is used for most content generation tasks
 * unless a specific model is required (e.g., outline generation).
 *
 * @returns Model identifier string (e.g., "openai/gpt-4.1-mini"). Defaults
 *   to "openai/gpt-4.1-mini" if not configured.
 */
const getOpenRouterModel = () => {
  const config = getRuntimeConfig();
  const model = config.OPENROUTER_MODEL || "openai/gpt-4.1-mini";
  return model;
};

/**
 * Gets the configured LLM model for outline generation.
 *
 * Retrieves the model identifier specifically configured for outline generation,
 * or falls back to the general model if not specified. Outline generation may
 * benefit from different models optimized for structured output.
 *
 * @returns Model identifier string. Uses OPENROUTER_OUTLINE_MODEL if configured,
 *   otherwise falls back to the general model from getOpenRouterModel().
 */
export const getOutlineModel = () => {
  const config = getRuntimeConfig();
  const model = config.OPENROUTER_OUTLINE_MODEL || getOpenRouterModel();
  return model;
};

/**
 * Sanitizes and repairs malformed JSON from LLM responses.
 *
 * LLMs sometimes return JSON wrapped in markdown code fences or with formatting
 * issues. This function cleans the input and attempts to repair common JSON
 * problems before parsing. It handles:
 * - Markdown code fences (```json ... ```)
 * - Control characters and encoding issues
 * - Trailing commas and other syntax errors
 * - Whitespace and formatting issues
 *
 * Uses the jsonrepair library to fix malformed JSON that would otherwise fail
 * to parse. This is critical for reliable JSON extraction from LLM responses.
 *
 * @param input - Raw string response from the LLM that should contain JSON.
 *   May include markdown formatting, code fences, or malformed JSON.
 * @returns Cleaned and repaired JSON string that should be parseable by
 *   JSON.parse(). The string is trimmed and has code fences removed.
 *
 * @example
 * ```typescript
 * const raw = "```json\n{ \"key\": \"value\", }\n```";
 * const cleaned = sanitizeAndRepairJson(raw);
 * // Returns: '{"key":"value"}'
 * ```
 */
const sanitizeAndRepairJson = (input: string): string => {
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
 * Generates structured JSON content using an LLM.
 *
 * Sends prompts to the LLM with a JSON response format requirement and returns
 * the parsed JSON object. This function is used for generating structured data
 * like slide content, outlines, and other JSON-formatted responses.
 *
 * The function:
 * 1. Configures the LLM request with JSON response format
 * 2. Sends system and user prompts
 * 3. Sanitizes and repairs the JSON response
 * 4. Parses and returns the JSON object
 * 5. Logs timing and usage information
 *
 * Uses a low temperature (0.2) for more deterministic, structured output.
 * The response_format is set to "json_object" to encourage valid JSON.
 *
 * @param systemPrompt - System prompt defining the LLM's role and behavior.
 *   Provides context and instructions for how to generate the JSON.
 * @param userPrompt - User prompt containing the specific request or data
 *   to process. This is the actual content the LLM should respond to.
 * @returns Promise that resolves to a Record object containing the generated
 *   JSON data. The structure depends on the prompts and use case.
 * @throws Re-throws any errors from the LLM API or JSON parsing. Errors are
 *   logged with detailed information before being thrown.
 *
 * @example
 * ```typescript
 * const content = await generateJson(
 *   "You are a presentation content generator...",
 *   "Generate content for a problem slide about..."
 * );
 * // Returns: { title: "...", body: "...", ... }
 * ```
 */
export const generateJson = async (
  systemPrompt: string,
  userPrompt: string,
): Promise<Record<string, unknown>> => {
  const model = getOpenRouterModel();
  console.log(`[LLM] generateJson called with model: ${model}`);
  console.log(`[LLM] System prompt length: ${systemPrompt.length} chars`);
  console.log(`[LLM] User prompt length: ${userPrompt.length} chars`);

  try {
    const client = getOpenRouterClient();
    const startTime = Date.now();

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const elapsed = Date.now() - startTime;
    const content = completion.choices[0]?.message?.content || "{}";

    console.log(`[LLM] Response received in ${elapsed}ms`);
    console.log(`[LLM] Response length: ${content.length} chars`);
    console.log(`[LLM] Finish reason: ${completion.choices[0]?.finish_reason}`);

    // Log usage if available
    if (completion.usage) {
      console.log(
        `[LLM] Tokens - prompt: ${completion.usage.prompt_tokens}, completion: ${completion.usage.completion_tokens}`,
      );
    }

    const repairedJson = sanitizeAndRepairJson(content);
    const parsed = JSON.parse(repairedJson) as Record<string, unknown>;
    console.log(`[LLM] Parsed JSON keys: ${Object.keys(parsed).join(", ")}`);
    return parsed;
  } catch (error) {
    console.error("❌ [LLM] generateJson failed:");
    if (error instanceof Error) {
      console.error(`   Error name: ${error.name}`);
      console.error(`   Error message: ${error.message}`);
      if ("status" in error) {
        console.error(
          `   HTTP status: ${(error as { status: number }).status}`,
        );
      }
      if ("code" in error) {
        console.error(`   Error code: ${(error as { code: string }).code}`);
      }
    } else {
      console.error(`   Error: ${String(error)}`);
    }
    throw error;
  }
};

/**
 * Generates plain text content using an LLM.
 *
 * Sends prompts to the LLM and returns the generated text response as a string.
 * Unlike generateJson, this function does not enforce JSON format and is used
 * for generating free-form text content like descriptions, summaries, or
 * narrative text.
 *
 * Uses a slightly higher temperature (0.3) than generateJson to allow for more
 * creative and varied text output. No response format constraint is applied.
 *
 * @param systemPrompt - System prompt defining the LLM's role and behavior.
 *   Provides context and instructions for text generation.
 * @param userPrompt - User prompt containing the specific request or content
 *   to process. This is what the LLM should respond to.
 * @returns Promise that resolves to a string containing the generated text.
 *   Returns an empty string if the LLM response is empty or invalid.
 * @throws Re-throws any errors from the LLM API. Errors are logged with
 *   detailed information before being thrown.
 *
 * @example
 * ```typescript
 * const text = await generateText(
 *   "You are a professional writer...",
 *   "Write a compelling introduction about..."
 * );
 * // Returns: "In today's fast-paced world..."
 * ```
 */
export const generateText = async (
  systemPrompt: string,
  userPrompt: string,
): Promise<string> => {
  const model = getOpenRouterModel();
  console.log(`[LLM] generateText called with model: ${model}`);

  try {
    const client = getOpenRouterClient();
    const startTime = Date.now();

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    });

    const elapsed = Date.now() - startTime;
    const content = completion.choices[0]?.message?.content || "";

    console.log(`[LLM] Response received in ${elapsed}ms`);
    console.log(`[LLM] Response length: ${content.length} chars`);

    return content;
  } catch (error) {
    console.error("❌ [LLM] generateText failed:");
    if (error instanceof Error) {
      console.error(`   Error name: ${error.name}`);
      console.error(`   Error message: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Streaming version of JSON generation using OpenRouter's streaming API.
 *
 * Generates JSON content incrementally, yielding tokens as they arrive from
 * the LLM. This allows for real-time updates in the UI as content is generated,
 * providing better user experience for long-running generation tasks.
 *
 * The function yields raw JSON tokens (partial JSON strings) that need to be
 * accumulated and repaired on the client side. The client should use jsonrepair
 * to handle partial JSON and parse it progressively as tokens arrive.
 *
 * Uses the same configuration as generateJson (JSON response format, low
 * temperature) but with streaming enabled. Supports an optional model override
 * for use cases that require a specific model (e.g., outline generation).
 *
 * @param systemPrompt - System prompt defining the LLM's role and behavior.
 *   Provides context and instructions for JSON generation.
 * @param userPrompt - User prompt containing the specific request or data
 *   to process.
 * @param modelOverride - Optional model identifier to override the default
 *   model. Useful for outline generation or other tasks that benefit from
 *   specific models. If not provided, uses the default model from getOpenRouterModel().
 * @yields {string} Yields JSON token strings as they arrive from the LLM.
 *   Each yield contains a partial JSON string that should be accumulated on
 *   the client side.
 *
 * @example
 * ```typescript
 * for await (const token of generateJsonStream(systemPrompt, userPrompt)) {
 *   accumulatedJson += token;
 *   // Update UI with partial JSON
 *   const partial = jsonrepair(accumulatedJson);
 *   // Parse and display partial results
 * }
 * ```
 */
export async function* generateJsonStream(
  systemPrompt: string,
  userPrompt: string,
  modelOverride?: string,
): AsyncGenerator<string, void, unknown> {
  const model = modelOverride || getOpenRouterModel();
  console.log(`[LLM] generateJsonStream called with model: ${model}`);
  console.log(`[LLM] System prompt length: ${systemPrompt.length} chars`);
  console.log(`[LLM] User prompt length: ${userPrompt.length} chars`);

  const client = getOpenRouterClient();
  const startTime = Date.now();
  let totalTokens = 0;

  try {
    const stream = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        totalTokens++;
        yield content;
      }

      // Log usage stats from final chunk if available
      if (chunk.usage) {
        console.log(
          `[LLM] Stream usage - prompt: ${chunk.usage.prompt_tokens}, completion: ${chunk.usage.completion_tokens}`,
        );
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(
      `[LLM] Stream completed in ${elapsed}ms, yielded ${totalTokens} chunks`,
    );
  } catch (error) {
    console.error("❌ [LLM] generateJsonStream failed:");
    if (error instanceof Error) {
      console.error(`   Error name: ${error.name}`);
      console.error(`   Error message: ${error.message}`);
      if ("status" in error) {
        console.error(
          `   HTTP status: ${(error as { status: number }).status}`,
        );
      }
    }
    throw error;
  }
}
