import { mountAudioEngine } from './audio-engine.js';
import { createScope, dispatch } from './dom.js';

/** Entry curtain and audio consent preserve the reference's 2.8-second arrival. */
export function mountHeader() {
  const scope = createScope();
  const header = document.querySelector('.site-header');
  const entry = document.querySelector('.world-entry');
  const entryButton = entry?.querySelector('.world-entry-button');
  const quietButton = entry?.querySelector('.world-entry-quiet');
  const soundButton = document.querySelector('.sound-control');
  const audio = document.querySelector('audio');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const html = document.documentElement;
  let entered = !entry;
  let soundEnabled = false;
  let audioState = 'waiting';
  let audioUnavailable = false;
  let disposed = false;
  let playGeneration = 0;
  let exitTimer = 0;
  let pointerFrame = 0;
  let pointerX = innerWidth / 2;
  let pointerY = innerHeight / 2;
  let pendingHash = null;
  let entryLocked = false;
  let previousOverflow = '';
  const previousFocus = document.activeElement;

  function setEntryPhase(phase) {
    const open = phase !== 'none';
    window.__dayuEntryOpen = open;
    html.dataset.dayuEntryState = phase;
    if (entry) entry.dataset.state = phase;
    dispatch('dayu:entry-state', { open, phase });
  }

  function announceArrival() {
    if (typeof window.__dayuWorldEnteredAt === 'number') return;
    const at = performance.now();
    window.__dayuWorldEnteredAt = at;
    html.dataset.dayuWorldEnteredAt = String(at);
    dispatch('dayu:world-enter', { at });
  }

  function renderSound() {
    if (!soundButton) return;
    const label = audioState === 'playing' ? '声音开'
      : audioState === 'off' ? '声音关'
        : audioUnavailable ? '声音不可用' : '声音';
    const description = audioState === 'playing' ? '关闭背景音乐'
      : audioState === 'off' ? '开启背景音乐'
        : audioUnavailable ? '背景音乐暂时无法加载，点击关闭'
          : !entered ? '进入网站后播放背景音乐' : '背景音乐等待播放，点击关闭';
    soundButton.dataset.state = audioState;
    soundButton.setAttribute('aria-label', description);
    soundButton.setAttribute('aria-pressed', String(audioState !== 'off'));
    soundButton.title = description;
    const text = soundButton.querySelector('.sound-label');
    if (text) text.textContent = label;
  }

  function setAudioState(state) {
    audioState = state;
    renderSound();
  }

  function requestPlayback() {
    if (!audio || !entered || !soundEnabled || document.hidden || disposed) return;
    const generation = ++playGeneration;
    audio.play().then(() => {
      if (!disposed && (!soundEnabled || document.hidden)) audio.pause();
    }).catch(error => {
      if (disposed || generation !== playGeneration || !soundEnabled || !audio.paused) return;
      if (error?.name !== 'NotAllowedError' && error?.name !== 'AbortError') audioUnavailable = true;
      setAudioState('waiting');
    });
  }

  if (audio) audio.volume = 0.48;
  const audioEngine = audio ? mountAudioEngine(audio, () => soundEnabled) : null;

  function toggleSound() {
    if (!audio) return;
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      setAudioState('waiting');
      requestPlayback();
      audioEngine?.unlock();
    } else {
      audio.pause();
      setAudioState('off');
    }
  }

  function keepEntryAtTop() {
    if (entryLocked && (scrollX !== 0 || scrollY !== 0)) scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }

  function resetEntryPointer() {
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    entry?.style.setProperty('--entry-near', '0');
    dispatch('dayu:entry-pointer', { x: 0, y: 0, strength: 0 });
  }

  function finishEntry() {
    if (!entry || disposed) return;
    resetEntryPointer();
    entry.close();
    entry.removeAttribute('open');
    entryLocked = false;
    document.body.style.overflow = previousOverflow;
    setEntryPhase('none');
    if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
      previousFocus.focus({ preventScroll: true });
    }
    if (pendingHash) {
      const target = document.getElementById(pendingHash);
      pendingHash = null;
      target?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }

  function enterWorld(withSound) {
    if (entered) return;
    announceArrival();
    setEntryPhase('leaving');
    entered = true;
    soundEnabled = withSound;
    if (withSound) {
      requestPlayback();
      audioEngine?.unlock();
    } else {
      audio?.pause();
      setAudioState('off');
    }
    renderSound();
    exitTimer = setTimeout(finishEntry, reducedMotion.matches ? 50 : 2800);
  }

  function renderEntryPointer() {
    pointerFrame = 0;
    if (!entry || !entryButton || !entryLocked) return;
    const bounds = entryButton.getBoundingClientRect();
    const distance = Math.hypot(
      Math.max(bounds.left - pointerX, 0, pointerX - bounds.right),
      Math.max(bounds.top - pointerY, 0, pointerY - bounds.bottom),
    );
    const near = Math.max(0, 1 - distance / 180);
    entry.style.setProperty('--entry-near', String(near));
    entry.style.setProperty('--entry-x', `${pointerX}px`);
    entry.style.setProperty('--entry-y', `${pointerY}px`);
    if (!reducedMotion.matches) {
      dispatch('dayu:entry-pointer', {
        x: pointerX / innerWidth * 2 - 1,
        y: pointerY / innerHeight * 2 - 1,
        strength: 0.3 + near * 0.7,
      });
    }
  }

  function entryPointer(event) {
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!pointerFrame) pointerFrame = requestAnimationFrame(renderEntryPointer);
  }

  function audioPlaying() {
    if (entered && soundEnabled && !document.hidden) {
      audioUnavailable = false;
      setAudioState('playing');
    } else {
      audio?.pause();
    }
  }

  function audioPaused() {
    setAudioState(soundEnabled ? 'waiting' : 'off');
  }

  function audioError() {
    audioUnavailable = true;
    setAudioState(soundEnabled ? 'waiting' : 'off');
  }

  function visibilityChanged() {
    if (document.hidden) audio?.pause();
    else requestPlayback();
  }

  function retryAudioFromGesture(event) {
    if (!event.isTrusted || !entered || !soundEnabled) return;
    if (event.target instanceof Element && event.target.closest('.sound-control, .world-entry')) return;
    if (audio?.paused) requestPlayback();
    audioEngine?.unlock();
  }

  if (entry) {
    delete window.__dayuWorldEnteredAt;
    delete html.dataset.dayuWorldEnteredAt;
    setEntryPhase('open');
    let hash = location.hash.slice(1);
    try { hash = decodeURIComponent(hash); } catch { /* Preserve malformed hashes without throwing. */ }
    pendingHash = hash && document.getElementById(hash) ? hash : null;
    previousOverflow = document.body.style.overflow;
    entryLocked = true;
    document.body.style.overflow = 'hidden';
    keepEntryAtTop();
    entry.close();
    entry.showModal();
    entry.focus({ preventScroll: true });
  } else {
    setEntryPhase('none');
    announceArrival();
    setAudioState('off');
  }

  function updateHeader() {
    header?.classList.toggle('is-scrolled', scrollY > innerHeight * 1.15);
  }

  scope.on(window, 'scroll', keepEntryAtTop, { passive: true });
  scope.on(window, 'scroll', updateHeader, { passive: true });
  scope.on(window, 'resize', updateHeader);
  scope.on(entryButton, 'click', () => enterWorld(true));
  scope.on(quietButton, 'click', () => enterWorld(false));
  scope.on(entry, 'cancel', event => { event.preventDefault(); enterWorld(false); });
  scope.on(entry, 'pointermove', entryPointer, { passive: true });
  scope.on(entry, 'pointerdown', entryPointer, { passive: true });
  scope.on(entry, 'pointerleave', resetEntryPointer);
  scope.on(soundButton, 'click', toggleSound);
  scope.on(audio, 'playing', audioPlaying);
  scope.on(audio, 'pause', audioPaused);
  scope.on(audio, 'error', audioError);
  scope.on(audio, 'canplay', requestPlayback);
  scope.on(document, 'visibilitychange', visibilityChanged);
  scope.on(window, 'pageshow', visibilityChanged);
  for (const type of ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown']) {
    scope.on(document, type, retryAudioFromGesture, { capture: true, passive: true });
  }
  if (audio?.error) audioError();
  audio?.pause();
  renderSound();
  updateHeader();

  return () => {
    disposed = true;
    clearTimeout(exitTimer);
    resetEntryPointer();
    scope.dispose();
    audioEngine?.dispose();
    audio?.pause();
    if (entryLocked) document.body.style.overflow = previousOverflow;
    entryLocked = false;
    entry?.close();
    setEntryPhase('none');
  };
}
