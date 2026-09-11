# Reference homepage integration notes

Source: <https://dayuai.online/>. Raw response and all downloaded assets are retained without code edits. This is an implementation reference, not a claim that the reference site's creator, portraits, projects, awards, or contact identities belong to this project's user.

`download-manifest.json` contains every source URL, preserved relative path, content type, byte size, timestamp, and fetch failure. At download completion: **90 files, 11,606,791 bytes, zero failures**. The file count excludes the manifest and this note. No other HTML route was downloaded. `DirectorContent` and its photos are dependencies of the homepage's expandable director panel, not a crawl of case-study pages. No browser-injected or Cloudflare analytics script was downloaded.

## Standalone visual exports

| Module under `_next/static/chunks/` | Export | Signature | Return |
| --- | --- | --- | --- |
| `dayu-scene-BTE3YKpP.js` | `mountScene` | `(canvas, { reducedMotion = false, onReady = () => {}, onError = () => {} } = {})` | `{ setProgress, setPointer, setHolding, resize, dispose }` |
| `footer-fluid-4hto47B4.js` | `mountFooterFluid` | `(canvas, hostElement)` | Cleanup function |
| `focus-image-C27tAGAS.js` | `mountFocusImage` | `(hostElement, imageElement)` | Cleanup function |

The hero and footer modules each import only `three.module-BrccC3o8.js`. FocusImage has no imports. Hero geometry, stone textures, particles, fog, post-processing bloom, and the footer shapes are procedural: no remote texture/model download is needed.

Do not load the original `index-DfmElV1X.js` browser entry when using rewritten static content: it hydrates the original React/RSC payload and restores original author content. The capitalized component modules are React components, whereas the three lower-case modules above are direct DOM/canvas engines.

### Hero engine

- `setProgress(progress)`: clamps progress to `[0, 1]` and eases toward it internally.
- `setPointer(x, y)`: normalized pointer values in `[-1, 1]`, calculated as `clientX / innerWidth * 2 - 1` and `clientY / innerHeight * 2 - 1` (positive y downward).
- `setHolding(boolean)`: slows hero simulation toward `0.08×`; this does not control audio by itself.
- `resize()`: updates renderer size; resize and visibility observers are already installed internally.
- `dispose()`: disconnects observers/listeners and disposes WebGL resources.
- `onReady()`: called after the first successful render. Set `.hero-journey[data-scene="ready"]`.
- `onError(error)`: called on renderer creation, shader compilation/rendering failure, or WebGL context loss. Set `.hero-journey[data-scene="fallback"]`.
- Creation failure still returns a harmless object with every method present.

Original scroll mapping, where `rect = hero.getBoundingClientRect()`:

```js
const p = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height - innerHeight)));
hero.style.setProperty('--progress', p.toFixed(4));
hero.style.setProperty('--dissolve', Math.max(0, Math.min(1, (p - .76) / .24)).toFixed(4));
hero.style.setProperty('--seam-opacity', String(Math.max(0, (p - .55) / .45)));
hero.style.setProperty('--hero-opacity', String(1 - Math.min(1, p / .36)));
hero.style.setProperty('--hero-y', `${p * -140}px`);
hero.style.setProperty('--story-opacity', String(Math.max(0, Math.min(1, (p - .46) / .22))));
hero.style.setProperty('--story-y', `${(1 - Math.max(0, Math.min(1, (p - .46) / .22))) * 50}px`);
hero.dataset.active = String(rect.bottom > 0 && rect.top < innerHeight);
heroCopy.inert = !reducedMotion && p > .34;
heroStory.inert = reducedMotion || p < .52;
scene.setProgress(reducedMotion ? 0 : p);
```

Original hold gestures: mouse primary down begins immediately except links/buttons other than `.time-warp-control`; touch begins after 140ms and is cancelled if pointer travels more than 9px. Release on pointerup, cancel, pointerleave, blur, visibility loss, and scrolling. Space/Enter on the control begins on keydown and releases on keyup. Publish `dayu:time-warp` alongside `scene.setHolding()`.

### Entry dialog contract

Before scene mount: clear `window.__dayuWorldEnteredAt`, keep `.world-entry[open]`, set `window.__dayuEntryOpen = true`, and set `document.documentElement.dataset.dayuEntryState = 'open'`. Promote the SSR non-modal dialog to `showModal()` by calling `close()` then `showModal()`. Lock body scrolling and keep the viewport at the top until the dialog closes.

Both the audible entry button and silent/ESC entry begin the same visual animation:

