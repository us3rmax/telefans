/**
 * Flatten the TanStack Start build into a static `dist/` that Blink hosting serves.
 *
 * TanStack Start's `vite build` (configured with `build.outDir: '.vite-out'`)
 * emits:
 * .vite-out/client/   ← prerendered HTML + assets (what we want, STATIC)
 * .vite-out/server/   ← SSR Nitro server (NOT used by Blink's static S3 hosting)
 *
 * Blink uploads `dist/` and serves `dist/index.html` (see src/constants/publish.ts
 * BUILD_PATHS['vite-react'] = 'dist'). So we copy `.vite-out/client/*` up into a
 * flat `dist/` and drop the server.
 *
 * Why build into `.vite-out` instead of `dist/` directly: the platform pre-injects
 * `dist/.../_redirects` (the SPA fallback) owned by another user, and Start's client
 * build tries to EMPTY its out dir first → `EACCES: unlink _redirects`. Building into
 * a clean temp dir avoids that entirely; here we only COPY into `dist/` (never delete),
 * so a pre-existing read-only `_redirects` is tolerated.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = '.vite-out/client'
const DEST = 'dist'

if (!existsSync(SRC)) {
  console.error(`[finalize] build output missing: ${SRC} — did "vite build" run?`)
  process.exit(1)
}

mkdirSync(DEST, { recursive: true })

for (const entry of readdirSync(SRC)) {
  try {
    cpSync(join(SRC, entry), join(DEST, entry), { recursive: true, force: true })
  } catch (e) {
    // ONLY the platform-pre-injected `_redirects` may be skipped: it's read-only,
    // already in dist/, and byte-identical to ours. ANY other failed entry (assets/,
    // index.html, route html) would leave dist/index.html pointing at missing or
    // stale hashed assets — a silently broken deployment. Fail the build instead.
    if (entry === '_redirects') {
      console.warn(`[finalize] skip ${entry}: ${e.code || e.message} (pre-injected, identical content)`)
    } else {
      console.error(`[finalize] FAILED copying ${entry} into dist/: ${e.code || e.message} — aborting (a partial dist/ deploys broken)`)
      process.exit(1)
    }
  }
}

rmSync('.vite-out', { recursive: true, force: true })

if (!existsSync(join(DEST, 'index.html'))) {
  // With prerender disabled, TanStack Start emits the client assets but no
  // document shell. Build a minimal SPA shell from the generated bootstrap
  // bundle so Vercel can still serve the client-rendered Mini App.
  const assetsDir = join(DEST, 'assets')
  const bootstrap = readdirSync(assetsDir)
    .filter(name => name.endsWith('.js'))
    .find(name => readFileSync(join(assetsDir, name), 'utf8').includes('createRoot'))
  if (!bootstrap) {
    console.error('[finalize] dist/index.html missing and no client bootstrap was found')
    process.exit(1)
  }
  const styles = readdirSync(assetsDir)
    .filter(name => name.endsWith('.css'))
    .map(name => `    <link rel="stylesheet" href="/assets/${name}" />`)
    .join('\n')
  writeFileSync(join(DEST, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" /><meta name="theme-color" content="#0b0b0d" />${styles ? `\n${styles}` : ''}<title>TeleFans</title></head><body><div id="app"></div><script type="module" src="/assets/${bootstrap}"></script></body></html>\n`)
  console.log(`[finalize] generated static SPA shell with ${bootstrap}`)
}

console.log('[finalize] ✓ static build flattened to dist/ (dist/index.html ready)')
