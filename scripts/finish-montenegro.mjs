/** Quick fix: Montenegro 99→100 after seed patch */
import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function run(args) {
  return spawnSync("npx", args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: "0", SEQUENTIAL_WIKI: "1" },
  }).status ?? 1;
}

console.log("\n=== Montenegro finish (99→100) ===\n");
run(["tsx", "scripts/fix-vague-places.ts", "montenegro"]);
if (run(["npm", "run", "import:country", "--", "montenegro"]) !== 0) process.exit(1);
run(["tsx", "scripts/fix-country-places.ts", "montenegro"]);
run(["tsx", "scripts/count-places.ts", "Montenegro"]);
