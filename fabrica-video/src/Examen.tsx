import { useRef } from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { VistaDiagrama } from './Diagramas';
import { pintado, useNiveles } from './Ajuste';
import { C, MONO, SANS, SERIF, SERIF_IT } from './estilo';
import { esFormula, palabrasRicas, Rico, trozos, visible } from './Formula';
import type { Cuenta, Idioma, ImagenLista, PreguntaVideo, VisualListo } from './tipos';

// Escenas de la «clase de examen» (storyboard v2): gancho con la pregunta IB,
// puntos de control con cuenta atrás, respuesta construida con el
// markscheme, diagrama para copiar, error típico, preguntas rápidas y
// resumen. Mismo estilo que el documental: papel oscuro, tinta y ámbar,
// movimiento constante. Todo vive entre y≈140 y y≈1390: por debajo van los
// subtítulos (y≈1440) y los créditos.

const ARRIBA = 140;
const SUELO = 1390;
/** «Construye la respuesta» no baja de aquí: la frase clave acaba justo encima. */
const SUELO_RESPUESTA = 1300;
/** Hueco mínimo entre el último punto del markscheme y la frase clave. */
const HUECO_CLAVE = 24;
/** Hueco entre el enunciado y la respuesta floja o el markscheme. */
const HUECO_FASES = 30;

type V<T extends VisualListo['tipo']> = Extract<VisualListo, { tipo: T }>;

const TEXTOS: Record<Idioma, Record<string, string>> = {
  es: {
    pregunta: 'Pregunta de examen',
    aprenderas: 'Para contestarla aprenderás',
    control: 'Punto de control',
    piensa: 'Piénsalo',
    respuesta: 'Respuesta',
    construye: 'Construye la respuesta',
    floja: 'Respuesta floja',
    markscheme: 'Markscheme',
    clave: 'La clave',
    copia: 'Cópialo en tu libreta',
    error: 'Error típico',
    asiNo: 'Así no',
    asiSi: 'Así sí',
    recuerda: 'Recuerda',
    rapidas: '3 preguntas rápidas',
    resumen: 'Resumen',
    llevas: 'Lo que te llevas',
    v: 'Verdadero',
    f: 'Falso',
  },
  ca: {
    pregunta: 'Pregunta d’examen',
    aprenderas: 'Per respondre-la aprendràs',
    control: 'Punt de control',
    piensa: 'Pensa-hi',
    respuesta: 'Resposta',
    construye: 'Construeix la resposta',
    floja: 'Resposta fluixa',
    markscheme: 'Markscheme',
    clave: 'La clau',
    copia: 'Copia-ho a la llibreta',
    error: 'Error típic',
    asiNo: 'Així no',
    asiSi: 'Així sí',
    recuerda: 'Recorda',
    rapidas: '3 preguntes ràpides',
    resumen: 'Resum',
    llevas: 'El que t’emportes',
    v: 'Vertader',
    f: 'Fals',
  },
  en: {
    pregunta: 'Exam question',
    aprenderas: 'To answer it you will learn',
    control: 'Checkpoint',
    piensa: 'Think',
    respuesta: 'Answer',
    construye: 'Build the answer',
    floja: 'Weak answer',
    markscheme: 'Markscheme',
    clave: 'The key',
    copia: 'Copy it into your notebook',
    error: 'Common mistake',
    asiNo: 'Not this',
    asiSi: 'This',
    recuerda: 'Recall',
    rapidas: '3 quick questions',
    resumen: 'Summary',
    llevas: 'Take-aways',
    v: 'True',
    f: 'False',
  },
};

// ─── Utilidades ─────────────────────────────────────────────────────────

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

function useMuelle(desde: number, damping = 200): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - desde, fps, config: { damping } });
}

/** Tamaño de letra según lo largo que sea el texto (lo que se ve: las fórmulas cuentan lo que ocupan, no su LaTeX). */
function tam(texto: string, escalones: Array<[number, number]>, minimo: number): number {
  const largo = visible(texto).length;
  for (const [hasta, px] of escalones) if (largo <= hasta) return px;
  return minimo;
}

