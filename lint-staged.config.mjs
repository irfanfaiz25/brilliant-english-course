/** @type {import("lint-staged").Configuration} */
const config = {
  "*.{ts,tsx,js,mjs}": ["eslint --fix --max-warnings=0", "prettier --write"],
  "*.{css,md,json,yml,yaml}": "prettier --write",
};

export default config;
