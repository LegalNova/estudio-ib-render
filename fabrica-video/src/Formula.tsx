import katex from 'katex';
import 'katex/dist/katex.min.css';
import './formula.css';
import { Fragment } from 'react';
import { continueRender, delayRender } from 'remotion';

// Texto con fórmulas ($…$ en LaTeX), pintadas con KaTeX como en la app
// (src/estudio/ui/Rico.tsx). Aquí va aparte porque el render en la nube solo
// tiene fabrica-video/. Las fórmulas toman el color y el tamaño del texto que
// las rodea; formula.css las ajusta al vídeo (sin mayúsculas ni espaciado de
// las píldoras y con un trazo que las engorda junto al texto en negrita).

/** Misma regla que la app: sin espacio tras el $ de apertura ni antes del de cierre («15 $» no es fórmula). */
const FORMULA = /(\$(?! )[^$]*?[^ $]\$)/g;
/** «20 %», «15 €», «6230 $»: el símbolo nunca se queda solo en otra línea. */
const SIMBOLO = / (%|€|\$)/g;

export const esFormula = (s: string): boolean => s.length > 2 && s.startsWith('$') && s.endsWith('$');

/** Trozos de texto y fórmulas (las fórmulas, con sus $). */
export const trozos = (texto: string): string[] => texto.split(FORMULA).filter((t) => t !== '');

export const tieneFormula = (texto: string): boolean => trozos(texto).some(esFormula);

/** ¿Lleva alguna fracción grande (de primer nivel)? Ocupa casi dos líneas de alto. */
export const conFraccion = (texto: string): boolean =>
  trozos(texto).some((t) => esFormula(t) && fraccionesGrandes(t.slice(1, -1)).includes('\\dfrac'));

// Las fuentes de KaTeX vienen con su CSS (las empaqueta Remotion). Se espera a
// tenerlas antes de pintar, para que ningún fotograma salga con la de reserva.
if (typeof document !== 'undefined' && document.fonts) {
  const espera = delayRender('Fuentes de KaTeX');
  const fuentes = [
    '1em KaTeX_Main',
    'italic 1em KaTeX_Main',
    'bold 1em KaTeX_Main',
    'italic 1em KaTeX_Math',
    '1em KaTeX_AMS',
    '1em KaTeX_Size1',
    '1em KaTeX_Size2',
    '1em KaTeX_Size3',
    '1em KaTeX_Size4',
  ];
  Promise.all(fuentes.map((f) => document.fonts.load(f)))
    .catch(() => undefined)
    .then(() => continueRender(espera));
}

/**
 * Las fracciones de primer nivel, en grande (\dfrac): en línea, KaTeX las pone
 * en tamaño de índice y a 540×960 no se leen. Las de exponentes y raíces
 * (dentro de llaves) se quedan como están.
 */
export function fraccionesGrandes(tex: string): string {
  let nivel = 0;
  let salida = '';
  for (let i = 0; i < tex.length; i++) {
    const c = tex[i]!;
    if (c === '\\') {
      const m = /^\\([a-zA-Z]+|.)/.exec(tex.slice(i));
      if (!m) {
        salida += c;
        continue;
      }
      salida += nivel === 0 && m[1] === 'frac' ? '\\dfrac' : m[0];
      i += m[0].length - 1;
      continue;
    }
    if (c === '{') nivel++;
    else if (c === '}') nivel = Math.max(0, nivel - 1);
    salida += c;
  }
  return salida;
}

const cache = new Map<string, string>();
function html(tex: string): string {
  let h = cache.get(tex);
  if (h === undefined) {
    h = katex.renderToString(fraccionesGrandes(tex), { throwOnError: false, output: 'html', strict: 'ignore' });
    cache.set(tex, h);
  }
  return h;
}

const RELACION = /^(=|<|>|\\approx|\\le|\\leq|\\ge|\\geq|\\ne|\\neq|\\to|\\Rightarrow|\\iff)(?![a-zA-Z])/;

