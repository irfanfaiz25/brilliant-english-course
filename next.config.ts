import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Uploaded images are served from the R2 bucket's domain when it is set (validated in src/lib/env.ts).
const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // A self-contained server for the Docker image (ADR-043), which sets NEXT_OUTPUT. Local runs and
  // CI keep the regular output so `next start` works.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: mediaUrl ? [new URL(`${mediaUrl.replace(/\/$/, "")}/**`)] : [],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
