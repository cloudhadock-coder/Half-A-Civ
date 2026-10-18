// Feitos: metas permanentes da campanha. Cada um rende +1% de toda a produção.
import { chronicle, REFORMS, BUILDINGS } from './game.js';

export const FEAT_BONUS = .01;
export const FEATS = [
  { id: 'roof', name: 'Teto e mesa', text: 'Construa a primeira casa', test: g => g.buildings.house >= 1 },
  { id: 'pop50', name: 'Aldeia viva', text: 'Alcance 50 habitantes', test: g => g.population >= 50 },
  { id: 'pop100', name: 'Ruas cheias', text: 'Alcance 100 habitantes', test: g => g.population >= 100 },
  { id: 'granary', name: 'Celeiro farto', text: 'Guarde 1.000 de alimento', test: g => g.resources.food >= 1000 },
  { id: 'treasury', name: 'Cofre pesado', text: 'Guarde 1.000 de ouro', test: g => g.resources.gold >= 1000 },
  { id: 'town', name: 'Carta de vila', text: 'Conquiste o título de Vila', test: g => g.stage >= 1 },
  { id: 'city', name: 'Ar da liberdade', text: 'Conquiste o título de Cidade livre', test: g => g.stage >= 2 },
  { id: 'principality', name: 'Mão do príncipe', text: 'Conquiste o título de Principado', test: g => g.stage >= 3 },
  { id: 'kingdom', name: 'A coroa', text: 'Funde o reino', test: g => g.stage >= 4 },
  { id: 'law', name: 'Primeira lei', text: 'Promulgue uma reforma', test: g => g.reforms.length >= 1 },
  { id: 'code', name: 'Código completo', text: 'Promulgue todas as reformas', test: g => g.reforms.length >= REFORMS.length },
  { id: 'wonders', name: 'Maravilhas do vale', text: 'Erga os quatro monumentos', test: g => BUILDINGS.filter(b => b.special).every(b => g.buildings[b.id]) },
  { id: 'creed', name: 'Fé declarada', text: 'Adote um credo oficial', test: g => g.faith.creed !== null },
  { id: 'devout', name: 'Calendário sagrado', text: 'Celebre cinco ritos', test: g => g.faith.rites >= 5 },
  { id: 'rescue', name: 'Mão firme', text: 'Responda a uma calamidade', test: g => g.calamity.resolved >= 1 },
  { id: 'guardian', name: 'Guardião do vale', text: 'Responda a cinco calamidades', test: g => g.calamity.resolved >= 5 },
  { id: 'court', name: 'Corte reunida', text: 'Tenha quatro membros no séquito', test: g => g.retinue.length >= 4 },
  { id: 'legend', name: 'Lenda à mesa', text: 'Contrate uma lenda do vale', test: g => g.retinue.some(p => p.legend) },
  { id: 'beloved', name: 'Amado por todos', text: 'Quatro facções com apoio 70+', test: g => g.factions.every(v => v >= 70) },
];
export const featBonus = g => g.feats.length * FEAT_BONUS;
export function checkFeats(g) {
  const earned = FEATS.filter(f => !g.feats.includes(f.id) && f.test(g));
  for (const f of earned) { g.feats.push(f.id); chronicle(g, `FEITO: ${f.name}. Toda a produção +1%.`); }
  return earned;
}
