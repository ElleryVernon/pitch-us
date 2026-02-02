import path from "node:path";
import { defineConfig } from "prisma/config";

// Load .env.local file
import { config } from "dotenv";
config({ path: ".env.local" });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),

  // Use DIRECT_URL for db push and migrations
  datasource: {
    url: process.env.DIRECT_URL!,
  },
});
