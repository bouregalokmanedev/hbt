#!/usr/bin/env node
/**
 * extract-bundle.mjs — reproducible asset extractor for the offline source bundle
 * (05 §0, 11 §scripts). The original "HB TRONICS SaaS Simulator (offline).html" is a
 * self-decoding bundle: four `<script type="__bundler/*">` blocks hold a manifest of
 * gzipped-base64 assets, an ext-resources url→uuid map, the page template, and page
 * order. This tool decodes every manifest entry back to a real file so the extracted
 * assets under /assets and /public can be regenerated from source at any time.
 *
 * Guarantees:
 *   • READ-ONLY on the source HTML — it is never modified.
 *   • Node built-ins only (fs, path, zlib) — no dependencies.
 *   • The production app does NOT import this; it is a dev/CI utility. Nothing in
 *     app/, features/, packages/, or data/ may require it.
 *
 * Usage:
 *   node scripts/extract-bundle.mjs [--html <path>] [--out <dir>] [--dry]
 * Defaults:
 *   --html "HB TRONICS SaaS Simulator (offline).html"
 *   --out  "scripts/extracted"
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { join, dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
/** Resolve a path arg relative to the project root, but respect absolute paths. */
const fromRoot = (p) => resolve(root, p);

function parseArgs(argv) {
  const args = { html: "HB TRONICS SaaS Simulator (offline).html", out: "scripts/extracted", dry: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--html") args.html = argv[++i];
    else if (argv[i] === "--out") args.out = argv[++i];
    else if (argv[i] === "--dry") args.dry = true;
  }
  return args;
}

/** Pull the text content of a `<script type="__bundler/<name>">` block. */
function extractScript(html, name) {
  const open = `<script type="__bundler/${name}">`;
  const start = html.indexOf(open);
  if (start === -1) throw new Error(`missing __bundler/${name} block`);
  const from = start + open.length;
  const end = html.indexOf("</script>", from);
  if (end === -1) throw new Error(`unterminated __bundler/${name} block`);
  return html.slice(from, end).trim();
}

/** Map a MIME type to a file extension for assets that lack a named url. */
const MIME_EXT = {
  "text/css": ".css",
  "text/html": ".html",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/svg+xml": ".svg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "font/woff2": ".woff2",
  "font/woff": ".woff",
  "application/json": ".json",
  "text/javascript": ".js",
};

/** Derive a stable, path-safe filename for an asset from its source url or uuid. */
function fileNameFor(uuid, mime, url) {
  if (url) {
    try {
      const u = new URL(url);
      const base = (u.pathname.split("/").pop() || "").split("?")[0];
      if (base && extname(base)) return `${u.hostname}/${base}`;
      if (base) return `${u.hostname}/${base}${MIME_EXT[mime] || ""}`;
    } catch {
      /* not a url — fall through to uuid naming */
    }
  }
  return `by-uuid/${uuid}${MIME_EXT[mime] || ""}`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const htmlPath = fromRoot(args.html);
  const outDir = fromRoot(args.out);

  if (!existsSync(htmlPath)) {
    console.error(`source HTML not found: ${htmlPath}`);
    process.exit(1);
  }

  const html = readFileSync(htmlPath, "utf8");
  const manifest = JSON.parse(extractScript(html, "manifest"));
  const extResources = JSON.parse(extractScript(html, "ext_resources"));

  // uuid -> original resource url (for meaningful filenames).
  const urlByUuid = new Map();
  for (const r of extResources) if (r.uuid && r.id) urlByUuid.set(r.uuid, r.id);

  const uuids = Object.keys(manifest);
  const inventory = [];
  let written = 0;
  let bytesOut = 0;

  for (const uuid of uuids) {
    const entry = manifest[uuid];
    const raw = Buffer.from(entry.data, "base64");
    const bytes = entry.compressed ? gunzipSync(raw) : raw;
    const rel = fileNameFor(uuid, entry.mime, urlByUuid.get(uuid));
    inventory.push({ uuid, mime: entry.mime, compressed: !!entry.compressed, bytes: bytes.length, file: rel, url: urlByUuid.get(uuid) || null });

    if (!args.dry) {
      const dest = join(outDir, rel);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, bytes);
    }
    written++;
    bytesOut += bytes.length;
  }

  if (!args.dry) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "manifest.json"), JSON.stringify(inventory, null, 2));
  }

  const kb = (n) => `${(n / 1024).toFixed(1)} KiB`;
  console.log(`${args.dry ? "[dry] " : ""}extracted ${written} assets (${kb(bytesOut)} decoded) from ${args.html}`);
  console.log(`${args.dry ? "[dry] " : ""}output: ${args.out}${args.dry ? " (nothing written)" : "  (+ manifest.json inventory)"}`);
  console.log("source HTML left untouched.");
}

main();
