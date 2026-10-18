import { createGame, tick, build, reform, choose, advance, BUILDINGS, REFORMS, requirements, capacity, rates } from '../src/game.js';
import { adopt, rite } from '../src/faith.js';
import { respond } from '../src/calamity.js';

// Bot de balanceamento: usa as mesmas ações do jogador, sem conceder recursos.
const g = createGame();
const limit = Number(process.argv[2]) || 7200;
const milestones = [];
for (let second = 0; second < limit && g.stage < 4; second++) {
  tick(g, 1);
  if (g.event !== null) {
    const choices = g.event === 0 ? [0, 2, 1] : g.event === 1 ? [2, 0, 1] : g.event === 2 ? [2, 0, 1] : [0, 1, 2];
    for (const index of choices) if (!choose(g, index)) break;
  }
  if (g.calamity.id) respond(g);
  if (!g.faith.creed) adopt(g, 'harvest');
  else rite(g, g.calamity.id === 'fever' || g.calamity.id === 'blight' ? 'procession' : 'blessing');
  if (g.buildings.quarry < 1) build(g, 'quarry');
  else if (rates(g).food < .7 || g.resources.food < 70) build(g, 'farm');
  else if (g.population > capacity(g) - 3 && capacity(g) < 110) build(g, 'house');
  else if (g.buildings.lumber < 3) build(g, 'lumber');
  else if (g.buildings.quarry < 3) build(g, 'quarry');
  else if (g.stage >= 1 && g.buildings.market < 2) build(g, 'market');
  else if (g.stage >= 1 && g.buildings.chapel < 2) build(g, 'chapel');
  else if (g.stage >= 2 && g.buildings.hall < 1) build(g, 'hall');
  else if (g.stage >= 3 && g.buildings.castle < 1) build(g, 'castle');
  for (const r of REFORMS) if (!g.reforms.includes(r.id) && g.stage >= r.stage) reform(g, r.id);
  if (g.stage < 4 && requirements(g).every(r => r.ok)) {
    advance(g); const result = `${Math.floor(g.time)}s: título ${g.stage}, ${Math.floor(g.population)} habitantes`;
    milestones.push(result); console.log(result);
  }
}
console.log(`Resultado: título ${g.stage}/4 em ${Math.floor(g.time)}s. Feitos ${g.feats.length}, calamidades ${g.calamity.resolved}/${g.calamity.resolved + g.calamity.failed}, ritos ${g.faith.rites}. Alimento ${Math.floor(g.resources.food)}, legitimidade ${Math.floor(g.legitimacy)}.`);
if (g.stage !== 4) { console.log('Pendências:', requirements(g)); process.exitCode = 1; }