/** Fondo de las escenas de examen: luz que se mueve y una retícula muy tenue que deriva. */
const FondoClase: React.FC<{ imagen?: ImagenLista; reticula?: boolean }> = ({ imagen, reticula }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / Math.max(1, durationInFrames);
  return (
    <AbsoluteFill>
      {imagen ? (
        <>
          <Img src={staticFile(imagen.fondo)} style={{ width: 1080, height: 1920, scale: String(1.1 + 0.08 * t), translate: `${-25 * t}px ${-15 * t}px` }} />
          <AbsoluteFill style={{ background: 'rgba(14,11,8,0.72)' }} />
        </>
      ) : (
        <AbsoluteFill
          style={{ background: `radial-gradient(circle at ${35 + 30 * t}% ${30 + 12 * Math.sin(frame / 50)}%, #3a2f22 0%, #1b1611 55%, #100d0a 100%)` }}
        />
      )}
      {reticula ? (
        <AbsoluteFill
          style={{
            backgroundImage:
              'linear-gradient(rgba(246,239,224,0.055) 2px, transparent 2px), linear-gradient(90deg, rgba(246,239,224,0.055) 2px, transparent 2px)',
            backgroundSize: '60px 60px',
            backgroundPosition: `${(frame * 0.4) % 60}px ${(frame * 0.25) % 60}px`,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

/** Etiqueta pequeña en mayúsculas («PUNTO DE CONTROL 2/4»). */
const Pildora: React.FC<{ texto: string; color?: string; tinta?: string; desde?: number; icono?: string }> = ({ texto, color = C.ambar, tinta = '#14110d', desde = 0, icono }) => {
  const e = useMuelle(desde);
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        alignSelf: 'flex-start',
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: 34,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: tinta,
        background: color,
        padding: '10px 22px',
        borderRadius: 14,
        opacity: e,
        translate: `${(1 - e) * -40}px 0`,
      }}
    >
      {icono ? <span style={{ fontSize: 38 }}>{icono}</span> : null}
      <span>
        <Rico texto={texto} grueso />
      </span>
    </div>
  );
};

/** Texto que se tacha palabra a palabra, como con un rotulador rojo (una fórmula cuenta como una palabra). */
const Tachado: React.FC<{ texto: string; desde: number; dur?: number; color?: string; grueso?: boolean }> = ({ texto, desde, dur = 24, color = C.rojo, grueso }) => {
  const frame = useCurrentFrame();
  const palabras = palabrasRicas(texto);
  const paso = dur / Math.max(1, palabras.length);
  return (
    <>
      {palabras.map((p, i) => {
        const k = interpolate(frame, [desde + i * paso, desde + (i + 1) * paso + 2], [0, 1], clamp);
        return (
          <span key={i} style={{ position: 'relative', display: 'inline' }}>
            <span style={{ opacity: 1 - 0.35 * k }}>
              <Rico texto={p} grueso={grueso} />
            </span>
            <span
              style={{
                position: 'absolute',
                left: -4,
                top: '52%',
                height: 7,
                width: `calc(${k * 100}% + 8px)`,
                background: color,
                borderRadius: 4,
                rotate: `${(i % 2 === 0 ? -1 : 1) * 1.2}deg`,
                opacity: k > 0 ? 1 : 0,
              }}
            />
            {i < palabras.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </>
  );
};

// ─── Cuenta atrás ───────────────────────────────────────────────────────

/** Anillo con la cuenta atrás: «?» mientras se lee la pregunta, 5…1 y luego ✓. */
const CuentaAtras: React.FC<{ cuenta: Cuenta; x: number; y: number; d?: number; idioma: Idioma }> = ({ cuenta, x, y, d = 170, idioma }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - cuenta.desde;
  const fin = cuenta.frames;
  const r = d / 2 - 10;
  const L = 2 * Math.PI * r;
  const queda = interpolate(f, [0, fin], [1, 0], clamp);
  const n = Math.max(1, Math.ceil((fin - f) / fps));
  const enCuenta = f >= 0 && f < fin;
  const hecho = f >= fin;
  const pop = enCuenta ? 1 + 0.18 * Math.max(0, 1 - ((f % fps) / fps) * 4) : 1;
  const ok = spring({ frame: f - fin, fps, config: { damping: 12, stiffness: 180 } });
  const espera = 1 + 0.05 * Math.sin(frame / 6);
  const entra = useMuelle(0);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: d, opacity: entra }}>
      <svg width={d} height={d} style={{ display: 'block', overflow: 'visible' }}>
        <circle cx={d / 2} cy={d / 2} r={r} fill="rgba(14,11,8,0.7)" stroke="rgba(246,239,224,0.16)" strokeWidth={12} />
        {!hecho ? (
          <circle
            cx={d / 2}
            cy={d / 2}
            r={r}
            fill="none"
            stroke={enCuenta && n <= 2 ? C.rojo : C.ambar}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={L}
            strokeDashoffset={L * (1 - queda)}
            transform={`rotate(-90 ${d / 2} ${d / 2})`}
          />
        ) : (
          <circle cx={d / 2} cy={d / 2} r={r * Math.min(1, ok)} fill={C.verde} />
        )}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          height: d,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: d * 0.46,
          color: hecho ? '#14110d' : C.tinta,
          scale: String(hecho ? Math.min(1.1, ok) : enCuenta ? pop : espera),
        }}
      >
        {hecho ? '✓' : enCuenta ? n : '?'}
      </div>
      <div style={{ textAlign: 'center', marginTop: 10, fontFamily: MONO, fontSize: 28, letterSpacing: 1, textTransform: 'uppercase', color: hecho ? C.verde : C.tenue }}>
        {hecho ? TEXTOS[idioma].respuesta : TEXTOS[idioma].piensa}
      </div>
    </div>
  );
};

// ─── Pregunta de la unidad (enunciado, opciones y respuesta) ────────────

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

const Opcion: React.FC<{ letra: string; texto: string; desde: number; revela: number; correcta: boolean; px: number }> = ({ letra, texto, desde, revela, correcta, px }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = useMuelle(desde);
  const r = frame >= revela;
  const pop = correcta && r ? 1 + 0.04 * spring({ frame: frame - revela, fps, config: { damping: 8, stiffness: 200 } }) * Math.max(0, 1 - (frame - revela) / 20) : 1;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '18px 26px',
        borderRadius: 24,
        background: r && correcta ? 'rgba(143,207,138,0.2)' : 'rgba(246,239,224,0.07)',
        border: `3px solid ${r && correcta ? C.verde : 'rgba(246,239,224,0.16)'}`,
        opacity: e * (r && !correcta ? 0.36 : 1),
        translate: `${(1 - e) * 80}px 0`,
        scale: String(pop),
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 66,
          height: 66,
          borderRadius: 33,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 34,
          background: r && correcta ? C.verde : 'rgba(246,239,224,0.12)',
          color: r && correcta ? '#14110d' : C.tinta,
        }}
      >
        {r && correcta ? '✓' : letra}
      </div>
      <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: px, lineHeight: 1.22, color: C.tinta }}>
        <Rico texto={texto} />
      </div>
    </div>
  );
};

