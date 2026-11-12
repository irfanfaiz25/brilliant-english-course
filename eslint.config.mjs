import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const RAW_COLOR = String.raw`/#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|\b(?:rgb|rgba|hsl|hsla|oklch)\(/`;

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
    "src/db/migrations/**",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Environment variables are read only through the validated env modules (AGENTS.md § 4).
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/env.ts", "src/lib/public-env.ts", "src/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message: "Import `env` from '@/lib/env' or `publicEnv` from '@/lib/public-env'.",
        },
      ],
    },
  },
  // Colors come from design tokens, never raw values (DESIGN.md § 2, ADR-010).
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/design-tokens.ts", "src/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: `Literal[value=${RAW_COLOR}]`,
          message: "Use a design token (Tailwind class or brandColors) instead of a raw color.",
        },
        {
          selector: `TemplateElement[value.raw=${RAW_COLOR}]`,
          message: "Use a design token (Tailwind class or brandColors) instead of a raw color.",
        },
      ],
    },
  },
  // UI layers reach the database only through feature queries/services (AGENTS.md § 3).
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/db", "@/db/*"],
              message:
                "Use the feature module's queries.ts / service.ts instead of the db directly.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
