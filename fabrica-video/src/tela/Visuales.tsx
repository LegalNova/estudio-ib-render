import React from 'react';
import { interpolate } from 'remotion';
import { animar, FIGURAS } from './figuras';
import { Persona, tono } from './Persona';
import { alfa, entra, escalon, formatoNum, HILO_COLOR, T, useEscenario, useIdioma } from './estilo';
import type { FiguraEnEscena, Visual } from './tipos';
import { Caja } from './Caja';
import { VisualESS } from './VisualesESS';

// Un componente por tipo de visual. Todos se dibujan dentro del escenario
// (ESCENARIO: 1240×580 px) y reparten sus elementos a lo largo de la escena.

interface P<V> {
  v: V;
  /** Fotograma dentro de la escena. */
  t: number;
  /** Duración de la escena en fotogramas. */
  dur: number;
  color: string;
}
type De<K extends Visual['tipo']> = Extract<Visual, { tipo: K }>;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;



const Titulillo: React.FC<{ texto: string; color: string; t: number; nota?: string }> = ({ texto, color, t, nota }) => (
  <div style={{ opacity: entra(t, 2), marginBottom: 18 }}>
    <div style={{ fontSize: 34, fontWeight: 800, color, letterSpacing: 0.3 }}>{texto}</div>
    {nota ? <div style={{ fontSize: 24, color: T.tenue, marginTop: 4 }}>{nota}</div> : null}
  </div>
);

// ─── Figuras ─────────────────────────────────────────────────────────────

const Atrezo: React.FC<{ tipo: 'mesa' | 'urna' | 'barrotes'; escala: number }> = ({ tipo, escala }) => {
  if (tipo === 'mesa')
    return (
      <svg width={260 * escala} height={515 * escala} viewBox="-130 -505 260 515" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <rect x={-92} y={-214} width={150} height={12} rx={3} fill="#7a5638" />
        <rect x={-84} y={-202} width={10} height={196} fill="#5b3f28" />
        <rect x={40} y={-202} width={10} height={196} fill="#5b3f28" />
        <rect x={-64} y={-226} width={58} height={14} fill="#f3f0e6" transform="rotate(-5 -35 -219)" />
      </svg>
    );
  if (tipo === 'urna')
    return (
      <svg width={120 * escala} height={140 * escala} viewBox="0 0 120 140" style={{ position: 'absolute', right: -40 * escala, bottom: 60 * escala, overflow: 'visible' }}>
        <rect x={10} y={20} width={100} height={110} rx={6} fill="#cfd6e0" stroke="#7c8696" strokeWidth={3} />
        <rect x={40} y={14} width={40} height={10} rx={3} fill="#3a4250" />
        <text x={60} y={88} textAnchor="middle" fontSize={18} fontWeight={800} fill="#3a4250">
          URNA
        </text>
      </svg>
    );
  return (
    <svg width={260 * escala} height={500 * escala} viewBox="0 0 260 500" style={{ position: 'absolute', left: 0, bottom: 0, overflow: 'visible' }}>
      <rect x={20} y={20} width={220} height={470} fill="none" stroke="#9aa3b2" strokeWidth={8} />
      {[60, 100, 140, 180, 220].map((x) => <rect key={x} x={x - 4} y={20} width={8} height={470} fill="#9aa3b2" />)}
    </svg>
  );
};

