// Fé do domínio: um credo oficial, devoção acumulada nas capelas e ritos com efeitos.
import { chronicle, canPay, pay, support } from './game.js';
import { endCalamity, activeCalamity } from './calamity.js';

export const CREEDS = [
  { id: 'aurora', name: 'Igreja da Aurora', short: 'Aurora', faction: 2, text: '+15% influência; +0,01 legitimidade/s com alimento',
    lore: 'Sacerdotes do amanhecer, guardiões dos sinos e dos registros.', support: [-4, 0, 12, 0], bonus: { influence: .15 }, legitimacy: .01 },
  { id: 'harvest', name: 'Círculo das Colheitas', short: 'Colheitas', faction: 0, text: '+15% alimento; a Bênção dos campos rende +40%',
    lore: 'A fé antiga das famílias, celebrada entre sementes e fogueiras.', support: [12, 0, -6, 0], bonus: { food: .15 } },
  { id: 'craft', name: 'Irmandade dos Ofícios', short: 'Ofícios', faction: 1, text: '+10% madeira, pedra e ouro',
    lore: 'Santos padroeiros de cada guilda, honrados nas oficinas.', support: [0, 12, -4, 0], bonus: { wood: .1, stone: .1, gold: .1 } },
  { id: 'kings', name: 'Culto dos Reis Antigos', short: 'Reis Antigos', faction: 3, text: '+10% influência; +6 legitimidade a cada novo título',
    lore: 'Linhagens nobres veneram os monarcas que vieram antes.', support: [-4, 0, 0, 12], bonus: { influence: .1 } },
];
export const RITES = [
  { id: 'feast', name: 'Festa do padroeiro', cost: { devotion: 30, food: 30 }, text: '+10 à facção do credo; +6 camponeses' },
  { id: 'blessing', name: 'Bênção dos campos', cost: { devotion: 40 }, text: '+25% alimento por 120s' },
  { id: 'pilgrimage', name: 'Peregrinação', cost: { devotion: 60 }, text: '+40 influência; +4 legitimidade' },
  { id: 'procession', name: 'Procissão penitente', cost: { devotion: 35 }, text: 'Encerra febre ou praga em curso; sem elas, +5 legitimidade' },
];
export const FIRST_ADOPTION = 25, CONVERSION = 80, CONVERSION_COOLDOWN = 240;

export function createFaith() { return { creed: null, devotion: 0, blessingUntil: 0, changedAt: null, rites: 0 }; }
export const creedOf = g => CREEDS.find(c => c.id === g.faith.creed) || null;
export function devotionCap(g) { return 100 + g.buildings.chapel * 60; }
export function devotionRate(g) {
  return .04 + g.buildings.chapel * .22 + (g.reforms.includes('schools') ? .15 : 0) + (g.faith.creed ? .05 : 0);
}
// Bônus somados aos do séquito em rates(): credo oficial e bênção ativa.
export function faithBonuses(g) {
  const out = { food: 0, wood: 0, stone: 0, gold: 0, influence: 0 }, creed = creedOf(g);
  for (const [k, v] of Object.entries(creed?.bonus || {})) out[k] += v;
  if (g.time < g.faith.blessingUntil) out.food += creed?.id === 'harvest' ? .4 : .25;
  return out;
}
export function tickFaith(g, dt, fed) {
  g.faith.devotion = Math.min(devotionCap(g), g.faith.devotion + devotionRate(g) * dt);
  const creed = creedOf(g);
  if (fed && creed?.legitimacy) g.legitimacy = Math.min(100, g.legitimacy + creed.legitimacy * dt);
}
export function adoptionCost(g) { return g.faith.creed ? CONVERSION : FIRST_ADOPTION; }
export function conversionWait(g) {
  return g.faith.changedAt === null ? 0 : Math.max(0, Math.ceil(g.faith.changedAt + CONVERSION_COOLDOWN - g.time));
}
export function adopt(g, id) {
  const creed = CREEDS.find(c => c.id === id);
  if (!creed) return 'Credo desconhecido.';
  if (g.stage < 1) return 'A fé oficial exige o título de Vila.';
  if (!g.buildings.chapel) return 'Erga uma Capela dos sinos antes de declarar a fé oficial.';
  if (g.faith.creed === id) return 'Esse já é o credo oficial do domínio.';
  if (conversionWait(g)) return `O povo ainda estranha a última conversão. Aguarde ${conversionWait(g)}s.`;
  const cost = adoptionCost(g);
  if (g.resources.influence < cost) return `São necessários ${cost} de influência.`;
  const previous = creedOf(g);
  g.resources.influence -= cost;
  if (previous) {
    const change = [0, 0, 0, 0]; change[previous.faction] = -15;
    support(g, change); g.faith.devotion = 0;
    g.legitimacy = Math.max(0, g.legitimacy - 6);
  }
  support(g, creed.support);
  g.faith.creed = id; g.faith.changedAt = g.time;
  chronicle(g, previous ? `O domínio abandona ${previous.name} e abraça ${creed.name}.` : `${creed.name} é declarada a fé oficial.`);
  return null;
}
export function rite(g, id) {
  const r = RITES.find(x => x.id === id), creed = creedOf(g);
  if (!r) return 'Rito desconhecido.';
  if (!creed) return 'Declare uma fé oficial antes de celebrar ritos.';
  const { devotion, ...rest } = r.cost;
  if (g.faith.devotion < devotion) return `Devoção insuficiente: ${devotion} necessária.`;
  if (!canPay(g, rest)) return 'Faltam recursos para o rito.';
  if (id === 'blessing' && g.time < g.faith.blessingUntil) return 'Os campos já estão abençoados.';
  g.faith.devotion -= devotion; pay(g, rest); g.faith.rites++;
  let detail = '';
  if (id === 'feast') { const change = [6, 0, 0, 0]; change[creed.faction] += 10; support(g, change); }
  if (id === 'blessing') g.faith.blessingUntil = g.time + 120;
  if (id === 'pilgrimage') { g.resources.influence += 40; g.legitimacy = Math.min(100, g.legitimacy + 4); }
  if (id === 'procession') {
    const c = activeCalamity(g);
    if (c?.sacred) { endCalamity(g, true); detail = ` ${c.name} chega ao fim.`; }
    else g.legitimacy = Math.min(100, g.legitimacy + 5);
  }
  chronicle(g, `${r.name} celebrada por ${creed.name}.${detail}`);
  return null;
}
