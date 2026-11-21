import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const IN = process.env.MAKEFUN_INPUT_DIR || '/input';
const OUT = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const DY = [-1, 1, 0, 0], DX = [0, 0, -1, 1], CH = ['u', 'd', 'l', 'r'];

// Solve one room push-optimally. local cells 0..C-1 are the room floor (incl door),
// local C is the single adjacent hallway cell ("out"). Returns moves + final player local.
function solveRoom(cells: number[], out: number, door: number, W: number,
  wall: Uint8Array, goal: Uint8Array, box0: Uint8Array): { m: string; p: number } {
  const C = cells.length;
  const nabs: number[] = [];
  for (let i = 0; i < C; i++) nabs.push(cells[i]);
  nabs.push(out);
  // local index of an absolute cell, or -1 if not in the sub-model
  const lIdx = new Map<number, number>();
  for (let i = 0; i <= C; i++) lIdx.set(nabs[i], i);
  // adj[a][d]: local cell at abs(nabs[a])+delta[d], or -1
  const adj: number[][] = [];
  for (let a = 0; a <= C; a++) {
    const row: number[] = [];
    for (let d = 0; d < 4; d++) {
      const na = nabs[a] + DY[d] * W + DX[d];
      const v = lIdx.get(na);
      row.push(v === undefined ? -1 : v);
    }
    adj.push(row);
  }
  let startBox = 0, goalMask = 0, entry = 0;
  for (let i = 0; i < C; i++) {
    if (box0[cells[i]]) startBox |= 1 << i;
    if (goal[cells[i]]) goalMask |= 1 << i;
  }
  entry = lIdx.get(door)!;
  // dead cells: non-goal wall-corner -> box there is unmovable
  const dead = new Uint8Array(C);
  for (let i = 0; i < C; i++) {
    if (goal[cells[i]]) continue;
    const a = nabs[i];
    const isW = (na: number) => { const v = lIdx.get(na); return v === undefined || v === C; };
    const nb = [a - W, a + 1, a + W, a - 1];
    for (let k = 0; k < 4; k++) if (isW(nb[k]) && isW(nb[(k + 1) % 4])) { dead[i] = 1; break; }
  }
  // BFS over (boxMask, playerLocal). each edge = one push.
  const key = (b: number, p: number) => b + '|' + p;
  const dist = new Map<string, number>();
  const par = new Map<string, { bk: string; i: number; d: number }>();
  dist.set(key(startBox, entry), 0);
  const q: number[][] = [[startBox, entry]];
  let qi = 0, found = false;
  while (qi < q.length) {
    const [b, p] = q[qi++];
    if (b === goalMask) { found = true; break; }
    const dc = dist.get(key(b, p))!;
    // player reachable region (for finding behind cells)
    const reach = new Int32Array(C + 1).fill(-1);
    const sq = [p]; reach[p] = 0;
    for (let si = 0; si < sq.length; si++) {
      const ca = sq[si];
      for (let d = 0; d < 4; d++) {
        const n = adj[ca][d];
        if (n < 0 || reach[n] >= 0) continue;
        if (n < C && (b & (1 << n))) continue; // box blocks player
        reach[n] = 1; sq.push(n);
      }
    }
    // for each box, each direction
    for (let i = 0; i < C; i++) {
      if (!(b & (1 << i))) continue;
      for (let d = 0; d < 4; d++) {
        const behind = adj[i][d ^ 1]; // player stands at abs - delta[d]
        if (behind < 0) continue;
        if (behind < C && (b & (1 << behind))) continue;
        if (reach[behind] < 0) continue; // player can't get behind
        const t = adj[i][d]; // box moves to abs + delta[d]
        if (t < 0 || t >= C) continue; // must stay in room
        if (b & (1 << t)) continue;
        const nb2 = (b & ~(1 << i)) | (1 << t);
        const k2 = key(nb2, i);
        if (!dist.has(k2)) {
          dist.set(k2, dc + 1);
          par.set(k2, { bk: key(b, p), i, d });
          q.push([nb2, i]);
        }
      }
    }
  }
  if (!found) return { m: '', p: door };
  // reconstruct forward push list
  const steps: { i: number; d: number }[] = [];
  let cur = key(goalMask, 0), pp = 0;
  // find the state that reached goalMask (need player pos too)
  let gb = goalMask, gp = -1;
  for (const [kk, v] of dist) {
    const idx = kk.indexOf('|');
    if (kk.slice(0, idx) === String(goalMask)) { gp = +kk.slice(idx + 1); break; }
  }
  let ck = key(goalMask, gp);
  while (par.has(ck)) {
    const e = par.get(ck)!;
    steps.push({ i: e.i, d: e.d });
    ck = e.bk;
  }
  steps.reverse();
  // simulate forward: emit walk + push
  let p = entry, b = startBox;
  let m = '';
  for (const s of steps) {
    const behind = adj[s.i][s.d ^ 1];
    // walk BFS from p to behind (sub-model, boxes=current)
    const prev = new Int32Array(C + 1).fill(-1);
    const sq2 = [p]; prev[p] = p;
    let ok = false;
    for (let si = 0; si < sq2.length; si++) {
      const ca = sq2[si];
      if (ca === behind) { ok = true; break; }
      for (let d = 0; d < 4; d++) {
        const n = adj[ca][d];
        if (n < 0 || prev[n] >= 0) continue;
        if (n < C && (b & (1 << n))) continue;
        prev[n] = ca; sq2.push(n);
      }
    }
    if (ok) {
      // walk path behind -> p, reverse
      const path: number[] = [];
      for (let x = behind; x !== p; x = prev[x]) path.push(x);
      path.push(p);
      // move from p to behind
      for (let k = path.length - 2; k >= 0; k--) {
        const to = path[k];
        m += dirOf(p, to);
        p = to;
      }
    }
    // push
    m += CH[s.d].toUpperCase();
    b = (b & ~(1 << s.i)) | (1 << adj[s.i][s.d]);
    p = s.i;
  }
  return { m, p };
  function dirOf(a: number, c: number): string {
    const ad = nabs[a], cd = nabs[c];
    for (let d = 0; d < 4; d++) if (ad + DY[d] * W + DX[d] === cd) return CH[d];
    return '';
  }
}

