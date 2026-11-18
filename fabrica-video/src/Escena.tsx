import { Audio } from '@remotion/media';
import { AbsoluteFill, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { useRef } from 'react';
import { pintado, useNiveles } from './Ajuste';
import { Cronologia, VistaDiagrama } from './Diagramas';
import { cuerpoExamen } from './Examen';
import { C, MONO, SANS, SERIF, SERIF_IT } from './estilo';
import { Foto } from './Foto';
import { palabrasRicas, Rico } from './Formula';
import { Subtitulos } from './Subtitulos';
import type { EscenaLista, Idioma, ImagenLista } from './tipos';

// Una escena: el visual con movimiento, los rótulos, la voz y los subtítulos.

const ms2f = (ms: number, fps: number, desde: number): number => (ms < 0 ? -1 : desde + Math.round((ms / 1000) * fps));

/** Fondo de una escena gráfica: imagen desenfocada que se mueve, o papel oscuro con luz que respira. */
const Fondo: React.FC<{ imagen?: ImagenLista; frames: number }> = ({ imagen, frames }) => {
  const frame = useCurrentFrame();
  const t = frame / Math.max(1, frames);
  if (imagen) {
    return (
      <AbsoluteFill>
        <Img src={staticFile(imagen.fondo)} style={{ width: 1080, height: 1920, scale: String(1.1 + 0.08 * t), translate: `${-25 * t}px ${-15 * t}px` }} />
        <AbsoluteFill style={{ background: 'rgba(14,11,8,0.55)' }} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at ${40 + 20 * t}% ${35 + 10 * Math.sin(t * 3)}%, #3a2f22 0%, #1b1611 55%, #100d0a 100%)`,
      }}
    />
  );
};

