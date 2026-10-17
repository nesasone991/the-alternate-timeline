#!/usr/bin/env node
// Deployment check for the built site (dist/). Run after `npm run build`:
//   node scripts/check-dist.mjs            (uses the same env vars as the build)
// Fails (exit 1) on anything that would break or weaken a Cloudflare Pages deployment.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { headersFile, resolveReleaseConfig, robotsFile, robotsMeta } from './release.mjs';

const DIST = process.argv[2] ?? 'dist';
const MAX_FILE_BYTES = 25 * 1024 * 1024; // Cloudflare Pages free plan: 25 MiB per asset
const MAX_FILES = 20000; // Cloudflare Pages free plan: 20,000 files
const MAIN_JS_GZIP_BUDGET = 160 * 1024; // performance budget for the entry chunk
const SECRET_PATTERNS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key'],
  [/\bgh[pousr]_[A-Za-z0-9]{36,}\b/, 'GitHub token'],
  [/\bxox[abpr]-[A-Za-z0-9-]{10,}/, 'Slack token'],
  [/\bsk-[A-Za-z0-9_-]{20,}/, 'API secret key'],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, 'Google API key'],
];

const failures = [];
const notes = [];
const fail = (message) => failures.push(message);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

if (!existsSync(DIST)) {
  console.error(`No ${DIST}/ folder. Run npm run build first.`);
  process.exit(1);
}
const files = walk(DIST);
const rel = (path) => relative(DIST, path).split('\\').join('/');
const config = resolveReleaseConfig(process.env);
if (config.errors.length) config.errors.forEach(fail);

// 1. Single-page app routing on Cloudflare Pages: no top-level 404.html, or Pages stops serving index.html for app routes.
if (existsSync(join(DIST, '404.html'))) fail('dist/404.html exists: Cloudflare Pages would stop treating the site as a single-page app.');
if (existsSync(join(DIST, '_redirects'))) {
  const redirects = readFileSync(join(DIST, '_redirects'), 'utf8');
  if (/^\s*\/\*\s+\/index\.html/m.test(redirects)) fail('dist/_redirects rewrites /* to /index.html: not needed on Pages (SPA mode) and can conflict with it.');
}

// 2. Entry document.
const indexPath = join(DIST, 'index.html');
if (!existsSync(indexPath)) fail('dist/index.html is missing.');
const index = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '';
const entry = index.match(/<script[^>]+type="module"[^>]+src="\/(assets\/[^"]+\.js)"/)?.[1];
if (!entry || !existsSync(join(DIST, entry))) fail('index.html does not load a hashed /assets/*.js entry that exists.');
if (/src="\/src\//.test(index)) fail('index.html still points at /src/: this is not a production build.');
const meta = robotsMeta(config);
if (meta && !index.includes(`<meta name="robots" content="${meta}"`)) fail(`index.html lacks <meta name="robots" content="${meta}"> for the ${config.channel} channel.`);
if (!meta && /<meta name="robots"/.test(index)) fail('index.html has a robots meta tag in a production build.');
if (!/<title>[^<]+<\/title>/.test(index)) fail('index.html has no <title>.');
if (!/<meta\s+name="description"\s+content="[^"]{40,}"/.test(index)) fail('index.html has no useful meta description.');

// 3. Generated hosting files match the configuration exactly.
for (const [name, expected] of [
  ['_headers', headersFile(config)],
  ['robots.txt', robotsFile(config)],
]) {
  const path = join(DIST, name);
  if (!existsSync(path)) fail(`dist/${name} is missing.`);
  else if (readFileSync(path, 'utf8') !== expected) fail(`dist/${name} does not match the ${config.channel} configuration.`);
}

// 4. No source maps or environment files, nothing too large, not too many files.
for (const path of files) {
  const name = rel(path);
  const size = statSync(path).size;
  if (name.endsWith('.map')) fail(`Source map shipped: ${name} (would publish the source code).`);
  if (/(^|\/)\.env/.test(name)) fail(`Environment file shipped: ${name}.`);
  if (size > MAX_FILE_BYTES) fail(`${name} is ${size} bytes, over the 25 MiB per-file limit.`);
}
if (files.length > MAX_FILES) fail(`${files.length} files, over the ${MAX_FILES}-file limit.`);

// 5. No secrets in any text asset.
for (const path of files) {
  if (!/\.(js|css|html|txt|json|svg|webmanifest)$|_headers$|_redirects$/.test(path)) continue;
  const text = readFileSync(path, 'utf8');
  for (const [pattern, label] of SECRET_PATTERNS) if (pattern.test(text)) fail(`Possible ${label} in ${rel(path)}.`);
}

// 6. Performance budget for the entry chunk.
if (entry && existsSync(join(DIST, entry))) {
  const gz = gzipSync(readFileSync(join(DIST, entry))).length;
  notes.push(`Entry chunk ${entry}: ${(statSync(join(DIST, entry)).size / 1024).toFixed(0)} kB, ${(gz / 1024).toFixed(0)} kB gzipped (budget ${MAIN_JS_GZIP_BUDGET / 1024} kB).`);
  if (gz > MAIN_JS_GZIP_BUDGET) fail(`Entry chunk is ${(gz / 1024).toFixed(0)} kB gzipped, over the ${MAIN_JS_GZIP_BUDGET / 1024} kB budget.`);
}

// 7. The build label carries the commit id when the build machine provides one.
const commit = (process.env.VITE_BUILD_COMMIT || process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || '').slice(0, 7);
if (commit) {
  const found = files.some((path) => path.endsWith('.js') && readFileSync(path, 'utf8').includes(`"${commit}"`));
  if (!found) fail(`The build commit ${commit} is not in the JavaScript: the footer build label would be missing.`);
  else notes.push(`Build label commit: ${commit}.`);
}

notes.push(`Channel: ${config.channel}. Analytics: ${config.analyticsEndpoint ? new URL(config.analyticsEndpoint).host : 'off'}. Feedback link: ${config.feedbackUrl ? 'set' : 'not set'}. Files: ${files.length}.`);
notes.forEach((note) => console.log(note));
if (failures.length) {
  console.error(`\nDeployment check FAILED (${failures.length}):`);
  failures.forEach((message) => console.error(`  - ${message}`));
  process.exit(1);
}
console.log('Deployment check passed.');
