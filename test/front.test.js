import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createFront, frontKey, renderFront } from '../src/front.js';
import { backup, save, load, hasSave } from '../src/storage.js';
import { createGame } from '../src/game.js';

test('intro revela texto antes de avançar e pode ser pulada', () => {
  const f = createFront(false, 1000);
  frontKey(f, 'return', '', 1000); assert.equal(f.chapter, 0); assert.equal(f.revealed, true);
  frontKey(f, 'return', '', 1000); assert.equal(f.chapter, 1); assert.equal(f.revealed, false);
  frontKey(f, 'escape'); assert.equal(f.screen, 'menu');
  frontKey(f, '3', '', 2000); assert.equal(f.screen, 'intro'); assert.equal(f.chapter, 0);
  for (let i = 0; i < 3; i++) frontKey(f, 'return', '', 100000 + i * 10000);
  assert.equal(f.screen, 'menu');
});
test('menu sem save impede continuar e permite nomear um novo domínio', () => {
  const f = createFront(); f.screen = 'menu';
  assert.equal(frontKey(f, '1'), undefined); assert.match(f.message, /Nenhum/);
  frontKey(f, '2'); assert.equal(f.screen, 'name');
  frontKey(f, 'v', 'Vale'); frontKey(f, 'space', ' '); frontKey(f, 'a', 'Azul');
  assert.deepEqual(frontKey(f, 'return'), { type: 'new', name: 'Vale Azul' });
  frontKey(f, 'escape'); frontKey(f, '2');
  assert.deepEqual(frontKey(f, 'return'), { type: 'new', name: 'Vale da Aurora' });
});
test('novo domínio com save exige confirmação explícita; cancelar não inicia campanha', () => {
  const f = createFront(true); f.screen = 'menu';
  assert.deepEqual(frontKey(f, '1'), { type: 'continue' });
  frontKey(f, '2'); assert.equal(f.screen, 'confirm');
  assert.equal(frontKey(f, 'return'), undefined); assert.equal(f.screen, 'confirm');
  frontKey(f, 'n'); assert.equal(f.screen, 'menu');
  frontKey(f, '2'); frontKey(f, 's'); assert.equal(f.screen, 'name');
  frontKey(f, 'q', 'q'); assert.equal(f.name, 'q'); assert.equal(f.screen, 'name');
});
test('backup preserva integralmente campanha anterior antes da substituição', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'halfaciv-menu-'));
  try {
    const file = path.join(dir, 'realm.json'); assert.equal(hasSave(file), false);
    const g = createGame(); g.stage = 3; save(g, file);
    const old = fs.readFileSync(file, 'utf8'); const copy = backup(file);
    save(createGame(), file);
    assert.equal(fs.readFileSync(copy, 'utf8'), old); assert.equal(load(file).stage, 0);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test('menu, prólogo, confirmação e ajuda cabem em 80x24 e respeitam NO_COLOR', () => {
  const f = createFront();
  for (const screen of ['intro', 'menu', 'name', 'help', 'confirm']) {
    f.screen = screen;
    const text = renderFront(f, 80, 24).replace(/\x1b\[[0-9;]*m/g, '');
    assert.ok(text.split('\n').length < 24, screen);
    assert.ok(text.split('\n').every(l => l.length < 80), screen);
    if (screen === 'help') assert.match(text, /Fechar o livro/);
  }
});
