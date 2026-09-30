import { build } from 'esbuild';
import { mkdirSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const dir = resolve('.test-build');
mkdirSync(dir, { recursive: true });
const outfile = resolve(dir, 'sprite.test.mjs');
await build({ entryPoints: ['tests/sprite.test.ts'], bundle: true, platform: 'node', format: 'esm', outfile });
const result = spawnSync(process.execPath, ['--test', outfile], { stdio: 'inherit' });
unlinkSync(outfile);
process.exitCode = result.status ?? 1;
