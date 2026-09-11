#!/usr/bin/env node
/**
 * Layer 23 — static-export bundle report + budget gate.
 *
 * Walks the built `out/_next/static` tree, prints every JS/CSS asset with its raw
 * and gzip size (largest first), then checks three budgets. Non-zero exit on a
 * breach so CI (and the local release) fail loudly on a size regression.
 *
 * The budgets are a *ratchet*, not a target: they sit a bit above today's real
 * numbers (see docs/PERFORMANCE.md §2). Raise them only with a note in that file
 * and a reason — the point is to catch an accidental heavy dependency, not to
 * force hand-optimisation.
 *
 *   node scripts/analyze-bundle.mjs [outDir]
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join, relative } from "node:path";

const OUT_DIR = process.argv[2] ?? "out";
const STATIC_DIR = join(OUT_DIR, "_next", "static");

/** Budgets in kibibytes. */
export const BUDGETS = {
  /** Sum of the gzip size of every JS asset. Ratcheted 900 → 920 (ADR-0034, E–M)
   * → 960 (ADR-0035, N–O) → 1020 for Knowledge & Context (Layer P) and the
   * Digital Twin & Simulation Engine (Layer Q): three more derived-state views
   * (/knowledge, /simulation) + their pure reducers, first-party JS across many
   * small chunks, no dependency added. Actual after Q: ~990 KiB. See ADR-0036. */
  totalJsGzipKiB: 1020,
  /** Sum of the raw (uncompressed) size of every JS asset. Raised 3300 → 3500
   * alongside the Layer P–Q gzip ratchet (raw reached ~3373). See ADR-0036. */
  totalJsRawKiB: 3500,
  /** Gzip size of the single largest JS chunk (the Firestore SDK chunk today). */
  largestChunkGzipKiB: 240,
};

const KIB = 1024;
const kib = (bytes) => bytes / KIB;
const fmt = (bytes) => `${kib(bytes).toFixed(1).padStart(8)} KiB`;

function walk(dir) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) entries.push(...walk(full));
    else entries.push(full);
  }
  return entries;
}

export function collectAssets(staticDir = STATIC_DIR) {
  return walk(staticDir)
    .filter((f) => f.endsWith(".js") || f.endsWith(".css"))
    .map((f) => {
      const raw = readFileSync(f);
      return {
        path: relative(OUT_DIR, f).replace(/\\/g, "/"),
        kind: f.endsWith(".js") ? "js" : "css",
        raw: raw.byteLength,
        gzip: gzipSync(raw, { level: 9 }).byteLength,
      };
    })
    .sort((a, b) => b.gzip - a.gzip);
}

export function summarize(assets) {
  const js = assets.filter((a) => a.kind === "js");
  return {
    totalJsGzip: js.reduce((s, a) => s + a.gzip, 0),
    totalJsRaw: js.reduce((s, a) => s + a.raw, 0),
    largestChunkGzip: js.length ? js[0].gzip : 0,
    jsCount: js.length,
    cssCount: assets.length - js.length,
  };
}

export function checkBudgets(summary) {
  const breaches = [];
  if (kib(summary.totalJsGzip) > BUDGETS.totalJsGzipKiB) {
    breaches.push(
      `total JS gzip ${kib(summary.totalJsGzip).toFixed(1)} KiB > ${BUDGETS.totalJsGzipKiB} KiB budget`,
    );
  }
  if (kib(summary.totalJsRaw) > BUDGETS.totalJsRawKiB) {
    breaches.push(
      `total JS raw ${kib(summary.totalJsRaw).toFixed(1)} KiB > ${BUDGETS.totalJsRawKiB} KiB budget`,
    );
  }
  if (kib(summary.largestChunkGzip) > BUDGETS.largestChunkGzipKiB) {
    breaches.push(
      `largest chunk gzip ${kib(summary.largestChunkGzip).toFixed(1)} KiB > ${BUDGETS.largestChunkGzipKiB} KiB budget`,
    );
  }
  return breaches;
}

function main() {
  let assets;
  try {
    assets = collectAssets();
  } catch {
    console.error(`analyze-bundle: no build found at ${STATIC_DIR}. Run \`npm run build\` first.`);
    process.exit(2);
  }

  const top = assets.slice(0, 15);
  console.log(
    `\nBundle report — ${OUT_DIR}/_next/static  (top ${top.length} of ${assets.length})\n`,
  );
  console.log(`${"gzip".padStart(12)}  ${"raw".padStart(12)}  asset`);
  for (const a of top) console.log(`${fmt(a.gzip)}  ${fmt(a.raw)}  ${a.path}`);

  const s = summarize(assets);
  console.log(
    `\n${s.jsCount} JS + ${s.cssCount} CSS assets` +
      `\n  total JS gzip : ${kib(s.totalJsGzip).toFixed(1)} KiB  (budget ${BUDGETS.totalJsGzipKiB})` +
      `\n  total JS raw  : ${kib(s.totalJsRaw).toFixed(1)} KiB  (budget ${BUDGETS.totalJsRawKiB})` +
      `\n  largest chunk : ${kib(s.largestChunkGzip).toFixed(1)} KiB gzip  (budget ${BUDGETS.largestChunkGzipKiB})`,
  );

  const breaches = checkBudgets(s);
  if (breaches.length) {
    console.error(`\n✗ bundle budget exceeded:\n  - ${breaches.join("\n  - ")}\n`);
    process.exit(1);
  }
  console.log("\n✓ within budget\n");
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("analyze-bundle.mjs")
) {
  main();
}
