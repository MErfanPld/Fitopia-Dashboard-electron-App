import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import * as esbuild from 'esbuild';
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
console.log('[dev] Electron main/preload compiled');

const vite = spawn('npx', ['vite', '--port=3000', '--host=127.0.0.1'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env },
});

const waitOn = (await import('wait-on')).default;
try {
  await waitOn({ resources: ['http://127.0.0.1:3000'], timeout: 90000, interval: 400 });
  console.log('[dev] Vite ready — launching Electron');
  const electronBin = path.join(root, 'node_modules', 'electron', 'cli.js');
  const electron = spawn(process.execPath, [electronBin, '.'], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: 'http://127.0.0.1:3000',
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
    },
  });
  electron.on('close', (code) => {
    vite.kill();
    process.exit(code ?? 0);
  });
} catch (err) {
  console.error('[dev] Failed waiting for Vite:', err);
  vite.kill();
  process.exit(1);
}

process.on('SIGINT', () => {
  vite.kill();
  process.exit(0);
});
