// A* on the garage tile grid. Prefers paths with clearance so cars don't
// scrape past decorations.

export function astar(size, blocked, start, goal, { extraCols = 0 } = {}) {
  const W = size + extraCols;
  const H = size;
  const inb = (x, z) => x >= 0 && z >= 0 && x < W && z < H;
  const key = (x, z) => z * W + x;
  const isBlocked = (x, z) => (x < size ? blocked(x, z) : false);
  const near = (x, z) => {
    let n = 0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dz) continue;
      const nx = x + dx;
      const nz = z + dz;
      if (!inb(nx, nz) || isBlocked(nx, nz)) n++;
    }
    return n;
  };
  const open = [{ x: start.x, z: start.z, g: 0, f: 0 }];
  const came = new Map();
  const gScore = new Map([[key(start.x, start.z), 0]]);
  const closed = new Set();
  const h = (x, z) => Math.abs(x - goal.x) + Math.abs(z - goal.z);
  let guard = 0;
  while (open.length && guard++ < 5000) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const cur = open.splice(bi, 1)[0];
    const ck = key(cur.x, cur.z);
    if (cur.x === goal.x && cur.z === goal.z) {
      const path = [{ x: cur.x, z: cur.z }];
      let k = ck;
      while (came.has(k)) {
        k = came.get(k);
        path.push({ x: k % W, z: Math.floor(k / W) });
      }
      return path.reverse();
    }
    if (closed.has(ck)) continue;
    closed.add(ck);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cur.x + dx;
      const nz = cur.z + dz;
      if (!inb(nx, nz)) continue;
      const isGoal = nx === goal.x && nz === goal.z;
      if (!isGoal && isBlocked(nx, nz)) continue;
      const nk = key(nx, nz);
      if (closed.has(nk)) continue;
      const g = cur.g + 1 + near(nx, nz) * 0.6;
      if (g < (gScore.get(nk) ?? Infinity)) {
        gScore.set(nk, g);
        came.set(nk, ck);
        open.push({ x: nx, z: nz, g, f: g + h(nx, nz) });
      }
    }
  }
  return null;
}

/** Removes intermediate points on straight runs. */
export function simplifyPath(pts) {
  if (pts.length < 3) return pts;
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = out[out.length - 1];
    const b = pts[i];
    const c = pts[i + 1];
    const d1x = Math.sign(b.x - a.x);
    const d1z = Math.sign(b.z - a.z);
    const d2x = Math.sign(c.x - b.x);
    const d2z = Math.sign(c.z - b.z);
    if (d1x !== d2x || d1z !== d2z) out.push(b);
  }
  out.push(pts[pts.length - 1]);
  return out;
}
