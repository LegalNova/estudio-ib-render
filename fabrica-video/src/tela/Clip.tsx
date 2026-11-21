import { Audio } from '@remotion/media';
import React, { useMemo } from 'react';
import { AbsoluteFill, Easing, interpolate, random, staticFile, useCurrentFrame, type CalculateMetadataFunction } from 'remotion';
import { alfa, COLOR_VOZ, EscenarioCtx, FPS, HILO_COLOR, IdiomaCtx, muelle, SANS, T } from './estilo';
import { VisualVista } from './Visuales';
import { FotoSangre } from './VisualesESS';
import type { EscenaMedida, TurnoMedido } from './tipos';

// Clip vertical (1080×1920, 30 fps) de ~30 s para el feed de la app: una
// escena de «la tela» (o un trozo de ella) con su visual, el título arriba y
// subtítulos grandes palabra a palabra. Zonas libres para la interfaz de la
// app: el 18 % de abajo y una columna a la derecha (botones).

export type PropsClip = {
  id: string;
  /** Ruta relativa a public/ (staticFile) del audio YA recortado. */
  audio: string;
  duracion: number;
  /** Tiempos de los turnos en segundos desde el inicio del clip. */
  escena: EscenaMedida;
  /** Segundo de la escena original en que empieza el clip (el visual sigue desde ahí). */
  desfase: number;
  /** Duración total de la escena original (para el ritmo del visual). */
  durEscena: number;
  parte?: { n: number; de: number };
  materia: string;
  nombres: { H: string; E: string };
};

export const calcularClip: CalculateMetadataFunction<PropsClip> = ({ props }) => ({
  durationInFrames: Math.max(1, Math.ceil(props.duracion * FPS)),
  defaultOutName: props.id,
});

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const W = 1080;
const H = 1920;
/** Escenario del visual: se dibuja en 800×600 y se amplía ×1,17 (≈ 936×702) para que el texto se lea en el móvil. */
const ESCENARIO_CLIP = { x: 0, y: 0, w: 800, h: 600 };
const ZOOM_VISUAL = 1.17;

// ─── Fondo ───────────────────────────────────────────────────────────────

