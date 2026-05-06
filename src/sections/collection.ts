import { renderStage, type StageComposition } from '../lib/stage';
import { observeAnimated } from '../lib/scrollAnim';
import { collectionDesktop, collectionMobile } from '../data/collection.layers';

const MOBILE_QUERY = '(max-width: 768px)';

export type CollectionOptions = {
  debug?: boolean;
};

export function mountCollection(
  root: HTMLElement,
  options: CollectionOptions = {}
): () => void {
  const section = document.createElement('section');
  section.className = 'collection';
  section.setAttribute('aria-label', 'Coleccion McBotto');

  const header = document.createElement('header');
  header.className = 'collection__header';
  header.innerHTML = `
    <p class="collection__eyebrow anim anim--fade">Edicion limitada</p>
    <h2 class="collection__title anim anim--slide-up" style="--anim-delay:120ms">La coleccion completa</h2>
    <p class="collection__lead anim anim--slide-up" style="--anim-delay:240ms">
      Diez piezas exclusivas de la colaboracion McBotto x McDonald's.
      Disponibles solo durante el evento.
    </p>
  `;

  const stage = document.createElement('div');
  stage.className = 'stage stage--collection';
  if (options.debug) stage.classList.add('stage-debug');

  section.append(header, stage);
  root.appendChild(section);

  const mql = window.matchMedia(MOBILE_QUERY);

  const draw = (): void => {
    const composition: StageComposition = mql.matches ? collectionMobile : collectionDesktop;
    renderStage(stage, composition);
    if (composition.layers.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.className = 'collection__placeholder';
      placeholder.textContent = 'Coleccion: pendiente de assets';
      stage.appendChild(placeholder);
    }
  };

  draw();
  observeAnimated(header);

  const onChange = (): void => draw();
  if ('addEventListener' in mql) {
    mql.addEventListener('change', onChange);
  } else {
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
