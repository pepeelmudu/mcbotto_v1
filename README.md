# McBotto Landing

Landing page del evento McBotto x McDonald's (colaboracion ficticia). Construida como un "collage" de PNGs y vectores apilados sobre un sistema de stage con aspect-ratio fijo y coordenadas en porcentajes derivadas del PSD.

## Stack

- Vite + TypeScript vanilla (sin framework)
- CSS plano con variables (`src/styles/tokens.css`)

## Scripts

```bash
npm install
npm run dev       # http://localhost:5173
npm run build
npm run preview
```

Modo debug (muestra outline y label de cada layer): `http://localhost:5173/?debug`

## Sistema de stage

Cada seccion visual es un `.stage` con `aspect-ratio` fijo igual al del PSD. Adentro, los assets van `position: absolute` con `left/top/width/height` en porcentaje. La composicion entera escala como una sola unidad.

Las coordenadas no se calculan a mano: se declaran en pixeles del PSD en `src/data/*.layers.ts` y `src/lib/stage.ts` las convierte a % al renderizar.

```ts
{
  id: 'machine',
  kind: 'img',
  src: '/assets/hero/machine.png',
  psd: { x: 640, y: 140, w: 720, h: 820 }, // pixeles del PSD
  z: 2,
}
```

## Estructura

```
public/assets/
  bg/         # fondos (PNG/JPG/WebP)
  hero/       # maquina, video screen, posters
  collection/ # PNGs de los juguetes
  masks/      # PNGs de mascara para mask-image (si hace falta)
  audio/      # loop.mp3 (musiquilla de fondo) + opcional loop.webm
src/
  data/       # composiciones (canvas + layers) por seccion y breakpoint
  lib/
    stage.ts       # helper PSD -> % y render del stage
    scrollAnim.ts  # IntersectionObserver para animaciones de entrada
    audio.ts       # mountAudioToggle (audio loop + boton mute)
  sections/   # mountHero, mountCollection
  styles/     # reset, tokens, anim, stage, audio, hero, collection
```

## Reglas de export desde Photoshop

1. **Dos canvas obligatorios**: `1920x1080` para desktop y `1080x1920` para mobile. Se reflejan en `tokens.css` y en `*.layers.ts` / `*.layers.mobile.ts`.
2. **Un PNG por elemento**, con alpha real (no fondo blanco). Si el elemento es plano, mejor SVG.
3. **Naming**: kebab-case, prefijo por seccion. Ejemplos:
   - `hero/machine.png`, `hero/machine-mobile.png`
   - `hero/screen-loop.mp4`, `hero/screen-loop.webm`, `hero/screen-poster.jpg`
   - `collection/toy-01.png`, `collection/toy-02.png`
4. **Coordenadas**: con la layer seleccionada en Photoshop, `Window > Properties` muestra `X / Y / W / H` en pixeles. Esos cuatro numeros van directo al objeto `psd` de cada layer.
5. **Pantalla de la maquina**: el rectangulo de la pantalla se recorta como **alpha real** dentro de `machine.png`. Las coordenadas de ese rectangulo (en el PSD) son las que van al layer `screen` (el video). El video va detras (z menor) y el PNG encima tapa todo menos el recorte.
6. **PNGs grandes**: pasarlos por TinyPNG o exportar como WebP (con plugin de Vite o a mano) para reducir peso.
7. **Videos del hero**:
   - Encoding sugerido: H.264 1280x720 24fps CRF 23 (MP4) y VP9 CRF 32 (WebM).
   - Sin alpha (la "ventana" la hace el PNG de la maquina). Target ≤ 2 MB.
   - Si en algun momento se necesita un video con alpha real, ver seccion "Videos con alpha" abajo.

## Como agregar una nueva layer

1. Exportar el PNG/SVG a `public/assets/<seccion>/<nombre>.png`.
2. Anotar `x, y, w, h` desde Photoshop.
3. Agregar el objeto al array correspondiente en `src/data/*.layers.ts` (y la version mobile).
4. `npm run dev` y listo. Si se ve fuera de lugar, ajustar `psd` y/o `z`.