const FiguraVista: React.FC<{ f: FiguraEnEscena; i: number; t: number; dur: number; escala: number; ancho: number; color: string; n: number }> = ({
  f, i, t, dur, escala, ancho, color, n,
}) => {
  const ficha = FIGURAS[f.id];
  const desde = escalon(i, n, dur, 6, 0.35);
  const local = t - desde;
  if (local < 0) return <div style={{ width: ancho }} />;
  const an = animar(f.accion, local, dur - desde, i + 1, ficha.a.objeto);
  const gris = f.eliminado ? Math.max(an.gris, interpolate(local, [18, 40], [0, 1], clamp)) : an.gris;
  const filtro = gris > 0 ? `grayscale(${gris}) brightness(${1 - gris * 0.25})` : undefined;
  const cruz = f.eliminado ? interpolate(local, [22, 34], [0, 1], clamp) : 0;
  const bocadillo = f.dice ? entra(local, 22, 12) : 0;
  const alto = 515 * escala;
  return (
    <div style={{ width: ancho, height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
      {f.dice ? (
        <div
          style={{
            position: 'absolute',
            top: 0,
            maxWidth: Math.min(ancho - 16, 360),
            maxHeight: 96,
            zIndex: 2,
            overflow: 'hidden',
            background: '#f6f3ea',
            color: '#191c26',
            borderRadius: 18,
            padding: '12px 18px',
            fontSize: 25,
            lineHeight: 1.22,
            fontWeight: 600,
            textAlign: 'center',
            opacity: bocadillo,
            transform: `scale(${0.85 + 0.15 * bocadillo})`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          }}
        >
          «{f.dice}»
          <div style={{ position: 'absolute', left: '50%', bottom: -12, marginLeft: -12, width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '14px solid #f6f3ea' }} />
        </div>
      ) : null}
      <div style={{ position: 'relative', width: 260 * escala, height: alto, opacity: an.opacidad }}>
        <div
          style={{
            position: 'absolute', inset: 0, filter: filtro,
            transform: `translate(${an.dx * escala}px, ${an.dy * escala}px) rotate(${an.giro}deg)`,
            transformOrigin: '50% 98%',
          }}
        >
          <Persona a={ficha.a} p={an.pose} escala={escala} />
          {an.atrezo && an.atrezo !== 'barrotes' ? <Atrezo tipo={an.atrezo} escala={escala} /> : null}
        </div>
        {an.atrezo === 'barrotes' ? <div style={{ opacity: entra(local, 20, 10) }}><Atrezo tipo="barrotes" escala={escala} /></div> : null}
        {cruz > 0 ? (
          <svg width={260 * escala} height={alto} viewBox="0 0 260 515" style={{ position: 'absolute', inset: 0 }}>
            <path d="M 50 120 L 210 330 M 210 120 L 50 330" stroke={T.rojo} strokeWidth={14} strokeLinecap="round" strokeDasharray={270} strokeDashoffset={270 * (1 - cruz)} />
          </svg>
        ) : null}
      </div>
      <div style={{ height: 74, textAlign: 'center', opacity: entra(local, 10), marginTop: 6 }}>
        <div style={{ fontSize: n > 4 ? 23 : 27, fontWeight: 800, color: f.eliminado ? T.tenue : T.texto, textDecoration: f.eliminado ? 'line-through' : undefined, textDecorationColor: T.rojo }}>
          {f.nombre ?? ficha.nombre}
        </div>
        {f.rol ? <div style={{ fontSize: n > 4 ? 19 : 21, color, marginTop: 2, lineHeight: 1.15 }}>{f.rol}</div> : null}
      </div>
    </div>
  );
};

const Figuras: React.FC<P<De<'figuras'>>> = ({ v, t, dur, color }) => {
  const { w: W, h: H } = useEscenario();
  const n = v.figuras.length;
  const ancho = W / n;
  const hayDice = v.figuras.some((f) => f.dice);
  const escala = Math.min(0.95, ancho / 225, (H - (v.lema ? 52 : 0) - 80 - (hayDice ? 118 : 0)) / 470);
  return (
    <Caja>
      <div style={{ position: 'absolute', inset: 0, bottom: v.lema ? 52 : 0, display: 'flex', alignItems: 'flex-end' }}>
        {v.figuras.map((f, i) => (
          <FiguraVista key={`${f.id}-${i}`} f={f} i={i} t={t} dur={dur} escala={escala} ancho={ancho} color={color} n={n} />
        ))}
      </div>
      {v.lema ? (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, textAlign: 'center', fontSize: 30, fontWeight: 700, color, opacity: entra(t, dur * 0.45) }}>{v.lema}</div>
      ) : null}
    </Caja>
  );
};

// ─── Tarjetas ────────────────────────────────────────────────────────────

