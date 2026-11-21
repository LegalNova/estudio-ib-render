import React from 'react';

// Personajes en SVG plano, hechos con piezas (piernas, torso, brazos, cabeza,
// pelo, vello, gafas, sombrero) que se parametrizan por colores y accesorios.
// Coordenadas locales: los pies en y = 0, el centro en x = 0; la figura mide
// unos 470 px de alto a escala 1 (viewBox -130 -500 260 510).

export type Pelo = 'coleta' | 'corto' | 'flequillo' | 'peinado' | 'calvo' | 'raya' | 'trenzas' | 'mono' | 'rizado';
export type Vello = 'bigotito' | 'bigote' | 'mostacho' | 'barba-corta' | 'barba';
export type Sombrero = 'pickelhaube' | 'gorra' | 'chistera' | 'sombrero' | 'kepi' | 'gorra-plana' | 'mitra' | 'birrete' | 'casco';
export type Prenda = 'camisa' | 'uniforme' | 'traje' | 'sudadera' | 'toga' | 'sotana' | 'vestido' | 'mono';
export type Objeto = 'papel' | 'micro' | 'papeleta' | 'libro' | 'cruz' | 'pluma' | 'puntero' | 'puno';

export interface Apariencia {
  piel: string;
  pelo: { color: string; estilo: Pelo };
  vello?: Vello;
  velloColor?: string;
  gafas?: 'redondas' | 'cuadradas';
  sombrero?: Sombrero;
  sombreroColor?: string;
  torso: { color: string; estilo: Prenda };
  pantalon?: string;
  pantalonCorto?: boolean;
  zapatos?: string;
  corbata?: string;
  /** Falda (vestido) o color del peto (mono). */
  falda?: string;
  alzacuellos?: boolean;
  brazalete?: boolean;
  medallas?: boolean;
  panuelo?: string;
  delantal?: boolean;
  ancho?: number;
  alto?: number;
  /** Objeto que lleva en la mano derecha (de la pantalla) si la acción no dice otro. */
  objeto?: Objeto;
}

export interface Pose {
  /** 0 = boca cerrada, 1 = muy abierta. */
  boca: number;
  /** −1 mira a la izquierda de la pantalla, 1 a la derecha. */
  mirada: number;
  /** 0 = ojos abiertos, 1 = cerrados. */
  parpadeo: number;
  /** Inclinación de la cabeza (grados). */
  cabeza: number;
  /** [levantar, doblar] en grados: positivo = hacia fuera y arriba; negativo = hacia el cuerpo. A = brazo de la izquierda de la pantalla. */
  brazoA: [number, number];
  brazoB: [number, number];
  /** Ángulo de las piernas al caminar (grados). */
  piernas: number;
  /** 0–1: respiración. */
  respira: number;
  manoA?: Objeto;
  manoB?: Objeto;
}

export const POSE_BASE: Pose = { boca: 0, mirada: 0, parpadeo: 0, cabeza: 0, brazoA: [8, 6], brazoB: [8, 6], piernas: 0, respira: 0 };

