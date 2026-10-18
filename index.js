import readline from 'node:readline';
import { createGame, tick, offline, build, reform, choose, advance, setTax, BUILDINGS, REFORMS } from './src/game.js';
import { render } from './src/ui.js';
import { load, save, SAVE, hasSave, backup, loadSettings, saveSettings } from './src/storage.js';
import { setGlyphs, glyphMode } from './src/glyphs.js';
import { createFront, frontKey, renderFront, absence } from './src/front.js';
import { navigatePage, gatherProvisions, toggleCityView } from './src/interaction.js';
import { recruit, dismiss, refreshCandidates, recruitmentList, PAGES, legendOf } from './src/court.js';
import { CREEDS, RITES, adopt, rite } from './src/faith.js';
import { respond } from './src/calamity.js';
import { chronicle } from './src/game.js';

const settings = loadSettings();
setGlyphs(settings.glyphs);
// Prévia sem TTY e sem tocar em saves: útil para capturas e verificações.
if (process.argv.includes('--preview')) {
  if (process.argv.includes('--unicode')) setGlyphs('unicode');
  const g = createGame();
  const target = process.argv[process.argv.indexOf('--preview') + 1];
  if (target === 'menu' || target === 'intro') {
    const f = createFront(false); f.screen = target; f.revealed = true;
    console.log(renderFront(f, 110, 36));
  } else console.log(render(g, { page: Number(target) || 0, selected: 0, cityView: target === 'map' ? 'topdown' : 'panorama' }, 110, 36));
  process.exit(0);
}
if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error('Abra em um terminal interativo: npm start (ou node index.js). Prévia: node index.js --preview');
  process.exit(1);
}
let game = null;
const front = createFront(hasSave());
let mode = 'front';
const view = { page: 0, selected: 0, scroll: 0, message: 'Bem-vindo ao vale. Use Tab para abrir Obras e construir uma segunda horta.' };
let messageUntil = Date.now() + 9000, exiting = false;
const say = text => { view.message = text || 'Feito. As crônicas registrarão sua escolha.'; messageUntil = Date.now() + 5000; };
const writeSave = () => { if (!game) return true; try { save(game); front.hasSave = true; return true; } catch (e) { front.message = 'Falha ao salvar: ' + e.message; say(front.message); return false; } };
function restore() {
  process.stdout.write('\x1b[0m\x1b[?25h\x1b[?1049l');
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
}
function quit() {
  if (exiting) return;
  if (!writeSave()) { say('Não foi possível salvar. Verifique as permissões e pressione S para tentar novamente.'); return; }
  exiting = true; clearInterval(loop); clearInterval(saver); restore();
  console.log(game ? `Seu domínio foi salvo em ${SAVE}` : 'Até a próxima crônica.'); process.exit(0);
}
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true); process.stdin.resume();
process.stdout.write('\x1b[?1049h\x1b[?25l');
function draw() {
  if (Date.now() > messageUntil) view.message = '';
  const cols = process.stdout.columns || 100, rows = process.stdout.rows || 32;
  const frame = mode === 'front' ? renderFront(front, cols, rows) : render(game, view, cols, rows);
  process.stdout.write('\x1b[H' + frame.split('\n').map(line => line + '\x1b[K').join('\r\n') + '\x1b[J');
}
process.stdin.on('keypress', (text, key = {}) => {
  const name = (key.name || text || '').toLowerCase();
  if (key.ctrl && name === 'c') return quit();
  if (mode === 'front') {
    const action = frontKey(front, name, key.ctrl || key.meta ? '' : text);
    try {
      if (action?.type === 'quit') return quit();
      if (action?.type === 'continue' && !game) {
        game = load();
        const before = structuredClone(game), elapsed = offline(game);
        // Ausências curtas não merecem relatório; as longas mostram o que o intendente fez.
        if (elapsed >= 5) { front.screen = 'away'; front.away = absence(before, game, elapsed); draw(); return; }
      }
      if (action?.type === 'continue' || action?.type === 'play') { mode = 'play'; last = Date.now(); }
      if (action?.type === 'new') {
        if (game && !writeSave()) { draw(); return; }
        backup();
        const fresh = createGame(); fresh.name = action.name;
        fresh.log = [`Doze famílias acendem a primeira fogueira em ${action.name}.`];
        save(fresh); game = fresh; front.hasSave = true;
        mode = 'play'; last = Date.now();
        delete view.lastGather; delete view.gatherStarted;
        view.page = 0; view.selected = 0; view.scroll = 0;
        view.cityView = 'panorama';
        say('O vale tem um nome. Agora precisa de pão e abrigo.');
      }
    } catch (e) { front.message = e.message; }
    draw(); return;
  }
  if (name === 'q') return quit();
  if (name === 'm' || name === 'escape') {
    if (writeSave()) { mode = 'front'; front.screen = 'menu'; front.selected = 0; front.message = ''; }
    draw(); return;
  }
  if (name === 'e') { view.page = PAGES.council; view.scroll = 0; view.selected = 0; }
  else if (name === 'v') toggleCityView(view);
  else if (navigatePage(view, { ...key, name })) { /* Tab / Shift+Tab */ }
  else if (name === 'up' || name === 'down') {
    const count = view.page === PAGES.works ? BUILDINGS.length : view.page === PAGES.decrees ? REFORMS.length
      : view.page === PAGES.faith ? CREEDS.length + RITES.length : view.page === PAGES.retinue ? recruitmentList(game).length : 0;
    if (count) {
      view.selected = (view.selected + (name === 'up' ? count - 1 : 1)) % count;
      const line = view.page === PAGES.faith ? 7 + view.selected * 2 + (view.selected >= CREEDS.length ? 2 : 0)
        : (view.page === PAGES.works ? 3 : view.page === PAGES.retinue ? 5 : 4) + view.selected * (view.page === PAGES.works ? 2 : 3);
      const budget = (process.stdout.rows || 32) - 12;
      view.scroll = Math.max(0, line - budget + 4);
    }
  } else if (name === 'pagedown') view.scroll += 5;
  else if (name === 'pageup') view.scroll = Math.max(0, view.scroll - 5);
  else if (name === 'x') say(respond(game));
  else if (name === 'return') {
    if (view.page === PAGES.works) say(build(game, BUILDINGS[view.selected].id));
    if (view.page === PAGES.decrees) say(reform(game, REFORMS[view.selected].id));
    if (view.page === PAGES.faith) {
      say(view.selected < CREEDS.length ? adopt(game, CREEDS[view.selected].id) : rite(game, RITES[view.selected - CREEDS.length].id));
    }
    if (view.page === PAGES.settings) {
      settings.glyphs = setGlyphs(glyphMode() === 'unicode' ? 'ascii' : 'unicode');
      try { saveSettings(settings); say(`Ilustrações em ${settings.glyphs.toUpperCase()}.`); }
      catch (e) { say('Modo aplicado, mas não foi possível salvar o ajuste: ' + e.message); }
    }
    if (view.page === PAGES.retinue) {
      const entry = recruitmentList(game)[view.selected];
      if (entry && !entry.hired) {
        const error = recruit(game, entry.person.id);
        if (!error) chronicle(game, `${entry.person.name} entrou no séquito.${legendOf(entry.person) ? ' Uma lenda do vale!' : ''}`);
        say(error); view.selected = 0; view.scroll = 0;
      } else say('Esse personagem já integra seu séquito. D dispensa o selecionado.');
    }
  } else if (view.page === PAGES.retinue && name === 'r') {
    const error = refreshCandidates(game);
    if (!error) chronicle(game, 'Novos candidatos chegaram ao salão dos contratos.');
    say(error); view.selected = 0; view.scroll = 0;
  } else if (view.page === PAGES.retinue && name === 'd') {
    const entry = recruitmentList(game)[view.selected];
    if (entry?.hired) {
      const error = dismiss(game, entry.person.id);
      if (!error) chronicle(game, `${entry.person.name} deixou o séquito.`);
      say(error); view.selected = 0; view.scroll = 0;
    } else say('Selecione um membro contratado para dispensar.');
  } else if (view.page === PAGES.council && ['a', 'b', 'c'].includes(name)) say(choose(game, ['a', 'b', 'c'].indexOf(name)));
  else if (name === 't') { setTax(game); say('Tributos alterados. Use Tab para abrir Decretos.'); }
  else if (name === 'p') say(advance(game));
  else if (name === 's') { if (writeSave()) say('Domínio salvo.'); }
  else if (name === 'space') {
    if (gatherProvisions(game, view)) say('Mutirão: +2 alimento, +1 madeira. Disponível uma vez por segundo.');
  }
  draw();
});
process.stdout.on('resize', draw);
process.on('SIGINT', quit); process.on('SIGTERM', quit);
process.on('uncaughtException', e => { try { if (game) save(game); } catch {} restore(); console.error(e); process.exit(1); });
let last = Date.now();
const loop = setInterval(() => { const now = Date.now(); if (mode === 'play') tick(game, (now - last) / 1000); last = now; draw(); }, 200);
const saver = setInterval(() => { if (mode === 'play') writeSave(); }, 15000);
draw();
