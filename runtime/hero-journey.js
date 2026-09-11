import { clamp, createScope, dispatch } from './dom.js';

/** The original Experience scroll/hold choreography, mounted on the SSR DOM. */
export function mountHeroJourney(root) {
  const canvas = root?.querySelector('.hero-canvas');
  const control = root?.querySelector('.time-warp-control');
  if (!root || !canvas || !control) return () => {};

  const scope = createScope();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const heroCopy = root.querySelector('.hero-copy');
  const heroStory = root.querySelector('.hero-story');
  const controlTitle = control.querySelector('strong');
  const controlHint = control.querySelector('small');
  const controlRate = control.querySelector('.time-warp-rate');
  let scene;
  let ready = false;
  let disposed = false;
  let scrollFrame = 0;
  let sceneGeneration = 0;
  let holding = false;
  let touchStart = null;
  let holdTimer = 0;

  function renderControl() {
    control.disabled = reducedMotion.matches || root.dataset.scene === 'fallback';
    control.setAttribute('aria-pressed', String(holding));
    control.setAttribute('aria-label', holding ? '感受现在，松开恢复时间' : '按住画面，让时间慢下来');
    if (controlTitle) {
      controlTitle.textContent = reducedMotion.matches
        ? '已启用减少动态效果'
        : holding ? '感受现在' : '按住画面，让时间慢下来';
    }
    if (controlHint) controlHint.textContent = holding ? '松开恢复 · RELEASE TO RESUME' : 'HOLD TO SLOW DOWN';
    if (controlRate) controlRate.textContent = holding ? '0.08×' : '1.00×';
  }

  function setHolding(value) {
    if (value && (!scene || !ready || reducedMotion.matches)) return;
    if (holding === value) return;
    holding = value;
    scene?.setHolding(value);
    root.dataset.holding = String(value);
    renderControl();
    dispatch('dayu:time-warp', { holding: value });
  }

  function releaseHold() {
    setHolding(false);
    clearTimeout(holdTimer);
    holdTimer = 0;
    touchStart = null;
  }

  function updateScroll() {
    scrollFrame = 0;
    const bounds = root.getBoundingClientRect();
    const progress = clamp(-bounds.top / Math.max(1, bounds.height - innerHeight));
    const dissolve = clamp((progress - 0.76) / 0.24);
    const storyProgress = clamp((progress - 0.46) / 0.22);
    root.style.setProperty('--progress', progress.toFixed(4));
    root.style.setProperty('--dissolve', dissolve.toFixed(4));
    root.style.setProperty('--seam-opacity', String(Math.max(0, (progress - 0.55) / 0.45)));
    root.style.setProperty('--hero-opacity', String(1 - Math.min(1, progress / 0.36)));
    root.style.setProperty('--hero-y', `${progress * -140}px`);
    root.style.setProperty('--story-opacity', String(storyProgress));
    root.style.setProperty('--story-y', `${(1 - storyProgress) * 50}px`);
    root.dataset.active = String(bounds.bottom > 0 && bounds.top < innerHeight);
    if (bounds.bottom <= 0 || bounds.top >= innerHeight) releaseHold();
    if (heroCopy) heroCopy.inert = !reducedMotion.matches && progress > 0.34;
    if (heroStory) heroStory.inert = reducedMotion.matches || progress < 0.52;
    scene?.setProgress(reducedMotion.matches ? 0 : progress);
  }

  function scheduleScroll() {
    if (touchStart) releaseHold();
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
  }

  function resize() {
    scene?.resize();
    scheduleScroll();
  }

  function pointerMove(event) {
    scene?.setPointer(event.clientX / innerWidth * 2 - 1, event.clientY / innerHeight * 2 - 1);
    if (touchStart && event.pointerId === touchStart.id
      && Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y) > 9) releaseHold();
  }

  function pointerDown(event) {
    if (!event.isPrimary || event.button !== 0 || reducedMotion.matches) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('a, button') && !target.closest('.time-warp-control')) return;
    if (event.pointerType === 'touch') {
      releaseHold();
      touchStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
      holdTimer = setTimeout(() => { if (touchStart) setHolding(true); }, 140);
    } else {
      setHolding(true);
    }
  }

  function preventSelection(event) {
    if (!(event.target instanceof Element) || !event.target.closest('a')) event.preventDefault();
  }

  function keyDown(event) {
    if (event.code !== 'Space' && event.code !== 'Enter') return;
    event.preventDefault();
    if (!event.repeat) setHolding(true);
  }

  function keyUp(event) {
    if (event.code !== 'Space' && event.code !== 'Enter') return;
    event.preventDefault();
    releaseHold();
  }

  async function loadScene() {
    const generation = ++sceneGeneration;
    ready = false;
    scene?.dispose();
    scene = undefined;
    root.dataset.scene = 'loading';
    renderControl();
    try {
      const { mountScene } = await import('../vendor-reference/_next/static/chunks/dayu-scene-BTE3YKpP.js');
      if (disposed || generation !== sceneGeneration) return;
      scene = mountScene(canvas, {
        reducedMotion: reducedMotion.matches,
        onReady() {
          if (disposed || generation !== sceneGeneration) return;
          ready = true;
          root.dataset.scene = 'ready';
          delete root.dataset.sceneError;
          renderControl();
        },
        onError(error) {
          if (disposed || generation !== sceneGeneration) return;
          ready = false;
          releaseHold();
          root.dataset.scene = 'fallback';
          root.dataset.sceneError = error?.message || String(error || 'WebGL is unavailable');
          console.warn('Hero scene uses its static fallback:', error);
          renderControl();
        },
      });
      updateScroll();
    } catch (error) {
      if (disposed || generation !== sceneGeneration) return;
      root.dataset.scene = 'fallback';
      renderControl();
      console.warn('The visual scene is unavailable; the original static fallback is active.', error);
    }
  }

  const revealObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.dataset.revealed = 'true';
        revealObserver.unobserve(entry.target);
      }
    }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' })
    : null;

  function prepareReveals() {
    document.documentElement.classList.toggle('motion-ready', !reducedMotion.matches && !!revealObserver);
    for (const element of document.querySelectorAll('[data-reveal]')) {
      if (reducedMotion.matches || !revealObserver) {
        element.dataset.revealed = 'true';
      } else {
        revealObserver.observe(element);
      }
    }
  }

  function motionChanged() {
    releaseHold();
    prepareReveals();
    loadScene();
  }

  dispatch('dayu:time-warp', { holding: false });
  root.dataset.holding = 'false';
  prepareReveals();
  loadScene();
  updateScroll();
  scope.on(window, 'scroll', scheduleScroll, { passive: true });
  scope.on(window, 'resize', resize);
  scope.on(window, 'pointermove', pointerMove, { passive: true });
  scope.on(root, 'pointerdown', pointerDown, { passive: true });
  scope.on(root, 'contextmenu', preventSelection);
  scope.on(root, 'selectstart', preventSelection);
  scope.on(root, 'pointerleave', releaseHold);
  scope.on(control, 'keydown', keyDown);
  scope.on(control, 'keyup', keyUp);
  scope.on(control, 'blur', releaseHold);
  scope.on(window, 'pointerup', releaseHold);
  scope.on(window, 'pointercancel', releaseHold);
  scope.on(window, 'blur', releaseHold);
  scope.on(document, 'visibilitychange', () => { if (document.hidden) releaseHold(); });
  scope.on(reducedMotion, 'change', motionChanged);

  return () => {
    releaseHold();
    disposed = true;
    sceneGeneration += 1;
    scene?.dispose();
    cancelAnimationFrame(scrollFrame);
    revealObserver?.disconnect();
    scope.dispose();
    document.documentElement.classList.remove('motion-ready');
  };
}
