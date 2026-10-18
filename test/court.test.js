import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGame, rates, tick, offline, build, BUILDINGS, costOf, choose, reform } from '../src/game.js';
import { ROLES, HOUSES, recruit, dismiss, refreshCandidates, courtBonuses, alignment, approval, courtCapacity } from '../src/court.js';
import { specialArt } from '../src/art.js';
import { load, save, validate } from '../src/storage.js';
import { render } from '../src/ui.js';

function wealthy() {
  const g = createGame(12345); g.stage = 4;
  for (const k of Object.keys(g.resources)) g.resources[k] = 10000;
  return g;
}
function candidate(g, role, quality = 1) {
  const p = { id: g.nextPersonId++, name: 'Alda das Fontes', role, quality, cost: 100 };
  g.candidates = [p]; return p;
}
test('candidatos têm identidades persistentes e a convocação paga renova nomes e IDs', () => {
  const a = createGame(1000), b = createGame(2000);
  assert.notDeepEqual(a.candidates, b.candidates);
  assert.equal(new Set(a.candidates.map(p => p.role)).size, 3);
  assert.equal(new Set(a.candidates.map(p => p.name)).size, 3);
  const before = a.resources.gold, ids = a.candidates.map(p => p.id);
  assert.equal(refreshCandidates(a), null); assert.equal(a.resources.gold, before - 20);
  assert.ok(a.candidates.every(p => !ids.includes(p.id)));
  a.resources.gold = 0; const people = structuredClone(a.candidates);
  assert.ok(refreshCandidates(a)); assert.deepEqual(a.candidates, people);
});
test('contratos respeitam recursos, limite, cargo único e podem ser dispensados', () => {
  const g = createGame(); let p = candidate(g, 'steward');
  assert.ok(recruit(g, p.id)); assert.equal(g.retinue.length, 0);
  g.resources.gold = 1000; assert.equal(recruit(g, p.id), null); assert.equal(g.resources.gold, 900);
  assert.ok(recruit(g, p.id)); p = candidate(g, 'steward'); assert.ok(recruit(g, p.id));
  p = candidate(g, 'ranger'); assert.equal(recruit(g, p.id), null);
  assert.equal(g.retinue.length, courtCapacity(g)); p = candidate(g, 'envoy'); assert.ok(recruit(g, p.id));
  const gold = g.resources.gold;
  assert.equal(dismiss(g, g.retinue[0].id), null); assert.equal(g.resources.gold, gold);
  assert.equal(recruit(g, p.id), null); assert.ok(dismiss(g, -1));
});
test('cada cargo aplica seu efeito; especialização amplia e dispensa remove bônus', () => {
  for (const r of ROLES) {
    const g = wealthy(); const p = candidate(g, r.id, 3);
    const base = rates(g), price = costOf(g, BUILDINGS[0]).wood;
    recruit(g, p.id);
    const bonuses = courtBonuses(g);
    for (const [key, value] of Object.entries(r.bonus)) assert.ok(Math.abs(bonuses[key] - value * 1.5) < 1e-9);
    if (r.id === 'steward') assert.ok(rates(g).food > base.food && rates(g).gold > base.gold);
    if (r.id === 'ranger' || r.id === 'scholar') assert.ok(rates(g).wood > base.wood);
    if (r.id === 'architect') assert.ok(costOf(g, BUILDINGS[0]).wood < price);
    if (r.id === 'envoy' || r.id === 'scholar') assert.ok(rates(g).influence > base.influence);
    if (r.id === 'marshal') { const support = g.factions[0]; tick(g, 1); assert.ok(g.factions[0] > support); }
    dismiss(g, p.id); assert.equal(courtBonuses(g).discount, 0); assert.equal(courtBonuses(g).food, 0);
  }
});
test('monumentos são únicos, mudam o ASCII e modificam produção e política', () => {
  const g = wealthy(); g.buildings.quarry = 1;
  assert.deepEqual(specialArt(g), []);
  const initial = rates(g);
  assert.equal(build(g, 'windmill'), null); assert.ok(rates(g).food > initial.food);
  const spent = g.resources.gold; assert.ok(build(g, 'windmill')); assert.equal(g.resources.gold, spent);
  const prior = rates(g); build(g, 'forge'); assert.ok(rates(g).wood > prior.wood && rates(g).stone > prior.stone);
  const influence = rates(g).influence; build(g, 'observatory'); assert.ok(rates(g).influence > influence);
  build(g, 'garden'); const support = g.factions[0], legitimacy = g.legitimacy;
  tick(g, 1); assert.ok(g.factions[0] > support); assert.ok(g.legitimacy > legitimacy);
  assert.equal(specialArt(g)[0].length, 4);
  const frame = specialArt(g); g.time += .5; assert.notDeepEqual(specialArt(g), frame);
  const noColor = process.env.NO_COLOR;
  try {
    delete process.env.NO_COLOR;
    const text = render(g, { page: 0 }, 100, 36);
    for (const color of ['179', '203', '117', '177']) assert.ok(text.includes(`38;5;${color}`));
    process.env.NO_COLOR = '1';
    assert.doesNotMatch(render(g, { page: 0 }, 100, 36), /\x1b\[/);
  } finally { if (noColor === undefined) delete process.env.NO_COLOR; else process.env.NO_COLOR = noColor; }
});
test('política e atributos respondem às escolhas; aprovação reflete facções', () => {
  const g = wealthy();
  assert.equal(alignment(g), 'Conciliador'); assert.equal(approval(g), 50);
  for (let i = 0; i < 4; i++) { g.event = 1; assert.equal(choose(g, 0), null); }
  assert.equal(alignment(g), 'Comunalista'); assert.equal(g.ruler.decisions, 4); assert.equal(g.ruler.attributes.diplomacy, 6);
  g.ruler.politics = 30; assert.equal(alignment(g), 'Monarquista');
  const before = g.ruler.decisions; g.resources.influence = 0; assert.ok(reform(g, 'commons')); assert.equal(g.ruler.decisions, before);
});
test('migração de save v1 preserva cidade, recursos, tempo e crônicas', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'halfaciv-migrate-'));
  try {
    const g = createGame(1000); g.version = 1; g.time = 82; g.resources.gold = 123; g.name = 'Cidade Antiga';
    for (const key of ['ruler', 'retinue', 'candidates', 'courtSeed', 'nextPersonId', 'faith', 'calamity', 'feats']) delete g[key];
    for (const key of ['windmill', 'forge', 'garden', 'observatory']) delete g.buildings[key];
    const file = path.join(dir, 'old.json'); fs.writeFileSync(file, JSON.stringify(g));
    const result = load(file);
    assert.equal(result.version, 3); assert.equal(result.name, g.name); assert.equal(result.time, 82);
    assert.deepEqual(result.resources, g.resources); assert.deepEqual(result.log, g.log);
    assert.equal(result.buildings.windmill, 0); assert.equal(result.candidates.length, 3);
    assert.equal(JSON.parse(fs.readFileSync(file)).version, 1);
    save(result, file); assert.deepEqual(load(file), result);
    result.candidates[0].role = 'invalid'; assert.throws(() => validate(result), /Recruta/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test('brasões, recrutamento e monumentos cabem em telas pequenas com rolagem', () => {
  const g = wealthy(); for (const b of BUILDINGS.filter(b => b.special)) build(g, b.id);
  for (let house = 0; house < HOUSES.length; house++) {
    g.ruler.house = house;
    for (const page of [0, 5, 6]) {
      const frame = render(g, { page, selected: 0 }, 80, 24).replace(/\x1b\[[0-9;]*m/g, '');
      assert.ok(frame.split('\n').length < 24); assert.ok(frame.split('\n').every(l => l.length < 80));
    }
    assert.match(render(g, { page: 7 }, 110, 40), new RegExp(HOUSES[house].sigil));
  }
});
test('efeitos de recrutados e monumentos continuam no progresso offline', () => {
  const a = wealthy();
  recruit(a, candidate(a, 'envoy').id); recruit(a, candidate(a, 'steward').id);
  build(a, 'garden'); build(a, 'windmill');
  const b = structuredClone(a);
  offline(a, a.savedAt + 60000); tick(b, 60);
  assert.deepEqual(a.resources, b.resources); assert.equal(a.legitimacy, b.legitimacy);
  assert.deepEqual(a.factions, b.factions);
});
