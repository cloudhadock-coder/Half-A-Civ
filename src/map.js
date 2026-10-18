import { glyph } from './glyphs.js';
// Planta esquemática: cada lote representa um tipo de construção e sua quantidade.
export const MAP_LOTS = [
  ['farm', 'HOR', 'Hortas'], ['lumber', 'SER', 'Serrarias'], ['house', 'CAS', 'Casas'],
  ['quarry', 'PED', 'Pedreiras'], ['market', 'FEI', 'Feiras'], ['chapel', 'CAP', 'Capelas'],
  ['guard', 'GUA', 'Guarda'], ['hall', 'PAC', 'Paço'], ['castle', 'FOR', 'Fortaleza'],
  ['windmill', 'MOI', 'Moinho', 'gold'], ['forge', 'FRJ', 'Forja', 'red'],
  ['observatory', 'OBS', 'Observatório', 'blue'], ['garden', 'JAR', 'Jardim', 'purple'],
];
export function topdownMap(g) {
  const width = 69, height = 10;
  const cells = Array.from({ length: height }, () => Array.from({ length: width }, () => ({ text: '.', color: 'dim' })));
  const put = (x, y, text, color) => {
    for (const ch of text) { if (cells[y]?.[x]) cells[y][x] = { text: ch, color }; x++; }
  };
  const enclosed = g.stage >= 2;
  for (let y = 0; y < height; y++) {
    put(1, y, Math.floor(g.time) % 2 ? '~~~~' : '~=~~', 'blue');
    put(6, y, enclosed ? '#' : ':', 'dim'); put(65, y, enclosed ? '#' : ':', 'dim');
  }
  for (const y of [0, 9]) put(6, y, (enclosed ? '#' : ':').repeat(60), 'dim');
  put(10, 0, enclosed ? ' MURALHA ' : ' CERCA ', 'dim'); put(61, 0, 'N ^', 'ink');
  put(0, 4, '='.repeat(69), 'gold');
  put(28, 4, ' ESTRADA DO VALE ', 'gold');
  for (let y = 1; y < 9; y++) if (y !== 4) put(39, y, '|', 'gold');
  MAP_LOTS.forEach(([id, code, , tone], i) => {
    const x = 8 + (i % 7) * 8, y = i < 7 ? 1 : 6, count = g.buildings[id];
    if (!count) return; // Lotes vazios permanecem terreno livre.
    const color = tone || 'green';
    let roof = '+-----+';
    if (id === 'windmill') roof = Math.floor(g.time * 2) % 2 ? '+--X--+' : '+--+--+';
    if (id === 'forge') roof = Math.floor(g.time * 2) % 2 ? '+-***-+' : '+--*--+';
    if (id === 'observatory') roof = Math.floor(g.time * 2) % 2 ? '+--o-*+' : '+--O--+';
    put(x, y, roof, color);
    put(x, y + 1, `|${code}${count > 99 ? '++' : String(count).padStart(2, '0')}|`, color);
    put(x, y + 2, id === 'garden' ? '+-@-@-+' : '+--+--+', color);
  });
  put(56, 6, '+-----+', 'gold'); put(56, 7, '|PRACA|', 'gold'); put(56, 8, '+--+--+', 'gold');
  const drawn = glyph(cells.map(row => row.map(cell => cell.text).join('')));
  cells.forEach((row, y) => row.forEach((cell, x) => { cell.text = drawn[y][x]; }));
  return cells.map(row => {
    const spans = [];
    for (const cell of row) {
      if (spans.at(-1)?.color === cell.color) spans.at(-1).text += cell.text;
      else spans.push({ ...cell });
    }
    return spans;
  });
}
