// Car model registry. Every car is a realistic "v2" model built in metres:
//   featured.js  — the first three cars from the uploaded photos (hand-tuned)
//   featured2.js — the second batch of photo cars
//   generic.js  — the rest of the Car Town line-up (body-type archetypes)
// Each entry exposes length/width/wheel at the top level for game code.

import { FEATURED_V2 } from './featured.js';
import { FEATURED_V2_MORE } from './featured2.js';
import { GENERIC_V2 } from './generic.js';

export const MODELS = {};

for (const spec of [...FEATURED_V2, ...FEATURED_V2_MORE, ...GENERIC_V2]) {
  const b = spec.body;
  MODELS[spec.id] = {
    ...spec,
    length: b.length,
    width: b.width,
    wheel: { ...b.wheel, style: spec.wheelDef.style },
  };
}

export const MODEL_IDS = Object.keys(MODELS);
export const FEATURED_IDS = MODEL_IDS.filter((id) => MODELS[id].featured);
// Models used for NPC customers & traffic
export const NPC_MODEL_IDS = ['hatch', 'sedan', 'taxi', 'van', 'pickup', 'beetle', 'suv', 'muscle', 'police', 'rally', 'offroad', 'coupe', 'smart2', 'ioniq3', 'frontera', 'musso'];
