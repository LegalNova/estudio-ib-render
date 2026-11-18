import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, SANS } from './estilo';
import { sinLatex } from './Formula';
import type { Palabra } from './tipos';

// Subtítulos quemados, por frases cortas (máx. ~7 palabras, se corta en la
// puntuación o en una pausa), con la palabra que suena resaltada en ámbar.
// Van en la parte baja de la zona segura y nunca tapan el centro. Enseñan lo
// que se dice (la narración, en palabras): si se colara LaTeX, sale legible.

interface Pagina {
  palabras: Palabra[];
  desdeMs: number;
  hastaMs: number;
}

export function paginar(palabras: Palabra[], max = 7): Pagina[] {
  const paginas: Pagina[] = [];
  let actual: Palabra[] = [];
  const cerrar = (): void => {
    if (actual.length === 0) return;
    paginas.push({ palabras: actual, desdeMs: actual[0]!.desdeMs, hastaMs: actual[actual.length - 1]!.hastaMs });
    actual = [];
  };
  palabras.forEach((p, i) => {
    actual.push(p);
    const sig = palabras[i + 1];
    const pausa = sig ? sig.desdeMs - p.hastaMs : 0;
    const finFrase = /[.!?…:;»]$/.test(p.texto);
    const coma = /,$/.test(p.texto);
    const largo = actual.map((x) => sinLatex(x.texto)).join(' ').length;
    if (finFrase || pausa > 450 || actual.length >= max || largo > 40 || (coma && actual.length >= 3)) cerrar();
  });
  cerrar();
  // Cada página se queda hasta que empieza la siguiente (sin parpadeos).
  for (let i = 0; i < paginas.length - 1; i++) {
    const sig = paginas[i + 1]!;
    if (sig.desdeMs - paginas[i]!.hastaMs < 700) paginas[i]!.hastaMs = sig.desdeMs;
  }
  return paginas;
}

export const Subtitulos: React.FC<{ palabras: Palabra[] }> = ({ palabras }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const paginas = paginar(palabras);
  const pagina = paginas.find((p) => ms >= p.desdeMs - 60 && ms < p.hastaMs + 250);
  if (!pagina) return null;
  const entra = interpolate(ms, [pagina.desdeMs - 60, pagina.desdeMs + 90], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        top: 1440,
        display: 'flex',
        justifyContent: 'center',
        opacity: entra,
        translate: `0 ${(1 - entra) * 12}px`,
      }}
    >
      <div
        style={{
          textAlign: 'center',
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 64,
          lineHeight: 1.18,
          color: C.tinta,
          textShadow: '0 4px 18px rgba(0,0,0,0.85), 0 0 3px rgba(0,0,0,0.9)',
          WebkitTextStroke: '1.5px rgba(0,0,0,0.55)',
          padding: '12px 22px',
          borderRadius: 18,
          background: 'rgba(10,8,6,0.38)',
        }}
      >
        {pagina.palabras.map((p, i) => {
          const sonando = ms >= p.desdeMs && ms < p.hastaMs + 80;
          const dicha = ms >= p.desdeMs;
          return (
            <span key={i} style={{ color: sonando ? C.ambar : dicha ? C.tinta : 'rgba(246,239,224,0.78)' }}>
              {sinLatex(p.texto)}
              {i < pagina.palabras.length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
};
