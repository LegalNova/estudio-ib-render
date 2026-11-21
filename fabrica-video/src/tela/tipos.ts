// «La tela» con personajes: vídeo horizontal 1920×1080 de repaso para el
// examen de Historia (consolidación 1933–34 y sociedad nazi). Lo narran dos
// personajes animados (Lucía = H, Álvaro = E) y en cada escena aparecen
// figuras históricas en dibujo que se mueven.
//
// El guion vive en guiones/video/hi-tela.json (formato GuionTela). El script
// scripts/fabrica/tela.ts graba la voz, mide cada turno y escribe
// public/trabajo/hi-tela-<capitulo>/props.json (formato PropsTela).

export type Hilo =
  | 'inicio' | 'leyes' | 'terror' | 'elites' | 'adoctrinamiento' | 'sociedad' | 'resumen'
  // ESS (vídeo en inglés, estilo «dinamico»).
  | 'sistemas' | 'sostenibilidad' | 'ecologia' | 'energia' | 'carbono' | 'perspectivas';

/** «personajes» (Historia: narradores dibujados) o «dinamico» (ESS: sin narradores, en inglés, cámara y tipografía en movimiento). */
export type EstiloTela = 'personajes' | 'dinamico';

/** Figuras históricas dibujadas (cada una con su rasgo: bigote, uniforme, sotana…). */
export type Figura =
  | 'hitler' | 'hindenburg' | 'papen' | 'goring' | 'goebbels' | 'frick' | 'rohm' | 'himmler'
  | 'wels' | 'niemoller' | 'schleicher' | 'strasser' | 'kahr' | 'schirach' | 'ley'
  | 'juez' | 'obispo' | 'pastor' | 'soldado' | 'sa' | 'ss' | 'obrero' | 'diputado'
  | 'madre' | 'chico-hj' | 'chica-bdm' | 'maestro' | 'judio' | 'votante';

/** Qué hace la figura en la escena (animación en bucle o de entrada). */
export type Accion =
  | 'entra' | 'habla' | 'saluda' | 'firma' | 'vota' | 'marcha' | 'jura' | 'cae' | 'huye'
  | 'aplaude' | 'protesta' | 'senala' | 'piensa' | 'detenido' | 'reza';

export interface FiguraEnEscena {
  id: Figura;
  /** Rótulo bajo la figura (por defecto, el nombre de la figura). */
  nombre?: string;
  /** Línea corta bajo el nombre: «Presidente», «Jefe de las SA»… */
  rol?: string;
  accion?: Accion;
  /** Bocadillo opcional (frase breve, citada o resumida). */
  dice?: string;
  /** Marca roja/gris: la figura queda eliminada en esta escena. */
  eliminado?: boolean;
}

