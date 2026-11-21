import React, { useState } from 'react';
import { AbsoluteFill, Easing, Img, interpolate, random } from 'remotion';
import { tono } from './Persona';
import { alfa, contar, muelle, T, useEscenario, useIdioma } from './estilo';
import type { Curva, Visual } from './tipos';
import { Caja } from './Caja';

// Visuales pensados para ESS (sistemas, bucles, curvas, pirámides, ciclos,
// tablas y fotos). Entradas con muelle, flujos con partículas y números que
// se cuentan. Sirven en los dos estilos: el tamaño sale de useEscenario().

interface P<V> {
  v: V;
  t: number;
  dur: number;
  color: string;
}
type De<K extends Visual['tipo']> = Extract<Visual, { tipo: K }>;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const SALIDA = '#ff9f7a';

const TX = {
  es: { limite: 'LÍMITE DEL SISTEMA', entradas: 'ENTRADAS', salidas: 'SALIDAS', pos: 'Retroalimentación positiva', neg: 'Retroalimentación negativa', amp: 'amplifica el cambio', est: 'estabiliza el sistema', sinFoto: 'Imagen no disponible' },
  en: { limite: 'SYSTEM BOUNDARY', entradas: 'INPUTS', salidas: 'OUTPUTS', pos: 'Positive feedback', neg: 'Negative feedback', amp: 'amplifies change', est: 'stabilises the system', sinFoto: 'Image unavailable' },
};

const Titulo: React.FC<{ texto: string; color: string; t: number }> = ({ texto, color, t }) => {
  const k = muelle(t, 2);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, fontSize: 34, fontWeight: 800, color, opacity: Math.min(1, k), transform: `translateX(${(1 - k) * -40}px)` }}>
      {texto}
    </div>
  );
};

const Nota: React.FC<{ texto?: string; t: number; desde: number }> = ({ texto, t, desde }) =>
  texto ? (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, textAlign: 'center', fontSize: 27, color: T.texto, opacity: Math.min(1, muelle(t, desde)) }}>
      {texto}
    </div>
  ) : null;

/** Punto de una curva de Bézier cuadrática. */
const bez = (a: number, c: number, b: number, u: number) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * c + u * u * b;

/** Partículas que corren por un segmento o curva: `pos(u)` da el punto en u ∈ [0, 1]. */
const Particulas: React.FC<{ pos: (u: number) => [number, number]; t: number; color: string; n?: number; velocidad?: number; r?: number; visible: number }> = ({
  pos, t, color, n = 3, velocidad = 0.012, r = 6, visible,
}) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const u = (t * velocidad + i / n) % 1;
      const [x, y] = pos(u);
      const o = Math.sin(u * Math.PI) * visible;
      return <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={o} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />;
    })}
  </>
);

// ─── Foto a sangre ───────────────────────────────────────────────────────

