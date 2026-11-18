import { Audio } from '@remotion/media';
import { linearTiming, TransitionSeries, type TransitionPresentation } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { Fragment } from 'react';
import { AbsoluteFill, Img, random, staticFile, useCurrentFrame } from 'remotion';
import { Escena } from './Escena';
import { C } from './estilo';
import type { PropsVideo } from './tipos';

// Composición «ClaseVideo»: vertical 1080×1920 a 30 fps. Recibe el
// storyboard ya resuelto (ver tipos.ts) y monta las escenas con transiciones,
// grano de película, viñeta, barra de progreso y música con ducking.
// Es 100 % programática: se genera desde el JSON, no se edita en Studio.

export function duracionTotal(p: PropsVideo): number {
  return p.escenas.reduce((s, e, i) => s + e.frames - (i > 0 ? e.entrada : 0), 0);
}

const Grano: React.FC<{ texturas: string[] }> = ({ texturas }) => {
  const frame = useCurrentFrame();
  if (texturas.length === 0) return null;
  const t = texturas[Math.floor(frame / 2) % texturas.length]!;
  // Parpadeo de proyector, muy leve.
  const parpadeo = 0.025 * random(`p${Math.floor(frame / 2)}`);
  return (
    <>
      <Img src={staticFile(t)} style={{ position: 'absolute', inset: 0, width: 1080, height: 1920, opacity: 0.16, mixBlendMode: 'overlay' }} />
      <AbsoluteFill style={{ background: '#000', opacity: parpadeo }} />
    </>
  );
};

const Vineta: React.FC = () => (
  <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)' }} />
);

const Progreso: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', top: 70, left: 80, right: 80, height: 6, borderRadius: 3, background: 'rgba(246,239,224,0.18)' }}>
      <div style={{ width: `${(frame / total) * 100}%`, height: 6, borderRadius: 3, background: C.ambar }} />
    </div>
  );
};

/** Volumen de la música: baja bajo la voz (ducking) y sube en los huecos, con rampas de ~0,4 s. */
function volumenMusica(voz: Array<[number, number]>, total: number) {
  const BAJO = 0.07;
  const ALTO = 0.2;
  const RAMPA = 12;
  return (f: number): number => {
    let d = Infinity;
    for (const [a, b] of voz) {
      if (f >= a && f < b) {
        d = 0;
        break;
      }
      d = Math.min(d, f < a ? a - f : f - b);
    }
    const v = BAJO + (ALTO - BAJO) * Math.min(1, d / RAMPA);
    // Entrada y salida suaves.
    const borde = Math.min(1, f / 30, (total - f) / 45);
    return v * Math.max(0, borde);
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function presentacion(t: 'fundido' | 'deslizar' | 'barrido'): TransitionPresentation<any> {
  if (t === 'deslizar') return slide({ direction: 'from-right' });
  if (t === 'barrido') return wipe({ direction: 'from-left' });
  return fade();
}

export const ClaseVideo: React.FC<PropsVideo> = (p) => {
  const total = duracionTotal(p);
  return (
    <AbsoluteFill style={{ backgroundColor: C.fondo }}>
      <TransitionSeries>
        {p.escenas.map((e, i) => (
          <Fragment key={e.id}>
            {i > 0 ? (
              <TransitionSeries.Transition
                presentation={presentacion(e.transicion)}
                timing={linearTiming({ durationInFrames: e.entrada })}
              />
            ) : null}
            <TransitionSeries.Sequence name={e.id} durationInFrames={e.frames}>
              <Escena e={e} indice={i} idioma={p.idioma ?? 'es'} />
            </TransitionSeries.Sequence>
          </Fragment>
        ))}
      </TransitionSeries>
      <Vineta />
      <Grano texturas={p.grano} />
      <Progreso total={total} />
      {p.musica ? <Audio src={staticFile(p.musica)} volume={volumenMusica(p.voz, total)} /> : null}
    </AbsoluteFill>
  );
};
