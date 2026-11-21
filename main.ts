import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const IN = process.env.MAKEFUN_INPUT_DIR || '/input', OUT = process.env.MAKEFUN_OUTPUT_DIR || '/output';
let start = -1, W0 = 0, H0 = 0;
let walls: Uint8Array, goals: Uint8Array, boxes0: Uint8Array;

// a room: its own cell list, wall test over the level, goals, boxes
// hall: the hallway cells of the whole level, checked with the level walls

function solve(text: string): string {
  const rows = text.split('\n').filter(r => r.trim() !== '');
  const H = rows.length, W = Math.max(...rows.map(r => r.length));
  const wall = new Uint8Array(H * W), goal = new Uint8Array(H * W), box = new Uint8Array(H * W);
  let ply = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const ch = rows[y][x] || '#';
      const i = y * W + x;
      if (ch === '#') wall[i] = 1;
      if (ch === '.' || ch === '*' || ch === '+') goal[i] = 1;
      if (ch === '$' || ch === '*') box[i] = 1;
      if (ch === '@' || ch === '+') ply = i;
    }
  }
  start = ply; W0 = W; H0 = H;
  walls = wall; goals = goal; boxes0 = box;
  const N = W * H;
  const hall = new Uint8Array(N);
  let x0 = ply % W, x1 = x0;
  while (x0 > 0 && !wall[ply - W + x0 - 1]) x0--;
  while (x1 < W - 1 && !wall[ply - W + x1 + 1]) x1++;
  for (let x = x0; x <= x1; x++) hall[ply - W + x] = 1;
  const roomOf = new Int32Array(N).fill(-1);
  const rooms: { cells: number[]; doors: number[] }[] = [];
  for (let i = 0; i < N; i++) {
    if (wall[i] || hall[i] || roomOf[i] >= 0) continue;
    const cells: number[] = [i], doors: number[] = [];
    roomOf[i] = rooms.length;
    for (let q = 0; q < cells.length; q++) {
      const c = cells[q], cy = (c / W) | 0, cx = c % W;
      for (const d of [-W, W, -1, 1]) {
        const n = c + d;
        if (n < 0 || n >= N) continue;
        if ((d === -1 || d === 1) && ((n / W) | 0) !== cy) continue;
        if (wall[n]) continue;
        if (hall[n]) { if (!doors.includes(c)) doors.push(c); continue; }
        if (roomOf[n] >= 0) continue;
        roomOf[n] = rooms.length; cells.push(n);
      }
    }
    rooms.push({ cells, doors });
  }
  writeFileSync('/tmp/dbg2.txt',
    'W=' + W + ' H=' + H + ' start=' + ply + ' hall=' + hall.reduce((a, b) => a + b, 0) +
    ' rooms=' + JSON.stringify(rooms.map(r => [r.cells.length, r.doors.map(d => d % W), r.doors.map(d => (d / W) | 0)])) + '\n');
  return String(rooms.length) + ' rooms hall ' + hall.reduce((a, b) => a + b, 0) +
    ' ' + JSON.stringify(rooms.map(r => [r.cells.length, r.doors.map(d => d % W), r.doors.map(d => (d / W) | 0)]));
}
