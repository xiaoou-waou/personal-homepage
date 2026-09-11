import { createScope, dispatch } from './dom.js';

/** Native dialogs retain top-layer focus trapping, Escape, and focus restoration. */
export function mountDialogs() {
  const scope = createScope();
  const menu = document.querySelector('.menu-sheet');
  const menuButton = document.querySelector('.menu-button');
  const menuClose = menu?.querySelector('.menu-close');
  const globalContact = document.querySelector('.contact-dialog');
  let menuOverflow = '';
  let menuOpener = null;
  let contactOverflow = '';
  let contactOpener = null;
  let contactCard = null;
  let activeContact = null;
  const originalBriefs = new WeakMap();
  const originalStatuses = new WeakMap();

  function openMenu() {
    if (!menu || menu.open) return;
    menuOpener = document.activeElement;
    menuOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    menu.showModal();
    menuButton?.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    menu?.close();
  }

  function menuClosed() {
    document.body.style.overflow = menuOverflow;
    menuButton?.setAttribute('aria-expanded', 'false');
    if (menuOpener instanceof HTMLElement && menuOpener.isConnected) menuOpener.focus({ preventScroll: true });
    menuOpener = null;
  }

  function contactStatus(dialog, text) {
    const status = dialog.querySelector('.brief-status');
    if (status) status.textContent = text;
  }

  function openContact(trigger) {
    const adjacent = trigger.nextElementSibling;
    const dialog = adjacent?.matches('.contact-dialog') ? adjacent : globalContact;
    if (!dialog || dialog.open) return;
    contactOpener = trigger;
    contactCard = trigger.closest('.service-card');
    const topic = trigger.dataset.topic || contactCard?.querySelector('.service-card__back-footer > span')?.textContent?.trim()
      || contactCard?.querySelector('h3')?.textContent?.trim() || dialog.dataset.topic || '项目合作';
    dialog.dataset.topic = topic;
    const textarea = dialog.querySelector('textarea');
    if (textarea) {
      if (!originalBriefs.has(dialog)) originalBriefs.set(dialog, textarea.value);
      // Keep the user's identity and wording from the mapped HTML; only scope the topic.
      const template = originalBriefs.get(dialog);
      if (!textarea.dataset.edited || textarea.value === textarea.dataset.lastTemplate) {
        textarea.value = template.replace(/(我想聊聊)[^。\n]*(。)/, `$1${topic}$2`);
        textarea.dataset.lastTemplate = textarea.value;
      }
    }
    const status = dialog.querySelector('.brief-status');
    if (status) {
      if (!originalStatuses.has(dialog)) originalStatuses.set(dialog, status.textContent);
      status.textContent = originalStatuses.get(dialog);
    }
    contactOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (contactCard) contactCard.dataset.contactOpen = 'true';
    activeContact = dialog;
    dialog.showModal();
    dispatch('dayu:contact-state', { open: true, topic });
  }

  function contactClosed(dialog) {
    if (activeContact !== dialog) return;
    document.body.style.overflow = contactOverflow;
    if (contactCard) delete contactCard.dataset.contactOpen;
    const opener = contactOpener;
    contactOpener = null;
    contactCard = null;
    activeContact = null;
    if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    dispatch('dayu:contact-state', { open: false, topic: dialog.dataset.topic });
  }

  async function copyBrief(dialog, button) {
    const textarea = dialog.querySelector('textarea');
    const value = button.dataset.copyText ?? textarea?.value;
    if (value == null) return;
    button.disabled = true;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API is unavailable');
      await navigator.clipboard.writeText(value);
      contactStatus(dialog, '已复制。可以把这段介绍粘贴到你常用的沟通工具中。');
    } catch {
      textarea?.focus();
      textarea?.select();
      contactStatus(dialog, '浏览器未允许自动复制，已选中文字，请手动复制后发送。');
    } finally {
      button.disabled = false;
    }
  }

  scope.on(menuButton, 'click', openMenu);
  scope.on(menuClose, 'click', closeMenu);
  scope.on(menu, 'close', menuClosed);
  scope.on(menu, 'pointerdown', event => { if (event.target === menu) closeMenu(); });
  scope.on(menu, 'click', event => {
    if (event.target instanceof Element && event.target.closest('a[href^="#"]')) closeMenu();
  });
  menuButton?.setAttribute('aria-expanded', 'false');

  for (const trigger of document.querySelectorAll('.header-contact, .world-contact, .service-card .line-link, [data-contact-trigger]')) {
    if (trigger.matches('a[href]:not([href="#"])') && !trigger.hasAttribute('data-contact-trigger')) continue;
    scope.on(trigger, 'click', event => {
      event.preventDefault();
      openContact(trigger);
    });
  }

  for (const dialog of document.querySelectorAll('.contact-dialog')) {
    scope.on(dialog.querySelector('.dialog-close'), 'click', () => dialog.close());
    scope.on(dialog, 'close', () => contactClosed(dialog));
    scope.on(dialog, 'pointerdown', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right
        || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    scope.on(dialog.querySelector('textarea'), 'input', event => {
      event.target.dataset.edited = 'true';
      contactStatus(dialog, originalStatuses.get(dialog) || '可直接编辑，复制后发送。');
    });
    for (const button of dialog.querySelectorAll('.brief-copy button, [data-copy-text]')) {
      scope.on(button, 'click', () => copyBrief(dialog, button));
    }
  }

  return () => {
    if (menu?.open) { menu.close(); menuClosed(); }
    if (activeContact) { const dialog = activeContact; dialog.close(); contactClosed(dialog); }
    scope.dispose();
  };
}
