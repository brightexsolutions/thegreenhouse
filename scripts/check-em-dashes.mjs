#!/usr/bin/env node
/**
 * Fails the build if an em dash reaches user-facing copy.
 *
 * Green House copy does not use em dashes anywhere a visitor can read them:
 * page text, email templates, generated documents, admin labels. They creep
 * back in constantly through AI-drafted copy and pasted text, so this is
 * enforced rather than trusted.
 *
 * Code comments are out of scope. They are not copy, there are hundreds of
 * them, and rewriting them would churn the diff without changing anything a
 * reader sees. The scanner strips comments before looking.
 *
 * The en dash (U+2013) stays allowed: it is correct in numeric ranges such as
 * "2–4 weeks" and as an empty-cell placeholder.
 *
 * Run: npm run lint:copy
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOTS = ["app", "components", "lib"];
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "dist", "build"]);

const EM_DASH = "—";

const offences = [];

/**
 * Blank out comment regions in one line so the em dash search only sees code
 * and string literals. Returns the masked line plus the block-comment state
 * to carry into the next line.
 */
function maskComments(line, inBlock) {
  const chars = [...line];
  let i = 0;
  let inString = null;
  let blockStart = inBlock ? 0 : null;

  const blank = (from, to) => {
    for (let k = from; k < to; k++) chars[k] = " ";
  };

  while (i < line.length) {
    if (inBlock) {
      if (line.startsWith("*/", i)) {
        blank(blockStart ?? 0, i + 2);
        inBlock = false;
        blockStart = null;
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }

    const ch = line[i];

    if (inString) {
      if (ch === "\\") { i += 2; continue; }
      if (ch === inString) inString = null;
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") { inString = ch; i += 1; continue; }

    if (line.startsWith("//", i)) { blank(i, line.length); break; }

    if (line.startsWith("/*", i)) { inBlock = true; blockStart = i; i += 2; continue; }

    i += 1;
  }

  if (inBlock) blank(blockStart ?? 0, line.length);

  return { masked: chars.join(""), inBlock };
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      walk(path);
      continue;
    }
    if (!EXTENSIONS.has(extname(entry))) continue;

    let inBlock = false;
    readFileSync(path, "utf8").split("\n").forEach((line, i) => {
      const result = maskComments(line, inBlock);
      inBlock = result.inBlock;
      if (result.masked.includes(EM_DASH)) {
        offences.push({ path, line: i + 1, text: line.trim().slice(0, 120) });
      }
    });
  }
}

for (const root of ROOTS) walk(root);

if (offences.length > 0) {
  console.error(`\nFound ${offences.length} em dash(es) in copy. Use a colon, a comma, or split the sentence.\n`);
  for (const o of offences) {
    console.error(`  ${o.path}:${o.line}\n    ${o.text}`);
  }
  console.error("");
  process.exit(1);
}

console.log("No em dashes in copy.");
