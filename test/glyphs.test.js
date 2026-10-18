import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { glyph, setGlyphs, glyphMode } from '../src/glyphs.js';
import { cityArt } from '../src/art.js';
import { topdownMap } from '../src/map.js';
import { loadSettings, saveSettings } from '../src/storage.js';
import { createGame, BUILDINGS } from '../src/game.js';
import { render } from '../src/ui.js';
import { createFront, renderFront } from '../src/front.js';
const plain = text => text.replace(/\x1b\[[0-9;]*m/g, '');

test('modo ASCII é o padrão e não altera nenhuma arte', () => {
  setGlyphs('ascii');
  const art = ['+--+', '|[]|', '+--+'];
  assert.equal(glyph(art), art);
  assert.ok(cityArt(4).every(line => /^[\x20-\x7e]*$/.test(line)));
});
test('conversão Unicode conserva larguras e escolhe cantos pelos vizinhos', () => {
  assert.deepEqual(glyph(['+--+', '|[]|', '+--+'], 'unicode'), ['┌──┐', '│▐▌│', '└──┘']);
  assert.deepEqual(glyph(['.--.', '|##|'], 'unicode'), ['╭──╮', '│▓▓│']);
  assert.deepEqual(glyph(['CAS++'], 'unicode'), ['CAS++']);
  setGlyphs('unicode');
  try {
    for (let stage = 0; stage < 5; stage++) {
      assert.ok(cityArt(stage).every(line => line.length === 62 && !/[|\\\/_#~]/.test(line)), `estágio ${stage}`);
    }
    const g = createGame(); for (const b of BUILDINGS) g.buildings[b.id] = 1;
    assert.ok(topdownMap(g).every(row => row.reduce((n, s) => n + s.text.length, 0) === 69));
  } finally { setGlyphs('ascii'); }
});
test('aba Ajustes mostra o modo atual e telas Unicode cabem em 80x24', () => {
  const g = createGame();
  assert.match(plain(render(g, { page: 8 }, 110, 40)), /Caracteres das ilustrações: ASCII/);
  setGlyphs('unicode');
  try {
    assert.match(plain(render(g, { page: 8 }, 110, 40)), /Caracteres das ilustrações: UNICODE/);
    for (let page = 0; page < 9; page++) {
      const rows = plain(render(g, { page, gatherStarted: 0 }, 80, 24)).split('\n');
      assert.ok(rows.length < 24 && rows.every(row => [...row].length < 80), `página ${page}`);
    }
    const f = createFront(true); f.screen = 'menu';
    assert.match(renderFront(f, 100, 32), /╭─+╮/);
  } finally { setGlyphs('ascii'); }
  assert.equal(glyphMode(), 'ascii');
});
test('ajuste de caracteres persiste fora do save e ignora valores inválidos', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'halfaciv-settings-'));
  try {
    const file = path.join(dir, 'settings.json');
    assert.deepEqual(loadSettings(file), { glyphs: 'ascii' });
    saveSettings({ glyphs: 'unicode' }, file);
    assert.deepEqual(loadSettings(file), { glyphs: 'unicode' });
    fs.writeFileSync(file, '{"glyphs":"emoji"}');
    assert.deepEqual(loadSettings(file), { glyphs: 'ascii' });
    fs.writeFileSync(file, 'quebrado');
    assert.deepEqual(loadSettings(file), { glyphs: 'ascii' });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
