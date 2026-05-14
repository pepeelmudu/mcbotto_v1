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

import { inject } from '@vercel/analytics';

import { mountMarquee } from './sections/marquee';
import { mountHero } from './sections/hero';
import { mountAudioToggle } from './lib/audio';
import { mountScrollAnimSection } from './sections/scroll-anim-section';
import { mountLoader } from './sections/loader';

// Vercel Web Analytics: solo carga el script en produccion (en local lo
// inyecta pero no envia eventos a Vercel).
inject();

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
// En mobile servimos la version con fondo amarillo quemado (iOS no soporta
// alpha en WebM).
const isMobileViewport = window.matchMedia('(max-width: 768px)').matches;
const tvSource = document.createElement('source');
tvSource.src = isMobileViewport
  ? '/assets/animations/tv_seq_movil.webm'
  : '/assets/animations/tv_seq.webm';
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

// ── Ticket animado (mobile only via CSS) ──────────────────────────────────
// Robusto: pinta el ultimo frame del video INMEDIATAMENTE (drawImage directo)
// para que el ticket sea visible siempre. Luego intenta pre-extraer frames
// para hacer reverse playback fluido. Si la extraccion falla, al menos el
// poster ya esta dibujado y el ticket se ve.
// Fallback final: si el video no carga, mostramos un PNG estatico.
const ticketAnim = document.createElement('div');
ticketAnim.className = 'redeem-ticket-anim';
ticketAnim.style.cursor = 'pointer';

const ticketCanvas = document.createElement('canvas');
ticketCanvas.style.cssText = 'width:100%;height:100%;display:block;';
ticketAnim.appendChild(ticketCanvas);
const ticketCtx = ticketCanvas.getContext('2d');

// Fallback PNG: oculto por defecto, se muestra solo si todo lo demas falla.
const ticketFallback = document.createElement('img');
ticketFallback.src = '/assets/imagenes/ticket_web_v2_comp.png';
ticketFallback.alt = '';
ticketFallback.style.cssText =
  'width:100%;height:100%;display:none;object-fit:contain;position:absolute;inset:0;';
ticketAnim.style.position = 'relative';
ticketAnim.appendChild(ticketFallback);

// Video oculto fuente. SIN crossOrigin (evita problemas CORS con WebMs servidos
// sin headers CORS, comun en Vercel/Vite).
const ticketVideo = document.createElement('video');
ticketVideo.muted = true;
ticketVideo.playsInline = true;
ticketVideo.preload = 'auto';
ticketVideo.setAttribute('muted', '');
ticketVideo.setAttribute('playsinline', '');
ticketVideo.style.cssText =
  'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
const ticketVideoSource = document.createElement('source');
ticketVideoSource.src = '/assets/animations/tikcet_seq_1_movil.webm';
ticketVideoSource.type = 'video/webm';
ticketVideo.appendChild(ticketVideoSource);
document.body.appendChild(ticketVideo);

const FRAME_FPS = 30;
const FRAME_LIMIT = 60; // limite duro para no quedarse extrayendo sin fin
const ticketFrames: ImageBitmap[] = [];
let framesReady = false;
let posterDrawn = false;
let rewindTimer: number | null = null;
let pendingPlay = false;

const log = (msg: string, ...rest: unknown[]): void => {
  // eslint-disable-next-line no-console
  console.log('[ticket-anim]', msg, ...rest);
};

const showTicketFallback = (): void => {
  log('usando fallback PNG');
  ticketCanvas.style.display = 'none';
  ticketFallback.style.display = 'block';
};

const drawCurrentVideoFrame = (): boolean => {
  if (!ticketCtx) return false;
  const vw = ticketVideo.videoWidth;
  const vh = ticketVideo.videoHeight;
  if (vw === 0 || vh === 0) return false;
  try {
    if (ticketCanvas.width !== vw) ticketCanvas.width = vw;
    if (ticketCanvas.height !== vh) ticketCanvas.height = vh;
    ticketCtx.clearRect(0, 0, vw, vh);
    ticketCtx.drawImage(ticketVideo, 0, 0, vw, vh);
    posterDrawn = true;
    return true;
  } catch (err) {
    log('drawImage video fallo', err);
    return false;
  }
};

