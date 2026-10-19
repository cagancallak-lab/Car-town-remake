import './ui/styles.css';
import { Engine } from './core/engine.js';
import { App } from './app.js';
import { warmTemplates } from './cars/carFactory.js';
import { MODEL_IDS } from './cars/models.js';

const frame = () => new Promise((r) => requestAnimationFrame(() => r()));

async function boot() {
  const loading = document.getElementById('loading');
  const bar = loading.querySelector('.load-bar i');
  const text = loading.querySelector('.load-text');
  const engine = new Engine(document.getElementById('app'));
  // Build every car body once up front so the garage never hitches.
  for (let i = 0; i < MODEL_IDS.length; i++) {
    warmTemplates([MODEL_IDS[i]], 'low');
    bar.style.width = `${Math.round(((i + 1) / (MODEL_IDS.length + 2)) * 100)}%`;
    text.textContent = `Building cars… ${i + 1}/${MODEL_IDS.length}`;
    await frame();
  }
  text.textContent = 'Opening the garage…';
  await frame();
  const app = new App(engine, document.getElementById('ui'));
  app.init();
  window.carTown = app;
  bar.style.width = '100%';
  await frame();
  loading.classList.add('done');
  setTimeout(() => loading.remove(), 600);
}

boot().catch((e) => {
  console.error(e);
  const t = document.querySelector('#loading .load-text');
  if (t) t.textContent = `Something went wrong: ${e.message}`;
});
