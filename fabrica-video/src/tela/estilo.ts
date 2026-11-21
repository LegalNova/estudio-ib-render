import { createContext, useContext } from 'react';
import { Easing, interpolate, spring } from 'remotion';
import { SANS } from '../estilo';
import type { Hilo } from './tipos';

// Estilo de «La tela»: noche azul, un brillo del color del hilo y tarjetas
// oscuras con borde de color (como el vídeo de referencia).

export { SANS };

export const ANCHO = 1920;
export const ALTO = 1080;
export const FPS = 30;

export const T = {
  fondo: '#090e1c',
  texto: '#f3f5fa',
  tenue: 'rgba(226,232,245,0.66)',
  muyTenue: 'rgba(226,232,245,0.38)',
  tarjeta: 'rgba(255,255,255,0.05)',
  borde: 'rgba(255,255,255,0.09)',
  rojo: '#e5484d',
  verde: '#3fb950',
};

export const HILO_COLOR: Record<Hilo, string> = {
  inicio: '#f3f5fa',
  leyes: '#f5c542',
  terror: '#e5484d',
  elites: '#4c8dff',
  adoctrinamiento: '#3fb950',
  sociedad: '#a371f7',
  resumen: '#f3f5fa',
  sistemas: '#2dd4bf',
  sostenibilidad: '#3fb950',
  ecologia: '#a3e635',
  energia: '#f5c542',
  carbono: '#38bdf8',
  perspectivas: '#a371f7',
};

export const HILO_ROTULO: Record<Hilo, string> = {
  inicio: 'PUNTO DE PARTIDA',
  leyes: 'HILO DE LAS LEYES',
  terror: 'HILO DEL TERROR',
  elites: 'HILO DE LAS ÉLITES',
  adoctrinamiento: 'HILO DEL ADOCTRINAMIENTO',
  sociedad: 'HILO DE LA SOCIEDAD',
  resumen: 'RESUMEN',
  sistemas: 'SISTEMAS',
  sostenibilidad: 'SOSTENIBILIDAD',
  ecologia: 'ECOLOGÍA',
  energia: 'ENERGÍA',
  carbono: 'CICLO DEL CARBONO',
  perspectivas: 'PERSPECTIVAS',
};

/** Rótulos del estilo «dinamico» (vídeo en inglés). */
export const HILO_ROTULO_EN: Record<Hilo, string> = {
  inicio: 'START',
  leyes: 'LAWS',
  terror: 'TERROR',
  elites: 'ELITES',
  adoctrinamiento: 'INDOCTRINATION',
  sociedad: 'SOCIETY',
  resumen: 'EXAM TIPS',
  sistemas: 'SYSTEMS',
  sostenibilidad: 'SUSTAINABILITY',
  ecologia: 'ECOLOGY',
  energia: 'ENERGY',
  carbono: 'CARBON CYCLE',
  perspectivas: 'PERSPECTIVES',
};

/** Colores de los narradores. */
export const COLOR_VOZ = { H: '#ff8f7e', E: '#5fd0c8' } as const;
export const NOMBRE_VOZ = { H: 'Lucía', E: 'Álvaro' } as const;

/** Zona del escenario (visual de cada escena), en px de 1920×1080. */
export const ESCENARIO = { x: 70, y: 228, w: 1240, h: 580 };
/** Escenario del estilo «dinamico»: sin narradores, a todo lo ancho. */
export const ESCENARIO_DINAMICO = { x: 80, y: 238, w: 1760, h: 592 };

export type Escenario = typeof ESCENARIO;
export const EscenarioCtx = createContext<Escenario>(ESCENARIO);
/** Escenario de la escena actual (cambia con el estilo). */
export const useEscenario = (): Escenario => useContext(EscenarioCtx);

/** Muelle para entradas (estilo «dinamico»): 0→1 desde el fotograma `desde`. */
export const muelle = (t: number, desde: number, fps = FPS, amortigua = 13): number =>
  t < desde ? 0 : spring({ frame: t - desde, fps, config: { damping: amortigua, mass: 0.7, stiffness: 140 } });

/** Primer número de un texto («120 GtC» → 120), con sus decimales; null si no hay. */
export function numeroDe(texto: string): { antes: string; valor: number; decimales: number; despues: string; sep: string } | null {
  const m = /^(.*?)(\d{1,3}(?:[.,\s]\d{3})+|\d+(?:[.,]\d+)?)(.*)$/s.exec(texto);
  if (!m) return null;
  const crudo = m[2];
  let valor: number;
  let decimales = 0;
  let sep = '';
  if (/^\d{1,3}([.,\s])\d{3}(\1\d{3})*$/.test(crudo)) {
    sep = crudo.replace(/\d/g, '')[0] ?? '';
    valor = Number(crudo.replace(/[.,\s]/g, ''));
  } else {
    const d = crudo.match(/[.,](\d+)$/);
    decimales = d ? d[1].length : 0;
    valor = Number(crudo.replace(',', '.'));
  }
  return { antes: m[1], valor, decimales, despues: m[3], sep: crudo.includes(',') && decimales ? ',' : sep };
}

/** El texto con su primer número contado hasta `k` (0–1). */
export function contar(texto: string, k: number): string {
  const n = numeroDe(texto);
  if (!n || k >= 1) return texto;
  const v = n.valor * Math.max(0, k);
  let s = v.toFixed(n.decimales);
  if (n.decimales && n.sep === ',') s = s.replace('.', ',');
  else if (!n.decimales && n.sep) s = Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, n.sep);
  return `${n.antes}${s}${n.despues}`;
}

/** 0→1 entre `desde` y `desde + dur` fotogramas, con salida suave. */
export const entra = (t: number, desde: number, dur = 14): number =>
  interpolate(t, [desde, desde + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });

/** Momento de aparición del elemento i de n dentro de una escena de `dur` fotogramas. */
export const escalon = (i: number, n: number, dur: number, desde = 10, hasta = 0.6): number =>
  desde + i * Math.min(28, Math.max(6, (dur * hasta - desde) / Math.max(1, n)));

export const formatoNum = (v: number): string => v.toLocaleString('es-ES', { maximumFractionDigits: 1 });

/** Rgba de un color #rrggbb. */
export function alfa(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Idioma de los rótulos fijos: «en» en el estilo «dinamico». */
export const IdiomaCtx = createContext<'es' | 'en'>('es');
export const useIdioma = (): 'es' | 'en' => useContext(IdiomaCtx);

// ─── Subtítulos: trozos de un turno ───

function partirPalabras(t: string, max: number): string[] {
  const out: string[] = [];
  let cur = '';
  for (const w of t.split(/\s+/)) {
    if (cur && (cur + ' ' + w).length > max) {
      out.push(cur);
      cur = w;
    } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) out.push(cur);
  return out;
}

export function trocear(t: string, max = 125): string[] {
  const frases = t.match(/[^.!?…;:]+[.!?…;:»"]*\s*/g) ?? [t];
  const out: string[] = [];
  let cur = '';
  for (const f of frases) {
    if (cur && (cur + f).length > max) {
      out.push(cur.trim());
      cur = f;
    } else cur += f;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.flatMap((c) => (c.length <= max * 1.25 ? [c] : partirPalabras(c, max)));
}

