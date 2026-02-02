/**
 * Image processing and management utilities.
 *
 * This module provides functions for creating, saving, and generating images
 * used in presentations. It handles placeholder image creation, uploaded image
 * storage, and AI-generated image creation using various providers (OpenAI
 * DALL-E, OpenRouter, etc.). Images can be stored locally or in Supabase
 * storage depending on configuration.
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import OpenAI from "openai";
import { getImagesDirectory, getTempDirectory } from "./storage";
import { getRuntimeConfig } from "./config";
import {
  isSupabaseEnabled,
  uploadSupabaseFileAndGetPublicUrl,
} from "./supabase-storage";

/**
 * Creates a placeholder image file at the specified path.
 *
 * Generates a simple placeholder image with a light gray background. This is
 * used when an image is expected but not yet available, providing a visual
 * placeholder that maintains layout structure.
 *
 * The image is created as a PNG file with dimensions 1024x768 pixels and a
 * light gray background color (RGB 240, 240, 245).
 *
 * @param filePath - Absolute path where the placeholder image should be created.
 *   The directory must exist; the function does not create parent directories.
 * @returns Promise that resolves when the image file has been created.
 *
 * @example
 * ```typescript
 * await createPlaceholderImage("/path/to/placeholder.png");
 * ```
 */
export const createPlaceholderImage = async (
  filePath: string,
): Promise<void> => {
  const width = 1024;
  const height = 768;
  const background = { r: 240, g: 240, b: 245, alpha: 1 };
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background,
    },
  })
    .png()
    .toFile(filePath);
};

/**
 * Generates a placeholder image and returns its file path.
 *
 * Creates a new placeholder image with a unique ID and saves it to the
 * images directory. Returns the file path for reference. This is useful
 * when you need a placeholder image but don't have a specific file path
 * in mind.
 *
 * @returns Promise that resolves to the absolute file path of the created
 *   placeholder image. The image file has been created and is ready to use.
 */
export const generateImagePlaceholder = async (): Promise<string> => {
  const imagesDir = getImagesDirectory();
  const imageId = uuidv4();
  const imagePath = path.join(imagesDir, `${imageId}.png`);
  await createPlaceholderImage(imagePath);
  return imagePath;
};

/**
 * Saves an uploaded image file to disk.
 *
 * Takes a File object (from a form upload or similar) and saves it to the
 * images directory with a unique ID. The original file extension is preserved
 * if available, otherwise defaults to .png.
 *
 * @param file - File object containing the image data to save. Typically
 *   comes from a form upload or File API.
 * @returns Promise that resolves to the absolute file path where the image
 *   was saved. The file has been written to disk.
 *
 * @example
 * ```typescript
 * const imagePath = await saveUploadedImage(uploadedFile);
 * // Returns: "/path/to/images/uuid-123.jpg"
 * ```
 */
export const saveUploadedImage = async (file: File): Promise<string> => {
  const imagesDir = getImagesDirectory();
  const imageId = uuidv4();
  const ext = path.extname(file.name || ".png") || ".png";
  const imagePath = path.join(imagesDir, `${imageId}${ext}`);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(imagePath, buffer);
  return imagePath;
};

const downloadImageToFile = async (
  url: string,
  filePath: string,
): Promise<void> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(filePath, buffer);
};

// OpenRouter image generation response type
type OpenRouterImageResponse = {
  choices?: {
    message?: {
      content?: string;
      images?: {
        type: string;
        image_url: {
          url: string;
        };
      }[];
    };
  }[];
};

// Image generation via OpenRouter
const generateWithOpenRouter = async (prompt: string): Promise<Buffer> => {
  const config = getRuntimeConfig();
  if (!config.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const model =
    config.OPENROUTER_IMAGE_MODEL || "google/gemini-2.5-flash-image-preview";

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        ...(config.OPENROUTER_SITE_URL && {
          "HTTP-Referer": config.OPENROUTER_SITE_URL,
        }),
        ...(config.OPENROUTER_APP_NAME && {
          "X-Title": config.OPENROUTER_APP_NAME,
        }),
      },
      body: JSON.stringify({
        model,
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: `Generate a high-quality image: ${prompt}`,
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenRouter image generation failed: ${response.status} - ${errorText}`,
    );
  }

  const data = (await response.json()) as OpenRouterImageResponse;
  const images = data.choices?.[0]?.message?.images;

  if (!images || images.length === 0) {
    throw new Error("No images returned from OpenRouter");
  }

  // Extract image from base64 data URL
  const imageUrl = images[0].image_url.url;
  if (imageUrl.startsWith("data:image/")) {
    // Handle base64 data URL
    const base64Data = imageUrl.split(",")[1];
    return Buffer.from(base64Data, "base64");
  } else {
    // Download directly to memory for regular URLs
    console.log(`📥 Downloading image from OpenRouter...`);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }
};

// Image generation via OpenAI direct API
const generateWithOpenAi = async (
  prompt: string,
  model: string,
): Promise<Buffer> => {
  const config = getRuntimeConfig();
  if (!config.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  const client = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  const response = await client.images.generate({
    model,
    prompt,
    size: "1024x1024",
  });
  const imageData = response.data?.[0];
  if (!imageData?.b64_json) {
    throw new Error("OpenAI image generation failed");
  }
  return Buffer.from(imageData.b64_json, "base64");
};

// Simplify Pexels search query (for fallback)
const simplifySearchQuery = (prompt: string): string[] => {
  // Extract only core keywords from original prompt
  const words = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const queries: string[] = [prompt]; // Original first

  // Simplify to first 2-3 words
  if (words.length >= 2) {
    queries.push(words.slice(0, 3).join(" "));
  }

  // First word only
  if (words.length >= 1) {
    queries.push(words[0]);
  }

  // General business fallback
  queries.push("business office modern");
  queries.push("technology startup");

  return queries;
};

// Single Pexels search attempt
const tryPexelsSearch = async (
  query: string,
  apiKey: string,
): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5`,
      {
        headers: { Authorization: apiKey },
      },
    );
    if (!response.ok) {
      console.warn(`Pexels API error for "${query}": ${response.status}`);
      return null;
    }
    const data = (await response.json()) as {
      photos?: { src?: { large?: string } }[];
    };
    const url = data.photos?.[0]?.src?.large;
    return url || null;
  } catch (error) {
    console.warn(`Pexels search failed for "${query}":`, error);
    return null;
  }
};

