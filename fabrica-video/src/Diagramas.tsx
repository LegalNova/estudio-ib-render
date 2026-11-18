import { createContext, useContext, useRef } from 'react';
import { pintado, useNiveles } from './Ajuste';
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, MONO, SANS, SERIF } from './estilo';
import { conFraccion, esFormula, Rico, tieneFormula, trozos, visible } from './Formula';
import type { Diagrama, Idioma } from './tipos';

// Diagramas de la app (diagramaSchema) dibujados y animados con código.
// Cada elemento (barra, paso, hito…) aparece en su momento: `aparece[i]` es
// el fotograma de la escena en que entra; -1 = ya visible al empezar.
//
// Zona útil: de debajo del título hasta SUELO. Por debajo van el rótulo de la
// escena (y≈1330) y los subtítulos (y≈1440): ningún diagrama baja de ahí.

/** Límite inferior de cualquier diagrama. */
const SUELO = 1300;

type Pt = readonly [number, number];

// ─── Idioma y números ───────────────────────────────────────────────────

const IdiomaCtx = createContext<Idioma>('es');
const LOCALE: Record<Idioma, string> = { es: 'es-ES', ca: 'ca-ES', en: 'en-GB' };

/** Decimales con los que viene un dato (1.73 → 2; 10 → 0). */
function decimalesDe(n: number): number {
  if (!Number.isFinite(n) || Number.isInteger(n)) return 0;
  const frac = String(Math.abs(n)).split('.')[1] ?? '';
  return Math.min(4, frac.replace(/e.*/, '').length);
}

function formato(n: number, idioma: Idioma, dec = decimalesDe(n)): string {
  const v = Number(n.toFixed(dec)) === 0 ? 0 : n;
  return v.toLocaleString(LOCALE[idioma], { minimumFractionDigits: dec, maximumFractionDigits: dec }).replace(/^-/, '−');
}

function useFmt(): (n: number, dec?: number) => string {
  const idioma = useContext(IdiomaCtx);
  return (n, dec) => formato(n, idioma, dec);
}

const TEXTOS_BUCLE: Record<Idioma, { R: string; B: string }> = {
  es: { R: 'Retroalimentación positiva (R)', B: 'Retroalimentación negativa (B)' },
  ca: { R: 'Retroalimentació positiva (R)', B: 'Retroalimentació negativa (B)' },
  en: { R: 'Positive feedback · reinforcing (R)', B: 'Negative feedback · balancing (B)' },
};

// ─── Utilidades de medida y animación ───────────────────────────────────

/** Líneas que ocupa un texto en `ancho` px si cada carácter mide `px` (estimación; las fórmulas, por lo que se ve). */
function lineasDe(texto: string, ancho: number, px: number): number {
  const palabras = visible(texto).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return 1;
  let lineas = 1;
  let actual = 0;
  for (const p of palabras) {
    const w = p.length * px;
    if (actual === 0) actual = w;
    else if (actual + px + w <= ancho) actual += px + w;
    else {
      lineas++;
      actual = w;
    }
    if (w > ancho) lineas += Math.floor(w / ancho);
  }
  return lineas;
}

/** Y donde acaba el bloque de título (título, subtítulo y raya ámbar). */
function finTitulo(texto: string, sub?: string): number {
  const lineas = lineasDe(texto, 920, 35);
  const lineasSub = sub ? lineasDe(sub.toUpperCase(), 920, 22) : 0;
  return 250 + lineas * 70.4 + (sub ? 14 + lineasSub * 38.4 : 0) + 26;
}

function useEntrada(desde: number, dur = 18): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (desde < 0) return 1;
  return spring({ frame: frame - desde, fps, config: { damping: 200 }, durationInFrames: dur });
}

/** Progreso 0→1 de un trazo que empieza en `desde` y dura `dur` fotogramas. */
function useTrazo(desde: number, dur = 22): number {
  const frame = useCurrentFrame();
  if (desde < 0) return 1;
  return interpolate(frame, [desde, desde + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
}

function longitudes(pts: Pt[]): number[] {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1]! + Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]));
  return L;
}

/** El trozo de la polilínea que va desde el principio hasta la longitud `hasta`. */
function corte(pts: Pt[], L: number[], hasta: number): Pt[] {
  const salida: Pt[] = [pts[0]!];
  for (let i = 1; i < pts.length; i++) {
    if (L[i]! <= hasta) salida.push(pts[i]!);
    else {
      const t = (hasta - L[i - 1]!) / Math.max(1e-6, L[i]! - L[i - 1]!);
      salida.push([pts[i - 1]![0] + (pts[i]![0] - pts[i - 1]![0]) * t, pts[i - 1]![1] + (pts[i]![1] - pts[i - 1]![1]) * t]);
      break;
    }
  }
  return salida;
}

/** Punto a la fracción `f` (0–1) de la longitud de la polilínea. */
function puntoEn(pts: Pt[], f: number): Pt {
  const L = longitudes(pts);
  const c = corte(pts, L, L[L.length - 1]! * f);
  return c[c.length - 1]!;
}

/** Esquinas redondeadas (para las flechas en ángulo recto). */
function redondear(pts: Pt[], r: number): Pt[] {
  const salida: Pt[] = [pts[0]!];
  for (let i = 1; i < pts.length - 1; i++) {
    const [p0, p1, p2] = [pts[i - 1]!, pts[i]!, pts[i + 1]!];
    const d1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const d2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const rr = Math.min(r, d1 / 2, d2 / 2);
    const a: Pt = [p1[0] - ((p1[0] - p0[0]) / d1) * rr, p1[1] - ((p1[1] - p0[1]) / d1) * rr];
    const b: Pt = [p1[0] + ((p2[0] - p1[0]) / d2) * rr, p1[1] + ((p2[1] - p1[1]) / d2) * rr];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      salida.push([(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * b[1]]);
    }
  }
  salida.push(pts[pts.length - 1]!);
  return salida;
}

/** Flecha que se dibuja: polilínea hasta `p` (0–1) con la punta en el extremo. */
const Trazo: React.FC<{ pts: Pt[]; p: number; color: string; grosor?: number; punta?: number }> = ({ pts, p, color, grosor = 7, punta = 30 }) => {
  if (p <= 0 || pts.length < 2) return null;
  const L = longitudes(pts);
  const largo = L[L.length - 1]! * p;
  const visible = corte(pts, L, largo);
  const tip = visible[visible.length - 1]!;
  const previo = corte(pts, L, Math.max(0, largo - 14));
  const atras = previo[previo.length - 1]!;
  let dx = tip[0] - atras[0];
  let dy = tip[1] - atras[1];
  const m = Math.hypot(dx, dy) || 1;
  dx /= m;
  dy /= m;
  const pu = punta * Math.min(1, largo / punta);
  const linea = corte(pts, L, Math.max(0, largo - pu * 0.7));
  const base: Pt = [tip[0] - dx * pu, tip[1] - dy * pu];
  const an = pu * 0.5;
  return (
    <g>
      <polyline points={linea.map((q) => `${q[0]},${q[1]}`).join(' ')} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={`${tip[0]},${tip[1]} ${base[0] - dy * an},${base[1] + dx * an} ${base[0] + dy * an},${base[1] - dx * an}`} fill={color} strokeLinejoin="round" stroke={color} strokeWidth={2} />
    </g>
  );
};

const Lienzo: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
    {children}
  </svg>
);

const Titulo: React.FC<{ texto: string; sub?: string }> = ({ texto, sub }) => {
  const e = useEntrada(0, 20);
  return (
    <div style={{ position: 'absolute', top: 250, left: 80, right: 80, opacity: e, translate: `0 ${(1 - e) * 24}px` }}>
      <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 64, color: C.tinta, lineHeight: 1.1 }}>
        <Rico texto={texto} grueso />
      </div>
      {sub ? (
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 32, color: C.tenue, marginTop: 14, letterSpacing: 2, textTransform: 'uppercase' }}>
          <Rico texto={sub} />
        </div>
      ) : null}
      <div style={{ height: 4, width: 140 * e, background: C.ambar, marginTop: 22, borderRadius: 2 }} />
    </div>
  );
};

/** Colores de las series (barras y líneas). */
const COLORES = [C.ambar, '#9fd3c7', C.rojo, C.tinta];

function altoLeyenda(nombres: string[]): number {
  const ancho = nombres.reduce((s, n) => s + visible(n).length * 17 + 40 + 36, 0);
  return Math.ceil(ancho / 920) * 46;
}

