import React from 'react';
import { useEscenario } from './estilo';

/** Contenedor del escenario de la escena (su tamaño cambia con el estilo). */
export const Caja: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => {
  const e = useEscenario();
  return <div style={{ position: 'absolute', left: e.x, top: e.y, width: e.w, height: e.h, ...style }}>{children}</div>;
};
