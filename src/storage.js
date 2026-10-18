import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGame, addReligion, EVENTS } from './game.js';
import { CREEDS } from './faith.js';
import { CALAMITIES } from './calamity.js';
import { FEATS } from './feats.js';
import { addCourt, ROLES, ATTRIBUTES, HOUSES, LEGENDS, courtCapacity, renameWill } from './court.js';
import { GLYPH_MODES } from './glyphs.js';
export const SAVE = path.resolve(process.env.HALFACIV_SAVE || fileURLToPath(new URL('../saves/realm.json', import.meta.url)));
// Preferências da máquina, separadas da campanha: trocar de domínio não as apaga.
export const SETTINGS = path.resolve(process.env.HALFACIV_SETTINGS || path.join(path.dirname(SAVE), 'settings.json'));
const DEFAULT_SETTINGS = { glyphs: 'ascii' };
export function loadSettings(file = SETTINGS) {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return { ...DEFAULT_SETTINGS, ...(GLYPH_MODES.includes(data?.glyphs) ? { glyphs: data.glyphs } : {}) };
  } catch { return { ...DEFAULT_SETTINGS }; }
}
export function saveSettings(settings, file = SETTINGS) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + '.tmp', JSON.stringify(settings, null, 2));
  fs.renameSync(file + '.tmp', file);
}
export function hasSave(file = SAVE) { return fs.existsSync(file); }
export function backup(file = SAVE) {
  if (!hasSave(file)) return null;
  const target = file + '.' + Date.now() + '.bak';
  fs.copyFileSync(file, target, fs.constants.COPYFILE_EXCL);
  return target;
}
export function validate(g) {
  const base = createGame();
  if (!g || g.version !== 3) throw new Error('Versão de save inválida.');
  for (const k of ['time', 'population', 'legitimacy', 'savedAt', 'nextEvent', 'eventCount']) if (!Number.isFinite(g[k]) || g[k] < 0) throw new Error(`Save inválido: ${k}`);
  if (!Number.isInteger(g.stage) || g.stage < 0 || g.stage > 4 || ![0, 1, 2].includes(g.tax)) throw new Error('Governo inválido.');
  for (const group of ['resources', 'buildings']) for (const k of Object.keys(base[group])) if (!Number.isFinite(g[group]?.[k]) || g[group][k] < 0 || (group === 'buildings' && !Number.isInteger(g[group][k]))) throw new Error(`Save inválido: ${k}`);
  if (!Array.isArray(g.factions) || g.factions.length !== 4 || g.factions.some(v => !Number.isFinite(v) || v < 0 || v > 100)) throw new Error('Facções inválidas.');
  if (!Array.isArray(g.reforms) || !g.reforms.every(v => typeof v === 'string') || !Array.isArray(g.log) || !g.log.every(v => typeof v === 'string')) throw new Error('Crônicas inválidas.');
  if (g.event !== null && (!Number.isInteger(g.event) || !EVENTS[g.event])) throw new Error('Petição inválida.');
  if (g.eventSeed !== undefined && (!Number.isInteger(g.eventSeed) || g.eventSeed < 0 || g.eventSeed > 0xffffffff)) throw new Error('Sorteio inválido.');
  if (g.lastEvent !== undefined && (!Number.isInteger(g.lastEvent) || !EVENTS[g.lastEvent])) throw new Error('Última petição inválida.');
  if (!g.ruler || typeof g.ruler.name !== 'string' || !g.ruler.name.length || !Number.isInteger(g.ruler.house) || !HOUSES[g.ruler.house]
      || !Number.isFinite(g.ruler.politics) || Math.abs(g.ruler.politics) > 100 || !Number.isInteger(g.ruler.decisions) || g.ruler.decisions < 0) throw new Error('Governante inválido.');
  for (const key of Object.keys(ATTRIBUTES)) if (!Number.isInteger(g.ruler.attributes?.[key]) || g.ruler.attributes[key] < 1 || g.ruler.attributes[key] > 20) throw new Error('Atributos inválidos.');
  if (!Number.isInteger(g.courtSeed) || g.courtSeed < 1 || g.courtSeed > 0xffffffff || !Number.isSafeInteger(g.nextPersonId) || g.nextPersonId < 1
      || !Array.isArray(g.retinue) || !Array.isArray(g.candidates) || g.retinue.length > courtCapacity(g) || g.candidates.length > 3) throw new Error('Séquito inválido.');
  const people = [...g.retinue, ...g.candidates];
  for (const p of people) if (!p || !Number.isSafeInteger(p.id) || p.id < 1 || p.id >= g.nextPersonId || typeof p.name !== 'string' || !p.name.length
      || !ROLES.some(r => r.id === p.role) || ![1, 2, 3].includes(p.quality) || !Number.isSafeInteger(p.cost) || p.cost < 1) throw new Error('Recruta inválido.');
  if (new Set(people.map(p => p.id)).size !== people.length || new Set(g.retinue.map(p => p.role)).size !== g.retinue.length) throw new Error('Cargos ou identificadores duplicados.');
  const legends = people.map(p => p.legend).filter(id => id !== undefined);
  if (!legends.every(id => LEGENDS.some(l => l.id === id)) || new Set(legends).size !== legends.length) throw new Error('Lenda inválida ou duplicada.');
  for (const id of ['windmill', 'forge', 'observatory', 'garden']) if (g.buildings[id] > 1) throw new Error('Monumento duplicado.');
  const f = g.faith, c = g.calamity;
  if (!f || (f.creed !== null && !CREEDS.some(x => x.id === f.creed)) || !Number.isFinite(f.devotion) || f.devotion < 0
      || !Number.isFinite(f.blessingUntil) || !(f.changedAt === null || Number.isFinite(f.changedAt)) || !Number.isInteger(f.rites) || f.rites < 0) throw new Error('Fé inválida.');
  if (!c || !(c.id === null || CALAMITIES.some(x => x.id === c.id)) || !Number.isFinite(c.since) || !Number.isFinite(c.next)
      || !Number.isInteger(c.seed) || c.seed < 1 || c.seed > 0xffffffff || !Number.isInteger(c.resolved) || !Number.isInteger(c.failed)) throw new Error('Calamidade inválida.');
  if (!Array.isArray(g.feats) || !g.feats.every(id => FEATS.some(x => x.id === id)) || new Set(g.feats).size !== g.feats.length) throw new Error('Feitos inválidos.');
  return g;
}
export function migrate(g) {
  if (g?.version === 1) {
    for (const id of ['windmill', 'forge', 'observatory', 'garden']) g.buildings[id] = 0;
    addCourt(g); g.version = 2;
  }
  if (g?.version === 2) { addReligion(g); g.version = 3; }
  return g;
}
export function load(file = SAVE) {
  try { return renameWill(validate(migrate(JSON.parse(fs.readFileSync(file, 'utf8'))))); }
  catch (e) { if (e.code === 'ENOENT') return createGame(); throw new Error(`Não foi possível carregar ${file}: ${e.message}. O arquivo foi preservado.`); }
}
export function save(g, file = SAVE) {
  g.savedAt = Date.now(); validate(g);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + '.tmp', JSON.stringify(g, null, 2));
  fs.renameSync(file + '.tmp', file);
}
