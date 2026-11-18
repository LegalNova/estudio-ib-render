import { useEffect, useLayoutEffect, useState } from 'react';
import { continueRender, delayRender, useCurrentFrame } from 'remotion';

// Maquetas que se adaptan a su contenido midiendo el DOM ya pintado: un
// enunciado con fórmulas, una escansión sin espacios o un rótulo largo no se
// pueden estimar contando letras. Cada maqueta tiene «niveles» de
// compactación (0 = tamaño normal) y se queda con el primero en el que cabe.
//
// Se mide con offsetHeight/offsetWidth, que no cambian con la escala del
// lienzo de Remotion ni con los translate/scale de las animaciones. El render
// espera (delayRender) a que las fuentes estén cargadas y la maqueta decidida,
// así que ningún fotograma sale con la medida provisional.

/**
 * ¿Está el elemento pintado y con su ancho de verdad? Un Sequence premontado
 * (solo en Studio) va con display: none, y en el primer commit el lienzo aún
 * puede medir 0 de ancho (el texto saldría partido letra a letra).
 */
export const pintado = (el: HTMLElement | null): el is HTMLElement => el !== null && el.offsetParent !== null && el.offsetHeight > 0 && el.offsetWidth > 0;

/**
 * Niveles de compactación de una maqueta con una o varias dimensiones.
 * `cabe(i)` dice si la dimensión `i` cabe con los niveles actuales
 * (`undefined` si todavía no se puede medir). Se sube el nivel de la primera
 * dimensión que no cabe; las siguientes no se tocan hasta que las anteriores
 * están resueltas. `firma` resume el contenido: si cambia, se vuelve a empezar.
 */
export function useNiveles(maximos: number[], cabe: (i: number) => boolean | undefined, firma: string): number[] {
  // Re-render en cada fotograma mientras no esté decidido (en Studio, un premontado se mide al hacerse visible).
  useCurrentFrame();
  const [espera] = useState(() => delayRender(`Ajustando la maqueta (${firma.slice(0, 40)})`, { timeoutInMilliseconds: 60000 }));
  const [fuentes, setFuentes] = useState(() => typeof document === 'undefined' || document.fonts?.status === 'loaded');
  const [estado, setEstado] = useState(() => ({ firma, niveles: maximos.map(() => 0), listo: false }));
  // Si todavía no se puede medir, se reintenta en el siguiente cuadro del navegador.
  const [, setReintento] = useState(0);

  useEffect(() => {
    if (fuentes || typeof document === 'undefined' || !document.fonts) return;
    let vivo = true;
    document.fonts.ready.then(() => vivo && setFuentes(true));
    return () => {
      vivo = false;
    };
  }, [fuentes]);

  useEffect(() => () => continueRender(espera), [espera]);

  // Sin dependencias a propósito: se vuelve a medir tras cada render hasta decidir.
  useLayoutEffect(() => {
    if (estado.firma !== firma) {
      setEstado({ firma, niveles: maximos.map(() => 0), listo: false });
      return;
    }
    if (estado.listo || !fuentes) return;
    for (let i = 0; i < maximos.length; i++) {
      const ok = cabe(i);
      if (ok === undefined) {
        const id = requestAnimationFrame(() => setReintento((r) => r + 1));
        return () => cancelAnimationFrame(id);
      }
      if (!ok && estado.niveles[i]! < maximos[i]!) {
        const niveles = estado.niveles.slice();
        niveles[i]!++;
        setEstado({ firma, niveles, listo: false });
        return;
      }
    }
    setEstado({ ...estado, listo: true });
    continueRender(espera);
  });

  return estado.firma === firma ? estado.niveles : maximos.map(() => 0);
}
