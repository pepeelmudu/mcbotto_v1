import './styles/fonts.css';
import './styles/reset.css';
import './styles/tokens.css';
import './styles/anim.css';
import './styles/stage.css';
import './styles/marquee.css';
import './styles/audio.css';
import './styles/hero.css';
import './styles/modal.css';
import './styles/scroll-anim-section.css';
import './styles/loader.css';

import { mountMarquee } from './sections/marquee';
import { mountHero } from './sections/hero';
import { mountAudioToggle } from './lib/audio';
import { mountScrollAnimSection } from './sections/scroll-anim-section';
import { mountLoader } from './sections/loader';

const root = document.getElementById('app');
if (!root) {
  throw new Error('No se encontro el elemento #app en index.html');
}

const debug = new URLSearchParams(window.location.search).has('debug');

// Items y separador compartidos por el marquee superior y la barra inferior.
// Usamos non-breaking spaces (\u00a0) para que HTML no colapse los espacios
// alrededor del guion, y un em-dash "—" como caracter del separador.
const MARQUEE_ITEMS = [
  'New collection',
  'Get your toy at NFC Lisbon',
  'June 4, 5, 6',
  'Limited edition',
  'McBotto',
];
const MARQUEE_SEPARATOR = '\u00a0\u00a0\u2014\u00a0\u00a0';

mountMarquee(document.body, {
  items: MARQUEE_ITEMS,
  separator: MARQUEE_SEPARATOR,
  durationSeconds: 22,
});

mountHero(root, { debug });

// Sección roja con la animación de la bandeja + texto del evento
mountScrollAnimSection(root);

// Seccion amarilla con animación tv_seq centrada
const yellowSection = document.createElement('section');
yellowSection.className = 'yellow-section';

const tvVideo = document.createElement('video');
tvVideo.className = 'tv-anim';
tvVideo.muted = true;
tvVideo.loop = true;
tvVideo.autoplay = true;
tvVideo.playsInline = true;
tvVideo.setAttribute('muted', '');
tvVideo.setAttribute('loop', '');
tvVideo.setAttribute('autoplay', '');
tvVideo.setAttribute('playsinline', '');
const tvSource = document.createElement('source');
tvSource.src = '/assets/animations/tv_seq.webm';
tvSource.type = 'video/webm';
tvVideo.appendChild(tvSource);

// Click: alterna entre pausa y reproducción
tvVideo.style.cursor = 'pointer';
tvVideo.addEventListener('click', () => {
  if (tvVideo.paused) { void tvVideo.play(); }
  else { tvVideo.pause(); }
});

// Formulario Redeem Code
const redeemForm = document.createElement('div');
redeemForm.className = 'redeem-form';
redeemForm.id = 'redeem';
redeemForm.innerHTML = `
  <p class="redeem-title">Redeem code</p>
  <form class="redeem-fields" onsubmit="return false;">
    <input class="redeem-input" type="text" placeholder="Code" autocomplete="off" />
    <input class="redeem-input" type="email" placeholder="Email" autocomplete="email" />
    <button class="redeem-btn" type="submit">Submit</button>
  </form>
`;
// Wrapper: ticket izq + redeem form + ticket der
const redeemWrapper = document.createElement('div');
redeemWrapper.className = 'redeem-wrapper';

const ticketLeft = document.createElement('img');
ticketLeft.src = '/assets/imagenes/ticket_web_v2_comp.png';
ticketLeft.alt = '';
ticketLeft.className = 'redeem-ticket redeem-ticket--left';

const ticketRight = document.createElement('img');
ticketRight.src = '/assets/imagenes/ticket_web_v3_comp.png';
ticketRight.alt = '';
ticketRight.className = 'redeem-ticket redeem-ticket--right';

const ticketLeft2 = document.createElement('img');
ticketLeft2.src = '/assets/imagenes/ticket_web_v4_comp.png';
ticketLeft2.alt = '';
ticketLeft2.className = 'redeem-ticket redeem-ticket--left2';

redeemWrapper.appendChild(ticketLeft);
redeemWrapper.appendChild(ticketLeft2);
redeemWrapper.appendChild(redeemForm);
redeemWrapper.appendChild(ticketRight);

// Ticket animado (solo visible en mobile via CSS). Se renderiza en un
// <canvas>, mostrando frames pre-extraidos del WebM en orden inverso. Asi
// la animacion va totalmente fluida (el seek random en WebM es lentisimo
// y no funciona frame a frame en Chrome).
// - Estado inicial: ultimo frame fijo en el canvas.
// - Al entrar al viewport: se reproduce en orden inverso.
// - Al hacer click: vuelve a disparar la animacion reverse.
const ticketAnim = document.createElement('div');
ticketAnim.className = 'redeem-ticket-anim';
ticketAnim.style.cursor = 'pointer';

const ticketCanvas = document.createElement('canvas');
ticketCanvas.style.cssText = 'width:100%;height:100%;display:block;';
ticketAnim.appendChild(ticketCanvas);
const ticketCtx = ticketCanvas.getContext('2d');

// Video "fuente" para extraer los frames. Lo escondemos absolutamente para
// que cargue pero no se muestre.
const ticketVideo = document.createElement('video');
ticketVideo.muted = true;
ticketVideo.playsInline = true;
ticketVideo.preload = 'auto';
ticketVideo.crossOrigin = 'anonymous';
ticketVideo.setAttribute('muted', '');
ticketVideo.setAttribute('playsinline', '');
ticketVideo.style.cssText =
  'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
const ticketVideoSource = document.createElement('source');
ticketVideoSource.src = '/assets/animations/tikcet_seq_1.webm';
ticketVideoSource.type = 'video/webm';
ticketVideo.appendChild(ticketVideoSource);
document.body.appendChild(ticketVideo);

