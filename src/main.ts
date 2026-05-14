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

// CTA al evento de Luma. El boton PNG es el enlace: al pulsar cambia al
// boton_seq_2.png y tras un pequeno delay abre el evento en una nueva pestana.
const LUMA_EVENT_URL = 'https://luma.com/z69m63lu';

// Pre-carga la imagen del estado "pulsado" para que el swap sea instantaneo.
const buttonSeq2Preload = new Image();
buttonSeq2Preload.src = '/assets/animations/button/boton_seq_2.png';

const redeemForm = document.createElement('div');
redeemForm.className = 'redeem-form';
redeemForm.id = 'redeem';
redeemForm.innerHTML = `
  <p class="redeem-title">Go to event</p>
  <a
    class="redeem-button-link"
    href="${LUMA_EVENT_URL}"
    target="_blank"
    rel="noopener noreferrer"
  >
    <img
      class="redeem-button"
      src="/assets/animations/button/boton_seq_1.png"
      alt="Go to event"
    />
  </a>
`;

const redeemButtonLink = redeemForm.querySelector('.redeem-button-link') as HTMLAnchorElement | null;
const redeemButtonImg = redeemForm.querySelector('.redeem-button') as HTMLImageElement | null;

if (redeemButtonLink && redeemButtonImg) {
  const BTN_SEQ_1 = '/assets/animations/button/boton_seq_1.png';
  const BTN_SEQ_2 = '/assets/animations/button/boton_seq_2.png';
  let isPressing = false;

  redeemButtonLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (isPressing) return;
    isPressing = true;

    // png2 (pulsado) durante 500ms → png1 (suelto) → abre el evento en nueva
    // pestaña. window.open dentro de setTimeout < 1000ms se sigue considerando
    // gesto del usuario en Chrome/Firefox/Safari, asi que NO se bloquea.
    redeemButtonImg.src = BTN_SEQ_2;

    window.setTimeout(() => {
      redeemButtonImg.src = BTN_SEQ_1;
      window.open(LUMA_EVENT_URL, '_blank', 'noopener,noreferrer');
      isPressing = false;
    }, 500);
  });
}
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
// Video directo con la animacion ya invertida en el archivo. Arranca pausado
// en frame 0, se reproduce al entrar al viewport y se queda en el ultimo
// frame. Al click se vuelve a reproducir desde el principio.
const ticketAnim = document.createElement('video');
ticketAnim.className = 'redeem-ticket-anim';
ticketAnim.muted = true;
ticketAnim.playsInline = true;
ticketAnim.loop = false;
ticketAnim.autoplay = false;
ticketAnim.preload = 'auto';
ticketAnim.setAttribute('muted', '');
ticketAnim.setAttribute('playsinline', '');
const ticketAnimSource = document.createElement('source');
ticketAnimSource.src = '/assets/animations/tikcet_seq_2_movil.webm';
ticketAnimSource.type = 'video/webm';
ticketAnim.appendChild(ticketAnimSource);

const playTicketAnim = (): void => {
  ticketAnim.currentTime = 0;
  void ticketAnim.play();
};

ticketAnim.style.cursor = 'pointer';
ticketAnim.addEventListener('click', playTicketAnim);

const ticketAnimObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) playTicketAnim();
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