/**
 * Una fórmula partida por sus relaciones de primer nivel («a = b = c» → «a =»,
 * «b =», «c»). Cada trozo va entero en su línea: así una fórmula larga solo
 * se parte después de un «=», nunca a media expresión («log(x −» | «3)»).
 */
export function tramosFormula(tex: string): string[] {
  const salida: string[] = [];
  let nivel = 0;
  let desde = 0;
  for (let i = 0; i < tex.length; i++) {
    const c = tex[i]!;
    if (c === '\\' && /[{}()[\]]/.test(tex[i + 1] ?? '')) {
      i++;
      continue;
    }
    if (c === '{' || c === '(' || c === '[') nivel++;
    else if (c === '}' || c === ')' || c === ']') nivel = Math.max(0, nivel - 1);
    else if (nivel === 0 && (c === '\\' || c === '=' || c === '<' || c === '>')) {
      const m = RELACION.exec(tex.slice(i));
      if (m && tex.slice(desde, i).trim()) {
        // `{}` tras la relación: KaTeX mantiene su espacio aunque el trozo acabe ahí.
        salida.push(`${tex.slice(desde, i + m[0].length)}{}`);
        desde = i + m[0].length;
        i = desde - 1;
      }
    }
  }
  const resto = tex.slice(desde);
  if (resto.trim() || salida.length === 0) salida.push(resto);
  // Una fórmula corta no se parte («$x = 3$»), y un trozo corto va con el anterior («= 3»).
  const largo = (s: string): number => aproximar(s).replace(/\s/g, '').length;
  if (largo(tex) <= 16) return [tex];
  const juntos: string[] = [];
  for (const t of salida) {
    if (juntos.length > 0 && largo(t) <= 5) juntos[juntos.length - 1] += t;
    else juntos.push(t);
  }
  return juntos;
}

/**
 * Texto con sus fórmulas pintadas. `grueso` para el texto en negrita (700–800):
 * el trazo de KaTeX es fino y a 540×960 se perdería al lado.
 */
export const Rico: React.FC<{ texto: string; grueso?: boolean }> = ({ texto, grueso }) => {
  const piezas = trozos(texto);
  // La puntuación pegada a una fórmula («$x$.», «($x$») va con ella: nunca se queda sola en otra línea.
  const antes = new Map<number, string>();
  const despues = new Map<number, string>();
  const textos = piezas.map((t) => t);
  piezas.forEach((t, i) => {
    if (!esFormula(t)) return;
    const previo = textos[i - 1];
    const a = previo !== undefined && !esFormula(previo) ? /[(¿¡«“[]+$/.exec(previo)?.[0] : undefined;
    if (a) {
      antes.set(i, a);
      textos[i - 1] = previo!.slice(0, -a.length);
    }
    const siguiente = textos[i + 1];
    const d = siguiente !== undefined && !esFormula(siguiente) ? /^[.,;:!?)»”\]…]+/.exec(siguiente)?.[0] : undefined;
    if (d) {
      despues.set(i, d);
      textos[i + 1] = siguiente!.slice(d.length);
    }
  });
  return (
    <>
      {textos.map((t, i) => {
        if (!esFormula(t)) return <Fragment key={i}>{t.replace(SIMBOLO, ' $1')}</Fragment>;
        const tramos = tramosFormula(t.slice(1, -1));
        return (
          <span key={i} className={grueso ? 'rico-f rico-grueso' : 'rico-f'}>
            {tramos.map((tex, k) => (
              <span key={k} className="rico-tramo">
                {k === 0 ? antes.get(i) : null}
                <span dangerouslySetInnerHTML={{ __html: html(tex) }} />
                {k === tramos.length - 1 ? despues.get(i) : null}
              </span>
            ))}
          </span>
        );
      })}
    </>
  );
};

