// Props que recibe la composición ClaseVideo. Las prepara
// scripts/fabrica/video.ts a partir del storyboard: todo resuelto (audio
// grabado y medido, subtítulos alineados, imágenes descargadas).

import type { Diagrama } from '../../src/estudio/esquema';

export type { Diagrama };

export interface Palabra {
  texto: string;
  /** Milisegundos desde que empieza la voz de la escena. */
  desdeMs: number;
  hastaMs: number;
}

export interface ImagenLista {
  /** Ruta dentro de public/ (staticFile). */
  src: string;
  /** Versión desenfocada y oscurecida (fondo de 1080×1920), hecha con ffmpeg. */
  fondo: string;
  ancho: number;
  alto: number;
  credito: string;
  pie?: string;
}

export type VisualListo =
  | { tipo: 'archivo'; imagen: ImagenLista; clase: 'foto' | 'cartel' | 'documento' | 'mapa'; etiqueta?: string }
  | { tipo: 'ia'; imagen: ImagenLista }
  | {
      tipo: 'diagrama';
      diagrama: Diagrama;
      /** Milisegundos (desde el inicio de la voz) en que aparece cada elemento. */
      tiempos: number[];
      mostrarDesde: number;
      mostrarHasta?: number;
      textosValor?: string[];
      flecha?: [number, number];
      fondo?: ImagenLista;
    }
  | { tipo: 'mapa'; imagen: ImagenLista; marcas: Array<{ x: number; y: number; texto?: string }> }
  | { tipo: 'titulo'; texto: string; subtitulo?: string; fondo?: ImagenLista }
  | { tipo: 'cita'; texto: string; origen: string; fondo?: ImagenLista }
  | { tipo: 'cronologia'; hitos: Array<{ fecha: string; texto: string }>; tiempos: number[]; mostrarDesde: number }
  | { tipo: 'pictograma'; titulo: string; valor: number; unidad: string; desdeMs: number; fondo?: ImagenLista }
  | { tipo: 'creditos'; lineas: Array<{ titulo: string; texto: string }> }
  // ─── Clase de examen (storyboard v2). Todos los tiempos, en fotogramas desde el inicio de la escena. ───
  | {
      tipo: 'gancho';
      pregunta: string;
      marks: number;
      commandTerm: string;
      definicion: string;
      /** «Para contestarla aprenderás…» */
      aprenderas: string[];
      aparece: number[];
      fondo?: ImagenLista;
    }
  | {
      tipo: 'pausa';
      pregunta: PreguntaVideo;
      /** Punto de control n de total. */
      numero: number;
      total: number;
      titulo?: string;
      cuenta: Cuenta;
      fondo?: ImagenLista;
    }
  | {
      tipo: 'respuesta';
      pregunta: string;
      marks: number;
      commandTerm: string;
      floja: string;
      /** Trozos de `floja` que se tachan. */
      tachar: string[];
      porque: string;
      /** Puntos del markscheme, en orden. */
      puntos: string[];
      /** Frase clave del command term («Razón + prueba + “por eso…”»). */
      clave: string;
      t: { floja: number; tachar: number; porque: number; puntos: number[]; clave: number };
    }
  | { tipo: 'dibujar'; diagrama: Diagrama; aparece: number[] }
  | { tipo: 'error'; mal: string; bien: string; t: { tachar: number; bien: number } }
  | { tipo: 'recuerda'; items: Array<{ pregunta: PreguntaVideo; desde: number; cuenta: Cuenta }> }
  | { tipo: 'resumen'; ideas: string[]; aparece: number[]; cta: string; ctaDesde: number };

/** Cuenta atrás de un punto de control: empieza en `desde`, dura `frames` y luego se ve la respuesta. */
export interface Cuenta {
  desde: number;
  frames: number;
}

/** Pregunta de la unidad lista para enseñarla en el vídeo (y su respuesta). */
export type PreguntaVideo = {
  q: string;
  /** Texto extra que sale con la respuesta. */
  nota?: string;
  idioma: Idioma;
} & (
  | { t: 'test'; opciones: string[]; correcta: number }
  | { t: 'vf'; correcta: boolean }
  | { t: 'num'; respuesta: string }
  | { t: 'huecos'; texto: string; huecos: string[] }
  | { t: 'ordenar'; pasos: string[]; /** Orden en que se enseñan antes de la respuesta (índices de `pasos`). */ barajados: number[] }
  | { t: 'emparejar'; pares: Array<[string, string]>; barajados: number[] }
);

/** Un trozo de voz de la escena (las de examen tienen varios: pregunta, cuenta atrás, respuesta). */
export interface Tramo {
  audio: string;
  palabras: Palabra[];
  vozMs: number;
  /** Fotograma de la escena en que empieza. */
  desde: number;
}

export type Movimiento = 'auto' | 'zoom-lento' | 'zoom-out' | 'paneo-izq' | 'paneo-der' | 'paneo-arriba' | 'paneo-abajo' | 'parallax';

export interface EscenaLista {
  id: string;
  /** Duración total de la escena en fotogramas (incluye la entrada). */
  frames: number;
  /** Fotogramas desde el inicio de la escena hasta que empieza la voz. */
  vozDesde: number;
  /** Audio de la voz (public/), o null si la escena no habla (créditos). */
  audio: string | null;
  vozMs: number;
  palabras: Palabra[];
  visual: VisualListo;
  rotulo?: string;
  personaje?: { nombre: string; cargo?: string };
  movimiento: Movimiento;
  foco?: [number, number];
  transicion: 'fundido' | 'deslizar' | 'barrido';
  /** Duración de la transición de entrada (0 en la primera). */
  entrada: number;
  /** Varios trozos de voz (escenas de examen). Si está, sustituye a `audio`/`palabras`/`vozDesde`. */
  tramos?: Tramo[];
}

export type Idioma = 'es' | 'ca' | 'en';

export type PropsVideo = {
  titulo: string;
  /** Idioma del vídeo: rótulos fijos de los diagramas y formato de los números. Si falta, 'es'. */
  idioma?: Idioma;
  escenas: EscenaLista[];
  /** Música de fondo (public/) o null. */
  musica: string | null;
  /** Intervalos [desde, hasta) en fotogramas absolutos en los que habla la voz (para el ducking). */
  voz: Array<[number, number]>;
  /** Textura de grano: fotogramas en public/ que se alternan. */
  grano: string[];
};
