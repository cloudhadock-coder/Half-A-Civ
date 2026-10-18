import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGame, tick, offline, rates, advance, requirements } from '../src/game.js';
import { adopt, rite, devotionCap, conversionWait, CREEDS, CONVERSION_COOLDOWN } from '../src/faith.js';
import { respond, activeCalamity, responseCost, DURATION } from '../src/calamity.js';
import { FEATS, checkFeats } from '../src/feats.js';
import { load, save, validate } from '../src/storage.js';
import { createFront, frontKey, absence, renderFront } from '../src/front.js';
import { render } from '../src/ui.js';
const plain = text => text.replace(/\x1b\[[0-9;]*m/g, '');
const town = () => { const g = createGame(1000); g.stage = 1; g.buildings.chapel = 1; g.resources.influence = 500; return g; };

test('fé oficial exige vila e capela; conversão custa apoio e respeita intervalo', () => {
  const g = createGame(1000); g.resources.influence = 500;
  assert.match(adopt(g, 'aurora'), /Vila/);
  g.stage = 1; assert.match(adopt(g, 'aurora'), /Capela/);
  g.buildings.chapel = 1; const clergy = g.factions[2];
  assert.equal(adopt(g, 'aurora'), null); assert.equal(g.faith.creed, 'aurora'); assert.equal(g.factions[2], clergy + 12);
  assert.match(adopt(g, 'aurora'), /já é/);
  assert.match(adopt(g, 'harvest'), /Aguarde/);
  g.time += CONVERSION_COOLDOWN; g.faith.devotion = 50; const before = g.factions[2];
  assert.equal(conversionWait(g), 0); assert.equal(adopt(g, 'harvest'), null);
  assert.equal(g.factions[2], Math.max(0, before - 15 - 6)); assert.equal(g.faith.devotion, 0);
});
test('credos alteram a produção e capelas acumulam devoção até o limite', () => {
  const a = town(), b = town();
  adopt(b, 'harvest'); assert.ok(rates(b).food > rates(a).food);
  const c = town(); adopt(c, 'craft'); assert.ok(rates(c).wood > rates(a).wood && rates(c).gold > rates(a).gold);
  tick(a, 3000, false); assert.equal(a.faith.devotion, devotionCap(a));
  const k = town(); adopt(k, 'kings'); k.stage = 0;
  for (const r of requirements(k)) r.ok = true;
  k.population = 20; k.buildings.farm = 2; k.resources.gold = 200; const legit = k.legitimacy;
  assert.equal(advance(k), null); assert.equal(k.legitimacy, legit + 14);
});
test('ritos exigem credo e devoção, e a procissão encerra febre ou praga', () => {
  const g = town();
  assert.match(rite(g, 'blessing'), /fé oficial/);
  adopt(g, 'harvest'); assert.match(rite(g, 'blessing'), /Devoção/);
  g.faith.devotion = 200; const food = rates(g).food;
  assert.equal(rite(g, 'blessing'), null); assert.ok(rates(g).food > food);
  assert.match(rite(g, 'blessing'), /abençoados/);
  g.calamity.id = 'fever'; g.calamity.since = g.time;
  assert.equal(rite(g, 'procession'), null); assert.equal(activeCalamity(g), null); assert.equal(g.calamity.resolved, 1);
  assert.equal(g.faith.rites, 2);
});
test('calamidades drenam até a resposta, cobram preço se ignoradas e não ocorrem offline', () => {
  const g = town(); g.buildings.house = 2; g.population = 30; g.resources.wood = 500;
  g.calamity.next = 0; tick(g, 1); assert.ok(activeCalamity(g));
  const id = g.calamity.id; tick(g, 10); assert.equal(g.calamity.id, id);
  g.resources.food = 0; g.resources.gold = 0; g.resources.wood = 0;
  assert.match(respond(g), /Faltam/);
  Object.assign(g.resources, { food: 999, wood: 999, gold: 999 });
  const cost = responseCost(g); assert.ok(Object.values(cost).every(v => v > 0));
  assert.equal(respond(g), null); assert.equal(activeCalamity(g), null); assert.ok(g.calamity.next > g.time);
  g.calamity.next = g.time; tick(g, 1); const legit = g.legitimacy;
  tick(g, DURATION + 1); assert.equal(g.calamity.failed, 1); assert.ok(g.legitimacy < legit);
  const away = town(); away.buildings.house = 2; away.calamity.next = 0;
  offline(away, away.savedAt + 3600000); assert.equal(activeCalamity(away), null);
});
test('feitos são únicos, entram nas crônicas e somam 1% de produção cada', () => {
  const g = createGame(1000), base = rates(g).wood;
  g.buildings.house = 1; assert.deepEqual(checkFeats(g).map(f => f.id), ['roof']);
  assert.deepEqual(checkFeats(g), []); assert.match(g.log.at(-1), /Teto e mesa/);
  assert.ok(Math.abs(rates(g).wood - base * 1.01) < 1e-9);
  assert.equal(new Set(FEATS.map(f => f.id)).size, FEATS.length);
});
test('save v2 migra para v3 com fé, calamidades e feitos, e valida os novos campos', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'halfaciv-v3-'));
  try {
    const g = createGame(1000); g.version = 2; g.time = 300;
    for (const key of ['faith', 'calamity', 'feats']) delete g[key];
    const file = path.join(dir, 'v2.json'); fs.writeFileSync(file, JSON.stringify(g));
    const result = load(file);
    assert.equal(result.version, 3); assert.equal(result.faith.creed, null); assert.deepEqual(result.feats, []);
    assert.ok(result.calamity.next > 300);
    save(result, file); assert.deepEqual(load(file), result);
    result.faith.creed = 'falso'; assert.throws(() => validate(result), /Fé/);
    result.faith.creed = CREEDS[0].id; result.feats = ['roof', 'roof']; assert.throws(() => validate(result), /Feitos/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test('prólogo abre só sem save; com save o jogo começa no menu', () => {
  assert.equal(createFront(false).screen, 'intro');
  assert.equal(createFront(true).screen, 'menu');
  const f = createFront(true); frontKey(f, '3'); assert.equal(f.screen, 'intro');
});
test('relatório de ausência resume recursos e retoma o jogo com Enter', () => {
  const g = createGame(1000), before = structuredClone(g);
  const elapsed = offline(g, 1000 + 600000);
  const f = createFront(true); f.screen = 'away'; f.away = absence(before, g, elapsed);
  const text = renderFront(f, 100, 32);
  assert.match(text, /10 min 0s/); assert.match(text, /Madeira\s+\+\d/);
  assert.deepEqual(frontKey(f, 'return'), { type: 'play' }); assert.equal(f.screen, 'menu');
});
test('aba Fé e alerta de calamidade cabem em 80x24', () => {
  const g = town(); adopt(g, 'aurora'); g.buildings.house = 1; g.calamity.next = 0; tick(g, 1);
  for (const page of [0, 4, 5]) {
    const text = plain(render(g, { page, selected: 2 }, 80, 24)), rows = text.split('\n');
    assert.match(text, /\[X\]/); assert.ok(rows.length < 24 && rows.every(r => r.length < 80), `página ${page}`);
  }
  assert.match(plain(render(g, { page: 4 }, 110, 40)), /Igreja da Aurora[\s\S]*Procissão penitente/);
});
