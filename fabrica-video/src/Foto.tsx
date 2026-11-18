import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ALTO, ANCHO, C, FILTRO_CARTEL, FILTRO_EPOCA } from './estilo';
import type { ImagenLista, Movimiento } from './tipos';

// Imagen con movimiento constante (efecto Ken Burns), en dos modos:
// · «a sangre»: si la imagen tiene resolución para llenar el vertical.
// · «enmarcada»: si es pequeña (las del Bundesarchiv tienen 800 px) o es un
//   cartel o mapa que hay que ver entero: la foto nítida en un marco con su
//   propio zoom, y detrás la misma imagen desenfocada moviéndose al revés
//   (parallax de 2 capas).

const MOVS: Movimiento[] = ['zoom-lento', 'paneo-der', 'zoom-out', 'paneo-izq'];

interface Props {
  imagen: ImagenLista;
  movimiento: Movimiento;
  foco?: [number, number];
  /** Índice de la escena: varía el movimiento «auto». */
  indice: number;
  clase?: 'foto' | 'cartel' | 'documento' | 'mapa' | 'ia';
  /** Centro vertical del marco (en modo enmarcado). */
  centroY?: number;
  /** Duración de la escena en fotogramas. */
  frames: number;
}

const suave = Easing.bezier(0.37, 0, 0.63, 1);

export const Foto: React.FC<Props> = ({ imagen, movimiento, foco, indice, clase = 'foto', centroY = 800, frames: durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mov = movimiento === 'auto' ? MOVS[indice % MOVS.length]! : movimiento;
  const t = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: suave });
  // Como mucho un 1,5 % de zoom por segundo (la guía pide < 2 %).
  const zoomMax = Math.min(0.14, (1.5 / 100) * (durationInFrames / fps));
  // El tono sepia «de época» solo en Historia (trabajo/hi-…): en ESS, Mates,
  // English o Business las fotos son actuales y se ven con su color.
  const historia = /(^|\/)trabajo\/hi-/.test(imagen.src);
  const filtro =
    clase === 'cartel' || clase === 'mapa' ? FILTRO_CARTEL : clase === 'ia' ? 'saturate(0.85) contrast(1.04)' : historia ? FILTRO_EPOCA : 'contrast(1.03)';
  const escalaCubrir = Math.max(ANCHO / imagen.ancho, ALTO / imagen.alto);
  const aSangre = clase !== 'cartel' && clase !== 'mapa' && clase !== 'documento' && escalaCubrir <= 1.45;
  const [fx, fy] = foco ?? [0.5, 0.42];

  if (aSangre) {
    const w = imagen.ancho * escalaCubrir;
    const h = imagen.alto * escalaCubrir;
    const sobraX = w - ANCHO;
    const sobraY = h - ALTO;
    let escala = 1 + zoomMax * t;
    let x = -sobraX * fx;
    let y = -sobraY * fy;
    if (mov === 'zoom-out') escala = 1 + zoomMax * (1 - t);
    if (mov === 'paneo-der' || mov === 'paneo-izq') {
      const ida = mov === 'paneo-der' ? t : 1 - t;
      x = -sobraX * interpolate(ida, [0, 1], [Math.max(0, fx - 0.35), Math.min(1, fx + 0.35)]);
      escala = 1.04 + 0.03 * t;
    }
    if (mov === 'paneo-arriba' || mov === 'paneo-abajo') {
      const ida = mov === 'paneo-abajo' ? t : 1 - t;
      y = -sobraY * ida;
      escala = 1.04 + 0.03 * t;
    }
    return (
      <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: C.fondo }}>
        <Img
          src={staticFile(imagen.src)}
          style={{
            position: 'absolute',
            width: w,
            height: h,
            left: x,
            top: y,
            scale: String(escala),
            transformOrigin: `${fx * 100}% ${fy * 100}%`,
            filter: filtro,
          }}
        />
      </AbsoluteFill>
    );
  }

  // Enmarcada: caja máxima de 960×1180 (carteles y mapas, más alta).
  const cajaW = 960;
  const cajaH = clase === 'cartel' || clase === 'documento' ? 1240 : clase === 'mapa' ? 1180 : 1080;
  const e = Math.min(cajaW / imagen.ancho, cajaH / imagen.alto);
  const w = Math.round(imagen.ancho * e);
  const h = Math.round(imagen.alto * e);
  const zoomIn = mov === 'zoom-out' ? 1 + zoomMax * (1 - t) : 1 + zoomMax * t;
  const deriva = mov === 'paneo-izq' ? -1 : 1;
  const desplX = mov.startsWith('paneo') ? deriva * 18 * (t - 0.5) : 0;
  const entra = interpolate(frame, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: C.fondo }}>
      {/* Capa 1: fondo desenfocado que se mueve al revés */}
      <Img
        src={staticFile(imagen.fondo)}
        style={{
          position: 'absolute',
          inset: 0,
          width: ANCHO,
          height: ALTO,
          scale: String(1.12 + 0.06 * t),
          translate: `${-deriva * 30 * (t - 0.5)}px ${-20 * (t - 0.5)}px`,
        }}
      />
      {/* Capa 2: la imagen nítida, con su propio zoom dentro del marco */}
      <div
        style={{
          position: 'absolute',
          left: (ANCHO - w) / 2,
          top: centroY - h / 2,
          width: w,
          height: h,
          overflow: 'hidden',
          borderRadius: 6,
          boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 2px rgba(246,239,224,0.08)',
          translate: `${desplX}px ${12 * (0.5 - t) + (1 - entra) * 40}px`,
          opacity: entra,
        }}
      >
        <Img
          src={staticFile(imagen.src)}
          style={{
            width: w,
            height: h,
            scale: String(zoomIn),
            transformOrigin: `${fx * 100}% ${fy * 100}%`,
            filter: filtro,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
