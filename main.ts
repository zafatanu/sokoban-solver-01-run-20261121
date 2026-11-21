import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const IN = process.env.MAKEFUN_INPUT_DIR || '/input', OUT = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function solve(text: string): string {
  return '';
}

const ids = readdirSync(IN).filter(d => !d.startsWith('.')).sort();
for (const id of ids) {
  let ans = '';
  try {
    ans = solve(readFileSync(join(IN, id, 'level.txt'), 'utf8').replace(/\r\n?/g, '\n'));
  } catch (e) { ans = ''; }
  mkdirSync(join(OUT, id), { recursive: true });
  writeFileSync(join(OUT, id, 'solution.txt'), ans);
}