const Tarjetas: React.FC<P<De<'tarjetas'>>> = ({ v, t, dur, color }) => {
  const { h: H } = useEscenario();
  const n = v.tarjetas.length;
  const cols = n <= 2 ? n : n === 4 ? 2 : 3;
  const filas = Math.ceil(n / cols);
  const gap = 22;
  const alto = Math.min(250, (H - gap * (filas - 1)) / filas);
  return (
    <Caja style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap, alignContent: 'center' }}>
      {v.tarjetas.map((c, i) => {
        const k = entra(t, escalon(i, n, dur));
        const col = c.color ? HILO_COLOR[c.color] : color;
        return (
          <div
            key={i}
            style={{
              height: alto, background: T.tarjeta, border: `1px solid ${T.borde}`, borderLeft: `6px solid ${col}`, borderRadius: 14,
              padding: '20px 24px', boxSizing: 'border-box', opacity: k, transform: `translateY(${(1 - k) * 26}px)`, overflow: 'hidden',
            }}
          >
            {c.fecha ? <div style={{ fontSize: 22, fontWeight: 800, color: col, letterSpacing: 0.5, marginBottom: 6 }}>{c.fecha}</div> : null}
            <div style={{ fontSize: n > 4 ? 29 : 33, fontWeight: 800, color: T.texto, lineHeight: 1.15 }}>{c.titulo}</div>
            <div style={{ fontSize: n > 4 ? 24 : 27, color: T.tenue, marginTop: 10, lineHeight: 1.3 }}>{c.detalle}</div>
          </div>
        );
      })}
    </Caja>
  );
};

// ─── Barras ──────────────────────────────────────────────────────────────

