import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGame, tick, offline, build, reform, choose, advance, costOf, BUILDINGS, REFORMS, EVENTS, requirements, rates } from '../src/game.js';
import { save, load } from '../src/storage.js';
import { render } from '../src/ui.js';

test('produção independe da taxa de quadros e recursos não ficam negativos', () => {
  const a = createGame(), b = createGame();
  tick(a, 30); for (let i = 0; i < 150; i++) tick(b, .2);
  for (const key of Object.keys(a.resources)) assert.ok(Math.abs(a.resources[key] - b.resources[key]) < .1);
  a.buildings.farm = 0; tick(a, 1000);
  assert.equal(a.resources.food, 0); assert.ok(a.population >= 5);
});
test('construções cobram o custo crescente e respeitam títulos', () => {
  const g = createGame(), cost = costOf(g, BUILDINGS[0]);
  const before = g.resources.wood;
  assert.equal(build(g, 'farm'), null);
  assert.equal(g.resources.wood, before - cost.wood);
  assert.ok(costOf(g, BUILDINGS[0]).wood > cost.wood);
  assert.ok(build(g, 'castle')); assert.equal(g.buildings.castle, 0);
  g.resources.wood = 0; assert.ok(build(g, 'farm')); assert.equal(g.resources.wood, 0);
});
test('petições persistem até decisão e não aceitam promessas sem recursos', () => {
  const g = createGame(); g.event = 0;
  tick(g, 200); assert.equal(g.event, 0);
  g.resources.food = 0; assert.ok(choose(g, 0)); assert.equal(g.event, 0);
  const gold = g.resources.gold;
  assert.equal(choose(g, 1), null); assert.equal(g.resources.gold, gold + 45);
  assert.equal(g.event, null); tick(g, 91); assert.notEqual(g.event, 0); assert.notEqual(g.event, null);
});

test('eventos sorteados variam, persistem e nunca repetem a última decisão', () => {
  const seen = new Set();
  const g = createGame(1000);
  for (let i = 0; i < 40; i++) {
    const previous = g.lastEvent;
    tick(g, 91, false);
    assert.ok(EVENTS[g.event]); assert.notEqual(g.event, previous);
    seen.add(g.event);
    const copy = JSON.parse(JSON.stringify(g));
    tick(g, 5, false); assert.equal(g.event, copy.event);
    for (const key of Object.keys(g.resources)) g.resources[key] = 10000;
    assert.equal(choose(g, 0), null);
    assert.ok(g.nextEvent - g.time >= 45 && g.nextEvent - g.time <= 90);
    const resumed = JSON.parse(JSON.stringify(g));
    tick(g, 91, false); tick(resumed, 91, false);
    assert.equal(g.event, resumed.event); assert.equal(g.eventSeed, resumed.eventSeed);
    g.event = null;
  }
  assert.equal(seen.size, EVENTS.length);
});

test('taxas e alerta de evento ficam visíveis em todas as páginas no terminal mínimo', () => {
  const g = createGame(1000); g.event = EVENTS.length - 1;
  for (let page = 0; page < 9; page++) {
    const frame = render(g, { page }, 80, 24).replace(/\x1b\[[0-9;]*m/g, '');
    assert.match(frame, /Ali [+-][\d,]+\/s/);
    assert.match(frame, /Inf [+-][\d,]+\/s/);
    assert.match(frame, /\[E\] abrir Conselho/);
    assert.ok(frame.split('\n').length < 24);
  }
});
test('reformas exigem coalizão, cobram uma vez e mudam a economia', () => {
  const g = createGame(); g.stage = 1; g.resources.gold = 500; g.resources.influence = 500;
  g.factions = [20, 20, 20, 20]; assert.ok(reform(g, 'commons'));
  g.factions = [60, 60, 60, 60]; const before = rates(g).food;
  assert.equal(reform(g, 'commons'), null); assert.ok(rates(g).food > before);
  const after = g.resources.gold; assert.ok(reform(g, 'commons')); assert.equal(g.resources.gold, after);
});
test('cada título exige seus marcos e a coroa encerra a progressão de títulos', () => {
  const g = createGame(); assert.ok(advance(g));
  g.population = 100; g.resources.gold = 10000; g.buildings.farm = 2;
  g.buildings.market = 2; g.buildings.hall = 1; g.buildings.castle = 1;
  g.reforms = ['commons', 'guilds', 'schools']; g.legitimacy = 90; g.factions = [60, 60, 60, 60];
  for (let i = 0; i < 4; i++) { assert.ok(requirements(g).every(r => r.ok)); assert.equal(advance(g), null); }
  assert.equal(g.stage, 4); assert.ok(advance(g));
});
test('progresso offline é limitado a uma hora, sem resolver decisões', () => {
  const a = createGame(1000), b = structuredClone(a);
  assert.equal(offline(a, 1000 + 7200000), 3600); tick(b, 3600, false);
  assert.equal(a.resources.wood, b.resources.wood); assert.equal(a.event, b.event); assert.notEqual(a.event, null);
  assert.equal(offline(a, 500), 0);
});
test('save atômico, retomada e corrupção preservada', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'halfaciv-'));
  try {
    const file = path.join(dir, 'realm.json'); const g = createGame(); tick(g, 10);
    save(g, file); assert.deepEqual(load(file), g); assert.ok(!fs.existsSync(file + '.tmp'));
    fs.writeFileSync(file, '{invalid'); assert.throws(() => load(file), /preservado/);
    assert.equal(fs.readFileSync(file, 'utf8'), '{invalid');
    assert.equal(load(path.join(dir, 'missing')).stage, 0);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test('todas as páginas e cenas cabem no terminal mínimo, sem modificar estado', () => {
  const g = createGame(); const before = JSON.stringify(g);
  for (const size of [[80, 24], [100, 32], [140, 45]]) {
    for (let page = 0; page < 7; page++) {
      const frame = render(g, { page, selected: 0 }, ...size).replace(/\x1b\[[0-9;]*m/g, '');
      assert.ok(frame.split('\n').length <= size[1]);
      assert.ok(frame.split('\n').every(l => l.length < size[0]));
    }
  }
  assert.equal(JSON.stringify(g), before);
  for (let stage = 0; stage < 5; stage++) { g.stage = stage; assert.match(render(g, { page: 0 }, 110, 36), /HALF|H A L F/); }
  assert.match(render(g, {}, 40, 15), /Amplie/);
});