## Como agregar una nueva seccion

1. Crear `src/data/<seccion>.layers.ts` (export `<seccion>Desktop` y `<seccion>Mobile` con `canvas` y `layers`).
2. Crear `src/sections/<seccion>.ts` con `mount<Seccion>()` siguiendo el patron de `hero.ts` / `collection.ts` (matchMedia + `renderStage`).
3. Crear `src/styles/<seccion>.css` y agregar la regla `.stage--<seccion>` en `stage.css` con su `aspect-ratio`.
4. Importar el CSS y llamar `mount<Seccion>()` desde `src/main.ts`.

## Videos con alpha (cuando los necesitemos)

No hace falta para la maquina del hero: el alpha del PNG ya recorta la "ventana" para el video.

Para videos donde el contenido en si tiene transparencia (ej: un personaje moviendose):

- **Cross-browser**: doble fuente VP9-WebM + HEVC-MOV en el mismo `<video>` (ya soportado por `LayerSpec.sources`).
- **Liviano**: tecnica side-by-side (RGB | alpha) sobre `<canvas>` con shader. Pendiente de implementar en `src/lib/videoMask.ts` cuando aparezca el primer asset que lo necesite.

## Mascaras estaticas

Si una layer necesita una mascara compleja (no rectangular y no animada), usar `mask-image` con un PNG de `public/assets/masks/`. Aplicar la regla CSS especifica a la layer por su `data-id`.

## Animaciones de entrada

Cada layer puede declarar una animacion de entrada que se dispara cuando entra al viewport (IntersectionObserver, `threshold: 0.15`, no se reverte). El sistema vive en [src/lib/scrollAnim.ts](src/lib/scrollAnim.ts) y los estilos en [src/styles/anim.css](src/styles/anim.css).

```ts
{
  id: 'machine',
  kind: 'img',
  src: '/assets/hero/machine.png',
  psd: { x: 640, y: 140, w: 720, h: 820 },
  anim: { type: 'slide-up', delay: 300, duration: 1100 },
}
```

Tipos disponibles: `fade`, `slide-left`, `slide-right`, `slide-up`, `slide-down`, `zoom`. Los valores `delay` y `duration` van en milisegundos.

Para animar elementos que no son layers de un stage (titulos, etiquetas), basta con sumar las clases `anim` y `anim--<tipo>` y opcionalmente `style="--anim-delay:200ms"`. Despues hay que llamar `observeAnimated(rootElement)` una vez para que el observer los registre.

El sistema respeta `prefers-reduced-motion`: si el usuario tiene esa preferencia activa, los elementos aparecen sin animacion.

## Audio de fondo

Loop musical opcional con boton flotante arriba a la derecha para silenciar/activar. Logica en [src/lib/audio.ts](src/lib/audio.ts), estilos en [src/styles/audio.css](src/styles/audio.css).

Asset esperado: `public/assets/audio/loop.mp3` (ideal: 30-60s, ≤ 1 MB, normalizado bajo). Opcional `loop.webm` (Opus) como fallback mas liviano para Chrome/Firefox.

Comportamiento:

- Las politicas de autoplay del browser **bloquean audio sin interaccion del usuario**. Por eso la landing arranca silenciada por defecto.
- El usuario hace click en el boton para activar la musica. La preferencia se guarda en `localStorage` (`mcbotto_audio_muted`).
- Si en una visita previa habia dejado el audio activo, intentamos reanudarlo en el primer gesto que haga (click, touch, tecla).
- Mientras suena, el boton tiene un anillo amarillo pulsante para que se vea claramente que esta activo.
- El volumen por defecto es 0.4 (musiquilla de fondo, no protagonista). Se puede cambiar al instanciar `mountAudioToggle`.

Si el archivo de audio no existe, el boton aparece igual y se ve un warning en la consola; no rompe la pagina.
