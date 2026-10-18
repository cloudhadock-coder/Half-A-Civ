import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, BUILDINGS } from '../src/game.js';
import { topdownMap, MAP_LOTS } from '../src/map.js';
import { toggleCityView, navigatePage } from '../src/interaction.js';
import { render } from '../src/ui.js';
const plainMap = g => topdownMap(g).map(row => row.map(s => s.text).join('')).join('\n');

test('V alterna só no Domínio, zera rolagem e conserva visão ao navegar por Tab', () => {
  const view = { page: 0, scroll: 12 };
  assert.equal(toggleCityView(view), true); assert.equal(view.cityView, 'topdown'); assert.equal(view.scroll, 0);
  navigatePage(view, { name: 'tab' });
  assert.equal(toggleCityView(view), false); assert.equal(view.cityView, 'topdown');
  navigatePage(view, { name: 'tab', shift: true });
  toggleCityView(view); assert.equal(view.cityView, 'panorama');
});
test('planta reflete cada obra sem mostrar construções inexistentes', () => {
  const g = createGame(); const initial = plainMap(g);
  assert.match(initial, /HOR01/); assert.match(initial, /SER01/); assert.doesNotMatch(initial, /FOR01/);
  for (const b of BUILDINGS) g.buildings[b.id] = 1;
  for (const [, code] of MAP_LOTS) assert.ok(plainMap(g).includes(code + '01'));
  g.buildings.house = 123; assert.match(plainMap(g), /CAS\+\+/);
  g.stage = 2; assert.match(plainMap(g), /MURALHA/); assert.doesNotMatch(plainMap(g), /CERCA/);
});
test('mapa preserva cores, animações e estado da campanha', () => {
  const g = createGame(); for (const b of BUILDINGS) g.buildings[b.id] = 1;
  const original = JSON.stringify(g), before = plainMap(g);
  assert.deepEqual(new Set(topdownMap(g).flat().map(s => s.color)), new Set(['dim', 'blue', 'ink', 'green', 'gold', 'red', 'purple']));
  assert.equal(JSON.stringify(g), original);
  g.time = .5; assert.notEqual(plainMap(g), before);
  assert.ok(topdownMap(g).every(row => row.reduce((n, s) => n + s.text.length, 0) === 69));
});
test('mapa cabe em 80x24 com animação de provisões e conserva rodapé e economia', () => {
  const g = createGame();
  for (const size of [[80, 24], [110, 40]]) {
    const text = render(g, { page: 0, cityView: 'topdown', gatherStarted: 0 }, ...size).replace(/\x1b\[[0-9;]*m/g, '');
    assert.match(text, /PLANTA DA CIDADE/); assert.match(text, /MUTIRÃO/); assert.match(text, /V visão/);
    assert.ok(text.split('\n').length < size[1]); assert.ok(text.split('\n').every(row => row.length < size[0]));
  }
  assert.match(render(g, { page: 0, cityView: 'topdown' }, 110, 45), /BALANÇO/);
});