/**
 * Palabras de un texto sin partir las fórmulas («$x + 1 = 3x$,» es una sola),
 * para las animaciones que van palabra a palabra.
 */
export function palabrasRicas(texto: string): string[] {
  const salida: string[] = [];
  let actual = '';
  for (const t of trozos(texto)) {
    if (esFormula(t)) {
      actual += t;
      continue;
    }
    t.split(' ').forEach((p, i) => {
      if (i > 0) {
        if (actual) salida.push(actual);
        actual = '';
      }
      actual += p;
    });
  }
  if (actual) salida.push(actual);
  return salida;
}

const NOMBRES = /\\(log|ln|sin|cos|tan|exp|lim|max|min|mod)\b/g;

/** Lo que se ve de una fórmula, más o menos (para estimar anchos): «\frac{a}{b}» ocupa lo que el más largo. */
function aproximar(tex: string): string {
  let s = tex;
  for (let i = 0; i < 3; i++) s = s.replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, (_, a: string, b: string) => (a.length >= b.length ? a : b));
  return s
    .replace(/\\[dt]?frac\s*(\d)(\d)/g, '$1')
    .replace(/\{,\}/g, ',')
    .replace(/\\(left|right|big|Big|mathrm|text|displaystyle)\b/g, '')
    .replace(/\\[,;:! ]/g, ' ')
    .replace(NOMBRES, '$1')
    .replace(/\\[a-zA-Z]+/g, 'x')
    .replace(/[{}^_]/g, '');
}

/** El texto tal y como se ve (fórmulas aproximadas), para medir: tamaños de letra, líneas, anchos de columna. */
export function visible(texto: string): string {
  if (!texto.includes('$')) return texto;
  return trozos(texto)
    .map((t) => (esFormula(t) ? aproximar(t.slice(1, -1)) : t))
    .join('');
}

// ─── Subtítulos ─────────────────────────────────────────────────────────

const SUPER: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '+': '⁺', n: 'ⁿ', x: 'ˣ' };
const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', n: 'ₙ' };
const indice = (tabla: Record<string, string>, s: string): string => ([...s].every((c) => tabla[c]) ? [...s].map((c) => tabla[c]).join('') : s);

/**
 * Un trozo de subtítulo sin LaTeX: la narración ya va en palabras, pero si se
 * colara algo («$x^2$», «\cdot») se enseña legible, nunca en crudo.
 */
export function sinLatex(s: string): string {
  // Sin marcas de LaTeX, un $ junto a una cifra (o suelto) es dinero: «$50», «6230 $».
  if (!/[\\^_{}]/.test(s) && !/\$[^\d\s$.,;:!?)»”]|[^\d\s$(«“]\$/.test(s)) return s;
  let t = s;
  for (let i = 0; i < 3; i++) t = t.replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '$1/$2');
  return t
    .replace(/\{,\}/g, ',')
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\approx/g, '≈')
    .replace(/\\(le|leq)\b/g, '≤')
    .replace(/\\(ge|geq)\b/g, '≥')
    .replace(/\\(ne|neq)\b/g, '≠')
    .replace(/\\pm/g, '±')
    .replace(/\\infty/g, '∞')
    .replace(/\\pi/g, 'π')
    .replace(/\\sqrt/g, '√')
    .replace(/\\(to|rightarrow|Rightarrow|implies)\b/g, '→')
    .replace(/\\iff\b/g, '⇔')
    .replace(/\^\{([^{}]*)\}|\^(.)/g, (_, a: string | undefined, b: string | undefined) => indice(SUPER, a ?? b ?? ''))
    .replace(/_\{([^{}]*)\}|_(.)/g, (_, a: string | undefined, b: string | undefined) => indice(SUB, a ?? b ?? ''))
    .replace(/\\(left|right|mathrm|text|displaystyle)\b/g, '')
    .replace(/\\[,;:! ]/g, ' ')
    .replace(NOMBRES, '$1')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[${}\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
