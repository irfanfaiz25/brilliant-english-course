// Fails when AGENTS.md and CLAUDE.md drift apart (they must stay identical, see AGENTS.md).
import { readFileSync } from "node:fs";

const agents = readFileSync("AGENTS.md", "utf8");
const claude = readFileSync("CLAUDE.md", "utf8");

if (agents !== claude) {
  console.error("AGENTS.md and CLAUDE.md differ. Edit one and copy it to the other.");
  process.exit(1);
}
