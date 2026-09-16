import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'dist-electron');
fs.mkdirSync(outDir, { recursive: true });

const common = {
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  external: ['electron'],
  sourcemap: true,
  logLevel: 'info',
};

await esbuild.build({
  ...common,
  entryPoints: [path.join(root, 'electron/main.ts')],
  outfile: path.join(outDir, 'main.js'),
});

await esbuild.build({
  ...common,
  entryPoints: [path.join(root, 'electron/preload.ts')],
  outfile: path.join(outDir, 'preload.js'),
});

console.log('[build-electron] dist-electron/main.js + preload.js ready');
