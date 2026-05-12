import type { AudioController } from '../lib/audio';

/**
 * Pantalla de carga:
 * 1. Video carga_1.mp4 a pantalla completa
 * 2. Al terminar el video → funde a amarillo (#ffc700)
 * 3. Cuando acaba el fade a amarillo → funde a transparente y arranca el audio
 * 4. Cuando acaba el fade out → elimina el overlay del DOM
 */
export function mountLoader(audioController: AudioController): void {
  const overlay = document.createElement('div');
  overlay.className = 'loader-overlay';

  const video = document.createElement('video');
  video.className = 'loader-video';
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('autoplay', '');
  video.setAttribute('playsinline', '');

  const source = document.createElement('source');
  source.src = '/assets/videos/carga_1.mp4';
  source.type = 'video/mp4';
  video.appendChild(source);

  // Intenta arrancar el audio inmediatamente (funciona si el browser lo permite).
  // Si el browser bloquea el autoplay sin gesto, quedará muted hasta el dismiss.
  audioController.setMuted(false);

  const dismiss = (): void => {
    // Paso 1: funde el video a amarillo
    overlay.classList.add('fade-yellow');

    overlay.addEventListener(
      'transitionend',
      (e) => {
        if ((e as TransitionEvent).propertyName !== 'background-color') return;

        // Oculta el video (ya no se necesita)
        video.pause();
        video.style.display = 'none';

        // Asegura que el audio esté activo al salir del loader
        audioController.setMuted(false);

        // Paso 2: funde el overlay a transparente
        overlay.classList.add('fade-out');

        overlay.addEventListener(
          'transitionend',
          (e2) => {
            if ((e2 as TransitionEvent).propertyName !== 'opacity') return;
            overlay.remove();
          },
          { once: true }
        );
      },
      { once: true }
    );
  };

  video.addEventListener('ended', dismiss, { once: true });

  // Fallback: si el video no carga en 8s, descartamos el loader
  const fallbackTimer = setTimeout(dismiss, 8000);
  video.addEventListener('ended', () => clearTimeout(fallbackTimer), { once: true });

  overlay.appendChild(video);
  // Montamos en document.body (no en #app) para que z-index:9999 compita
  // directamente con el marquee y el audio-toggle que también están en body.
  document.body.prepend(overlay);

  // Marca body para ocultar marquee/audio-toggle/site-label mientras dura el loader.
  document.body.classList.add('loader-active');

  // Cuando el overlay se elimine, quitamos la clase para revelar el header.
  const observer = new MutationObserver(() => {
    if (!document.body.contains(overlay)) {
      document.body.classList.remove('loader-active');
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true });
}