const FRAME_FPS = 30;
const ticketFrames: ImageBitmap[] = [];
let framesReady = false;
let rewindTimer: number | null = null;
// Si entra al viewport antes de tener los frames listos, queda pendiente.
let pendingPlay = false;

const drawTicketFrame = (idx: number): void => {
  if (!ticketCtx || !ticketFrames[idx]) return;
  ticketCtx.clearRect(0, 0, ticketCanvas.width, ticketCanvas.height);
  ticketCtx.drawImage(ticketFrames[idx], 0, 0, ticketCanvas.width, ticketCanvas.height);
};

const waitFor = <T extends Event>(target: EventTarget, type: string): Promise<T> =>
  new Promise((resolve) => target.addEventListener(type, (e) => resolve(e as T), { once: true }));

const extractTicketFrames = async (): Promise<void> => {
  if (ticketVideo.readyState < 1 || !isFinite(ticketVideo.duration)) {
    await waitFor(ticketVideo, 'loadedmetadata');
  }
  if (!isFinite(ticketVideo.duration) || ticketVideo.duration <= 0) return;

  ticketCanvas.width = ticketVideo.videoWidth || 650;
  ticketCanvas.height = ticketVideo.videoHeight || 975;

  const numFrames = Math.max(2, Math.round(ticketVideo.duration * FRAME_FPS));
  for (let i = 0; i < numFrames; i++) {
    // 0.99 para no caer exactamente en duration (algunos videos disparan 'ended')
    const t = (i / (numFrames - 1)) * ticketVideo.duration * 0.99;
    ticketVideo.currentTime = t;
    await waitFor(ticketVideo, 'seeked');
    try {
      const bitmap = await createImageBitmap(ticketVideo);
      ticketFrames.push(bitmap);
    } catch {
      // Si createImageBitmap falla en algun frame, lo saltamos.
    }
  }
  framesReady = true;
  drawTicketFrame(ticketFrames.length - 1);
  if (pendingPlay) {
    pendingPlay = false;
    startTicketReverse();
  }
};
void extractTicketFrames();

const stopTicketRewind = (): void => {
  if (rewindTimer !== null) {
    clearInterval(rewindTimer);
    rewindTimer = null;
  }
};

const startTicketReverse = (): void => {
  if (!framesReady || ticketFrames.length === 0) return;
  stopTicketRewind();
  let idx = ticketFrames.length - 1;
  drawTicketFrame(idx);
  rewindTimer = window.setInterval(() => {
    idx -= 1;
    if (idx < 0) {
      stopTicketRewind();
      drawTicketFrame(0);
      return;
    }
    drawTicketFrame(idx);
  }, 1000 / FRAME_FPS);
};

ticketAnim.addEventListener('click', () => {
  if (framesReady) startTicketReverse();
  else pendingPlay = true;
});

const ticketAnimObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (framesReady) startTicketReverse();
      else pendingPlay = true;
    });
  },
  { threshold: 0.4 }
);
ticketAnimObserver.observe(ticketAnim);

redeemWrapper.appendChild(ticketAnim);
yellowSection.appendChild(redeemWrapper);

// TV debajo del redeem form
yellowSection.appendChild(tvVideo);

root.appendChild(yellowSection);

// Barra animada justo en el límite amarillo/rojo, idéntica al marquee de arriba
const footerBar = document.createElement('div');
footerBar.className = 'footer-bar';
const footerBarViewport = document.createElement('div');
footerBarViewport.className = 'footer-bar__viewport';
const copies = 6;
footerBar.style.setProperty('--marquee-copies', String(copies));
for (let i = 0; i < copies; i++) {
  const group = document.createElement('span');
  group.className = 'footer-bar__group';
  group.innerHTML = MARQUEE_ITEMS
    .map(item => `<span class="footer-bar__item">${item}${MARQUEE_SEPARATOR}</span>`)
    .join('');
  footerBarViewport.appendChild(group);
}
footerBar.appendChild(footerBarViewport);
root.appendChild(footerBar);

// Footer rojo con el logo
const footer = document.createElement('footer');
footer.className = 'site-footer';
const footerLogo = document.createElement('img');
footerLogo.src = '/assets/vectores/bottom_2.svg';
footerLogo.alt = 'McBotto';
footerLogo.className = 'site-footer__logo';
footer.appendChild(footerLogo);
root.appendChild(footer);

// Interrogante: hijo del scrub-section para que su posicion sea
// siempre relativa al bloque rojo (funciona en cualquier resolucion).
const interroganteFloat = document.createElement('div');
interroganteFloat.className = 'interrogante-float';
const interroganteImg = document.createElement('img');
interroganteImg.src = '/assets/imagenes/interrogante1_comp.png';
interroganteImg.alt = '';
interroganteFloat.appendChild(interroganteImg);
const scrubSection = root.querySelector('.scrub-section') as HTMLElement | null;
if (scrubSection) {
  scrubSection.appendChild(interroganteFloat);
} else {
  root.appendChild(interroganteFloat);
}

// Etiqueta "McBotto.com" fija arriba a la izquierda
const siteLabel = document.createElement('a');
siteLabel.href = '/';
siteLabel.className = 'site-label';
siteLabel.textContent = 'McBotto.com';
document.body.appendChild(siteLabel);

const audioController = mountAudioToggle(document.body, {
  src: '/assets/sound/mc_sound_comp.mp3',
  volume: 0.4,
  startMuted: false,
});

// Pantalla de carga: video intro → fade amarillo → fade out → web
mountLoader(audioController);
