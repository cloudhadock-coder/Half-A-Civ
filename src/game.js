import { addCourt, courtBonuses, politicalChoice } from './court.js';
import { createFaith, faithBonuses, tickFaith, creedOf } from './faith.js';
import { createCalamity, tickCalamity, harvestPenalty } from './calamity.js';
import { featBonus, checkFeats } from './feats.js';
export const RESOURCES = { food: 'Alimento', wood: 'Madeira', stone: 'Pedra', gold: 'Ouro', influence: 'Influência' };
export const FACTIONS = ['Camponeses', 'Guildas', 'Clero', 'Nobreza'];
export const STAGES = ['Aldeia', 'Vila', 'Cidade livre', 'Principado', 'Reino'];
export const BUILDINGS = [
  { id: 'farm', name: 'Horta comunal', cost: { wood: 15 }, stage: 0, text: '+2 alimento/s; ocupa 2 habitantes' },
  { id: 'lumber', name: 'Serraria', cost: { wood: 20, gold: 5 }, stage: 0, text: '+1,2 madeira/s; ocupa 2 habitantes' },
  { id: 'house', name: 'Casas de taipa', cost: { wood: 25, stone: 5 }, stage: 0, text: '+10 lugares para habitantes' },
  { id: 'quarry', name: 'Pedreira', cost: { wood: 35, gold: 15 }, stage: 0, text: '+0,7 pedra/s; ocupa 3 habitantes' },
  { id: 'market', name: 'Feira de mercadores', cost: { wood: 55, stone: 25, gold: 30 }, stage: 1, text: '+1 ouro/s; ocupa 3 habitantes' },
  { id: 'chapel', name: 'Capela dos sinos', cost: { stone: 70, gold: 45 }, stage: 1, text: '+0,15 influência/s; fortalece a legitimidade' },
  { id: 'guard', name: 'Quartel da guarda', cost: { wood: 80, stone: 90, gold: 60 }, stage: 2, text: 'Protege a estabilidade; ocupa 4 habitantes' },
  { id: 'hall', name: 'Paço do conselho', cost: { wood: 120, stone: 160, gold: 100 }, stage: 2, text: '+0,35 influência/s e +10 de capacidade' },
  { id: 'castle', name: 'Fortaleza da coroa', cost: { stone: 450, wood: 220, gold: 350 }, stage: 3, text: 'Sede do reino; +0,6 influência/s' },
  { id: 'windmill', name: 'Moinho dos ventos', cost: { wood: 70, stone: 30, gold: 45 }, stage: 0, special: true, color: 'gold', text: 'Único: +30% alimento produzido; pás animadas na cidade' },
  { id: 'forge', name: 'Forja rubra', cost: { wood: 90, stone: 80, gold: 70 }, stage: 1, special: true, color: 'red', text: 'Única: +25% madeira e pedra; brasa animada' },
  { id: 'observatory', name: 'Torre das estrelas', cost: { stone: 170, gold: 130 }, stage: 2, special: true, color: 'blue', text: 'Única: +40% influência; estrelas cintilantes' },
  { id: 'garden', name: 'Jardim dos juramentos', cost: { wood: 160, stone: 120, gold: 160 }, stage: 2, special: true, color: 'purple', text: 'Único: +0,025 apoio popular/s e +0,01 legitimidade/s com alimento' },
];
export const REFORMS = [
  { id: 'commons', name: 'Carta dos comuns', cost: { influence: 20, gold: 30 }, stage: 1, text: '+20 camponeses; +15% alimento; -8 nobreza', support: [20, 0, 0, -8] },
  { id: 'guilds', name: 'Estatuto das guildas', cost: { influence: 40, gold: 70 }, stage: 1, text: '+20 guildas; +30% receita das feiras; -8 camponeses', support: [-8, 20, 0, 0] },
  { id: 'schools', name: 'Escolas do mosteiro', cost: { influence: 70, gold: 100 }, stage: 2, text: '+15 clero; +20 legitimidade; +20% influência', support: [0, 0, 15, 0] },
  { id: 'charter', name: 'Conselho representativo', cost: { influence: 100, gold: 160 }, stage: 2, text: '+15 camponeses e guildas; +15 legitimidade; -15 nobreza', support: [15, 15, 0, -15] },
  { id: 'oath', name: 'Pacto dos vassalos', cost: { influence: 180, gold: 220 }, stage: 3, text: '+25 nobreza; +20 legitimidade; -10 guildas', support: [0, -10, 0, 25] },
];
export const EVENTS = [
  { title: 'Uma caravana pede abrigo', body: 'Mercadores trazem ferramentas, mas exigem isenção dos pedágios.', options: [
    { name: 'Acolher a caravana', cost: { food: 25 }, gain: { wood: 40, gold: 25 }, support: [0, 10, 0, -3] },
    { name: 'Cobrar o pedágio', gain: { gold: 45 }, support: [0, -10, 0, 8] },
    { name: 'Dividir os mantimentos', cost: { food: 40 }, legitimacy: 8, support: [12, 0, 6, 0] },
  ] },
  { title: 'O campo e o dízimo', body: 'Uma família contesta a cobrança do templo. A praça espera seu julgamento.', options: [
    { name: 'Perdoar a dívida', legitimacy: 5, support: [15, 0, -10, 0] },
    { name: 'Manter o dízimo', gain: { gold: 25 }, support: [-10, 0, 15, 5] },
    { name: 'O tesouro paga', cost: { gold: 30 }, legitimacy: 8, support: [8, 0, 8, 0] },
  ] },
  { title: 'Madeira para o inverno', body: 'Os artesãos disputam a floresta com os moradores dos arredores.', options: [
    { name: 'Reservar a mata aos comuns', gain: { food: 40 }, support: [12, -8, 0, -4] },
    { name: 'Conceder licença às guildas', gain: { wood: 55 }, support: [-8, 12, 0, 0] },
    { name: 'Negociar manejo conjunto', cost: { influence: 12 }, gain: { wood: 25 }, support: [6, 6, 0, 0], legitimacy: 4 },
  ] },
  { title: 'Estandartes na fronteira', body: 'Um pequeno senhor oferece reconhecimento em troca de uma dádiva.', options: [
    { name: 'Enviar ouro e embaixadores', cost: { gold: 60 }, legitimacy: 12, support: [0, 5, 0, 12] },
    { name: 'Recebê-lo com uma festa', cost: { food: 60 }, legitimacy: 6, support: [8, 0, 5, 5] },
    { name: 'Afirmar a independência', legitimacy: 3, support: [6, 4, 0, -8] },
  ] },
  { title: 'A ponte cedeu', body: 'A travessia do rio caiu. Moradores e comerciantes disputam a ajuda do tesouro.', options: [
    { name: 'Reconstruir com um mutirão', cost: { wood: 30, food: 20 }, legitimacy: 6, support: [12, 5, 0, -3] },
    { name: 'Entregar a ponte às guildas', gain: { gold: 30 }, support: [-8, 14, 0, 4] },
    { name: 'Abrir uma passagem provisória', gain: { wood: 10 }, support: [3, -5, 0, 0] },
  ] },
  { title: 'Sementes de terras distantes', body: 'Uma viajante oferece sementes raras. O templo teme costumes estrangeiros.', options: [
    { name: 'Comprar sementes para todos', cost: { gold: 25 }, gain: { food: 80 }, support: [10, 5, -6, 0] },
    { name: 'Confiar o cultivo ao templo', cost: { wood: 20 }, gain: { food: 40 }, support: [3, -4, 12, 0] },
    { name: 'Trocar notícias com a viajante', gain: { influence: 12 }, support: [0, 5, -3, 0] },
  ] },
  { title: 'Uma descoberta na encosta', body: 'Pastores encontram pedras valiosas. Quem terá direito à descoberta?', options: [
    { name: 'Dividir com os descobridores', gain: { stone: 35, gold: 15 }, support: [10, 0, 0, -5] },
    { name: 'Vender a concessão às guildas', gain: { gold: 55 }, support: [-6, 12, 0, 3] },
    { name: 'Consagrar o local', gain: { influence: 20 }, legitimacy: 4, support: [0, -5, 12, 0] },
  ] },
];
// Gerador próprio: o sorteio continua após salvar e não depende da taxa de quadros.
function eventRandom(g) {
  let seed = g.eventSeed ?? ((g.savedAt ^ 0xa341316c) >>> 0);
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  g.eventSeed = seed;
  return seed / 0x100000000;
}
function nextPetition(g) {
  const eligible = EVENTS.map((_, i) => i).filter(i => i !== g.lastEvent);
  g.event = eligible[Math.floor(eventRandom(g) * eligible.length)];
  g.eventCount++;
  chronicle(g, `Evento no conselho: ${EVENTS[g.event].title}.`);
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function createGame(now = Date.now()) {
  return addReligion(addCourt({ version: 3, name: 'Vale da Aurora', stage: 0, time: 0, population: 12,
    resources: { food: 100, wood: 65, stone: 25, gold: 35, influence: 0 },
    buildings: Object.fromEntries(BUILDINGS.map(b => [b.id, b.id === 'farm' || b.id === 'lumber' ? 1 : 0])),
    factions: [60, 50, 50, 40], legitimacy: 35, tax: 1, reforms: [], event: null,
    nextEvent: 40, eventCount: 0, savedAt: now, log: ['Doze famílias acendem a primeira fogueira no Vale da Aurora.'] }));
}
// Campos da versão 3: fé, calamidades e feitos.
export function addReligion(g) {
  g.faith = createFaith(); g.calamity = createCalamity(g.savedAt ^ 0x9e3779b9); g.feats = [];
  g.calamity.next = Math.max(180, g.time + 120); return g;
}
export function chronicle(g, text) { g.log.push(`[Dia ${Math.floor(g.time / 10) + 1}] ${text}`); g.log = g.log.slice(-60); }
export function capacity(g) { return 20 + g.buildings.house * 10 + g.buildings.hall * 10; }
export function workforce(g) {
  const needed = g.buildings.farm * 2 + g.buildings.lumber * 2 + g.buildings.quarry * 3 + g.buildings.market * 3 + g.buildings.guard * 4;
  return { needed, ratio: Math.min(1, g.population / Math.max(1, needed)) };
}
export function rates(g) {
  const b = g.buildings, labor = workforce(g).ratio;
  const season = Math.floor(g.time / 120) % 4;
  const harvest = [1.15, 1, 1.25, .65][season];
  const efficiency = .65 + Math.min(...g.factions) / 200;
  const bonus = courtBonuses(g), faith = faithBonuses(g), feats = featBonus(g);
  const boost = k => 1 + bonus[k] + faith[k] + feats;
  return {
    food: b.farm * 2 * harvest * labor * efficiency * (g.reforms.includes('commons') ? 1.15 : 1) * (b.windmill ? 1.3 : 1) * (1 - harvestPenalty(g)) * boost('food') - g.population * .065,
    wood: b.lumber * 1.2 * labor * efficiency * (b.forge ? 1.25 : 1) * boost('wood'),
    stone: b.quarry * .7 * labor * efficiency * (b.forge ? 1.25 : 1) * boost('stone'),
    gold: (g.population * .025 * [0.5, 1, 1.65][g.tax] + b.market * labor * (g.reforms.includes('guilds') ? 1.3 : 1)) * efficiency * boost('gold'),
    influence: (.03 + b.chapel * .15 + b.hall * .35 + b.castle * .6) * (g.reforms.includes('schools') ? 1.2 : 1) * (b.observatory ? 1.4 : 1) * boost('influence'),
  };
}
export function costOf(g, b) { return Object.fromEntries(Object.entries(b.cost).map(([k, v]) => [k, Math.ceil(v * 1.32 ** g.buildings[b.id] * (1 - Math.min(.5, courtBonuses(g).discount)))])); }
export function canPay(g, cost = {}) { return Object.entries(cost).every(([k, v]) => g.resources[k] >= v); }
export function pay(g, cost = {}) { for (const [k, v] of Object.entries(cost)) g.resources[k] -= v; }
export function support(g, changes = [0, 0, 0, 0]) { g.factions = g.factions.map((v, i) => clamp(v + changes[i], 0, 100)); }
export function build(g, id) {
  const b = BUILDINGS.find(x => x.id === id);
  if (!b || g.stage < b.stage) return 'Essa obra ainda não foi desbloqueada.';
  if (b.special && g.buildings[id]) return 'Esse monumento já foi construído.';
  const cost = costOf(g, b);
  if (!canPay(g, cost)) return 'Faltam recursos para essa obra.';
  pay(g, cost); g.buildings[id]++; chronicle(g, `${b.name} construída.`); return null;
}
export function reform(g, id) {
  const r = REFORMS.find(x => x.id === id);
  if (!r || g.stage < r.stage) return 'Reforma ainda indisponível.';
  if (g.reforms.includes(id)) return 'Essa reforma já está em vigor.';
  if (!canPay(g, r.cost)) return 'Faltam recursos para aprovar a reforma.';
  if (g.factions.filter(v => v >= 45).length < 3) return 'É necessário apoio de 3 facções (45 ou mais).';
  pay(g, r.cost); g.reforms.push(id); support(g, r.support);
  politicalChoice(g, r.support, id === 'schools' ? 'learning' : id === 'oath' ? 'martial' : 'stewardship');
  g.legitimacy = clamp(g.legitimacy + (id === 'schools' || id === 'oath' ? 20 : id === 'charter' ? 15 : 5), 0, 100);
  chronicle(g, `${r.name} promulgado.`); return null;
}
export function choose(g, index) {
  if (g.event === null) return 'Nenhuma petição aguarda decisão.';
  const event = EVENTS[g.event], o = event.options[index];
  if (!o) return 'Escolha inválida.';
  if (!canPay(g, o.cost)) return 'O tesouro não pode cumprir essa promessa.';
  pay(g, o.cost);
  for (const [k, v] of Object.entries(o.gain || {})) g.resources[k] += v;
  support(g, o.support); g.legitimacy = clamp(g.legitimacy + (o.legitimacy || 0), 0, 100);
  politicalChoice(g, o.support, g.event === 3 ? 'martial' : 'diplomacy');
  chronicle(g, `${event.title}: ${o.name}.`); g.lastEvent = g.event; g.event = null; g.nextEvent = g.time + 45 + Math.floor(eventRandom(g) * 46); return null;
}
export function requirements(g) {
  return [
    [{ label: '20 habitantes', ok: g.population >= 20 }, { label: '2 hortas', ok: g.buildings.farm >= 2 }, { label: '80 ouro', ok: g.resources.gold >= 80 }],
    [{ label: '40 habitantes', ok: g.population >= 40 }, { label: '2 feiras', ok: g.buildings.market >= 2 }, { label: '1 reforma', ok: g.reforms.length >= 1 }, { label: '150 ouro', ok: g.resources.gold >= 150 }],
    [{ label: '65 habitantes', ok: g.population >= 65 }, { label: '1 paço', ok: g.buildings.hall >= 1 }, { label: '2 reformas', ok: g.reforms.length >= 2 }, { label: '60 legitimidade', ok: g.legitimacy >= 60 }, { label: '300 ouro', ok: g.resources.gold >= 300 }],
    [{ label: '100 habitantes', ok: g.population >= 100 }, { label: '1 fortaleza', ok: g.buildings.castle >= 1 }, { label: '3 reformas', ok: g.reforms.length >= 3 }, { label: '75 legitimidade', ok: g.legitimacy >= 75 }, { label: '3 facções com apoio 50+', ok: g.factions.filter(v => v >= 50).length >= 3 }, { label: '500 ouro', ok: g.resources.gold >= 500 }],
  ][g.stage] || [];
}
export function advance(g) {
  if (g.stage === 4) return 'Seu reino já foi reconhecido. Continue governando.';
  if (!requirements(g).every(r => r.ok)) return 'Cumpra os requisitos antes de reivindicar o título.';
  g.resources.gold -= [80, 150, 300, 500][g.stage]; g.stage++;
  g.legitimacy = clamp(g.legitimacy + 8 + (creedOf(g)?.id === 'kings' ? 6 : 0), 0, 100);
  chronicle(g, `Novo capítulo: ${STAGES[g.stage]}! ${g.stage === 4 ? 'A coroa foi reconhecida; o governo continua.' : 'Novas obras e instituições estão disponíveis.'}`);
  return null;
}
export function setTax(g) { g.tax = (g.tax + 1) % 3; chronicle(g, `Tributos agora: ${['brandos', 'moderados', 'severos'][g.tax]}.`); }
// live = false no progresso offline: sem calamidades enquanto ninguém pode responder.
export function tick(g, seconds, live = true) {
  let remaining = clamp(Number(seconds) || 0, 0, 3600);
  while (remaining > 0) {
    const dt = Math.min(1, remaining), r = rates(g); remaining -= dt; g.time += dt;
    for (const k of Object.keys(RESOURCES)) g.resources[k] = Math.max(0, g.resources[k] + r[k] * dt);
    const fed = g.resources.food > 1;
    g.population = clamp(g.population + (fed ? .055 * (.5 + g.factions[0] / 100) : -.12) * dt, 5, capacity(g));
    g.factions[0] = clamp(g.factions[0] + (fed ? [0.025, 0, -.055][g.tax] : -.12) * dt, 0, 100);
    if (g.buildings.guard) g.factions[0] = clamp(g.factions[0] + .008 * dt, 0, 100);
    const bonus = courtBonuses(g);
    if (fed) {
      g.factions[0] = clamp(g.factions[0] + (bonus.approval + (g.buildings.garden ? .025 : 0)) * dt, 0, 100);
      g.legitimacy = clamp(g.legitimacy + (bonus.legitimacy + (g.buildings.garden ? .01 : 0)) * dt, 0, 100);
    }
    g.legitimacy = clamp(g.legitimacy + (fed ? Math.min(g.buildings.chapel, 3) * .003 : -.035) * dt, 0, 100);
    tickFaith(g, dt, fed);
    if (live) tickCalamity(g, dt);
    if (g.event === null && g.time >= g.nextEvent) nextPetition(g);
    checkFeats(g);
  }
}
export function offline(g, now = Date.now()) {
  const elapsed = clamp((now - g.savedAt) / 1000, 0, 3600);
  tick(g, elapsed, false); g.savedAt = now;
  if (elapsed >= 5) chronicle(g, `O intendente cuidou da cidade por ${Math.floor(elapsed)}s (limite: 1 hora).`);
  return elapsed;
}
