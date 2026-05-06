export type MarqueeOptions = {
  items: string[];
  separator?: string;
  durationSeconds?: number;
  direction?: 'left' | 'right';
  /** Numero de copias del grupo para el loop. Default 8. Mas copias = buffer mayor. */
  copies?: number;
};

/**
 * Marquesina de texto infinita. Genera `copies` grupos iguales uno al lado
 * del otro y anima un desplazamiento de exactamente 1 grupo (-100/copies %).
 * Cuando la animacion reinicia, el siguiente grupo ya esta en el lugar del
 * anterior, creando un loop seamless sin ninguna discontinuidad.
 */
export function mountMarquee(root: HTMLElement, options: MarqueeOptions): () => void {
  const sep = options.separator ?? '  -  ';
  const duration = options.durationSeconds ?? 40;
  const direction = options.direction ?? 'left';
  const copies = Math.max(4, options.copies ?? 8);

  const bar = document.createElement('div');
  bar.className = 'marquee';
  bar.setAttribute('role', 'marquee');
  bar.setAttribute('aria-label', options.items.join(sep));
  bar.style.setProperty('--marquee-duration', `${duration}s`);
  // El CSS keyframe mueve -100/copies %. Necesita conocer copies.
  bar.style.setProperty('--marquee-copies', String(copies));
  if (direction === 'right') bar.style.setProperty('--marquee-dir', '-1');

  const viewport = document.createElement('div');
  viewport.className = 'marquee__viewport';

  // Primera copia: accesible. Resto: aria-hidden.
  viewport.appendChild(buildGroup(options.items, sep, false));
  for (let i = 1; i < copies; i++) {
    viewport.appendChild(buildGroup(options.items, sep, true));
  }

  bar.appendChild(viewport);
  root.appendChild(bar);

  return () => bar.remove();
}

function buildGroup(items: string[], separator: string, ariaHidden: boolean): HTMLElement {
  const group = document.createElement('div');
  group.className = 'marquee__group';
  if (ariaHidden) group.setAttribute('aria-hidden', 'true');

  for (const text of items) {
    const span = document.createElement('span');
    span.className = 'marquee__item';
    span.textContent = `${text}${separator}`;
    group.appendChild(span);
  }
  return group;
}
