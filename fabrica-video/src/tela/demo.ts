import type { EscenaTela, PropsTela } from './tipos';

// Demo de «La tela»: una escena de cada tipo de visual, 5 s cada una, sin
// audio (los narradores mueven la boca con la oscilación de respaldo).

const escenas: Array<Omit<EscenaTela, 'turnos'> & { texto: [string, string] }> = [
  {
    id: 'portada', hilo: 'inicio', titulo: '¿Cómo lo hizo?',
    visual: { tipo: 'portada', titulo: '¿Cómo lo hizo?', subtitulo: 'De canciller a Führer en 19 meses' },
    texto: ['¿Cómo pasas de canciller con tres ministros a Führer en solo diecinueve meses?', 'Con leyes, con terror y con la ayuda de las élites. Vamos paso a paso.'],
  },
  {
    id: 'figuras', hilo: 'elites', fecha: '30 de enero de 1933', titulo: 'Hitler, canciller', responde: ['E3', 'C1'],
    visual: {
      tipo: 'figuras', lema: '«Lo controlaremos»',
      figuras: [
        { id: 'hindenburg', rol: 'Presidente', accion: 'firma' },
        { id: 'papen', rol: 'Vicecanciller', accion: 'habla', dice: 'En dos meses lo tendremos arrinconado' },
        { id: 'hitler', rol: 'Canciller', accion: 'saluda' },
        { id: 'rohm', rol: 'Jefe de las SA', accion: 'cae', eliminado: true },
      ],
    },
    texto: ['¿Y quién le dio el cargo?', 'Hindenburg, el presidente, convencido por Papen de que podrían controlarlo.'],
  },
  {
    id: 'tarjetas', hilo: 'leyes', titulo: 'Gleichschaltung = coordinación', responde: ['E8'],
    visual: {
      tipo: 'tarjetas',
      tarjetas: [
        { fecha: '31 mar. 1933', titulo: 'Estados', detalle: 'Gobernadores del Reich en los Länder' },
        { fecha: '7 abr. 1933', titulo: 'Funcionarios', detalle: 'Fuera judíos y opositores' },
        { fecha: '2 may. 1933', titulo: 'Sindicatos', detalle: 'Ocupados por las SA; nace el DAF' },
        { fecha: '14 jul. 1933', titulo: 'Partidos', detalle: 'NSDAP, partido único' },
        { fecha: '13 mar. 1933', titulo: 'Prensa y radio', detalle: 'Ministerio de Goebbels', color: 'adoctrinamiento' },
        { fecha: '10 may. 1933', titulo: 'Libros', detalle: 'Quema de libros', color: 'terror' },
      ],
    },
    texto: ['¿Todo a la vez?', 'En unos meses. Por eso se llama coordinación: todo se pinta del mismo color.'],
  },
  {
    id: 'barras', hilo: 'leyes', fecha: '5 de marzo de 1933', titulo: 'Las últimas elecciones', responde: ['E1'],
    visual: {
      tipo: 'barras', titulo: 'Voto (%)', unidad: '%',
      datos: [
        { etiqueta: 'NSDAP', valor: 43.9, color: '#e5484d' },
        { etiqueta: 'SPD', valor: 18.3, color: '#ee7b95' },
        { etiqueta: 'Centro', valor: 13.9, color: '#8b93a3' },
        { etiqueta: 'KPD', valor: 12.3, color: '#9b2c2c' },
        { etiqueta: 'DNVP', valor: 8, color: '#4c8dff' },
      ],
    },
    texto: ['¿Ganó la mayoría?', 'No: un 43,9 %, incluso con represión. Le faltaba la mayoría absoluta.'],
  },
  {
    id: 'interruptores', hilo: 'leyes', fecha: '28 feb. 1933', titulo: 'El Decreto del Incendio', responde: ['C1'],
    visual: { tipo: 'interruptores', titulo: 'Decreto del Incendio · 28 feb. 1933', nota: 'Firmado por Hindenburg · art. 48', items: ['Libertad de expresión y prensa', 'Libertad de reunión', 'Secreto de correo y teléfono', 'Protección contra detenciones'] },
    texto: ['¿Qué derechos se perdieron?', 'Uno detrás de otro: prensa, reunión, correo y la protección contra detenciones.'],
  },
  {
    id: 'cronologia', hilo: 'terror', titulo: '1933, mes a mes', responde: ['E7', 'C3'],
    visual: {
      tipo: 'cronologia',
      puntos: [
        { fecha: '28 feb.', texto: 'Decreto del Incendio', hilo: 'leyes' },
        { fecha: '22 mar.', texto: 'Abre Dachau' },
        { fecha: '23 mar.', texto: 'Ley Habilitante', hilo: 'leyes' },
        { fecha: '26 abr.', texto: 'Nace la Gestapo' },
        { fecha: '2 may.', texto: 'Asalto a los sindicatos' },
        { fecha: '14 jul.', texto: 'Partido único', hilo: 'leyes' },
      ],
    },
    texto: ['Es muchísimo en poco tiempo.', 'Exacto: leyes y terror avanzan a la vez.'],
  },
  {
    id: 'cadena', hilo: 'sociedad', titulo: 'La represión por fases', responde: ['E7'],
    visual: {
      tipo: 'cadena', titulo: 'Martin Niemöller, pastor (idea del poema, resumida)', nota: 'Pasividad y complicidad: úsalo en el ensayo',
      pasos: [
        { titulo: 'Comunistas', detalle: 'Decreto feb. 1933' },
        { titulo: 'Socialistas', detalle: 'SPD prohibido jun. 1933' },
        { titulo: 'Sindicalistas', detalle: '2 may. 1933' },
        { titulo: 'Judíos', detalle: 'Boicot, Núremberg' },
        { titulo: 'Él', detalle: '…y no quedaba nadie' },
      ],
    },
    texto: ['¿Por qué nadie protestó?', 'Porque fueron uno por uno, y cada grupo pensó que no le tocaba.'],
  },
  {
    id: 'balanza', hilo: 'leyes', titulo: '¿Legal o violento?', responde: ['E1'],
    visual: {
      tipo: 'balanza', titulo: '¿Hasta qué punto fue legal?', gana: 'derecha', veredicto: 'Legalidad fabricada con coacción',
      izquierda: { titulo: 'Medidas legales', puntos: ['Decreto del Incendio (art. 48)', 'Ley Habilitante: 444 a 94'] },
      derecha: { titulo: 'Violencia y coacción', puntos: ['SA rodeando el Reichstag', '81 diputados del KPD fuera', 'Dachau y Gestapo'] },
    },
    texto: ['Entonces, ¿legal o no?', 'Legal en la forma, pero hecho con miedo: la balanza cae del lado de la coacción.'],
  },
  {
    id: 'hemiciclo', hilo: 'leyes', fecha: '23 de marzo de 1933', titulo: 'La Ley Habilitante', responde: ['C2'],
    visual: {
      tipo: 'hemiciclo', titulo: 'Reichstag · 647 escaños', total: 647, nota: 'Necesita dos tercios',
      grupos: [
        { etiqueta: 'NSDAP', escanos: 288, color: '#e5484d' },
        { etiqueta: 'DNVP', escanos: 52, color: '#4c8dff' },
        { etiqueta: 'Centro', escanos: 73, color: '#c0c6d2' },
        { etiqueta: 'SPD', escanos: 120, color: '#ee7b95' },
        { etiqueta: 'KPD (sin poder entrar)', escanos: 81, color: '#5a2a2a' },
        { etiqueta: 'Otros', escanos: 33, color: '#6b7280' },
      ],
    },
    texto: ['¿Cómo consiguió los dos tercios?', 'Sin los comunistas, con el Centro a favor y las SA rodeando la sala.'],
  },
  {
    id: 'frase', hilo: 'sociedad', titulo: 'Otto Wels, SPD', responde: ['E7'],
    visual: { tipo: 'frase', texto: 'Podéis quitarnos la libertad y la vida, pero no el honor.', autor: 'Otto Wels, 23 de marzo de 1933' },
    texto: ['¿Nadie dijo nada?', 'Wels sí. Fue el único discurso contra la ley, y el SPD votó que no.'],
  },
  {
    id: 'figuras2', hilo: 'adoctrinamiento', titulo: 'Juventud y familias', responde: ['E6', 'E10', 'C8'],
    visual: {
      tipo: 'figuras',
      figuras: [
        { id: 'chico-hj', accion: 'marcha' },
        { id: 'chica-bdm', accion: 'marcha' },
        { id: 'madre', accion: 'aplaude' },
        { id: 'niemoller', accion: 'protesta', dice: 'Lealtad a Dios' },
        { id: 'juez', accion: 'piensa' },
        { id: 'wels', accion: 'detenido' },
      ],
    },
    texto: ['¿Y los jóvenes?', 'La HJ pasó de cien mil a más de dos millones en 1933.'],
  },
];

const DUR = 5;
let t = 0;
export const DEMO_TELA: PropsTela = {
  capitulo: { id: 'demo', titulo: 'Demo de la tela', numero: 1, total: 5 },
  audio: '',
  duracion: escenas.length * DUR,
  escenas: escenas.map(({ texto, ...e }) => {
    const inicio = t;
    t += DUR;
    return {
      ...e,
      inicio,
      fin: inicio + DUR,
      turnos: [
        { q: 'H' as const, t: texto[0], inicio: inicio + 0.3, fin: inicio + 2.1 },
        { q: 'E' as const, t: texto[1], inicio: inicio + 2.3, fin: inicio + DUR - 0.1 },
      ],
    };
  }),
};
