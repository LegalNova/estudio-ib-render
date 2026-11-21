import { interpolate, random } from 'remotion';
import { POSE_BASE, type Apariencia, type Pose } from './Persona';
import type { Accion, Figura } from './tipos';

// Catálogo de figuras históricas y genéricas, y la animación de cada acción.

const PIEL = '#efc9a8';
const PARDO = '#8a6a45';

export const FIGURAS: Record<Figura, { nombre: string; a: Apariencia }> = {
  hitler: {
    nombre: 'Adolf Hitler',
    a: { piel: PIEL, pelo: { color: '#2a211c', estilo: 'flequillo' }, vello: 'bigotito', torso: { color: PARDO, estilo: 'uniforme' }, brazalete: true, pantalon: '#3a3128' },
  },
  hindenburg: {
    nombre: 'Paul von Hindenburg',
    a: {
      piel: '#efcfb2', pelo: { color: '#e9e9e9', estilo: 'calvo' }, vello: 'mostacho', velloColor: '#f6f6f6', sombrero: 'pickelhaube',
      torso: { color: '#6f7a86', estilo: 'uniforme' }, medallas: true, pantalon: '#4c5560', ancho: 1.15, alto: 1.05,
    },
  },
  papen: {
    nombre: 'Franz von Papen',
    a: { piel: PIEL, pelo: { color: '#9a9a9a', estilo: 'raya' }, sombrero: 'chistera', torso: { color: '#262a33', estilo: 'traje' }, corbata: '#7a2c2c', pantalon: '#262a33' },
  },
  goring: {
    nombre: 'Hermann Göring',
    a: {
      piel: '#f0c6a6', pelo: { color: '#5a4632', estilo: 'peinado' }, sombrero: 'gorra', sombreroColor: '#b9c3cf',
      torso: { color: '#b9c3cf', estilo: 'uniforme' }, medallas: true, pantalon: '#8f99a5', ancho: 1.45,
    },
  },
  goebbels: {
    nombre: 'Joseph Goebbels',
    a: { piel: PIEL, pelo: { color: '#1f1a17', estilo: 'peinado' }, torso: { color: '#3b3f4a', estilo: 'traje' }, corbata: '#1c1c1c', pantalon: '#3b3f4a', ancho: 0.82, alto: 0.95, objeto: 'micro' },
  },
  frick: {
    nombre: 'Wilhelm Frick',
    a: { piel: PIEL, pelo: { color: '#3a3029', estilo: 'raya' }, torso: { color: '#474a52', estilo: 'traje' }, corbata: '#2d3f63', pantalon: '#474a52' },
  },
  rohm: {
    nombre: 'Ernst Röhm',
    a: {
      piel: '#f0bfa0', pelo: { color: '#3b2e25', estilo: 'corto' }, vello: 'bigotito', sombrero: 'kepi', sombreroColor: PARDO,
      torso: { color: PARDO, estilo: 'uniforme' }, brazalete: true, pantalon: '#3a3128', ancho: 1.4,
    },
  },
  himmler: {
    nombre: 'Heinrich Himmler',
    a: { piel: PIEL, pelo: { color: '#2f2a26', estilo: 'corto' }, vello: 'bigotito', gafas: 'redondas', sombrero: 'gorra', sombreroColor: '#1c1c20', torso: { color: '#1f1f24', estilo: 'uniforme' }, pantalon: '#1f1f24' },
  },
  wels: {
    nombre: 'Otto Wels',
    a: { piel: PIEL, pelo: { color: '#9a9a9a', estilo: 'calvo' }, vello: 'bigote', velloColor: '#8a8a8a', gafas: 'redondas', torso: { color: '#3c4250', estilo: 'traje' }, corbata: '#a33a3a', pantalon: '#3c4250' },
  },
  niemoller: {
    nombre: 'Martin Niemöller',
    a: { piel: PIEL, pelo: { color: '#6a6a6a', estilo: 'calvo' }, torso: { color: '#17171c', estilo: 'sotana' }, alzacuellos: true, pantalon: '#17171c', objeto: 'libro' },
  },
  schleicher: {
    nombre: 'Kurt von Schleicher',
    a: { piel: PIEL, pelo: { color: '#7a7a7a', estilo: 'calvo' }, sombrero: 'gorra', sombreroColor: '#6f7a86', torso: { color: '#6f7a86', estilo: 'uniforme' }, pantalon: '#4c5560' },
  },
  strasser: {
    nombre: 'Gregor Strasser',
    a: { piel: PIEL, pelo: { color: '#4a3a2e', estilo: 'calvo' }, torso: { color: '#4a3f35', estilo: 'traje' }, corbata: '#222', pantalon: '#4a3f35', ancho: 1.2 },
  },
  kahr: {
    nombre: 'Gustav von Kahr',
    a: { piel: '#efcfb2', pelo: { color: '#bdbdbd', estilo: 'raya' }, vello: 'bigote', velloColor: '#bdbdbd', torso: { color: '#2f2f33', estilo: 'traje' }, corbata: '#444', pantalon: '#2f2f33', alto: 0.97 },
  },
  schirach: {
    nombre: 'Baldur von Schirach',
    a: { piel: PIEL, pelo: { color: '#d9b45a', estilo: 'peinado' }, torso: { color: PARDO, estilo: 'uniforme' }, panuelo: '#1a1a1a', pantalon: '#3a3128' },
  },
  ley: {
    nombre: 'Robert Ley',
    a: { piel: PIEL, pelo: { color: '#3b2f27', estilo: 'raya' }, torso: { color: '#5a4a3a', estilo: 'traje' }, corbata: '#2a2a2a', pantalon: '#5a4a3a', ancho: 1.1 },
  },
  juez: {
    nombre: 'Juez',
    a: { piel: PIEL, pelo: { color: '#a8a8a8', estilo: 'corto' }, sombrero: 'birrete', torso: { color: '#141418', estilo: 'toga' }, pantalon: '#141418', objeto: 'papel' },
  },
  obispo: {
    nombre: 'Obispo',
    a: { piel: '#efcfb2', pelo: { color: '#bdbdbd', estilo: 'calvo' }, sombrero: 'mitra', torso: { color: '#5b2a6e', estilo: 'sotana' }, pantalon: '#5b2a6e', objeto: 'cruz' },
  },
  pastor: {
    nombre: 'Pastor protestante',
    a: { piel: PIEL, pelo: { color: '#5a4636', estilo: 'raya' }, torso: { color: '#17171c', estilo: 'sotana' }, alzacuellos: true, pantalon: '#17171c', objeto: 'libro' },
  },
  soldado: {
    nombre: 'Soldado',
    a: { piel: PIEL, pelo: { color: '#4a3a2e', estilo: 'corto' }, sombrero: 'casco', torso: { color: '#59624f', estilo: 'uniforme' }, pantalon: '#4a5242', zapatos: '#151515' },
  },
  sa: {
    nombre: 'Miembro de las SA',
    a: { piel: '#f0bfa0', pelo: { color: '#4a3a2e', estilo: 'corto' }, sombrero: 'kepi', sombreroColor: PARDO, torso: { color: PARDO, estilo: 'camisa' }, brazalete: true, pantalon: '#3a3128', zapatos: '#151515', ancho: 1.08 },
  },
  ss: {
    nombre: 'Miembro de las SS',
    a: { piel: PIEL, pelo: { color: '#2a2420', estilo: 'corto' }, sombrero: 'gorra', sombreroColor: '#1a1a1e', torso: { color: '#1f1f24', estilo: 'uniforme' }, pantalon: '#1f1f24', zapatos: '#0e0e10' },
  },
  obrero: {
    nombre: 'Obrero',
    a: { piel: '#e9b994', pelo: { color: '#4a3a2e', estilo: 'corto' }, sombrero: 'gorra-plana', torso: { color: '#c9c2b0', estilo: 'mono' }, falda: '#3b5a8c', pantalon: '#3b5a8c' },
  },
  diputado: {
    nombre: 'Diputado',
    a: { piel: PIEL, pelo: { color: '#5a4a3e', estilo: 'raya' }, torso: { color: '#3a3f4b', estilo: 'traje' }, corbata: '#6b4d1f', pantalon: '#3a3f4b' },
  },
  madre: {
    nombre: 'Madre alemana',
    a: { piel: '#f2c9ab', pelo: { color: '#7a4a2a', estilo: 'mono' }, torso: { color: '#b5655d', estilo: 'vestido' }, falda: '#b5655d', delantal: true, pantalon: '#f2c9ab', zapatos: '#4a2a1a', alto: 0.93 },
  },
  'chico-hj': {
    nombre: 'Chico de la HJ',
    a: { piel: '#f2c9ab', pelo: { color: '#d4b060', estilo: 'corto' }, torso: { color: PARDO, estilo: 'camisa' }, panuelo: '#1a1a1a', pantalon: '#2a2a2a', pantalonCorto: true, alto: 0.82, ancho: 0.9 },
  },
  'chica-bdm': {
    nombre: 'Chica de la BDM',
    a: { piel: '#f2c9ab', pelo: { color: '#c99a4a', estilo: 'trenzas' }, torso: { color: '#f1efe6', estilo: 'vestido' }, falda: '#1f2a44', panuelo: '#1a1a1a', pantalon: '#f2c9ab', zapatos: '#2a2a2a', alto: 0.82, ancho: 0.9 },
  },
  maestro: {
    nombre: 'Maestro',
    a: { piel: PIEL, pelo: { color: '#5a4a3e', estilo: 'raya' }, gafas: 'cuadradas', torso: { color: '#5a5f4a', estilo: 'traje' }, corbata: '#3a2a1a', pantalon: '#4a4f3a', objeto: 'libro' },
  },
  judio: {
    nombre: 'Ciudadano judío',
    a: { piel: PIEL, pelo: { color: '#3a2a20', estilo: 'corto' }, vello: 'barba-corta', sombrero: 'sombrero', sombreroColor: '#2a2a2e', torso: { color: '#3d3a36', estilo: 'traje' }, corbata: '#2a3a5a', pantalon: '#3d3a36' },
  },
  votante: {
    nombre: 'Votante',
    a: { piel: PIEL, pelo: { color: '#5a4636', estilo: 'corto' }, sombrero: 'gorra-plana', sombreroColor: '#5a5048', torso: { color: '#6a5a4a', estilo: 'traje' }, corbata: '#2a2a2a', pantalon: '#4a4038' },
  },
};

