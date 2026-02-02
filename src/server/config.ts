/**
 * Runtime configuration management for server-side operations.
 *
 * This module provides functions for accessing user-configurable settings
 * from environment variables. These settings control LLM providers, image
 * generation services, and other external service integrations used by
 * the server-side application logic.
 */

/**
 * User configuration structure for LLM and image generation services.
 *
 * Defines all configurable settings that can be provided via environment
 * variables. These settings control which AI models and services are used
 * for content generation throughout the application. All properties are
 * optional to allow for flexible configuration.
 *
 * This type matches the LLMConfig type in shared/types but is defined here
 * for server-side use to avoid circular dependencies.
 *
 * @property OPENROUTER_API_KEY - Optional API key for OpenRouter service.
 *   Required if using OpenRouter for LLM text generation.
 * @property OPENROUTER_MODEL - Optional model identifier for OpenRouter text
 *   generation (e.g., "openai/gpt-4", "anthropic/claude-3-opus").
 * @property OPENROUTER_OUTLINE_MODEL - Optional model identifier specifically
 *   for outline generation. If not provided, falls back to OPENROUTER_MODEL.
 * @property OPENROUTER_IMAGE_MODEL - Optional model identifier for OpenRouter
 *   image generation. Rarely used as dedicated image providers are preferred.
 * @property OPENROUTER_SITE_URL - Optional site URL for OpenRouter API requests.
 *   Used as HTTP-Referer header for API identification.
 * @property OPENROUTER_APP_NAME - Optional application name for OpenRouter API
 *   requests. Used as X-Title header for API identification.
 * @property IMAGE_PROVIDER - Optional identifier for the image generation
 *   provider ("openai", "pexels", "pixabay", etc.).
 * @property OPENAI_API_KEY - Optional API key for OpenAI services. Used for
 *   DALL-E image generation if IMAGE_PROVIDER is "openai".
 * @property PEXELS_API_KEY - Optional API key for Pexels stock photo service.
 *   Used if IMAGE_PROVIDER is "pexels".
 * @property PIXABAY_API_KEY - Optional API key for Pixabay stock photo service.
 *   Used if IMAGE_PROVIDER is "pixabay".
 */
export type UserConfig = {
  // OpenRouter
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  OPENROUTER_OUTLINE_MODEL?: string;
  OPENROUTER_IMAGE_MODEL?: string;
  OPENROUTER_SITE_URL?: string;
  OPENROUTER_APP_NAME?: string;

  // Image Provider
  IMAGE_PROVIDER?: string;
  OPENAI_API_KEY?: string;
  PEXELS_API_KEY?: string;
  PIXABAY_API_KEY?: string;
};

/**
 * Retrieves runtime configuration from environment variables.
 *
 * Reads all user configuration settings from process.env and returns them
 * as a UserConfig object. This function is called at runtime to access
 * configuration values throughout the server-side application.
 *
 * Environment variables are read directly from process.env, which is populated
 * by Next.js from .env files and system environment variables. Values may be
 * undefined if the corresponding environment variable is not set.
 *
 * @returns A UserConfig object containing all configuration values read from
 *   environment variables. Properties will be undefined if the corresponding
 *   environment variable is not set.
 *
 * @example
 * ```typescript
 * const config = getRuntimeConfig();
 * if (config.OPENROUTER_API_KEY) {
 *   // Use OpenRouter for LLM
 * } else {
 *   // Handle missing configuration
 * }
 * ```
 */
export const getRuntimeConfig = (): UserConfig => ({
  // OpenRouter
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
  OPENROUTER_OUTLINE_MODEL: process.env.OPENROUTER_OUTLINE_MODEL,
  OPENROUTER_IMAGE_MODEL: process.env.OPENROUTER_IMAGE_MODEL,
  OPENROUTER_SITE_URL: process.env.OPENROUTER_SITE_URL,
  OPENROUTER_APP_NAME: process.env.OPENROUTER_APP_NAME,

  // Image Provider
  IMAGE_PROVIDER: process.env.IMAGE_PROVIDER,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  PEXELS_API_KEY: process.env.PEXELS_API_KEY,
  PIXABAY_API_KEY: process.env.PIXABAY_API_KEY,
});