export const FotoSangre: React.FC<{ v: De<'foto'>; t: number; dur: number; color: string; semilla: number }> = ({ v, t, dur, color, semilla }) => {
  const [fallo, setFallo] = useState(false);
  const idioma = useIdioma();
  const p = interpolate(t, [0, dur], [0, 1], clamp);
  const dir = random(`foto${semilla}`) > 0.5 ? 1 : -1;
  const escala = 1.05 + 0.12 * p;
  const pie = muelle(t, 14);
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {fallo ? (
        <AbsoluteFill style={{ background: `radial-gradient(ellipse at 40% 40%, ${alfa(color, 0.35)}, #0a0f1d 70%)`, alignItems: 'center', justifyContent: 'center', color: T.tenue, fontSize: 30 }}>
          {TX[idioma].sinFoto}
        </AbsoluteFill>
      ) : (
        <Img
          src={v.url}
          maxRetries={3}
          delayRenderTimeoutInMilliseconds={60000}
          onError={() => setFallo(true)}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            transform: `scale(${escala}) translate(${dir * (p - 0.5) * 40}px, ${(0.5 - p) * 18}px)`,
          }}
        />
      )}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(5,8,16,0.82) 0%, rgba(5,8,16,0.35) 22%, rgba(5,8,16,0.05) 45%, rgba(5,8,16,0.35) 68%, rgba(5,8,16,0.9) 100%)',
        }}
      />
      {v.pie || v.credito ? (
        <div style={{ position: 'absolute', left: 80, bottom: 245, maxWidth: 1100, opacity: Math.min(1, pie), transform: `translateY(${(1 - pie) * 24}px)` }}>
          {v.pie ? (
            <div style={{ display: 'inline-block', fontSize: 34, fontWeight: 800, color: T.texto, background: 'rgba(6,9,18,0.62)', borderLeft: `6px solid ${color}`, padding: '10px 18px', borderRadius: 8, lineHeight: 1.2 }}>
              {v.pie}
            </div>
          ) : null}
          {v.credito ? <div style={{ fontSize: 17, color: T.tenue, marginTop: 8, textShadow: '0 1px 3px #000' }}>{v.credito}</div> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ─── Sistema ─────────────────────────────────────────────────────────────

const Sistema: React.FC<P<De<'sistema'>>> = ({ v, t, dur, color }) => {
  const { w, h } = useEscenario();
  const tx = TX[useIdioma()];
  const x0 = w * 0.3;
  const x1 = w * 0.7;
  const y0 = 78;
  const y1 = h - (v.nota ? 62 : 8);
  const marco = interpolate(t, [6, 34], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const n = Math.max(1, v.almacenes.length);
  const cols = n <= 2 ? n : 2;
  const filas = Math.ceil(n / cols);
  const bw = (x1 - x0 - 70 - (cols - 1) * 28) / cols;
  const bh = Math.min(118, (y1 - y0 - 70 - (filas - 1) * 24) / filas);
  const altoAlm = filas * bh + (filas - 1) * 24;
  const lado = (lista: string[], izq: boolean, desde: number) =>
    lista.map((txt, i) => {
      const y = y0 + ((i + 1) * (y1 - y0)) / (lista.length + 1);
      const k = muelle(t, desde + i * 7);
      const xa = izq ? w * 0.235 : x1 + 8;
      const xb = izq ? x0 - 8 : w * 0.765;
      return { txt, y, k, xa, xb, i };
    });
  const ins = lado(v.entradas, true, 36);
  const outs = lado(v.salidas, false, 36 + v.entradas.length * 7 + 10);
  const flujo = interpolate(t, [50, 80], [0, 1], clamp);
  const etiqueta = (izq: boolean, r: { txt: string; y: number; k: number }, c: string) => (
    <div
      key={`${izq}${r.txt}`}
      style={{
        position: 'absolute', top: r.y - 32, height: 64, width: w * 0.22, boxSizing: 'border-box',
        ...(izq ? { left: 0 } : { right: 0 }),
        display: 'flex', alignItems: 'center', justifyContent: izq ? 'flex-end' : 'flex-start', textAlign: izq ? 'right' : 'left',
        fontSize: 25, fontWeight: 700, color: T.texto, lineHeight: 1.15, padding: '0 14px',
        background: T.tarjeta, borderRadius: 12, [izq ? 'borderRight' : 'borderLeft']: `5px solid ${c}`,
        opacity: Math.min(1, r.k), transform: `translateX(${(1 - r.k) * (izq ? -40 : 40)}px)`,
      }}
    >
      {r.txt}
    </div>
  );
  return (
    <Caja>
      <Titulo texto={v.titulo} color={color} t={t} />
      <svg width={w} height={h} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <marker id={`fsi${color.slice(1)}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
          </marker>
          <marker id={`fso${color.slice(1)}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={SALIDA} />
          </marker>
        </defs>
        <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={26} fill={alfa(color, 0.05)} stroke={color} strokeWidth={3} strokeDasharray="14 10" pathLength={1000} style={{ strokeDasharray: `${marco * 1000} 1000` }} />
        {ins.map((r) => (
          <g key={`i${r.i}`} opacity={Math.min(1, r.k)}>
            <line x1={r.xa} y1={r.y} x2={r.xa + (r.xb - r.xa) * Math.min(1, r.k)} y2={r.y} stroke={color} strokeWidth={5} markerEnd={`url(#fsi${color.slice(1)})`} />
            <Particulas pos={(u) => [r.xa + (r.xb - r.xa) * u, r.y]} t={t} color={color} visible={flujo} n={2} velocidad={0.02} r={5} />
          </g>
        ))}
        {outs.map((r) => (
          <g key={`o${r.i}`} opacity={Math.min(1, r.k)}>
            <line x1={r.xa} y1={r.y} x2={r.xa + (r.xb - r.xa) * Math.min(1, r.k)} y2={r.y} stroke={SALIDA} strokeWidth={5} markerEnd={`url(#fso${color.slice(1)})`} />
            <Particulas pos={(u) => [r.xa + (r.xb - r.xa) * u, r.y]} t={t} color={SALIDA} visible={flujo} n={2} velocidad={0.02} r={5} />
          </g>
        ))}
      </svg>
      <div style={{ position: 'absolute', left: x0 + 22, top: y0 + 12, fontSize: 18, letterSpacing: 2, fontWeight: 800, color, opacity: marco }}>{tx.limite}</div>
      {v.entradas.length ? <div style={{ position: 'absolute', left: 0, width: w * 0.22, top: y0 + 4, textAlign: 'right', fontSize: 18, letterSpacing: 2, fontWeight: 800, color, opacity: Math.min(1, muelle(t, 34)) }}>{tx.entradas}</div> : null}
      {v.salidas.length ? <div style={{ position: 'absolute', right: 0, width: w * 0.22, top: y0 + 4, fontSize: 18, letterSpacing: 2, fontWeight: 800, color: SALIDA, opacity: Math.min(1, muelle(t, 44)) }}>{tx.salidas}</div> : null}
      {ins.map((r) => etiqueta(true, r, color))}
      {outs.map((r) => etiqueta(false, r, SALIDA))}
      {v.almacenes.map((a, i) => {
        const c = i % cols;
        const f = Math.floor(i / cols);
        const enFila = Math.min(cols, n - f * cols);
        const x = x0 + (x1 - x0 - (enFila * bw + (enFila - 1) * 28)) / 2 + c * (bw + 28);
        const y = y0 + 40 + (y1 - y0 - 40 - altoAlm) / 2 + f * (bh + 24);
        const k = muelle(t, 16 + i * 6);
        return (
          <div
            key={a}
            style={{
              position: 'absolute', left: x, top: y, width: bw, height: bh, borderRadius: 16, boxSizing: 'border-box', padding: 12,
              background: `linear-gradient(160deg, ${alfa(color, 0.32)}, ${alfa(color, 0.12)})`, border: `2px solid ${color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
              fontSize: 27, fontWeight: 800, color: T.texto, lineHeight: 1.15, transform: `scale(${0.6 + 0.4 * k})`, opacity: Math.min(1, k),
            }}
          >
            {a}
          </div>
        );
      })}
      <Nota texto={v.nota} t={t} desde={dur * 0.6} />
    </Caja>
  );
};

// ─── Bucle de retroalimentación ──────────────────────────────────────────

const Bucle: React.FC<P<De<'bucle'>>> = ({ v, t, dur, color }) => {
  const { w, h } = useEscenario();
  const tx = TX[useIdioma()];
  const n = Math.max(2, v.pasos.length);
  const positivo = v.signo === 'positivo';
  const cBucle = positivo ? T.rojo : T.verde;
  const top = 58;
  const bottom = v.nota ? 52 : 6;
  const cx = w / 2;
  const cy = top + (h - top - bottom) / 2;
  const R = Math.min((h - top - bottom) / 2 - 44, 250);
  const anchoCaja = Math.min(330, w * 0.24);
  // Elipse: deja sitio en el centro para la insignia entre las cajas laterales.
  const Rx = Math.max(R, Math.min(w / 2 - anchoCaja / 2 - 10, anchoCaja / 2 + 170));
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const delta = Math.min(0.55, ((2 * Math.PI) / n) * 0.3);
  const paso = (dur * 0.62 - 10) / n;
  const giro = t * 0.035;
  const badge = muelle(t, 10 + n * paso);
  return (
    <Caja>
      <Titulo texto={v.titulo} color={color} t={t} />
      <svg width={w} height={h} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <marker id={`fb${cBucle.slice(1)}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={cBucle} />
          </marker>
        </defs>
        {v.pasos.map((_, i) => {
          const a0 = ang(i) + delta;
          const a1 = ang(i + 1) - delta;
          const k = interpolate(t, [10 + i * paso + paso * 0.45, 10 + (i + 1) * paso], [0, 1], clamp);
          if (k <= 0) return null;
          const af = a0 + (a1 - a0) * k;
          const d = `M ${cx + Rx * Math.cos(a0)} ${cy + R * Math.sin(a0)} A ${Rx} ${R} 0 0 1 ${cx + Rx * Math.cos(af)} ${cy + R * Math.sin(af)}`;
          return (
            <g key={i}>
              <path d={d} stroke={alfa(cBucle, 0.35)} strokeWidth={10} fill="none" strokeLinecap="round" />
              <path d={d} stroke={cBucle} strokeWidth={5} fill="none" strokeDasharray="16 14" strokeDashoffset={-t * 1.6} markerEnd={k > 0.9 ? `url(#fb${cBucle.slice(1)})` : undefined} />
            </g>
          );
        })}
        {t > 10 + n * paso
          ? [0, 1].map((j) => {
              const a = -Math.PI / 2 + giro + j * Math.PI;
              return <circle key={j} cx={cx + Rx * Math.cos(a)} cy={cy + R * Math.sin(a)} r={9} fill="#fff" opacity={0.85} style={{ filter: `drop-shadow(0 0 10px ${cBucle})` }} />;
            })
          : null}
      </svg>
      {v.pasos.map((p, i) => {
        const k = muelle(t, 10 + i * paso);
        const x = cx + Rx * Math.cos(ang(i));
        const y = cy + R * Math.sin(ang(i));
        return (
          <div
            key={i}
            style={{
              position: 'absolute', left: x - anchoCaja / 2, top: y - 40, width: anchoCaja, minHeight: 80, boxSizing: 'border-box',
              display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '10px 16px', borderRadius: 16,
              background: '#121a2e', border: `2px solid ${alfa(color, 0.85)}`, boxShadow: `0 10px 30px rgba(0,0,0,0.4)`,
              fontSize: 25, fontWeight: 700, color: T.texto, lineHeight: 1.18, transform: `scale(${0.5 + 0.5 * k})`, opacity: Math.min(1, k),
            }}
          >
            {p}
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: cx - 150, top: cy - 92, width: 300, textAlign: 'center', transform: `scale(${badge})`, opacity: Math.min(1, badge) }}>
        <div style={{ margin: '0 auto', width: 112, height: 112, borderRadius: 56, background: cBucle, color: '#fff', fontSize: 88, fontWeight: 800, lineHeight: '104px', boxShadow: `0 0 40px ${alfa(cBucle, 0.6)}` }}>
          {positivo ? '+' : '−'}
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: T.texto, marginTop: 10 }}>{positivo ? tx.pos : tx.neg}</div>
        <div style={{ fontSize: 21, color: cBucle, fontWeight: 700 }}>{positivo ? tx.amp : tx.est}</div>
      </div>
      <Nota texto={v.nota} t={t} desde={dur * 0.7} />
    </Caja>
  );
};

// ─── Curva ───────────────────────────────────────────────────────────────

const logistica = (x: number, k: number, x0: number) => 1 / (1 + Math.exp(-k * (x - x0)));

export function valorCurva(c: Curva, x: number): number {
  switch (c) {
    case 'S':
      return 0.06 + 0.84 * logistica(x, 12, 0.45);
    case 'J':
      return 0.05 + 0.9 * ((Math.exp(4.2 * x) - 1) / (Math.exp(4.2) - 1));
    case 'estado-estacionario':
      return 0.55 + 0.05 * Math.sin(x * 34) + 0.025 * Math.sin(x * 83);
    case 'equilibrio-estable': {
      const base = 0.55 + 0.03 * Math.sin(x * 30);
      if (x < 0.35) return base;
      const u = x - 0.35;
      return base + 0.3 * Math.exp(-u * 7) * Math.cos(u * 22);
    }
    case 'equilibrio-inestable': {
      if (x < 0.4) return 0.65 + 0.03 * Math.sin(x * 30);
      const u = x - 0.4;
      const nivel = 0.65 - 0.35 * logistica(u, 18, 0.12);
      return nivel + 0.08 * Math.exp(-u * 5) * Math.sin(u * 26) + 0.02 * Math.sin(x * 30);
    }
    case 'punto-inflexion':
      return 0.78 - 0.12 * x - 0.5 * logistica(x, 30, 0.6) + 0.015 * Math.sin(x * 40);
  }
}

const CurvaVista: React.FC<P<De<'curva'>>> = ({ v, t, dur, color }) => {
  const { w, h } = useEscenario();
  const izq = 110;
  const der = 60;
  const arriba = 80;
  const abajo = 76;
  const aw = Math.min(w - izq - der, 1400);
  const ax0 = izq + (w - izq - der - aw) / 2;
  const ah = h - arriba - abajo;
  const X = (x: number) => ax0 + x * aw;
  const Y = (y: number) => arriba + (1 - y) * ah;
  const pts = Array.from({ length: 161 }, (_, i) => i / 160);
  const d = pts.map((x, i) => `${i ? 'L' : 'M'} ${X(x).toFixed(1)} ${Y(valorCurva(v.curva, x)).toFixed(1)}`).join(' ');
  const area = `${d} L ${X(1)} ${Y(0)} L ${X(0)} ${Y(0)} Z`;
  const p = interpolate(t, [16, Math.max(40, dur * 0.72)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const ejes = muelle(t, 4);
  const id = `cl${v.curva}`;
  return (
    <Caja>
      <Titulo texto={v.titulo} color={color} t={t} />
      <svg width={w} height={h} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <linearGradient id={`${id}g`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
          <clipPath id={`${id}c`}>
            <rect x={0} y={0} width={X(p)} height={h} />
          </clipPath>
        </defs>
        <g opacity={Math.min(1, ejes)}>
          {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={X(0)} x2={X(1)} y1={Y(g)} y2={Y(g)} stroke={T.borde} strokeWidth={1.5} />)}
          <line x1={X(0)} y1={Y(0)} x2={X(1) + 20} y2={Y(0)} stroke={T.tenue} strokeWidth={3} />
          <line x1={X(0)} y1={Y(0)} x2={X(0)} y2={Y(1) - 20} stroke={T.tenue} strokeWidth={3} />
          <path d={`M ${X(1) + 20} ${Y(0) - 8} L ${X(1) + 34} ${Y(0)} L ${X(1) + 20} ${Y(0) + 8} Z`} fill={T.tenue} />
          <path d={`M ${X(0) - 8} ${Y(1) - 20} L ${X(0)} ${Y(1) - 34} L ${X(0) + 8} ${Y(1) - 20} Z`} fill={T.tenue} />
        </g>
        <path d={area} fill={`url(#${id}g)`} clipPath={`url(#${id}c)`} />
        <path d={d} stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} style={{ filter: `drop-shadow(0 0 8px ${alfa(color, 0.6)})` }} />
        {p > 0 && p < 1 ? <circle cx={X(p)} cy={Y(valorCurva(v.curva, p))} r={11} fill="#fff" style={{ filter: `drop-shadow(0 0 12px ${color})` }} /> : null}
        {(v.marcas ?? []).map((m, i) => {
          const k = interpolate(p, [m.x - 0.02, m.x + 0.04], [0, 1], clamp);
          return (
            <g key={i} opacity={k}>
              <line x1={X(m.x)} x2={X(m.x)} y1={Y(0)} y2={Y(1) - 6} stroke={T.texto} strokeWidth={2.5} strokeDasharray="8 8" />
              <circle cx={X(m.x)} cy={Y(valorCurva(v.curva, m.x))} r={9} fill={color} stroke="#fff" strokeWidth={3} />
            </g>
          );
        })}
      </svg>
      {(v.marcas ?? []).map((m, i) => {
        const k = interpolate(p, [m.x, m.x + 0.05], [0, 1], clamp);
        return (
          <div
            key={i}
            style={{
              position: 'absolute', left: Math.min(w - 300, Math.max(0, X(m.x) - 150)), top: Y(1) - 4 + (i % 2) * 52, width: 300, textAlign: 'center',
              opacity: k,
            }}
          >
            <span style={{ display: 'inline-block', fontSize: 23, fontWeight: 800, color: '#0b0f1c', background: T.texto, padding: '5px 14px', borderRadius: 14, transform: `scale(${0.7 + 0.3 * k})` }}>{m.texto}</span>
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: X(1) - 500, width: 520, top: Y(0) + 18, textAlign: 'right', fontSize: 25, fontWeight: 700, color: T.tenue, opacity: Math.min(1, ejes) }}>{v.ejeX}</div>
      <div
        style={{
          position: 'absolute', left: X(0) - 64, top: Y(0.5), width: ah, marginLeft: -ah / 2, textAlign: 'center', transform: 'rotate(-90deg)',
          fontSize: 25, fontWeight: 700, color: T.tenue, opacity: Math.min(1, ejes),
        }}
      >
        {v.ejeY}
      </div>
    </Caja>
  );
};

// ─── Pirámide ────────────────────────────────────────────────────────────

const Piramide: React.FC<P<De<'piramide'>>> = ({ v, t, dur, color }) => {
  const { w, h } = useEscenario();
  const n = Math.max(1, v.niveles.length);
  const arriba = 66;
  const disponible = h - arriba - 6;
  const lh = Math.min(104, disponible / n - 8);
  const total = n * (lh + 8) - 8;
  const base = Math.min(w * 0.58, 980);
  const cima = base * 0.2;
  const cx = w * 0.4;
  const ancho = (k: number) => (v.invertida ? cima + ((base - cima) * k) / n : base - ((base - cima) * k) / n);
  const paso = (dur * 0.6 - 10) / n;
  return (
    <Caja>
      <Titulo texto={v.titulo} color={color} t={t} />
      {v.niveles.map((nv, i) => {
        const wb = ancho(i);
        const wt = ancho(i + 1);
        const y = arriba + (disponible - total) / 2 + (n - 1 - i) * (lh + 8);
        const k = muelle(t, 10 + i * paso);
        const m = (wb - wt) / 2;
        const relleno = tono(color, 0.45 + 0.55 * (i / Math.max(1, n - 1)));
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: 'absolute', left: cx - wb / 2, top: y, width: wb, height: lh,
                clipPath: `polygon(0 100%, 100% 100%, ${((wb - m) / wb) * 100}% 0, ${(m / wb) * 100}% 0)`,
                background: `linear-gradient(180deg, ${relleno}, ${tono(relleno, 0.7)})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: `translateY(${(1 - k) * 60}px) scaleX(${0.6 + 0.4 * k})`, opacity: Math.min(1, k),
              }}
            >
              <span style={{ fontSize: lh > 80 ? 27 : 23, fontWeight: 800, color: '#07101c', textAlign: 'center', padding: '0 40px', lineHeight: 1.1 }}>{nv.etiqueta}</span>
            </div>
            {nv.valor ? (
              <div style={{ position: 'absolute', left: cx + Math.max(wb, wt) / 2 + 24, top: y + lh / 2 - 22, display: 'flex', alignItems: 'center', gap: 14, opacity: Math.min(1, k) }}>
                <div style={{ width: 40, height: 3, background: alfa(color, 0.6) }} />
                <div style={{ fontSize: 30, fontWeight: 800, color: T.texto }}>{contar(nv.valor, k)}</div>
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
    </Caja>
  );
};

// ─── Ciclo (red de almacenes y flujos) ───────────────────────────────────

const Ciclo: React.FC<P<De<'ciclo'>>> = ({ v, t, dur, color }) => {
  const { w, h } = useEscenario();
  const arriba = 64;
  const bw = 250;
  const bh = 92;
  const px = (x: number) => bw / 2 + 10 + x * (w - bw - 20);
  const py = (y: number) => arriba + bh / 2 + 6 + y * (h - arriba - bh - 12);
  const nodos = new Map(v.almacenes.map((a) => [a.id, { ...a, X: px(a.x), Y: py(a.y) }]));
  const pasoN = (dur * 0.25) / Math.max(1, v.almacenes.length);
  const pasoF = (dur * 0.45) / Math.max(1, v.flujos.length);
  const recorte = (dx: number, dy: number) => {
    const l = Math.hypot(dx, dy) || 1;
    const ux = dx / l;
    const uy = dy / l;
    return Math.min((bw / 2 + 10) / Math.max(0.001, Math.abs(ux)), (bh / 2 + 10) / Math.max(0.001, Math.abs(uy)));
  };
  const flujos = v.flujos.flatMap((f, i) => {
    const a = nodos.get(f.de);
    const b = nodos.get(f.a);
    if (!a || !b) return [];
    const mx = (a.X + b.X) / 2;
    const my = (a.Y + b.Y) / 2;
    const dx = b.X - a.X;
    const dy = b.Y - a.Y;
    const l = Math.hypot(dx, dy) || 1;
    const cX = mx + (-dy / l) * l * 0.2;
    const cY = my + (dx / l) * l * 0.2;
    const ra = recorte(cX - a.X, cY - a.Y);
    const rb = recorte(cX - b.X, cY - b.Y);
    const la = Math.hypot(cX - a.X, cY - a.Y) || 1;
    const lb = Math.hypot(cX - b.X, cY - b.Y) || 1;
    const p0 = [a.X + ((cX - a.X) / la) * ra, a.Y + ((cY - a.Y) / la) * ra] as const;
    const p1 = [b.X + ((cX - b.X) / lb) * rb, b.Y + ((cY - b.Y) / lb) * rb] as const;
    const desde = dur * 0.25 + i * pasoF;
    const k = interpolate(t, [desde, desde + 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    return [{ f, i, p0, p1, cX, cY, k, desde }];
  });
  return (
    <Caja>
      <Titulo texto={v.titulo} color={color} t={t} />
      <svg width={w} height={h} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <marker id={`fc${color.slice(1)}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
          </marker>
        </defs>
        {flujos.map(({ i, p0, p1, cX, cY, k, desde }) => {
          const d = `M ${p0[0]} ${p0[1]} Q ${cX} ${cY} ${p1[0]} ${p1[1]}`;
          return (
            <g key={i} opacity={k > 0 ? 1 : 0}>
              <path d={d} stroke={alfa(color, 0.22)} strokeWidth={12} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
              <path d={d} stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} markerEnd={k > 0.95 ? `url(#fc${color.slice(1)})` : undefined} />
              <Particulas
                pos={(u) => [bez(p0[0], cX, p1[0], u), bez(p0[1], cY, p1[1], u)]}
                t={t + i * 13}
                color="#ffffff"
                visible={interpolate(t, [desde + 20, desde + 34], [0, 1], clamp)}
                velocidad={0.011}
                r={5}
              />
            </g>
          );
        })}
      </svg>
      {flujos.map(({ f, i, p0, p1, cX, cY, k }) => {
        const lx = bez(p0[0], cX, p1[0], 0.5);
        const ly = bez(p0[1], cY, p1[1], 0.5);
        return (
          <div
            key={`e${i}`}
            style={{
              position: 'absolute', left: lx - 120, top: ly - 20, width: 240, textAlign: 'center', opacity: interpolate(k, [0.5, 1], [0, 1], clamp),
            }}
          >
            <span style={{ display: 'inline-block', fontSize: 21, fontWeight: 700, color: T.texto, background: 'rgba(9,14,28,0.88)', border: `1px solid ${alfa(color, 0.5)}`, padding: '4px 12px', borderRadius: 12, lineHeight: 1.15 }}>
              {f.etiqueta}
            </span>
          </div>
        );
      })}
      {[...nodos.values()].map((a, i) => {
        const k = muelle(t, 8 + i * pasoN);
        return (
          <div
            key={a.id}
            style={{
              position: 'absolute', left: a.X - bw / 2, top: a.Y - bh / 2, width: bw, height: bh, boxSizing: 'border-box', borderRadius: 18,
              background: 'linear-gradient(160deg, #16223b, #0f1729)', border: `2px solid ${color}`, boxShadow: `0 0 26px ${alfa(color, 0.25)}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
              transform: `scale(${0.5 + 0.5 * k})`, opacity: Math.min(1, k),
            }}
          >
            <div style={{ fontSize: 25, fontWeight: 800, color: T.texto, lineHeight: 1.1 }}>{a.etiqueta}</div>
            {a.valor ? <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 4 }}>{contar(a.valor, Math.min(1, k))}</div> : null}
          </div>
        );
      })}
    </Caja>
  );
};

// ─── Tabla ───────────────────────────────────────────────────────────────

const Tabla: React.FC<P<De<'tabla'>>> = ({ v, t, dur, color }) => {
  const { w, h } = useEscenario();
  const n = v.filas.length;
  const ancho = Math.min(w, 1500);
  const alto = Math.min(66, (h - 140) / Math.max(1, n));
  const fuente = alto < 56 ? 22 : 25;
  const paso = (dur * 0.6 - 14) / Math.max(1, n);
  const cab = muelle(t, 6);
  return (
    <Caja>
      <Titulo texto={v.titulo} color={color} t={t} />
      <div style={{ position: 'absolute', top: Math.max(66, 66 + (h - 66 - (56 + n * alto)) / 2 - 20), left: (w - ancho) / 2, width: ancho }}>
        <div style={{ display: 'flex', background: alfa(color, 0.85), borderRadius: '14px 14px 0 0', opacity: Math.min(1, cab), transform: `scaleY(${0.6 + 0.4 * cab})` }}>
          {v.columnas.map((c, j) => (
            <div key={j} style={{ flex: j === 0 ? 1.3 : 1, padding: '14px 20px', fontSize: fuente, fontWeight: 800, color: '#07101c' }}>
              {c}
            </div>
          ))}
        </div>
        {v.filas.map((fila, i) => {
          const k = muelle(t, 14 + i * paso);
          return (
            <div
              key={i}
              style={{
                display: 'flex', minHeight: alto, alignItems: 'center', background: i % 2 ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.07)',
                borderBottom: `1px solid ${T.borde}`, opacity: Math.min(1, k), transform: `translateX(${(1 - k) * -60}px)`,
              }}
            >
              {fila.map((celda, j) => (
                <div key={j} style={{ flex: j === 0 ? 1.3 : 1, padding: '8px 20px', fontSize: fuente, fontWeight: j === 0 ? 800 : 500, color: j === 0 ? T.texto : T.tenue, lineHeight: 1.2 }}>
                  {j === 0 ? celda : contar(celda, Math.min(1, k))}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </Caja>
  );
};

export const VisualESS: React.FC<{ v: Visual; t: number; dur: number; color: string }> = ({ v, t, dur, color }) => {
  switch (v.tipo) {
    case 'sistema': return <Sistema v={v} t={t} dur={dur} color={color} />;
    case 'bucle': return <Bucle v={v} t={t} dur={dur} color={color} />;
    case 'curva': return <CurvaVista v={v} t={t} dur={dur} color={color} />;
    case 'piramide': return <Piramide v={v} t={t} dur={dur} color={color} />;
    case 'ciclo': return <Ciclo v={v} t={t} dur={dur} color={color} />;
    case 'tabla': return <Tabla v={v} t={t} dur={dur} color={color} />;
    default: return null;
  }
};
