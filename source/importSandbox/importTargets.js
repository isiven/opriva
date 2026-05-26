import { getMappedImportValue } from './importMapping.js';
import { normalizeImportText } from './importText.js';

export function suggestImportTargetFromSource(sourceType) {
  if (sourceType === 'Microsoft CSP') return 'Licenses';
  if (sourceType === 'Veeam Renewal Export') return 'Licenses';
  if (sourceType === 'Hardware Sales Export') return 'Hardware';
  if (sourceType === 'Commercial Renewal Package') return 'Renewal Package';
  return 'Mixed / Multiple record types';
}

export function importTargetToModule(importTarget) {
  if (importTarget === 'Licenses') return { moduleKey: 'licenses', label: 'License' };
  if (importTarget === 'Hardware') return { moduleKey: 'hardware', label: 'Hardware' };
  if (importTarget === 'Contracts / Support Coverage') return { moduleKey: 'contracts', label: 'Contract / Support Coverage' };
  if (importTarget === 'Renewal Package') return { moduleKey: 'package', label: 'Renewal Package', review: true, warning: 'Renewal Package import is preview-only in this MVP.' };
  if (importTarget === 'Clients / Departments') return { moduleKey: 'clients', label: 'Clients / Departments', review: true, warning: 'Clients / Departments import is preview-only in this MVP.' };
  if (importTarget === 'Vendors / Providers') return { moduleKey: 'vendors', label: 'Vendors / Providers', review: true, warning: 'Vendors / Providers import is preview-only in this MVP.' };
  if (importTarget === 'Documents Metadata') return { moduleKey: 'documents', label: 'Documents Metadata', review: true, warning: 'Documents Metadata import is preview-only in this MVP.' };
  if (importTarget === 'Tasks') return { moduleKey: 'tasks', label: 'Tasks', review: true, warning: 'Tasks import is preview-only in this MVP.' };
  return null;
}

export function detectImportTarget(rowObj, mappings, sourceType, importTarget) {
  var selectedTarget = importTargetToModule(importTarget);
  if (selectedTarget) return selectedTarget;
  if (sourceType === 'Microsoft CSP') return { moduleKey: 'licenses', label: 'License' };
  if (sourceType === 'Veeam Renewal Export') return { moduleKey: 'licenses', label: 'License' };
  if (sourceType === 'Commercial Renewal Package') return { moduleKey: 'package', label: 'Renewal Package', review: true, warning: 'Package import is preview-only in this MVP.' };
  if (sourceType === 'Hardware Sales Export') {
    var itemClass = Object.keys(rowObj).reduce(function(found, key) {
      return found || (normalizeImportText(key).indexOf('clase de articulo') >= 0 ? rowObj[key] : '');
    }, '');
    var normalizedClass = normalizeImportText(itemClass);
    if (/(equipos|hardware|qnap|nas)/.test(normalizedClass)) return { moduleKey: 'hardware', label: 'Hardware' };
    if (/(discos|riel|accessory|component|componente)/.test(normalizedClass)) {
      return { moduleKey: 'review', label: 'Related Component', review: true, warning: 'Component/accessory rows need review before linking.' };
    }
  }
  if (getMappedImportValue(rowObj, mappings, 'Serial Number') || getMappedImportValue(rowObj, mappings, 'Warranty End Date')) return { moduleKey: 'hardware', label: 'Hardware' };
  if (getMappedImportValue(rowObj, mappings, 'Contract Number') && getMappedImportValue(rowObj, mappings, 'Expiration / Renewal Date')) return { moduleKey: 'contracts', label: 'Contract / Support Coverage' };
  if (getMappedImportValue(rowObj, mappings, 'License / Product') || getMappedImportValue(rowObj, mappings, 'Expiration / Renewal Date')) return { moduleKey: 'licenses', label: 'License' };
  return { moduleKey: 'review', label: 'Review needed', review: true, warning: 'Opriva could not identify a target module.' };
}
