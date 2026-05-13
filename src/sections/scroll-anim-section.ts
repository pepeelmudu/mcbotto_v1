/**
 * Sección roja con vídeo animado:
 * - Congelado en frame 0 hasta que entra en el viewport.
 * - Al entrar, se reproduce una vez y queda congelado en el último frame.
 */
export function mountScrollAnimSection(root: HTMLElement): void {
  // ── Section wrapper ────────────────────────────────────────────────
  const section = document.createElement('section');
  section.className = 'scrub-section';

  // ── Contenedor flex: vídeo + texto pegados, gap fijo de 40px ─────────
  const content = document.createElement('div');
  content.className = 'scrub-content';

  // ── Vídeo ──────────────────────────────────────────────────────────
  const video = document.createElement('video');
  video.className = 'scrub-video';
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');

  // En mobile servimos una version del WebM con el fondo del color de la web
  // ya quemado (iOS no soporta alpha en WebM).
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const source = document.createElement('source');
  source.src = isMobile
    ? '/assets/animations/bandeja_seq_1_movil.webm'
    : '/assets/animations/bandeja_seq_1.webm';
  source.type = 'video/webm';
  video.appendChild(source);

  // Congelar en frame 0 al cargar
  const freezeAtStart = () => {
    video.currentTime = 0;
    video.pause();
  };
  if (video.readyState >= 1) {
    freezeAtStart();
  } else {
    video.addEventListener('loadedmetadata', freezeAtStart, { once: true });
  }
  video.load();

  // ── Texto del evento ───────────────────────────────────────────────
  const info = document.createElement('div');
  info.className = 'scrub-event-info';
  info.innerHTML = `
    <p class="scrub-event-text scrub-event-text--large">
      <img class="scrub-tribal scrub-tribal--left" src="/assets/vectores/tribal.svg" alt="" />
      June 4, 5, 6 &mdash; Lisbon
      <img class="scrub-tribal scrub-tribal--right" src="/assets/vectores/tribal.svg" alt="" />
    </p>
    <p class="scrub-event-text">
      <a
        class="scrub-event-link"
        href="https://www.nonfungibleconference.com/"
        target="_blank"
        rel="noopener noreferrer"
      >nonfungibleconference.com</a>
    </p>
    <p class="scrub-event-emoji">☺</p>
  `;

  // ── "Get your toy at:" justo encima del vídeo, sobre el fondo rojo ──
  const headline = document.createElement('p');
  headline.className = 'scrub-headline';
  headline.textContent = 'Get your toy at:';

  // ── Contenedor del vídeo ───────────────────────────────────────────
  const videoContainer = document.createElement('div');
  videoContainer.className = 'scrub-video-container';
  videoContainer.appendChild(video);

  // Manchas de mostaza a los lados de la bandeja
  const mostazaLeft = document.createElement('img');
  mostazaLeft.className = 'scrub-mostaza scrub-mostaza--left';
  mostazaLeft.src = '/assets/imagenes/mostaza_1_comp.png';
  mostazaLeft.alt = '';

  const mostazaRight = document.createElement('img');
  mostazaRight.className = 'scrub-mostaza scrub-mostaza--right';
  mostazaRight.src = '/assets/imagenes/mostaza_2_comp.png';
  mostazaRight.alt = '';

  videoContainer.appendChild(mostazaLeft);
  videoContainer.appendChild(mostazaRight);

  // Área clickable reducida 200px hacia dentro por todos los lados.
  // El vídeo no recibe el click; solo esta capa interior centrada lo hace.
  const hitArea = document.createElement('div');
  hitArea.className = 'scrub-hit-area';
  hitArea.addEventListener('click', () => {
    video.currentTime = 0;
    void video.play();
  });
  videoContainer.appendChild(hitArea);

  content.appendChild(headline);
  content.appendChild(videoContainer);
  content.appendChild(info);
  section.appendChild(content);

  root.appendChild(section);

  // ── IntersectionObserver: reproducir al entrar en viewport ─────────
  let hasPlayed = false;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !hasPlayed) {
          hasPlayed = true;
          void video.play();
          observer.disconnect();
        }
      }
    },
    {
      // Observamos el propio videoContainer, no la section.
      // Con -50% en bottom el vídeo solo dispara cuando su borde superior
      // cruza la mitad del viewport → bandeja visible en el centro-superior.
      rootMargin: '0px 0px -50% 0px',
      threshold: 0,
    },
  );

  observer.observe(videoContainer);
}
