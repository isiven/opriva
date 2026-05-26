import * as XLSX from 'xlsx';

export function getImportSheetData(workbook, sheetName) {
  var sheet = workbook && workbook.Sheets ? workbook.Sheets[sheetName] : null;
  if (!sheet) return { headers: [], rows: [], rowObjects: [] };
  var rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  var firstDataRow = rawRows.findIndex(function(row) {
    return Array.isArray(row) && row.some(function(cell) { return String(cell || '').trim(); });
  });
  if (firstDataRow < 0) return { headers: [], rows: [], rowObjects: [] };
  var headers = (rawRows[firstDataRow] || []).map(function(cell, index) {
    var header = String(cell || '').trim();
    return header || ('Column ' + (index + 1));
  });
  var rows = rawRows.slice(firstDataRow + 1).filter(function(row) {
    return Array.isArray(row) && row.some(function(cell) { return String(cell || '').trim(); });
  });
  var rowObjects = rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) { obj[header] = row[index] !== undefined ? String(row[index]).trim() : ''; });
    return obj;
  });
  return { headers: headers, rows: rows, rowObjects: rowObjects };
}