const Leyenda: React.FC<{ y: number; series: Array<{ nombre: string; color: string }>; aparece: number }> = ({ y, series, aparece }) => {
  const e = useEntrada(aparece, 20);
  return (
    <div style={{ position: 'absolute', left: 80, right: 80, top: y, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 40px', opacity: e }}>
      {series.map((s) => (
        <div key={s.nombre} style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: SANS, fontWeight: 600, fontSize: 30, lineHeight: '38px', color: C.tinta }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: s.color, flexShrink: 0 }} />
          <span>
            <Rico texto={s.nombre} />
          </span>
        </div>
      ))}
    </div>
  );
};

/** Texto suelto en el lienzo, centrado en (x, y) o colgado de y. */
const Etiqueta: React.FC<{
  x: number;
  y: number;
  w: number;
  texto: string;
  tam?: number;
  ancla?: 'centro' | 'arriba';
  color?: string;
  fondo?: boolean;
  opacidad: number;
}> = ({ x, y, w, texto, tam = 28, ancla = 'centro', color = C.ambar, fondo = true, opacidad }) => (
  <div
    style={{
      position: 'absolute',
      left: x - w / 2,
      top: y,
      width: w,
      display: 'flex',
      justifyContent: 'center',
      translate: ancla === 'centro' ? '0 -50%' : undefined,
      opacity: opacidad,
    }}
  >
    <div
      style={{
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: tam,
        lineHeight: 1.18,
        color,
        textAlign: 'center',
        padding: fondo ? '6px 14px' : 0,
        borderRadius: 14,
        background: fondo ? 'rgba(20,17,13,0.94)' : undefined,
        border: fondo ? '2px solid rgba(227,165,59,0.45)' : undefined,
      }}
    >
      <Rico texto={texto} />
    </div>
  </div>
);

// ─── Barras ─────────────────────────────────────────────────────────────

const Barra: React.FC<{
  x: number;
  w: number;
  y0: number;
  escala: number;
  valor: number;
  color: string;
  aparece: number;
  texto: string;
  tam: number;
  destacada: boolean;
}> = ({ x, w, y0, escala, valor, color, aparece, texto, tam, destacada }) => {
  const frame = useCurrentFrame();
  const fmt = useFmt();
  const e = useEntrada(aparece, 26);
  const h = Math.abs(valor) * escala * e;
  const positiva = valor >= 0;
  const brillo = destacada ? interpolate(frame - aparece, [0, 10, 30], [0, 1, 0.6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
  const mostrarTexto = texto && e > 0.98;
  const fs = mostrarTexto && visible(texto).length > 4 ? Math.round(tam * 0.8) : tam;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: positiva ? y0 - h : y0,
          width: w,
          height: h,
          background: color,
          borderRadius: positiva ? '8px 8px 0 0' : '0 0 8px 8px',
          boxShadow: brillo > 0 ? `0 0 ${40 * brillo}px rgba(227,165,59,${0.6 * brillo})` : undefined,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: x - 60,
          width: w + 120,
          top: positiva ? y0 - h - fs * 1.25 - 8 : y0 + h + 8,
          textAlign: 'center',
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: fs,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          color: destacada ? C.ambar : C.tinta,
          opacity: e > 0.02 ? 1 : 0,
        }}
      >
        {mostrarTexto ? <Rico texto={texto} grueso /> : fmt(valor * e, decimalesDe(valor))}
      </div>
    </>
  );
};

const EtiquetaCategoria: React.FC<{ x: number; w: number; y: number; texto: string; tam: number; aparece: number }> = ({ x, w, y, texto, tam, aparece }) => {
  const e = useEntrada(aparece, 26);
  return (
    <div style={{ position: 'absolute', left: x, width: w, top: y, textAlign: 'center', fontFamily: MONO, fontSize: tam, lineHeight: 1.15, color: C.tenue, opacity: Math.min(1, e * 3) }}>
      <Rico texto={texto} />
    </div>
  );
};

const FlechaBarras: React.FC<{ desde: Pt; hasta: Pt; aparece: number }> = ({ desde, hasta, aparece }) => {
  const p = useTrazo(aparece, 24);
  const ctrl: Pt = [(desde[0] + hasta[0]) / 2, Math.min(desde[1], hasta[1]) - 120];
  const pts: Pt[] = Array.from({ length: 41 }, (_, k) => {
    const t = k / 40;
    return [(1 - t) ** 2 * desde[0] + 2 * (1 - t) * t * ctrl[0] + t ** 2 * hasta[0], (1 - t) ** 2 * desde[1] + 2 * (1 - t) * t * ctrl[1] + t ** 2 * hasta[1]];
  });
  return (
    <Lienzo>
      <Trazo pts={pts} p={p} color={C.rojo} grosor={9} punta={34} />
    </Lienzo>
  );
};

const Barras: React.FC<{ d: Extract<Diagrama, { tipo: 'barras' }>; aparece: number[]; hasta?: number; textos?: string[]; flecha?: [number, number] }> = ({
  d,
  aparece,
  hasta,
  textos,
  flecha,
}) => {
  const frame = useCurrentFrame();
  const fmt = useFmt();
  const n = d.etiquetas.length;
  const S = d.series.length;
  const multi = S > 1;
  const valor = (s: number, i: number): number => d.series[s]?.valores[i] ?? 0;
  const todos = d.series.flatMap((s) => s.valores.slice(0, n));
  const vmax = Math.max(0, ...todos);
  const vmin = Math.min(0, ...todos);
  const hueco = 920 / n;

  // Barras: ancho del grupo y de cada serie.
  const separ = multi ? 8 : 0;
  const grupo = Math.min(hueco * (multi ? 0.8 : 0.62), multi ? 130 * S : 190);
  const bw = (grupo - separ * (S - 1)) / S;
  const maxCar = Math.max(...todos.map((v) => fmt(v).length), ...(textos ?? []).map((t) => visible(t).length * 0.8));
  const tamValor = multi
    ? Math.max(22, Math.min(44, Math.floor((bw + separ + 10) / (maxCar * 0.62))))
    : Math.max(30, Math.min(58, Math.floor((hueco - 10) / (maxCar * 0.62))));

  // Etiquetas de categoría (abajo del todo; se parten en líneas si no caben).
  const palabraLarga = Math.max(...d.etiquetas.map((e) => Math.max(...visible(e).split(/\s+/).map((w) => w.length))));
  const tamEt = Math.max(22, Math.min(34, Math.floor((hueco - 12) / (palabraLarga * 0.6))));
  const lineasEt = Math.max(...d.etiquetas.map((e) => lineasDe(e, hueco - 12, tamEt * 0.6)));
  const yEt = SUELO - lineasEt * tamEt * 1.15;

  // Zona vertical: arriba el título (y la leyenda), abajo las etiquetas.
  let y = finTitulo(d.titulo, d.unidad) + 36;
  const yLeyenda = y;
  if (multi) y += altoLeyenda(d.series.map((s) => s.nombre)) + 20;
  const yArriba = y + (vmax > 0 ? tamValor * 1.25 + 12 : 0);
  const yAbajo = yEt - 22 - (vmin < 0 ? tamValor * 1.25 + 12 : 0);
  const escala = (yAbajo - yArriba) / (vmax - vmin || 1);
  const y0 = yArriba + vmax * escala;

  const visibles = Math.min(n, hasta ?? n);
  // Con una serie, la barra destacada es la última que ha aparecido.
  let ultima = -1;
  for (let i = 0; i < visibles; i++) if ((aparece[i] ?? -1) <= frame) ultima = i;
  const xBarra = (i: number, s: number): number => 80 + hueco * i + (hueco - grupo) / 2 + s * (bw + separ);
  const color = (s: number, i: number): string => (multi ? COLORES[s % COLORES.length]! : i === ultima ? C.ambar : C.barra);
  const retraso = (i: number, s: number): number => {
    const a = aparece[i] ?? -1;
    return a < 0 ? -1 : a + s * 6;
  };

  return (
    <>
      <Titulo texto={d.titulo} sub={d.unidad} />
      {multi ? <Leyenda y={yLeyenda} series={d.series.map((s, k) => ({ nombre: s.nombre, color: COLORES[k % COLORES.length]! }))} aparece={aparece[0] ?? -1} /> : null}
      <div style={{ position: 'absolute', left: 70, right: 70, top: y0 - 1, height: 3, background: 'rgba(246,239,224,0.35)' }} />
      {d.etiquetas.slice(0, visibles).map((et, i) => (
        <EtiquetaCategoria key={`e${i}`} x={80 + hueco * i + 6} w={hueco - 12} y={yEt} texto={et} tam={tamEt} aparece={aparece[i] ?? -1} />
      ))}
      {d.etiquetas.slice(0, visibles).flatMap((_, i) =>
        d.series.map((__, s) => (
          <Barra
            key={`b${i}-${s}`}
            x={xBarra(i, s)}
            w={bw}
            y0={y0}
            escala={escala}
            valor={valor(s, i)}
            color={color(s, i)}
            aparece={retraso(i, s)}
            texto={multi ? '' : (textos?.[i] ?? '')}
            tam={tamValor}
            destacada={!multi && i === ultima}
          />
        )),
      )}
      {!multi && flecha && flecha[1] < visibles && flecha[0] < n ? (
        <FlechaBarras
          desde={[xBarra(flecha[0], 0) + bw / 2 + 30, y0 - Math.max(0, valor(0, flecha[0])) * escala - tamValor * 1.25 - 30]}
          hasta={[xBarra(flecha[1], 0) + bw / 2 - 10, y0 - Math.max(0, valor(0, flecha[1])) * escala - tamValor * 1.25 - 40]}
          aparece={(aparece[flecha[1]] ?? 0) + 20}
        />
      ) : null}
    </>
  );
};

