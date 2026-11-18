import { CalculateMetadataFunction, Composition } from 'remotion';
import { ClaseVideo, duracionTotal } from './ClaseVideo';
import { DEMO } from './demo';
import type { PropsVideo } from './tipos';

// ClaseVideo: vertical 1080×1920 a 30 fps. La duración sale de las escenas
// (que a su vez salen de la duración real de cada audio).
const calcular: CalculateMetadataFunction<PropsVideo> = ({ props }) => ({
  durationInFrames: Math.max(1, duracionTotal(props)),
  defaultOutName: 'clase',
});

export const RemotionRoot: React.FC = () => (
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
);
