// v4: bump para invalidar preferencias viejas que dejaban el audio muted.
const STORAGE_KEY = 'mcbotto_audio_muted_v4';

export type AudioToggleOptions = {
  src: string;
  /** Volumen 0..1. Default 0.4 (musiquilla de fondo, no protagonista). */
  volume?: number;
  /** Si no hay valor persistido, arranca silenciado por defecto. */
  startMuted?: boolean;
  /** Sources adicionales (fallback de codecs). */
  sources?: { src: string; type: string }[];
};

export type AudioController = {
  destroy(): void;
  toggle(): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
};

/**
 * Monta un loop de audio de fondo + un boton flotante arriba a la derecha
 * para silenciarlo / activarlo. La preferencia se persiste en localStorage.
 *
 * IMPORTANTE: las politicas de autoplay del browser bloquean audio sin
 * interaccion del usuario. Por eso el patron es:
 *  - El boton aparece SIEMPRE.
 *  - Si el usuario eligio "muted=true" o nunca interactuo, no suena nada.
 *  - Cuando el usuario destildea el boton (gesto explicito), arranca el play.
 *  - Si en una visita previa habia dejado el audio activo, intentamos
 *    reanudarlo en el primer gesto que haga (click, touch, tecla).
 */
export function mountAudioToggle(
  root: HTMLElement,
  options: AudioToggleOptions
): AudioController {
  const audio = document.createElement('audio');
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = options.volume ?? 0.4;

  const sources = options.sources ?? [
    { src: options.src, type: inferAudioType(options.src) },
  ];
  for (const s of sources) {
    const source = document.createElement('source');
    source.src = s.src;
    source.type = s.type;
    audio.appendChild(source);
  }

  const persisted = readPersisted();
  let muted = persisted ?? options.startMuted ?? true;
  // Empezamos siempre muted para maximizar las posibilidades de autoplay.
  // El primer gesto del usuario nos permite desmutar.
  audio.muted = true;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'audio-toggle';
  button.dataset.muted = String(muted);

  // Solo actualiza UI; el estado de muted/play se gestiona en startAudio +
  // onUserInteraction para no romper el autoplay con cambios prematuros.
  const syncUI = (): void => {
    button.dataset.muted = String(muted);
    button.setAttribute('aria-pressed', String(!muted));
    button.setAttribute(
      'aria-label',
      muted ? 'Activar musica de fondo' : 'Silenciar musica de fondo'
    );
    button.innerHTML = renderIcon(muted);
    persist(muted);
  };

  // Cambio explícito desde el botón / API: aquí sí tocamos audio porque
  // ya hay un gesto del usuario.
  const syncAudio = (): void => {
    syncUI();
    audio.muted = muted;
    if (!muted) {
      void audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  };

  // Estrategia agresiva de autoplay:
  // 1. Intento play() SIN muted (si el browser permite, suena desde el inicio)
  // 2. Si falla, intento play() muted (autoplay permitido siempre)
  // 3. Cualquier interacción del usuario (incluso movimiento del ratón)
  //    desmutea inmediatamente.
  const tryPlayUnmuted = async (): Promise<boolean> => {
    if (muted) return false;
    try {
      audio.muted = false;
      await audio.play();
      return true;
    } catch {
      audio.muted = true;
      return false;
    }
  };

  const startAudio = async (): Promise<void> => {
    const unmutedOK = await tryPlayUnmuted();
    if (unmutedOK) return;
    // Fallback: muted autoplay (siempre permitido)
    audio.muted = true;
    void audio.play().catch(() => {});
  };

  void startAudio();

  let unmuted = false;
  const onUserInteraction = (): void => {
    if (unmuted || muted) return;
    unmuted = true;
    audio.muted = false;
    if (audio.paused) {
      void audio.play().catch(() => {});
    }
    cleanupListeners();
  };

  // IMPORTANTE: Chrome solo considera "user gesture" estos eventos:
  // click, mouseup, pointerup, touchend, keyup, keydown.
  // mousemove/scroll/wheel NO sirven para desbloquear autoplay.
  const events: Array<[string, AddEventListenerOptions | boolean]> = [
    ['click', false],
    ['mouseup', false],
    ['pointerup', false],
    ['touchend', { passive: true }],
    ['touchstart', { passive: true }],
    ['keydown', false],
    ['keyup', false],
  ];

  for (const [evt, opts] of events) {
    document.addEventListener(evt, onUserInteraction, opts);
    window.addEventListener(evt, onUserInteraction, opts);
  }

  const cleanupListeners = (): void => {
    for (const [evt, opts] of events) {
      document.removeEventListener(evt, onUserInteraction, opts as EventListenerOptions);
      window.removeEventListener(evt, onUserInteraction, opts as EventListenerOptions);
    }
  };

  syncUI();

  button.addEventListener('click', () => {
    muted = !muted;
    syncAudio();
  });

  audio.addEventListener('error', () => {
    console.warn(
      `[audio] no se pudo cargar "${options.src}". Comprueba que el archivo existe en public/assets/sound/.`
    );
  });

  root.appendChild(audio);
  root.appendChild(button);

  return {
    destroy() {
      audio.pause();
      audio.remove();
      button.remove();
      cleanupListeners();
    },
    toggle() {
      muted = !muted;
      syncAudio();
    },
    setMuted(next) {
      muted = next;
      syncAudio();
    },
    isMuted() {
      return muted;
    },
  };
}

function inferAudioType(src: string): string {
  const lower = src.toLowerCase();
  if (lower.endsWith('.ogg')) return 'audio/ogg';
  if (lower.endsWith('.webm')) return 'audio/webm';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.aac')) return 'audio/aac';
  return 'audio/mpeg';
}

function readPersisted(): boolean | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === null) return null;
    return v === '1';
  } catch {
    return null;
  }
}

function persist(muted: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
  } catch {
    /* localStorage bloqueado: lo ignoramos */
  }
}

function renderIcon(muted: boolean): string {
  // Iconos inline (estilo lucide). El primero tiene una "X" sobre las ondas.
  if (muted) {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M11 5L6 9H2v6h4l5 4V5z"/>
        <line x1="22" y1="9" x2="16" y2="15"/>
        <line x1="16" y1="9" x2="22" y2="15"/>
      </svg>`;
  }
  return `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M11 5L6 9H2v6h4l5 4V5z"/>
      <path d="M15.5 8.5a5 5 0 010 7"/>
      <path d="M19 5a10 10 0 010 14"/>
    </svg>`;
}
