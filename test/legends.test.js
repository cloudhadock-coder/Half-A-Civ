import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGame, tick } from '../src/game.js';
import { LEGENDS, ROLES, makeCandidates, refreshCandidates, recruit, courtBonuses, renameWill, legendOf } from '../src/court.js';
import { validate, save, load } from '../src/storage.js';
import { checkFeats } from '../src/feats.js';
import { render } from '../src/ui.js';
const plain = text => text.replace(/\x1b\[[0-9;]*m/g, '');
// Renova candidatos até a lenda pedida aparecer; o sorteio é determinístico pela semente.
function summon(g, id) {
  for (let i = 0; i < 5000; i++) {
    g.resources.gold = 1000; refreshCandidates(g);
    const found = g.candidates.find(p => p.legend === id);
    if (found) return found;
  }
  throw new Error(`lenda ${id} não apareceu`);
}

test('todas as lendas aparecem, com cargo válido, especialização III e sem repetir', () => {
  assert.equal(new Set(LEGENDS.map(l => l.id)).size, LEGENDS.length);
  assert.ok(LEGENDS.every(l => ROLES.some(r => r.id === l.role)));
  const g = createGame(4242);
  for (const l of LEGENDS) {
    const p = summon(g, l.id);
    assert.equal(p.quality, 3); assert.equal(p.role, l.role); assert.equal(p.name, l.name);
    assert.equal(new Set(g.candidates.map(c => c.role)).size, 3);
  }
});
test('lendas valem x1,75, não se repetem no séquito e rendem um feito', () => {
  const g = createGame(4242), chico = summon(g, 'chico');
  g.resources.gold = 1000; assert.equal(recruit(g, chico.id), null);
  assert.ok(Math.abs(courtBonuses(g).discount - .12 * 1.75) < 1e-9);
  assert.ok(checkFeats(g).some(f => f.id === 'legend'));
  for (let i = 0; i < 300; i++) { g.resources.gold = 1000; refreshCandidates(g); assert.ok(g.candidates.every(p => p.legend !== 'chico')); }
  validate(g);
  g.candidates[0].legend = 'chico'; assert.throws(() => validate(g), /Lenda/);
});
test('Will troca a primeira letra a cada carregamento do save, mas segue a mesma pessoa', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'halfaciv-will-'));
  try {
    const g = createGame(4242), will = summon(g, 'will'), file = path.join(dir, 'realm.json');
    g.resources.gold = 1000; assert.equal(recruit(g, will.id), null);
    assert.equal(will.name, 'Will');
    g.time = 500; tick(g, 30); assert.equal(will.name, 'Will'); // estável durante a sessão
    let previous = 'Will';
    for (let i = 0; i < 6; i++) {
      save(g, file); const loaded = load(file), again = loaded.retinue.find(p => p.legend === 'will');
      assert.match(again.name, /^[A-Z]ill$/); assert.notEqual(again.name, previous);
      assert.equal(again.id, will.id); assert.equal(legendOf(again).id, 'will');
      assert.match(plain(render(loaded, { page: 6 }, 110, 40)), new RegExp(`${again.name} / Embaixador III  \\* LENDA \\*`));
      previous = again.name; g.retinue = loaded.retinue;
    }
    const ruah = { name: 'Ruah', legend: 'ruah' }; renameWill({ retinue: [ruah], candidates: [] }); assert.equal(ruah.name, 'Ruah');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test('candidatos comuns continuam predominantes', () => {
  const g = createGame(7); let legends = 0, total = 0;
  for (let i = 0; i < 400; i++) { const list = makeCandidates(g); total += list.length; legends += list.filter(p => p.legend).length; }
  assert.ok(legends > 0 && legends / total < .2);
});
