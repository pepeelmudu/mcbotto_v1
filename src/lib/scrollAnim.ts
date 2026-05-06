export type AnimType =
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom';

export type AnimSpec = {
  type: AnimType;
  /** Delay en ms antes de comenzar la animacion al entrar en viewport. */
  delay?: number;
  /** Duracion en ms. Default 800. */
  duration?: number;
};

let observer: IntersectionObserver | null = null;
let prefersReduced = false;

function ensureObserver(): IntersectionObserver {
  if (observer) return observer;

  prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        entry.target.classList.add('is-visible');
        observer?.unobserve(entry.target);
      }
    });
    return observer;
  }

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer?.unobserve(entry.target);
        }
      }
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -8% 0px',
    }
  );
  return observer;
}

/**
 * Recorre el subarbol indicado y observa todas las layers con clase `.anim`
 * para activarles `is-visible` cuando entren al viewport.
 */
export function observeAnimated(root: ParentNode): void {
  const obs = ensureObserver();
  const elements = root.querySelectorAll<HTMLElement>('.anim:not(.is-visible)');
  elements.forEach((el) => obs.observe(el));
}

/**
 * Devuelve los fragmentos CSS que hay que inyectar en el style inline
 * de un elemento animado para custom delay/duration.
 */
export function animInlineVars(anim: AnimSpec): string {
  let out = '';
  if (typeof anim.delay === 'number') out += `--anim-delay:${anim.delay}ms;`;
  if (typeof anim.duration === 'number') out += `--anim-duration:${anim.duration}ms;`;
  return out;
}

/**
 * Devuelve las clases CSS que aplican la animacion `anim` al elemento.
 */
export function animClasses(anim: AnimSpec): string[] {
  return ['anim', `anim--${anim.type}`];
}
