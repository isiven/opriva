import { normalizeImportText } from './importText.js';

export function normalizeImportDate(value) {
  if (!value) return '';
  var d = new Date(value);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  var parts = String(value).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (!parts) return String(value);
  var year = parts[3].length === 2 ? '20' + parts[3] : parts[3];
  var month = parts[1].padStart(2, '0');
  var day = parts[2].padStart(2, '0');
  return year + '-' + month + '-' + day;
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
    importFileName: importContext.fileName || '',
    importSheetName: importContext.sheetName || '',
    importTarget: importContext.importTarget || '',
    detectedSource: importContext.sourceType || '',
    workspaceMode: importContext.workspaceMode || '',
    importedAt: importContext.importedAt || new Date().toISOString()
  });
  return Object.assign({}, record, { meta: meta });
}
