import './styles/fonts.css';
import './styles/reset.css';
import './styles/tokens.css';
import './styles/anim.css';
import './styles/stage.css';
import './styles/marquee.css';
import './styles/audio.css';
import './styles/hero.css';

import { mountMarquee } from './sections/marquee';
import { mountHero } from './sections/hero';
import { mountAudioToggle } from './lib/audio';

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

// Seccion amarilla vacia debajo del hero (contenido futuro)
const yellowSection = document.createElement('section');
yellowSection.className = 'yellow-section';
root.appendChild(yellowSection);

// Etiqueta "McBotto.com" fija arriba a la izquierda
const siteLabel = document.createElement('a');
siteLabel.href = '/';
siteLabel.className = 'site-label';
siteLabel.textContent = 'McBotto.com';
document.body.appendChild(siteLabel);

mountAudioToggle(document.body, {
  src: '/assets/audio/loop.mp3',
  volume: 0.4,
  startMuted: false,
});