const Fondo: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const puntos = useMemo(
    () => Array.from({ length: 60 }, (_, i) => ({ x: random(`cx${i}`) * W, y: random(`cy${i}`) * H, r: 1 + random(`cr${i}`) * 2.2, v: 0.2 + random(`cv${i}`) * 0.5, f: random(`cf${i}`) * 6 })),
    [],
  );
  const ax = 30 + Math.sin(frame * 0.006) * 14;
  const ay = 34 + Math.cos(frame * 0.005) * 8;
  const bx = 75 + Math.cos(frame * 0.0045) * 12;
  const by = 72 + Math.sin(frame * 0.0055) * 8;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(170deg, #0c1427 0%, ${T.fondo} 48%, #05080f 100%)` }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 38% at ${ax}% ${ay}%, ${alfa(color, 0.2)}, transparent 70%), radial-gradient(ellipse 60% 34% at ${bx}% ${by}%, ${alfa(color, 0.12)}, transparent 70%)`,
        }}
      />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {puntos.map((p, i) => {
          const y = (((p.y - frame * p.v) % H) + H) % H;
          const x = p.x + Math.sin(frame * 0.012 + p.f) * 12;
          return <circle key={i} cx={x} cy={y} r={p.r} fill={i % 3 === 0 ? color : '#ffffff'} opacity={0.07 + 0.09 * (1 + Math.sin(frame * 0.04 + p.f)) / 2} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ─── Cabecera: unidad, título y palabras clave ───────────────────────────

const Cabecera: React.FC<{ p: PropsClip; color: string; sobreFoto: boolean }> = ({ p, color, sobreFoto }) => {
  const t = useCurrentFrame();
  const e = p.escena;
  const k = muelle(t, 2);
  const tam = e.titulo.length > 40 ? 62 : e.titulo.length > 26 ? 72 : 84;
  // Una sola fila de chips (si no, pisan el visual): se quedan los que caben.
  const claves: string[] = [];
  let ancho = 0;
  for (const c of e.claves ?? []) {
    const w = c.length * 19 + 58;
    if (ancho + w > 930) break;
    claves.push(c);
    ancho += w + 14;
  }
  const sombra = sobreFoto ? '0 3px 18px rgba(0,0,0,0.75)' : undefined;
  return (
    <div style={{ position: 'absolute', left: 64, right: 64, top: 230 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: Math.min(1, k), transform: `translateY(${(1 - Math.min(1, k)) * 14}px)` }}>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 4, color, textShadow: sombra }}>{p.materia.toUpperCase()}</div>
        {e.unidad ? (
          <div style={{ fontSize: 26, fontWeight: 700, color: T.texto, border: `2px solid ${alfa(color, 0.7)}`, background: alfa(color, 0.16), padding: '4px 16px', borderRadius: 20 }}>{e.unidad}</div>
        ) : null}
        {p.parte && p.parte.de > 1 ? <div style={{ fontSize: 26, fontWeight: 700, color: T.muyTenue }}>{p.parte.n}/{p.parte.de}</div> : null}
      </div>
      <div
        style={{
          marginTop: 22, fontSize: tam, fontWeight: 800, lineHeight: 1.06, letterSpacing: -1, color: T.texto, textShadow: sombra,
          opacity: interpolate(t, [3, 14], [0, 1], clamp), transform: `translateY(${interpolate(t, [3, 18], [26, 0], { ...clamp, easing: Easing.out(Easing.cubic) })}px)`,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}
      >
        {e.titulo}
      </div>
      <div style={{ width: 120 * Math.min(1, muelle(t, 10)), height: 7, background: color, borderRadius: 4, marginTop: 22 }} />
      {claves.length ? (
        <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 14, marginTop: 26, maxWidth: 952, overflow: 'hidden' }}>
          {claves.map((c, i) => {
            const desde = 18 + i * Math.max(10, Math.round((p.duracion * FPS * 0.5) / Math.max(1, claves.length)));
            const m = muelle(t, desde, FPS, 12);
            if (t < desde) return null;
            return (
              <div
                key={`${i}${c}`}
                style={{
                  fontSize: 32, fontWeight: 800, color: '#07101c', background: color, padding: '8px 22px', borderRadius: 40,
                  transform: `scale(${0.5 + 0.5 * Math.min(1.1, m)})`, opacity: Math.min(1, m * 1.4), boxShadow: `0 0 ${24 * Math.max(0, 1 - m)}px ${alfa(color, 0.6)}`,
                }}
              >
                {c}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

// ─── Subtítulos palabra a palabra ────────────────────────────────────────

interface Trozo { palabras: string[]; inicio: number; fin: number; q: 'H' | 'E'; tiempos: number[] }

/** Parte cada turno en grupos de 3–6 palabras; el tiempo se reparte por letras. */
function trozos(turnos: TurnoMedido[]): Trozo[] {
  const out: Trozo[] = [];
  for (const tu of turnos) {
    const pal = tu.t.split(/\s+/).filter(Boolean);
    const pesos = pal.map((w) => w.length + 2);
    const total = pesos.reduce((a, b) => a + b, 0);
    const dur = Math.max(0.2, tu.fin - tu.inicio);
    let acc = 0;
    const tiempos = pesos.map((p) => {
      const t0 = tu.inicio + (acc / total) * dur;
      acc += p;
      return t0;
    });
    let grupo: number[] = [];
    const cerrar = (finIdx: number) => {
      if (!grupo.length) return;
      const ini = tiempos[grupo[0]];
      const fin = finIdx + 1 < pal.length ? tiempos[finIdx + 1] : tu.fin;
      out.push({ palabras: grupo.map((g) => pal[g]), inicio: ini, fin, q: tu.q, tiempos: grupo.map((g) => tiempos[g]) });
      grupo = [];
    };
    pal.forEach((w, i) => {
      grupo.push(i);
      const letras = grupo.reduce((a, g) => a + pal[g].length + 1, 0);
      const corte = /[.,!?;:…]$/.test(w) && grupo.length >= 2;
      if (grupo.length >= 6 || letras > 30 || corte) cerrar(i);
    });
    cerrar(pal.length - 1);
  }
  return out;
}

const Subtitulos: React.FC<{ turnos: TurnoMedido[]; nombres: { H: string; E: string } }> = ({ turnos, nombres }) => {
  const frame = useCurrentFrame();
  const s = frame / FPS;
  const lista = useMemo(() => trozos(turnos), [turnos]);
  let actual: Trozo | undefined = lista.find((x) => s >= x.inicio && s < x.fin);
  if (!actual) {
    const previo = [...lista].reverse().find((x) => x.fin <= s);
    if (previo && s - previo.fin < 0.5) actual = previo;
  }
  if (!actual) return null;
  const color = COLOR_VOZ[actual.q];
  const k = interpolate(s, [actual.inicio, actual.inicio + 0.12], [0, 1], clamp);
  return (
    <div style={{ position: 'absolute', left: 64, right: 150, top: 1350 }}>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 3, color, marginBottom: 12 }}>{nombres[actual.q].toUpperCase()}</div>
      <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.14, color: T.texto, textShadow: '0 4px 22px rgba(0,0,0,0.65)', transform: `translateY(${(1 - k) * 10}px)`, opacity: 0.4 + 0.6 * k }}>
        {actual.palabras.map((w, i) => {
          const dicha = s >= actual!.tiempos[i];
          return (
            <span key={i} style={{ color: dicha ? T.texto : 'rgba(243,245,250,0.42)' }}>
              {w}
              {i < actual!.palabras.length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ─── Composición ─────────────────────────────────────────────────────────

export const ClipTela: React.FC<PropsClip> = (p) => {
  const frame = useCurrentFrame();
  const e = p.escena;
  const color = HILO_COLOR[e.hilo] ?? T.texto;
  const foto = e.visual.tipo === 'foto' ? e.visual : null;
  // El visual sigue el ritmo de la escena original desde donde empieza el clip.
  const tVisual = frame + Math.round(p.desfase * FPS);
  const durVisual = Math.max(1, Math.round(p.durEscena * FPS));
  const entrada = interpolate(frame, [0, 10], [0, 1], clamp);
  return (
    <IdiomaCtx.Provider value="en">
      <AbsoluteFill style={{ fontFamily: SANS, background: T.fondo, opacity: entrada }}>
        <Fondo color={color} />
        {foto ? (
          <FotoSangre v={foto} t={tVisual} dur={durVisual} color={color} semilla={p.id.length} />
        ) : (
          <EscenarioCtx.Provider value={ESCENARIO_CLIP}>
            <div
              style={{
                position: 'absolute', left: 56, top: 640, width: ESCENARIO_CLIP.w, height: ESCENARIO_CLIP.h, transformOrigin: '0 0',
                transform: `scale(${ZOOM_VISUAL * (1 + 0.025 * interpolate(frame, [0, p.duracion * FPS], [0, 1], clamp))})`,
              }}
            >
              <VisualVista v={e.visual} t={tVisual} dur={durVisual} color={color} />
            </div>
          </EscenarioCtx.Provider>
        )}
        {/* Velo inferior para que los subtítulos y la interfaz de la app se lean. */}
        <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(5,8,16,0.55) 0%, transparent 22%, transparent 62%, rgba(5,8,16,0.85) 80%, rgba(5,8,16,0.95) 100%)' }} />
        <Cabecera p={p} color={color} sobreFoto={!!foto} />
        <Subtitulos turnos={e.turnos} nombres={p.nombres} />
        {p.audio ? <Audio src={staticFile(p.audio)} /> : null}
      </AbsoluteFill>
    </IdiomaCtx.Provider>
  );
};