```js
const at = performance.now();
window.__dayuWorldEnteredAt = at;
document.documentElement.dataset.dayuWorldEnteredAt = String(at);
window.dispatchEvent(new CustomEvent('dayu:world-enter', { detail: { at } }));
entry.dataset.state = 'leaving';
window.__dayuEntryOpen = true;
document.documentElement.dataset.dayuEntryState = 'leaving';
window.dispatchEvent(new CustomEvent('dayu:entry-state', { detail: { open: true, phase: 'leaving' } }));
```

After 2800ms (50ms with reduced motion): close/remove the dialog, restore body scrolling, set `__dayuEntryOpen = false`, set the root data phase to `none`, and dispatch `dayu:entry-state` with `{ open: false, phase: 'none' }`. If the original URL contains a valid target hash, scroll to that target only after entry closes.

While the dialog is open, pointer position is published as `dayu:entry-pointer`, detail `{x,y,strength}`. Coordinates use the same normalized convention above. Compute the pointer's distance to the entry button rectangle; `near = max(0, 1 - distance / 180)`, `strength = .3 + near * .7`. Set entry CSS `--entry-near`, `--entry-x`, and `--entry-y` (pixel coordinates). On leave/unmount, publish `{x:0,y:0,strength:0}`. Reduced motion skips the shader pointer event.

### Footer and image engines

`mountFooterFluid(canvas, host)` requires a visible `.footer-fluid` host. It sets `host.dataset.ready = 'true'` after rendering; this activates the reference CSS's fallback transition. It handles pointer physics, resizing, visibility, reduced motion, and cleanup internally. Particle count is 220 on desktop, 96 with a coarse pointer.

`mountFocusImage(host, img)` may be called for all `.focus-image` wrappers after DOM parsing; it waits for visibility/image loading itself. The original image remains the source for its shared WebGL canvas and focus/hover transitions. It automatically declines animation for coarse pointers or reduced motion.

## Audio engine adapter

`../runtime/audio-engine.js` exposes `mountAudioEngine(audioElement, () => soundEnabled)`, extracted from the original Header helper. Only the standalone wrapper/export and the two audio asset URL expressions differ from the original function. It returns `{ unlock, dispose }`.

Call `audio.play()` and `engine.unlock()` synchronously within the user's audible-entry / enable-sound gesture. Set the permission flag before those calls. Silent entry must not play or unlock audio. On mute, call `audio.pause()`. The outer page must update its sound label/data state from `playing`, `pause`, and `error`, and pause/retry playback on document visibility changes.

Engine behavior retained:

- Ambient base volume `.48`; recognition theme volume `.62`.
- Equal-power crossfade with smoothstep and `.8s` transitions when the `#recognition` section enters view. Entry/exit hysteresis thresholds `.35` / `.08`.
- `dayu:time-warp`, detail `{holding:boolean}`: `.45×` base-buffer rate while held, transition `.35s` down / `.55s` up. Ambient media element itself remains at `playbackRate = 1` because the decoded audio buffer becomes the audible engine.
- `dayu:focus-sound`, detail `{x:-1..1}`: short generated focus/air sound panned by x. Maximum two simultaneous effects; events throttled to at least `.32s` apart.
- `unlock()` acquires/resumes WebAudio and starts loading/decoding the two local tracks. Audio permission and visible/play state remain guarded by `isEnabled()`.
- `dispose()` removes all listeners, aborts pending audio fetches, cancels ramps, and cleans up resources.

## GlowField adapter

`../runtime/glow-field.js` exposes `mountGlowField(hostElement) -> cleanupFunction`. It reads words from `.glow-field__fallback span`, detects the awards variant from `.glow-field--awards`, and uses the existing `.glow-field__viewport` / `.glow-field__canvas` nodes. The original Canvas2D rendering effect is unchanged except for converting React refs to DOM queries and returning harmless cleanup functions if a context is unavailable. Font-ready redraw, ResizeObserver, IntersectionObserver, reduced-motion/fine-pointer media queries, pointer trails, awards drift, and cleanup all retain the original implementation.

Both standalone adapters were syntax-checked with `node --check`. Their extracted effect/helper bodies were also checked byte-for-byte against the source after reversing only the documented input/URL/cleanup adaptations.

## Original modules not needed by the static runtime

`Header`, `Experience`, `FocusImage`, `GlowField`, `DirectorPanel`, `ServiceCards`, `FooterFluid`, `ContactDialog`, and `DirectorContent` have default React exports. `Arrow` exports its component as `t`. `framework`, `rolldown-runtime`, `layout-segment-context`, and the main `index` bundle are framework support. They are preserved for source inspection and provenance, not intended to run over adapted static content.
