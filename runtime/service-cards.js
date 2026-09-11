import { clamp, createScope, smoothstep } from './dom.js';

/** Original scroll-linked stack/spread/flip timings, including keyboard access. */
export function mountServiceCards(root) {
  const stage = root?.querySelector('.service-cards__stage');
  const cards = [...root?.querySelectorAll('.service-card') ?? []];
  const fronts = cards.map(card => card.querySelector('.service-card__front'));
  if (!root || !stage || !cards.length || fronts.some(front => !front)) return () => {};

  const scope = createScope();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let active = false;
  let keyboardNavigation = false;

  function render() {
    frame = 0;
    const viewportHeight = innerHeight;
    const mobile = innerWidth <= 700;
    const stageHeight = stage.offsetHeight;
    const canPin = !mobile && stageHeight < viewportHeight - 160;
    const showFront = reducedMotion.matches || keyboardNavigation;
    root.dataset.pinned = String(canPin && !reducedMotion.matches);
    root.style.setProperty('--service-stage-height', `${stageHeight}px`);
    const bounds = root.getBoundingClientRect();
    const progress = clamp((viewportHeight * (canPin ? 0.58 : 0.72) - bounds.top)
      / (viewportHeight * (canPin ? 1.2 : 0.5)));
    const spread = showFront ? 1 : smoothstep(canPin ? 0.18 : 0.08, canPin ? 0.63 : 0.94, progress);
    root.dataset.cardProgress = progress.toFixed(3);

    cards.forEach((card, index) => {
      const stackX = (stage.clientWidth - card.offsetWidth) * 0.5 - card.offsetLeft;
      const stackY = (canPin ? Math.max(0, (stageHeight - card.offsetHeight) * 0.35) : 0) - card.offsetTop;
      const x = (stackX + index * (mobile ? 3 : 7)) * (1 - spread);
      const y = (stackY + index * (mobile ? 10 : 8)) * (1 - spread);
      const top = bounds.top + card.offsetTop + y;
      const viewportProgress = smoothstep(0, 1, (viewportHeight * 0.83 - top) / (viewportHeight * 0.48));
      const flipProgress = canPin
        ? smoothstep(0.43 + index * 0.055, 0.81 + index * 0.055, progress)
        : Math.min(viewportProgress, smoothstep(0.3, 0.94, progress));
      const frontLocked = showFront || fronts[index].contains(document.activeElement)
        || !!card.querySelector('dialog[open]') || card.dataset.contactOpen === 'true';
      const turn = (1 - (frontLocked ? 1 : flipProgress)) * 180 * (index % 2 ? 1 : -1);
      const frontVisible = frontLocked || Math.abs(turn) < 70 && spread > 0.8;
      card.style.setProperty('--service-x', `${(frontLocked ? 0 : x).toFixed(2)}px`);
      card.style.setProperty('--service-y', `${(frontLocked ? 0 : y).toFixed(2)}px`);
      card.style.setProperty('--service-scale', (frontLocked ? 1 : 0.94 + spread * 0.06).toFixed(4));
      card.style.setProperty('--service-turn', `${turn.toFixed(2)}deg`);
      card.style.setProperty('--service-twist', `${(frontLocked ? 0 : (1 - spread) * (index - 1.5) * 4).toFixed(2)}deg`);
      card.style.zIndex = String(frontLocked ? 5 : cards.length - index);
      card.dataset.side = frontVisible ? 'front' : 'back';
      fronts[index].inert = !frontVisible;
    });
  }

  function schedule() {
    if (active && !frame && !document.hidden) frame = requestAnimationFrame(render);
  }

  function keyDown(event) {
    if (!['Tab', 'PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp', ' '].includes(event.key)) return;
    keyboardNavigation = true;
    cancelAnimationFrame(frame);
    render();
  }

  function pointerDown(event) {
    if (!keyboardNavigation || event.target instanceof Element && event.target.closest('dialog')) return;
    keyboardNavigation = false;
    schedule();
  }

  const observer = new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting;
    root.dataset.active = String(active);
    if (active) schedule();
    else {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }, { rootMargin: '160px 0px', threshold: 0 });
  observer.observe(root);
  const resizeObserver = new ResizeObserver(schedule);
  resizeObserver.observe(stage);
  root.dataset.motionReady = 'true';
  scope.on(window, 'scroll', schedule, { passive: true });
  scope.on(window, 'resize', schedule);
  scope.on(window, 'keydown', keyDown, true);
  scope.on(window, 'pointerdown', pointerDown, { passive: true });
  scope.on(window, 'dayu:contact-state', render);
  scope.on(root, 'focusin', render);
  scope.on(reducedMotion, 'change', render);

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    resizeObserver.disconnect();
    scope.dispose();
    for (const key of ['motionReady', 'active', 'pinned', 'cardProgress']) delete root.dataset[key];
    root.style.removeProperty('--service-stage-height');
    cards.forEach((card, index) => {
      for (const key of ['--service-turn', '--service-x', '--service-y', '--service-scale', '--service-twist', 'z-index']) {
        card.style.removeProperty(key);
      }
      delete card.dataset.side;
      fronts[index].inert = false;
    });
  };
}
