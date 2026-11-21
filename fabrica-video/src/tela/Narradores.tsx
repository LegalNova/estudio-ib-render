import React from 'react';
import { interpolate, random, useCurrentFrame } from 'remotion';
import { parpadeo } from './figuras';
import { Persona, POSE_BASE, type Apariencia, type Pose } from './Persona';
import { alfa, COLOR_VOZ, NOMBRE_VOZ, SANS } from './estilo';
import type { PropsTela, TurnoMedido } from './tipos';

// Lucía (H, alumna) y Álvaro (E, profe): siempre en pantalla, abajo a la
// derecha. Mueven la boca con la envolvente de su voz, gesticulan cuando
// hablan y miran al otro cuando escuchan.

export const LUCIA: Apariencia = {
  piel: '#f2c7a5',
  pelo: { color: '#6b3e26', estilo: 'coleta' },
  torso: { color: '#e85d75', estilo: 'sudadera' },
  pantalon: '#2e3b55',
  zapatos: '#f2f2f2',
  alto: 0.95,
};

export const ALVARO: Apariencia = {
  piel: '#e8b48f',
  pelo: { color: '#2d2420', estilo: 'corto' },
  vello: 'barba-corta',
  velloColor: '#2d2420',
  gafas: 'cuadradas',
  torso: { color: '#4d7cc7', estilo: 'camisa' },
  pantalon: '#3a3a40',
  zapatos: '#5a3a22',
  alto: 1.03,
};

/** Turno que suena en el segundo `s` (o el último si estamos en un hueco corto). */
export function turnoActivo(turnos: TurnoMedido[], s: number): { turno: TurnoMedido | null; indice: number } {
  for (let i = 0; i < turnos.length; i++) {
    const t = turnos[i];
    if (s >= t.inicio && s < t.fin) return { turno: t, indice: i };
    if (s < t.inicio) {
      const previo = turnos[i - 1];
      if (previo && s - previo.fin < 0.45) return { turno: previo, indice: i - 1 };
      return { turno: null, indice: i - 1 };
    }
  }
  return { turno: null, indice: turnos.length - 1 };
}

function boca(p: PropsTela, q: 'H' | 'E', frame: number, hablando: boolean): number {
  const env = p.boca?.[q];
  if (env && env.length) {
    const v = env[Math.min(env.length - 1, frame)] ?? 0;
    return Math.min(1, v * 1.25);
  }
  if (!hablando) return 0;
  return Math.max(0, Math.sin(frame * 0.95) * 0.45 + Math.sin(frame * 0.41 + 1) * 0.3 + 0.2);
}

/** Gestos al hablar: cambian de un turno a otro para que no se repitan. */
function gesto(frame: number, indice: number, lado: 'H' | 'E'): Pick<Pose, 'brazoA' | 'brazoB' | 'cabeza'> {
  const s = Math.sin;
  const tipo = Math.floor(random(`g${indice}${lado}`) * 4);
  const f = frame;
  switch (tipo) {
    case 0:
      return { brazoA: [10, 8], brazoB: [22 + s(f * 0.13) * 10, 48 + s(f * 0.21) * 18], cabeza: s(f * 0.07) * 3 };
    case 1:
      return { brazoA: [18 + s(f * 0.12) * 8, 40 + s(f * 0.17) * 14], brazoB: [18 + s(f * 0.12 + 1) * 8, 40 + s(f * 0.19 + 1) * 14], cabeza: s(f * 0.05) * 2 };
    case 2:
      // Lucía señala hacia el escenario (a su izquierda); Álvaro, mano abierta delante.
      return lado === 'H'
        ? { brazoA: [80 + s(f * 0.1) * 6, 8], brazoB: [10, 8], cabeza: -3 }
        : { brazoA: [10, 8], brazoB: [-8 + s(f * 0.14) * 6, -96 + s(f * 0.2) * 14], cabeza: s(f * 0.07) * 3 };
    default:
      return { brazoA: [12, 10], brazoB: [-18 + s(f * 0.15) * 8, -70 + s(f * 0.23) * 18], cabeza: s(f * 0.08) * 3 };
  }
}

export const Narradores: React.FC<{ p: PropsTela; turnos: TurnoMedido[] }> = ({ p, turnos }) => {
  const frame = useCurrentFrame();
  const s = frame / 30;
  const { turno, indice } = turnoActivo(turnos, s);
  const habla = turno?.q ?? null;

  const pose = (q: 'H' | 'E', semilla: number): Pose => {
    const hablando = habla === q;
    const otroHabla = habla && habla !== q;
    const g = hablando ? gesto(frame, indice, q) : { brazoA: [8, 6] as [number, number], brazoB: [8, 6] as [number, number], cabeza: otroHabla ? Math.sin(frame * 0.05 + semilla) * 2 : 0 };
    // Lucía está a la izquierda: mira a la derecha para mirar a Álvaro.
    const haciaOtro = q === 'H' ? 0.9 : -0.9;
    return {
      ...POSE_BASE,
      ...g,
      boca: boca(p, q, frame, hablando),
      mirada: otroHabla ? haciaOtro : hablando ? (q === 'H' ? -0.35 : -0.5) : haciaOtro * 0.3,
      parpadeo: parpadeo(frame, semilla),
      respira: (Math.sin(frame * 0.08 + semilla) + 1) / 2,
    };
  };

  const ficha = (q: 'H' | 'E', a: Apariencia, x: number, semilla: number) => {
    const activo = habla === q;
    const brillo = interpolate(activo ? 1 : 0, [0, 1], [0, 1]);
    return (
      <div style={{ position: 'absolute', left: x, top: 498, width: 270, height: 560 }}>
        <div
          style={{
            position: 'absolute', left: 25, bottom: 26, width: 220, height: 40, borderRadius: '50%',
            background: `radial-gradient(ellipse, ${alfa(COLOR_VOZ[q], activo ? 0.45 : 0.12)}, transparent 70%)`,
          }}
        />
        <div style={{ position: 'absolute', left: 0, bottom: 34, transform: activo ? 'translateY(-2px)' : undefined }}>
          <Persona a={a} p={pose(q, semilla)} escala={1.04} />
        </div>
        <div
          style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, margin: '0 auto', width: 130, textAlign: 'center',
            fontFamily: SANS, fontSize: 22, fontWeight: 800, letterSpacing: 0.5, padding: '4px 0', borderRadius: 14,
            color: activo ? '#0b0f1c' : COLOR_VOZ[q], background: activo ? COLOR_VOZ[q] : alfa(COLOR_VOZ[q], 0.12),
            border: `1px solid ${alfa(COLOR_VOZ[q], 0.6)}`, opacity: 0.75 + 0.25 * brillo,
          }}
        >
          {NOMBRE_VOZ[q]}
        </div>
      </div>
    );
  };

  return (
    <>
      {ficha('H', LUCIA, 1318, 3)}
      {ficha('E', ALVARO, 1582, 7)}
    </>
  );
};
