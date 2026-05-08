import type { StageComposition } from '../lib/stage';

// Canvas del hero desktop: 1920x3100 para que la maquina x2 quepa completa.
export const HERO_CANVAS_DESKTOP = { w: 1920, h: 3100 } as const;

// Sub-canvas del grupo: dimensiones nativas del PNG de la maquina (1154x3777).
const MACHINE_CANVAS = { w: 1154, h: 3777 } as const;

// Maquina al 80% del doble anterior (840*0.8=672).
// Ratio PNG: 0.3056. w=672 → h=672/0.3056=2199.
// Centrado: x=(1920-672)/2=624. y=330.
// Borde inferior: 330+2199=2529 → dentro del canvas (3100). ✓
const GROUP_PSD = { x: 624, y: 330, w: 672, h: 2199 };

// Video: subido 100 machine-canvas-px adicionales (155→55).
// Box = proporcional al video 1080x1920 (9:16): w=790, h=1404.
const SCREEN_IN_MACHINE = { x: 182, y: 55, w: 790, h: 1404 };

// Patatas DOBLE (720→1440), sin animacion.
// Centradas verticalmente en el bloque rojo:
//   Rojo empieza al 40% del canvas = 0.40 * 3100 = 1240px.
//   Bloque rojo: 1240 a 3100, alto=1860px.
//   y_centro = 1240 + 1860/2 = 2170. y_fries = 2170 - 1076/2 = 1632.
// Cortadas exactamente a la mitad por cada borde del viewport:
//   x_izq = -(1440/2) = -720  (mitad fuera por la izquierda)
//   x_der = 1920-(1440/2) = 1200  (mitad fuera por la derecha)
const FRIES_W = 1440;
const FRIES_H = Math.round(FRIES_W / 1.339); // 1075 (~1076)

export const heroDesktop: StageComposition = {
  canvas: HERO_CANVAS_DESKTOP,
  layers: [
    // Logo Botto: centrado, parte superior amarilla.
    {
      id: 'logo',
      kind: 'svg',
      src: '/assets/vectores/logo_botto_2.svg',
      alt: 'Botto',
      psd: { x: 660, y: 30, w: 600, h: 210 },
      z: 5,
      tint: 'var(--color-red)',
      anim: { type: 'slide-down', duration: 800 },
    },
    // Ketchup: debajo de McBotto.com, zona amarilla.
    // McBotto.com (fixed) aparece a ~44px desde arriba del viewport → en canvas ≈ y:60.
    // El box cabe entero en la zona amarilla (y:60 a y:1180 < limite rojo en y≈1302).
    // z:1 → por debajo del hero::after (rojo, z:2). En la zona amarilla el ::after
    // está clippeado y el ketchup se ve. Si deseas que "entre" al rojo, baja el y.
    {
      id: 'ketchup',
      kind: 'img',
      src: '/assets/imagenes/ketchup_0.png',
      alt: 'Ketchup McBotto',
      psd: { x: -670, y: -490, w: 1122, h: 2285 },
      z: 1,
      fit: 'contain',
    },
    // Maquina + video + rana: grupo con escalado linkeado.
    // Rana x1.5 mas grande y 150 hero-px mas lejos de la maquina (=258 mc-px).
    // Rana: ratio 2357/3376 = 0.698. w=1583, h=2267. x=1438, y=80.
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
        {
          id: 'rana',
          kind: 'img',
          src: '/assets/imagenes/rana_web_1_comp.png',
          alt: 'Rana coleccionable McBotto',
          psd: { x: 1338, y: 400, w: 1425, h: 2040 },
          z: 1,
          fit: 'contain',
          anim: { type: 'slide-right', delay: 400, duration: 900 },
        },
        // Badge "30 units" encima de la rana, pequeño.
        {
          id: '30units',
          kind: 'img',
          src: '/assets/imagenes/30_units.png',
          alt: '30 units',
          psd: { x: 1430, y: 1310, w: 500, h: 500 },
          z: 3,
          fit: 'contain',
          anim: { type: 'zoom', delay: 600, duration: 700 },
        },
        // Ticket animado: se reproduce al hacer hover, se congela en el ultimo frame.
        {
          id: 'ticket',
          kind: 'video',
          src: '/assets/animations/tikcet_seq_1.webm',
          psd: { x: -900, y: 1200, w: 650, h: 975 },
          z: 1,
          fit: 'contain',
          hoverPlay: true,
          anim: { type: 'slide-left', delay: 400, duration: 900 },
        },
      ],
    },
    // Menu: debajo de la maquina, centrado, superpuesto sobre el borde inferior.
    // Maquina en hero canvas termina en y=330+2199=2529. El menu arranca antes
    // para solaparse con la base de la maquina, como en el mockup.
    // z:6 → por encima de la maquina (z:4) y el logo (z:5).
    {
      id: 'menu',
      kind: 'img',
      src: '/assets/imagenes/menu_web_v3_comp.png',
      alt: 'Menu McBotto',
      psd: { x: -160, y: 2100, w: 2240, h: 1520 },
      z: 6,
      fit: 'contain',
    },
    // Piernas del payaso: asoman por debajo del menu, parcialmente cortadas.
    // Centradas. y alto para que queden cortadas en la parte inferior del canvas.
    {
      id: 'piernas',
      kind: 'img',
      src: '/assets/imagenes/piernas_payaso_comp.png',
      alt: '',
      psd: { x: 540, y: 3450, w: 840, h: 630 },
      z: 5,
      fit: 'contain',
    },
    // Ketchup3: arriba a la derecha del hero, cortado por borde derecho y superior.
    {
      id: 'ketchup3',
      kind: 'img',
      src: '/assets/imagenes/ketchup3.png',
      alt: '',
      psd: { x: 1520, y: -350, w: 900, h: 1834 },
      z: 1,
      fit: 'contain',
    },
    // Ketchup a la derecha de las piernas, cortado por el borde derecho.
    // x:1550 → borde derecho en 1550+900=2450, cortado 530px fuera del canvas.
    {
      id: 'ketchup-right',
      kind: 'img',
      src: '/assets/imagenes/ketchup_1.png',
      alt: '',
      psd: { x: 1200, y: 2400, w: 1440, h: 2934 },
      z: 1,
      fit: 'contain',
    },
    // Patatas izquierda (v2).
    {
      id: 'fries-left',
      kind: 'img',
      src: '/assets/imagenes/patatas_v2_comp.png',
      alt: '',
      psd: { x: -(FRIES_W * 0.72), y: 1600, w: FRIES_W, h: FRIES_H },
      z: 3,
      fit: 'cover',
    },
    // Patatas derecha (v4).
    {
      id: 'fries-right',
      kind: 'img',
      src: '/assets/imagenes/patatas_v2_comp.png',
      alt: '',
      psd: { x: 1920 - FRIES_W * 0.28, y: 1700, w: FRIES_W, h: FRIES_H },
      z: 3,
      fit: 'cover',
    },
  ],
};