// Pexels image search (with retry logic)
const generateWithPexels = async (prompt: string): Promise<Buffer> => {
  const config = getRuntimeConfig();
  if (!config.PEXELS_API_KEY) {
    throw new Error("PEXELS_API_KEY is not configured");
  }

  const queries = simplifySearchQuery(prompt);
  let imageUrl: string | null = null;

  // Try sequentially with multiple search terms
  for (const query of queries) {
    console.log(`🔍 Pexels search: "${query}"`);
    imageUrl = await tryPexelsSearch(query, config.PEXELS_API_KEY);
    if (imageUrl) {
      console.log(`✅ Found image for: "${query}"`);
      break;
    }
    console.log(`❌ No results for: "${query}", trying next...`);
  }

  if (!imageUrl) {
    console.error(`❌ All Pexels searches failed for prompt: "${prompt}"`);
    // Final fallback: generate placeholder image
    console.log("🎨 Generating placeholder image...");
    return createPlaceholderBuffer();
  }

  // Download directly to memory (no file system usage)
  console.log(`📥 Downloading image from Pexels...`);
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer;
};

// Create placeholder image buffer
const createPlaceholderBuffer = async (): Promise<Buffer> => {
  const width = 1024;
  const height = 768;
  // Business-style gradient background
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 100, g: 120, b: 140, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
};

// Pixabay image search
const generateWithPixabay = async (prompt: string): Promise<Buffer> => {
  const config = getRuntimeConfig();
  if (!config.PIXABAY_API_KEY) {
    throw new Error("PIXABAY_API_KEY is not configured");
  }
  const searchResponse = await fetch(
    `https://pixabay.com/api/?key=${config.PIXABAY_API_KEY}&q=${encodeURIComponent(prompt)}&image_type=photo&per_page=3`,
  );
  if (!searchResponse.ok) {
    throw new Error(`Pixabay error: ${searchResponse.status}`);
  }
  const data = (await searchResponse.json()) as {
    hits?: { largeImageURL?: string }[];
  };
  const url = data.hits?.[0]?.largeImageURL;
  if (!url) {
    throw new Error("No Pixabay image found");
  }
  // Download directly to memory
  console.log(`📥 Downloading image from Pixabay...`);
  const imageResponse = await fetch(url);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.status}`);
  }
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  return buffer;
};

export const generateImageFromPrompt = async (
  prompt: string,
): Promise<string> => {
  const config = getRuntimeConfig();
  const provider = (config.IMAGE_PROVIDER || "pexels").toLowerCase();
  let buffer: Buffer;

  if (provider.includes("openrouter")) {
    // Image generation via OpenRouter (Gemini, FLUX, etc.)
    buffer = await generateWithOpenRouter(prompt);
  } else if (
    provider.includes("openai") ||
    provider.includes("gpt") ||
    provider.includes("dall")
  ) {
    // OpenAI direct API (DALL-E, GPT-Image)
    const model = provider.includes("dall") ? "dall-e-3" : "gpt-image-1";
    buffer = await generateWithOpenAi(prompt, model);
  } else if (provider.includes("pexels")) {
    // Pexels free image search
    buffer = await generateWithPexels(prompt);
  } else if (provider.includes("pixabay")) {
    // Pixabay free image search
    buffer = await generateWithPixabay(prompt);
  } else {
    throw new Error(
      `Unsupported IMAGE_PROVIDER: ${provider}. Supported: openrouter, openai, pexels, pixabay`,
    );
  }

  // Convert to PNG
  const pngBuffer = await sharp(buffer).png().toBuffer();
  const imageId = uuidv4();

  // Upload to Supabase Storage if Supabase is enabled
  if (isSupabaseEnabled()) {
    console.log(`📤 Uploading image to Supabase Storage: ${imageId}.png`);
    const publicUrl = await uploadSupabaseFileAndGetPublicUrl({
      path: `images/${imageId}.png`,
      data: pngBuffer,
      contentType: "image/png",
      upsert: true,
    });
    console.log(`✅ Supabase upload complete: ${publicUrl}`);
    return publicUrl;
  }

  // Use local file system if Supabase is not available (fallback)
  console.log(`💾 Saving image locally: ${imageId}.png`);
  const imagesDir = getImagesDirectory();
  const imagePath = path.join(imagesDir, `${imageId}.png`);
  await sharp(pngBuffer).toFile(imagePath);
  return imagePath;
};
