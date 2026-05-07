/**
 * Modal singleton: se crea la primera vez que se abre y persiste en el DOM.
 * Uso: openModal('/assets/imagenes/menu2_low.png')
 */

let overlay: HTMLElement | null = null;
let imgEl: HTMLImageElement | null = null;
let onKeyDown: ((e: KeyboardEvent) => void) | null = null;

function buildModal(): void {
  overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const box = document.createElement('div');
  box.className = 'modal-box';

  imgEl = document.createElement('img');
  imgEl.className = 'modal-img';
  imgEl.alt = '';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'modal-close';
  closeBtn.setAttribute('aria-label', 'Cerrar');
  closeBtn.innerHTML = '&times;';

  box.appendChild(imgEl);
  box.appendChild(closeBtn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  closeBtn.addEventListener('click', closeModal);

  // Click fuera del box cierra el modal
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}

export function openModal(src: string, alt = ''): void {
  if (!overlay) buildModal();

  imgEl!.src = src;
  imgEl!.alt = alt;
  overlay!.classList.add('modal--open');
  document.body.style.overflow = 'hidden';

  onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeModal();
  };
  document.addEventListener('keydown', onKeyDown);
}

export function closeModal(): void {
  if (!overlay) return;
  overlay.classList.remove('modal--open');
  document.body.style.overflow = '';
  if (onKeyDown) {
    document.removeEventListener('keydown', onKeyDown);
    onKeyDown = null;
  }
}
