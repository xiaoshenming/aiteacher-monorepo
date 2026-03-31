import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scanRoots = ["apps"];
const allowedLegacyMarkers = new Set([
  "apps/backend-cloud/utils/auth-config.js",
  "apps/backend-cloud/utils/auth-config.test.js",
  "apps/excalidraw-room/src/config/security.ts",
  "apps/excalidraw-room/src/config/security.test.ts",
]);

function listRepoFiles() {
  const files = [];
  const pending = scanRoots.map((dir) => path.join(rootDir, dir));

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) {
      continue;
    }

    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      const relativePath = path.relative(rootDir, fullPath);

      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".nuxt") {
          continue;
        }

        pending.push(fullPath);
        continue;
      }

      files.push(relativePath);
    }
  }

  return files;
}

test("repository does not track throwaway copy files", () => {
  const copyFiles = listRepoFiles().filter((file) =>
    /(^|\/)[^/]+ copy\.[^/]+$/i.test(file),
  );

  assert.deepEqual(copyFiles, []);
});

test("repository does not track known local credential markers", () => {
  const findings = [];

  for (const file of listRepoFiles()) {
    if (!/\.(?:[cm]?js|ts|tsx|mjs|json)$/i.test(file)) {
      continue;
    }

    if (allowedLegacyMarkers.has(file)) {
      continue;
    }

    const source = readFileSync(path.join(rootDir, file), "utf8");

    if (/MO520MING/.test(source)) {
      findings.push(`${file}: contains legacy MySQL password marker`);
    }

    if (/password:\s*['"]000000['"]/.test(source)) {
      findings.push(`${file}: contains legacy Redis password marker`);
    }
  }

  assert.deepEqual(findings, []);
});
