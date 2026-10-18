export const PAGE_NAMES = ['DOMÍNIO', 'OBRAS', 'CONSELHO', 'DECRETOS', 'FÉ', 'CRÔNICAS', 'RECRUTAS', 'PERSONAGEM', 'AJUSTES'];
export const PAGES = { domain: 0, works: 1, council: 2, decrees: 3, faith: 4, chronicles: 5, retinue: 6, ruler: 7, settings: 8 };
export const ATTRIBUTES = { stewardship: 'Gestão', diplomacy: 'Diplomacia', learning: 'Erudição', martial: 'Comando' };
export const ROLES = [
  { id: 'steward', title: 'Intendente', cost: 65, text: '+15% alimento; +8% receita', bonus: { food: .15, gold: .08 } },
  { id: 'ranger', title: 'Guardião das matas', cost: 55, text: '+20% madeira; +10% pedra', bonus: { wood: .2, stone: .1 } },
  { id: 'architect', title: 'Mestre de obras', cost: 85, text: '-12% custo de todas as construções', bonus: { discount: .12 } },
  { id: 'envoy', title: 'Embaixador', cost: 80, text: '+25% influência; +0,006 legitimidade/s se alimentados', bonus: { influence: .25, legitimacy: .006 } },
  { id: 'marshal', title: 'Marechal', cost: 75, text: '+0,025 apoio popular/s se alimentados; +10% pedra', bonus: { approval: .025, stone: .1 } },
  { id: 'scholar', title: 'Cronista', cost: 70, text: '+15% influência; +10% madeira e alimento', bonus: { influence: .15, wood: .1, food: .1 } },
];
export const HOUSES = [
  { name: 'Aurivale', sigil: 'SOL', motto: 'Da terra, a aurora.', color: 'gold', art: ['     .  |  .', '      \\ | /', '   .---\\|/---.', '   | -- O -- |', '   |   /|\\   |', '    \\ . | . /', '     \\_____/'] },
  { name: 'Corvobravo', sigil: 'CORVO', motto: 'Vigiar antes de reinar.', color: 'blue', art: ['      /\\ /\\', '   .--(o o)--.', '   | / /V\\ \\ |', '   |/ / | \\ \\|', '   |  / | \\  |', '    \\  | |  /', '     \\_____/'] },
  { name: 'Carvalhal', sigil: 'CARVALHO', motto: 'Raízes antes da coroa.', color: 'green', art: ['     .  *  .', '      (***)', '   .-(*****)-.', '   |(*******)|', '   |   |||   |', '    \\ _|||_ /', '     \\_____/'] },
];
const FIRST = ['Alda', 'Bento', 'Cedric', 'Dália', 'Edmundo', 'Flora', 'Gaspar', 'Helena', 'Ivo', 'Joana', 'Leofric', 'Mara', 'Nuno', 'Olívia', 'Rui', 'Teodora'];
const LAST = ['do Salgueiro', 'Pedrabranca', 'de Valverde', 'Ferrolume', 'das Fontes', 'Montenegro', 'de Ventobravo', 'dos Cedros', 'Pontes', 'do Poente'];
function random(g, max) {
  let x = g.courtSeed | 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  g.courtSeed = x >>> 0 || 1; return g.courtSeed % max;
}
// Lendas do vale: easter eggs raros entre os candidatos, sempre com especialização III.
export const LEGENDS = [
  { id: 'leonardo', name: 'Leonardo', role: 'steward', quote: 'Desenhou o vale antes da primeira fogueira.' },
  { id: 'gean', name: 'Gean', role: 'ranger', quote: 'Conhece cada trilha da mata pelo nome.' },
  { id: 'vitor', name: 'Vitor', role: 'marshal', quote: 'Mantém a guarda em ordem sem levantar a voz.' },
  { id: 'grilo', name: 'Denisson, o Grilo', role: 'scholar', quote: 'Cri, cri. Anota tudo, inclusive o silêncio.' },
  { id: 'mineiro', name: 'Denisson, o Mineiro', role: 'ranger', quote: 'Acha pedra boa e pão de queijo em qualquer encosta.' },
  { id: 'ruah', name: 'Ruah', role: 'envoy', quote: 'Chega antes do vento e convence a tempestade.' },
  { id: 'natha', name: 'Nathã', role: 'architect', quote: 'Trouxe de outra terra o segredo das redes.' },
  { id: 'will', name: 'Will', role: 'envoy', quote: 'O nome muda a cada estação. A pessoa, nunca.' },
  { id: 'moser', name: 'Moser', role: 'marshal', quote: 'Onde Moser monta guarda, ninguém pula o muro.' },
  { id: 'gabriel', name: 'Gabriel', role: 'scholar', quote: 'Lê pergaminhos de trás para frente, por garantia.' },
  { id: 'chico', name: 'Chico, o Tech Lead', role: 'architect', quote: 'Revisa cada viga antes de aprovar a obra.' },
  { id: 'faustino', name: 'Faustino, Tech Lead Auxiliar', role: 'architect', quote: 'Quando Chico viaja, as obras não param.' },
  { id: 'andressa', name: 'Andressa', role: 'steward', quote: 'O celeiro nunca esvaziou sob sua guarda.' },
  { id: 'geovane', name: 'Geovane', role: 'ranger', quote: 'Planta duas árvores para cada uma derrubada.' },
  { id: 'gustavoc', name: 'Gustavo C.', role: 'marshal', quote: 'Não confundir com Gustavo R. Acontece sempre.' },
  { id: 'gustavor', name: 'Gustavo R.', role: 'scholar', quote: 'Não confundir com Gustavo C. Acontece sempre.' },
  { id: 'henrique', name: 'Henrique', role: 'steward', quote: 'Fecha as contas do mês antes do galo cantar.' },
  { id: 'mikhael', name: 'Mikhael', role: 'envoy', quote: 'Fala a língua de todas as fronteiras.' },
  { id: 'bonnie', name: 'Rodrigo {Bonnie}', role: 'scholar', quote: 'Responde por Rodrigo. Atende por {Bonnie}.' },
  { id: 'milani', name: 'Milani', role: 'steward', quote: 'Cada moeda do tesouro tem nome e destino.' },
  { id: 'guilherme', name: 'Guilherme', role: 'architect', quote: 'Ergue andaimes que parecem flutuar.' },
  { id: 'alberto', name: 'Alberto', role: 'marshal', quote: 'Veterano de mil plantões no portão norte.' },
];
export const LEGEND_CHANCE = 10;
export const legendOf = person => LEGENDS.find(l => l.id === person.legend) || null;
// A cada carregamento do save, Will acorda com outra primeira letra. Continua sendo o mesmo Will.
export function renameWill(g, random = Math.random) {
  const letters = 'WBDGJMNPRTVZ';
  for (const p of [...g.retinue, ...g.candidates]) {
    if (p.legend !== 'will') continue;
    const options = [...letters].filter(l => l !== p.name[0]);
    p.name = options[Math.floor(random() * options.length)] + 'ill';
  }
  return g;
}
export function roleOf(person) { return ROLES.find(r => r.id === person.role); }
export function makeCandidates(g) {
  const result = [], start = random(g, ROLES.length);
  const names = new Set((g.retinue || []).map(p => p.name));
  const legends = new Set((g.retinue || []).map(p => p.legend).filter(Boolean));
  for (let i = 0; i < 3; i++) {
    const role = ROLES[(start + i) % ROLES.length];
    const options = LEGENDS.filter(l => l.role === role.id && !legends.has(l.id));
    if (options.length && random(g, 100) < LEGEND_CHANCE) {
      const legend = options[random(g, options.length)];
      legends.add(legend.id); names.add(legend.name);
      result.push({ id: g.nextPersonId++, name: legend.name, role: role.id, quality: 3, cost: role.cost * 2, legend: legend.id });
      continue;
    }
    const quality = 1 + random(g, 3);
    let name;
    for (let attempt = 0; attempt < 20; attempt++) {
      name = `${FIRST[random(g, FIRST.length)]} ${LAST[random(g, LAST.length)]}`;
      if (!names.has(name)) break;
    }
    if (names.has(name)) name += ` ${g.nextPersonId}`;
    names.add(name);
    result.push({ id: g.nextPersonId++, name, role: role.id, quality, cost: Math.ceil(role.cost * (1 + (quality - 1) * .25)) });
  }
  return result;
}
export function addCourt(g, seed = g.savedAt) {
  g.courtSeed = (Number(seed) >>> 0) || 1; g.nextPersonId = 1;
  const house = random(g, HOUSES.length);
  g.ruler = { name: FIRST[random(g, FIRST.length)], house, politics: 0, decisions: 0, attributes: { stewardship: 5, diplomacy: 5, learning: 5, martial: 5 } };
  g.retinue = []; g.candidates = makeCandidates(g); return g;
}
// Multiplicador do efeito base: especialização I/II/III e +25% para as lendas.
export const potency = p => 1 + (p.quality - 1) * .25 + (p.legend ? .25 : 0);
export function courtCapacity(g) { return Math.min(6, 2 + g.stage); }
export function courtBonuses(g) {
  const out = { food: 0, wood: 0, stone: 0, gold: 0, influence: 0, discount: 0, approval: 0, legitimacy: 0 };
  for (const p of g.retinue) for (const [k, v] of Object.entries(roleOf(p).bonus)) out[k] += v * potency(p);
  const a = g.ruler.attributes;
  out.gold += (a.stewardship - 5) * .02;
  out.influence += (a.diplomacy + a.learning - 10) * .015;
  out.approval += (a.martial - 5) * .001;
  return out;
}
export function approval(g) { return g.factions.reduce((a, b) => a + b, 0) / g.factions.length; }
export function alignment(g) {
  const value = g.ruler.politics + (g.tax - 1) * 12;
  return value < -20 ? 'Comunalista' : value > 20 ? 'Monarquista' : 'Conciliador';
}
export function politicalChoice(g, changes = [0, 0, 0, 0], attribute = 'diplomacy') {
  g.ruler.politics = Math.max(-100, Math.min(100, g.ruler.politics + (changes[3] - changes[0]) * .6));
  g.ruler.decisions++;
  if (g.ruler.decisions % 4 === 0) g.ruler.attributes[attribute] = Math.min(20, g.ruler.attributes[attribute] + 1);
}
export function recruit(g, id) {
  const p = g.candidates.find(x => x.id === id);
  if (!p) return 'Candidato indisponível.';
  if (g.retinue.length >= courtCapacity(g)) return 'Séquito cheio. Dispense alguém ou conquiste um novo título.';
  if (g.retinue.some(x => x.role === p.role)) return 'Esse cargo já está ocupado no séquito.';
  if (g.resources.gold < p.cost) return 'Ouro insuficiente para o contrato.';
  g.resources.gold -= p.cost; g.retinue.push(p); g.candidates = g.candidates.filter(x => x.id !== id); return null;
}
export function dismiss(g, id) {
  const index = g.retinue.findIndex(p => p.id === id);
  if (index < 0) return 'Selecione um membro contratado para dispensar.';
  g.retinue.splice(index, 1); return null;
}
export function refreshCandidates(g) {
  if (g.resources.gold < 20) return 'São necessários 20 ouro para chamar novos candidatos.';
  g.resources.gold -= 20; g.candidates = makeCandidates(g); return null;
}
export function recruitmentList(g) {
  return [...g.candidates.map(p => ({ person: p, hired: false })), ...g.retinue.map(p => ({ person: p, hired: true }))];
}
