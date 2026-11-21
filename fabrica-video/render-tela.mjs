// node render-tela.mjs <id> [--concurrency=N]
//
// Render de un capítulo de «La tela» (composición TelaVideo, 1920×1080):
// Remotion pinta directamente a 1280×720 (--scale=2/3, el texto se rasteriza
// ya a 720p) y codifica una vez H.264 crf 30 con tope de ~0,9 Mbps. Después
// ffmpeg (el de Remotion) copia el vídeo y deja el audio en AAC mono a 96 kbps
// con faststart. Objetivo: < 45 MB por 6 minutos (GitHub Pages: máx. 100 MB).
//
// Entrada: public/trabajo/<id>/props.json. Salida: out/<id>.mp4.

import { spawnSync } from 'node:child_process';
import { availableParallelism } from 'node:os';
import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--'));
if (!id) {
  console.error('Uso: node render-tela.mjs <id> [--concurrency=N]');
  process.exit(2);
}
const valor = (k) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const concurrencia = valor('--concurrency') ?? process.env.RENDER_CONCURRENCY ?? String(Math.max(1, availableParallelism() - (process.platform === 'darwin' ? 2 : 0)));

const props = join(AQUI, 'public', 'trabajo', id, 'props.json');
if (!existsSync(props)) {
  console.error(`No existe ${props}`);
  process.exit(2);
}
const out = join(AQUI, 'out');
mkdirSync(out, { recursive: true });
const crudo = join(out, `${id}.crudo.mp4`);
const final = join(out, `${id}.mp4`);

function correr(cmd, argv, intentos = 1) {
  for (let i = 1; i <= intentos; i++) {
    const r = spawnSync(cmd, argv, { cwd: AQUI, stdio: 'inherit' });
    if (r.status === 0) return;
    console.error(`Falló (intento ${i}/${intentos}): ${cmd} ${argv.slice(0, 3).join(' ')}…`);
    if (i === intentos) process.exit(r.status ?? 1);
  }
}

const t0 = Date.now();
correr('npx', [
  'remotion', 'render', 'src/index.ts', 'TelaVideo', crudo,
  `--props=${props}`,
  '--scale=0.6666666666666666', '--jpeg-quality=90',
  '--codec=h264', '--crf=30', '--x264-preset=slow', '--max-rate=900k', '--buffer-size=1800k',
  '--audio-codec=aac', '--audio-bitrate=192k',
  `--concurrency=${concurrencia}`, '--timeout=120000', '--log=error',
  ...(process.env.REMOTION_LICENSE_KEY ? [`--license-key=${process.env.REMOTION_LICENSE_KEY}`] : []),
], 2);
const t1 = Date.now();
// «0:a:0?»: si el capítulo no trae audio (pruebas), no falla.
correr('npx', [
  'remotion', 'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', crudo,
  '-map', '0:v:0', '-map', '0:a:0?', '-c:v', 'copy', '-c:a', 'aac', '-ac', '1', '-b:a', '96k', '-movflags', '+faststart', final,
]);
rmSync(crudo, { force: true });
const seg = (ms) => Math.round(ms / 1000);
console.log(`✓ ${id}.mp4 · ${(statSync(final).size / 1024 / 1024).toFixed(1)} MB · render ${seg(t1 - t0)} s · audio ${seg(Date.now() - t1)} s · concurrencia ${concurrencia}`);
