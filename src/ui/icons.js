// Inline SVG icon set (no external assets, renders the same everywhere).

const P = {
  wrench: '<path d="M21 6.5a5 5 0 0 1-6.9 4.6L6.6 18.6a1.9 1.9 0 0 1-2.7-2.7l7.5-7.5A5 5 0 0 1 17.5 2l-3 3 .9 2.6 2.6.9 3-3z" fill="currentColor"/>',
  car: '<path d="M5 11l1.6-4.2A2 2 0 0 1 8.5 5.5h7a2 2 0 0 1 1.9 1.3L19 11h.5A1.5 1.5 0 0 1 21 12.5V16a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H4a1 1 0 0 1-1-1v-3.5A1.5 1.5 0 0 1 4.5 11zm2.2 0h9.6l-1.2-3.3a.8.8 0 0 0-.7-.5H9.1a.8.8 0 0 0-.7.5z" fill="currentColor"/>',
  star: '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="currentColor"/>',
  flag: '<path d="M5 3v18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6 4h13v9H6z" fill="#fff"/><path d="M6 4h3.25v3H6zm6.5 0h3.25v3H12.5zM9.25 7h3.25v3H9.25zm6.5 0H19v3h-3.25zM6 10h3.25v3H6zm6.5 0h3.25v3H12.5z" fill="#111"/>',
  camera: '<path d="M4 7h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" fill="currentColor"/><circle cx="12" cy="12.5" r="3.6" fill="#fff"/><circle cx="12" cy="12.5" r="2.2" fill="currentColor"/>',
  sound: '<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  mute: '<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9l5 6m0-6l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  music: '<path d="M9 17V5l11-2v12" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="6.5" cy="17.5" r="2.8" fill="currentColor"/><circle cx="17.5" cy="15.5" r="2.8" fill="currentColor"/>',
  full: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
  plus: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  minus: '<path d="M5 12h14" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" fill="currentColor" opacity=".35"/><path d="M9 4v14M15 6v14M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/>',
  gear: '<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm8.4 5l-1.8.6a7 7 0 0 1-.6 1.5l.9 1.7-1.9 1.9-1.7-.9a7 7 0 0 1-1.5.6l-.6 1.8h-2.6l-.6-1.8a7 7 0 0 1-1.5-.6l-1.7.9-1.9-1.9.9-1.7a7 7 0 0 1-.6-1.5l-1.8-.6v-2.6l1.8-.6a7 7 0 0 1 .6-1.5L5.6 6.6l1.9-1.9 1.7.9a7 7 0 0 1 1.5-.6l.6-1.8h2.6l.6 1.8a7 7 0 0 1 1.5.6l1.7-.9 1.9 1.9-.9 1.7a7 7 0 0 1 .6 1.5l1.8.6z" fill="currentColor" fill-rule="evenodd"/>',
  users: '<circle cx="9" cy="8" r="3.5" fill="currentColor"/><path d="M2.5 19a6.5 6.5 0 0 1 13 0z" fill="currentColor"/><circle cx="17" cy="9" r="2.8" fill="currentColor" opacity=".7"/><path d="M15.5 13.2A5.5 5.5 0 0 1 22 18.5h-5" fill="currentColor" opacity=".7"/>',
  trophy: '<path d="M7 3h10v4a5 5 0 0 1-10 0z" fill="currentColor"/><path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M11 12h2v4h3v3H8v-3h3z" fill="currentColor"/>',
  fuel: '<path d="M5 4h8v16H5z" fill="currentColor"/><path d="M7 6h4v4H7z" fill="#fff"/><path d="M13 8h2l2 2v7a1.5 1.5 0 0 0 3 0V9l-3-3" stroke="currentColor" stroke-width="1.8" fill="none"/>',
  paint: '<path d="M18 3l3 3-9 9-3-3z" fill="currentColor"/><path d="M8 13l3 3c-1 3-4 5-8 5 1-4 2-7 5-8z" fill="currentColor"/>',
  close: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>',
  rotate: '<path d="M19 12a7 7 0 1 1-2-4.9" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M19 3v5h-5" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  move: '<path d="M12 3v18M3 12h18M12 3l-3 3m3-3l3 3M12 21l-3-3m3 3l3-3M3 12l3-3m-3 3l3 3M21 12l-3-3m3 3l-3 3" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  trash: '<path d="M5 7h14l-1.2 13a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9z" fill="currentColor"/><path d="M3 6h18M9 6V4h6v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  check: '<path d="M4.5 12.5l5 5 10-11" stroke="currentColor" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  back: '<path d="M15 4l-8 8 8 8" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  steering: '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="2.6" fill="none"/><circle cx="12" cy="12" r="2.4" fill="currentColor"/><path d="M3.8 11h5.8M14.4 11h5.8M12 14.4V20.5" stroke="currentColor" stroke-width="2.6"/>',
  oil: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" fill="currentColor"/>',
  tire: '<circle cx="12" cy="12" r="9" fill="currentColor"/><circle cx="12" cy="12" r="4.5" fill="#cfd3d8"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
  bubbles: '<circle cx="9" cy="14" r="5" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="16.5" cy="7.5" r="3.5" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="18" cy="16" r="2" fill="currentColor"/>',
  sparkle: '<path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" fill="currentColor"/>',
  brush: '<path d="M14 3l7 7-6 2-3-3z" fill="currentColor"/><path d="M10.5 10.5l3 3L8 20a2.5 2.5 0 0 1-4-4z" fill="currentColor"/>',
  coin: '<circle cx="12" cy="12" r="9.5" fill="#f7c518" stroke="#b07d06" stroke-width="1.6"/><circle cx="12" cy="12" r="6.6" fill="none" stroke="#fde68a" stroke-width="1.4"/><text x="12" y="16.3" text-anchor="middle" font-size="11" font-weight="900" font-family="Arial" fill="#a86b00">$</text>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2.5" fill="#35b04a" stroke="#1d6e2c" stroke-width="1.4"/><circle cx="12" cy="12" r="3.4" fill="#d6f5d9"/><text x="12" y="14.6" text-anchor="middle" font-size="7" font-weight="900" font-family="Arial" fill="#1d6e2c">C</text>',
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" fill="currentColor"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor"/>',
  globe: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" stroke="currentColor" stroke-width="1.6" fill="none"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M5 15V5a1 1 0 0 1 1-1h9" stroke="currentColor" stroke-width="2" fill="none"/>',
  shop: '<path d="M4 9l1.5-5h13L20 9z" fill="currentColor"/><path d="M5 10h14v10H5z" fill="currentColor" opacity=".7"/><path d="M10 14h4v6h-4z" fill="#fff"/>',
};

export function icon(name, cls = '') {
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ''}</svg>`;
}

export function iconEl(name, cls = '') {
  const span = document.createElement('span');
  span.className = 'ico-wrap';
  span.innerHTML = icon(name, cls);
  return span;
}

export const SERVICE_ICON = {
  oil: 'oil', tires: 'tire', brakes: 'wrench', tune: 'gear', wash: 'bubbles', wax: 'sparkle', scratch: 'paint', respray: 'brush',
};
