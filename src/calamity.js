// Calamidades: ficam ativas e drenam o domínio até o governante responder (tecla X).
// Só ocorrem com o jogo aberto; o progresso offline não as sorteia nem as agrava.
import { chronicle, canPay, pay, support } from './game.js';

export const DURATION = 90;
export const CALAMITIES = [
  { id: 'fire', name: 'Incêndio no bairro', body: 'As chamas pulam de telhado em telhado.', when: g => g.buildings.house >= 1,
    drain: { wood: .8 }, unrest: [.05, 0, 0, 0], response: 'Brigada de baldes', cost: { food: 20, wood: 15 }, toll: 'wood', reward: [6, 0, 0, 0] },
  { id: 'fever', name: 'Febre nos cortiços', body: 'Uma febre se espalha pelas casas mais cheias.', when: g => g.population >= 25, sacred: true,
    people: .04, unrest: [.04, 0, .02, 0], response: 'Isolar e tratar os doentes', cost: { gold: 35, food: 25 }, toll: 'population', reward: [6, 0, 4, 0] },
  { id: 'bandits', name: 'Bandidos na estrada', body: 'Um bando assalta caravanas e cobra pedágio à força.', when: g => g.stage >= 1,
    drain: { gold: .5 }, unrest: [0, .05, 0, .02], response: 'Armar a milícia', cost: { food: 30, gold: 25 }, toll: 'gold', reward: [0, 6, 0, 4] },
  { id: 'blight', name: 'Praga nas hortas', body: 'Lagartas devoram as folhas antes da colheita.', when: g => g.buildings.farm >= 3, sacred: true,
    harvest: .4, unrest: [.04, 0, 0, 0], response: 'Queimar e replantar', cost: { wood: 40 }, toll: 'food', reward: [8, 0, 0, 0] },
];
export function createCalamity(seed) { return { id: null, since: 0, next: 180, seed: (Number(seed) >>> 0) || 1, resolved: 0, failed: 0 }; }
function random(g) {
  let x = g.calamity.seed | 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  g.calamity.seed = x >>> 0 || 1; return g.calamity.seed / 0x100000000;
}
export const activeCalamity = g => CALAMITIES.find(c => c.id === g.calamity.id) || null;
export const calamityLeft = g => Math.max(0, Math.ceil(g.calamity.since + DURATION - g.time));
// A guarda reduz pela metade os danos dos bandidos.
const severity = (g, c) => c.id === 'bandits' && g.buildings.guard ? .5 : 1;
export function responseCost(g, c = activeCalamity(g)) {
  return Object.fromEntries(Object.entries(c?.cost || {}).map(([k, v]) => [k, Math.ceil(v * (1 + g.stage * .6))]));
}
export const harvestPenalty = g => activeCalamity(g)?.harvest || 0;
function schedule(g) { g.calamity.next = g.time + 150 + random(g) * 120; }
export function endCalamity(g, resolved) {
  const c = activeCalamity(g); if (!c) return;
  if (resolved) { g.calamity.resolved++; support(g, c.reward); g.legitimacy = Math.min(100, g.legitimacy + 3); }
  g.calamity.id = null; schedule(g);
}
export function tickCalamity(g, dt) {
  const c = activeCalamity(g);
  if (!c) {
    if (g.time < g.calamity.next) return;
    const options = CALAMITIES.filter(x => x.when(g));
    if (!options.length) { schedule(g); return; }
    const next = options[Math.floor(random(g) * options.length)];
    g.calamity.id = next.id; g.calamity.since = g.time;
    chronicle(g, `CALAMIDADE: ${next.name}. ${next.body}`);
    return;
  }
  const k = severity(g, c);
  for (const [r, v] of Object.entries(c.drain || {})) g.resources[r] = Math.max(0, g.resources[r] - v * k * dt);
  if (c.people) g.population = Math.max(5, g.population - c.people * k * dt);
  g.factions = g.factions.map((v, i) => Math.max(0, v - c.unrest[i] * k * dt));
  if (g.time - g.calamity.since < DURATION) return;
  // Ignorada até o fim, a calamidade cobra um preço final.
  if (c.toll === 'population') g.population = Math.max(5, g.population - 3);
  else g.resources[c.toll] *= .85;
  g.legitimacy = Math.max(0, g.legitimacy - 5); g.calamity.failed++;
  chronicle(g, `${c.name} passou sem resposta e deixou cicatrizes no vale.`);
  endCalamity(g, false);
}
export function respond(g) {
  const c = activeCalamity(g);
  if (!c) return 'Nenhuma calamidade ameaça o domínio.';
  const cost = responseCost(g, c);
  if (!canPay(g, cost)) return 'Faltam recursos para responder à calamidade.';
  pay(g, cost); chronicle(g, `${c.name}: ${c.response}. O vale respira aliviado.`);
  endCalamity(g, true); return null;
}
