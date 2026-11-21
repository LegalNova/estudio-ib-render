import type { EscenaTela, PropsTela } from './tipos';

// Demo del estilo «dinamico» (ESS, en inglés): una escena de cada tipo nuevo
// más una foto. 7 s por escena, sin audio. Para probar:
//   npx tsx -e "import {DEMO_ESS} from './src/tela/demo-ess'; …" → public/trabajo/tela-demo-ess/props.json

const escenas: Array<Omit<EscenaTela, 'turnos'> & { texto: [string, string] }> = [
  {
    id: 'foto', hilo: 'sostenibilidad', unidad: '1.3 Sustainability', titulo: 'Forests under pressure',
    claves: ['deforestation', 'natural capital'],
    visual: { tipo: 'foto', url: 'https://legalnova.github.io/estudio-ib-medios/imagenes/2914853397f8229994ea.jpg', pie: 'Cleared rainforest, Brazil', credito: 'Wikimedia Commons · CC BY-SA' },
    texto: ['So what does unsustainable use actually look like?', 'This: natural capital used faster than it can renew itself.'],
  },
  {
    id: 'sistema', hilo: 'sistemas', unidad: '1.2 Systems', titulo: 'A system diagram',
    claves: ['inputs', 'storages', 'outputs'],
    visual: { tipo: 'sistema', titulo: 'A lake as an open system', entradas: ['Sunlight', 'River water', 'Nutrients'], almacenes: ['Water', 'Biomass', 'Sediment'], salidas: ['Evaporation', 'Outflow', 'Heat'], nota: 'Open system: exchanges energy AND matter' },
    texto: ['Where do the arrows go?', 'Inputs cross the boundary on the left, outputs leave on the right, storages sit inside.'],
  },
  {
    id: 'bucle-pos', hilo: 'sistemas', unidad: '1.2 Feedback', titulo: 'Positive feedback',
    claves: ['amplifies', 'tipping point'],
    visual: { tipo: 'bucle', titulo: 'Ice–albedo feedback', signo: 'positivo', pasos: ['Warmer climate', 'Ice melts', 'Less sunlight reflected', 'More heat absorbed'], nota: 'Moves the system AWAY from equilibrium' },
    texto: ['Why is it called positive if it is bad?', 'Positive means it amplifies the change, not that it is good.'],
  },
  {
    id: 'bucle-neg', hilo: 'ecologia', unidad: '1.2 Feedback', titulo: 'Negative feedback',
    claves: ['stabilises', 'predator–prey'],
    visual: { tipo: 'bucle', titulo: 'Predator–prey', signo: 'negativo', pasos: ['More hares', 'More lynx', 'Fewer hares', 'Fewer lynx'] },
    texto: ['And negative feedback?', 'It pushes the system back towards equilibrium.'],
  },
  {
    id: 'curva', hilo: 'ecologia', unidad: '2.1 Populations', titulo: 'The S-curve',
    claves: ['exponential growth', 'carrying capacity'],
    visual: { tipo: 'curva', titulo: 'Logistic growth', ejeX: 'Time', ejeY: 'Population size', curva: 'S', marcas: [{ x: 0.3, texto: 'Exponential phase' }, { x: 0.85, texto: 'Carrying capacity (K)' }] },
    texto: ['Why does it flatten?', 'Limiting factors kick in as the population nears carrying capacity.'],
  },
  {
    id: 'curva2', hilo: 'sistemas', unidad: '1.3 Tipping points', titulo: 'Tipping point',
    visual: { tipo: 'curva', titulo: 'A sudden shift', ejeX: 'Time / pressure', ejeY: 'Ecosystem state', curva: 'punto-inflexion', marcas: [{ x: 0.6, texto: 'Tipping point' }] },
    texto: ['Can it go back?', 'Often not easily: the system settles into a new equilibrium.'],
  },
  {
    id: 'piramide', hilo: 'energia', unidad: '2.2 Energy flow', titulo: 'Pyramid of energy',
    claves: ['10% rule', 'trophic level'],
    visual: { tipo: 'piramide', titulo: 'Energy per trophic level (kJ m⁻² yr⁻¹)', niveles: [{ etiqueta: 'Producers', valor: '20,810' }, { etiqueta: 'Primary consumers', valor: '3,368' }, { etiqueta: 'Secondary consumers', valor: '383' }, { etiqueta: 'Tertiary consumers', valor: '21' }] },
    texto: ['Why so little at the top?', 'Most energy is lost as heat through respiration at each level.'],
  },
  {
    id: 'ciclo', hilo: 'carbono', unidad: '2.3 Carbon cycle', titulo: 'The carbon cycle',
    claves: ['stores', 'fluxes', 'sink'],
    visual: {
      tipo: 'ciclo', titulo: 'Stores (GtC) and fluxes',
      almacenes: [
        { id: 'atm', etiqueta: 'Atmosphere', valor: '870 GtC', x: 0.5, y: 0 },
        { id: 'veg', etiqueta: 'Vegetation', valor: '450 GtC', x: 0.08, y: 0.55 },
        { id: 'oce', etiqueta: 'Oceans', valor: '38,000 GtC', x: 0.92, y: 0.55 },
        { id: 'fos', etiqueta: 'Fossil fuels', valor: '1,000 GtC', x: 0.5, y: 1 },
      ],
      flujos: [
        { de: 'atm', a: 'veg', etiqueta: 'Photosynthesis' },
        { de: 'veg', a: 'atm', etiqueta: 'Respiration' },
        { de: 'atm', a: 'oce', etiqueta: 'Dissolving' },
        { de: 'fos', a: 'atm', etiqueta: 'Combustion' },
      ],
    },
    texto: ['Which store is biggest?', 'The oceans, by far: they are the main carbon sink.'],
  },
  {
    id: 'tabla', hilo: 'perspectivas', unidad: '1.1 Perspectives', titulo: 'Environmental value systems',
    visual: {
      tipo: 'tabla', titulo: 'Three EVS compared',
      columnas: ['EVS', 'View of nature', 'Example'],
      filas: [
        ['Technocentric', 'Resource to manage', 'Geoengineering'],
        ['Anthropocentric', 'Managed for people', 'Quotas and taxes'],
        ['Ecocentric', 'Intrinsic value', 'Deep ecology'],
        ['Share of survey (%)', '42.5', '1,250 people'],
      ],
    },
    texto: ['Is one of them right?', 'No: the exam wants you to compare and justify.'],
  },
];

const DUR = 7;
let t = 0;
export const DEMO_ESS: PropsTela = {
  capitulo: { id: 'demo-ess', titulo: 'ESS demo', numero: 3, total: 10 },
  estilo: 'dinamico',
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
        { q: 'H' as const, t: texto[0], inicio: inicio + 0.3, fin: inicio + 2.8 },
        { q: 'E' as const, t: texto[1], inicio: inicio + 3, fin: inicio + DUR - 0.1 },
      ],
    };
  }),
};
