import { Audio } from '@remotion/media';
import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, random, Sequence, staticFile, useCurrentFrame, type CalculateMetadataFunction } from 'remotion';
import { alfa, COLOR_VOZ, entra, FPS, HILO_COLOR, HILO_ROTULO, NOMBRE_VOZ, SANS, T } from './estilo';
import { Narradores, turnoActivo } from './Narradores';
import { EscenaDinamica, FondoDinamico, ProgresoDinamico, SubtitulosDinamicos } from './Dinamico';
import { IdiomaCtx, trocear } from './estilo';
import { FotoSangre } from './VisualesESS';
import { VisualVista } from './Visuales';
import type { EscenaMedida, PropsTela, TurnoMedido } from './tipos';

// «La tela» con personajes: 1920×1080, 30 fps. Escenas en el tiempo del audio,
// narradores animados siempre en pantalla y subtítulos del turno que suena.

export const calcularTela: CalculateMetadataFunction<PropsTela> = ({ props }) => ({
  durationInFrames: Math.max(1, Math.ceil(props.duracion * FPS)),
  defaultOutName: `tela-${props.capitulo.id}`,
});

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const dos = (n: number) => String(n).padStart(2, '0');

// ─── Fondo ───────────────────────────────────────────────────────────────

const Estrellas: React.FC = () => {
  const frame = useCurrentFrame();
  const puntos = useMemo(
    () => Array.from({ length: 90 }, (_, i) => ({ x: random(`x${i}`) * 1920, y: random(`y${i}`) * 1080, r: 0.6 + random(`r${i}`) * 1.4, f: random(`f${i}`) * 6 })),
    [],
  );
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
      {puntos.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#fff" opacity={0.1 + 0.12 * (1 + Math.sin(frame * 0.03 + p.f)) / 2} />
      ))}
    </svg>
  );
};

const Fondo: React.FC<{ escenas: EscenaMedida[]; actual: number; s: number }> = ({ escenas, actual, s }) => {
  const e = escenas[actual];
  const previa = escenas[actual - 1];
  const k = e ? interpolate(s, [e.inicio, e.inicio + 0.7], [0, 1], clamp) : 1;
  const glow = (c: string, o: number) => (
    <div
      style={{
        position: 'absolute', inset: 0, opacity: o,
        background: `radial-gradient(ellipse 70% 60% at 30% 45%, ${alfa(c, 0.16)}, transparent 70%), radial-gradient(ellipse 50% 50% at 85% 85%, ${alfa(c, 0.08)}, transparent 70%)`,
      }}
    />
  );
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, #0d1428 0%, ${T.fondo} 55%, #070a14 100%)` }}>
      <Estrellas />
      {previa ? glow(HILO_COLOR[previa.hilo], 1 - k) : null}
      {e ? glow(HILO_COLOR[e.hilo], k) : null}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45))' }} />
    </AbsoluteFill>
  );
};

// ─── Escena ──────────────────────────────────────────────────────────────

const etiquetaPregunta = (r: string): string => {
  const m = /^([EC])(\d+)$/i.exec(r.trim());
  if (!m) return r;
  return `${m[1].toUpperCase() === 'E' ? 'Ensayo' : 'Corta'} ${m[2]}`;
};

const EscenaVista: React.FC<{ e: EscenaMedida; numero: number; dur: number }> = ({ e, numero, dur }) => {
  const t = useCurrentFrame();
  const color = HILO_COLOR[e.hilo];
  const salida = interpolate(t, [Math.max(1, dur - 10), dur], [1, 0], clamp);
  const k = entra(t, 0, 14);
  const opacidad = Math.min(k, salida);
  const tamTitulo = Math.min(58, Math.floor(1300 / Math.max(10, e.titulo.length * 0.53)));
  const foto = e.visual.tipo === 'foto' ? e.visual : null;
  return (
    <AbsoluteFill style={{ opacity: opacidad }}>
      {foto ? <FotoSangre v={foto} t={t} dur={dur} color={color} semilla={numero} /> : null}
      <div style={{ position: 'absolute', left: 70, top: 46, width: 1300, transform: `translateY(${(1 - k) * 12}px)` }}>
        <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: 2.5, color }}>
          {dos(numero)} · {HILO_ROTULO[e.hilo]}
        </div>
        <div style={{ fontSize: tamTitulo, fontWeight: 800, color: T.texto, marginTop: 6, lineHeight: 1.08, whiteSpace: 'nowrap' }}>{e.titulo}</div>
        <div style={{ width: 72 * k, height: 5, background: color, borderRadius: 3, marginTop: 12 }} />
        {e.fecha ? <div style={{ fontSize: 30, fontWeight: 800, color, marginTop: 10, opacity: entra(t, 6) }}>{e.fecha}</div> : null}
      </div>
      {e.responde?.length ? (
        <div style={{ position: 'absolute', right: 70, top: 96, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end', width: 520 }}>
          <div style={{ width: '100%', textAlign: 'right', fontSize: 18, letterSpacing: 2, color: T.muyTenue, fontWeight: 700, marginBottom: 2 }}>TE SIRVE PARA</div>
          {e.responde.map((r, i) => {
            const b = entra(t, 8 + i * 4, 10);
            const ensayo = /^E/i.test(r);
            return (
              <div
                key={r}
                style={{
                  fontSize: 22, fontWeight: 800, padding: '6px 14px', borderRadius: 20, transform: `scale(${0.7 + 0.3 * b})`, opacity: b,
                  color: ensayo ? '#0b0f1c' : T.texto, background: ensayo ? color : 'transparent', border: `2px solid ${color}`,
                }}
              >
                {etiquetaPregunta(r)}
              </div>
            );
          })}
        </div>
      ) : null}
      <VisualVista v={e.visual} t={t} dur={dur} color={color} />
    </AbsoluteFill>
  );
};