/** Filas que se recolocan al revelar la respuesta (ordenar). */
const Recolocar: React.FC<{ textos: string[]; antes: number[]; desde: number; revela: number; alto: number; px: number }> = ({ textos, antes, desde, revela, alto, px }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = spring({ frame: frame - revela, fps, config: { damping: 18, stiffness: 90 } });
  return (
    <div style={{ position: 'relative', height: textos.length * alto }}>
      {textos.map((t, i) => {
        const pos0 = antes.indexOf(i);
        const y = interpolate(m, [0, 1], [pos0 * alto, i * alto]);
        const e = spring({ frame: frame - desde - pos0 * 4, fps, config: { damping: 200 } });
        const r = frame >= revela;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: y,
              height: alto - 16,
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              padding: '0 24px',
              borderRadius: 20,
              background: r ? 'rgba(143,207,138,0.14)' : 'rgba(246,239,224,0.07)',
              border: `3px solid ${r ? 'rgba(143,207,138,0.7)' : 'rgba(246,239,224,0.16)'}`,
              opacity: e,
              translate: `${(1 - e) * 80}px 0`,
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: 58,
                height: 58,
                borderRadius: 29,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: SANS,
                fontWeight: 800,
                fontSize: 32,
                background: r ? C.verde : 'rgba(246,239,224,0.12)',
                color: r ? '#14110d' : C.tenue,
              }}
            >
              {r ? i + 1 : '·'}
            </div>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: px, lineHeight: 1.15, color: C.tinta }}>
              <Rico texto={t} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TarjetaPregunta: React.FC<{ p: PreguntaVideo; desde: number; revela: number; compacta?: boolean }> = ({ p, desde, revela, compacta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tx = TEXTOS[p.idioma];
  const eq = useMuelle(desde);
  const r = frame >= revela;
  const pq = tam(p.q, compacta ? [[70, 56], [120, 50]] : [[80, 62], [130, 56], [180, 50]], 46);
  const deriva = Math.sin(frame / 40) * 4;
  const eCuerpo = useMuelle(desde + 8);
  let cuerpo: React.ReactNode = null;
  switch (p.t) {
    case 'test': {
      const largo = Math.max(...p.opciones.map((o) => visible(o).length));
      const px = largo < 40 ? 44 : largo < 65 ? 40 : 36;
      cuerpo = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: compacta ? 16 : 20 }}>
          {p.opciones.map((o, i) => (
            <Opcion key={i} letra={LETRAS[i]!} texto={o} desde={desde + 8 + i * 5} revela={revela} correcta={i === p.correcta} px={px} />
          ))}
        </div>
      );
      break;
    }
    case 'vf':
      cuerpo = (
        <div style={{ display: 'flex', gap: 30 }}>
          {[true, false].map((valor, i) => {
            const ok = valor === p.correcta;
            const e = spring({ frame: frame - desde - 8 - i * 5, fps, config: { damping: 200 } });
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 150,
                  borderRadius: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 16,
                  fontFamily: SANS,
                  fontWeight: 800,
                  fontSize: 52,
                  color: r && ok ? '#14110d' : C.tinta,
                  background: r && ok ? C.verde : 'rgba(246,239,224,0.08)',
                  border: `3px solid ${r && ok ? C.verde : 'rgba(246,239,224,0.18)'}`,
                  opacity: e * (r && !ok ? 0.32 : 1),
                  translate: `0 ${(1 - e) * 40}px`,
                }}
              >
                {r && ok ? '✓' : null}
                {valor ? tx.v : tx.f}
              </div>
            );
          })}
        </div>
      );
      break;
    case 'num': {
      const e = eCuerpo;
      const g = spring({ frame: frame - revela, fps, config: { damping: 11, stiffness: 160 } });
      cuerpo = (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              minWidth: 380,
              height: 220,
              padding: '0 50px',
              borderRadius: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `4px dashed ${r ? C.verde : 'rgba(246,239,224,0.3)'}`,
              background: r ? 'rgba(143,207,138,0.14)' : 'rgba(246,239,224,0.05)',
              opacity: e,
              scale: String(0.9 + 0.1 * e),
            }}
          >
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 150, color: r ? C.verde : C.tenue, scale: String(r ? Math.min(1.08, g) : 1 + 0.04 * Math.sin(frame / 7)) }}>
              {r ? p.respuesta : '?'}
            </div>
          </div>
        </div>
      );
      break;
    }
    case 'huecos': {
      const partes = p.texto.split('___');
      cuerpo = (
        <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 56, lineHeight: 1.5, color: C.tinta, opacity: eCuerpo }}>
          {partes.map((t, i) => {
            const g = spring({ frame: frame - revela - i * 6, fps, config: { damping: 12, stiffness: 170 } });
            const lleno = r && frame >= revela + i * 6;
            return (
              <span key={i}>
                <Rico texto={t} />
                {i < partes.length - 1 ? (
                  <span
                    style={{
                      display: 'inline-block',
                      minWidth: 150,
                      padding: '0 14px',
                      margin: '0 6px',
                      textAlign: 'center',
                      borderBottom: `5px solid ${lleno ? C.verde : C.ambar}`,
                      color: C.verde,
                      fontFamily: SANS,
                      fontWeight: 800,
                      scale: String(lleno ? Math.min(1.1, g) : 1),
                    }}
                  >
                    {lleno ? <Rico texto={p.huecos[i] ?? ''} grueso /> : ' '}
                  </span>
                ) : null}
              </span>
            );
          })}
        </div>
      );
      break;
    }
    case 'ordenar': {
      const alto = p.pasos.length <= 4 ? 128 : p.pasos.length <= 5 ? 112 : 98;
      const largo = Math.max(...p.pasos.map((s) => visible(s).length));
      cuerpo = <Recolocar textos={p.pasos} antes={p.barajados} desde={desde + 8} revela={revela} alto={alto} px={largo < 30 ? 44 : largo < 50 ? 38 : 32} />;
      break;
    }
    case 'emparejar': {
      const m = spring({ frame: frame - revela, fps, config: { damping: 18, stiffness: 90 } });
      const alto = 128;
      cuerpo = (
        <div style={{ position: 'relative', height: p.pares.length * alto }}>
          {p.pares.map(([izq, der], i) => {
            const pos0 = p.barajados.indexOf(i);
            const e = spring({ frame: frame - desde - 8 - i * 4, fps, config: { damping: 200 } });
            const caja: React.CSSProperties = {
              position: 'absolute',
              width: 440,
              height: alto - 18,
              display: 'flex',
              alignItems: 'center',
              padding: '0 20px',
              borderRadius: 18,
              fontFamily: SANS,
              fontWeight: 600,
              fontSize: 32,
              lineHeight: 1.12,
              color: C.tinta,
              opacity: e,
            };
            return (
              <div key={i}>
                <div style={{ ...caja, left: 0, top: i * alto, background: 'rgba(246,239,224,0.1)' }}>
                  <Rico texto={izq} />
                </div>
                <div
                  style={{
                    ...caja,
                    right: 0,
                    top: interpolate(m, [0, 1], [pos0 * alto, i * alto]),
                    background: r ? 'rgba(143,207,138,0.16)' : 'rgba(246,239,224,0.06)',
                    border: `3px solid ${r ? 'rgba(143,207,138,0.7)' : 'rgba(246,239,224,0.14)'}`,
                  }}
                >
                  <Rico texto={der} />
                </div>
                <div style={{ position: 'absolute', left: 446, top: i * alto + (alto - 18) / 2 - 24, width: 48, textAlign: 'center', fontSize: 40, color: C.verde, opacity: r ? m : 0 }}>
                  →
                </div>
              </div>
            );
          })}
        </div>
      );
      break;
    }
  }
  const en = useMuelle(revela + 10);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compacta ? 34 : 44, translate: `0 ${deriva}px` }}>
      <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: pq, lineHeight: 1.14, color: C.tinta, opacity: eq, translate: `0 ${(1 - eq) * 30}px` }}>
        <Rico texto={p.q} grueso />
      </div>
      {cuerpo}
      {p.nota && r ? (
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 38, lineHeight: 1.25, color: C.verde, opacity: en, translate: `0 ${(1 - en) * 20}px` }}>
          <Rico texto={p.nota} />
        </div>
      ) : null}
    </div>
  );
};

