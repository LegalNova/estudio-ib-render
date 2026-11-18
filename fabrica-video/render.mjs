// node render.mjs <unidad> [--concurrency=N]
//
// Render de un vídeo de la fábrica, igual en el Mac (scripts/fabrica/video.ts)
// y en GitHub Actions (LegalNova/estudio-ib-render): Remotion pinta
// directamente a 540×960 (la composición es de 1080×1920 y se renderiza con
// --scale=0.5, así el texto se rasteriza ya a 540 px) y codifica una sola vez
// H.264 crf 30 con tope de ~0,8 Mbps. Después ffmpeg (el de Remotion) solo
// copia el vídeo y deja el audio en AAC mono a 64 kbps con faststart.
//
// Entrada: public/trabajo/<unidad>/props.json. Salida: out/<unidad>.mp4.

import { spawnSync } from 'node:child_process';
import { availableParallelism } from 'node:os';
import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const unidad = args.find((a) => !a.startsWith('--'));
if (!unidad) {
  console.error('Uso: node render.mjs <unidad> [--concurrency=N]');
  process.exit(2);
}
const valor = (k) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
// En el Mac (10 núcleos) el punto óptimo medido es 8; en los runners de GitHub (4 vCPU), todos.
const concurrencia = valor('--concurrency') ?? process.env.RENDER_CONCURRENCY ?? String(Math.max(1, availableParallelism() - (process.platform === 'darwin' ? 2 : 0)));

const props = join(AQUI, 'public', 'trabajo', unidad, 'props.json');
if (!existsSync(props)) {
  console.error(`No existe ${props}`);
  process.exit(2);
}
const out = join(AQUI, 'out');
mkdirSync(out, { recursive: true });
const crudo = join(out, `${unidad}.crudo.mp4`);
const final = join(out, `${unidad}.mp4`);

function correr(cmd, argv, intentos = 1) {
  for (let i = 1; i <= intentos; i++) {
    const r = spawnSync(cmd, argv, { cwd: AQUI, stdio: 'inherit' });
    if (r.status === 0) return;
    console.error(`Falló (intento ${i}/${intentos}): ${cmd} ${argv.slice(0, 3).join(' ')}…`);
    if (i === intentos) process.exit(r.status ?? 1);
  }
}

const t0 = Date.now();
// Con el Mac cargado, a veces un fotograma tarda en cargar y Remotion aborta: un reintento basta.
correr('npx', [
  'remotion', 'render', 'src/index.ts', 'ClaseVideo', crudo,
  `--props=${props}`,
  '--scale=0.5', '--jpeg-quality=90',
  '--codec=h264', '--crf=30', '--x264-preset=slow', '--max-rate=800k', '--buffer-size=1600k',
  '--audio-codec=aac', '--audio-bitrate=192k',
  `--concurrency=${concurrencia}`, '--timeout=120000', '--log=error',
  // Uso personal: no hace falta clave. Si algún día hay una, va en REMOTION_LICENSE_KEY.
  ...(process.env.REMOTION_LICENSE_KEY ? [`--license-key=${process.env.REMOTION_LICENSE_KEY}`] : []),
], 2);
const t1 = Date.now();
correr('npx', [
  'remotion', 'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', crudo,
  '-map', '0:v:0', '-map', '0:a:0', '-c:v', 'copy', '-c:a', 'aac', '-ac', '1', '-b:a', '64k', '-movflags', '+faststart', final,
]);
rmSync(crudo, { force: true });
const seg = (ms) => Math.round(ms / 1000);
console.log(
  `✓ ${unidad}.mp4 · ${(statSync(final).size / 1024 / 1024).toFixed(1)} MB · render ${seg(t1 - t0)} s · audio ${seg(Date.now() - t1)} s · concurrencia ${concurrencia}`,
);
