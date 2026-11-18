import { loadFont as cargarInter } from '@remotion/google-fonts/Inter';
import { loadFont as cargarPlayfair } from '@remotion/google-fonts/PlayfairDisplay';
import { loadFont as cargarMono } from '@remotion/google-fonts/IBMPlexMono';

// Tipografías y colores del vídeo: papel envejecido, tinta y ámbar.

export const { fontFamily: SANS } = cargarInter('normal', { weights: ['400', '600', '800'], subsets: ['latin', 'latin-ext'] });
export const { fontFamily: SERIF } = cargarPlayfair('normal', { weights: ['600', '800'], subsets: ['latin', 'latin-ext'] });
export const { fontFamily: SERIF_IT } = cargarPlayfair('italic', { weights: ['600'], subsets: ['latin', 'latin-ext'] });
export const { fontFamily: MONO } = cargarMono('normal', { weights: ['500'], subsets: ['latin', 'latin-ext'] });

export const C = {
  fondo: '#14110d',
  papel: '#efe6d2',
  tinta: '#f6efe0',
  tenue: 'rgba(246,239,224,0.66)',
  ambar: '#e3a53b',
  ambarSuave: 'rgba(227,165,59,0.18)',
  rojo: '#d35b43',
  /** Acierto (puntos de control, markscheme). */
  verde: '#8fcf8a',
  /** Papel de examen (gancho). */
  examen: '#f3ecdc',
  barra: '#8c7b62',
  sombra: 'rgba(0,0,0,0.55)',
};

export const ANCHO = 1080;
export const ALTO = 1920;
/** Márgenes de la zona segura del móvil. */
export const SEGURO = { lado: 80, arriba: 110, abajo: 230 };

/** Filtro de «material de época»: sepia leve. */
export const FILTRO_EPOCA = 'sepia(0.32) saturate(0.8) contrast(1.06) brightness(0.96)';
export const FILTRO_CARTEL = 'sepia(0.12) saturate(0.92) contrast(1.03)';