export interface Animacion {
  pose: Pose;
  /** Desplazamiento en px (escala 1) y giro en grados alrededor de los pies. */
  dx: number;
  dy: number;
  giro: number;
  /** 0 = color, 1 = gris. */
  gris: number;
  opacidad: number;
  /** Atrezo que dibuja la escena: mesa para firmar, urna, barrotes. */
  atrezo?: 'mesa' | 'urna' | 'barrotes';
}

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Parpadeo cada ~3,5 s, con desfase propio. */
export function parpadeo(f: number, semilla: number): number {
  const periodo = 95 + Math.floor(random(`p${semilla}`) * 40);
  const k = (f + Math.floor(random(`d${semilla}`) * periodo)) % periodo;
  return k < 2 ? 0.6 : k < 4 ? 1 : k < 6 ? 0.5 : 0;
}

/**
 * Pose y movimiento de una figura que hace `accion`.
 * `t` = fotogramas desde que entra la figura; `dur` = fotogramas que le quedan en escena.
 */
export function animar(accion: Accion | undefined, t: number, dur: number, semilla: number, objeto?: Apariencia['objeto']): Animacion {
  const s = Math.sin;
  const fase = semilla * 1.7;
  const base: Animacion = {
    pose: { ...POSE_BASE, respira: (s(t * 0.08 + fase) + 1) / 2, parpadeo: parpadeo(t, semilla), manoB: objeto },
    dx: 0, dy: 0, giro: 0, gris: 0, opacidad: 1,
  };
  const p = base.pose;
  // Todas entran caminando un poco (salvo «entra», que camina más).
  const largoEntrada = accion === 'entra' ? 34 : 16;
  const recorrido = accion === 'entra' ? -420 : -80;
  const andar = interpolate(t, [0, largoEntrada], [1, 0], clamp);
  base.dx = recorrido * andar * andar;
  base.opacidad = interpolate(t, [0, 8], [0, 1], clamp);
  if (andar > 0) {
    p.piernas = s(t * 0.45) * 20 * andar;
    p.brazoA = [8 + s(t * 0.45) * 10 * andar, 6];
    p.brazoB = [8 - s(t * 0.45) * 10 * andar, 6];
    base.dy = -Math.abs(s(t * 0.45)) * 6 * andar;
  }
  const tt = t - largoEntrada;
  if (tt < 0) return base;

  switch (accion) {
    case 'habla':
      p.boca = Math.max(0, s(tt * 0.9 + fase) * 0.5 + s(tt * 0.37) * 0.3 + 0.15);
      p.brazoB = [22 + s(tt * 0.12 + fase) * 14, 40 + s(tt * 0.19) * 22];
      p.cabeza = s(tt * 0.06) * 3;
      break;
    case 'saluda':
      p.brazoB = [70, 70 + s(tt * 0.32) * 22];
      p.boca = 0;
      break;
    case 'firma':
      p.brazoB = [-6, -55 + s(tt * 0.55) * 6];
      p.manoB = 'pluma';
      p.mirada = -0.4;
      p.cabeza = 6;
      base.atrezo = 'mesa';
      break;
    case 'vota': {
      const ciclo = (tt % 60) / 60;
      p.brazoB = [interpolate(ciclo, [0, 0.4, 0.7, 1], [40, 28, 28, 40]), 20];
      p.manoB = ciclo < 0.55 ? 'papeleta' : undefined;
      p.mirada = 0.6;
      base.atrezo = 'urna';
      break;
    }
    case 'marcha':
      p.piernas = s(tt * 0.32) * 18;
      p.brazoA = [6 + s(tt * 0.32) * 9, 10];
      p.brazoB = [6 - s(tt * 0.32) * 9, 10];
      base.dy = -Math.abs(s(tt * 0.32)) * 5;
      break;
    case 'jura':
      p.brazoB = [interpolate(tt, [0, 12], [10, 88], clamp), interpolate(tt, [0, 12], [10, 88], clamp)];
      p.cabeza = -2;
      break;
    case 'cae': {
      const k = interpolate(tt, [Math.max(10, dur * 0.4), Math.max(30, dur * 0.4 + 24)], [0, 1], clamp);
      base.giro = 82 * k * k;
      base.gris = k;
      base.opacidad = 1 - 0.45 * k;
      p.parpadeo = k > 0.5 ? 1 : p.parpadeo;
      p.brazoA = [8 + 40 * k, 20 * k];
      p.brazoB = [8 + 40 * k, 20 * k];
      break;
    }
    case 'huye': {
      const k = interpolate(tt, [Math.max(10, dur * 0.45), Math.max(40, dur * 0.45 + 40)], [0, 1], clamp);
      base.dx = 520 * k * k;
      base.opacidad = 1 - k;
      if (k > 0 && k < 1) {
        p.piernas = s(tt * 0.6) * 24;
        p.brazoA = [10 + s(tt * 0.6) * 14, 30];
        p.brazoB = [10 - s(tt * 0.6) * 14, 30];
      }
      p.mirada = 1;
      break;
    }
    case 'aplaude': {
      const golpe = s(tt * 0.9) * 10;
      p.brazoA = [-22, -64 + golpe];
      p.brazoB = [-22, -64 + golpe];
      p.boca = 0.3;
      break;
    }
    case 'protesta':
      p.brazoB = [150 + s(tt * 0.35) * 12, 8];
      p.manoB = 'puno';
      p.boca = 0.4 + s(tt * 0.35) * 0.3;
      p.cabeza = -3;
      break;
    case 'senala':
      p.brazoB = [92, 4];
      p.manoB = undefined;
      p.mirada = 1;
      break;
    case 'piensa':
      p.brazoB = [-30, -150];
      p.manoB = undefined;
      p.mirada = -0.3;
      p.cabeza = 7 + s(tt * 0.05) * 2;
      break;
    case 'detenido':
      p.brazoA = [-4, -10];
      p.brazoB = [-4, -10];
      p.manoB = undefined;
      p.cabeza = -5;
      base.atrezo = 'barrotes';
      break;
    case 'reza':
      p.brazoA = [-34, -62];
      p.brazoB = [-34, -62];
      p.manoB = undefined;
      p.parpadeo = 1;
      p.cabeza = 5;
      break;
    case 'entra':
    case undefined:
      p.brazoB = [10 + s(tt * 0.05 + fase) * 4, 8];
      break;
  }
  return base;
}