// ─── Líneas ─────────────────────────────────────────────────────────────

/** Marcas «redondas» del eje Y (1, 2, 2,5, 5 × 10^k). */
function marcas(lo: number, hi: number, cuantas = 4): { valores: number[]; paso: number } {
  if (hi <= lo) hi = lo + 1;
  const bruto = (hi - lo) / cuantas;
  const mag = 10 ** Math.floor(Math.log10(bruto));
  const paso = ([1, 2, 2.5, 5, 10].find((m) => m * mag >= bruto) ?? 10) * mag;
  const desde = Math.floor(lo / paso + 1e-9) * paso;
  const hasta = Math.ceil(hi / paso - 1e-9) * paso;
  const valores: number[] = [];
  for (let v = desde; v <= hasta + paso / 2; v += paso) valores.push(Number(v.toFixed(10)));
  return { valores, paso };
}

const Lineas: React.FC<{ d: Extract<Diagrama, { tipo: 'lineas' }>; aparece: number[] }> = ({ d, aparece }) => {
  const frame = useCurrentFrame();
  const fmt = useFmt();
  const n = d.etiquetas.length;
  const S = d.series.length;
  const todos = d.series.flatMap((s) => s.valores.slice(0, n));

  let y = finTitulo(d.titulo, d.unidad) + 36;
  const yLeyenda = y;
  if (S > 1) y += altoLeyenda(d.series.map((s) => s.nombre)) + 24;
  const yT = y + 56;
  const yB = SUELO - 70;

  const { valores: ticks, paso } = marcas(Math.min(0, ...todos), Math.max(...todos));
  const lo = ticks[0]!;
  const hi = ticks[ticks.length - 1]!;
  const decTick = decimalesDe(paso);
  const textoTick = ticks.map((t) => fmt(t, decTick));
  const anchoTick = Math.max(...textoTick.map((t) => t.length)) * 26 * 0.6;
  const enCadaPunto = S === 1 && n <= 8;
  const xL = 80 + anchoTick + 26 + (enCadaPunto ? 44 : 0);
  const xR = enCadaPunto ? 960 : 990;
  const X = (i: number): number => xL + ((xR - xL) / Math.max(1, n - 1)) * i;
  const Y = (v: number): number => yB - ((v - lo) / (hi - lo)) * (yB - yT);

  const fin = aparece[n - 1] ?? 0;
  const inicio = aparece[0] ?? 0;
  const p =
    inicio < 0 && fin < 0
      ? 1
      : interpolate(frame, [Math.max(0, inicio), Math.max(Math.max(0, inicio) + 30, fin + 20)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const tramo = p * (n - 1);

  // Cifras: en cada punto si hay una sola serie corta; si no, al final de cada línea.
  const maxCar = Math.max(...todos.map((v) => fmt(v).length));
  const tamPunto = Math.max(24, Math.min(44, Math.floor((xR - xL) / Math.max(1, n - 1) / (maxCar * 0.62))));
  const finales = d.series.map((s, k) => ({ k, v: s.valores[n - 1] ?? 0, y: Y(s.valores[n - 1] ?? 0) - 26 })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < finales.length; i++) finales[i]!.y = Math.max(finales[i]!.y, finales[i - 1]!.y + 46);
  const salto = Math.ceil(n / 12);
  const opFinal = interpolate(p, [0.97, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <>
      <Titulo texto={d.titulo} sub={d.unidad} />
      {S > 1 ? <Leyenda y={yLeyenda} series={d.series.map((s, k) => ({ nombre: s.nombre, color: COLORES[k % COLORES.length]! }))} aparece={inicio} /> : null}
      <Lienzo>
        {ticks.map((t, i) => (
          <g key={`t${i}`}>
            <line x1={80 + anchoTick + 26} x2={xR} y1={Y(t)} y2={Y(t)} stroke={t === 0 ? 'rgba(246,239,224,0.45)' : 'rgba(246,239,224,0.12)'} strokeWidth={t === 0 ? 3 : 2} />
            <text x={80 + anchoTick + 10} y={Y(t) + 9} fill={C.tenue} fontFamily={MONO} fontSize={26} textAnchor="end">
              {textoTick[i]}
            </text>
          </g>
        ))}
        {d.series.map((s, k) => {
          const pts: Pt[] = s.valores.slice(0, n).map((v, i) => [X(i), Y(v)]);
          const ent = Math.floor(tramo);
          const vis: Pt[] = pts.slice(0, ent + 1);
          if (ent < n - 1 && tramo > ent) {
            const a = pts[ent]!;
            const b = pts[ent + 1]!;
            const f = tramo - ent;
            vis.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
          }
          const color = COLORES[k % COLORES.length]!;
          return (
            <g key={s.nombre}>
              <polyline points={vis.map((q) => `${q[0]},${q[1]}`).join(' ')} fill="none" stroke={color} strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" />
              {pts.slice(0, ent + 1).map((q, i) => (
                <circle key={i} cx={q[0]} cy={q[1]} r={n > 12 ? 6 : 9} fill={color} stroke={C.fondo} strokeWidth={3} />
              ))}
            </g>
          );
        })}
        {enCadaPunto
          ? d.series[0]!.valores.slice(0, n).map((v, i) =>
              tramo >= i - 0.001 ? (
                <text key={`v${i}`} x={X(i)} y={Y(v) - 26} fill={C.tinta} fontFamily={SANS} fontWeight={800} fontSize={tamPunto} textAnchor="middle">
                  {fmt(v)}
                </text>
              ) : null,
            )
          : finales.map((f) => (
              <text key={`f${f.k}`} x={xR} y={f.y} fill={COLORES[f.k % COLORES.length]} fontFamily={SANS} fontWeight={800} fontSize={40} textAnchor="end" opacity={opFinal}>
                {fmt(f.v)}
              </text>
            ))}
      </Lienzo>
      {/* Etiquetas del eje X en HTML (pueden llevar fórmulas), centradas en su punto. */}
      {d.etiquetas.map((et, i) =>
        i % salto === 0 || i === n - 1 ? (
          <div
            key={`x${i}`}
            style={{
              position: 'absolute',
              left: X(i) - 150,
              width: 300,
              top: yB + 17,
              display: 'flex',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
              fontFamily: MONO,
              fontSize: 30,
              lineHeight: '40px',
              color: C.tenue,
              opacity: tramo >= i - 0.001 ? 1 : 0.25,
            }}
          >
            <span>
              <Rico texto={et} />
            </span>
          </div>
        ) : null,
      )}
    </>
  );
};

// ─── Flujo y cronología (verticales) ────────────────────────────────────

const Paso: React.FC<{ texto: string; i: number; total: number; aparece: number; flechaAntes: boolean }> = ({ texto, i, total, aparece, flechaAntes }) => {
  const e = useEntrada(aparece, 20);
  const alto = Math.min(170, 820 / total - 50);
  const y = 500 + i * (alto + 50);
  return (
    <>
      {flechaAntes ? (
        <div style={{ position: 'absolute', left: 536, top: y - 46, width: 8, height: 40 * e, background: C.ambar, borderRadius: 4, opacity: e }} />
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: 120,
          right: 120,
          top: y,
          height: alto,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 40px',
          borderRadius: 22,
          background: 'rgba(20,17,13,0.82)',
          border: `3px solid ${C.ambar}`,
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: visible(texto).length > 22 || conFraccion(texto) ? 46 : 58,
          color: C.tinta,
          opacity: e,
          scale: String(0.9 + 0.1 * e),
        }}
      >
        <span>
          <Rico texto={texto} grueso />
        </span>
      </div>
    </>
  );
};

const Hito: React.FC<{ fecha: string; texto: string; i: number; total: number; aparece: number; activo: boolean }> = ({ fecha, texto, i, total, aparece, activo }) => {
  const e = useEntrada(aparece, 20);
  const paso = Math.min(240, 820 / total);
  const y = 480 + i * paso;
  return (
    <div style={{ position: 'absolute', left: 150, right: 80, top: y, opacity: e, translate: `${(1 - e) * 60}px 0` }}>
      <div style={{ position: 'absolute', left: -62, top: 18, width: 34, height: 34, borderRadius: 17, background: activo ? C.ambar : C.barra, boxShadow: activo ? '0 0 30px rgba(227,165,59,0.7)' : undefined }} />
      <div style={{ fontFamily: MONO, fontSize: 38, color: C.ambar }}>
        <Rico texto={fecha} />
      </div>
      <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 64, color: C.tinta, lineHeight: 1.1 }}>
        <Rico texto={texto} grueso />
      </div>
    </div>
  );
};

export const Cronologia: React.FC<{ hitos: Array<{ fecha: string; texto: string }>; aparece: number[]; titulo?: string }> = ({ hitos, aparece, titulo }) => {
  const frame = useCurrentFrame();
  const visibles = hitos.filter((_, i) => (aparece[i] ?? -1) <= frame).length;
  const paso = Math.min(240, 820 / hitos.length);
  const largo = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' }) * (paso * (hitos.length - 1) + 40);
  return (
    <>
      {titulo ? <Titulo texto={titulo} /> : null}
      <div style={{ position: 'absolute', left: 103, top: 500, width: 6, height: largo, background: 'rgba(246,239,224,0.3)', borderRadius: 3 }} />
      {hitos.map((h, i) => (
        <Hito key={i} {...h} i={i} total={hitos.length} aparece={aparece[i] ?? -1} activo={i === visibles - 1} />
      ))}
    </>
  );
};

// ─── Cajas ──────────────────────────────────────────────────────────────

const Caja: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  aparece: number;
  titulo: string;
  texto?: string;
  fuerte?: boolean;
  tam?: number;
  pad?: number;
}> = ({ x, y, w, h, aparece, titulo, texto, fuerte, tam = 40, pad = 24 }) => {
  const e = useEntrada(aparece, 18);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: 18,
        border: `3px solid ${fuerte ? C.ambar : 'rgba(246,239,224,0.35)'}`,
        background: 'rgba(20,17,13,0.86)',
        padding: pad,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: 'center',
        opacity: e,
        scale: String(0.92 + 0.08 * e),
        boxShadow: fuerte ? '0 0 34px rgba(227,165,59,0.18)' : undefined,
      }}
    >
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: tam, lineHeight: 1.15, color: fuerte ? C.ambar : C.tinta }}>
        <Rico texto={titulo} grueso />
      </div>
      {texto ? (
        <div style={{ fontFamily: SANS, fontSize: Math.round(tam * 0.75), lineHeight: 1.2, color: C.tenue, marginTop: 10 }}>
          <Rico texto={texto} />
        </div>
      ) : null}
    </div>
  );
};

