const AI_COAUTHOR = /^co-authored-by:.*\b(claude|anthropic|openai|chatgpt|gpt|copilot|gemini)\b/im;

/** @type {import("@commitlint/types").UserConfig} */
const config = {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    {
      rules: {
        // AI agents/models are never listed as contributors (AGENTS.md § 6).
        "no-ai-coauthor": ({ raw }) => [
          !AI_COAUTHOR.test(raw ?? ""),
          "remove the AI Co-Authored-By trailer",
        ],
      },
    },
  ],
  rules: {
    "no-ai-coauthor": [2, "always"],
  },
};

export default config;
