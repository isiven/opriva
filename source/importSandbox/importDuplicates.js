import { normalizeImportText } from './importText.js';

// Record-type-specific duplicate detection keys (Option A).
// Each key is namespaced by a type prefix so keys never collide across record
// types. Keys are only emitted when enough discriminating fields are present —
// weak/sparse keys are deliberately skipped to avoid false-positive duplicates.
export function buildDuplicateKeys(moduleKey, canonical) {
  var keys = [];
  if (moduleKey === 'licenses') {
    var client = normalizeImportText(canonical.clientDepartment);
    var brand = normalizeImportText(canonical.brandManufacturer);
    var product = normalizeImportText(canonical.productLicenseName);
    var expiration = normalizeImportText(canonical.expirationRenewalDate);
    var orderRef = normalizeImportText(canonical.orderReference);
    // Primary: client/department + brand/product + expiration date.
    if (client && (brand || product) && expiration) {
      keys.push('lic:' + [client, brand, product, expiration].filter(Boolean).join('|'));
    }
    // CSP variant: customer + offer/product + end date + order reference.
    if (client && product && expiration && orderRef) {
      keys.push('csp:' + [client, product, expiration, orderRef].filter(Boolean).join('|'));
    }
  } else if (moduleKey === 'hardware') {
    var hwSerial = normalizeImportText(canonical.serialNumber);
    var hwClient = normalizeImportText(canonical.clientDepartment);
    var hwAsset = normalizeImportText(canonical.productLicenseName);
    var hwRef = normalizeImportText(canonical.orderReference) || normalizeImportText(canonical.purchaseDate);
    // Primary: serial number (normalizeImportText already strips '-' to empty).
    if (hwSerial) {
      keys.push('hw-serial:' + hwSerial);
    }
    // Fallback: client + model/product + (order reference or purchase date).
    if (hwClient && hwAsset && hwRef) {
      keys.push('hw-fallback:' + [hwClient, hwAsset, hwRef].filter(Boolean).join('|'));
    }
  } else if (moduleKey === 'contracts') {
    var conNumber = normalizeImportText(canonical.contractNumber);
    var conExpiration = normalizeImportText(canonical.expirationRenewalDate);
    var conClient = normalizeImportText(canonical.clientDepartment);
    var conProvider = normalizeImportText(canonical.providerDistributor);
    var conType = normalizeImportText(canonical.productLicenseName);
    // Primary: contract number + end date.
    if (conNumber && conExpiration) {
      keys.push('con:' + [conNumber, conExpiration].filter(Boolean).join('|'));
    }
    // Fallback: client + provider + contract/support type + renewal/end date.
    if (conClient && conProvider && conType && conExpiration) {
      keys.push('con-fallback:' + [conClient, conProvider, conType, conExpiration].filter(Boolean).join('|'));
    }
  }
  // certificates and package: dormant — keys defined when those modules go live.
  return keys;
}

export function isDuplicateByKeys(duplicateKeys, seenKeysSet) {
  if (!duplicateKeys || !duplicateKeys.length) return false;
  return duplicateKeys.some(function(key) { return seenKeysSet.has(key); });
}

export function addKeysToSet(duplicateKeys, seenKeysSet) {
  if (duplicateKeys) duplicateKeys.forEach(function(key) { seenKeysSet.add(key); });
}

// Compare a new record's meta against one existing RECORD_STORE record.
// Uses duplicateKeys intersection when the existing record has them; falls back
// to legacy importKey equality when the existing record predates duplicateKeys.
export function matchesExistingRecord(newMeta, existingRecord) {
  if (!newMeta || !existingRecord || !existingRecord.meta) return false;
  var existingMeta = existingRecord.meta;
  if (existingMeta.duplicateKeys && existingMeta.duplicateKeys.length) {
    var newKeys = newMeta.duplicateKeys || [];
    return newKeys.some(function(key) { return existingMeta.duplicateKeys.indexOf(key) >= 0; });
  }
  return !!(existingMeta.importKey && newMeta.importKey && existingMeta.importKey === newMeta.importKey);
}
