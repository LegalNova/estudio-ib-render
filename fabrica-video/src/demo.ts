import type { PropsVideo } from './tipos';

// Props mínimas para abrir Studio sin haber generado nada (npm run dev).
export const DEMO: PropsVideo = {
  titulo: 'Demo',
  musica: null,
  voz: [],
  grano: [],
  escenas: [
    {
      id: 'titulo',
      frames: 120,
      vozDesde: 0,
      audio: null,
      vozMs: 0,
      palabras: [],
      visual: { tipo: 'titulo', texto: '¿Votos o pacto?', subtitulo: 'Alemania, 1929–1933' },
      movimiento: 'auto',
      transicion: 'fundido',
      entrada: 0,
    },
    {
      id: 'barras',
      frames: 180,
      vozDesde: 15,
      audio: null,
      vozMs: 5000,
      palabras: [],
      visual: {
        tipo: 'diagrama',
        diagrama: { tipo: 'barras', titulo: 'Escaños nazis', etiquetas: ['1928', '1930', 'jul. 1932', 'nov. 1932'], series: [{ nombre: 'NSDAP', valores: [12, 107, 230, 196] }] },
        tiempos: [0, 800, 1600, 2400],
        mostrarDesde: 0,
        flecha: [2, 3],
      },
      movimiento: 'auto',
      transicion: 'fundido',
      entrada: 15,
    },
  ],
};
