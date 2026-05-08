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

import { mountMarquee } from './sections/marquee';
import { mountHero } from './sections/hero';
import { mountAudioToggle } from './lib/audio';
import { mountScrollAnimSection } from './sections/scroll-anim-section';

const root = document.getElementById('app');
if (!root) {
  throw new Error('No se encontro el elemento #app en index.html');
}

const debug = new URLSearchParams(window.location.search).has('debug');

mountMarquee(document.body, {
  items: [
    'New collection',
    'Get your toy at NFC Lisbon',
    'June 4, 5, 6',
    'Limited edition',
    'McBotto',
  ],
  separator: '  -  ',
  durationSeconds: 22,
});

mountHero(root, { debug });

// Sección roja con scroll-scrubbing de patatas_seq_2 + texto del evento
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
ticketLeft.src = '/assets/imagenes/ticket_web_v2.png';
ticketLeft.alt = '';
ticketLeft.className = 'redeem-ticket redeem-ticket--left';

const ticketRight = document.createElement('img');
ticketRight.src = '/assets/imagenes/ticket_web_v3.png';
ticketRight.alt = '';
ticketRight.className = 'redeem-ticket redeem-ticket--right';

const ticketLeft2 = document.createElement('img');
ticketLeft2.src = '/assets/imagenes/ticket_web_v4.png';
ticketLeft2.alt = '';
ticketLeft2.className = 'redeem-ticket redeem-ticket--left2';

redeemWrapper.appendChild(ticketLeft);
redeemWrapper.appendChild(ticketLeft2);
redeemWrapper.appendChild(redeemForm);
redeemWrapper.appendChild(ticketRight);
yellowSection.appendChild(redeemWrapper);

// TV debajo del redeem form
yellowSection.appendChild(tvVideo);

root.appendChild(yellowSection);

// Barra animada justo en el límite amarillo/rojo, idéntica al marquee de arriba
const footerBarItems = ['New collection', 'Get your toy at NFC Lisbon', 'June 4, 5, 6', 'Limited edition', 'McBotto'];
const footerBar = document.createElement('div');
footerBar.className = 'footer-bar';
const footerBarViewport = document.createElement('div');
footerBarViewport.className = 'footer-bar__viewport';
const copies = 6;
footerBar.style.setProperty('--marquee-copies', String(copies));
for (let i = 0; i < copies; i++) {
  const group = document.createElement('span');
  group.className = 'footer-bar__group';
  group.innerHTML = footerBarItems.map(item => `<span class="footer-bar__item">${item}</span>`).join('');
  footerBarViewport.appendChild(group);
}
footerBar.appendChild(footerBarViewport);
root.appendChild(footerBar);

// Footer rojo con el logo
const footer = document.createElement('footer');
footer.className = 'site-footer';
const footerLogo = document.createElement('img');
footerLogo.src = '/assets/vectores/bottom.svg';
footerLogo.alt = 'McBotto';
footerLogo.className = 'site-footer__logo';
footer.appendChild(footerLogo);
root.appendChild(footer);

// Interrogante flotante: fuera del stacking context del hero,
// para que quede por encima del bloque rojo (.scrub-section).
const interroganteFloat = document.createElement('div');
interroganteFloat.className = 'interrogante-float';
const interroganteImg = document.createElement('img');
interroganteImg.src = '/assets/imagenes/interrogante1.png';
interroganteImg.alt = '';
interroganteFloat.appendChild(interroganteImg);
// Se añade al root (position:relative padre) después de los demás sections
root.appendChild(interroganteFloat);

// Etiqueta "McBotto.com" fija arriba a la izquierda
const siteLabel = document.createElement('a');
siteLabel.href = '/';
siteLabel.className = 'site-label';
siteLabel.textContent = 'McBotto.com';
document.body.appendChild(siteLabel);

mountAudioToggle(document.body, {
  src: '/assets/sound/mc_sound.mp3',
  volume: 0.4,
  startMuted: false,
});
