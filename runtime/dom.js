/** Small lifecycle helpers; no framework or hydration of the archived HTML. */
export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

export function smoothstep(start, end, value) {
  const progress = clamp((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
}

export function dispatch(name, detail) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function createScope() {
  const cleanups = [];
  return {
    add(cleanup) {
      if (typeof cleanup === 'function') cleanups.push(cleanup);
      return cleanup;
    },
    on(target, type, listener, options) {
      if (!target) return;
      target.addEventListener(type, listener, options);
      cleanups.push(() => target.removeEventListener(type, listener, options));
    },
    dispose() {
      for (const cleanup of cleanups.splice(0).reverse()) cleanup();
    },
  };
}
