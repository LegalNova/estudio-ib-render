// node render-clips.mjs <id> [<id>…] [--concurrency=N]
//
// Render de clips verticales del feed (composición ClipTela, 1080×2340) con un
// solo bundle para todos: Remotion pinta a 720×1560 (--scale 2/3), H.264 crf 28
// con tope ~1,1 Mbps; ffmpeg deja el audio en AAC mono 80 kbps con faststart y
// saca un póster JPG. Igual en el Mac y en GitHub Actions (workflow clips.yml).
//
// Entrada: public/trabajo/clips/<id>/props.json. Salida: out/clips/<id>.{mp4,jpg}.

import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { spawnSync } from 'node:child_process';
import { availableParallelism } from 'node:os';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const ids = args.filter((a) => !a.startsWith('--'));
if (!ids.length) {
  console.error('Uso: node render-clips.mjs <id> [<id>…] [--concurrency=N]');
  process.exit(2);
}
const valor = (k) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const concurrencia = Number(valor('--concurrency') ?? process.env.RENDER_CONCURRENCY ?? Math.max(1, availableParallelism() - (process.platform === 'darwin' ? 2 : 0)));
const out = join(AQUI, 'out', 'clips');
mkdirSync(out, { recursive: true });

const t0 = Date.now();
const serveUrl = await bundle({ entryPoint: join(AQUI, 'src', 'index.ts'), publicDir: join(AQUI, 'public') });
console.log(`bundle ${Math.round((Date.now() - t0) / 1000)} s`);

let fallos = 0;
for (const id of ids) {
  const props = join(AQUI, 'public', 'trabajo', 'clips', id, 'props.json');
  if (!existsSync(props)) {
    console.error(`No existe ${props}`);
    fallos++;
    continue;
  }
  const inputProps = JSON.parse(readFileSync(props, 'utf8'));
  const crudo = join(out, `${id}.crudo.mp4`);
  const final = join(out, `${id}.mp4`);
  const t1 = Date.now();
  let ok = false;
  for (let intento = 1; intento <= 2 && !ok; intento++) {
    try {
      const composition = await selectComposition({ serveUrl, id: 'ClipTela', inputProps });
      await renderMedia({
        composition, serveUrl, inputProps, codec: 'h264', outputLocation: crudo,
        scale: 2 / 3, jpegQuality: 90, crf: 28, x264Preset: 'slow', encodingMaxRate: '1100k', encodingBufferSize: '2200k',
        audioBitrate: '192k', concurrency: concurrencia, timeoutInMilliseconds: 120000, logLevel: 'error',
        ...(process.env.REMOTION_LICENSE_KEY ? { licenseKey: process.env.REMOTION_LICENSE_KEY } : {}),
      });
      // Póster: un fotograma con el título y el visual ya montados.
      await renderStill({
        composition, serveUrl, inputProps, output: join(out, `${id}.jpg`), scale: 2 / 3, imageFormat: 'jpeg', jpegQuality: 78,
        frame: Math.min(composition.durationInFrames - 1, 75),
      });
      ok = true;
    } catch (e) {
      console.error(`${id}: falló el intento ${intento}: ${e?.message ?? e}`);
    }
  }
  if (!ok) {
    fallos++;
    continue;
  }
  const r = spawnSync('npx', ['remotion', 'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', crudo, '-map', '0:v:0', '-map', '0:a:0?', '-c:v', 'copy', '-c:a', 'aac', '-ac', '1', '-b:a', '80k', '-movflags', '+faststart', final], { cwd: AQUI, stdio: 'inherit' });
  rmSync(crudo, { force: true });
  if (r.status !== 0) {
    fallos++;
    continue;
  }
  console.log(`✓ ${id} · ${(statSync(final).size / 1024 / 1024).toFixed(1)} MB · ${Math.round((Date.now() - t1) / 1000)} s`);
}
console.log(`Hecho: ${ids.length - fallos}/${ids.length} en ${Math.round((Date.now() - t0) / 1000)} s`);
process.exit(fallos ? 1 : 0);
