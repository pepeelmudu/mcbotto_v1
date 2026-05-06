import type { StageComposition } from '../lib/stage';

export const COLLECTION_CANVAS_DESKTOP = { w: 1920, h: 1200 } as const;
export const COLLECTION_CANVAS_MOBILE = { w: 1080, h: 1600 } as const;

/**
 * Stub: cuando lleguen los PNGs de los juguetes se rellenan estos arrays
 * con un layer por toy (id, src, psd: x/y/w/h y z).
 */
export const collectionDesktop: StageComposition = {
  canvas: COLLECTION_CANVAS_DESKTOP,
  layers: [],
};

export const collectionMobile: StageComposition = {
  canvas: COLLECTION_CANVAS_MOBILE,
  layers: [],
};
