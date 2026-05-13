import type { StageComposition } from '../lib/stage';

// Canvas mobile vertical: 1080x3500.
// El hero usa este aspect-ratio (1080/3500 = 0.309) en @media (max-width: 768px).
export const HERO_CANVAS_MOBILE = { w: 1080, h: 3500 } as const;

// Sub-canvas del grupo machine-assembly: dimensiones nativas del PNG de la maquina.
const MACHINE_CANVAS = { w: 1154, h: 3777 } as const;

// Maquina centrada ocupando ~67% del ancho mobile. w=720, h=720/0.3056=2356.
// Centrada: x=(1080-720)/2=180. y=400 (debajo del logo).
// Borde inferior: 400+2356=2756 → dentro del canvas (3500). ✓
const GROUP_PSD = { x: 180, y: 400, w: 720, h: 2356 };

// Pantalla del video (mismo recorte interno que desktop, escala automaticamente).
const SCREEN_IN_MACHINE = { x: 182, y: 55, w: 790, h: 1404 };

// Patatas mobile (mas pequeñas que desktop): w=720, h=720/1.339=538.
const FRIES_W = 720;
const FRIES_H = Math.round(FRIES_W / 1.339);

export const heroMobile: StageComposition = {
  canvas: HERO_CANVAS_MOBILE,
  layers: [
    // Logo Botto: centrado, parte superior amarilla.
    {
      id: 'logo',
      kind: 'svg',
      src: '/assets/vectores/logo_botto_2.svg',
      alt: 'Botto',
      psd: { x: 240, y: 80, w: 600, h: 210 },
      z: 5,
      tint: 'var(--color-red)',
      anim: { type: 'slide-down', duration: 800 },
    },
    // Ketchup grande izquierda en la zona amarilla, cortado por la izq.
    {
      id: 'ketchup',
      kind: 'img',
      src: '/assets/imagenes/ketchup_0_comp.png',
      alt: 'Ketchup McBotto',
      psd: { x: -250, y: 250, w: 700, h: 1425 },
      z: 1,
      fit: 'contain',
    },
    // Ketchup3: arriba a la derecha, cortado por borde derecho y superior.
    {
      id: 'ketchup3',
      kind: 'img',
      src: '/assets/imagenes/ketchup3_comp.png',
      alt: '',
      psd: { x: 600, y: -180, w: 700, h: 1426 },
      z: 1,
      fit: 'contain',
    },
    // Maquina + video + rana + 30units + ticket: grupo con escalado linkeado.
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
        // Rana: 20% mas pequeña y desplazada a la izquierda.
        {
          id: 'rana',
          kind: 'img',
          src: '/assets/imagenes/rana_web_1_comp.png',
          alt: 'Rana coleccionable McBotto',
          psd: { x: 800, y: 400, w: 1152, h: 1650 },
          z: 1,
          fit: 'contain',
          anim: { type: 'slide-right', delay: 400, duration: 900 },
        },
        // Badge "30 units" sobre la rana (acompañada hacia la izquierda).
        {
          id: '30units',
          kind: 'img',
          src: '/assets/imagenes/30_units_comp.png',
          alt: '30 units',
          psd: { x: 1000, y: 1150, w: 360, h: 360 },
          z: 3,
          fit: 'contain',
          anim: { type: 'zoom', delay: 600, duration: 700 },
        },
        // Nota: en mobile NO se renderiza el ticket animado del hero.
        // Se traslada a una posicion encima del redeem code (ver main.ts).
      ],
    },
    // Patatas izquierda: cortadas por el borde izquierdo, en el bloque rojo.
    {
      id: 'fries-left',
      kind: 'img',
      src: '/assets/imagenes/patatas_v2_comp.png',
      alt: '',
      psd: { x: -(FRIES_W * 0.6), y: 1850, w: FRIES_W, h: FRIES_H },
      z: 3,
      fit: 'cover',
    },
    // Patatas derecha: cortadas por el borde derecho, en el bloque rojo.
    {
      id: 'fries-right',
      kind: 'img',
      src: '/assets/imagenes/patatas_v2_comp.png',
      alt: '',
      psd: { x: 1080 - FRIES_W * 0.4, y: 1950, w: FRIES_W, h: FRIES_H },
      z: 3,
      fit: 'cover',
    },
    // Menu: 1.5x mas grande que el ancho del canvas (asoma por los lados).
    // Ratio menu (2240/1520=1.47). w=1620 (1080 x 1.5), h=1102 (735 x 1.5).
    // Base aprox. donde estaba antes (y_bottom~2885) para que las piernas
    // sigan asomando justo debajo.
    {
      id: 'menu',
      kind: 'img',
      src: '/assets/imagenes/menu_web_v3_comp.png',
      alt: 'Menu McBotto',
      psd: { x: -270, y: 1783, w: 1620, h: 1102 },
      z: 6,
      fit: 'contain',
    },
    // Piernas del payaso: asoman justo por debajo del menu.
    // Menu termina en y=2885; piernas en y=2780 para solapar un poco.
    // Ratio piernas (840/630=1.33). w=540, h=405.
    {
      id: 'piernas',
      kind: 'img',
      src: '/assets/imagenes/piernas_payaso_comp.png',
      alt: '',
      psd: { x: 270, y: 2780, w: 540, h: 405 },
      z: 5,
      fit: 'contain',
    },
    // Ketchup a la derecha de las piernas, cortado por el borde derecho.
    {
      id: 'ketchup-right',
      kind: 'img',
      src: '/assets/imagenes/ketchup_1_comp.png',
      alt: '',
      psd: { x: 580, y: 2700, w: 900, h: 1832 },
      z: 1,
      fit: 'contain',
    },
  ],
};
