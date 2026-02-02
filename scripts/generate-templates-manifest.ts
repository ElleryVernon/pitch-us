/**
 * Script to generate a templates manifest JSON file.
 *
 * Scans the presentation-templates directory, reads template settings from
 * settings.json files, and generates a manifest file listing all available
 * templates and their layout files. The manifest is used by the application
 * to discover and load presentation templates dynamically.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Template settings structure from settings.json files.
 *
 * @property description - Human-readable description of the template.
 * @property ordered - Whether layout files should be ordered.
 * @property default - Whether this template should be the default selection.
 * @property layoutOrder - Optional array specifying the order of layout files.
 *   Used internally during generation but excluded from the final manifest.
 */
type TemplateSetting = {
  description?: string;
  ordered?: boolean;
  default?: boolean;
  layoutOrder?: string[];
};

/**
 * Template manifest entry structure.
 *
 * Represents a single template in the generated manifest, including its
 * name, ID, layout files, and settings.
 *
 * @property templateName - Name of the template directory.
 * @property templateID - Unique identifier (same as templateName).
 * @property files - Array of layout file names (TSX files).
 * @property settings - Template settings (without layoutOrder).
 */
type TemplateManifestEntry = {
  templateName: string;
  templateID: string;
  files: string[];
  settings: TemplateSetting | null;
};

/**
 * Path to the presentation-templates directory.
 * Contains all template subdirectories with layout files.
 */
const templatesDirectory = path.join(
  process.cwd(),
  "src",
  "presentation-templates",
);

/**
 * Output path for the generated manifest file.
 * Written to the public directory for client-side access.
 */
const outputPath = path.join(
  process.cwd(),
  "public",
  "templates-manifest.json",
);

/**
 * Checks if a file is a layout file.
 *
 * Determines if a file should be included in the manifest as a layout.
 * Excludes test files, spec files, hidden files, and settings.json.
 *
 * @param file - Filename to check.
 * @returns True if the file is a valid layout file (TSX extension).
 */
const isLayoutFile = (file: string) =>
  file.endsWith(".tsx") &&
  !file.startsWith(".") &&
  !file.includes(".test.") &&
  !file.includes(".spec.") &&
  file !== "settings.json";

/**
 * Reads template settings from settings.json file.
 *
 * Attempts to read and parse the settings.json file for a template.
 * Returns default settings if the file doesn't exist or is invalid.
 *
 * @param templatePath - Path to the template directory.
 * @param templateName - Name of the template (for error messages).
 * @returns Template settings object, or defaults if file not found/invalid.
 */
const readTemplateSettings = async (
  templatePath: string,
  templateName: string,
): Promise<TemplateSetting> => {
  const settingsPath = path.join(templatePath, "settings.json");
  try {
    const settingsContent = await fs.readFile(settingsPath, "utf-8");
    return JSON.parse(settingsContent) as TemplateSetting;
  } catch (error) {
    console.warn(
      `No settings.json found for template ${templateName} or invalid JSON`,
    );
    return {
      description: `${templateName} presentation layouts`,
      ordered: false,
      default: false,
    };
  }
};

/**
 * Generates the templates manifest.
 *
 * Scans the templates directory, reads each template's settings, and
 * generates manifest entries. Respects layoutOrder from settings.json
 * if present, otherwise uses alphabetical ordering. Excludes the
 * "components" directory.
 *
 * @returns Array of template manifest entries, one per template directory.
 */
const generateManifest = async (): Promise<TemplateManifestEntry[]> => {
  const items = await fs.readdir(templatesDirectory, { withFileTypes: true });
  const excludedFolders = ["components"];
  const templateDirectories = items
    .filter(
      (item) => item.isDirectory() && !excludedFolders.includes(item.name),
    )
    .map((dir) => dir.name)
    .sort((a, b) => a.localeCompare(b));

  const allLayouts: TemplateManifestEntry[] = [];
  for (const templateName of templateDirectories) {
    const templatePath = path.join(templatesDirectory, templateName);
    const templateFiles = await fs.readdir(templatePath);
    const settings = await readTemplateSettings(templatePath, templateName);

    // Use layoutOrder if present, otherwise use alphabetical order
    let layoutFiles = templateFiles.filter(isLayoutFile);
    if (settings.layoutOrder && settings.layoutOrder.length > 0) {
      layoutFiles = settings.layoutOrder.filter((file) =>
        layoutFiles.includes(file),
      );
      // Add files not in layoutOrder at the end
      const remainingFiles = templateFiles
        .filter(isLayoutFile)
        .filter((file) => !settings.layoutOrder?.includes(file));
      layoutFiles = [...layoutFiles, ...remainingFiles];
    } else {
      layoutFiles = layoutFiles.sort((a, b) => a.localeCompare(b));
    }

    if (layoutFiles.length > 0) {
      // Save without layoutOrder from settings (internal use)
      const { layoutOrder, ...settingsWithoutOrder } = settings;
      allLayouts.push({
        templateName,
        templateID: templateName,
        files: layoutFiles,
        settings: settingsWithoutOrder,
      });
    }
  }

  return allLayouts;
};

/**
 * Main function to generate the templates manifest.
 *
 * Generates the manifest, ensures the output directory exists, writes
 * the manifest file as formatted JSON, and logs success. Exits with
 * error code 1 if generation fails.
 *
 * @throws Exits process with code 1 if manifest generation fails.
 */
const main = async () => {
  const manifest = await generateManifest();
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(manifest, null, 2));
  console.log(
    `Generated templates manifest: ${outputPath} (${manifest.length} templates)`,
  );
};

main().catch((error) => {
  console.error("Failed to generate templates manifest:", error);
  process.exit(1);
});
