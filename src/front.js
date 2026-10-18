import { glyph, unicode } from './glyphs.js';
import { FEATS } from './feats.js';
// Abertura e menu originais, inspirados na atmosfera dos RPGs de terminal.
export const PROLOGUE = [
  { title: 'I. AS CINZAS DO VELHO REINO', art: [
    '    .                              .     *',
    '         _   _   _    / \\    _   _',
    '        | |_| |_| |  /   \\  | |_| |_  .',
    '        |  _   _  | / .   \\ |  _    \\',
    '        | | | | | |/  . :  \\| | |    \\',
    '    ____|_|_|_|_|_|___:_.___|_|_|_____|____',
    '           ~    ~  \\_______/    ~     ~',
  ], text: [ 'A última coroa caiu. Seus salões ficaram vazios.', 'Na estrada, doze famílias carregam sementes, ferramentas', 'e a memória de um reino que não soube protegê-las.' ] },
  { title: 'II. UM FOGO NA ESCURIDÃO', art: [
    '                  .                 *',
    '            /\\                 /\\',
    '           /  \\      )        /  \\',
    '          /____\\    (        /____\\',
    '          | [] |    /\\       | [] |',
    '      ____|____|___/##\\______|____|____',
    '        ,,,  o  o          o  o  ,,,',
  ], text: [ 'Ao amanhecer, a caravana encontra o Vale da Aurora.', 'Não há muralhas. Não há exército. Apenas uma fogueira.', 'É aqui que pedem a você algo mais difícil que conquistar: cuidar.' ] },
  { title: 'III. O PESO DE UMA COROA', art: [
    '                    .     .     .',
    '                    |\\   /|\\   /|',
    '                    | \\ / | \\ / |',
    '                    |  o  o  o  |',
    '                    |___________|',
    '                 ___/           \\___',
    '                /___________________\\',
  ], text: [ 'O pão dará força ao povo. O ouro abrirá caminhos.', 'Mas camponeses, guildas, clero e nobres cobrarão seu preço.', 'Erga uma cidade. Mereça um reino. Que nome terá seu legado?' ] },
];
// O prólogo abre o jogo só na primeira vez, quando ainda não há save; depois, "Rever o prólogo".
export function createFront(hasSave = false, now = Date.now()) {
  return { screen: hasSave ? 'menu' : 'intro', hasSave, selected: hasSave ? 0 : 1, chapter: 0, enteredAt: now, revealed: false, name: '', message: '' };
}
// Resumo do progresso offline: diferenças entre o estado salvo e o atual.
export function absence(before, g, elapsed) {
  const names = { food: 'Alimento', wood: 'Madeira', stone: 'Pedra', gold: 'Ouro', influence: 'Influência' };
  const signed = n => `${n >= 0 ? '+' : '-'}${Math.floor(Math.abs(n)).toLocaleString('pt-BR')}`;
  const minutes = Math.floor(elapsed / 60), seconds = Math.floor(elapsed % 60);
  const changes = Object.entries(names).map(([k, label]) => `  ${label.padEnd(12)} ${signed(g.resources[k] - before.resources[k]).padStart(8)}   (${Math.floor(g.resources[k]).toLocaleString('pt-BR')})`);
  changes.push(`  ${'Devoção'.padEnd(12)} ${signed(g.faith.devotion - before.faith.devotion).padStart(8)}`);
  changes.push(`  ${'Habitantes'.padEnd(12)} ${signed(g.population - before.population).padStart(8)}   (${Math.floor(g.population)})`);
  const notes = g.feats.filter(id => !before.feats.includes(id)).map(id => `Feito conquistado: ${FEATS.find(x => x.id === id).name} (+1% produção)`);
  if (g.event !== null) notes.push('Uma petição aguarda no Conselho.');
  if (g.population < before.population) notes.push('Faltou alimento: a população diminuiu.');
  return { duration: minutes ? `${minutes} min ${seconds}s` : `${seconds}s`, changes, notes };
}
export const menuItems = ['Continuar domínio', 'Fundar novo domínio', 'Rever o prólogo', 'Como governar', 'Sair'];
const TITLE = [
  '#   #  ###  #    #####  ###  ##### #   #',
  '#   # #   # #    #     #   #   #   #   #',
  '##### ##### #    ####  #       #   #   #',
  '#   # #   # #    #     #   #   #    # # ',
  '#   # #   # #### #      ###  #####   #  ',
];
function ready(f, now) { return f.revealed || now - f.enteredAt >= PROLOGUE[f.chapter].text.join('\n').length * 25; }
export function frontKey(f, name, text = '', now = Date.now()) {
  f.message = '';
  if (f.screen === 'intro') {
    if (name === 'escape' || name === 'q') { f.screen = 'menu'; return; }
    if (name === 'return' || name === 'space') {
      if (!ready(f, now)) { f.revealed = true; return; }
      if (f.chapter < PROLOGUE.length - 1) { f.chapter++; f.enteredAt = now; f.revealed = false; }
      else f.screen = 'menu';
    }
    return;
  }
  if (f.screen === 'away') {
    if (name === 'q') return { type: 'quit' };
    if (['return', 'space', 'escape'].includes(name)) { f.screen = 'menu'; return { type: 'play' }; }
    return;
  }
  if (f.screen === 'help') { if (['escape', 'return', 'm', 'q'].includes(name)) f.screen = 'menu'; return; }
  if (f.screen === 'confirm') {
    if (['escape', 'n', 'q'].includes(name)) f.screen = 'menu';
    if (name === 's') { f.screen = 'name'; f.name = ''; }
    return;
  }
  if (f.screen === 'name') {
    if (name === 'escape') f.screen = 'menu';
    else if (name === 'backspace') f.name = [...f.name].slice(0, -1).join('');
    else if (name === 'return') return { type: 'new', name: f.name.trim() || 'Vale da Aurora' };
    else if (text && /^[\p{L}\p{N} '-]+$/u.test(text)) f.name = (f.name + text).slice(0, 28);
    return;
  }
  if (name === 'escape' || name === 'q') return { type: 'quit' };
  if (name === 'up') f.selected = (f.selected + 4) % 5;
  if (name === 'down') f.selected = (f.selected + 1) % 5;
  if (/^[1-5]$/.test(name)) f.selected = Number(name) - 1;
  if (name !== 'return' && !/^[1-5]$/.test(name)) return;
  if (f.selected === 0) {
    if (f.hasSave) return { type: 'continue' };
    f.message = 'Nenhum domínio salvo. Escolha Fundar novo domínio.';
  }
  if (f.selected === 1) { f.screen = f.hasSave ? 'confirm' : 'name'; f.name = ''; }
  if (f.selected === 2) { f.screen = 'intro'; f.chapter = 0; f.enteredAt = now; f.revealed = false; }
  if (f.selected === 3) f.screen = 'help';
  if (f.selected === 4) return { type: 'quit' };
}
export function renderFront(f, cols = 100, rows = 32, now = Date.now()) {
  if (cols < 80 || rows < 24) return 'HalfACiv\nAmplie o terminal para 80 x 24.\nEsc pula a intro. Q sai pelo menu.';
  const width = Math.min(cols - 6, 76), lines = [];
  const add = text => lines.push(String(text || '').slice(0, width));
  const border = (left, right) => add(unicode() ? left + '─'.repeat(width - 2) + right : '+-' + '-'.repeat(width - 4) + '-+');
  border('╭', '╮');
  if (f.screen === 'intro') {
    const chapter = PROLOGUE[f.chapter];
    add(''); add(chapter.title); add(''); glyph(chapter.art).forEach(add); add('');
    const full = chapter.text.join('\n');
    const count = f.revealed ? full.length : Math.floor((now - f.enteredAt) / 25);
    full.slice(0, Math.max(0, count)).split('\n').forEach(add);
    while (lines.length < 18) add('');
    add(`CRÔNICA ${f.chapter + 1} / 3    [Enter] revelar / avançar    [Esc] pular`);
  } else if (f.screen === 'menu') {
    const center = text => add(' '.repeat(Math.max(0, Math.floor((width - text.length) / 2))) + text);
    center(unicode() ? '◇ ─── ♛ ─── ◇' : '* --- /W\\ --- *');
    TITLE.forEach(row => center(unicode() ? row.replaceAll('#', '█') : row));
    center('H A L F A C I V');
    center(unicode() ? '━━━━ DA FOGUEIRA À COROA ━━━━' : '==== DA FOGUEIRA A COROA ===='); add('');
    menuItems.forEach((item, i) => add(`             ${f.selected === i ? '>' : ' '} [${i + 1}] ${item}${i === 0 && !f.hasSave ? ' (sem save)' : ''}`));
    add(''); add('             Setas escolhem. Enter abre. 1-5: atalhos.');
    add('             O domínio fica pausado neste menu.');
  } else if (f.screen === 'away') {
    const a = f.away;
    add(''); add('O RELATÓRIO DO INTENDENTE'); add('');
    add(`Você esteve fora por ${a.duration}. O intendente manteve o vale de pé.`);
    add('Calamidades não ocorrem na sua ausência; petições aguardam sua decisão.'); add('');
    a.changes.forEach(add);
    if (a.notes.length) { add(''); a.notes.forEach(add); }
    add(''); add('[Enter] Retomar o governo     [Q] Sair');
  } else if (f.screen === 'confirm') {
    add(''); add('UM NOVO ESTANDARTE'); add('');
    add('Fundar um novo domínio substituirá a campanha atual.');
    add('Uma cópia do save anterior será guardada antes da troca.');
    add(''); add('[S] Fundar outro domínio     [N / Esc] Voltar');
  } else if (f.screen === 'name') {
    add(''); add('O PRIMEIRO REGISTRO DO ESCRIVÃO'); add('');
    add('Como será chamado o seu domínio?'); add('');
    add('> ' + f.name + (Math.floor(now / 500) % 2 ? '_' : ' '));
    add(''); add('Até 28 caracteres. Enter vazio: Vale da Aurora.');
    add('[Enter] Acender a primeira fogueira     [Esc] Voltar');
  } else {
    add(''); add('O LIVRO DO INTENDENTE'); add('');
    add('Tab / Shift+Tab  Próxima página / página anterior.');
    add('Recrutas: Enter contrata; R renova; D dispensa.');
    add('Setas + Enter  Construir e aprovar reformas.');
    add('A / B / C  Responder às petições na página Conselho.');
    add('T tributos. P título. Espaço provisões. V mapa no Domínio.');
    add('PgUp / PgDn  Rolar.   S  Salvar.   Q  Salvar e sair.');
    add('M / Esc  Abrir o menu e pausar a campanha.');
    add(''); add('Comece com uma segunda horta e uma pedreira.');
    add('Construa casas, mantenha reservas para o inverno e ouça o conselho.');
    add('Três facções devem apoiar suas reformas. Ouro sozinho não faz um rei.');
    add(''); add('Autosave: 15s. Fora do jogo: até 1 hora de produção e consumo.');
    add(''); add('[Enter / Esc] Fechar o livro');
  }
  add(''); add(f.message); border('╰', '╯');
  const indent = ' '.repeat(Math.max(0, Math.floor((cols - width) / 2)));
  const top = Math.max(0, Math.floor((rows - lines.length) / 2));
  const text = [...Array(top).fill(''), ...lines].slice(0, rows - 1).map(l => indent + l).join('\n');
  return process.env.NO_COLOR ? text : '\x1b[38;5;179m' + text + '\x1b[0m';
}
