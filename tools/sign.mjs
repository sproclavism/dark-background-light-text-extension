#!/usr/bin/env node
/**
 * Release build, then sign it through AMO for self-distribution.
 *
 * Credentials come from the environment (WEB_EXT_API_KEY, WEB_EXT_API_SECRET)
 * as web-ext reads them itself. Any further arguments are passed on to
 * `web-ext sign`.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { source_id } from './source-id.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const out_root = process.env.ADDON_BUILD_OUT ?? root;

// running the release build is a side effect of importing it
await import('./build.mjs');

// the build output is ignored by git, so this hashes to the same id the build
// just used
const dest_dir = path.join(out_root, `build-release-${source_id(root)}`);

const web_ext = fileURLToPath(
  new URL('./bin/web-ext.js', import.meta.resolve('web-ext')),
);
const args = [
  'sign',
  '--source-dir',
  dest_dir,
  '--channel',
  'unlisted',
  ...process.argv.slice(2),
];
const child = spawn(process.execPath, [web_ext, ...args], {
  cwd: root,
  stdio: 'inherit',
});
child.on('exit', (code) => process.exit(code ?? 1));