// ─── Subtítulos ──────────────────────────────────────────────────────────

const Subtitulos: React.FC<{ turnos: TurnoMedido[]; nombres: { H: string; E: string } }> = ({ turnos, nombres }) => {
  const frame = useCurrentFrame();
  const s = frame / FPS;
  const { turno } = turnoActivo(turnos, s);
  if (!turno) return null;
  const trozos = trocear(turno.t);
  const total = trozos.reduce((a, b) => a + b.length, 0);
  const avance = Math.max(0, Math.min(0.999, (s - turno.inicio) / Math.max(0.1, turno.fin - turno.inicio))) * total;
  let acum = 0;
  let k = 0;
  for (; k < trozos.length - 1; k++) {
    if (avance < acum + trozos[k].length) break;
    acum += trozos[k].length;
  }
  const color = COLOR_VOZ[turno.q];
  const aparece = interpolate(s, [turno.inicio, turno.inicio + 0.15], [0, 1], clamp);
  return (
    <div
      style={{
        position: 'absolute', left: 70, top: 842, width: 1230, minHeight: 120, boxSizing: 'border-box', padding: '16px 26px 18px',
        background: 'rgba(8,11,22,0.82)', borderRadius: 18, border: `1px solid ${alfa(color, 0.35)}`, borderLeft: `6px solid ${color}`,
        opacity: 0.6 + 0.4 * aparece,
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: 1.5, marginBottom: 4 }}>{nombres[turno.q].toUpperCase()}</div>
      <div style={{ fontSize: 36, fontWeight: 600, color: T.texto, lineHeight: 1.28 }}>{trozos[k]}</div>
    </div>
  );
};

// ─── Progreso y cabecera fija ────────────────────────────────────────────

const Progreso: React.FC<{ p: PropsTela; s: number; actual: number }> = ({ p, s, actual }) => {
  const x0 = 70;
  const ancho = 1230;
  const y = 1046;
  const color = HILO_COLOR[p.escenas[actual]?.hilo ?? 'inicio'];
  const fr = Math.min(1, s / Math.max(1, p.duracion));
  return (
    <>
      <div style={{ position: 'absolute', left: x0, top: y, width: ancho, height: 4, background: T.borde, borderRadius: 2 }} />
      <div style={{ position: 'absolute', left: x0, top: y, width: ancho * fr, height: 4, background: color, borderRadius: 2 }} />
      {p.escenas.map((e, i) => {
        const x = x0 + (e.inicio / Math.max(1, p.duracion)) * ancho;
        const hecho = i <= actual;
        const tam = i === actual ? 14 : 9;
        return <div key={e.id} style={{ position: 'absolute', left: x - tam / 2, top: y + 2 - tam / 2, width: tam, height: tam, borderRadius: tam, background: hecho ? HILO_COLOR[e.hilo] : '#3a4152' }} />;
      })}
    </>
  );
};

const Capitulo: React.FC<{ p: PropsTela }> = ({ p }) => (
  <div style={{ position: 'absolute', right: 70, top: 46, maxWidth: 560, textAlign: 'right', fontSize: 19, fontWeight: 700, letterSpacing: 1.2, color: T.muyTenue, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
    PARTE {p.capitulo.numero} DE {p.capitulo.total}
  </div>
);

// ─── Composición ─────────────────────────────────────────────────────────

export const TelaVideo: React.FC<PropsTela> = (p) => {
  const frame = useCurrentFrame();
  const s = frame / FPS;
  const dinamico = p.estilo === 'dinamico';
  const nombres = p.nombres ?? (dinamico ? { H: 'Sonia', E: 'Ryan' } : NOMBRE_VOZ);
  const turnos = useMemo(() => p.escenas.flatMap((e) => e.turnos).sort((a, b) => a.inicio - b.inicio), [p.escenas]);
  let actual = p.escenas.findIndex((e) => s >= e.inicio && s < e.fin);
  if (actual < 0) actual = s < (p.escenas[0]?.inicio ?? 0) ? 0 : p.escenas.length - 1;
  const escenas = p.escenas.map((e, i) => {
    const desde = Math.round(e.inicio * FPS);
    const dur = Math.max(1, Math.round(e.fin * FPS) - desde);
    return (
      <Sequence key={e.id} from={desde} durationInFrames={dur} premountFor={30} name={e.titulo}>
        {dinamico ? <EscenaDinamica e={e} numero={i + 1} dur={dur} /> : <EscenaVista e={e} numero={i + 1} dur={dur} />}
      </Sequence>
    );
  });
  return (
    <IdiomaCtx.Provider value={dinamico ? 'en' : 'es'}>
      <AbsoluteFill style={{ fontFamily: SANS, background: T.fondo }}>
        {dinamico ? (
          <>
            <FondoDinamico escenas={p.escenas} actual={actual} s={s} />
            {escenas}
            <SubtitulosDinamicos turnos={turnos} nombres={nombres} />
            <ProgresoDinamico p={p} s={s} actual={actual} />
          </>
        ) : (
          <>
            <Fondo escenas={p.escenas} actual={actual} s={s} />
            {escenas}
            <Capitulo p={p} />
            <Narradores p={p} turnos={turnos} />
            <Subtitulos turnos={turnos} nombres={nombres} />
            <Progreso p={p} s={s} actual={actual} />
          </>
        )}
        {p.audio ? <Audio src={staticFile(p.audio)} /> : null}
      </AbsoluteFill>
    </IdiomaCtx.Provider>
  );
};
