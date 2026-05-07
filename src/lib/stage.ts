import { animClasses, animInlineVars, observeAnimated, type AnimSpec } from './scrollAnim';

export type LayerKind = 'img' | 'video' | 'svg' | 'group';

export type VideoSource = {
  src: string;
  type: string;
};

export type LayerSpec = {
  id: string;
  kind: LayerKind;
  /** Ruta al asset. No aplica para kind: 'group'. */
  src?: string;
  psd: { x: number; y: number; w: number; h: number };
  z?: number;
  className?: string;
  alt?: string;
  fit?: 'cover' | 'contain';
  poster?: string;
  sources?: VideoSource[];
  loop?: boolean;
  muted?: boolean;
  autoplay?: boolean;
  playsInline?: boolean;
  /** Animacion de entrada al hacer scroll (o al primer paint si ya esta en viewport). */
  anim?: AnimSpec;
  /**
   * Solo para `kind: 'svg'` con SVG monocromatico. Si se setea, el SVG se
   * aplica como `mask-image` y el background del wrapper se pinta con este
   * color, recoloreando la silueta. CSS color valido (hex, var(--token), ...).
   */
  tint?: string;
  /**
   * Solo para `kind: 'video'`. Si true, el video NO hace autoplay: arranca
   * parado en frame 0, se reproduce al hacer hover (mouseenter) y se queda
   * congelado en el ultimo frame cuando termina. Implica autoplay=false, loop=false.
   */
  hoverPlay?: boolean;
  /**
   * Solo para `kind: 'group'`. Sub-canvas en el que viven las layers hijas.
   * Las hijas se posicionan en coords relativas a este canvas, asi cuando el
   * grupo escala, todas las hijas escalan en bloque (escalas linkeadas).
   */
  canvas?: Canvas;
  /** Solo para `kind: 'group'`. Layers anidadas. */
  layers?: LayerSpec[];
};

export type Canvas = { w: number; h: number };

export type StageComposition = {
  canvas: Canvas;
  layers: LayerSpec[];
};

/**
 * Convierte coords del PSD (en pixeles) a porcentajes relativos al canvas
 * y devuelve el cssText completo (incluyendo CSS vars de animacion si aplica).
 */
export function layerStyle(layer: LayerSpec, canvas: Canvas): string {
  const left = (layer.psd.x / canvas.w) * 100;
  const top = (layer.psd.y / canvas.h) * 100;
  const w = (layer.psd.w / canvas.w) * 100;
  const h = (layer.psd.h / canvas.h) * 100;
  const z = layer.z ?? 1;
  let css = `left:${pct(left)};top:${pct(top)};width:${pct(w)};height:${pct(h)};z-index:${z};`;
  if (layer.anim) css += animInlineVars(layer.anim);
  return css;
}

function pct(n: number): string {
  return `${roundTo(n, 4)}%`;
}

