import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game.js';
import { navigatePage, gatherProvisions, provisionAnimation } from '../src/interaction.js';
import { render } from '../src/ui.js';

test('Tab circula páginas, Shift+Tab volta e números não navegam', () => {
  const view = { page: 8, selected: 3, scroll: 10 };
  assert.equal(navigatePage(view, { name: 'tab' }), true);
  assert.deepEqual(view, { page: 0, selected: 0, scroll: 0 });
  navigatePage(view, { name: 'tab', shift: true }); assert.equal(view.page, 8);
  for (const name of ['1', '2', '3', '4', '5']) {
    assert.equal(navigatePage(view, { name }), false); assert.equal(view.page, 8);
  }
});
test('mutirão anima somente a coleta aceita e respeita o intervalo de um segundo', () => {
  const g = createGame(), view = {};
  assert.equal(gatherProvisions(g, view), true);
  assert.equal(g.resources.food, 102); assert.equal(g.resources.wood, 66);
  g.time = .5;
  assert.equal(gatherProvisions(g, view), false); assert.equal(view.gatherStarted, 0);
  assert.equal(g.resources.food, 102);
  assert.notDeepEqual(provisionAnimation(0), provisionAnimation(.6));
  assert.deepEqual(provisionAnimation(1.2), []);
  g.time = 1; assert.equal(gatherProvisions(g, view), true);
  assert.equal(view.gatherStarted, 1); assert.equal(g.resources.food, 104);
});
test('animação cabe em todas as páginas e desaparece ao terminar', () => {
  const g = createGame(), view = { page: 0, gatherStarted: 0 };
  for (let page = 0; page < 7; page++) {
    view.page = page;
    const text = render(g, view, 80, 24).replace(/\x1b\[[0-9;]*m/g, '');
    assert.match(text, /MUTIRÃO/);
    assert.ok(text.split('\n').length < 24);
    assert.ok(text.split('\n').every(l => l.length < 80));
  }
  g.time = 2; assert.doesNotMatch(render(g, view, 80, 24), /MUTIRÃO/);
});