/** Tamaño de letra para que `texto` quepa en una caja de w × h (estimación). */
function tamQueCabe(texto: string, w: number, h: number, max: number, min = 24): number {
  const largaPalabra = Math.max(...visible(texto).split(/\s+/).map((p) => p.length));
  for (let t = max; t > min; t--) {
    if (largaPalabra * t * 0.62 > w) continue;
    if (lineasDe(texto, w, t * 0.6) * t * 1.15 <= h) return t;
  }
  return min;
}

// ─── Tabla ──────────────────────────────────────────────────────────────

/** Cortes posibles dentro de palabras sin espacios (escansiones «to·pant·de·cap», «so·la‿És»), fuera de las fórmulas. */
function conCortes(texto: string): string {
  return trozos(texto)
    .map((t) => (esFormula(t) ? t : t.replace(/([·‿/–—-])/g, '$1\u200B')))
    .join('');
}

const FilaTabla: React.FC<{ celdas: string[]; h: number; tam: number; cabecera: boolean; aparece: number; oculta: boolean }> = ({ celdas, h, tam, cabecera, aparece, oculta }) => {
  const e = useEntrada(aparece, 18);
  return (
    <tr style={{ height: h, opacity: oculta ? 0 : e, translate: `${(1 - e) * 30}px 0` }}>
      {celdas.map((c, k) => (
        <td
          key={k}
          style={{
            verticalAlign: 'middle',
            fontFamily: SANS,
            fontWeight: cabecera ? 800 : 600,
            fontSize: tam,
            lineHeight: 1.18,
            color: cabecera ? C.ambar : k === 0 ? C.tinta : 'rgba(246,239,224,0.9)',
            borderBottom: `2px solid ${cabecera ? 'rgba(227,165,59,0.55)' : 'rgba(246,239,224,0.2)'}`,
            padding: `${Math.round(tam * 0.3)}px 8px`,
            overflowWrap: 'break-word',
          }}
        >
          <Rico texto={conCortes(c)} grueso={cabecera} />
        </td>
      ))}
    </tr>
  );
};

/** Letra de las tablas, de la más grande a la más pequeña: se usa la primera con la que la tabla cabe. */
const TAMS_TABLA = [44, 42, 40, 38, 36, 34, 32, 30, 28, 26, 24, 22];

const Tabla: React.FC<{ d: Extract<Diagrama, { tipo: 'tabla' }>; aparece: number[]; hasta?: number }> = ({ d, aparece, hasta }) => {
  const todas = [d.columnas, ...d.filas];
  const top0 = finTitulo(d.titulo) + 34;
  const disponible = SUELO - top0;
  // Una tabla de verdad: el navegador reparte el ancho de las columnas según
  // su contenido y el texto salta de línea (también por las «·» de una
  // escansión). Se mide el alto real y se baja la letra hasta que cabe.
  // Con fórmulas se empieza más grande: los exponentes y subíndices de KaTeX salen a ~70 % y a 540×960 no se leerían.
  const primero = todas.some((f) => f.some(tieneFormula)) ? 0 : TAMS_TABLA.indexOf(36);
  const ref = useRef<HTMLTableElement>(null);
  const [nivel] = useNiveles(
    [TAMS_TABLA.length - 1 - primero],
    () => (pintado(ref.current) ? ref.current.offsetHeight <= disponible && ref.current.offsetWidth <= 920 + 24 + 1 : undefined),
    `${d.titulo}|${todas.map((f) => f.join('¦')).join('¶')}`,
  );
  const tam = TAMS_TABLA[primero + nivel]!;
  // Filas de alto parejo, que llenan el sitio (nunca de más de 118 px).
  // (Un poco por debajo del reparto exacto: los bordes y el redondeo no deben hacer que «no quepa».)
  const minimo = Math.floor(Math.min(118, disponible / todas.length)) - 2;
  const visibles = Math.min(d.filas.length, hasta ?? d.filas.length);
  return (
    <>
      <Titulo texto={d.titulo} />
      <table
        ref={ref}
        style={{ position: 'absolute', left: 80 - 12, top: top0, width: 920 + 24, tableLayout: 'auto', borderCollapse: 'separate', borderSpacing: '12px 0' }}
      >
        <tbody>
          {todas.map((fila, r) => (
            <FilaTabla key={r} celdas={fila} h={minimo} tam={tam} cabecera={r === 0} aparece={r === 0 ? -1 : (aparece[r - 1] ?? -1)} oculta={r > visibles} />
          ))}
        </tbody>
      </table>
    </>
  );
};

// ─── Matriz 2×2 ─────────────────────────────────────────────────────────

