import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const staging = mkdtempSync(join(tmpdir(), "finisher-ios-"));

try {
  // Build a disposable copy: never rename the live API or overwrite .next.
  cpSync(join(root, "src"), join(staging, "src"), {
    recursive: true,
    filter: (source) => source !== join(root, "src/app/api") && source !== join(root, "src/proxy.ts"),
  });
  // App opens straight to the dashboard, not the marketing landing page.
  // Web build (npm run build) is untouched — this only swaps the copy.
  cpSync(join(root, "scripts/ios-app-entry.tsx"), join(staging, "src/app/page.tsx"));
  for (const file of ["public", "package.json", "tsconfig.json", "next.config.ts", "postcss.config.mjs"]) {
    cpSync(join(root, file), join(staging, file), { recursive: true });
  }
  symlinkSync(join(root, "node_modules"), join(staging, "node_modules"), "dir");

  // Webpack resolves the shared dependencies outside this temporary project.
  const result = spawnSync(process.execPath, [join(root, "node_modules/next/dist/bin/next"), "build", "--webpack"], {
    cwd: staging,
    env: { ...process.env, CAPACITOR_BUILD: "1" },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`iOS export failed (exit ${result.status}, signal ${result.signal})`);

  // Only replace generated assets after a successful export.
  rmSync(join(root, "out"), { recursive: true, force: true });
  cpSync(join(staging, "out"), join(root, "out"), { recursive: true });
  process.stdout.write("iOS web assets exported to out/\n");
} finally {
  rmSync(staging, { recursive: true, force: true });
}
