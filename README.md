# estudio-ib-render

Render en paralelo, con GitHub Actions, de los vídeos de clase de Estudio IB
(Remotion, vertical 540×960, 30 fps).

Este repositorio se genera solo: es una única confirmación que se reescribe
con `push --force` en cada envío. Lleva el proyecto Remotion
(`fabrica-video/`) y, por unidad, `public/trabajo/<unidad>/` con `props.json`,
las imágenes (Wikimedia Commons, con su crédito en el vídeo) y la voz en MP3.

El workflow `render` recibe una lista de unidades y renderiza cada una en su
propio job; el MP4 queda como artifact `video-<unidad>` durante 7 días.
Remotion es gratis para uso individual.
