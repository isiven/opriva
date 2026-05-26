import { RECORD_STORE } from './recordStore.js';

// Returns the workspace-correct column array for any module.
// Mirrors the column definitions in each Screen wrapper component exactly,
// so rec.row[i] maps cleanly to cols[i] in openLinkedRecord.
export function getModuleColumns(moduleKey, workspaceMode) {
  var isIT = workspaceMode === 'Internal IT';
  if (moduleKey === 'licenses') return isIT
    ? ['License / Product','Brand','Provider','Department','Quantity','Renewal','Value','Approval status','Owner','Status','Action']
    : ['License / Product','Client','Brand','Distributor','Quantity','Renewal','Value','Margin','Owner','Status','Action'];
  if (moduleKey === 'hardware') return isIT
    ? ['Asset','Type','Brand','Model','Serial','Department','Provider','Warranty end','Approval status','Owner','Status','Risk','Action']
    : ['Asset','Type','Client','Brand','Model','Serial','Warranty end','Support','Owner','Status','Risk','Action'];
  if (moduleKey === 'contracts') return isIT
    ? ['Contract','Type','Department','Provider','Owner','Document','Renewal','Notice','Approval status','Next action','Risk']
    : ['Contract','Type','Client','Provider / Distributor','Owner','Document','Renewal','Notice','Legal status','Next action','Risk'];
  if (moduleKey === 'documents') return isIT
    ? ['Document','Type','Linked record','Department','Uploaded by','Version','Access','Requirement','Status']
    : ['Document','Type','Linked record','Client','Uploaded by','Version','Access','Requirement','Status'];
  return [];
}

// Returns the row index for the Client / Department column in a module's mock rows.
export function getModuleClientDeptIndex(moduleKey, workspaceMode) {
  var isIT = workspaceMode === 'Internal IT';
  if (moduleKey === 'licenses') return isIT ? 3 : 1;
  if (moduleKey === 'hardware') return isIT ? 5 : 2;
  if (moduleKey === 'contracts') return 2; // same index for both modes
  if (moduleKey === 'documents') return 3; // same index for both modes
  return -1;
}

export function getImportSandboxRecords(moduleKey, workspaceMode) {
  return Array.isArray(RECORD_STORE[moduleKey])
    ? RECORD_STORE[moduleKey].filter(function(record) {
        return record && record.meta && record.meta.source === 'importSandbox' && (!record.meta.workspaceMode || record.meta.workspaceMode === workspaceMode);
      })
    : [];
}

export function isLocalStoreRecord(record, workspaceMode) {
  if (!record || !Array.isArray(record.row)) return false;
  var meta = record.meta || {};
  if (meta.source === 'demoSeed') return false;
  if (meta.workspaceMode && meta.workspaceMode !== workspaceMode) return false;
  return meta.source === 'importSandbox'
    || meta.source === 'userCreated'
    || meta.source === 'supportCoverage'
    || meta.source === 'documentAttached'
    || (typeof record.id === 'string' && record.id.indexOf('sc-') === 0);
}

export function getLocalStoreRecords(moduleKey, workspaceMode) {
  return Array.isArray(RECORD_STORE[moduleKey])
    ? RECORD_STORE[moduleKey].filter(function(record) { return isLocalStoreRecord(record, workspaceMode); })
    : [];
}

export function getRecordCell(record, columns, fieldNames) {
  if (!record || !Array.isArray(record.row)) return '';
  for (var i = 0; i < fieldNames.length; i += 1) {
    var index = columns.indexOf(fieldNames[i]);
    if (index >= 0 && record.row[index] && record.row[index] !== '-') return record.row[index];
  }
  return '';
}
