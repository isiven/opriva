// F1a — tests for the pure CSV builder (node:test + node:assert/strict).
// downloadCsv is browser-only and intentionally not exercised here; importing the
// module is safe because its DOM/Blob references live inside the function body.

import test from 'node:test';
import assert from 'node:assert/strict';
import { toCsv } from '../source/utils/exportCsv.js';

test('headers + rows: basic', () => {
  assert.equal(
    toCsv(['A', 'B'], [['1', '2'], ['3', '4']]),
    'A,B\n1,2\n3,4'
  );
});

test('empty rows -> header only', () => {
  assert.equal(toCsv(['A', 'B'], []), 'A,B');
});

test('cell with comma is quoted', () => {
  assert.equal(toCsv(['X'], [['a,b']]), 'X\n"a,b"');
});

test('cell with double quotes -> internal quotes doubled and wrapped', () => {
  assert.equal(toCsv(['X'], [['a"b']]), 'X\n"a""b"');
});

test('cell with newline is quoted (LF and CR)', () => {
  assert.equal(toCsv(['X'], [['a\nb']]), 'X\n"a\nb"');
  assert.equal(toCsv(['X'], [['a\rb']]), 'X\n"a\rb"');
});

test('null / undefined -> empty cell', () => {
  assert.equal(toCsv(['A', 'B'], [[null, undefined]]), 'A,B\n,');
});

test('numbers and booleans -> string', () => {
  assert.equal(toCsv(['N', 'Z', 'B'], [[1, 0, true]]), 'N,Z,B\n1,0,true');
  assert.equal(toCsv(['B'], [[false]]), 'B\nfalse');
});

test('mixed escaping in one row', () => {
  assert.equal(
    toCsv(['Name', 'Note', 'Qty'], [['Doe, John', 'He said "hi"\nthen left', 3]]),
    'Name,Note,Qty\n"Doe, John","He said ""hi""\nthen left",3'
  );
});

// ── CSV formula injection guard ──
test('CSV injection: =cmd is neutralized with leading apostrophe', () => {
  assert.equal(toCsv(['X'], [['=cmd']]), "X\n'=cmd");
});

test('CSV injection: +SUM(A1:A2)', () => {
  assert.equal(toCsv(['X'], [['+SUM(A1:A2)']]), "X\n'+SUM(A1:A2)");
});

test('CSV injection: -10+20 (and plain negative numbers) are prefixed', () => {
  assert.equal(toCsv(['X'], [['-10+20']]), "X\n'-10+20");
  assert.equal(toCsv(['X'], [[-10]]), "X\n'-10"); // negative number -> safe text
});

test('CSV injection: @HYPERLINK with comma -> prefixed AND quoted', () => {
  assert.equal(
    toCsv(['X'], [['@HYPERLINK("http://x","y")']]),
    'X\n"\'@HYPERLINK(""http://x"",""y"")"'
  );
});

test('CSV injection: detected after leading whitespace', () => {
  assert.equal(toCsv(['X'], [['   =danger']]), "X\n'   =danger");
});

test('safe leading chars are not prefixed', () => {
  assert.equal(toCsv(['X'], [['hello']]), 'X\nhello');
  assert.equal(toCsv(['X'], [['1234']]), 'X\n1234'); // positive number-like
});

// ── robustness ──
test('does not mutate input columns or rows', () => {
  const columns = ['A', 'B'];
  const rows = [['=x', 'a,b'], [null, 2]];
  const columnsCopy = JSON.parse(JSON.stringify(columns));
  const rowsCopy = JSON.parse(JSON.stringify(rows));
  toCsv(columns, rows);
  assert.deepEqual(columns, columnsCopy);
  assert.deepEqual(rows, rowsCopy);
});

test('empty columns', () => {
  assert.equal(toCsv([], []), '');
  assert.equal(toCsv([], [['a', 'b']]), '\na,b'); // empty header line, then the row
});

test('ragged rows are emitted as-is (no padding/truncation)', () => {
  assert.equal(toCsv(['A', 'B', 'C'], [['1'], ['1', '2', '3', '4']]), 'A,B,C\n1\n1,2,3,4');
});

test('non-array inputs are treated as empty', () => {
  assert.equal(toCsv(undefined, undefined), '');
  assert.equal(toCsv(null, null), '');
});