const Titulo: React.FC<{ texto: string; subtitulo?: string }> = ({ texto, subtitulo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palabras = palabrasRicas(texto);
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 90px', top: -180 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 118, lineHeight: 1.06, color: C.tinta }}>
          {palabras.map((p, i) => {
            const e = spring({ frame: frame - 6 - i * 6, fps, config: { damping: 200 } });
            return (
              <span key={i} style={{ display: 'inline-block', opacity: e, translate: `0 ${(1 - e) * 40}px`, marginRight: 26 }}>
                <Rico texto={p} grueso />
              </span>
            );
          })}
        </div>
        <div style={{ height: 5, width: 220 * spring({ frame: frame - 20, fps, config: { damping: 200 } }), background: C.ambar, margin: '36px auto 30px', borderRadius: 3 }} />
        {subtitulo ? (
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 42, letterSpacing: 6, textTransform: 'uppercase', color: C.tenue, opacity: interpolate(frame, [24, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
            <Rico texto={subtitulo} grueso />
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

const Cita: React.FC<{ texto: string; origen: string }> = ({ texto, origen }) => {
  const frame = useCurrentFrame();
  const palabras = palabrasRicas(texto);
  return (
    <AbsoluteFill style={{ padding: '0 100px', justifyContent: 'center', top: -170 }}>
      <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 260, lineHeight: 0.6, color: C.ambar, opacity: interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' }) }}>“</div>
      <div style={{ fontFamily: SERIF_IT, fontWeight: 600, fontSize: 84, lineHeight: 1.16, color: C.tinta, marginTop: 30 }}>
        {palabras.map((p, i) => (
          <span key={i} style={{ opacity: interpolate(frame, [8 + i * 4, 18 + i * 4], [0.08, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
            <Rico texto={p} />{' '}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 50, opacity: interpolate(frame, [20, 36], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
        <div style={{ width: 60, height: 4, background: C.ambar }} />
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 36, color: C.tenue }}>
          <Rico texto={origen} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Persona: React.FC<{ x: number; y: number; e: number }> = ({ x, y, e }) => (
  <svg width={200} height={260} viewBox="0 0 100 130" style={{ position: 'absolute', left: x, top: y, opacity: e, scale: String(0.6 + 0.4 * e) }}>
    <circle cx={50} cy={26} r={20} fill={C.ambar} />
    <path d="M14 128 C14 76 26 56 50 56 C74 56 86 76 86 128 Z" fill={C.ambar} />
  </svg>
);

const Pictograma: React.FC<{ titulo: string; valor: number; unidad: string; desde: number }> = ({ titulo, valor, unidad, desde }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = Math.round(valor);
  const porFila = n <= 4 ? 2 : 3;
  const paso = 9;
  const cuenta = interpolate(frame, [desde, desde + n * paso + 6], [0, valor], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', top: 250, left: 80, right: 80, fontFamily: SERIF, fontWeight: 800, fontSize: 66, color: C.tinta }}>
        <Rico texto={titulo} grueso />
      </div>
      {Array.from({ length: n }, (_, i) => {
        const fila = Math.floor(i / porFila);
        const col = i % porFila;
        const anchoFila = porFila * 230;
        const e = spring({ frame: frame - desde - i * paso, fps, config: { damping: 14, stiffness: 160 } });
        return <Persona key={i} x={(1080 - anchoFila) / 2 + col * 230 + 15} y={500 + fila * 290} e={Math.max(0, Math.min(1.2, e))} />;
      })}
      <div style={{ position: 'absolute', top: 500 + Math.ceil(n / porFila) * 290 + 10, left: 0, right: 0, textAlign: 'center' }}>
        <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 120, color: C.ambar }}>{cuenta.toFixed(cuenta < valor ? 1 : 0).replace('.', ',')}</span>
        <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 44, color: C.tinta, marginLeft: 20 }}>
          <Rico texto={unidad} />
        </span>
      </div>
      <div style={{ position: 'absolute', top: 1340, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontSize: 30, color: C.tenue }}>1 figura = 1 millón</div>
    </AbsoluteFill>
  );
};

const Creditos: React.FC<{ lineas: Array<{ titulo: string; texto: string }>; frames: number }> = ({ lineas, frames }) => {
  const frame = useCurrentFrame();
  const alto = 260 + lineas.length * 150;
  const y = interpolate(frame, [20, frames - 30], [1500, Math.min(250, 1650 - alto)], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: C.fondo }}>
      <div style={{ position: 'absolute', left: 90, right: 90, top: y }}>
        <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 80, color: C.tinta, marginBottom: 50 }}>Créditos</div>
        {lineas.map((l, i) => (
          <div key={i} style={{ marginBottom: 34 }}>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 30, color: C.ambar, textTransform: 'uppercase', letterSpacing: 2 }}>{l.titulo}</div>
            <div style={{ fontFamily: SANS, fontSize: 30, color: C.tinta, lineHeight: 1.3 }}>{l.texto}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Marca: React.FC<{ x: number; y: number; texto?: string; desde: number }> = ({ x, y, texto, desde }) => {
  const frame = useCurrentFrame();
  const f = frame - desde;
  if (f < 0) return null;
  const pulso = (f % 40) / 40;
  return (
    <div style={{ position: 'absolute', left: x - 22, top: y - 22 }}>
      <div style={{ position: 'absolute', width: 44, height: 44, borderRadius: 22, border: `4px solid ${C.rojo}`, scale: String(1 + pulso * 1.6), opacity: 1 - pulso }} />
      <div style={{ position: 'absolute', left: 10, top: 10, width: 24, height: 24, borderRadius: 12, background: C.rojo }} />
      {texto ? (
        <div style={{ position: 'absolute', left: 52, top: -2, whiteSpace: 'nowrap', fontFamily: SANS, fontWeight: 800, fontSize: 34, color: '#fff', textShadow: '0 2px 10px #000' }}>
          <Rico texto={texto} grueso />
        </div>
      ) : null}
    </div>
  );
};

// ─── Rótulos ────────────────────────────────────────────────────────────

const Pie: React.FC<{ texto?: string; etiqueta?: string; ia?: boolean }> = ({ texto, etiqueta, ia }) => {
  const frame = useCurrentFrame();
  const e = interpolate(frame, [10, 26], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (!texto && !etiqueta && !ia) return null;
  return (
    <div style={{ position: 'absolute', top: 120, left: 80, right: 80, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start', opacity: e }}>
      {ia ? (
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 2, textTransform: 'uppercase', color: '#14110d', background: '#9fd3c7', padding: '8px 18px', borderRadius: 10 }}>
          Recreación IA
        </div>
      ) : null}
      {etiqueta ? (
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 1, color: '#fff', background: 'rgba(211,91,67,0.92)', padding: '8px 18px', borderRadius: 10 }}>
          <Rico texto={etiqueta} grueso />
        </div>
      ) : null}
      {texto ? (
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 36, color: C.tinta, textShadow: '0 2px 12px rgba(0,0,0,0.9)', background: 'rgba(10,8,6,0.45)', padding: '6px 16px', borderRadius: 8 }}>
          <Rico texto={texto} />
        </div>
      ) : null}
    </div>
  );
};

/** Los rótulos de abajo no pasan de aquí: los subtítulos empiezan en y=1440. */
const LIMITE_ROTULOS = 1420;
/** Letra del rótulo: se reduce hasta caber en su sitio; si ni así, sube (nunca baja de LIMITE_ROTULOS). */
const TAMS_ROTULO = [66, 61, 57, 53, 49, 46];

const Rotulo: React.FC<{ texto: string; px: number; medida: React.Ref<HTMLDivElement> }> = ({ texto, px, medida }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = spring({ frame: frame - 14, fps, config: { damping: 200 } });
  return (
    <div ref={medida} style={{ opacity: e, translate: `${(1 - e) * -40}px 0` }}>
      <span
        style={{
          fontFamily: SERIF,
          fontWeight: 800,
          fontSize: px,
          lineHeight: 1.15,
          color: C.tinta,
          background: 'rgba(14,11,8,0.72)',
          boxDecorationBreak: 'clone',
          WebkitBoxDecorationBreak: 'clone',
          padding: '4px 20px',
          borderLeft: `8px solid ${C.ambar}`,
        }}
      >
        <Rico texto={texto} grueso />
      </span>
    </div>
  );
};

const Ficha: React.FC<{ nombre: string; cargo?: string }> = ({ nombre, cargo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = spring({ frame: frame - 12, fps, config: { damping: 200 } });
  return (
    <div style={{ display: 'flex', alignSelf: 'flex-start', opacity: e, translate: `${(1 - e) * -80}px 0` }}>
      <div style={{ width: 10, background: C.ambar, borderRadius: 4 }} />
      <div style={{ background: 'rgba(14,11,8,0.82)', padding: '14px 26px' }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 52, color: C.tinta }}>
          <Rico texto={nombre} grueso />
        </div>
        {cargo ? (
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 34, color: C.ambar, marginTop: 4 }}>
            <Rico texto={cargo} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

/**
 * Ficha del personaje y rótulo de la escena, apilados encima de los
 * subtítulos. Cada uno prefiere su `y` de siempre; la pila va anclada por
 * abajo a LIMITE_ROTULOS, así que lo que no cabe crece hacia arriba y nunca
 * pisa los subtítulos. El rótulo mide su alto y reduce la letra hasta caber
 * en su sitio (en los diagramas, una línea entre el diagrama y los subtítulos).
 */
const Rotulos: React.FC<{ rotulo?: string; personaje?: { nombre: string; cargo?: string }; yRotulo: number }> = ({ rotulo, personaje, yRotulo }) => {
  const medida = useRef<HTMLDivElement>(null);
  const hueco = LIMITE_ROTULOS - yRotulo;
  const [nivel] = useNiveles(
    [rotulo ? TAMS_ROTULO.length - 1 : 0],
    () => (rotulo ? (pintado(medida.current) ? medida.current.offsetHeight <= hueco : undefined) : true),
    `${rotulo ?? ''}|${yRotulo}`,
  );
  if (!rotulo && !personaje) return null;
  const yFicha = rotulo ? 1130 : 1250;
  return (
    <div style={{ position: 'absolute', left: 80, right: 80, bottom: 1920 - LIMITE_ROTULOS, display: 'flex', flexDirection: 'column' }}>
      {personaje ? (
        <div style={{ minHeight: (rotulo ? yRotulo : LIMITE_ROTULOS) - yFicha, display: 'flex', flexDirection: 'column', paddingBottom: rotulo ? 12 : 0 }}>
          <Ficha nombre={personaje.nombre} cargo={personaje.cargo} />
        </div>
      ) : null}
      {rotulo ? (
        <div style={{ minHeight: hueco }}>
          <Rotulo texto={rotulo} px={TAMS_ROTULO[nivel]!} medida={medida} />
        </div>
      ) : null}
    </div>
  );
};

const Credito: React.FC<{ texto: string }> = ({ texto }) => (
  <div
    style={{
      position: 'absolute',
      right: 80,
      left: 80,
      top: 1690,
      textAlign: 'right',
      fontFamily: SANS,
      fontSize: 22,
      color: 'rgba(246,239,224,0.72)',
      textShadow: '0 1px 6px rgba(0,0,0,0.9)',
      lineHeight: 1.25,
    }}
  >
    {texto}
  </div>
);

// ─── Escena ─────────────────────────────────────────────────────────────

export const Escena: React.FC<{ e: EscenaLista; indice: number; idioma?: Idioma }> = ({ e, indice, idioma = 'es' }) => {
  const { fps } = useVideoConfig();
  const v = e.visual;
  const aFrames = (lista: number[]): number[] => lista.map((ms) => ms2f(ms, fps, e.vozDesde));
  let cuerpo: React.ReactNode = null;
  let credito: string | undefined;
  let pie: string | undefined;
  let etiqueta: string | undefined;
  let ia = false;
  let yRotulo = 1250;

  switch (v.tipo) {
    case 'archivo':
      cuerpo = <Foto imagen={v.imagen} movimiento={e.movimiento} foco={e.foco} indice={indice} clase={v.clase} frames={e.frames} />;
      credito = v.imagen.credito;
      pie = v.imagen.pie;
      etiqueta = v.etiqueta;
      break;
    case 'ia':
      cuerpo = <Foto imagen={v.imagen} movimiento={e.movimiento} foco={e.foco} indice={indice} clase="ia" frames={e.frames} />;
      pie = v.imagen.pie;
      credito = v.imagen.credito;
      ia = true;
      break;
    case 'mapa':
      cuerpo = (
        <>
          <Foto imagen={v.imagen} movimiento={e.movimiento === 'auto' ? 'zoom-lento' : e.movimiento} foco={e.foco} indice={indice} clase="mapa" frames={e.frames} />
          {v.marcas.map((m, i) => {
            const caja = Math.min(960 / v.imagen.ancho, 1180 / v.imagen.alto);
            const w = v.imagen.ancho * caja;
            const h = v.imagen.alto * caja;
            return <Marca key={i} x={(1080 - w) / 2 + m.x * w} y={800 - h / 2 + m.y * h} texto={m.texto} desde={e.vozDesde + 20 + i * 15} />;
          })}
        </>
      );
      credito = v.imagen.credito;
      pie = v.imagen.pie;
      break;
    case 'diagrama':
      cuerpo = (
        <>
          <Fondo imagen={v.fondo} frames={e.frames} />
          <VistaDiagrama d={v.diagrama} aparece={aFrames(v.tiempos)} hasta={v.mostrarHasta} textos={v.textosValor} flecha={v.flecha} idioma={idioma} />
        </>
      );
      credito = v.fondo?.credito;
      yRotulo = 1330;
      break;
    case 'cronologia':
      cuerpo = (
        <>
          <Fondo frames={e.frames} />
          <Cronologia hitos={v.hitos} aparece={aFrames(v.tiempos)} />
        </>
      );
      break;
    case 'titulo':
      cuerpo = (
        <>
          <Fondo imagen={v.fondo} frames={e.frames} />
          <Titulo texto={v.texto} subtitulo={v.subtitulo} />
        </>
      );
      credito = v.fondo?.credito;
      break;
    case 'cita':
      cuerpo = (
        <>
          <Fondo imagen={v.fondo} frames={e.frames} />
          <Cita texto={v.texto} origen={v.origen} />
        </>
      );
      credito = v.fondo?.credito;
      break;
    case 'pictograma':
      cuerpo = (
        <>
          <Fondo imagen={v.fondo} frames={e.frames} />
          <Pictograma titulo={v.titulo} valor={v.valor} unidad={v.unidad} desde={ms2f(v.desdeMs, fps, e.vozDesde)} />
        </>
      );
      credito = v.fondo?.credito;
      break;
    case 'creditos':
      cuerpo = <Creditos lineas={v.lineas} frames={e.frames} />;
      break;
    default:
      // Escenas de la clase de examen (Examen.tsx).
      cuerpo = cuerpoExamen(v, idioma, e.vozDesde);
      if (v.tipo === 'gancho' || v.tipo === 'pausa') credito = v.fondo?.credito;
  }
  const tramos = e.tramos ?? (e.audio ? [{ audio: e.audio, palabras: e.palabras, vozMs: e.vozMs, desde: e.vozDesde }] : []);

  return (
    <AbsoluteFill style={{ backgroundColor: C.fondo }}>
      {cuerpo}
      {/* Degradados para que se lean los textos de arriba y de abajo */}
      {v.tipo !== 'creditos' ? (
        <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.62) 100%)' }} />
      ) : null}
      <Pie texto={pie} etiqueta={etiqueta} ia={ia} />
      <Rotulos rotulo={e.rotulo} personaje={e.personaje} yRotulo={yRotulo} />
      {credito ? <Credito texto={credito} /> : null}
      {tramos.map((t, i) => (
        <Sequence key={i} from={t.desde} name={tramos.length > 1 ? `Voz ${i + 1}` : 'Voz'}>
          <Audio src={staticFile(t.audio)} />
          <Subtitulos palabras={t.palabras} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