export type Visual =
  | { tipo: 'figuras'; figuras: FiguraEnEscena[]; lema?: string }
  | { tipo: 'tarjetas'; tarjetas: Array<{ titulo: string; detalle: string; fecha?: string; color?: Hilo }> }
  | { tipo: 'barras'; titulo: string; unidad?: string; datos: Array<{ etiqueta: string; valor: number; color?: string }> }
  | { tipo: 'interruptores'; titulo: string; nota?: string; items: string[] }
  | { tipo: 'cronologia'; puntos: Array<{ fecha: string; texto: string; hilo?: Hilo }> }
  | { tipo: 'cadena'; titulo: string; nota?: string; pasos: Array<{ titulo: string; detalle: string }> }
  | { tipo: 'balanza'; titulo: string; izquierda: { titulo: string; puntos: string[] }; derecha: { titulo: string; puntos: string[] }; veredicto?: string; /** Hacia qué lado se inclina (por defecto, izquierda). */ gana?: 'izquierda' | 'derecha' }
  | { tipo: 'hemiciclo'; titulo: string; total: number; grupos: Array<{ etiqueta: string; escanos: number; color: string }>; nota?: string }
  | { tipo: 'frase'; texto: string; autor?: string }
  | { tipo: 'portada'; titulo: string; subtitulo?: string }
  // ─── Tipos para ESS (sirven en los dos estilos) ───
  /** Foto a sangre con zoom lento (Ken Burns). url https (mejor una miniatura de ≤ 2000 px). */
  | { tipo: 'foto'; url: string; pie?: string; credito?: string }
  /** Diagrama de sistema: almacenes dentro del límite, entradas a la izquierda, salidas a la derecha. */
  | { tipo: 'sistema'; titulo: string; entradas: string[]; salidas: string[]; almacenes: string[]; nota?: string }
  /** Bucle de retroalimentación: pasos en círculo, positivo = amplifica (rojo), negativo = estabiliza (verde). */
  | { tipo: 'bucle'; titulo: string; signo: 'positivo' | 'negativo'; pasos: string[]; nota?: string }
  /** Curva que se dibuja de x = 0 a x = 1. Las marcas son líneas verticales en x (0–1). */
  | { tipo: 'curva'; titulo: string; ejeX: string; ejeY: string; curva: Curva; marcas?: Array<{ x: number; texto: string }> }
  /** Pirámide de niveles tróficos: niveles[0] es la base (productores). */
  | { tipo: 'piramide'; titulo: string; niveles: Array<{ etiqueta: string; valor?: string }>; invertida?: boolean }
  /** Red de almacenes (x, y de 0 a 1 dentro del escenario) con flujos curvos y partículas. */
  | { tipo: 'ciclo'; titulo: string; almacenes: Array<{ id: string; etiqueta: string; valor?: string; x: number; y: number }>; flujos: Array<{ de: string; a: string; etiqueta: string }> }
  /** Tabla: las filas aparecen una a una; los números se cuentan. */
  | { tipo: 'tabla'; titulo: string; columnas: string[]; filas: string[][] };

export type Curva = 'S' | 'J' | 'equilibrio-estable' | 'equilibrio-inestable' | 'estado-estacionario' | 'punto-inflexion';

export interface TurnoTela {
  /** H = Lucía (alumna curiosa), E = Álvaro (profe). */
  q: 'H' | 'E';
  t: string;
  tono?: string;
}

export interface EscenaTela {
  id: string;
  hilo: Hilo;
  /** «30 de enero de 1933», «1933–1936»… */
  fecha?: string;
  titulo: string;
  visual: Visual;
  /** Preguntas del documento que esta escena ayuda a responder: «E1» = ensayo 1, «C4» = corta 4. */
  responde?: string[];
  /** Términos clave: aparecen grandes arriba y se quedan como fila de chips (repartidos por la escena). */
  claves?: string[];
  /** Unidad del temario, como chip junto al rótulo: «1.2 Feedback». */
  unidad?: string;
  turnos: TurnoTela[];
}

export interface CapituloTela {
  id: string;          // 'c1' … 'c5'
  titulo: string;      // «1. Enero–marzo de 1933: el poder por la puerta legal»
  escenas: EscenaTela[];
}

export interface GuionTela {
  titulo: string;
  estilo?: EstiloTela;
  capitulos: CapituloTela[];
}

// ─── Props del render (los escribe scripts/fabrica/tela.ts) ──────────────

export interface TurnoMedido {
  q: 'H' | 'E';
  t: string;
  /** Segundos desde el inicio del capítulo. */
  inicio: number;
  fin: number;
}

export interface EscenaMedida extends Omit<EscenaTela, 'turnos'> {
  inicio: number;
  fin: number;
  turnos: TurnoMedido[];
}

// «type» y no «interface»: Remotion exige props compatibles con Record<string, unknown>.
export type PropsTela = {
  capitulo: { id: string; titulo: string; numero: number; total: number };
  /** Ruta relativa a public/ (staticFile) del WAV o MP3 del capítulo. */
  audio: string;
  duracion: number;    // segundos
  escenas: EscenaMedida[];
  /** Envolvente de volumen por voz, 30 valores por segundo (0–1), para mover la boca. */
  boca?: { H: number[]; E: number[] };
  /** Por defecto «personajes». En «dinamico» no hay narradores y los rótulos van en inglés. */
  estilo?: EstiloTela;
  /** Nombres en los subtítulos (por defecto Lucía/Álvaro, o SONIA/RYAN en «dinamico»). */
  nombres?: { H: string; E: string };
};