/** Oscurece (f < 1) o aclara (f > 1) un color #rrggbb. */
export function tono(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f)));
  const r = c((n >> 16) & 255), g = c((n >> 8) & 255), b = c(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const LARGA: Prenda[] = ['toga', 'sotana'];

// ─── Piezas ──────────────────────────────────────────────────────────────

const Pierna: React.FC<{ x: number; ang: number; a: Apariencia; ancho: number }> = ({ x, ang, a, ancho }) => {
  const pc = a.pantalon ?? '#2b3040';
  const zap = a.zapatos ?? '#1d1d22';
  const w = 30 * ancho;
  return (
    <g transform={`rotate(${ang} ${x} -205)`}>
      {a.pantalonCorto ? (
        <>
          <rect x={x - w / 2 + 3} y={-150} width={w - 6} height={130} rx={10} fill={a.piel} />
          <rect x={x - w / 2 + 2} y={-70} width={w - 4} height={50} rx={6} fill="#e8e4d8" />
          <rect x={x - w / 2} y={-212} width={w} height={70} rx={12} fill={pc} />
        </>
      ) : (
        <rect x={x - w / 2} y={-212} width={w} height={196} rx={13} fill={pc} />
      )}
      <ellipse cx={x + (x < 0 ? -7 : 7)} cy={-10} rx={21} ry={11} fill={zap} />
    </g>
  );
};

const ObjetoEnMano: React.FC<{ o: Objeto }> = ({ o }) => {
  switch (o) {
    case 'papel':
      return (
        <g>
          <rect x={-17} y={62} width={34} height={44} rx={2} fill="#f3f0e6" stroke="#c9c3b2" strokeWidth={1.5} />
          {[74, 82, 90, 98].map((y) => <line key={y} x1={-11} x2={11} y1={y} y2={y} stroke="#9b9585" strokeWidth={2} />)}
        </g>
      );
    case 'micro':
      return (
        <g>
          <rect x={-5} y={66} width={10} height={34} rx={4} fill="#26262b" />
          <circle cx={0} cy={106} r={11} fill="#6d6f78" stroke="#2b2b30" strokeWidth={2} />
        </g>
      );
    case 'papeleta':
      return (
        <g>
          <rect x={-12} y={70} width={24} height={30} rx={2} fill="#fbfaf4" stroke="#bbb" strokeWidth={1.5} />
          <path d="M -6 79 L 6 91 M 6 79 L -6 91" stroke="#c0392b" strokeWidth={3} />
        </g>
      );
    case 'libro':
      return <rect x={-18} y={60} width={36} height={28} rx={3} fill="#8a4b2a" stroke="#5b2f19" strokeWidth={2} />;
    case 'cruz':
      return <path d="M 0 66 L 0 104 M -10 78 L 10 78" stroke="#d8b552" strokeWidth={5} strokeLinecap="round" />;
    case 'pluma':
      return <line x1={0} y1={66} x2={0} y2={98} stroke="#1e1e24" strokeWidth={5} strokeLinecap="round" />;
    case 'puntero':
      return <line x1={0} y1={66} x2={0} y2={150} stroke="#d9c9a0" strokeWidth={4} strokeLinecap="round" />;
    case 'puno':
      return null;
  }
};

const Brazo: React.FC<{ lado: -1 | 1; lb: [number, number]; a: Apariencia; manga: string; ancho: number; obj?: Objeto; brazalete?: boolean }> = ({
  lado, lb, a, manga, ancho, obj, brazalete,
}) => {
  const sx = lado * 49 * ancho;
  const arriba = -lado * lb[0];
  const codo = -lado * lb[1];
  const grosor = 24 * Math.min(1.25, ancho);
  return (
    <g transform={`translate(${sx} -327) rotate(${arriba})`}>
      <rect x={-grosor / 2} y={-6} width={grosor} height={84} rx={grosor / 2} fill={manga} />
      {brazalete ? <rect x={-grosor / 2 - 0.5} y={20} width={grosor + 1} height={14} fill="#b8322a" /> : null}
      <g transform={`translate(0 72) rotate(${codo})`}>
        <rect x={-grosor / 2 + 1} y={-6} width={grosor - 2} height={74} rx={(grosor - 2) / 2} fill={manga} />
        <circle cx={0} cy={70} r={obj === 'puno' ? 14 : 12.5} fill={a.piel} stroke={tono(a.piel, 0.85)} strokeWidth={1.5} />
        {obj ? <ObjetoEnMano o={obj} /> : null}
      </g>
    </g>
  );
};

const Torso: React.FC<{ a: Apariencia; ancho: number }> = ({ a, ancho }) => {
  const c = a.torso.color;
  const est = a.torso.estilo;
  const sw = 50 * ancho;
  const ww = (ancho > 1.2 ? 52 : 44) * ancho;
  const oscuro = tono(c, 0.78);
  const cuerpo = `M ${-sw} -336 Q ${-sw - 8} -332 ${-sw - 6} -300 L ${-ww} -198 L ${ww} -198 L ${sw + 6} -300 Q ${sw + 8} -332 ${sw} -336 Q 0 -350 ${-sw} -336 Z`;
  const larga = LARGA.includes(est);
  const falda = est === 'vestido' ? (a.falda ?? c) : larga ? c : null;
  return (
    <g>
      {falda ? (
        <path d={`M ${-ww} -205 L ${ww} -205 L ${(larga ? 66 : 62) * ancho} ${larga ? -30 : -105} Q 0 ${larga ? -22 : -96} ${-(larga ? 66 : 62) * ancho} ${larga ? -30 : -105} Z`} fill={falda} />
      ) : null}
      <path d={cuerpo} fill={c} />
      {ancho > 1.2 ? <ellipse cx={0} cy={-248} rx={ww + 8} ry={58} fill={c} /> : null}
      {est === 'camisa' ? (
        <g>
          <path d="M -16 -344 L 0 -318 L 16 -344 L 8 -348 L 0 -334 L -8 -348 Z" fill={oscuro} />
          {[-305, -278, -251, -224].map((y) => <circle key={y} cx={0} cy={y} r={2.6} fill={oscuro} />)}
          <rect x={-sw + 14} y={-312} width={24} height={20} rx={3} fill="none" stroke={oscuro} strokeWidth={2.5} />
        </g>
      ) : null}
      {est === 'uniforme' ? (
        <g>
          <path d="M -18 -346 L 0 -322 L 18 -346 L 10 -350 L 0 -338 L -10 -350 Z" fill={oscuro} />
          <path d={`M ${sw - 6} -334 L ${-ww + 10} -212`} stroke="#3a2a1a" strokeWidth={7} />
          <rect x={-ww - 1} y={-222} width={ww * 2 + 2} height={14} fill="#3a2a1a" />
          <rect x={-8} y={-223} width={16} height={16} rx={2} fill="#bfa25a" />
          <rect x={-sw + 12} y={-314} width={26} height={22} rx={3} fill={oscuro} />
          <rect x={sw - 38} y={-314} width={26} height={22} rx={3} fill={oscuro} />
          {[-300, -275, -250].map((y) => <circle key={y} cx={0} cy={y} r={2.8} fill="#cfc6a8" />)}
        </g>
      ) : null}
      {est === 'traje' ? (
        <g>
          <path d="M -16 -346 L 0 -292 L 16 -346 Z" fill="#f1efe8" />
          <path d="M -6 -340 L 6 -340 L 9 -300 L 0 -288 L -9 -300 Z" fill={a.corbata ?? '#7a2c2c'} />
          <path d="M -16 -346 L -4 -292 L -24 -312 Z M 16 -346 L 4 -292 L 24 -312 Z" fill={oscuro} />
          {[-262, -236].map((y) => <circle key={y} cx={-3} cy={y} r={3} fill={tono(c, 0.6)} />)}
        </g>
      ) : null}
      {est === 'sudadera' ? (
        <g>
          <path d="M -30 -344 Q 0 -326 30 -344 Q 0 -334 -30 -344 Z" fill={oscuro} />
          <line x1={-8} y1={-338} x2={-10} y2={-300} stroke="#f5f5f5" strokeWidth={3} strokeLinecap="round" />
          <line x1={8} y1={-338} x2={10} y2={-300} stroke="#f5f5f5" strokeWidth={3} strokeLinecap="round" />
          <path d={`M -30 -246 L 30 -246 L 36 -210 L -36 -210 Z`} fill={oscuro} />
          <rect x={-ww} y={-212} width={ww * 2} height={12} fill={oscuro} />
        </g>
      ) : null}
      {est === 'toga' ? (
        <g>
          <rect x={-10} y={-344} width={8} height={26} fill="#f3f1ea" />
          <rect x={2} y={-344} width={8} height={26} fill="#f3f1ea" />
        </g>
      ) : null}
      {est === 'mono' ? (
        <g>
          <path d={`M -30 -300 L 30 -300 L ${ww} -198 L ${-ww} -198 Z`} fill={a.falda ?? '#3b5a8c'} />
          <line x1={-30} y1={-300} x2={-36} y2={-342} stroke={a.falda ?? '#3b5a8c'} strokeWidth={9} />
          <line x1={30} y1={-300} x2={36} y2={-342} stroke={a.falda ?? '#3b5a8c'} strokeWidth={9} />
          <circle cx={-26} cy={-296} r={4} fill="#d8c27a" />
          <circle cx={26} cy={-296} r={4} fill="#d8c27a" />
        </g>
      ) : null}
      {est === 'vestido' ? <path d="M -18 -346 Q 0 -326 18 -346 L 12 -350 Q 0 -336 -12 -350 Z" fill="#f4f1e8" /> : null}
      {a.delantal ? <path d={`M -34 -262 L 34 -262 L 46 -118 Q 0 -110 -46 -118 Z`} fill="#f3efe4" stroke="#d9d2c1" strokeWidth={2} /> : null}
      {a.alzacuellos ? <rect x={-9} y={-348} width={18} height={10} rx={2} fill="#f6f6f2" /> : null}
      {a.panuelo ? <path d="M -22 -346 L 22 -346 L 0 -300 Z" fill={a.panuelo} /> : null}
      {a.medallas ? (
        <g>
          {[-30, -16, -2].map((x) => (
            <g key={x}>
              <rect x={x - 4} y={-322} width={8} height={10} fill="#8a2b2b" />
              <circle cx={x} cy={-306} r={5.5} fill="#d9b44a" stroke="#8a6d20" strokeWidth={1.2} />
            </g>
          ))}
        </g>
      ) : null}
    </g>
  );
};

const PeloDetras: React.FC<{ a: Apariencia }> = ({ a }) => {
  const c = a.pelo.color;
  if (a.pelo.estilo === 'coleta')
    return (
      <g>
        <path d="M 24 -432 C 74 -430 84 -372 60 -330 C 54 -356 50 -392 18 -416 Z" fill={c} />
        <ellipse cx={30} cy={-428} rx={8} ry={6} fill="#e8536c" />
      </g>
    );
  if (a.pelo.estilo === 'trenzas')
    return (
      <g>
        {[-1, 1].map((s) => (
          <g key={s}>
            {[0, 1, 2, 3].map((k) => <ellipse key={k} cx={s * 40} cy={-388 + k * 18} rx={9} ry={11} fill={c} />)}
            <ellipse cx={s * 40} cy={-316} rx={5} ry={4} fill="#b8322a" />
          </g>
        ))}
      </g>
    );
  if (a.pelo.estilo === 'mono') return <circle cx={0} cy={-452} r={17} fill={c} />;
  return null;
};

const PeloDelante: React.FC<{ a: Apariencia }> = ({ a }) => {
  const c = a.pelo.color;
  const gorro = 'M -39 -404 C -42 -452 42 -454 39 -404 C 32 -430 -30 -431 -39 -404 Z';
  switch (a.pelo.estilo) {
    case 'corto':
      return <path d="M -39 -402 C -44 -455 44 -457 39 -402 C 36 -420 26 -432 0 -433 C -26 -432 -36 -420 -39 -402 Z" fill={c} />;
    case 'peinado':
      return (
        <g>
          <path d="M -39 -398 C -44 -456 44 -458 39 -398 C 34 -428 -18 -440 -39 -398 Z" fill={c} />
          <path d="M -20 -440 C 0 -448 20 -444 28 -436" stroke={tono(c, 1.5)} strokeWidth={3} fill="none" opacity={0.6} />
        </g>
      );
    case 'flequillo':
      return (
        <g>
          <path d={gorro} fill={c} />
          <path d="M 34 -432 C 6 -428 -18 -416 -32 -392 L -24 -394 C -12 -410 10 -420 36 -420 Z" fill={c} />
        </g>
      );
    case 'raya':
      return (
        <g>
          <path d="M -39 -402 C -44 -455 44 -457 39 -402 C 36 -420 26 -432 0 -433 C -26 -432 -36 -420 -39 -402 Z" fill={c} />
          <path d="M -14 -447 L -16 -430" stroke={tono(c, 0.6)} strokeWidth={2.5} />
        </g>
      );
    case 'calvo':
      return (
        <g>
          <ellipse cx={-35} cy={-412} rx={7} ry={14} fill={c} />
          <ellipse cx={35} cy={-412} rx={7} ry={14} fill={c} />
        </g>
      );
    case 'coleta':
      return (
        <g>
          <path d={gorro} fill={c} />
          <path d="M -36 -410 C -30 -440 10 -446 30 -430 C 6 -428 -20 -420 -36 -398 Z" fill={c} />
        </g>
      );
    case 'trenzas':
    case 'mono':
      return (
        <g>
          <path d={gorro} fill={c} />
          <path d="M 0 -444 L 0 -432" stroke={tono(c, 0.7)} strokeWidth={2.5} />
        </g>
      );
    case 'rizado':
      return (
        <g>
          {[-30, -15, 0, 15, 30].map((x, i) => <circle key={x} cx={x} cy={-430 - (i % 2) * 8 - (Math.abs(x) < 20 ? 8 : 0)} r={14} fill={c} />)}
        </g>
      );
  }
};

const VelloFacial: React.FC<{ v: Vello; c: string; m: number }> = ({ v, c, m }) => {
  const dx = m * 4;
  switch (v) {
    case 'bigotito':
      return <rect x={dx - 7} y={-391} width={14} height={7} rx={1.5} fill={c} />;
    case 'bigote':
      return <path transform={`translate(${dx} 0)`} d="M -17 -385 Q 0 -396 17 -385 Q 10 -378 0 -383 Q -10 -378 -17 -385 Z" fill={c} />;
    case 'mostacho':
      return (
        <path
          transform={`translate(${dx} 0)`}
          d="M -34 -378 Q -20 -400 0 -390 Q 20 -400 34 -378 Q 26 -370 14 -378 Q 0 -372 -14 -378 Q -26 -370 -34 -378 Z"
          fill={c}
        />
      );
    case 'barba-corta':
      return (
        <g>
          <path d="M -37 -404 Q -38 -356 0 -352 Q 38 -356 37 -404 Q 32 -372 14 -370 Q 0 -366 -14 -370 Q -32 -372 -37 -404 Z" fill={c} opacity={0.92} />
          <path transform={`translate(${dx} 0)`} d="M -14 -386 Q 0 -393 14 -386 Q 8 -381 0 -384 Q -8 -381 -14 -386 Z" fill={c} />
        </g>
      );
    case 'barba':
      return (
        <g>
          <path d="M -38 -406 Q -40 -340 0 -332 Q 40 -340 38 -406 Q 32 -372 14 -369 Q 0 -365 -14 -369 Q -32 -372 -38 -406 Z" fill={c} />
          <path transform={`translate(${dx} 0)`} d="M -15 -386 Q 0 -394 15 -386 Q 8 -380 0 -384 Q -8 -380 -15 -386 Z" fill={c} />
        </g>
      );
  }
};

const SombreroSvg: React.FC<{ s: Sombrero; c?: string }> = ({ s, c }) => {
  switch (s) {
    case 'pickelhaube':
      return (
        <g>
          <path d="M -42 -418 C -42 -474 42 -474 42 -418 Z" fill="#2a2b2f" />
          <rect x={-46} y={-424} width={92} height={8} rx={3} fill="#c9a84a" />
          <rect x={-7} y={-470} width={14} height={8} fill="#c9a84a" />
          <path d="M -5 -468 L 0 -500 L 5 -468 Z" fill="#d6b65a" />
        </g>
      );
    case 'gorra': {
      const k = c ?? '#55606c';
      return (
        <g>
          <path d="M -38 -436 C -54 -460 54 -460 38 -436 Z" fill={k} />
          <rect x={-38} y={-440} width={76} height={18} fill={tono(k, 0.75)} />
          <path d="M -38 -422 Q 0 -408 38 -422 L 32 -416 Q 0 -402 -32 -416 Z" fill="#17171b" />
          <circle cx={0} cy={-444} r={4} fill="#c9a84a" />
        </g>
      );
    }
    case 'chistera':
      return (
        <g>
          <rect x={-27} y={-506} width={54} height={74} rx={3} fill="#141419" />
          <rect x={-27} y={-448} width={54} height={10} fill="#5a1e1e" />
          <ellipse cx={0} cy={-434} rx={46} ry={8} fill="#141419" />
        </g>
      );
    case 'sombrero': {
      const k = c ?? '#3b3530';
      return (
        <g>
          <path d="M -31 -432 C -33 -478 33 -478 31 -432 Z" fill={k} />
          <path d="M -10 -470 Q 0 -462 10 -470" stroke={tono(k, 0.6)} strokeWidth={3} fill="none" />
          <rect x={-31} y={-446} width={62} height={9} fill={tono(k, 0.55)} />
          <ellipse cx={0} cy={-432} rx={52} ry={9} fill={k} />
        </g>
      );
    }
    case 'kepi': {
      const k = c ?? '#8a6a45';
      return (
        <g>
          <path d="M -35 -424 L -30 -466 L 33 -460 L 37 -424 Z" fill={k} />
          <rect x={-36} y={-434} width={73} height={10} fill={tono(k, 0.7)} />
          <path d="M -36 -424 Q 0 -412 37 -424 L 30 -418 Q 0 -408 -30 -418 Z" fill="#2a1f16" />
        </g>
      );
    }
    case 'gorra-plana': {
      const k = c ?? '#4a4a4f';
      return <path d="M -41 -418 C -44 -458 42 -460 46 -420 Q 58 -412 46 -408 Q 0 -414 -41 -418 Z" fill={k} />;
    }
    case 'mitra':
      return (
        <g>
          <path d="M -31 -428 L -27 -482 Q 0 -514 27 -482 L 31 -428 Z" fill="#f4efe2" />
          <path d="M 0 -500 L 0 -432 M -12 -470 L 12 -470" stroke="#d1a93e" strokeWidth={5} />
        </g>
      );
    case 'birrete':
      return (
        <g>
          <rect x={-32} y={-458} width={64} height={28} rx={5} fill="#1b1b20" />
          <circle cx={0} cy={-462} r={6} fill="#1b1b20" />
        </g>
      );
    case 'casco':
      return <path d="M -44 -412 C -48 -476 48 -476 44 -412 L 54 -400 Q 0 -408 -54 -400 Z" fill={c ?? '#5d6656'} />;
  }
};

const Cabeza: React.FC<{ a: Apariencia; p: Pose }> = ({ a, p }) => {
  const m = Math.max(-1, Math.min(1, p.mirada));
  const ex = m * 5;
  const ry = Math.max(0.6, 5.8 * (1 - 0.92 * p.parpadeo));
  const piel = a.piel;
  const boca = Math.max(0, Math.min(1, p.boca));
  const cejas = a.pelo.estilo === 'calvo' ? a.pelo.color : tono(a.pelo.color, 0.85);
  return (
    <g transform={`rotate(${p.cabeza} 0 -360)`}>
      <PeloDetras a={a} />
      <rect x={-12} y={-364} width={24} height={36} fill={tono(piel, 0.9)} />
      <ellipse cx={-37} cy={-398} rx={7} ry={10} fill={tono(piel, 0.92)} />
      <ellipse cx={37} cy={-398} rx={7} ry={10} fill={tono(piel, 0.92)} />
      <ellipse cx={0} cy={-400} rx={37} ry={43} fill={piel} />
      <circle cx={-22 + ex * 0.6} cy={-386} r={6} fill="#ff8f8f" opacity={0.22} />
      <circle cx={22 + ex * 0.6} cy={-386} r={6} fill="#ff8f8f" opacity={0.22} />
      {[-1, 1].map((s) => (
        <g key={s}>
          <ellipse cx={s * 14 + ex} cy={-404} rx={4.6} ry={ry} fill="#1c1c26" />
          {p.parpadeo < 0.5 ? <circle cx={s * 14 + ex + 1.6} cy={-406} r={1.4} fill="#fff" /> : null}
          <path d={`M ${s * 14 + ex - 7} ${-417 + (s === 1 ? 0 : 0)} Q ${s * 14 + ex} ${-421} ${s * 14 + ex + 7} -417`} stroke={cejas} strokeWidth={3.4} strokeLinecap="round" fill="none" />
        </g>
      ))}
      <path d={`M ${ex * 1.2} -399 q 4 9 -2 11`} stroke={tono(piel, 0.72)} strokeWidth={2.6} strokeLinecap="round" fill="none" />
      {boca > 0.06 ? (
        <g>
          <ellipse cx={ex * 0.8} cy={-375} rx={8.5 - boca * 1.5} ry={2 + boca * 8} fill="#4a1a20" />
          <ellipse cx={ex * 0.8} cy={-371 + boca * 3} rx={4.5} ry={1.5 + boca * 2.5} fill="#d9646b" opacity={boca > 0.3 ? 1 : 0} />
        </g>
      ) : (
        <path d={`M ${ex * 0.8 - 8} -377 Q ${ex * 0.8} -370 ${ex * 0.8 + 8} -377`} stroke="#7a3b3b" strokeWidth={3} strokeLinecap="round" fill="none" />
      )}
      {a.vello ? <VelloFacial v={a.vello} c={a.velloColor ?? a.pelo.color} m={m} /> : null}
      <PeloDelante a={a} />
      {a.gafas ? (
        <g stroke="#1f1f26" strokeWidth={2.6} fill="rgba(255,255,255,0.1)">
          {a.gafas === 'redondas' ? (
            <>
              <circle cx={-14 + ex} cy={-404} r={10} />
              <circle cx={14 + ex} cy={-404} r={10} />
            </>
          ) : (
            <>
              <rect x={-26 + ex} y={-413} width={22} height={17} rx={4} />
              <rect x={4 + ex} y={-413} width={22} height={17} rx={4} />
            </>
          )}
          <line x1={-4 + ex} y1={-405} x2={4 + ex} y2={-405} />
        </g>
      ) : null}
      {a.sombrero ? <SombreroSvg s={a.sombrero} c={a.sombreroColor} /> : null}
    </g>
  );
};

/** Figura completa en coordenadas locales (pies en el origen). */
export const PersonaG: React.FC<{ a: Apariencia; p: Pose }> = ({ a, p }) => {
  const ancho = a.ancho ?? 1;
  const manga = a.torso.estilo === 'mono' ? a.torso.color : a.torso.color;
  const sube = -p.respira * 3;
  return (
    <g transform={`scale(${a.alto ?? 1})`}>
      <Pierna x={-19 * Math.min(ancho, 1.3)} ang={p.piernas} a={a} ancho={Math.min(ancho, 1.3)} />
      <Pierna x={19 * Math.min(ancho, 1.3)} ang={-p.piernas} a={a} ancho={Math.min(ancho, 1.3)} />
      <g transform={`translate(0 ${sube})`}>
        <Torso a={a} ancho={ancho} />
        <Cabeza a={a} p={p} />
        <Brazo lado={-1} lb={p.brazoA} a={a} manga={manga} ancho={ancho} obj={p.manoA} brazalete={a.brazalete} />
        <Brazo lado={1} lb={p.brazoB} a={a} manga={manga} ancho={ancho} obj={p.manoB} />
      </g>
    </g>
  );
};

/** Figura como <svg> suelto de 260×510 px a escala 1. */
export const Persona: React.FC<{ a: Apariencia; p: Pose; escala?: number; style?: React.CSSProperties }> = ({ a, p, escala = 1, style }) => (
  <svg width={260 * escala} height={515 * escala} viewBox="-130 -505 260 515" style={{ overflow: 'visible', ...style }}>
    <PersonaG a={a} p={p} />
  </svg>
);