const EjeTexto: React.FC<{ x: number; y: number; w: number; texto: string; girado?: boolean; aparece: number }> = ({ x, y, w, texto, girado, aparece }) => {
  const e = useEntrada(aparece, 18);
  return (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - 22,
        width: w,
        height: 44,
        lineHeight: '44px',
        textAlign: 'center',
        fontFamily: MONO,
        fontWeight: 500,
        fontSize: 30,
        letterSpacing: 1,
        color: C.ambar,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        rotate: girado ? '-90deg' : undefined,
        opacity: e,
      }}
    >
      <Rico texto={texto} />
    </div>
  );
};

const Matriz: React.FC<{ d: Extract<Diagrama, { tipo: 'matriz' }>; aparece: number[]; hasta?: number }> = ({ d, aparece, hasta }) => {
  const a = (i: number): number => aparece[i] ?? -1;
  const top0 = finTitulo(d.titulo) + 34;
  const izq = 80 + (d.ejeY ? 76 : 0);
  const arriba = top0 + (d.ejeX ? 70 : 0);
  const G = 20;
  const w = (1000 - izq - G) / 2;
  const h = Math.min(w, (SUELO - arriba - G) / 2);
  const visibles = Math.min(4, hasta ?? 4);
  const minA = (...xs: number[]): number => (xs.some((x) => x < 0) ? -1 : Math.min(...xs));
  const tam = Math.min(40, ...d.celdas.map((c) => tamQueCabe(c.titulo, w - 40, h * 0.4, 40, 26)));
  return (
    <>
      <Titulo texto={d.titulo} />
      {d.ejeX || d.ejeY ? (
        <Lienzo>
          {d.ejeX ? <line x1={izq} x2={1000} y1={arriba - 12} y2={arriba - 12} stroke="rgba(227,165,59,0.5)" strokeWidth={3} /> : null}
          {d.ejeY ? <line x1={izq - 12} x2={izq - 12} y1={arriba} y2={arriba + 2 * h + G} stroke="rgba(227,165,59,0.5)" strokeWidth={3} /> : null}
        </Lienzo>
      ) : null}
      {d.ejeX ? d.ejeX.map((t, c) => <EjeTexto key={`x${c}`} x={izq + c * (w + G) + w / 2} y={arriba - 44} w={w} texto={t} aparece={minA(a(c), a(c + 2))} />) : null}
      {d.ejeY
        ? d.ejeY.map((t, r) => <EjeTexto key={`y${r}`} x={izq - 46} y={arriba + r * (h + G) + h / 2} w={h} texto={t} girado aparece={minA(a(2 * r), a(2 * r + 1))} />)
        : null}
      {d.celdas.slice(0, visibles).map((c, i) => (
        <Caja key={i} x={izq + (i % 2) * (w + G)} y={arriba + Math.floor(i / 2) * (h + G)} w={w} h={h} aparece={a(i)} titulo={c.titulo} texto={c.texto} tam={tam} />
      ))}
    </>
  );
};

// ─── Bucle de retroalimentación ─────────────────────────────────────────

interface PlanoBucle {
  cx: number;
  cy: number;
  bw: number;
  bh: number;
  nodos: Pt[];
  enlaces: Array<{ k: number; pts: Pt[]; signo: '+' | '-'; desde: number; hasta: number }>;
}

function dentroDe(q: Pt, c: Pt, w: number, h: number, pad: number): boolean {
  return Math.abs(q[0] - c[0]) < w / 2 + pad && Math.abs(q[1] - c[1]) < h / 2 + pad;
}

