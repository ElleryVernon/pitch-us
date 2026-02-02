/**
 * Configuration interface for LLM and image generation services.
 *
 * Defines the structure for user-configurable API keys and service settings
 * used throughout the application. These settings control which AI models and
 * image providers are used for content generation. Values are typically loaded
 * from environment variables or user configuration.
 *
 * This interface is used by the configuration system to provide type-safe access
 * to API keys and service settings. All properties are optional to allow for
 * flexible configuration where not all services need to be configured.
 */

/**
 * Configuration object for LLM and image generation services.
 *
 * Contains API keys and model identifiers for various AI services used by the
 * application. These settings control content generation, including presentation
 * outlines, slide content, and image generation.
 *
 * @property OPENROUTER_API_KEY - Optional API key for OpenRouter service.
 *   OpenRouter provides access to multiple LLM providers through a unified API.
 *   Required if using OpenRouter for text generation.
 * @property OPENROUTER_MODEL - Optional model identifier for OpenRouter text
 *   generation (e.g., "openai/gpt-4", "anthropic/claude-3-opus"). Specifies
 *   which LLM to use for generating presentation content and slide text.
 *   Defaults to a sensible default if not provided.
 * @property OPENROUTER_IMAGE_MODEL - Optional model identifier for OpenRouter
 *   image generation. Some OpenRouter-compatible models support image generation.
 *   If not provided, falls back to dedicated image providers.
 * @property OPENROUTER_SITE_URL - Optional site URL for OpenRouter API requests.
 *   Used as the HTTP-Referer header to identify the application making requests.
 *   Helps with API usage tracking and compliance.
 * @property OPENROUTER_APP_NAME - Optional application name for OpenRouter API
 *   requests. Used as the X-Title header to identify the application. Helps
 *   with API usage tracking and support.
 * @property IMAGE_PROVIDER - Optional identifier for the primary image generation
 *   provider to use. Values like "openai" (DALL-E), "pexels", "pixabay", etc.
 *   Determines which service is used for generating or fetching images for slides.
 * @property OPENAI_API_KEY - Optional API key for OpenAI services. Used for
 *   DALL-E image generation if IMAGE_PROVIDER is set to "openai". Also used
 *   for OpenAI LLM models if not using OpenRouter.
 * @property PEXELS_API_KEY - Optional API key for Pexels image search service.
 *   Used for fetching stock photos if IMAGE_PROVIDER is set to "pexels".
 *   Pexels provides high-quality free stock photos.
 * @property PIXABAY_API_KEY - Optional API key for Pixabay image search service.
 *   Used for fetching stock photos if IMAGE_PROVIDER is set to "pixabay".
 *   Pixabay provides free stock photos and illustrations.
 *
 * @example
 * ```typescript
 * const config: LLMConfig = {
 *   OPENROUTER_API_KEY: "sk-or-v1-...",
 *   OPENROUTER_MODEL: "openai/gpt-4",
 *   OPENROUTER_SITE_URL: "https://myapp.com",
 *   OPENROUTER_APP_NAME: "Pitch Deck Generator",
 *   IMAGE_PROVIDER: "pexels",
 *   PEXELS_API_KEY: "your-pexels-key"
 * };
 * ```
 */
export interface LLMConfig {
  // OpenRouter
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  OPENROUTER_IMAGE_MODEL?: string;
  OPENROUTER_SITE_URL?: string;
  OPENROUTER_APP_NAME?: string;

  // Image providers
  IMAGE_PROVIDER?: string;
  OPENAI_API_KEY?: string;
  PEXELS_API_KEY?: string;
  PIXABAY_API_KEY?: string;
}
