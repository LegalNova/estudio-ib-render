import React, { useMemo } from 'react';
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from 'remotion';
import { alfa, COLOR_VOZ, ESCENARIO_DINAMICO, EscenarioCtx, FPS, HILO_COLOR, HILO_ROTULO_EN, muelle, T, trocear } from './estilo';
import { turnoActivo } from './Narradores';
import { VisualVista } from './Visuales';
import { FotoSangre } from './VisualesESS';
import type { EscenaMedida, PropsTela, TurnoMedido } from './tipos';

// Estilo «dinamico» (ESS, en inglés): sin narradores, escenario a todo lo
// ancho, cámara que se acerca despacio, cortinillas entre escenas, palabras
// clave cinéticas, fondo con deriva de color y partículas.

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const dos = (n: number) => String(n).padStart(2, '0');

// ─── Fondo ───────────────────────────────────────────────────────────────

export const FondoDinamico: React.FC<{ escenas: EscenaMedida[]; actual: number; s: number }> = ({ escenas, actual, s }) => {
  const frame = useCurrentFrame();
  const e = escenas[actual];
  const previa = escenas[actual - 1];
  const k = e ? interpolate(s, [e.inicio, e.inicio + 0.9], [0, 1], clamp) : 1;
  const particulas = useMemo(
    () => Array.from({ length: 70 }, (_, i) => ({ x: random(`px${i}`) * 1920, y: random(`py${i}`) * 1080, r: 1 + random(`pr${i}`) * 2.4, v: 0.25 + random(`pv${i}`) * 0.6, f: random(`pf${i}`) * 6 })),
    [],
  );
  const manchas = (c: string, o: number) => {
    const ax = 30 + Math.sin(frame * 0.004) * 12;
    const ay = 40 + Math.cos(frame * 0.003) * 10;
    const bx = 78 + Math.cos(frame * 0.0035) * 10;
    const by = 75 + Math.sin(frame * 0.0045) * 8;
    return (
      <div
        style={{
          position: 'absolute', inset: 0, opacity: o,
          background: `radial-gradient(ellipse 55% 50% at ${ax}% ${ay}%, ${alfa(c, 0.2)}, transparent 70%), radial-gradient(ellipse 45% 45% at ${bx}% ${by}%, ${alfa(c, 0.12)}, transparent 70%)`,
        }}
      />
    );
  };
  const c = e ? HILO_COLOR[e.hilo] : T.texto;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(155deg, #0c1427 0%, ${T.fondo} 50%, #060912 100%)` }}>
      {previa ? manchas(HILO_COLOR[previa.hilo], 1 - k) : null}
      {e ? manchas(c, k) : null}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {particulas.map((p, i) => {
          const y = (((p.y - frame * p.v) % 1080) + 1080) % 1080;
          const x = p.x + Math.sin(frame * 0.01 + p.f) * 14;
          return <circle key={i} cx={x} cy={y} r={p.r} fill={i % 3 === 0 ? c : '#ffffff'} opacity={0.08 + 0.1 * (1 + Math.sin(frame * 0.04 + p.f)) / 2} />;
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5))' }} />
    </AbsoluteFill>
  );
};

// ─── Palabras clave cinéticas ────────────────────────────────────────────

const CHIP_FUENTE = 24;
const POP_FUENTE = 62;
const anchoTexto = (txt: string, f: number) => txt.length * f * 0.62;

/** Fila de chips bajo el título (empieza en x0, centrada en y); el «pop» sale en la zona media derecha del escenario. */
const Claves: React.FC<{ claves: string[]; t: number; dur: number; color: string; x0: number; y: number }> = ({ claves, t, dur, color, x0, y }) => {
  const n = claves.length;
  const gap = 14;
  const total0 = claves.reduce((a, c) => a + anchoTexto(c, CHIP_FUENTE) + 34, 0) + gap * (n - 1);
  // Si no caben a lo ancho, se encogen.
  const red = Math.min(1, (1840 - x0) / Math.max(1, total0));
  const chipF = CHIP_FUENTE * red;
  const anchos = claves.map((c) => anchoTexto(c, chipF) + 34 * red);
  let x = x0;
  const slots = anchos.map((a) => {
    const s = { x: x + a / 2, w: a };
    x += a + gap;
    return s;
  });
  const paso = (dur * 0.8 - 12) / Math.max(1, n);
  return (
    <>
      {claves.map((c, i) => {
        const ti = 12 + i * paso;
        if (t < ti) return null;
        const pop = muelle(t, ti, FPS, 11);
        const quieto = Math.min(34, paso * 0.6);
        const m = interpolate(t, [ti + quieto, ti + quieto + 14], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
        const popF = Math.min(POP_FUENTE, 640 / Math.max(1, c.length * 0.56));
        const f = popF + (chipF - popF) * m;
        const cx = 1380 + (slots[i].x - 1380) * m;
        const cy = 470 + (y - 470) * m;
        return (
          <div
            key={`${i}${c}`}
            style={{
              position: 'absolute', left: cx, top: cy, transform: `translate(-50%, -50%) scale(${0.4 + 0.6 * Math.min(1.15, pop)})`,
              whiteSpace: 'nowrap', fontSize: f, fontWeight: 800, letterSpacing: m < 1 ? 0.5 : 0.3,
              color: m > 0.6 ? '#07101c' : T.texto,
              background: m > 0.6 ? color : alfa(color, 0.14 * (1 - m)),
              padding: `${(6 + 8 * (1 - m)) * (m > 0.5 ? red : 1)}px ${(16 + 14 * (1 - m)) * (m > 0.5 ? red : 1)}px`, borderRadius: 40,
              border: `2px solid ${alfa(color, 0.4 + 0.6 * m)}`,
              boxShadow: m < 1 ? `0 0 ${40 * (1 - m)}px ${alfa(color, 0.45)}` : undefined,
              textShadow: m < 0.6 ? `0 0 24px ${alfa(color, 0.7)}` : undefined,
            }}
          >
            {c}
          </div>
        );
      })}
    </>
  );
};

// ─── Escena ──────────────────────────────────────────────────────────────

export const EscenaDinamica: React.FC<{ e: EscenaMedida; numero: number; dur: number }> = ({ e, numero, dur }) => {
  const t = useCurrentFrame();
  const color = HILO_COLOR[e.hilo];
  const entrada = interpolate(t, [0, 16], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const salida = interpolate(t, [Math.max(1, dur - 9), dur], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const p = interpolate(t, [0, dur], [0, 1], clamp);
  const dir = numero % 2 ? 1 : -1;
  const cab = muelle(t, 4);
  const conClaves = (e.claves?.length ?? 0) > 0;
  const maxTitulo = 1700;
  const filaX = 80 + (e.fecha ? anchoTexto(e.fecha, 28) * 0.92 + 28 : 0);
  const tamTitulo = Math.min(58, Math.floor(maxTitulo / Math.max(10, e.titulo.length * 0.53)));
  const foto = e.visual.tipo === 'foto' ? e.visual : null;
  return (
    <AbsoluteFill
      style={{
        clipPath: entrada < 1 ? `inset(0 ${(1 - entrada) * 100}% 0 0)` : undefined,
        opacity: 1 - salida,
        transform: salida > 0 ? `translateX(${-80 * salida}px)` : undefined,
      }}
    >
      {foto ? <FotoSangre v={foto} t={t} dur={dur} color={color} semilla={numero} /> : null}
      {!foto ? (
        <AbsoluteFill style={{ transform: `scale(${1 + 0.045 * p}) translateX(${dir * (0.5 - p) * 26}px)`, transformOrigin: '50% 52%' }}>
          <EscenarioCtx.Provider value={ESCENARIO_DINAMICO}>
            <VisualVista v={e.visual} t={t} dur={dur} color={color} />
          </EscenarioCtx.Provider>
        </AbsoluteFill>
      ) : null}
      <div style={{ position: 'absolute', left: 80, top: 44, width: maxTitulo, opacity: Math.min(1, cab), transform: `translateY(${(1 - Math.min(1, cab)) * 18}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: 2.5, color }}>
            {dos(numero)} · {HILO_ROTULO_EN[e.hilo]}
          </div>
          {e.unidad ? (
            <div style={{ fontSize: 18, fontWeight: 800, color: T.texto, border: `1.5px solid ${alfa(color, 0.7)}`, background: alfa(color, 0.14), padding: '3px 12px', borderRadius: 14, letterSpacing: 0.5 }}>
              {e.unidad}
            </div>
          ) : null}
        </div>
        <div style={{ fontSize: tamTitulo, fontWeight: 800, color: T.texto, marginTop: 8, lineHeight: 1.08, whiteSpace: 'nowrap', textShadow: foto ? '0 2px 12px rgba(0,0,0,0.6)' : undefined }}>{e.titulo}</div>
        <div style={{ width: 80 * Math.min(1, cab), height: 5, background: color, borderRadius: 3, marginTop: 12 }} />
        {e.fecha ? <div style={{ fontSize: 28, fontWeight: 800, color, marginTop: 10 }}>{e.fecha}</div> : null}
      </div>
      {conClaves ? <Claves claves={e.claves ?? []} t={t} dur={dur} color={color} x0={filaX} y={194} /> : null}
      {entrada < 1 ? <div style={{ position: 'absolute', top: 0, bottom: 0, left: entrada * 1920 - 6, width: 6, background: color, boxShadow: `0 0 30px ${color}`, opacity: 1 - entrada }} /> : null}
    </AbsoluteFill>
  );
};

// ─── Subtítulos, progreso y parte ────────────────────────────────────────

export const SubtitulosDinamicos: React.FC<{ turnos: TurnoMedido[]; nombres: { H: string; E: string } }> = ({ turnos, nombres }) => {
  const frame = useCurrentFrame();
  const s = frame / FPS;
  const { turno } = turnoActivo(turnos, s);
  if (!turno) return null;
  const trozos = trocear(turno.t, 110);
  const total = trozos.reduce((a, b) => a + b.length, 0);
  const avance = Math.max(0, Math.min(0.999, (s - turno.inicio) / Math.max(0.1, turno.fin - turno.inicio))) * total;
  let acum = 0;
  let k = 0;
  for (; k < trozos.length - 1; k++) {
    if (avance < acum + trozos[k].length) break;
    acum += trozos[k].length;
  }
  const color = COLOR_VOZ[turno.q];
  const aparece = interpolate(s, [turno.inicio, turno.inicio + 0.18], [0, 1], clamp);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 870, display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          maxWidth: 1500, minWidth: 600, boxSizing: 'border-box', padding: '14px 34px 18px', textAlign: 'center',
          background: 'rgba(6,9,18,0.8)', borderRadius: 20, borderTop: `4px solid ${color}`, boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
          opacity: 0.55 + 0.45 * aparece, transform: `translateY(${(1 - aparece) * 8}px)`,
        }}
      >
        <div style={{ display: 'inline-block', fontSize: 18, fontWeight: 800, letterSpacing: 2, color: '#07101c', background: color, padding: '2px 12px', borderRadius: 10, marginBottom: 8 }}>
          {nombres[turno.q].toUpperCase()}
        </div>
        <div style={{ fontSize: 37, fontWeight: 600, color: T.texto, lineHeight: 1.28 }}>{trozos[k]}</div>
      </div>
    </div>
  );
};

export const ProgresoDinamico: React.FC<{ p: PropsTela; s: number; actual: number }> = ({ p, s, actual }) => {
  const x0 = 80;
  const ancho = 1760;
  const y = 1050;
  const color = HILO_COLOR[p.escenas[actual]?.hilo ?? 'inicio'];
  const fr = Math.min(1, s / Math.max(1, p.duracion));
  return (
    <>
      <div style={{ position: 'absolute', left: x0, top: y, width: ancho, height: 4, background: T.borde, borderRadius: 2 }} />
      <div style={{ position: 'absolute', left: x0, top: y, width: ancho * fr, height: 4, background: color, borderRadius: 2, boxShadow: `0 0 10px ${alfa(color, 0.7)}` }} />
      {p.escenas.map((e, i) => {
        const x = x0 + (e.inicio / Math.max(1, p.duracion)) * ancho;
        const tam = i === actual ? 14 : 8;
        return <div key={e.id} style={{ position: 'absolute', left: x - tam / 2, top: y + 2 - tam / 2, width: tam, height: tam, borderRadius: tam, background: i <= actual ? HILO_COLOR[e.hilo] : '#3a4152' }} />;
      })}
      <div style={{ position: 'absolute', right: 80, top: 44, fontSize: 19, fontWeight: 800, letterSpacing: 1.5, color: T.muyTenue }}>
        PART {p.capitulo.numero} OF {p.capitulo.total}
      </div>
    </>
  );
};
