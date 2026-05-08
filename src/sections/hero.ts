import { renderStage, type StageComposition } from '../lib/stage';
import { heroDesktop } from '../data/hero.layers';
import { heroMobile } from '../data/hero.layers.mobile';
import { openModal } from '../lib/modal';

const MOBILE_QUERY = '(max-width: 768px)';

export type HeroOptions = {
  debug?: boolean;
};

/**
 * Monta el hero dentro del root indicado y se encarga de re-renderizar
 * cuando cambia el breakpoint mobile/desktop.
 */
export function mountHero(root: HTMLElement, options: HeroOptions = {}): () => void {
  const section = document.createElement('section');
  section.className = 'hero';
  section.setAttribute('aria-label', 'Hero McBotto');

  const stage = document.createElement('div');
  stage.className = 'stage stage--hero';
  if (options.debug) stage.classList.add('stage-debug');

  section.append(stage);
  root.appendChild(section);

  // Click en la pantalla de la maquina → abre el modal con el menu
  section.addEventListener('click', (e) => {
    const layer = (e.target as Element).closest('[data-id="screen"]');
    if (layer) openModal('/assets/imagenes/menu2_low_comp.png', 'Menu McBotto');
  });

  // Click en el ticket → scroll suave al formulario Redeem Code
  section.addEventListener('click', (e) => {
    const layer = (e.target as Element).closest('[data-id="ticket"]');
    if (layer) {
      document.getElementById('redeem')?.scrollIntoView({ behavior: 'smooth' });
    }
  });

  const mql = window.matchMedia(MOBILE_QUERY);
  const draw = (): void => {
    const composition: StageComposition = mql.matches ? heroMobile : heroDesktop;
    renderStage(stage, composition);
    ensureVideosPlay(stage);
  };

  draw();

  const onChange = (): void => draw();
  if ('addEventListener' in mql) {
    mql.addEventListener('change', onChange);
  } else {
    // Safari < 14 fallback
    (mql as MediaQueryList).addListener(onChange);
  }

  return () => {
    if ('removeEventListener' in mql) {
      mql.removeEventListener('change', onChange);
    } else {
      (mql as MediaQueryList).removeListener(onChange);
    }
    section.remove();
  };
}

/**
 * Algunos browsers (Safari iOS) requieren un play() programatico despues
 * de insertar el <video>. Lo intentamos en silencio.
 */
function ensureVideosPlay(stage: HTMLElement): void {
  const videos = stage.querySelectorAll<HTMLVideoElement>('video');
  videos.forEach((v) => {
    const tryPlay = (): void => {
      const p = v.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          // Autoplay bloqueado: lo reintentamos al primer gesto del usuario.
          const onFirstGesture = (): void => {
            void v.play();
            window.removeEventListener('pointerdown', onFirstGesture);
            window.removeEventListener('touchstart', onFirstGesture);
          };
          window.addEventListener('pointerdown', onFirstGesture, { once: true });
          window.addEventListener('touchstart', onFirstGesture, { once: true });
        });
      }
    };
    if (v.readyState >= 2) {
      tryPlay();
    } else {
      v.addEventListener('loadeddata', tryPlay, { once: true });
    }
  });
}
