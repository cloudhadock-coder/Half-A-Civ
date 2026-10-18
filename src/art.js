// Cenas originais do HalfACiv, desenhadas em ASCII e convertidas no modo Unicode.
import { glyph } from './glyphs.js';
const WIDTH = 62, HEIGHT = 8;
const SKY = [
  '        .                  .         *                 .     ',
  '                  .                   .                      ',
];
// Sprites: espaços são transparentes, então cada peça pode se sobrepor ao cenário.
const HUT = ['  /\\  ', ' /  \\ ', '/____\\', '| [] |', '|_||_|'];
const COTTAGE = ['  ______  ', ' /      \\ ', '/________\\', '| []  [] |', '|___||___|'];
const PINE = ['  /\\  ', ' /  \\ ', '/____\\', '  ||  '];
const FIRE = [' (  ', ' )) ', '/##\\'];
const PERSON = [' o ', '/|\\', '/ \\'];
const CHAPEL = ['   +   ', '  /_\\  ', ' /   \\ ', '/_____\\', '| [+] |', '|__n__|'];
const STALL = ['.-~-~-~-.', '|_______|', ' |  o  | ', ' |_____| '];
const WELL = [' ___ ', ' |-| ', '[___]'];
const TOWER = ['   |>>  ', '   |    ', '[]_[]_[]', '|      |', '|  []  |', '|      |', '|__/\\__|'];
const ROOF = ['  /\\  ', ' /  \\ ', '/____\\'];
const SPIRE = ['  +  ', ' /_\\ ', '/___\\'];
const GATE = ['[]_[]_[]_[]', '|  .---.  |', '|  |###|  |', '|__|###|__|'];
const KEEP = [
  '      |>>     ',
  '  []__[]__[]  ',
  '  |   [ ]  |  ',
  '[]|________|[]',
  '|  .------.  |',
  '|  |######|  |',
  '|__|######|__|',
];
const PALACE = [
  '       /\\/\\/\\       ',
  '  |>>[]__[]__[]  |>>',
  '  |  |  [  ]  |  |  ',
  '[]_[]_[]_[]_[]_[]_[]',
  '|  []    __    []  |',
  '|       |  |       |',
  '|_______|__|_______|',
];

function scene(parts) {
  const rows = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(' '));
  for (const [sprite, x, y] of parts) sprite.forEach((line, dy) => [...line].forEach((ch, dx) => {
    if (ch !== ' ' && rows[y + dy]?.[x + dx] !== undefined) rows[y + dy][x + dx] = ch;
  }));
  return rows.map(r => r.join(''));
}
const line = text => [text.padEnd(WIDTH).slice(0, WIDTH)];
const center = text => line(' '.repeat(Math.max(0, Math.floor((WIDTH - text.length) / 2))) + text);

export function specialArt(g) {
  const frame = Math.floor(g.time * 2) % 2;
  const sprites = [
    { id: 'windmill', color: 'gold', rows: [' MOINHO', ...(frame
      ? ['   \\   /  ', '     O    ', '   //|\\\\  ', '   /_|_\\  ']
      : ['     |    ', '  ---O--- ', '    /|\\   ', '   /_|_\\  '])] },
    { id: 'forge', color: 'red', rows: [' FORJA', frame ? '    ~ *   ' : '   * ~    ', '  __||__  ', ' /______\\ ', frame ? ' | [##] | ' : ' | [**] | '] },
    { id: 'observatory', color: 'blue', rows: [' OBSERVATÓRIO', frame ? ' *     .  ' : ' .     *  ', '   .(O)=> ', '  /_____\\ ', '  |:[_]:| '] },
    { id: 'garden', color: 'purple', rows: [' JARDIM', frame ? ' .  +  .  ' : ' +  .  +  ', '  @  ^  @ ', '  | (o) | ', ' =|=====|='] },
  ].filter(s => g.buildings[s.id]);
  return sprites.length ? Array.from({ length: 5 }, (_, row) => sprites.map(s => ({ text: glyph(s.rows)[row].padEnd(18), color: s.color }))) : [];
}
export function cityArt(stage, frame = 0) {
  const smoke = [frame % 2 ? ' ~' : '~ '];
  const scenes = [
    // Aldeia: cabanas, uma fogueira e as primeiras hortas.
    () => scene([
      [line('.'.repeat(WIDTH)), 0, 6],
      [line(' ~~~~~~~   ,,,,,   ,,,,,              ,,,,,   ,,,,,   ~~~~~'), 0, 7],
      [smoke, 17, 0], [['||'], 17, 1],
      [HUT, 3, 2], [COTTAGE, 11, 2], [PERSON, 23, 4], [FIRE, 27, 4], [PERSON, 32, 4],
      [HUT, 38, 2], [PINE, 47, 3], [PINE, 54, 3],
    ]),
    // Vila: capela, feira e poço.
    () => scene([
      [line('_'.repeat(WIDTH)), 0, 6],
      [line(' ~~~~~~   ,,,,,  ======  ,,,,,   ======   ,,,,,   ~~~~~~~~'), 0, 7],
      [smoke, 13, 0], [['||'], 13, 1],
      [HUT, 0, 2], [COTTAGE, 7, 2], [CHAPEL, 18, 1], [STALL, 26, 3],
      [WELL, 36, 4], [PERSON, 42, 4], [COTTAGE, 46, 2], [PINE, 56, 3],
    ]),
    // Cidade livre: muralha, portão e telhados por trás.
    () => scene([
      [line('~'.repeat(WIDTH)), 0, 7], [['|=====|'], 29, 7],
      [ROOF, 12, 0], [ROOF, 19, 0], [SPIRE, 40, 0], [ROOF, 46, 0],
      [['[]_'.repeat(15).slice(0, 44)], 9, 3], [['_'.repeat(44)], 9, 6],
      [GATE, 27, 3], [TOWER, 1, 0], [TOWER, 53, 0],
    ]),
    // Principado: torre de menagem e a estrada real.
    () => scene([
      [center('~~~~~~~~~~   ======== ESTRADA REAL ========   ~~~~~~~~~~'), 0, 7],
      [ROOF, 11, 0], [ROOF, 17, 0], [SPIRE, 40, 0], [ROOF, 46, 0],
      [['[]_[]_[]_[]_[]_'], 9, 3], [['_[]_[]_[]_[]_[]'], 38, 3], [['_'.repeat(44)], 9, 6],
      [['[]'], 15, 4], [['[]'], 45, 4],
      [KEEP, 24, 0], [TOWER, 1, 0], [TOWER, 53, 0],
    ]),
    // Reino: o palácio coroado.
    () => scene([
      [center('~~~~~~~~~~   ========== A COROA ==========   ~~~~~~~~~~'), 0, 7],
      [['.   .'], 12, 0], [['.   .'], 45, 0],
      [['[]_[]_[]_[]_'], 9, 3], [['_[]_[]_[]_[]'], 41, 3], [['_'.repeat(44)], 9, 6],
      [['[]'], 14, 4], [['[]'], 46, 4],
      [PALACE, 21, 0], [TOWER, 1, 0], [TOWER, 53, 0],
    ]),
  ];
  return glyph([...SKY.map(s => s.padEnd(WIDTH)), ...scenes[stage]()]);
}
