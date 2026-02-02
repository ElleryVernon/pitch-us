/**
 * Type definitions and enums for presentation generation configuration.
 *
 * Defines types for uploaded files, themes, languages, tones, verbosity levels,
 * and presentation configuration used throughout the presentation generator.
 */

/**
 * Structure for uploaded file metadata.
 *
 * @property id - Unique identifier for the uploaded file.
 * @property file - The File object from the file input.
 * @property size - Human-readable file size string (e.g., "2.5 MB").
 */
export interface UploadedFile {
  id: string;
  file: File;
  size: string;
}

/**
 * Theme options for presentation styling.
 *
 * Defines available color themes for presentations, including light, dark,
 * custom, and various preset color schemes.
 */
export enum ThemeType {
  Light = "light",
  Dark = "dark",
  Custom = "custom",
  Faint_Yellow = "faint_yellow",
  Royal_Blue = "royal_blue",
  Light_Red = "light_red",
  Dark_Pink = "dark_pink",
}

/**
 * Language options for presentation content generation.
 *
 * Comprehensive list of supported languages for generating presentation content.
 * Includes major world languages, European languages, Middle Eastern and Central
 * Asian languages, South Asian languages, East and Southeast Asian languages,
 * African languages, and indigenous/lesser-known languages.
 */
export enum LanguageType {
  // Major World Languages
  //   Auto = "Auto",
  English = "English",
  Spanish = "Spanish (Español)",
  French = "French (Français)",
  German = "German (Deutsch)",
  Portuguese = "Portuguese (Português)",
  Italian = "Italian (Italiano)",
  Dutch = "Dutch (Nederlands)",
  Russian = "Russian (Русский)",
  ChineseSimplified = "Chinese (Simplified - 中文, 汉语)",
  ChineseTraditional = "Chinese (Traditional - 中文, 漢語)",
  Japanese = "Japanese (日本語)",
  Arabic = "Arabic (العربية)",
  Hindi = "Hindi (हिन्दी)",
  Bengali = "Bengali (বাংলা)",

  // European Languages
  Polish = "Polish (Polski)",
  Czech = "Czech (Čeština)",
  Slovak = "Slovak (Slovenčina)",
  Hungarian = "Hungarian (Magyar)",
  Romanian = "Romanian (Română)",
  Bulgarian = "Bulgarian (Български)",
  Greek = "Greek (Ελληνικά)",
  Serbian = "Serbian (Српски / Srpski)",
  Croatian = "Croatian (Hrvatski)",
  Bosnian = "Bosnian (Bosanski)",
  Slovenian = "Slovenian (Slovenščina)",
  Finnish = "Finnish (Suomi)",
  Swedish = "Swedish (Svenska)",
  Danish = "Danish (Dansk)",
  Norwegian = "Norwegian (Norsk)",
  Icelandic = "Icelandic (Íslenska)",
  Lithuanian = "Lithuanian (Lietuvių)",
  Latvian = "Latvian (Latviešu)",
  Estonian = "Estonian (Eesti)",
  Maltese = "Maltese (Malti)",
  Welsh = "Welsh (Cymraeg)",
  Irish = "Irish (Gaeilge)",
  ScottishGaelic = "Scottish Gaelic (Gàidhlig)",
  Ukrainian = "Ukrainian (Українська)",

  // Middle Eastern and Central Asian Languages
  Hebrew = "Hebrew (עברית)",
  Persian = "Persian/Farsi (فارسی)",
  Turkish = "Turkish (Türkçe)",
  Kurdish = "Kurdish (Kurdî / کوردی)",
  Pashto = "Pashto (پښتو)",
  Dari = "Dari (دری)",
  Uzbek = "Uzbek (Oʻzbek)",
  Kazakh = "Kazakh (Қазақша)",
  Tajik = "Tajik (Тоҷикӣ)",
  Turkmen = "Turkmen (Türkmençe)",
  Azerbaijani = "Azerbaijani (Azərbaycan dili)",

