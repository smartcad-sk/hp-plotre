#!/usr/bin/env node
/**
 * Removes large transparent borders from imported PNG/WebP images (e.g. latexove-plotre.png is
 * 1659×1246 with the printers in a ~350 px band; the rest is empty space that became padding on
 * the page). Used by import-content.mjs after downloading; can also be run on its own:
 *
 *   node scripts/trim-images.mjs   → trims public/media and updates width/height in src/content/*.json
 *
 * Only trims when the top-left pixel is fully transparent and at least 10 % of the width or height
 * would be removed, so ordinary images and logos with a thin margin are left alone. Idempotent.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIN_REMOVED = 0.1;
const PAD = 8; // keep a little breathing room around the trimmed content

/** Trims a file in place. Returns the new { width, height } or null when unchanged. */
export async function trimTransparentBorders(file) {
  if (!/\.(png|webp)$/i.test(file)) return null;
  const input = await readFile(file);
  const meta = await sharp(input).metadata();
  if (!meta.hasAlpha || !meta.width || !meta.height) return null;
  const [, , , alpha] = await sharp(input).ensureAlpha().extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer();
  if (alpha !== 0) return null;

  const { info } = await sharp(input).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
  const removedW = 1 - info.width / meta.width;
  const removedH = 1 - info.height / meta.height;
  if (removedW < MIN_REMOVED && removedH < MIN_REMOVED) return null;

  const left = Math.max(0, -(info.trimOffsetLeft ?? 0) - PAD);
  const top = Math.max(0, -(info.trimOffsetTop ?? 0) - PAD);
  const width = Math.min(meta.width - left, info.width + 2 * PAD);
  const height = Math.min(meta.height - top, info.height + 2 * PAD);
  const out = await sharp(input).extract({ left, top, width, height }).toFormat(meta.format).toBuffer();
  await writeFile(file, out);
  return { width, height };
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function main() {
  const mediaDir = path.join(ROOT, "public", "media");
  const changed = new Map();
  for await (const file of walk(mediaDir)) {
    const dims = await trimTransparentBorders(file);
    if (dims) {
      const src = "/media/" + path.relative(mediaDir, file).split(path.sep).join("/");
      changed.set(src, dims);
      console.log(`trimmed ${src} → ${dims.width}×${dims.height}`);
    }
  }
  if (!changed.size) return console.log("nothing to trim");

  const update = (node) => {
    if (Array.isArray(node)) node.forEach(update);
    else if (node && typeof node === "object") {
      const dims = typeof node.src === "string" && changed.get(node.src);
      if (dims && "width" in node) Object.assign(node, dims);
      Object.values(node).forEach(update);
    }
  };
  for (const name of ["pages.json", "posts.json"]) {
    const file = path.join(ROOT, "src", "content", name);
    const data = JSON.parse(await readFile(file, "utf8"));
    update(data);
    await writeFile(file, JSON.stringify(data, null, 2) + "\n");
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
