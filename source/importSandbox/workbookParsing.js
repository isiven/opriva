import * as XLSX from 'xlsx';

const HEADER_KEYWORDS = [
  'client',
  'customer',
  'cliente',
  'department',
  'departamento',
  'product',
  'producto',
  'offer',
  'license',
  'licencia',
  'licencias',
  'brand',
  'marca',
  'manufacturer',
  'fabricante',
  'distributor',
  'distribuidor',
  'provider',
  'vendor',
  'supplier',
  'proveedor',
  'reseller',
  'reventa',
  'partner',
  'quantity',
  'cantidad',
  'seats',
  'users',
  'serial',
  'serie',
  'contract',
  'contrato',
  'con number',
  'registro',
  'po',
  'oc',
  'order',
  'orden',
  'invoice',
  'factura',
  'start date',
  'fecha inicio',
  'end date',
  'expiration',
  'vencimiento',
  'renewal',
  'warranty',
  'garantia',
  'support',
  'soporte',
  'amount',
  'monto',
  'total',
  'status',
  'estado',
  'clase',
  'articulo',
  'transaccion',
  'numero',
  'number',
  'description',
  'descripcion',
  'notes',
  'notas',
  'billing',
  'domain',
  'term'
];

function normalizeHeaderText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9#]+/g, ' ')
    .trim();
}

function hasText(value) {
  return String(value || '').trim().length > 0;
}

function isNonEmptyRow(row) {
  return Array.isArray(row) && row.some(hasText);
}

function looksLikeDate(value) {
  var text = String(value || '').trim();
  return /^(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})$/.test(text);
}

function looksLikeAmount(value) {
  return /[$€£]|(^|\s)(usd|eur|pab)(\s|$)/i.test(String(value || ''));
}

function scoreHeaderRow(row) {
  var score = 0;
  var nonEmptyCount = 0;
  var keywordHits = 0;
  (Array.isArray(row) ? row : []).forEach(function(cell) {
    var raw = String(cell || '').trim();
    if (!raw) return;
    nonEmptyCount += 1;
    var normalized = normalizeHeaderText(raw);
    var matched = HEADER_KEYWORDS.some(function(keyword) {
      return normalized === keyword || normalized.indexOf(keyword) >= 0;
    });
    if (matched) {
      keywordHits += 1;
      score += 4;
    }
    if (/[a-z]/i.test(normalized)) score += 0.75;
    if (looksLikeDate(raw)) score -= 3;
    if (looksLikeAmount(raw)) score -= 2;
    if (/@/.test(raw)) score -= 3;
    if (raw.length > 80) score -= 1.5;
  });
  if (nonEmptyCount >= 3) score += Math.min(nonEmptyCount, 10) * 0.4;
  if (keywordHits >= 2) score += keywordHits;
  return score;
}

function detectHeaderRow(rawRows, firstDataRow) {
  var candidates = [];
  for (var i = firstDataRow; i < rawRows.length && candidates.length < 15; i += 1) {
    if (isNonEmptyRow(rawRows[i])) candidates.push({ index: i, score: scoreHeaderRow(rawRows[i]) });
  }
  if (!candidates.length) return { index: firstDataRow, score: 0 };
  var firstCandidate = candidates[0];
  var best = candidates.reduce(function(currentBest, candidate) {
    return candidate.score > currentBest.score ? candidate : currentBest;
  }, firstCandidate);
  if (best.score < 5) return firstCandidate;
  if (firstCandidate.score >= 5 && best.score - firstCandidate.score < 3) return firstCandidate;
  return best;
}

export function getImportSheetData(workbook, sheetName) {
  var sheet = workbook && workbook.Sheets ? workbook.Sheets[sheetName] : null;
  if (!sheet) return { headers: [], rows: [], rowObjects: [], detectedHeaderRowIndex: -1, skippedIntroRows: 0, headerDetectionScore: 0 };
  var rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  var firstDataRow = rawRows.findIndex(isNonEmptyRow);
  if (firstDataRow < 0) return { headers: [], rows: [], rowObjects: [], detectedHeaderRowIndex: -1, skippedIntroRows: 0, headerDetectionScore: 0 };
  var detectedHeader = detectHeaderRow(rawRows, firstDataRow);
  var headerRowIndex = detectedHeader.index;
  var headers = (rawRows[headerRowIndex] || []).map(function(cell, index) {
    var header = String(cell || '').trim();
    return header || ('Column ' + (index + 1));
  });
  var rows = rawRows.slice(headerRowIndex + 1).filter(isNonEmptyRow);
  var rowObjects = rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) { obj[header] = row[index] !== undefined ? String(row[index]).trim() : ''; });
    return obj;
  });
  return {
    headers: headers,
    rows: rows,
    rowObjects: rowObjects,
    detectedHeaderRowIndex: headerRowIndex,
    skippedIntroRows: Math.max(0, headerRowIndex - firstDataRow),
    headerDetectionScore: Math.round(detectedHeader.score * 10) / 10
  };
}