// ─── Gancho ─────────────────────────────────────────────────────────────

/** Marca el command term dentro del enunciado (fuera de las fórmulas) con un subrayado ámbar que se pinta. */
function conCommandTerm(q: string, termino: string, k: number): React.ReactNode {
  const palabra = termino.replace(/[¿?…]/g, '').trim().toLowerCase();
  let i = -1;
  let pos = 0;
  for (const t of trozos(q)) {
    const j = palabra && !esFormula(t) ? t.toLowerCase().indexOf(palabra) : -1;
    if (j >= 0) {
      i = pos + j;
      break;
    }
    pos += t.length;
  }
  if (i < 0) return <Rico texto={q} />;
  return (
    <>
      <Rico texto={q.slice(0, i)} />
      <span style={{ position: 'relative', whiteSpace: 'nowrap' }}>
        <span style={{ position: 'absolute', left: -6, right: -6, bottom: 4, height: '42%', background: 'rgba(227,165,59,0.55)', borderRadius: 6, transformOrigin: 'left', scale: `${k} 1` }} />
        <span style={{ position: 'relative' }}>{q.slice(i, i + palabra.length)}</span>
      </span>
      <Rico texto={q.slice(i + palabra.length)} />
    </>
  );
}

const Gancho: React.FC<{ v: V<'gancho'>; idioma: Idioma; vozDesde: number }> = ({ v, idioma, vozDesde }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const tx = TEXTOS[idioma];
  const t = frame / durationInFrames;
  const papel = useMuelle(4);
  const marca = interpolate(frame, [vozDesde + 30, vozDesde + 52], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const ct = useMuelle(vozDesde + 50);
  const pq = tam(v.pregunta, [[70, 66], [120, 58], [170, 52]], 46);
  return (
    <AbsoluteFill>
      <FondoClase imagen={v.fondo} />
      <div style={{ position: 'absolute', top: ARRIBA + 20, left: 80, right: 80, bottom: 1920 - SUELO, display: 'flex', flexDirection: 'column', gap: 38 }}>
        <Pildora texto={tx.pregunta} icono="✎" />
        <div
          style={{
            position: 'relative',
            background: C.examen,
            borderRadius: 10,
            padding: '44px 48px 34px',
            boxShadow: '0 30px 60px rgba(0,0,0,0.55)',
            backgroundImage: 'repeating-linear-gradient(transparent 0 68px, rgba(40,60,120,0.12) 68px 70px)',
            opacity: papel,
            translate: `0 ${(1 - papel) * 120 - 8 * t}px`,
            rotate: `${-1.6 + 1.1 * t}deg`,
            scale: String(1 + 0.015 * t),
          }}
        >
          <div style={{ position: 'absolute', left: 30, top: 0, bottom: 0, width: 3, background: 'rgba(211,91,67,0.35)' }} />
          <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: pq, lineHeight: 1.2, color: '#221b12' }}>{conCommandTerm(v.pregunta, v.commandTerm, marca)}</div>
          <div style={{ marginTop: 18, textAlign: 'right', fontFamily: MONO, fontWeight: 500, fontSize: 56, color: '#221b12' }}>[{v.marks}]</div>
        </div>
        {v.commandTerm ? (
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', opacity: ct, translate: `0 ${(1 - ct) * 30}px` }}>
            <div style={{ flexShrink: 0, fontFamily: SANS, fontWeight: 800, fontSize: 38, color: '#14110d', background: C.ambar, padding: '10px 20px', borderRadius: 12, textTransform: 'uppercase' }}>
              {v.commandTerm}
            </div>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 40, lineHeight: 1.25, color: C.tinta }}>{v.definicion}</div>
          </div>
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 2, textTransform: 'uppercase', color: C.tenue, opacity: interpolate(frame, [v.aparece[0]! - 12, v.aparece[0]!], [0, 1], clamp) }}>
            {tx.aprenderas}
          </div>
          {v.aprenderas.map((a, i) => (
            <Aprender key={i} n={i + 1} texto={a} desde={v.aparece[i] ?? 0} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Aprender: React.FC<{ n: number; texto: string; desde: number }> = ({ n, texto, desde }) => {
  const e = useMuelle(desde);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, opacity: e, translate: `${(1 - e) * -60}px 0` }}>
      <div style={{ flexShrink: 0, width: 64, height: 64, borderRadius: 32, border: `4px solid ${C.ambar}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 34, color: C.ambar }}>
        {n}
      </div>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 46, lineHeight: 1.18, color: C.tinta }}>
        <Rico texto={texto} grueso />
      </div>
    </div>
  );
};

// ─── Punto de control ───────────────────────────────────────────────────

const Pausa: React.FC<{ v: V<'pausa'>; idioma: Idioma; vozDesde: number }> = ({ v, idioma, vozDesde }) => {
  const tx = TEXTOS[idioma];
  const revela = v.cuenta.desde + v.cuenta.frames;
  const eTitulo = useMuelle(10);
  return (
    <AbsoluteFill>
      <FondoClase imagen={v.fondo} />
      <div style={{ position: 'absolute', top: ARRIBA + 20, left: 80, right: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Pildora texto={`${tx.control} ${v.numero}/${v.total}`} />
        {v.titulo ? (
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 36, lineHeight: 1.2, color: C.tenue, opacity: eTitulo }}>
            <Rico texto={v.titulo} />
          </div>
        ) : null}
      </div>
      <CuentaAtras cuenta={v.cuenta} x={830} y={ARRIBA} idioma={idioma} />
      <div style={{ position: 'absolute', top: 420, left: 80, right: 80, bottom: 1920 - SUELO }}>
        <TarjetaPregunta p={v.pregunta} desde={Math.max(4, vozDesde - 6)} revela={revela} />
      </div>
    </AbsoluteFill>
  );
};

// ─── Construye la respuesta ─────────────────────────────────────────────

/**
 * La respuesta floja con sus trozos tachados. Un trozo que empieza o acaba
 * dentro de una fórmula se estira a la fórmula entera: no se puede tachar
 * media fórmula («4 \cdot 34 = 136» tacha «$S_8 = 4 \cdot 34 = 136$»).
 */
function flojaConTachones(floja: string, tachar: string[], desde: number): React.ReactNode {
  const formulas: Array<[number, number]> = [];
  let pos = 0;
  for (const t of trozos(floja)) {
    if (esFormula(t)) formulas.push([pos, pos + t.length]);
    pos += t.length;
  }
  const marcas: Array<[number, number]> = [];
  for (const t of tachar) {
    let a = floja.indexOf(t);
    if (a < 0) continue;
    let b = a + t.length;
    for (const [x, y] of formulas) {
      if (a > x && a < y) a = x;
      if (b > x && b < y) b = y;
    }
    marcas.push([a, b]);
  }
  marcas.sort((a, b) => a[0] - b[0]);
  const piezas: React.ReactNode[] = [];
  let k = 0;
  marcas.forEach(([a, b], n) => {
    if (a < k) return;
    if (a > k)
      piezas.push(
        <span key={`t${n}`}>
          <Rico texto={floja.slice(k, a)} />
        </span>,
      );
    piezas.push(<Tachado key={`x${n}`} texto={floja.slice(a, b)} desde={desde + n * 16} dur={18} />);
    k = b;
  });
  if (k < floja.length)
    piezas.push(
      <span key="fin">
        <Rico texto={floja.slice(k)} />
      </span>,
    );
  return piezas;
}

/** Escalones de compactación de «Construye la respuesta»: letra × factor (con mínimos legibles) y huecos más apretados. */
const FACTORES = [1, 0.93, 0.87, 0.81, 0.76, 0.72, 0.68];
/** Letra mínima de enunciado, puntos y respuesta floja (a 540×960 se ven a la mitad). */
const MIN_PX = 29;
/** Alto del contador de marks (top ARRIBA): el enunciado lo rodea por la izquierda y luego usa todo el ancho. */
const ALTO_CONTADOR = 165;
/** Último recurso si el markscheme no cabe ni con la letra mínima: líneas del enunciado que quedan en la fase 2. */
const RECORTE = [Infinity, 3, 2, 1];

const Respuesta: React.FC<{ v: V<'respuesta'>; idioma: Idioma }> = ({ v, idioma }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tx = TEXTOS[idioma];
  const n = v.puntos.length;
  const hechos = v.t.puntos.filter((t) => frame >= t).length;
  const marks = hechos === 0 ? 0 : Math.round((v.marks * hechos) / n);
  const ultimo = hechos > 0 ? v.t.puntos[hechos - 1]! : -999;
  const pop = 1 + 0.25 * Math.max(0, 1 - (frame - ultimo) / 10);
  const eFloja = useMuelle(v.t.floja);
  const salir = interpolate(frame, [v.t.puntos[0]! - 14, v.t.puntos[0]!], [0, 1], clamp);
  const ePorque = useMuelle(v.t.porque);
  const eClave = spring({ frame: frame - v.t.clave, fps, config: { damping: 14, stiffness: 120 } });
  const eEnunciado = useMuelle(8);
  const eContador = useMuelle(6);
  const lleno = marks >= v.marks;

  // La maqueta se mide: enunciado arriba (con sus fórmulas), las fases debajo y
  // la frase clave abajo del todo, sin pasar de SUELO_RESPUESTA. Primero se
  // ajustan enunciado + markscheme + clave (nivel a) y luego la respuesta floja (nivel b).
  const refCabecera = useRef<HTMLDivElement>(null);
  const refEnunciado = useRef<HTMLDivElement>(null);
  const refFloja = useRef<HTMLDivElement>(null);
  const refPuntos = useRef<HTMLDivElement>(null);
  const refClave = useRef<HTMLDivElement>(null);
  /** Alto del enunciado entero (medido): para recortarlo poco a poco cuando entra el markscheme. */
  const altoEnunciado = useRef(0);
  const alto = SUELO_RESPUESTA - (ARRIBA + 20);
  const lineasA = (nivel: number): number => RECORTE[nivel - (FACTORES.length - 1)] ?? Infinity;
  const pxEnunciadoDe = (nivel: number): number => Math.max(MIN_PX, Math.round(38 * FACTORES[Math.min(nivel, FACTORES.length - 1)]!));
  const [a, b] = useNiveles(
    [FACTORES.length - 1 + RECORTE.length - 1, FACTORES.length - 1],
    (i) => {
      const cab = refCabecera.current;
      const en = refEnunciado.current;
      const fase = i === 0 ? refPuntos.current : refFloja.current;
      if (!pintado(cab) || !pintado(en) || !pintado(fase)) return undefined;
      const clave = i === 0 && v.clave ? refClave.current : null;
      if (i === 0 && v.clave && !pintado(clave)) return undefined;
      altoEnunciado.current = en.scrollHeight;
      // El enunciado, entero en la fase 1; en la fase 2, recortado si hace falta (último recurso).
      const lineas = i === 0 ? lineasA(a) : Infinity;
      const enH = Math.min(en.scrollHeight, lineas * pxEnunciadoDe(a) * 1.25);
      const cabecera = Math.max(a === 0 ? 260 : 0, ALTO_CONTADOR - 6, en.offsetTop - cab.offsetTop + enH);
      const usado = cabecera + HUECO_FASES + fase.offsetHeight + (clave ? HUECO_CLAVE + clave.offsetHeight : 0);
      return usado <= alto;
    },
    `${v.pregunta}|${v.floja}|${v.puntos.join('|')}|${v.clave}`,
  );
  const fa = FACTORES[Math.min(a, FACTORES.length - 1)]!;
  const fb = FACTORES[b]!;
  const lineasRecorte = lineasA(a);
  const px = (base: number, f: number, min = MIN_PX): number => Math.max(Math.min(base, min), Math.round(base * f));
  const pxEnunciado = pxEnunciadoDe(a);
  const pxPunto = px(n <= 3 ? 44 : n <= 5 ? 38 : 34, fa);
  // Recorte del enunciado al entrar el markscheme (ya se leyó entero en la fase 1).
  const maxEnunciado = Number.isFinite(lineasRecorte) && altoEnunciado.current > 0
    ? interpolate(salir, [0, 1], [altoEnunciado.current, Math.min(altoEnunciado.current, lineasRecorte * pxEnunciado * 1.25)])
    : undefined;
  const pxClave = px(tam(v.clave, [[34, 58], [52, 50]], 44), fa, 38);
  const pxFloja = px(tam(v.floja, [[90, 54], [160, 48]], 42), fb, 32);
  const pxPorque = px(42, fb, 32);

  return (
    <AbsoluteFill>
      <FondoClase reticula />
      {/* Contador de marks */}
      <div
        style={{
          position: 'absolute',
          top: ARRIBA,
          right: 80,
          width: 200,
          padding: '18px 0 14px',
          borderRadius: 26,
          textAlign: 'center',
          background: lleno ? 'rgba(143,207,138,0.2)' : 'rgba(14,11,8,0.7)',
          border: `4px solid ${lleno ? C.verde : 'rgba(246,239,224,0.2)'}`,
          opacity: eContador,
        }}
      >
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: `${v.marks}`.length > 1 ? 58 : 78, lineHeight: `${v.marks}`.length > 1 ? '78px' : 1, color: lleno ? C.verde : C.tinta, scale: String(pop) }}>
          {marks}/{v.marks}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 30, color: C.tenue, marginTop: 6 }}>marks</div>
      </div>

      <div style={{ position: 'absolute', top: ARRIBA + 20, left: 80, right: 80 }}>
        {/* Píldora y enunciado: rodean el contador y, por debajo de él, usan todo el ancho */}
        <div ref={refCabecera} style={{ display: 'flow-root', minHeight: a === 0 ? 260 : 0 }}>
          <div style={{ float: 'right', width: 230, height: ALTO_CONTADOR - 20 + 14 }} />
          <Pildora texto={tx.construye} />
          <div
            ref={refEnunciado}
            style={{ fontFamily: SANS, fontWeight: 600, fontSize: pxEnunciado, lineHeight: 1.25, color: C.tenue, marginTop: Math.round(22 * fa), opacity: eEnunciado, maxHeight: maxEnunciado, overflow: maxEnunciado === undefined ? undefined : 'hidden' }}
          >
            <Rico texto={v.pregunta} /> <span style={{ fontFamily: MONO, color: C.tinta, whiteSpace: 'nowrap' }}>[{v.marks}]</span>
          </div>
        </div>

        {/* Las dos fases ocupan el mismo sitio, justo debajo del enunciado */}
        <div style={{ position: 'relative', marginTop: HUECO_FASES }}>
          {/* Fase 1: la respuesta floja, tachada, con su porqué */}
          <div
            ref={refFloja}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: Math.round(30 * fb),
              opacity: eFloja * (1 - salir),
              translate: `0 ${(1 - eFloja) * 60 - salir * 80}px`,
              scale: String(1 - 0.06 * salir),
            }}
          >
            <div style={{ padding: `${Math.round(30 * fb)}px 36px`, borderRadius: 26, background: 'rgba(14,11,8,0.72)', borderLeft: `10px solid ${C.rojo}` }}>
              <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 2, textTransform: 'uppercase', color: C.rojo, marginBottom: Math.round(16 * fb) }}>✗ {tx.floja}</div>
              <div style={{ fontFamily: SERIF_IT, fontWeight: 600, fontSize: pxFloja, lineHeight: 1.3, color: C.tinta }}>«{flojaConTachones(v.floja, v.tachar, v.t.tachar)}»</div>
            </div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', opacity: ePorque, translate: `0 ${(1 - ePorque) * 30}px` }}>
              <div style={{ flexShrink: 0, fontFamily: SANS, fontWeight: 800, fontSize: pxPorque - 2, color: C.rojo }}>→</div>
              <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: pxPorque, lineHeight: 1.25, color: C.tinta }}>
                <Rico texto={v.porque} />
              </div>
            </div>
          </div>

          {/* Fase 2: los puntos del markscheme, uno a uno */}
          <div
            ref={refPuntos}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column', gap: Math.round((n > 5 ? 18 : 26) * fa), opacity: salir }}
          >
            <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 2, textTransform: 'uppercase', color: C.tenue }}>{tx.markscheme}</div>
            {v.puntos.map((p, i) => (
              <PuntoMarkscheme key={i} texto={p} desde={v.t.puntos[i]!} px={pxPunto} />
            ))}
          </div>
        </div>
      </div>

      {/* Fase 3: la frase clave del command term, abajo del todo */}
      {v.clave ? (
        <div
          ref={refClave}
          style={{
            position: 'absolute',
            left: 80,
            right: 80,
            bottom: 1920 - SUELO_RESPUESTA,
            padding: `${Math.round(24 * fa)}px 34px`,
            borderRadius: 26,
            background: C.ambar,
            opacity: Math.min(1, eClave),
            translate: `0 ${(1 - Math.min(1, eClave)) * 80}px`,
            scale: String(0.94 + 0.06 * Math.min(1.04, eClave)),
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 28, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(20,17,13,0.72)' }}>
            {tx.clave}
            {v.commandTerm ? ` · ${v.commandTerm}` : ''}
          </div>
          <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: pxClave, lineHeight: 1.15, color: '#14110d', marginTop: 6 }}>
            <Rico texto={v.clave} grueso />
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const PuntoMarkscheme: React.FC<{ texto: string; desde: number; px: number }> = ({ texto, desde, px }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = useMuelle(desde);
  const ok = spring({ frame: frame - desde - 4, fps, config: { damping: 9, stiffness: 190 } });
  const visto = frame >= desde;
  // El círculo del ✓ va con la letra (70 px con 44 px de letra).
  const d = Math.round(Math.max(48, Math.min(70, px * 1.6)));
  return (
    <div style={{ display: 'flex', gap: Math.round(d * 0.34), alignItems: 'flex-start', opacity: visto ? 1 : 0.22 }}>
      <div
        style={{
          flexShrink: 0,
          width: d,
          height: d,
          borderRadius: d / 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: Math.round(d * 0.6),
          background: visto ? C.verde : 'transparent',
          border: `4px solid ${visto ? C.verde : 'rgba(246,239,224,0.3)'}`,
          color: '#14110d',
          scale: String(visto ? Math.min(1.15, ok) : 1),
        }}
      >
        {visto ? '✓' : ''}
      </div>
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: px,
          lineHeight: 1.24,
          color: C.tinta,
          opacity: visto ? e : 1,
          translate: `${(1 - e) * 40}px 0`,
          paddingTop: Math.max(0, Math.round((d - px * 1.24) / 2)),
        }}
      >
        <Rico texto={texto} />
      </div>
    </div>
  );
};

// ─── Dibuja esto ────────────────────────────────────────────────────────

const Dibujar: React.FC<{ v: V<'dibujar'>; idioma: Idioma }> = ({ v, idioma }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const tx = TEXTOS[idioma];
  const vistas = v.aparece.filter((a) => a < 0 || frame >= a).length;
  const lapiz = Math.sin(frame / 5) * 10;
  const t = frame / durationInFrames;
  return (
    <AbsoluteFill>
      <FondoClase reticula />
      <AbsoluteFill style={{ scale: String(1 + 0.025 * t), transformOrigin: '50% 40%' }}>
        <VistaDiagrama d={v.diagrama} aparece={v.aparece} idioma={idioma} />
      </AbsoluteFill>
      <div style={{ position: 'absolute', top: ARRIBA, left: 80, right: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: 1.5, textTransform: 'uppercase', color: '#14110d', background: C.ambar, padding: '10px 22px', borderRadius: 14, opacity: useMuelle(0) }}>
          <span style={{ display: 'inline-block', fontSize: 40, rotate: `${lapiz}deg`, translate: `0 ${Math.abs(lapiz) / 3}px` }}>✎</span>
          {tx.copia}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 32, color: C.tenue }}>
          {vistas}/{v.aparece.length}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Error típico ───────────────────────────────────────────────────────

const ErrorTipico: React.FC<{ v: V<'error'>; idioma: Idioma }> = ({ v, idioma }) => {
  const frame = useCurrentFrame();
  const tx = TEXTOS[idioma];
  const eMal = useMuelle(6);
  const eBien = useMuelle(v.t.bien);
  const durTachar = 26;
  const fin = v.t.tachar + durTachar;
  const temblor = frame > fin && frame < fin + 14 ? Math.sin((frame - fin) * 2.4) * (14 - (frame - fin)) * 0.9 : 0;
  const rojo = interpolate(frame, [v.t.tachar, fin], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <FondoClase />
      <div style={{ position: 'absolute', top: ARRIBA + 20, left: 80, right: 80, bottom: 1920 - SUELO, display: 'flex', flexDirection: 'column', gap: 46 }}>
        <Pildora texto={tx.error} color={C.rojo} tinta="#fff" icono="⚠" />
        <div
          style={{
            padding: '34px 38px',
            borderRadius: 28,
            background: `rgba(${Math.round(14 + 50 * rojo)},11,8,0.78)`,
            borderLeft: `12px solid ${C.rojo}`,
            opacity: eMal,
            translate: `${temblor}px ${(1 - eMal) * 50}px`,
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 2, textTransform: 'uppercase', color: C.rojo, marginBottom: 18 }}>✗ {tx.asiNo}</div>
          <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: tam(v.mal, [[70, 60], [120, 54]], 48), lineHeight: 1.28, color: C.tinta }}>
            <Tachado texto={v.mal} desde={v.t.tachar} dur={durTachar} />
          </div>
        </div>
        <div
          style={{
            padding: '34px 38px',
            borderRadius: 28,
            background: 'rgba(143,207,138,0.12)',
            border: `4px solid ${C.verde}`,
            opacity: eBien,
            translate: `0 ${(1 - eBien) * 90}px`,
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 2, textTransform: 'uppercase', color: C.verde, marginBottom: 18 }}>✓ {tx.asiSi}</div>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: tam(v.bien, [[80, 52], [140, 46]], 42), lineHeight: 1.28, color: C.tinta }}>
            <Rico texto={v.bien} grueso />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Recuerda ───────────────────────────────────────────────────────────

const Recuerda: React.FC<{ v: V<'recuerda'>; idioma: Idioma }> = ({ v, idioma }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tx = TEXTOS[idioma];
  let actual = -1;
  v.items.forEach((it, i) => {
    if (frame >= it.desde) actual = i;
  });
  const eTitulo = useMuelle(0);
  return (
    <AbsoluteFill>
      <FondoClase reticula />
      <div style={{ position: 'absolute', top: ARRIBA + 20, left: 80, right: 300, opacity: eTitulo }}>
        <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 92, lineHeight: 1, color: C.tinta }}>{tx.recuerda}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 18 }}>
          <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 1, textTransform: 'uppercase', color: C.tenue }}>{tx.rapidas}</div>
          {v.items.map((_, i) => (
            <div
              key={i}
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                background: i < actual ? C.verde : i === actual ? C.ambar : 'transparent',
                border: `3px solid ${i <= actual ? 'transparent' : 'rgba(246,239,224,0.4)'}`,
                scale: String(i === actual ? 1.2 : actual < 0 ? 1 + 0.15 * Math.sin(frame / 6 + i) : 1),
              }}
            />
          ))}
        </div>
      </div>
      {v.items.map((it, i) => {
        const sig = v.items[i + 1];
        const entra = spring({ frame: frame - it.desde, fps, config: { damping: 200 } });
        const sale = sig ? spring({ frame: frame - sig.desde, fps, config: { damping: 200 } }) : 0;
        if (frame < it.desde - 1 || sale >= 0.999) return null;
        return (
          <div key={i}>
            <div style={{ opacity: entra * (1 - sale) }}>
              <CuentaAtras cuenta={it.cuenta} x={830} y={ARRIBA} idioma={idioma} />
            </div>
            <div
              style={{
                position: 'absolute',
                top: 420,
                left: 80,
                right: 80,
                bottom: 1920 - SUELO,
                opacity: entra * (1 - sale),
                translate: `${(1 - entra) * 220 - sale * 220}px 0`,
              }}
            >
              <TarjetaPregunta p={it.pregunta} desde={it.desde} revela={it.cuenta.desde + it.cuenta.frames} compacta />
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Resumen ────────────────────────────────────────────────────────────

const Resumen: React.FC<{ v: V<'resumen'>; idioma: Idioma }> = ({ v, idioma }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tx = TEXTOS[idioma];
  const e = useMuelle(0);
  const cta = spring({ frame: frame - v.ctaDesde, fps, config: { damping: 12, stiffness: 120 } });
  const late = 1 + 0.035 * Math.sin((frame - v.ctaDesde) / 5);
  return (
    <AbsoluteFill>
      <FondoClase />
      <div style={{ position: 'absolute', top: ARRIBA + 30, left: 80, right: 80, bottom: 1920 - SUELO, display: 'flex', flexDirection: 'column', gap: 40 }}>
        <div style={{ opacity: e, translate: `0 ${(1 - e) * 30}px` }}>
          <div style={{ fontFamily: MONO, fontSize: 32, letterSpacing: 2, textTransform: 'uppercase', color: C.ambar }}>{tx.resumen}</div>
          <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 92, lineHeight: 1.05, color: C.tinta, marginTop: 8 }}>{tx.llevas}</div>
          <div style={{ height: 6, width: 200 * e, background: C.ambar, borderRadius: 3, marginTop: 22 }} />
        </div>
        {v.ideas.map((idea, i) => (
          <Idea key={i} n={i + 1} texto={idea} desde={v.aparece[i] ?? 0} />
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ alignSelf: 'center', opacity: Math.min(1, cta), scale: String((0.8 + 0.2 * Math.min(1, cta)) * (cta > 0.9 ? late : 1)) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '26px 50px', borderRadius: 999, background: C.ambar, fontFamily: SANS, fontWeight: 800, fontSize: 58, color: '#14110d', boxShadow: '0 20px 50px rgba(227,165,59,0.35)' }}>
            <Rico texto={v.cta} grueso />
            <span style={{ display: 'inline-block', translate: `${6 * Math.sin(frame / 4)}px 0` }}>→</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Idea: React.FC<{ n: number; texto: string; desde: number }> = ({ n, texto, desde }) => {
  const e = useMuelle(desde);
  return (
    <div style={{ display: 'flex', gap: 30, alignItems: 'center', padding: '26px 32px', borderRadius: 26, background: 'rgba(14,11,8,0.6)', border: '3px solid rgba(246,239,224,0.12)', opacity: e, translate: `${(1 - e) * -90}px 0` }}>
      <div style={{ flexShrink: 0, fontFamily: SERIF, fontWeight: 800, fontSize: 96, lineHeight: 1, color: C.ambar, width: 70, textAlign: 'center' }}>{n}</div>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: tam(texto, [[40, 52], [60, 46]], 42), lineHeight: 1.2, color: C.tinta }}>
        <Rico texto={texto} grueso />
      </div>
    </div>
  );
};

// ─── Entrada ────────────────────────────────────────────────────────────

/** El cuerpo de una escena de examen, o null si el visual no es de examen. */
export function cuerpoExamen(v: VisualListo, idioma: Idioma, vozDesde: number): React.ReactNode {
  switch (v.tipo) {
    case 'gancho':
      return <Gancho v={v} idioma={idioma} vozDesde={vozDesde} />;
    case 'pausa':
      return <Pausa v={v} idioma={idioma} vozDesde={vozDesde} />;
    case 'respuesta':
      return <Respuesta v={v} idioma={idioma} />;
    case 'dibujar':
      return <Dibujar v={v} idioma={idioma} />;
    case 'error':
      return <ErrorTipico v={v} idioma={idioma} />;
    case 'recuerda':
      return <Recuerda v={v} idioma={idioma} />;
    case 'resumen':
      return <Resumen v={v} idioma={idioma} />;
    default:
      return null;
  }
}