const Barras: React.FC<P<De<'barras'>>> = ({ v, t, dur, color }) => {
  const { w: W, h: H } = useEscenario();
  const n = v.datos.length;
  const max = Math.max(...v.datos.map((d) => d.valor), 1);
  const altoMax = H - 190;
  const anchoBarra = Math.min(120, (W - 80) / n - 30);
  return (
    <Caja>
      <Titulillo texto={v.titulo} color={color} t={t} />
      <div style={{ position: 'absolute', left: 40, right: 40, bottom: 50, height: altoMax + 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', borderBottom: `2px solid ${T.borde}` }}>
        {v.datos.map((d, i) => {
          const k = entra(t, escalon(i, n, dur, 10, 0.5), 22);
          const h = (d.valor / max) * altoMax * k;
          const c = d.color ?? color;
          return (
            <div key={i} style={{ width: anchoBarra, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: T.texto, opacity: k, marginBottom: 8 }}>
                {formatoNum(d.valor * Math.min(1, k * 1.05))}
                {v.unidad ? <span style={{ fontSize: 22, color: T.tenue }}> {v.unidad}</span> : null}
              </div>
              <div style={{ width: anchoBarra, height: h, background: `linear-gradient(180deg, ${c}, ${tono(c, 0.6)})`, borderRadius: '8px 8px 0 0' }} />
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', left: 40, right: 40, bottom: 0, height: 44, display: 'flex', justifyContent: 'space-around' }}>
        {v.datos.map((d, i) => (
          <div key={i} style={{ width: anchoBarra + 30, textAlign: 'center', fontSize: 22, color: T.tenue, lineHeight: 1.1, opacity: entra(t, escalon(i, n, dur, 10, 0.5)) }}>
            {d.etiqueta}
          </div>
        ))}
      </div>
    </Caja>
  );
};

// ─── Interruptores (derechos que se apagan) ──────────────────────────────

const Interruptores: React.FC<P<De<'interruptores'>>> = ({ v, t, dur, color }) => {
  const { h: H } = useEscenario();
  const n = v.items.length;
  const alto = Math.min(84, (H - 150) / n - 12);
  return (
    <Caja>
      <Titulillo texto={v.titulo} color={color} t={t} nota={v.nota} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 900 }}>
        {v.items.map((it, i) => {
          const aparece = entra(t, 6 + i * 5);
          const apaga = interpolate(t, [dur * 0.25 + i * ((dur * 0.55) / n), dur * 0.25 + i * ((dur * 0.55) / n) + 8], [0, 1], clamp);
          const fondo = apaga < 0.5 ? T.verde : '#4a4f5c';
          return (
            <div
              key={i}
              style={{
                height: alto, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 26px', borderRadius: 12,
                background: apaga > 0.5 ? 'rgba(229,72,77,0.08)' : T.tarjeta, border: `1px solid ${apaga > 0.5 ? alfa(T.rojo, 0.35) : T.borde}`,
                opacity: aparece, transform: `translateX(${(1 - aparece) * -30}px)`,
              }}
            >
              <span style={{ fontSize: 31, fontWeight: 700, color: apaga > 0.5 ? T.tenue : T.texto, textDecoration: apaga > 0.5 ? 'line-through' : undefined, textDecorationColor: T.rojo }}>{it}</span>
              <div style={{ width: 76, height: 40, borderRadius: 20, background: fondo, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 4, left: 4 + 36 * (1 - apaga), width: 32, height: 32, borderRadius: 16, background: '#fff' }} />
              </div>
            </div>
          );
        })}
      </div>
    </Caja>
  );
};

// ─── Cronología ──────────────────────────────────────────────────────────

const Cronologia: React.FC<P<De<'cronologia'>>> = ({ v, t, dur, color }) => {
  const { w: W, h: H } = useEscenario();
  const n = v.puntos.length;
  const y = H / 2;
  const paso = (W - 120) / Math.max(1, n - 1);
  const avance = interpolate(t, [8, dur * 0.75], [0, 1], clamp);
  return (
    <Caja>
      <div style={{ position: 'absolute', left: 60, right: 60, top: y - 3, height: 6, background: T.borde, borderRadius: 3 }} />
      <div style={{ position: 'absolute', left: 60, top: y - 3, height: 6, width: (W - 120) * avance, background: color, borderRadius: 3 }} />
      {v.puntos.map((p, i) => {
        const x = n === 1 ? W / 2 : 60 + i * paso;
        const k = entra(t, 8 + (dur * 0.75 - 8) * (n === 1 ? 0 : i / (n - 1)), 12);
        const c = p.hilo ? HILO_COLOR[p.hilo] : color;
        const arriba = i % 2 === 0;
        const ancho = Math.min(290, paso * 1.7);
        return (
          <React.Fragment key={i}>
            <div style={{ position: 'absolute', left: x - 13, top: y - 13, width: 26, height: 26, borderRadius: 13, background: c, transform: `scale(${k})`, boxShadow: `0 0 18px ${alfa(c, 0.7)}` }} />
            <div
              style={{
                position: 'absolute', left: Math.max(0, Math.min(W - ancho, x - ancho / 2)), width: ancho, textAlign: 'center', opacity: k,
                ...(arriba ? { bottom: H - y + 30 } : { top: y + 30 }),
              }}
            >
              <div style={{ fontSize: 27, fontWeight: 800, color: c }}>{p.fecha}</div>
              <div style={{ fontSize: 23, color: T.texto, lineHeight: 1.22, marginTop: 4 }}>{p.texto}</div>
            </div>
          </React.Fragment>
        );
      })}
    </Caja>
  );
};

// ─── Cadena (Niemöller) ──────────────────────────────────────────────────

const Cadena: React.FC<P<De<'cadena'>>> = ({ v, t, dur, color }) => {
  const idioma = useIdioma();
  const { w: W } = useEscenario();
  const n = v.pasos.length;
  const gap = 44;
  const ancho = (W - gap * (n - 1)) / n;
  return (
    <Caja>
      <Titulillo texto={v.titulo} color={color} t={t} />
      <div style={{ position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', gap, alignItems: 'stretch' }}>
        {v.pasos.map((p, i) => {
          const desde = 12 + i * ((dur * 0.7 - 12) / n);
          const k = entra(t, desde, 14);
          const ultimo = i === n - 1;
          return (
            <div key={i} style={{ width: ancho, position: 'relative', opacity: 0.25 + 0.75 * k, transform: `scale(${0.94 + 0.06 * k})` }}>
              <div style={{ textAlign: 'center', fontSize: 30, fontWeight: 800, color, marginBottom: 10 }}>{idioma === 'en' ? `Step ${i + 1}` : `${i + 1}.º`}</div>
              <div
                style={{
                  height: 230, borderRadius: 14, padding: 18, boxSizing: 'border-box', textAlign: 'center',
                  background: ultimo && k > 0.5 ? T.rojo : T.tarjeta, border: `2px solid ${k > 0.5 ? (ultimo ? T.rojo : alfa(color, 0.7)) : T.borde}`,
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                }}
              >
                <div style={{ fontSize: n > 5 ? 26 : 30, fontWeight: 800, color: T.texto }}>{p.titulo}</div>
                <div style={{ fontSize: n > 5 ? 19 : 22, color: ultimo && k > 0.5 ? '#fff' : T.tenue, marginTop: 10, lineHeight: 1.25 }}>{p.detalle}</div>
              </div>
              {!ultimo ? <div style={{ position: 'absolute', right: -gap + 6, top: 150, fontSize: 34, color: T.tenue, opacity: k }}>→</div> : null}
            </div>
          );
        })}
      </div>
      {v.nota ? <div style={{ position: 'absolute', left: 0, right: 0, bottom: 20, textAlign: 'center', fontSize: 28, color: T.texto, opacity: entra(t, dur * 0.75) }}>{v.nota}</div> : null}
    </Caja>
  );
};

// ─── Balanza ─────────────────────────────────────────────────────────────

const Balanza: React.FC<P<De<'balanza'>>> = ({ v, t, dur, color }) => {
  const { w: W } = useEscenario();
  const gana = v.gana ?? 'izquierda';
  const giro = interpolate(t, [dur * 0.45, dur * 0.65], [0, gana === 'izquierda' ? -9 : 9], clamp);
  const lado = (l: 'izquierda' | 'derecha') => {
    const d = v[l];
    const desde = l === 'izquierda' ? 10 : dur * 0.22;
    const ganador = l === gana && t > dur * 0.6;
    return (
      <div style={{ width: 470, opacity: entra(t, desde) }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: ganador ? color : T.texto, marginBottom: 12, textAlign: 'center' }}>{d.titulo}</div>
        {d.puntos.map((p, i) => (
          <div key={i} style={{ fontSize: 24, color: T.tenue, background: T.tarjeta, border: `1px solid ${ganador ? alfa(color, 0.5) : T.borde}`, borderRadius: 10, padding: '10px 16px', marginBottom: 10, lineHeight: 1.25, opacity: entra(t, desde + 6 + i * 8) }}>
            {p}
          </div>
        ))}
      </div>
    );
  };
  return (
    <Caja>
      <Titulillo texto={v.titulo} color={color} t={t} />
      <svg width={W} height={200} viewBox={`0 0 ${W} 200`} style={{ position: 'absolute', top: 60, overflow: 'visible' }}>
        <rect x={W / 2 - 6} y={40} width={12} height={150} fill={T.muyTenue} />
        <path d={`M ${W / 2 - 70} 196 L ${W / 2 + 70} 196 L ${W / 2} 170 Z`} fill={T.muyTenue} />
        <g transform={`rotate(${giro} ${W / 2} 44)`}>
          <rect x={W / 2 - 360} y={38} width={720} height={10} rx={5} fill={color} />
        </g>
        {[-1, 1].map((s) => {
          const rad = (giro * Math.PI) / 180;
          const px = W / 2 + s * 350 * Math.cos(rad);
          const py = 44 + s * 350 * Math.sin(rad);
          return (
            <g key={s}>
              <line x1={px - 50} y1={py + 58} x2={px} y2={py} stroke={T.tenue} strokeWidth={2.5} />
              <line x1={px + 50} y1={py + 58} x2={px} y2={py} stroke={T.tenue} strokeWidth={2.5} />
              <path d={`M ${px - 72} ${py + 58} Q ${px} ${py + 100} ${px + 72} ${py + 58} Z`} fill={alfa(color, 0.55)} />
            </g>
          );
        })}
        <circle cx={W / 2} cy={44} r={12} fill={color} />
      </svg>
      <div style={{ position: 'absolute', top: 262, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 40px' }}>
        {lado('izquierda')}
        {lado('derecha')}
      </div>
      {v.veredicto ? (
        <div style={{ position: 'absolute', bottom: 0, left: 100, right: 100, textAlign: 'center', fontSize: 30, fontWeight: 800, color: T.texto, background: alfa(color, 0.16), border: `2px solid ${alfa(color, 0.6)}`, borderRadius: 14, padding: '12px 20px', opacity: entra(t, dur * 0.66) }}>
          {v.veredicto}
        </div>
      ) : null}
    </Caja>
  );
};

// ─── Hemiciclo ───────────────────────────────────────────────────────────

function asientos(total: number): Array<{ x: number; y: number; ang: number }> {
  const filas = Math.max(6, Math.round(Math.sqrt(total / 3.2)));
  const r0 = 150;
  const r1 = 360;
  const radios = Array.from({ length: filas }, (_, i) => r0 + ((r1 - r0) * i) / (filas - 1));
  const sumaR = radios.reduce((a, b) => a + b, 0);
  const puntos: Array<{ x: number; y: number; ang: number }> = [];
  let resto = total;
  radios.forEach((r, i) => {
    const k = i === filas - 1 ? resto : Math.round((total * r) / sumaR);
    resto -= k;
    for (let j = 0; j < k; j++) {
      const ang = Math.PI * (1 - j / Math.max(1, k - 1));
      puntos.push({ x: Math.cos(ang) * r, y: -Math.sin(ang) * r, ang });
    }
  });
  return puntos.sort((a, b) => b.ang - a.ang);
}

const Hemiciclo: React.FC<P<De<'hemiciclo'>>> = ({ v, t, dur, color }) => {
  const pts = React.useMemo(() => asientos(v.total), [v.total]);
  const colores: string[] = [];
  v.grupos.forEach((g) => { for (let i = 0; i < g.escanos; i++) colores.push(g.color); });
  const avance = interpolate(t, [8, dur * 0.55], [0, pts.length], clamp);
  const r = v.total > 500 ? 5.2 : 7;
  return (
    <Caja>
      <Titulillo texto={v.titulo} color={color} t={t} nota={v.nota} />
      <svg width={800} height={400} viewBox="-400 -380 800 400" style={{ position: 'absolute', left: 0, top: 140 }}>
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={r} fill={colores[i] ?? '#3a3f4c'} opacity={i < avance ? 1 : 0.08} />
        ))}
        <text x={0} y={-30} textAnchor="middle" fontSize={40} fontWeight={800} fill={T.texto}>{v.total}</text>
        <text x={0} y={4} textAnchor="middle" fontSize={20} fill={T.tenue}>escaños</text>
      </svg>
      <div style={{ position: 'absolute', left: 840, top: 160, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {v.grupos.map((g, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: entra(t, escalon(i, v.grupos.length, dur, 10, 0.55)) }}>
            <div style={{ width: 22, height: 22, borderRadius: 11, background: g.color }} />
            <div style={{ fontSize: 26, color: T.texto, fontWeight: 700 }}>{g.etiqueta}</div>
            <div style={{ fontSize: 26, color: T.tenue }}>{g.escanos}</div>
          </div>
        ))}
      </div>
    </Caja>
  );
};

// ─── Frase y portada ─────────────────────────────────────────────────────

const Frase: React.FC<P<De<'frase'>>> = ({ v, t, color }) => {
  const k = entra(t, 6, 20);
  const largo = v.texto.length;
  return (
    <Caja style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 70px', boxSizing: 'border-box' }}>
      <div style={{ fontSize: 140, lineHeight: 0.6, color, opacity: k, fontWeight: 800 }}>“</div>
      <div style={{ fontSize: largo > 160 ? 40 : largo > 90 ? 48 : 58, fontWeight: 700, color: T.texto, lineHeight: 1.25, opacity: k, transform: `translateY(${(1 - k) * 20}px)` }}>{v.texto}</div>
      {v.autor ? <div style={{ fontSize: 28, color, marginTop: 24, opacity: entra(t, 26) }}>— {v.autor}</div> : null}
    </Caja>
  );
};

const Portada: React.FC<P<De<'portada'>>> = ({ v, t, color }) => {
  const k = entra(t, 4, 22);
  return (
    <Caja style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: v.titulo.length > 40 ? 66 : 84, fontWeight: 800, color: T.texto, lineHeight: 1.1, opacity: k, transform: `scale(${0.92 + 0.08 * k})` }}>{v.titulo}</div>
      {v.subtitulo ? <div style={{ fontSize: 36, color, marginTop: 24, opacity: entra(t, 18), fontWeight: 600 }}>{v.subtitulo}</div> : null}
    </Caja>
  );
};

export const VisualVista: React.FC<{ v: Visual; t: number; dur: number; color: string }> = ({ v, t, dur, color }) => {
  switch (v.tipo) {
    case 'figuras': return <Figuras v={v} t={t} dur={dur} color={color} />;
    case 'tarjetas': return <Tarjetas v={v} t={t} dur={dur} color={color} />;
    case 'barras': return <Barras v={v} t={t} dur={dur} color={color} />;
    case 'interruptores': return <Interruptores v={v} t={t} dur={dur} color={color} />;
    case 'cronologia': return <Cronologia v={v} t={t} dur={dur} color={color} />;
    case 'cadena': return <Cadena v={v} t={t} dur={dur} color={color} />;
    case 'balanza': return <Balanza v={v} t={t} dur={dur} color={color} />;
    case 'hemiciclo': return <Hemiciclo v={v} t={t} dur={dur} color={color} />;
    case 'frase': return <Frase v={v} t={t} dur={dur} color={color} />;
    case 'portada': return <Portada v={v} t={t} dur={dur} color={color} />;
    // La foto va a sangre: la dibuja la escena (FotoSangre), no el escenario.
    case 'foto': return null;
    default: return <VisualESS v={v} t={t} dur={dur} color={color} />;
  }
};
