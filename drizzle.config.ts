import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Load .env* files the same way Next.js does, so drizzle-kit and the app share configuration.
loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  casing: "snake_case",
  dbCredentials: { url: databaseUrl },
  strict: true,
  verbose: true,
});
