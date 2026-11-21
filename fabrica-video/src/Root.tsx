import { CalculateMetadataFunction, Composition } from 'remotion';
import { ClaseVideo, duracionTotal } from './ClaseVideo';
import { DEMO } from './demo';
import type { PropsVideo } from './tipos';
import { DEMO_TELA } from './tela/demo';
import { calcularTela, TelaVideo } from './tela/TelaVideo';
import { calcularClip, ClipTela } from './tela/Clip';
import { DEMO_CLIP } from './tela/demo-clip';

// ClaseVideo: vertical 1080×1920 a 30 fps. La duración sale de las escenas
// (que a su vez salen de la duración real de cada audio).
const calcular: CalculateMetadataFunction<PropsVideo> = ({ props }) => ({
  durationInFrames: Math.max(1, duracionTotal(props)),
  defaultOutName: 'clase',
});

// TelaVideo: horizontal 1920×1080 a 30 fps, repaso de examen con personajes
// (src/tela/). La duración sale de props.duracion.
export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ClaseVideo"
      component={ClaseVideo}
      durationInFrames={300}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={DEMO}
      calculateMetadata={calcular}
    />
    <Composition
      id="TelaVideo"
      component={TelaVideo}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={DEMO_TELA}
      calculateMetadata={calcularTela}
    />
    {/* ClipTela: vertical 1080×2340 (19,5:9), ~30 s, para Clips IB. */}
    <Composition
      id="ClipTela"
      component={ClipTela}
      durationInFrames={300}
      fps={30}
      width={1080}
      height={2340}
      defaultProps={DEMO_CLIP}
      calculateMetadata={calcularClip}
    />
  </>
);
