// Conjunto de caracteres das ilustrações. O modo Unicode troca cada símbolo ASCII
// por um equivalente de largura 1, então alinhamentos e larguras não mudam.
export const GLYPH_MODES = ['ascii', 'unicode'];
let mode = 'ascii';
export function setGlyphs(next) { if (GLYPH_MODES.includes(next)) mode = next; return mode; }
export function glyphMode() { return mode; }
export const unicode = () => mode === 'unicode';

const SIMPLE = { '-': '─', '|': '│', '_': '▁', '/': '╱', '\\': '╲', '=': '═', '#': '▓', '~': '≈', '>': '►', '<': '◄' };
// Cantos por conexão: esquerda, direita, cima, baixo.
const JOINS = { '0101': '┌', '1001': '┐', '0110': '└', '1010': '┘', '1101': '┬', '1110': '┴', '0111': '├', '1011': '┤', '1111': '┼', '1100': '─', '0011': '│' };
const ROUND = { '0101': '╭', '1001': '╮', '0110': '╰', '1010': '╯' };
const horizontal = ch => ch === '-';
const vertical = ch => ch === '|' || ch === '+';
const word = ch => /[\p{L}\p{N}+]/u.test(ch);

function convert(rows, r, c) {
  const at = (y, x) => rows[y]?.[x] ?? ' ', ch = at(r, c);
  if (ch === '+' && (word(at(r, c - 1)) || word(at(r, c + 1)))) return ch; // Texto como "CAS++".
  if (ch === '+' || ch === '.') {
    const key = [horizontal(at(r, c - 1)), horizontal(at(r, c + 1)), vertical(at(r - 1, c)), vertical(at(r + 1, c))].map(Number).join('');
    if (ch === '.') return ROUND[key] || '·';
    return JOINS[key] || '†';
  }
  if (ch === '[' && at(r, c + 1) === ']') return '▐';
  if (ch === ']' && at(r, c - 1) === '[') return '▌';
  if (ch === ':') return at(r, c - 1) === ':' || at(r, c + 1) === ':' ? '┄' : '┆';
  return SIMPLE[ch] ?? ch;
}
// Converte um bloco de arte; no modo ASCII devolve as linhas intactas.
export function glyph(lines, force = mode) {
  if (force !== 'unicode') return lines;
  const rows = lines.map(line => [...line]);
  return rows.map((row, r) => row.map((_, c) => convert(rows, r, c)).join(''));
}
export function meter(filled, empty) {
  return unicode() ? '▕' + '█'.repeat(filled) + '░'.repeat(empty) + '▏' : '[' + '#'.repeat(filled) + '.'.repeat(empty) + ']';
}
export const rule = width => (unicode() ? '─' : '-').repeat(width);
