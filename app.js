import { createScope, dispatch } from './runtime/dom.js';
import { mountHeader } from './runtime/header.js';
import { mountDialogs } from './runtime/dialogs.js';
import { mountHeroJourney } from './runtime/hero-journey.js';
import { mountServiceCards } from './runtime/service-cards.js';
import { mountGlowField } from './runtime/glow-field.js';

// Deliberately do not import the reference React/index bundle: the content is
// local, already rendered, and must never be overwritten by remote-site hydration.
const scope = createScope();
let disposed = false;

function mount(name, operation) {
  try {
    scope.add(operation());
  } catch (error) {
    console.warn(`${name} enhancement is unavailable; static content remains available.`, error);
  }
}

// The entry flags must be established before the original scene is constructed.
mount('Entry and audio', mountHeader);
mount('Dialogs', mountDialogs);
mount('Hero journey', () => mountHeroJourney(document.querySelector('.hero-journey')));
for (const root of document.querySelectorAll('.service-cards')) mount('Service cards', () => mountServiceCards(root));
for (const root of document.querySelectorAll('.glow-field')) mount('Glow field', () => mountGlowField(root));

function mountFocusImages() {
  const images = [...document.querySelectorAll('.focus-image')];
  const localScope = createScope();
  let unmounted = false;
  const touch = matchMedia('(hover: none), (pointer: coarse)').matches;
  for (const host of images) {
    function focusSound(event) {
      if (event.pointerType === 'touch' && event.type === 'pointerenter') return;
      const bounds = host.getBoundingClientRect();
      dispatch('dayu:focus-sound', { x: (bounds.left + bounds.width / 2) / innerWidth * 2 - 1 });
    }
    localScope.on(host, 'pointerenter', focusSound);
    localScope.on(host, 'pointerdown', focusSound);
    localScope.on(host, 'focusin', focusSound);
    if (touch) {
      const observer = new IntersectionObserver(([entry]) => {
        host.dataset.touchVisible = String(entry.isIntersecting && entry.intersectionRatio >= 0.35);
      }, { threshold: [0, 0.35] });
      observer.observe(host);
      localScope.add(() => { observer.disconnect(); delete host.dataset.touchVisible; });
    }
  }
  if (images.length) {
    import('./vendor-reference/_next/static/chunks/focus-image-C27tAGAS.js').then(({ mountFocusImage }) => {
      if (unmounted || disposed) return;
      for (const host of images) {
        const image = host.querySelector('.focus-image__source, img');
        if (image) localScope.add(mountFocusImage(host, image));
      }
    }).catch(error => console.warn('Image focus uses the original CSS fallback.', error));
  }
  return () => { unmounted = true; localScope.dispose(); };
}

function mountFooter(host) {
  const canvas = host.querySelector('canvas');
  if (!canvas) return () => {};
  let unmounted = false;
  let cleanup;
  let loaded = false;
  let generation = 0;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  async function loadFluid() {
    const current = ++generation;
    try {
      const { mountFooterFluid } = await import('./vendor-reference/_next/static/chunks/footer-fluid-4hto47B4.js');
      if (unmounted || disposed || current !== generation) return;
      cleanup?.();
      cleanup = mountFooterFluid(canvas, host);
    } catch (error) {
      delete host.dataset.ready;
      console.warn('The footer uses its original static composition.', error);
    }
  }

  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    loaded = true;
    loadFluid();
  }, { rootMargin: '240px' });
  observer.observe(host);
  function motionChanged() {
    if (loaded) loadFluid();
  }
  reducedMotion.addEventListener('change', motionChanged);
  return () => {
    unmounted = true;
    generation += 1;
    observer.disconnect();
    reducedMotion.removeEventListener('change', motionChanged);
    cleanup?.();
  };
}

mount('Image focus', mountFocusImages);
for (const footer of document.querySelectorAll('.footer-fluid')) mount('Footer', () => mountFooter(footer));

document.documentElement.dataset.runtimeReady = 'true';

// Keep the live state when restored from the browser back/forward cache.
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  disposed = true;
  scope.dispose();
}, { once: true });
