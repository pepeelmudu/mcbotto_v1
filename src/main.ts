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

yellowSection.appendChild(tvVideo);
root.appendChild(yellowSection);

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