const drawBitmapFrame = (idx: number): void => {
  if (!ticketCtx || !ticketFrames[idx]) return;
  ticketCtx.clearRect(0, 0, ticketCanvas.width, ticketCanvas.height);
  ticketCtx.drawImage(ticketFrames[idx], 0, 0, ticketCanvas.width, ticketCanvas.height);
};

// seek con timeout: si 'seeked' no dispara en N ms, resolvemos igualmente.
const seekVideo = (t: number, timeoutMs = 500): Promise<void> =>
  new Promise((resolve) => {
    let done = false;
    const finish = (): void => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      ticketVideo.removeEventListener('seeked', finish);
      resolve();
    };
    ticketVideo.addEventListener('seeked', finish, { once: true });
    const timer = setTimeout(finish, timeoutMs);
    ticketVideo.currentTime = t;
  });

const waitForMetadata = (timeoutMs = 4000): Promise<boolean> =>
  new Promise((resolve) => {
    if (ticketVideo.readyState >= 1 && ticketVideo.videoWidth > 0) {
      resolve(true);
      return;
    }
    let done = false;
    const ok = (): void => {
      if (done) return;
      done = true;
      cleanup();
      resolve(ticketVideo.videoWidth > 0);
    };
    const fail = (): void => {
      if (done) return;
      done = true;
      cleanup();
      resolve(false);
    };
    const cleanup = (): void => {
      ticketVideo.removeEventListener('loadedmetadata', ok);
      ticketVideo.removeEventListener('loadeddata', ok);
      ticketVideo.removeEventListener('error', fail);
      clearTimeout(timer);
    };
    ticketVideo.addEventListener('loadedmetadata', ok);
    ticketVideo.addEventListener('loadeddata', ok);
    ticketVideo.addEventListener('error', fail);
    const timer = setTimeout(fail, timeoutMs);
  });

const setupTicket = async (): Promise<void> => {
  const loaded = await waitForMetadata();
  if (!loaded) {
    showTicketFallback();
    return;
  }

  // Duracion: si es Infinity / NaN, usamos un fallback razonable.
  let duration = ticketVideo.duration;
  if (!isFinite(duration) || duration <= 0) {
    log('duration invalido, asumiendo 2s', duration);
    duration = 2;
  }

  // 1) Pinta el ULTIMO frame YA (poster inmediato → ticket visible siempre).
  await seekVideo(duration * 0.99);
  drawCurrentVideoFrame();

  // 2) Intenta pre-extraer frames para reverse playback fluido.
  const numFrames = Math.max(2, Math.min(FRAME_LIMIT, Math.round(duration * FRAME_FPS)));
  for (let i = 0; i < numFrames; i++) {
    const t = (i / (numFrames - 1)) * duration * 0.99;
    await seekVideo(t);
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await createImageBitmap(ticketVideo);
    } catch (err) {
      log(`createImageBitmap fail frame ${i}`, err);
    }
    if (bitmap) ticketFrames.push(bitmap);
  }

  if (ticketFrames.length < 2) {
    log(`solo ${ticketFrames.length} frames extraidos: mantenemos poster, sin reverse anim`);
    // El poster del paso 1 sigue ahi, asi que igualmente se ve.
    return;
  }

  framesReady = true;
  drawBitmapFrame(ticketFrames.length - 1);

  if (pendingPlay) {
    pendingPlay = false;
    startTicketReverse();
  }
};

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
  drawBitmapFrame(idx);
  rewindTimer = window.setInterval(() => {
    idx -= 1;
    if (idx < 0) {
      stopTicketRewind();
      // Queda congelado en el PRIMER frame (estado final del reverse).
      drawBitmapFrame(0);
      return;
    }
    drawBitmapFrame(idx);
  }, 1000 / FRAME_FPS);
};

void setupTicket();

ticketAnim.addEventListener('click', () => {
  if (framesReady) startTicketReverse();
  else if (!posterDrawn) pendingPlay = true;
});

const ticketAnimObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (framesReady) startTicketReverse();
      else if (!posterDrawn) pendingPlay = true;
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
