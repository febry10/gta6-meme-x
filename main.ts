// gta6-meme-x-01 entry program (Node 22, standard library only).
//
// The entry itself is a post on X; this program's single job is to hand the
// post's address to the grader. It reads POST.json from the repository root,
// parses it, and copies the file byte-for-byte into the output directory.
// If POST.json is missing or unreadable it exits 1 with a clear message.
//
// MAKEFUN_BOT_DIR points at the repository root and MAKEFUN_OUTPUT_DIR at
// the output directory when the grader provides them; the defaults suit a
// plain local run:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const botDir = process.env.MAKEFUN_BOT_DIR ?? '.';
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const sourcePath = join(botDir, 'POST.json');
const targetPath = join(outputDir, 'POST.json');

function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

let raw: Buffer;
try {
  raw = readFileSync(sourcePath);
} catch {
  fail(`POST.json not found at ${sourcePath} - the entry needs a POST.json naming the X post.`);
}

let parsed: unknown;
try {
  parsed = JSON.parse(raw!.toString('utf8'));
} catch {
  fail(`POST.json at ${sourcePath} is not valid JSON.`);
}

const url = (parsed as { url?: unknown } | null)?.url;
if (typeof url !== 'string' || url.length === 0) {
  fail('POST.json must be a JSON object with a non-empty string "url" field.');
}

// The grader reads the post from X itself, so the address has to be exactly
// the shape X shows: https://x.com/<handle>/status/<numeric id>. Anything
// else (placeholders included) is refused here rather than at the gate.
// POST.json is also capped at 16384 bytes by the competition's guardrails.
const POST_URL_PATTERN = /^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}\/status\/[1-9][0-9]*$/;
if (raw!.byteLength > 16384) {
  fail(`POST.json is ${raw!.byteLength} bytes; the limit is 16384 bytes.`);
}
if (!POST_URL_PATTERN.test(url as string)) {
  fail(`POST.json url "${url}" is not an https://x.com/<handle>/status/<numeric id> address.`);
}

mkdirSync(outputDir, { recursive: true });
copyFileSync(sourcePath, targetPath);
console.log(`POST.json handed in: ${url} -> ${targetPath}`);