/** Nodos en una elipse (en el sentido de las agujas del reloj, el primero arriba) y flechas por el arco. */
function planoBucle(d: Extract<Diagrama, { tipo: 'bucle' }>, top0: number): PlanoBucle {
  const n = d.nodos.length;
  const bw = n <= 2 ? 440 : n === 3 ? 330 : n === 4 ? 290 : n === 5 ? 250 : 220;
  const bh = n <= 3 ? 130 : 120;
  const cy = (top0 + SUELO) / 2;
  const ry = Math.min(340, (SUELO - top0) / 2 - bh / 2 - 6);
  const angulo = (i: number): number => -Math.PI / 2 + (2 * Math.PI * i) / n;
  const maxCos = n <= 2 ? 0 : Math.max(...d.nodos.map((_, i) => Math.abs(Math.cos(angulo(i)))));
  const rx = n <= 2 ? 300 : Math.min(n >= 5 ? 380 : 350, (1020 - bw / 2 - 540) / maxCos);
  const cx = 540;
  const nodos: Pt[] = d.nodos.map((_, i) => [cx + rx * Math.cos(angulo(i)), cy + ry * Math.sin(angulo(i))]);
  const vistos = new Set<string>();
  const enlaces: PlanoBucle['enlaces'] = [];
  d.enlaces.forEach(([de, a, signo], k) => {
    if (de === a || de >= n || a >= n || vistos.has(`${de}>${a}`)) return;
    vistos.add(`${de}>${a}`);
    const t0 = angulo(de);
    let delta = (((angulo(a) - t0) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    let muestras: Pt[];
    if (delta > Math.PI + 1e-6 && n > 2) {
      // Enlace «hacia atrás»: curva por dentro del círculo.
      const p0 = nodos[de]!;
      const p2 = nodos[a]!;
      const ctrl: Pt = [cx + ((p0[0] + p2[0]) / 2 - cx) * 0.2, cy + ((p0[1] + p2[1]) / 2 - cy) * 0.2];
      muestras = Array.from({ length: 161 }, (_, s) => {
        const t = s / 160;
        return [(1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * ctrl[0] + t ** 2 * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * ctrl[1] + t ** 2 * p2[1]];
      });
    } else {
      if (delta < 1e-6) delta = 2 * Math.PI;
      muestras = Array.from({ length: 241 }, (_, s) => {
        const t = t0 + (delta * s) / 240;
        return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)];
      });
    }
    const ini = muestras.findIndex((q) => !dentroDe(q, nodos[de]!, bw, bh, 12));
    let fin = muestras.length - 1;
    while (fin > 0 && dentroDe(muestras[fin]!, nodos[a]!, bw, bh, 16)) fin--;
    if (ini < 0 || fin <= ini) return;
    enlaces.push({ k, pts: muestras.slice(ini, fin + 1), signo, desde: de, hasta: a });
  });
  return { cx, cy, bw, bh, nodos, enlaces };
}

const EnlaceBucle: React.FC<{ pts: Pt[]; signo: '+' | '-'; aparece: number }> = ({ pts, signo, aparece }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = useTrazo(aparece, 22);
  if (p <= 0) return null;
  // En un arco corto el signo taparía la flecha: va al lado, hacia fuera del bucle.
  const L = longitudes(pts);
  const medio = puntoEn(pts, 0.5);
  let centro: Pt = medio;
  if (L[L.length - 1]! < 150) {
    const a = pts[0]!;
    const b = pts[pts.length - 1]!;
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const m = Math.hypot(tx, ty) || 1;
    let nx = -ty / m;
    let ny = tx / m;
    if (nx * (medio[0] - 540) + ny * (medio[1] - 960) < 0) {
      nx = -nx;
      ny = -ny;
    }
    centro = [medio[0] + nx * 46, medio[1] + ny * 46];
  }
  const pop = aparece < 0 ? 1 : spring({ frame: frame - aparece - 11, fps, config: { damping: 12, stiffness: 180 } });
  const color = signo === '+' ? C.ambar : C.rojo;
  const s = Math.max(0, pop);
  return (
    <Lienzo>
      <Trazo pts={pts} p={p} color={C.tinta} grosor={8} punta={34} />
      {s > 0 ? (
        <g transform={`translate(${centro[0]} ${centro[1]}) scale(${s})`}>
          <circle r={36} fill="#1b1611" stroke={color} strokeWidth={5} />
          <rect x={-17} y={-4} width={34} height={8} rx={3} fill={color} />
          {signo === '+' ? <rect x={-4} y={-17} width={8} height={34} rx={3} fill={color} /> : null}
        </g>
      ) : null}
    </Lienzo>
  );
};

const CentroBucle: React.FC<{ cx: number; cy: number; letra: 'R' | 'B'; aparece: number }> = ({ cx, cy, letra, aparece }) => {
  const p = useTrazo(aparece, 26);
  const e = useEntrada(aparece < 0 ? -1 : aparece + 8, 20);
  const r = 82;
  const t0 = -Math.PI / 2 + 0.55;
  const pts: Pt[] = Array.from({ length: 121 }, (_, s) => {
    const t = t0 + (5.1 * s) / 120;
    return [cx + r * Math.cos(t), cy + r * Math.sin(t)];
  });
  return (
    <>
      <Lienzo>
        <circle cx={cx} cy={cy} r={r + 26} fill="rgba(20,17,13,0.55)" opacity={e} />
        <Trazo pts={pts} p={p} color={C.ambar} grosor={7} punta={28} />
      </Lienzo>
      <div
        style={{
          position: 'absolute',
          left: cx - 80,
          top: cy - 80,
          width: 160,
          height: 160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: SERIF,
          fontWeight: 800,
          fontSize: 104,
          lineHeight: 1,
          color: C.ambar,
          opacity: e,
          scale: String(0.6 + 0.4 * e),
        }}
      >
        {letra}
      </div>
    </>
  );
};

const Bucle: React.FC<{ d: Extract<Diagrama, { tipo: 'bucle' }>; aparece: number[]; hasta?: number }> = ({ d, aparece, hasta }) => {
  const frame = useCurrentFrame();
  const idioma = useContext(IdiomaCtx);
  const sub = TEXTOS_BUCLE[idioma][d.bucle];
  const top0 = finTitulo(d.titulo, sub) + 30;
  const plano = planoBucle(d, top0);
  const n = d.nodos.length;
  const visibles = Math.min(n, hasta ?? n);
  const a = (i: number): number => aparece[i] ?? -1;

  // Cada flecha entra cuando ya están sus dos nodos, una detrás de otra.
  let anterior = -Infinity;
  const tiempos = plano.enlaces.map((en) => {
    const base = Math.max(a(en.desde), a(en.hasta));
    if (base < 0) return -1;
    const t = Math.max(base + 8, anterior + 16);
    anterior = t;
    return t;
  });
  const enlacesVisibles = plano.enlaces.map((en, k) => ({ ...en, t: tiempos[k]! })).filter((en) => en.desde < visibles && en.hasta < visibles);
  const ultimo = Math.max(-1, ...enlacesVisibles.map((en) => en.t));
  const tCentro = enlacesVisibles.every((en) => en.t < 0) ? -1 : ultimo + 22;

  // El nodo recién nombrado se resalta hasta que el bucle se cierra.
  let activo = -1;
  for (let i = 0; i < visibles; i++) if (a(i) <= frame) activo = i;

  const tam = Math.min(...d.nodos.map((t) => tamQueCabe(t, plano.bw - 32, plano.bh - 24, n >= 4 ? 36 : 40, 24)));
  return (
    <>
      <Titulo texto={d.titulo} sub={sub} />
      {visibles === n ? <CentroBucle cx={plano.cx} cy={plano.cy} letra={d.bucle} aparece={tCentro} /> : null}
      {enlacesVisibles.map((en) => (
        <EnlaceBucle key={en.k} pts={en.pts} signo={en.signo} aparece={en.t} />
      ))}
      {d.nodos.slice(0, visibles).map((nodo, i) => (
        <Caja
          key={i}
          x={plano.nodos[i]![0] - plano.bw / 2}
          y={plano.nodos[i]![1] - plano.bh / 2}
          w={plano.bw}
          h={plano.bh}
          aparece={a(i)}
          titulo={nodo}
          fuerte={i === activo && tCentro >= 0 && frame < tCentro}
          tam={tam}
          pad={12}
        />
      ))}
    </>
  );
};

// ─── Sistema (almacenes y flujos) ───────────────────────────────────────

const VACIAS = new Set(['the', 'and', 'of', 'in', 'to', 'an', 'de', 'la', 'el', 'los', 'las', 'del', 'en', 'els', 'les', 'per', 'con', 'amb']);
const normS = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
const palabrasS = (s: string): string[] =>
  normS(s)
    .split(/[^a-z0-9ñç]+/)
    .filter((w) => w.length >= 3 && !VACIAS.has(w));

/** Índice del almacén al que se refiere `nombre` («Bathtub» → «Water in the bathtub»), o -1 si es de fuera. */
function almacenDe(nombre: string, almacenes: string[]): number {
  if (!nombre.trim()) return -1;
  const exacto = almacenes.findIndex((a) => normS(a) === normS(nombre));
  if (exacto >= 0) return exacto;
  const pw = palabrasS(nombre);
  let mejor = -1;
  let puntos = 0;
  almacenes.forEach((a, i) => {
    const aw = palabrasS(a);
    const p = pw.filter((w) => aw.some((x) => x === w || (Math.min(x.length, w.length) >= 4 && (x.startsWith(w) || w.startsWith(x))))).length;
    if (p > puntos) {
      puntos = p;
      mejor = i;
    }
  });
  return mejor;
}

type Lado = 'izq' | 'der' | 'arriba' | 'abajo';

interface FlujoS {
  k: number;
  /** Flujo entre dos almacenes. */
  interno?: { de: number; a: number };
  /** Flujo con el exterior: almacén, sentido y nombre de lo de fuera. */
  externo?: { r: number; entra: boolean; fuera: string };
}

interface EtiquetaS {
  x: number;
  y: number;
  w: number;
  ancla: 'centro' | 'arriba';
  tam: number;
}

interface PlanoSistema {
  cajas: Array<{ x: number; y: number; w: number; h: number; tam: number }>;
  externos: Array<{ x: number; y: number; w: number; nombre: string; flujos: number[]; tam: number; ancho?: boolean }>;
  flechas: Array<{ k: number; pts: Pt[]; etiqueta: EtiquetaS }>;
}

function clasificar(d: Extract<Diagrama, { tipo: 'sistema' }>): FlujoS[] {
  return d.flujos.map((f, k) => {
    const de = almacenDe(f.de, d.almacenes);
    const a = almacenDe(f.a, d.almacenes);
    if (de >= 0 && a >= 0 && de !== a) return { k, interno: { de, a } };
    if (a >= 0) return { k, externo: { r: a, entra: true, fuera: f.de.trim() } };
    if (de >= 0) return { k, externo: { r: de, entra: false, fuera: f.a.trim() } };
    // No se reconoce ningún extremo: se supone el primer almacén.
    if (!f.a.trim()) return { k, externo: { r: 0, entra: false, fuera: '' } };
    return { k, externo: { r: 0, entra: true, fuera: f.de.trim() } };
  });
}

/** Reparte los flujos «laterales» (externos y saltos entre almacenes no vecinos) sin que se pisen. */
function repartir(items: Array<{ opciones: Lado[]; desde: number; hasta: number; pref: Partial<Record<Lado, number>> }>, n: number): Lado[] {
  const coste = (eleccion: Lado[]): number => {
    let c = 0;
    const bandas = { arriba: 0, abajo: 0 };
    eleccion.forEach((l, i) => {
      c += items[i]!.pref[l] ?? 0;
      if (l === 'arriba' || l === 'abajo') bandas[l]++;
      for (let j = 0; j < i; j++) {
        if (eleccion[j] !== l || l === 'arriba' || l === 'abajo') continue;
        if (items[i]!.desde <= items[j]!.hasta && items[j]!.desde <= items[i]!.hasta) c += 100;
      }
    });
    for (const b of Object.values(bandas)) if (b > 0) c += 5 + 2 * n + 3 * (b - 1);
    return c;
  };
  let mejor: Lado[] = items.map((it) => it.opciones[0]!);
  if (items.length <= 9) {
    let mejorCoste = Infinity;
    const actual: Lado[] = [];
    const probar = (i: number): void => {
      if (i === items.length) {
        const c = coste(actual);
        if (c < mejorCoste) {
          mejorCoste = c;
          mejor = [...actual];
        }
        return;
      }
      for (const o of items[i]!.opciones) {
        actual.push(o);
        probar(i + 1);
        actual.pop();
      }
    };
    probar(0);
  }
  return mejor;
}

/**
 * Un almacén: caja ancha en el centro, lo que entra de fuera arriba y lo que
 * sale abajo (lo de fuera que entra y sale, como «Space», abajo, una sola vez).
 * Varios almacenes: columna de cajas; flujos entre vecinos en los huecos; lo de
 * fuera y los saltos entre almacenes no vecinos a los lados (o arriba/abajo si
 * no caben), repartidos para que nada se pise.
 */
function planoSistema(d: Extract<Diagrama, { tipo: 'sistema' }>, top0: number): PlanoSistema {
  const n = d.almacenes.length;
  const flujos = clasificar(d);
  const disponible = SUELO - top0;
  const ALTO_BANDA = n === 1 ? 300 : 250;
  const TAM_FLUJO = n === 1 ? 34 : 28;
  const TAM_FUERA = n === 1 ? 38 : 30;
  /** Ancho de cada zona lateral (con varios almacenes la columna mide 400). */
  const W_ZONA = 270;

  // 1. Dónde va cada flujo con el exterior (y cada salto entre almacenes no vecinos).
  const lado = new Map<number, Lado>();
  if (n === 1) {
    const sale = new Set(flujos.filter((f) => f.externo && !f.externo.entra).map((f) => f.externo!.fuera));
    for (const f of flujos) if (f.externo) lado.set(f.k, f.externo.entra && !sale.has(f.externo.fuera) ? 'arriba' : 'abajo');
  } else {
    const laterales = flujos.filter((f) => f.externo || (f.interno && Math.abs(f.interno.de - f.interno.a) > 1));
    const items = laterales.map((f) => {
      if (f.interno) return { opciones: ['izq', 'der'] as Lado[], desde: Math.min(f.interno.de, f.interno.a), hasta: Math.max(f.interno.de, f.interno.a), pref: { der: 0.5 } };
      const { r, entra } = f.externo!;
      const opciones: Lado[] = ['izq', 'der'];
      if (r === 0) opciones.push('arriba');
      if (r === n - 1) opciones.push('abajo');
      return { opciones, desde: r, hasta: r, pref: entra ? { der: 1, abajo: 2 } : { izq: 1, arriba: 2 } };
    });
    repartir(items, n).forEach((l, i) => lado.set(laterales[i]!.k, l));
  }
  const usa = (l: Lado): boolean => [...lado.values()].includes(l);

  // 2. Medidas verticales.
  const hArriba = usa('arriba') ? ALTO_BANDA : 0;
  const hAbajo = usa('abajo') ? ALTO_BANDA : 0;
  // Lo que cuelga de los lados de la primera y la última caja: el nombre de lo
  // de fuera (encima de la flecha) y el del flujo (debajo) no pueden salirse.
  const lateralesEn = (r: number): FlujoS[] => flujos.filter((f) => f.externo?.r === r && (lado.get(f.k) === 'izq' || lado.get(f.k) === 'der'));
  const altoNombre = (f: FlujoS): number => lineasDe(d.flujos[f.k]!.nombre, W_ZONA - 36, TAM_FLUJO * 0.56) * TAM_FLUJO * 1.18 + 14;
  const altoFuera = (f: FlujoS): number => (f.externo!.fuera ? lineasDe(f.externo!.fuera, W_ZONA - 52, TAM_FUERA * 0.62) * TAM_FUERA * 1.15 + 22 : 0);
  const colgAbajo = Math.max(0, ...lateralesEn(n - 1).map((f) => 26 + altoNombre(f)));
  const colgArriba = Math.max(0, ...lateralesEn(0).map((f) => 10 + altoFuera(f)));
  let hueco = 110;
  let bh = n === 1 ? 200 : 170;
  for (let vuelta = 0; vuelta < 3 && n > 1; vuelta++) {
    const extra = Math.max(0, colgAbajo - bh / 2) + Math.max(0, colgArriba - bh / 2);
    const hCol = disponible - hArriba - hAbajo - extra;
    hueco = 110;
    bh = Math.min(170, (hCol - (n - 1) * hueco) / n);
    if (bh < 100) {
      hueco = 84;
      bh = Math.max(80, (hCol - (n - 1) * hueco) / n);
    }
  }
  const sobraArriba = n > 1 ? Math.max(0, colgArriba - bh / 2) : 0;
  const sobraAbajo = n > 1 ? Math.max(0, colgAbajo - bh / 2) : 0;
  const total = hArriba + sobraArriba + n * bh + (n - 1) * hueco + sobraAbajo + hAbajo;
  const y0 = top0 + Math.max(0, (disponible - total) / 2) + hArriba + sobraArriba;
  const ancho = n === 1 ? 800 : 400;
  const cajas = d.almacenes.map((t, i) => ({ x: 540 - ancho / 2, y: y0 + i * (bh + hueco), w: ancho, h: bh, tam: tamQueCabe(t, ancho - 40, bh - 24, n === 1 ? 46 : 38, 22) }));
  const cyDe = (r: number): number => cajas[r]!.y + cajas[r]!.h / 2;

  const externos: PlanoSistema['externos'] = [];
  const flechas: PlanoSistema['flechas'] = [];

  // 3. Bandas de arriba y de abajo: un carril por flujo; lo de fuera, centrado sobre sus carriles.
  for (const banda of ['arriba', 'abajo'] as const) {
    const enBanda = flujos.filter((f) => lado.get(f.k) === banda);
    if (enBanda.length === 0) continue;
    const grupos: Array<{ fuera: string; fs: FlujoS[] }> = [];
    for (const f of enBanda) {
      const g = grupos.find((x) => x.fuera === f.externo!.fuera && f.externo!.fuera !== '');
      if (g) g.fs.push(f);
      else grupos.push({ fuera: f.externo!.fuera, fs: [f] });
    }
    const m = enBanda.length;
    const carril = 920 / m;
    const caja = banda === 'arriba' ? cajas[0]! : cajas[n - 1]!;
    const yCaja = banda === 'arriba' ? caja.y - 8 : caja.y + caja.h + 8;
    const yEt = banda === 'arriba' ? caja.y - ALTO_BANDA + 30 : caja.y + caja.h + ALTO_BANDA - 30;
    const yBorde = banda === 'arriba' ? yEt + TAM_FUERA * 0.6 + 16 : yEt - TAM_FUERA * 0.6 - 16;
    let j = 0;
    for (const g of grupos) {
      // Las flechas de un mismo «de fuera» van juntas y rectas; su caja discontinua las abarca.
      const cnt = g.fs.length;
      const xEt = 80 + carril * (j + cnt / 2);
      const sep = Math.min(carril, 320);
      const centros = g.fs.map((_, q) => xEt + (q - (cnt - 1) / 2) * sep);
      const wEt = cnt > 1 ? Math.min(carril * cnt - 24, (cnt - 1) * sep + 220) : Math.min(440, carril - 24);
      if (g.fuera) externos.push({ x: xEt, y: yEt, w: wEt, nombre: g.fuera, flujos: g.fs.map((f) => f.k), tam: n === 1 ? TAM_FUERA : 32, ancho: cnt > 1 });
      g.fs.forEach((f, q) => {
        const xCaja = n === 1 ? Math.max(caja.x + 50, Math.min(caja.x + caja.w - 50, centros[q]!)) : caja.x + (caja.w * (j + q + 1)) / (m + 1);
        const lejos: Pt = [n === 1 ? xCaja : centros[q]!, yBorde];
        const cerca: Pt = [xCaja, yCaja];
        const pts: Pt[] = f.externo!.entra ? [lejos, cerca] : [cerca, lejos];
        const medio = puntoEn(pts, 0.5);
        flechas.push({ k: f.k, pts, etiqueta: { x: medio[0], y: medio[1], w: Math.min(440, (cnt > 1 ? sep : carril) - 24), ancla: 'centro', tam: TAM_FLUJO } });
      });
      j += cnt;
    }
  }

  // 4. Laterales (solo con varios almacenes).
  const XI = 540 - ancho / 2;
  const XD = 540 + ancho / 2;
  for (const f of flujos) {
    const l = lado.get(f.k);
    if (l !== 'izq' && l !== 'der') continue;
    const izq = l === 'izq';
    const borde = izq ? XI - 4 : XD + 4;
    const zona: [number, number] = izq ? [64, XI - 6] : [XD + 6, 1016];
    const cZona = (zona[0] + zona[1]) / 2;
    const wZona = zona[1] - zona[0];
    if (f.externo) {
      const cy = cyDe(f.externo.r);
      const fuera: Pt = [izq ? zona[0] + 4 : zona[1] - 4, cy + 6];
      const dentro: Pt = [borde, cy + 6];
      if (f.externo.fuera) externos.push({ x: cZona, y: cy - 10 - altoFuera(f) / 2, w: wZona - 12, nombre: f.externo.fuera, flujos: [f.k], tam: TAM_FUERA });
      flechas.push({ k: f.k, pts: f.externo.entra ? [fuera, dentro] : [dentro, fuera], etiqueta: { x: cZona, y: cy + 26, w: wZona - 8, ancla: 'arriba', tam: TAM_FLUJO } });
    } else if (f.interno) {
      const xb = izq ? XI - 58 : XD + 58;
      const y1 = cyDe(f.interno.de);
      const y2 = cyDe(f.interno.a);
      const pts = redondear(
        [
          [borde, y1],
          [xb, y1],
          [xb, y2],
          [borde, y2],
        ],
        28,
      );
      const wEt = izq ? xb - 14 - 64 : 1016 - xb - 14;
      flechas.push({ k: f.k, pts, etiqueta: { x: izq ? 64 + wEt / 2 : xb + 14 + wEt / 2, y: (y1 + y2) / 2, w: wEt, ancla: 'centro', tam: TAM_FLUJO } });
    }
  }

  // 5. Flujos entre almacenes vecinos: flecha vertical en el hueco, nombre al lado.
  const vecinos = flujos.filter((f) => f.interno && Math.abs(f.interno.de - f.interno.a) === 1);
  for (const f of vecinos) {
    const { de, a } = f.interno!;
    const arribaR = Math.min(de, a);
    const pareja = vecinos.filter((g) => Math.min(g.interno!.de, g.interno!.a) === arribaR);
    const idx = pareja.indexOf(f);
    const yA = cajas[arribaR]!.y + cajas[arribaR]!.h + 6;
    const yB = cajas[arribaR + 1]!.y - 6;
    const baja = de < a;
    if (pareja.length === 1) {
      const x = XI + 90;
      const pts: Pt[] = baja ? [[x, yA], [x, yB]] : [[x, yB], [x, yA]];
      flechas.push({ k: f.k, pts, etiqueta: { x: x + 24 + (ancho - 130) / 2, y: (yA + yB) / 2, w: ancho - 130, ancla: 'centro', tam: 28 } });
    } else {
      const x = idx === 0 ? XI + 50 : XD - 50;
      const pts: Pt[] = baja ? [[x, yA], [x, yB]] : [[x, yB], [x, yA]];
      flechas.push({ k: f.k, pts, etiqueta: { x: 540, y: (yA + yB) / 2 + (idx === 0 ? -22 : 22), w: ancho - 160, ancla: 'centro', tam: 22 } });
    }
  }
  return { cajas, externos, flechas };
}

const FlechaSistema: React.FC<{ pts: Pt[]; texto: string; et: EtiquetaS; aparece: number }> = ({ pts, texto, et, aparece }) => {
  const p = useTrazo(aparece, 20);
  const e = useEntrada(aparece < 0 ? -1 : aparece + 10, 16);
  return (
    <>
      <Lienzo>
        <Trazo pts={pts} p={p} color={C.tinta} grosor={7} punta={30} />
      </Lienzo>
      <Etiqueta x={et.x} y={et.y} w={et.w} texto={texto} tam={et.tam} ancla={et.ancla} opacidad={e} />
    </>
  );
};

const Externo: React.FC<{ x: number; y: number; w: number; nombre: string; tam: number; ancho?: boolean; aparece: number }> = ({ x, y, w, nombre, tam, ancho, aparece }) => {
  const e = useEntrada(aparece, 16);
  return (
    <div style={{ position: 'absolute', left: x - w / 2, top: y, width: w, display: 'flex', justifyContent: 'center', translate: '0 -50%', opacity: e }}>
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: tam,
          lineHeight: 1.15,
          color: C.tinta,
          textAlign: 'center',
          width: ancho ? '100%' : undefined,
          padding: '8px 20px',
          borderRadius: 14,
          border: '3px dashed rgba(246,239,224,0.45)',
          background: 'rgba(20,17,13,0.6)',
        }}
      >
        <Rico texto={nombre} grueso />
      </div>
    </div>
  );
};