// full-board walk BFS: shortest walk from a to b avoiding walls and boxes (cbox). returns walk string.
function walkTo(a: number, b: number, W: number, N: number, wall: Uint8Array, cbox: Uint8Array): string {
  if (a === b) return '';
  const prev = new Int32Array(N).fill(-2);
  const q = [a]; prev[a] = -1;
  for (let qi = 0; qi < q.length; qi++) {
    const c = q[qi];
    if (c === b) break;
    const cy = (c / W) | 0;
    for (const d of [-W, W, -1, 1]) {
      const n = c + d;
      if (n < 0 || n >= N) continue;
      if ((d === -1 || d === 1) && ((n / W) | 0) !== cy) continue;
      if (wall[n] || cbox[n]) continue;
      if (prev[n] >= -1) continue;
      prev[n] = c; q.push(n);
    }
  }
  let m = '', x = b;
  while (x !== a) {
    const px = prev[x];
    if (px === -2) return ''; // unreachable
    m = dirChar(px, x, W) + m;
    x = px;
  }
  return m;
}
function dirChar(a: number, b: number, W: number): string {
  if (a - W === b) return 'u'; if (a + W === b) return 'd';
  if (a - 1 === b) return 'l'; return 'r';
}
// advance player from cell c by one move ch; update cbox for pushes. returns new player cell.
function advance(c: number, ch: string, W: number, cbox: Uint8Array): number {
  const up = ch === ch.toUpperCase();
  const l = ch.toLowerCase();
  const d = l === 'u' ? -W : l === 'd' ? W : l === 'l' ? -1 : 1;
  const t = c + d;
  if (up) { cbox[t] = 0; cbox[t + d] = 1; }
  return t;
}

function solve(text: string): string {
  const rows = text.split('\n').filter(r => r.trim() !== '');
  const H = rows.length, W = Math.max(...rows.map(r => r.length));
  const N = W * H;
  const wall = new Uint8Array(N), goal = new Uint8Array(N), box0 = new Uint8Array(N);
  let ply = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ch = rows[y][x] || '#';
    const i = y * W + x;
    if (ch === '#') wall[i] = 1;
    if (ch === '.' || ch === '*' || ch === '+') goal[i] = 1;
    if (ch === '$' || ch === '*') box0[i] = 1;
    if (ch === '@' || ch === '+') ply = i;
  }
  const py = (ply / W) | 0;
  const hall = new Uint8Array(N);
  let x0 = ply % W, x1 = x0;
  while (x0 > 0 && !wall[py * W + x0 - 1]) x0--;
  while (x1 < W - 1 && !wall[py * W + x1 + 1]) x1++;
  for (let x = x0; x <= x1; x++) hall[py * W + x] = 1;
  const rooms: { cells: number[]; door: number; out: number; x: number }[] = [];
  const roomOf = new Int32Array(N).fill(-1);
  for (let i = 0; i < N; i++) {
    if (wall[i] || hall[i] || roomOf[i] >= 0) continue;
    const cells: number[] = [i];
    roomOf[i] = rooms.length;
    let door = -1, out = -1;
    for (let qi = 0; qi < cells.length; qi++) {
      const c = cells[qi], cy = (c / W) | 0;
      for (const d of [-W, W, -1, 1]) {
        const n = c + d;
        if (n < 0 || n >= N) continue;
        if ((d === -1 || d === 1) && ((n / W) | 0) !== cy) continue;
        if (wall[n]) continue;
        if (hall[n]) { door = c; out = n; continue; }
        if (roomOf[n] >= 0) continue;
        roomOf[n] = rooms.length; cells.push(n);
      }
    }
    rooms.push({ cells, door, out, x: door % W });
  }
  // solve rooms; order by door column for a natural hallway walk
  rooms.sort((a, b) => a.x - b.x);
  let cur = ply;
  const cbox = box0.slice();
  let moves = '';
  for (const r of rooms) {
    const w = walkTo(cur, r.door, W, N, wall, cbox);
    moves += w;
    if (w.length) { for (let k = 0; k < w.length; k++) cur = advance(cur, w[k], W, cbox); }
    const res = solveRoom(r.cells, r.out, r.door, W, wall, goal, cbox);
    moves += res.m;
    if (res.m.length) { for (let k = 0; k < res.m.length; k++) cur = advance(cur, res.m[k], W, cbox); }
    // final player abs pos from local res.p
    cur = res.p < r.cells.length ? r.cells[res.p] : r.out;
  }
  return moves;
}

// driver: read every /input/<id>/level.txt, write /output/<id>/solution.txt
for (const id of readdirSync(IN)) {
  const text = readFileSync(join(IN, id, 'level.txt'), 'utf8');
  const sol = solve(text);
  const od = join(OUT, id);
  mkdirSync(od, { recursive: true });
  writeFileSync(join(od, 'solution.txt'), sol);
}