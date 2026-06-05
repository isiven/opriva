// F1a — CSV export helper (local/sandbox, no backend).
// `toCsv` is a pure, side-effect-free string builder (heavily unit-tested).
// `downloadCsv` is the browser-only trigger (Blob + <a download>); it is safe to
// import in non-browser contexts because every DOM/Blob reference lives inside the
// function body, not at module top level.

// Convert any cell value to a CSV-safe string.
//   null / undefined -> ''
//   numbers / booleans / others -> String(value)
function cellToString(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

// CSV formula-injection guard: spreadsheet apps (Excel / Sheets) execute a cell as
// a formula when it starts with '=', '+', '-' or '@'. Prefix such cells with an
// apostrophe so they are treated as text. Detection ignores leading whitespace
// (so " =cmd" is also neutralized); the apostrophe is prepended to the original
// string. NOTE: this also prefixes plain negative numbers (e.g. -10 -> '-10),
// which is the safe (text) behavior by design.
function guardInjection(str) {
  if (/^[=+\-@]/.test(str.replace(/^\s+/, ''))) return "'" + str;
  return str;
}

// Escape a single cell: apply the injection guard, then RFC-4180-style quoting when
// the value contains a comma, double quote, or newline (LF/CR). Internal double
// quotes are doubled.
function escapeCell(value) {
  var s = guardInjection(cellToString(value));
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

/**
 * Build a CSV string from a header row and data rows. Pure: never mutates inputs.
 * @param {Array<string>} columns  header labels
 * @param {Array<Array>} rows       array of cell arrays (ragged rows allowed)
 * @returns {string} CSV text (rows joined with '\n')
 */
export function toCsv(columns, rows) {
  var cols = Array.isArray(columns) ? columns : [];
  var data = Array.isArray(rows) ? rows : [];
  var header = cols.map(escapeCell).join(',');
  var body = data.map(function (row) {
    return (Array.isArray(row) ? row : []).map(escapeCell).join(',');
  });
  return [header].concat(body).join('\n');
}

/**
 * Browser-only: build the CSV and trigger a client-side download. No backend.
 * @param {string} filename       e.g. 'renewal-exposure.csv'
 * @param {Array<string>} columns header labels
 * @param {Array<Array>} rows     cell arrays
 */
export function downloadCsv(filename, columns, rows) {
  var csv = toCsv(columns, rows);
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename || 'export.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
