import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.env.CAPACITOR_BUILD === "1"
  ? ["--experimental-strip-types", join(root, "scripts/build-ios.ts"), "--export-only"]
  : [join(root, "node_modules/next/dist/bin/next"), "build"];

// Capacitor uses the existing staged export, leaving live API routes and .next intact.
const result = spawnSync(process.execPath, [...args, ...process.argv.slice(2)], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
});
if (result.error) throw result.error;
if (result.signal) throw new Error(`Build terminated by ${result.signal}`);
process.exitCode = result.status ?? 1;
