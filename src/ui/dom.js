// Generic UI building blocks: modals, toasts, popup menus, confirm dialogs.

import { el } from '../core/util.js';
import { icon } from './icons.js';
import { t } from '../core/i18n.js';
import { audio } from '../core/audio.js';

let uiRoot = null;
export function setUiRoot(r) {
  uiRoot = r;
}

export function modal({ title, className = '', content, onClose, wide = false, closable = true }) {
  const close = () => {
    overlay.classList.add('closing');
    setTimeout(() => overlay.remove(), 160);
    onClose?.();
  };
  const header = el('div', { class: 'modal-header' }, el('h2', {}, title));
  if (closable) header.appendChild(el('button', { class: 'close-btn', title: t('close'), onclick: () => { audio.click(); close(); }, html: icon('close') }));
  const body = el('div', { class: 'modal-body' });
  if (content) body.append(...[].concat(content));
  const box = el('div', { class: `modal ${wide ? 'wide' : ''} ${className}` }, header, body);
  const overlay = el('div', { class: 'modal-overlay', onmousedown: (e) => { if (e.target === overlay && closable) close(); } }, box);
  uiRoot.appendChild(overlay);
  return { overlay, body, close, box, header };
}

export function toast(text, kind = 'info', ms = 2400) {
  let wrap = uiRoot.querySelector('.toasts');
  if (!wrap) {
    wrap = el('div', { class: 'toasts' });
    uiRoot.appendChild(wrap);
  }
  const tEl = el('div', { class: `toast toast-${kind}` }, text);
  wrap.appendChild(tEl);
  setTimeout(() => tEl.classList.add('out'), ms);
  setTimeout(() => tEl.remove(), ms + 400);
}

export function confirmDialog(text, { ok = 'OK', cancel = t('back') } = {}) {
  return new Promise((resolve) => {
    const m = modal({
      title: '',
      className: 'confirm',
      content: [
        el('p', { class: 'confirm-text' }, text),
        el('div', { class: 'row-buttons' },
          el('button', { class: 'btn btn-gray', onclick: () => { m.close(); resolve(false); } }, cancel),
          el('button', { class: 'btn btn-green', onclick: () => { m.close(); resolve(true); } }, ok)),
      ],
      onClose: () => resolve(false),
    });
  });
}

let popup = null;
export function closePopup() {
  popup?.remove();
  popup = null;
}

/** Small menu next to the cursor (e.g. after clicking a car). */
export function popupMenu(x, y, title, items) {
  closePopup();
  const menu = el('div', { class: 'popup-menu' }, title ? el('div', { class: 'popup-title' }, title) : null,
    ...items.map((it) => el('button', {
      class: `popup-item ${it.className || ''}`,
      disabled: it.disabled,
      onclick: (e) => { e.stopPropagation(); audio.click(); closePopup(); it.action(); },
    }, it.icon ? el('span', { html: icon(it.icon) }) : null, el('span', {}, it.label), it.right ? el('em', {}, it.right) : null)));
  uiRoot.appendChild(menu);
  const r = menu.getBoundingClientRect();
  menu.style.left = `${Math.min(window.innerWidth - r.width - 8, Math.max(8, x + 12))}px`;
  menu.style.top = `${Math.min(window.innerHeight - r.height - 8, Math.max(8, y - 20))}px`;
  popup = menu;
  return menu;
}

/** Big centred celebration banner (level up, win, ...). */
export function banner(text, sub = '', kind = 'gold', ms = 2200) {
  const b = el('div', { class: `banner banner-${kind}` }, el('div', { class: 'banner-text' }, text), sub ? el('div', { class: 'banner-sub' }, sub) : null);
  uiRoot.appendChild(b);
  setTimeout(() => b.classList.add('out'), ms);
  setTimeout(() => b.remove(), ms + 500);
}

export function swatches(colors, current, onPick, { allowNone = false, noneLabel = t('none') } = {}) {
  const wrap = el('div', { class: 'swatches' });
  const render = (cur) => {
    wrap.innerHTML = '';
    if (allowNone) {
      wrap.appendChild(el('button', { class: `swatch none ${!cur ? 'on' : ''}`, title: noneLabel, onclick: () => { onPick(null); render(null); } }, '∅'));
    }
    for (const c of colors) {
      wrap.appendChild(el('button', { class: `swatch ${cur && cur.toLowerCase() === c.toLowerCase() ? 'on' : ''}`, style: { background: c }, title: c, onclick: () => { onPick(c); render(c); } }));
    }
    const custom = el('input', { type: 'color', class: 'swatch-custom', value: cur || '#ffffff', title: 'Custom color', oninput: (e) => { onPick(e.target.value); } });
    wrap.appendChild(custom);
  };
  render(current);
  return wrap;
}

export function segmented(options, current, onPick) {
  const wrap = el('div', { class: 'segmented' });
  const render = (cur) => {
    wrap.innerHTML = '';
    for (const [value, label] of options) {
      wrap.appendChild(el('button', { class: `seg ${value === cur ? 'on' : ''}`, onclick: () => { audio.click(); onPick(value); render(value); } }, label));
    }
  };
  render(current);
  return wrap;
}