  // South Asian Languages
  Urdu = "Urdu (اردو)",
  Tamil = "Tamil (தமிழ்)",
  Telugu = "Telugu (తెలుగు)",
  Marathi = "Marathi (मराठी)",
  Punjabi = "Punjabi (ਪੰਜਾਬੀ / پنجابی)",
  Gujarati = "Gujarati (ગુજરાતી)",
  Malayalam = "Malayalam (മലയാളം)",
  Kannada = "Kannada (ಕನ್ನಡ)",
  Odia = "Odia (ଓଡ଼ିଆ)",
  Sinhala = "Sinhala (සිංහල)",
  Nepali = "Nepali (नेपाली)",

  // East and Southeast Asian Languages
  Thai = "Thai (ไทย)",
  Vietnamese = "Vietnamese (Tiếng Việt)",
  Lao = "Lao (ລາວ)",
  Khmer = "Khmer (ភាសាខ្មែរ)",
  Burmese = "Burmese (မြန်မာစာ)",
  Tagalog = "Tagalog/Filipino (Tagalog/Filipino)",
  Javanese = "Javanese (Basa Jawa)",
  Sundanese = "Sundanese (Basa Sunda)",
  Malay = "Malay (Bahasa Melayu)",
  Mongolian = "Mongolian (Монгол)",

  // African Languages
  Swahili = "Swahili (Kiswahili)",
  Hausa = "Hausa (Hausa)",
  Yoruba = "Yoruba (Yorùbá)",
  Igbo = "Igbo (Igbo)",
  Amharic = "Amharic (አማርኛ)",
  Zulu = "Zulu (isiZulu)",
  Xhosa = "Xhosa (isiXhosa)",
  Shona = "Shona (ChiShona)",
  Somali = "Somali (Soomaaliga)",

  // Indigenous and Lesser-Known Languages
  Basque = "Basque (Euskara)",
  Catalan = "Catalan (Català)",
  Galician = "Galician (Galego)",
  Quechua = "Quechua (Runasimi)",
  Nahuatl = "Nahuatl (Nāhuatl)",
  Hawaiian = "Hawaiian (ʻŌlelo Hawaiʻi)",
  Maori = "Maori (Te Reo Māori)",
  Tahitian = "Tahitian (Reo Tahiti)",
  Samoan = "Samoan (Gagana Samoa)",
}

/**
 * Configuration structure for presentation generation.
 *
 * Contains all settings and parameters used when generating a presentation,
 * including slide count, language, prompt, tone, verbosity, and feature flags.
 *
 * @property slides - Number of slides as a string (e.g., "10") or null.
 * @property language - Language for content generation, or null for default.
 * @property prompt - User-provided text prompt describing the presentation.
 * @property tone - Tone/style for the presentation content.
 * @property verbosity - Level of detail in generated content.
 * @property instructions - Additional instructions for content generation.
 * @property includeTableOfContents - Whether to include a table of contents slide.
 * @property includeTitleSlide - Whether to include a title slide.
 * @property webSearch - Whether to enable web search for content generation.
 */
export interface PresentationConfig {
  slides: string | null;
  language: LanguageType | null;
  prompt: string;
  tone: ToneType;
  verbosity: VerbosityType;
  instructions: string;
  includeTableOfContents: boolean;
  includeTitleSlide: boolean;
  webSearch: boolean;
}

/**
 * Tone options for presentation content style.
 *
 * Defines the writing style and tone for generated presentation content,
 * ranging from casual to professional, with specialized options for different
 * use cases.
 */
export enum ToneType {
  Default = "default",
  Casual = "casual",
  Professional = "professional",
  Funny = "funny",
  Educational = "educational",
  Sales_Pitch = "sales_pitch",
}

/**
 * Verbosity options for presentation content detail level.
 *
 * Controls how much text and detail is included in generated slides.
 * Ranges from concise (minimal text) to text-heavy (detailed explanations).
 */
export enum VerbosityType {
  Concise = "concise",
  Standard = "standard",
  Text_Heavy = "text-heavy",
}

