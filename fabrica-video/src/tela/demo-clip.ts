import type { PropsClip } from './Clip';

// Demo para el Studio (sin audio).
export const DEMO_CLIP: PropsClip = {
  id: 'demo-clip',
  audio: '',
  duracion: 12,
  desfase: 0,
  durEscena: 12,
  materia: 'ESS',
  nombres: { H: 'Sonia', E: 'Ryan' },
  escena: {
    id: 'demo',
    hilo: 'sistemas',
    unidad: '1.2 Feedback',
    titulo: 'Negative feedback keeps a system stable',
    claves: ['Negative', 'Stabilising'],
    visual: { tipo: 'frase', texto: 'Negative feedback counteracts change.' } as PropsClip['escena']['visual'],
    inicio: 0,
    fin: 12,
    turnos: [
      { q: 'H', t: 'So what does negative feedback actually do to a system?', inicio: 0.5, fin: 4 },
      { q: 'E', t: 'It counteracts the change, so the system returns towards its equilibrium.', inicio: 4.4, fin: 11 },
    ],
  },
};
