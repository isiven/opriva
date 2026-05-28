import { normalizeImportText } from './importText.js';
import { buildDuplicateKeys } from './importDuplicates.js';

export function normalizeImportDate(value) {
  if (!value) return '';
  var raw = String(value).trim();
  if (!raw || raw === '-') return '';

  // 1) Already ISO YYYY-MM-DD (optionally with trailing time/timezone): validate and keep.
  var iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    var im = parseInt(iso[2], 10);
    var idd = parseInt(iso[3], 10);
    if (im >= 1 && im <= 12 && idd >= 1 && idd <= 31) {
      return iso[1] + '-' + String(im).padStart(2, '0') + '-' + String(idd).padStart(2, '0');
    }
    return '';
  }

  // 2) Slash/dash dates from vendor exports. Source convention is DAY-first (DD/MM/YYYY).
  //    - If the first component is > 12 it is unambiguously the day.
  //    - If the second component is > 12 and the first is <= 12, recover as MM/DD (stray US format).
  //    - Otherwise (both <= 12) the value is ambiguous and is read as DD/MM by default.
  var parts = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (parts) {
    var a = parseInt(parts[1], 10);
    var b = parseInt(parts[2], 10);
    var year = parts[3].length === 2 ? 2000 + parseInt(parts[3], 10) : parseInt(parts[3], 10);
    var day, month;
    if (a > 12 && b <= 12) { day = a; month = b; }
    else if (b > 12 && a <= 12) { day = b; month = a; }
    else { day = a; month = b; }
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    }
    return '';
  }

  // 3) Other parseable formats (e.g. "May 29 2017", full ISO datetime).
  var parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);

  // 4) Unparseable -> empty so the row is flagged "Missing expiration date"
  //    rather than silently rendered as "Pending date" on a garbage string.
  return '';
}

export function importMoney(value) {
  if (!value) return '';
  var cleaned = String(value).replace(/[^0-9.-]+/g, '');
  return cleaned && !isNaN(parseFloat(cleaned)) ? cleaned : '';
}

export function formatImportMoney(value) {
  var n = parseFloat(importMoney(value));
  if (isNaN(n)) return '-';
  return '$' + n.toLocaleString();
}

export function buildImportLicenseDisplayName(brand, product, client) {
  var parts = [brand && brand !== '-' ? brand : '', product && product !== 'Imported license' ? product : '', client && client.indexOf('Unassigned') !== 0 ? client : ''].filter(Boolean);
  if (parts.length >= 2) return parts.join(' - ');
  if (product && product !== 'Imported license') return client && client.indexOf('Unassigned') !== 0 ? product + ' - ' + client : product;
  if (brand && brand !== '-') return client && client.indexOf('Unassigned') !== 0 ? brand + ' - ' + client : brand;
  return 'Imported license';
}

export function buildImportRecordKey(canonical) {
  return [
    canonical.moduleKey,
    canonical.clientDepartment,
    canonical.brandManufacturer,
    canonical.productLicenseName || canonical.displayName,
    canonical.expirationRenewalDate,
    canonical.contractNumber,
    canonical.orderReference,
    canonical.providerDistributor
  ].map(function(value) { return normalizeImportText(value); }).filter(Boolean).join('|');
}

export function withImportRecordMeta(record, moduleKey, canonical, importContext) {
  var meta = Object.assign({}, record.meta || {}, {
    source: 'importSandbox',
    moduleKey: moduleKey,
    type: moduleKey,
    displayName: canonical.displayName,
    clientDepartment: canonical.clientDepartment,
    brandManufacturer: canonical.brandManufacturer,
    productLicenseName: canonical.productLicenseName,
    providerDistributor: canonical.providerDistributor,
    expirationRenewalDate: canonical.expirationRenewalDate,
    quantitySeats: canonical.quantitySeats,
    commercialValue: canonical.commercialValue,
    vendorCost: canonical.vendorCost,
    owner: canonical.owner || 'Unassigned',
    alertPolicy: canonical.alertPolicy || 'Workspace default',
    contractNumber: canonical.contractNumber,
    orderReference: canonical.orderReference,
    importKey: canonical.importKey || buildImportRecordKey(Object.assign({}, canonical, { moduleKey: moduleKey })),
    duplicateKeys: buildDuplicateKeys(moduleKey, Object.assign({}, record.meta || {}, canonical, { moduleKey: moduleKey })),
    importFileName: importContext.fileName || '',
    importSheetName: importContext.sheetName || '',
    importTarget: importContext.importTarget || '',
    detectedSource: importContext.sourceType || '',
    workspaceMode: importContext.workspaceMode || '',
    importedAt: importContext.importedAt || new Date().toISOString()
  });
  return Object.assign({}, record, { meta: meta });
}
