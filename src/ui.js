import { BUILDINGS, REFORMS, EVENTS, STAGES, RESOURCES, FACTIONS, rates, capacity, workforce, costOf, canPay, requirements } from './game.js';
import { cityArt, specialArt } from './art.js';
import { provisionAnimation } from './interaction.js';
import { glyph, meter, rule, glyphMode } from './glyphs.js';
import { topdownMap, MAP_LOTS } from './map.js';
import { PAGE_NAMES, PAGES, HOUSES, ATTRIBUTES, approval, alignment, courtBonuses, courtCapacity, roleOf, recruitmentList, legendOf } from './court.js';
import { CREEDS, RITES, creedOf, devotionRate, devotionCap, adoptionCost, conversionWait } from './faith.js';
import { activeCalamity, calamityLeft, responseCost } from './calamity.js';
import { FEATS, featBonus } from './feats.js';
const palette = { gold:  '38;5;179', green: '38;5;108', red: '38;5;203', dim: '38;5;245', ink: '38;5;252', blue: '38;5;117', purple: '38;5;177' };
const clean = text => String(text).replace(/\x1b\[[0-9;]*m/g, '');
const color = (text, tone) => process.env.NO_COLOR ? String(text) : `\x1b[${palette[tone]}m${text}\x1b[0m`;
const fmt = n => Math.abs(n) >= 10000 ? `${(n / 1000).toFixed(1)}k` : Math.floor(n).toLocaleString('pt-BR');
const perSecond = n => `${n >= 0 ? '+' : ''}${n.toFixed(2).replace('.', ',')}/s`;
const bar = (n, max = 100, width = 16) => { const filled = Math.max(0, Math.min(width, Math.round(n / max * width))); return meter(filled, width - filled); };
export const costText = cost => Object.entries(cost).map(([k, v]) => `${fmt(v)} ${RESOURCES[k].toLowerCase()}`).join(' / ');
export function render(g, view, cols = 100, rows = 32) {
  cols = Math.max(20, cols); rows = Math.max(8, rows);
  if (cols < 80 || rows < 24) return [color('HalfACiv', 'gold'), 'Amplie o terminal para pelo menos 80 x 24.', `Atual: ${cols} x ${rows}.`, 'Q salva e sai. A cidade continua simulando.'].join('\n');
  const width = Math.min(cols - 4, 116), body = [], page = view.page || 0;
  const line = (s = '') => body.push(s);
  const heading = s => line(color(s, 'gold'));
  const tabs = PAGE_NAMES;
  const house = HOUSES[g.ruler.house], rulerTitle = ['Líder', 'Alcaide', 'Protetor', 'Príncipe', 'Monarca'][g.stage];
  const r = rates(g), season = ['Primavera', 'Verão', 'Outono', 'Inverno'][Math.floor(g.time / 120) % 4];
  const header = [
    color(' H A L F A C I V ', 'gold') + color(` / ${g.name} / ${STAGES[g.stage]}`, 'ink'),
    color(` Dia ${Math.floor(g.time / 10) + 1}  |  ${season}  |  Habitantes ${fmt(g.population)}/${capacity(g)}  |  Legitimidade ${fmt(g.legitimacy)}%`, 'dim'),
    ' ' + Object.entries(RESOURCES).map(([k, name]) => `${name} ${fmt(g.resources[k])}`).join('  ') + color(`  Devoção ${fmt(g.faith.devotion)}`, 'purple'),
    ' ' + Object.entries(r).map(([k, v]) => color(`${({ food: 'Ali', wood: 'Mad', stone: 'Ped', gold: 'Our', influence: 'Inf' })[k]} ${perSecond(v)}`, v < 0 ? 'red' : 'green')).join(' | '),
    color(` ${rulerTitle} ${g.ruler.name} / Casa ${house.name} / ${alignment(g)}`, house.color),
    color(` Aprovação ${fmt(approval(g))}%  |  Séquito ${g.retinue.length}/${courtCapacity(g)}  |  Tributos ${['brandos', 'moderados', 'severos'][g.tax]}  |  Fé: ${creedOf(g)?.short || 'antiga'}`, 'dim'),
  ];
  const calamity = activeCalamity(g);
  if (g.event !== null) header.push(color(` ! EVENTO: ${EVENTS[g.event].title} | [E] abrir Conselho`, 'gold'));
  if (calamity) header.push(color(` ! ${calamity.name.toUpperCase()} (${calamityLeft(g)}s)  [X] ${calamity.response}: ${costText(responseCost(g))}`, 'red'));
  header.push(color(' ' + rule(width), 'dim'),
    ' ' + tabs.map((t, i) => color(page === i ? `[${t}]` : t, page === i ? 'gold' : 'dim')).join(cols < 100 ? ' ' : '   '));
  if (page === PAGES.domain) {
    if (view.cityView === 'topdown') {
      heading('  PLANTA DA CIDADE / [V] voltar ao panorama');
      topdownMap(g).forEach(row => line('  ' + row.map(s => color(s.text, s.color)).join('')));
      line('  Lotes por tipo. Número = quantidade; ++ = 100 ou mais.');
      for (let i = 0; i < MAP_LOTS.length; i += 4) line('  ' + MAP_LOTS.slice(i, i + 4).map(([, code, name, tone]) => color(`${code} ${name}`, tone || 'green')).join(' / '));
    } else {
      const monuments = specialArt(g);
      monuments.forEach(row => line('  ' + row.map(s => color(s.text, s.color)).join('')));
      cityArt(g.stage, Math.floor(g.time)).slice(monuments.length ? 2 : 0).forEach(s => line(color(s, 'green')));
      line(color('  [V] ver a cidade de cima', 'dim'));
    }
    heading(`  ${STAGES[g.stage].toUpperCase()} / ${g.stage === 4 ? 'A coroa é sua. A cidade ainda precisa de você.' : 'Toda coroa começa com um teto e uma mesa.'}`);
    line('');
    line('  BALANÇO / PRODUÇÃO LÍQUIDA por segundo (após consumo)');
    for (const [k, v] of Object.entries(r)) line('  ' + color(`${RESOURCES[k].padEnd(12)} ${perSecond(v)}`, v < 0 ? 'red' : 'green'));
    line(`  Trabalho: ${fmt(g.population)} habitantes / ${workforce(g).needed} postos. Eficiência ${(workforce(g).ratio * 100).toFixed(0)}%.`);
    line('');
    const req = requirements(g);
    heading(g.stage === 4 ? '  O REINO FOI FUNDADO' : `  PRÓXIMO TÍTULO / ${STAGES[g.stage + 1]}`);
    for (let i = 0; i < req.length; i += 2) line('  ' + req.slice(i, i + 2).map(x => color(`${x.ok ? '[x]' : '[ ]'} ${x.label}`, x.ok ? 'green' : 'dim')).join('    '));
  } else if (page === PAGES.works) {
    heading('  CANTEIRO DE OBRAS / invista no que mantém o vale vivo');
    line('  Setas escolhem a obra. Enter constrói. Preços aumentam a cada unidade.'); line('');
    BUILDINGS.forEach((b, i) => {
      const locked = g.stage < b.stage, selected = view.selected === i;
      const built = b.special && g.buildings[b.id];
      line(color(`  ${selected ? '>' : ' '} ${b.special ? '*' : ' '} ${b.name.padEnd(26)} x${String(g.buildings[b.id]).padEnd(3)} ${built ? 'MONUMENTO ATIVO' : locked ? `Requer: ${STAGES[b.stage]}` : costText(costOf(g, b))}`, b.special ? b.color : selected ? 'gold' : locked ? 'dim' : 'ink'));
      line(color(`      ${b.text}`, b.special && !locked ? b.color : 'dim'));
    });
  } else if (page === PAGES.council) {
    heading('  A MESA DO CONSELHO / quatro vozes, uma cidade');
    if (g.event === null) {
      heading('  Nenhum evento na mesa.');
      line(`  Próxima audiência em ${Math.ceil(Math.max(0, g.nextEvent - g.time))}s.`);
      line('  Decisões pendentes aguardam sua volta, inclusive durante o progresso offline.');
    } else {
      const event = EVENTS[g.event]; heading(`  ${event.title.toUpperCase()}`); line(`  ${event.body}`); line('');
      event.options.forEach((o, i) => {
        line(color(`  [${['A', 'B', 'C'][i]}] ${o.name}${o.cost ? ' / ' + costText(o.cost) : ' / sem custo'}`, canPay(g, o.cost) ? 'gold' : 'red'));
        const changes = (o.support || []).flatMap((v, j) => v ? [`${FACTIONS[j]} ${v > 0 ? '+' : ''}${v}`] : []);
        if (o.legitimacy) changes.push(`Legitimidade +${o.legitimacy}`);
        if (o.gain) changes.push('Recebe ' + costText(o.gain));
        line(color('      ' + changes.join(' / '), 'dim'));
      });
    }
    line('');
    FACTIONS.forEach((f, i) => line(`  ${f.padEnd(12)} ${color(bar(g.factions[i]), g.factions[i] >= 45 ? 'green' : 'red')} ${fmt(g.factions[i])}%`));
  } else if (page === PAGES.decrees) {
    heading('  SELO E PERGAMINHO / instituições que atravessam gerações');
    line(`  [T] Tributos: ${['brandos (apoio popular)', 'moderados (equilíbrio)', 'severos (mais ouro, menos apoio)'][g.tax]}`);
    line('  Reformas exigem apoio de 3 facções com pelo menos 45 pontos.'); line('');
    REFORMS.forEach((f, i) => {
      const done = g.reforms.includes(f.id), locked = g.stage < f.stage;
      line(color(`  ${view.selected === i ? '>' : ' '} ${done ? '[x]' : '[ ]'} ${f.name}${locked ? ` / ${STAGES[f.stage]}` : ''}`, view.selected === i ? 'gold' : 'ink'));
      line(color('      ' + (done ? 'Em vigor' : costText(f.cost)), done ? 'green' : 'dim'));
      line(color('      ' + f.text, 'dim'));
    });
  } else if (page === PAGES.faith) {
    const creed = creedOf(g), wait = conversionWait(g);
    heading('  FÉ E DEVOÇÃO / o que o povo acende quando a noite cai');
    line(`  Devoção ${fmt(g.faith.devotion)}/${devotionCap(g)}  (+${devotionRate(g).toFixed(2)}/s; cada capela +0,22/s e +60 de limite)`);
    line(`  Credo oficial: ${creed ? creed.name : 'nenhum / crenças antigas'}${g.time < g.faith.blessingUntil ? `  |  Bênção dos campos: ${Math.ceil(g.faith.blessingUntil - g.time)}s` : ''}`);
    line(color(g.stage < 1 ? '  A fé oficial exige o título de Vila e uma capela.' : !g.buildings.chapel ? '  Erga uma Capela dos sinos para declarar a fé oficial.'
      : wait ? `  Nova conversão possível em ${wait}s.` : `  Enter adota o credo selecionado por ${adoptionCost(g)} de influência.`, 'dim'));
    if (creed) line(color('  Converter: a antiga fé perde 15 de apoio, a devoção zera e -6 legitimidade.', 'dim'));
    line(''); heading('  CREDOS');
    CREEDS.forEach((c, i) => {
      const selected = view.selected === i, official = creed?.id === c.id;
      line(color(`  ${selected ? '>' : ' '} ${official ? '[x]' : '[ ]'} ${c.name} / ${FACTIONS[c.faction]}`, selected ? 'gold' : official ? 'green' : 'ink'));
      line(color(`      ${c.text}`, 'dim'));
      if (selected) line(color(`      ${c.lore}`, 'purple'));
    });
    line(''); heading('  RITOS / exigem fé oficial');
    RITES.forEach((x, i) => {
      const selected = view.selected === CREEDS.length + i, { devotion, ...rest } = x.cost;
      line(color(`  ${selected ? '>' : ' '} ${x.name} / ${devotion} devoção${Object.keys(rest).length ? ' / ' + costText(rest) : ''}`, selected ? 'gold' : creed && g.faith.devotion >= devotion ? 'ink' : 'dim'));
      line(color(`      ${x.text}`, 'dim'));
    });
  } else if (page === PAGES.retinue) {
    heading(`  SALÃO DOS CONTRATOS / Séquito ${g.retinue.length}/${courtCapacity(g)}`);
    line('  Setas + Enter contratar | R novos candidatos (20 ouro) | D dispensar');
    line('  Contrato único, sem salário. Um membro por cargo. Sem reembolso.');
    line('  Especialização I/II/III: efeito base x1 / x1,25 / x1,5. Lendas: x1,75.'); line('');
    const people = recruitmentList(g);
    if (!people.length) line('  Nenhum candidato. Use R para convocar uma nova audiência.');
    people.forEach(({ person: p, hired }, i) => {
      const role = roleOf(p), legend = legendOf(p), selected = view.selected === i;
      line(color(`  ${selected ? '>' : ' '} ${p.name} / ${role.title} ${['I', 'II', 'III'][p.quality - 1]}${legend ? '  * LENDA *' : ''}`, selected ? 'gold' : legend ? 'purple' : hired ? 'green' : 'ink'));
      line(color(`      ${hired ? 'NO SÉQUITO / D para dispensar' : `${p.cost} ouro / Enter para contratar`}`, hired ? 'green' : 'dim'));
      line(color(`      Base: ${role.text}`, 'dim'));
      if (legend) line(color(`      "${legend.quote}"`, 'purple'));
    });
  } else if (page === PAGES.ruler) {
    heading(`  ${rulerTitle.toUpperCase()} ${g.ruler.name.toUpperCase()} / CASA ${house.name.toUpperCase()}`);
    const details = [`Símbolo: ${house.sigil}`, `Lema: ${house.motto}`, `Alinhamento: ${alignment(g)}`, `Aprovação: ${fmt(approval(g))}%`, `Legitimidade: ${fmt(g.legitimacy)}%`, `Decisões tomadas: ${g.ruler.decisions}`, `Título territorial: ${STAGES[g.stage]}`];
    glyph(house.art).forEach((s, i) => line('  ' + color(s.padEnd(20), house.color) + (details[i] || '')));
    line(''); heading('  ATRIBUTOS / evoluem a cada quatro decisões ou reformas');
    for (const [key, title] of Object.entries(ATTRIBUTES)) line(`  ${title.padEnd(12)} ${bar(g.ruler.attributes[key], 20, 12)} ${g.ruler.attributes[key]}/20`);
    line('  Gestão: receita; diplomacia e erudição: influência; comando: apoio.');
    line(''); heading('  EFEITOS ATIVOS / governante + séquito');
    const bonuses = courtBonuses(g);
    for (const key of Object.keys(RESOURCES)) line(`  ${RESOURCES[key].padEnd(12)} +${(bonuses[key] * 100).toFixed(1)}%`);
    line(`  Desconto de obras ${(bonuses.discount * 100).toFixed(1)}%`);
    line(`  Apoio popular +${bonuses.approval.toFixed(3)}/s | Legitimidade +${bonuses.legitimacy.toFixed(3)}/s (com alimento)`);
    line(''); heading('  OBRAS ESPECIAIS DO DOMÍNIO');
    for (const b of BUILDINGS.filter(b => b.special)) line(color(`  ${g.buildings[b.id] ? '[x]' : '[ ]'} ${b.name}: ${b.text}`, b.color));
    line(''); heading('  APOIO DAS FACÇÕES');
    FACTIONS.forEach((f, i) => line(`  ${f.padEnd(12)} ${bar(g.factions[i])} ${fmt(g.factions[i])}%`));
    line('  Escolhas pró-comuns aproximam o governante do comunalismo.');
    line('  Privilégios nobres favorecem a monarquia; tributos também pesam.');
  } else if (page === PAGES.settings) {
    const current = glyphMode();
    heading('  AJUSTES / preferências deste computador, fora do save da campanha');
    line('  Enter alterna. A escolha vale também para o menu e o prólogo.'); line('');
    line(color(`  > Caracteres das ilustrações: ${current === 'unicode' ? 'UNICODE' : 'ASCII'}`, 'gold'));
    line(color('      ASCII funciona em qualquer terminal. Unicode desenha linhas, cantos', 'dim'));
    line(color('      e blocos contínuos; requer terminal UTF-8, como o Windows Terminal.', 'dim'));
    line(''); heading('  PRÉVIA');
    const sample = [' .----.    /\\     |>>     ', ' |[##]|   /__\\    |       ', ' |____|   |[]|  []_[]_[]  ', ' ~~~~~~~~~~~~~~~~~~~~~~~~ '];
    const ascii = glyph(sample, 'ascii'), uni = glyph(sample, 'unicode');
    line(color('  ASCII' + ' '.repeat(24) + 'UNICODE', 'dim'));
    sample.forEach((_, i) => line(color('  ' + ascii[i] + '   ' + uni[i], 'green')));
  } else {
    heading('  AS CRÔNICAS DO VALE / o que será contado sobre seu governo');
    line(color(`  Feitos ${g.feats.length}/${FEATS.length}: +${Math.round(featBonus(g) * 100)}% de toda a produção. PgDn mostra a lista abaixo.`, 'purple')); line('');
    g.log.slice(-Math.max(4, rows - 14)).forEach(s => line('  ' + s));
    line(''); heading('  FEITOS / cada um rende +1% de produção, para sempre nesta campanha');
    FEATS.forEach(f => line(color(`  ${g.feats.includes(f.id) ? '[x]' : '[ ]'} ${f.name.padEnd(20)} ${f.text}`, g.feats.includes(f.id) ? 'green' : 'dim')));
    line(''); line(color(`  Calamidades vencidas: ${g.calamity.resolved}  |  ignoradas: ${g.calamity.failed}  |  ritos celebrados: ${g.faith.rites}`, 'dim'));
  }
  const animation = provisionAnimation(g.time - view.gatherStarted).map(l => color(l, 'gold'));
  const budget = rows - header.length - 5 - animation.length;
  const scroll = Math.max(0, Math.min(view.scroll || 0, Math.max(0, body.length - budget)));
  let visible = body.slice(scroll, scroll + budget);
  while (visible.length < budget) visible.push('');
  const footer = [
    color(' ' + rule(width), 'dim'),
    color(` ${view.message || (g.event !== null ? 'Petição aguardando: use Tab para abrir o Conselho.' : 'Espaço: reunir provisões / P: reivindicar próximo título')}`, g.event !== null ? 'gold' : 'green'),
    color(' Tab/Shift+Tab páginas | Setas+Enter | A/B/C decisão | T tributos | P título', 'dim'),
    color(' ' + [page === PAGES.domain && 'V visão', calamity && 'X calamidade', 'Espaço provisões', 'PgUp/PgDn rolar', 'M menu', 'S salvar', 'Q sair'].filter(Boolean).join(' | '), 'dim'),
  ];
  // Corta mantendo as sequências de cor e sem quebrar a última coluna do terminal.
  const fit = text => {
    if (clean(text).length <= cols - 1) return text;
    let out = '', count = 0;
    for (const part of text.split(/(\x1b\[[0-9;]*m)/)) {
      if (part.startsWith('\x1b')) out += part;
      else { const available = cols - 2 - count; if (available <= 0) break; out += part.slice(0, available); count += Math.min(part.length, available); }
    }
    return out + '~\x1b[0m';
  };
  return [...header, ...visible, ...animation, ...footer].map(fit).join('\n');
}
