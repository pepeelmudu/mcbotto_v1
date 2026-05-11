import type { StageComposition } from '../lib/stage';

// Canvas mobile vertical: 1080x3500.
export const HERO_CANVAS_MOBILE = { w: 1080, h: 3500 } as const;

const MACHINE_CANVAS = { w: 1154, h: 3777 } as const;

// Maquina: w=700, h=700/0.3056=2291. Centrada: x=(1080-700)/2=190, y=330.
const GROUP_PSD = { x: 190, y: 330, w: 700, h: 2291 };

// Mismo recorte de pantalla que desktop (proporcional al video 9:16).
const SCREEN_IN_MACHINE = { x: 182, y: 55, w: 790, h: 1404 };

// Patatas mobile: w=900, h=900/1.339=672.
// Rojo empieza al 38% de 3500=1330px. Bloque rojo: 1330-3500=2170px.
// Centro y = 1330+1085=2415. y_fries=2415-336=2079.
// Cortadas a la mitad: x_izq=-(900/2)=-450, x_der=1080-450=630.
const FRIES_W = 900;
const FRIES_H = Math.round(FRIES_W / 1.339); // 672

export const heroMobile: StageComposition = {
  canvas: HERO_CANVAS_MOBILE,
  layers: [
    {
      id: 'logo',
      kind: 'svg',
      src: '/assets/vectores/logo_botto_2.svg',
      alt: 'Botto',
      psd: { x: 240, y: 50, w: 600, h: 210 },
      z: 5,
      tint: 'var(--color-red)',
      anim: { type: 'slide-down', duration: 800 },
    },
    // Ketchup mobile: debajo de McBotto.com, zona amarilla.
    {
      id: 'ketchup',
      kind: 'img',
      src: '/assets/imagenes/ketchup_0_comp.png',
      alt: 'Ketchup McBotto',
      psd: { x: 20, y: 60, w: 760, h: 1560 },
      z: 1,
      fit: 'contain',
    },
    {
      id: 'machine-assembly',
      kind: 'group',
      psd: GROUP_PSD,
      z: 4,
      canvas: MACHINE_CANVAS,
      anim: { type: 'slide-up', delay: 200, duration: 1100 },
      layers: [
        {
          id: 'screen',
          kind: 'video',
          src: '/assets/videos/patatas_v3.mp4',
          psd: SCREEN_IN_MACHINE,
          z: 1,
          fit: 'cover',
          className: 'is-interactive',
        },
        {
          id: 'machine',
          kind: 'img',
          src: '/assets/imagenes/maquina_web_v2_comp.png',
          alt: 'Maquina de pedidos McBotto',
          psd: { x: 0, y: 0, w: MACHINE_CANVAS.w, h: MACHINE_CANVAS.h },
          z: 2,
          fit: 'contain',
        },
        // Rana x1.5 mas grande y 150 hero-px mas lejos (mismas coords que desktop).
        {
          id: 'rana',
          kind: 'img',
          src: '/assets/imagenes/rana_web_1_comp.png',
          alt: 'Rana coleccionable McBotto',
          psd: { x: 1338, y: 400, w: 1200, h: 1718 },
          z: 1,
          fit: 'contain',
          anim: { type: 'slide-right', delay: 400, duration: 900 },
        },
        // Badge "30 units" encima de la rana.
        {
          id: '30units',
          kind: 'img',
          src: '/assets/imagenes/30_units_comp.png',
          alt: '30 units',
          psd: { x: 1430, y: 1300, w: 400, h: 400 },
          z: 3,
          fit: 'contain',
          anim: { type: 'zoom', delay: 600, duration: 700 },
        },
        // Ticket animado hover.
        {
          id: 'ticket',
          kind: 'video',
          src: '/assets/animations/tikcet_seq_1.webm',
          psd: { x: -1400, y: 1200, w: 1000, h: 1500 },
          z: 1,
          fit: 'contain',
          hoverPlay: true,
          anim: { type: 'slide-left', delay: 400, duration: 900 },
        },
      ],
    },
    // Menu: centrado debajo de la maquina. z:6.
    // Maquina mobile termina en y=330+2291=2621.
    {
      id: 'menu',
      kind: 'img',
      src: '/assets/imagenes/menu_web_v3_comp.png',
      alt: 'Menu McBotto',
      psd: { x: 40, y: 2150, w: 800, h: 544 },
      z: 6,
      fit: 'contain',
    },
    {
      id: 'piernas',
      kind: 'img',
      src: '/assets/imagenes/piernas_payaso_comp.png',
      alt: '',
      psd: { x: 140, y: 2800, w: 800, h: 600 },
      z: 5,
      fit: 'contain',
    },
    // Ketchup3: arriba a la derecha, cortado por borde derecho y superior.
    {
      id: 'ketchup3',
      kind: 'img',
      src: '/assets/imagenes/ketchup3_comp.png',
      alt: '',
      psd: { x: 700, y: -250, w: 560, h: 1141 },
      z: 1,
      fit: 'contain',
    },
    // Ketchup a la derecha de las piernas, cortado por el borde derecho.
    {
      id: 'ketchup-right',
      kind: 'img',
      src: '/assets/imagenes/ketchup_1_comp.png',
      alt: '',
      psd: { x: 720, y: 2450, w: 560, h: 1141 },
      z: 1,
      fit: 'contain',
    },
    // Fries izquierda (v2).
    {
      id: 'fries-left',
      kind: 'img',
      src: '/assets/imagenes/patatas_v2_comp.png',
      alt: '',
      psd: { x: -(FRIES_W * 0.72), y: 2050, w: FRIES_W, h: FRIES_H },
      z: 3,
      fit: 'cover',
    },
    // Fries derecha (v4).
    {
      id: 'fries-right',
      kind: 'img',
      src: '/assets/imagenes/patatas_v2_comp.png',
      alt: '',
      psd: { x: 1080 - FRIES_W * 0.28, y: 2150, w: FRIES_W, h: FRIES_H },
      z: 3,
      fit: 'cover',
    },
  ],
};