function roundTo(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

/**
 * Crea un elemento DOM para una layer en base a su kind, ya con sus estilos de
 * posicion y clases de animacion (si tiene `anim`).
 */
export function createLayerElement(layer: LayerSpec, canvas: Canvas): HTMLElement {
  const wrapper = document.createElement('div');

  const classes = ['layer'];
  if (layer.fit === 'contain') classes.push('fit-contain');
  if (layer.className) classes.push(layer.className);
  if (layer.anim) classes.push(...animClasses(layer.anim));
  wrapper.className = classes.join(' ');

  wrapper.dataset.id = layer.id;
  wrapper.style.cssText = layerStyle(layer, canvas);

  switch (layer.kind) {
    case 'img':
      wrapper.appendChild(buildImg(layer));
      break;
    case 'video': {
      const vid = buildVideo(layer);
      wrapper.appendChild(vid);
      if (layer.hoverPlay) {
        wrapper.classList.add('is-interactive');
        wrapper.style.cursor = 'pointer';

        // Oculta el video mientras el browser no haya seekado al frame 0.
        // Esto evita que se vean frames intermedios durante el buffering.
        vid.style.opacity = '0';

        const seekToStart = () => {
          vid.currentTime = 0;
          vid.addEventListener('seeked', () => {
            vid.pause();
            vid.style.opacity = '1';
          }, { once: true });
        };

        // Si ya tiene datos suficientes, seek inmediato; si no, espera.
        if (vid.readyState >= 2) {
          seekToStart();
        } else {
          vid.addEventListener('loadeddata', seekToStart, { once: true });
        }

        wrapper.addEventListener('mouseenter', () => {
          vid.currentTime = 0;
          void vid.play();
        });
        // Al quitar el hover: para y vuelve al frame 0.
        wrapper.addEventListener('mouseleave', () => {
          vid.pause();
          vid.currentTime = 0;
        });
        // 'ended' → el video ya esta parado en el ultimo frame automaticamente.
        // Si el usuario mantiene el hover lo ve congelado; si saca el raton,
        // mouseleave lo resetea al frame 0.
      }
      break;
    }
    case 'svg':
      if (layer.tint) {
        // El wrapper mismo es la silueta coloreada (mask-image + background).
        wrapper.classList.add('layer--mask');
        wrapper.style.setProperty('--layer-mask', `url("${layer.src ?? ''}")`);
        wrapper.style.setProperty('--layer-tint', layer.tint);
        if (layer.alt) wrapper.setAttribute('aria-label', layer.alt);
        wrapper.setAttribute('role', 'img');
      } else {
        wrapper.appendChild(buildSvgImg(layer));
      }
      break;
    case 'group':
      // Sub-canvas: las layers hijas se posicionan respecto al canvas del grupo.
      // Asi cuando el grupo escala, las hijas mantienen sus posiciones relativas.
      wrapper.classList.add('layer--group');
      if (layer.canvas && layer.layers) {
        for (const child of layer.layers) {
          wrapper.appendChild(createLayerElement(child, layer.canvas));
        }
      }
      break;
  }

  return wrapper;
}

function buildImg(layer: LayerSpec): HTMLImageElement {
  const img = document.createElement('img');
  if (layer.src) img.src = layer.src;
  img.alt = layer.alt ?? '';
  img.decoding = 'async';
  img.loading = 'lazy';
  return img;
}

function buildSvgImg(layer: LayerSpec): HTMLImageElement {
  const img = buildImg(layer);
  img.setAttribute('role', 'img');
  return img;
}

function buildVideo(layer: LayerSpec): HTMLVideoElement {
  const video = document.createElement('video');
  // hoverPlay desactiva autoplay y loop; el video arranca parado en frame 0.
  video.autoplay = layer.hoverPlay ? false : (layer.autoplay ?? true);
  video.loop = layer.hoverPlay ? false : (layer.loop ?? true);
  video.muted = layer.muted ?? true;
  video.playsInline = layer.playsInline ?? true;
  video.preload = 'auto';
  if (layer.poster) video.poster = layer.poster;

  const sources =
    layer.sources ??
    (layer.src ? [{ src: layer.src, type: inferVideoType(layer.src) }] : []);
  for (const s of sources) {
    const source = document.createElement('source');
    source.src = s.src;
    source.type = s.type;
    video.appendChild(source);
  }

  // Necesario para autoplay programatico en algunos browsers
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  return video;
}

function inferVideoType(src: string): string {
  const lower = src.toLowerCase();
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.mov')) return 'video/mp4; codecs="hvc1"';
  return 'video/mp4';
}

/**
 * Renderiza una composicion completa dentro del stage indicado y registra
 * las layers animadas en el observer de scroll.
 */
export function renderStage(stageEl: HTMLElement, composition: StageComposition): void {
  stageEl.replaceChildren();
  for (const layer of composition.layers) {
    const node = createLayerElement(layer, composition.canvas);
    stageEl.appendChild(node);
  }
  observeAnimated(stageEl);
}
