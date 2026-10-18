import { PAGE_NAMES } from './court.js';
export function toggleCityView(view) {
  if (view.page !== 0) return false;
  view.cityView = view.cityView === 'topdown' ? 'panorama' : 'topdown';
  view.scroll = 0;
  return true;
}
export function navigatePage(view, key) {
  if (key.name !== 'tab') return false;
  view.page = (view.page + (key.shift ? PAGE_NAMES.length - 1 : 1)) % PAGE_NAMES.length;
  view.selected = 0;
  view.scroll = 0;
  return true;
}

export function gatherProvisions(game, view) {
  if (game.time - (view.lastGather ?? -Infinity) < 1) return false;
  game.resources.food += 2;
  game.resources.wood += 1;
  view.lastGather = game.time;
  view.gatherStarted = game.time;
  return true;
}

// Efeito transitório: não entra no save e não bloqueia os controles.
export function provisionAnimation(elapsed) {
  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed >= 1.2) return [];
  const frame = Math.min(5, Math.floor(elapsed / .2));
  const trail = ' '.repeat(frame * 4);
  const legs = frame % 2 ? '/ >' : '< \\';
  return [
    `  MUTIRÃO  ${['Colhendo', 'Reunindo', 'Transportando', 'Transportando', 'Armazenando', 'Entregue!'][frame]}`,
    `  ${trail}o__[##]   +2 alimento / +1 madeira`,
    `  ${trail}${legs} oo   [${'#'.repeat(frame + 1)}${'.'.repeat(5 - frame)}]`,
  ];
}