const Sistema: React.FC<{ d: Extract<Diagrama, { tipo: 'sistema' }>; aparece: number[]; hasta?: number }> = ({ d, aparece, hasta }) => {
  const a = (i: number): number => aparece[i] ?? -1;
  const nA = d.almacenes.length;
  const plano = planoSistema(d, finTitulo(d.titulo) + 40);
  const visibles = Math.min(nA + d.flujos.length, hasta ?? Infinity);
  const tFlujo = (k: number): number => a(nA + k);
  const minA = (xs: number[]): number => (xs.some((x) => x < 0) ? -1 : Math.min(...xs));
  return (
    <>
      <Titulo texto={d.titulo} />
      {plano.flechas
        .filter((f) => nA + f.k < visibles)
        .map((f) => (
          <FlechaSistema key={`f${f.k}`} pts={f.pts} texto={d.flujos[f.k]!.nombre} et={f.etiqueta} aparece={tFlujo(f.k)} />
        ))}
      {plano.cajas.slice(0, Math.min(nA, visibles)).map((c, i) => (
        <Caja key={`c${i}`} x={c.x} y={c.y} w={c.w} h={c.h} aparece={a(i)} titulo={d.almacenes[i]!} fuerte tam={c.tam} pad={14} />
      ))}
      {plano.externos.map((x, i) => {
        const fs = x.flujos.filter((k) => nA + k < visibles);
        return fs.length ? <Externo key={`x${i}`} x={x.x} y={x.y} w={x.w} nombre={x.nombre} tam={x.tam} ancho={x.ancho} aparece={minA(fs.map(tFlujo))} /> : null;
      })}
    </>
  );
};

// ─── Pirámide ───────────────────────────────────────────────────────────

const Piramide: React.FC<{ d: Extract<Diagrama, { tipo: 'piramide' }>; aparece: number[] }> = ({ d, aparece }) => {
  const n = d.niveles.length;
  const top0 = Math.max(520, finTitulo(d.titulo) + 40);
  const paso = Math.min(170, (SUELO - top0) / n);
  return (
    <>
      <Titulo texto={d.titulo} />
      {d.niveles.map((nv, i) => {
        const w = 380 + (560 / Math.max(1, n - 1)) * i;
        return (
          <Caja
            key={i}
            x={(1080 - w) / 2}
            y={top0 + i * paso}
            w={w}
            h={paso - 20}
            aparece={aparece[i] ?? -1}
            titulo={nv.nombre}
            texto={nv.valor}
            fuerte={i === 0}
            tam={paso < 130 ? 34 : 40}
            pad={paso < 130 ? 12 : 24}
          />
        );
      })}
    </>
  );
};

// ─── Entrada ────────────────────────────────────────────────────────────

export const VistaDiagrama: React.FC<{ d: Diagrama; aparece: number[]; hasta?: number; textos?: string[]; flecha?: [number, number]; idioma?: Idioma }> = ({
  d,
  aparece,
  hasta,
  textos,
  flecha,
  idioma = 'es',
}) => {
  const a = (i: number): number => aparece[i] ?? -1;
  let vista: React.ReactNode;
  switch (d.tipo) {
    case 'barras':
      vista = <Barras d={d} aparece={aparece} hasta={hasta} textos={textos} flecha={flecha} />;
      break;
    case 'lineas':
      vista = <Lineas d={d} aparece={aparece} />;
      break;
    case 'flujo':
      vista = (
        <>
          <Titulo texto={d.titulo} />
          {d.pasos.slice(0, hasta ?? d.pasos.length).map((p, i) => (
            <Paso key={i} texto={p} i={i} total={d.pasos.length} aparece={a(i)} flechaAntes={i > 0} />
          ))}
        </>
      );
      break;
    case 'cronologia':
      vista = <Cronologia hitos={d.hitos} aparece={aparece} titulo={d.titulo} />;
      break;
    case 'tabla':
      vista = <Tabla d={d} aparece={aparece} hasta={hasta} />;
      break;
    case 'piramide':
      vista = <Piramide d={d} aparece={aparece} />;
      break;
    case 'matriz':
      vista = <Matriz d={d} aparece={aparece} hasta={hasta} />;
      break;
    case 'bucle':
      vista = <Bucle d={d} aparece={aparece} hasta={hasta} />;
      break;
    case 'sistema':
      vista = <Sistema d={d} aparece={aparece} hasta={hasta} />;
      break;
  }
  return <IdiomaCtx.Provider value={idioma}>{vista}</IdiomaCtx.Provider>;
};
