export const RECORD_STORE = {
  licenses: [],
  hardware: [],
  contracts: [],
  clients: [],
  documents: [],
  tasks: [],
  activity: [],
};

export function createRecordId(moduleKey) {
  return moduleKey + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

export function toRecords(rows, moduleKey, metaDefaults) {
  return (Array.isArray(rows) ? rows : []).map(function(row) {
    var record = { id: createRecordId(moduleKey), row: Array.isArray(row) ? row : [] };
    if (metaDefaults) record.meta = Object.assign({ source: 'demoSeed', moduleKey: moduleKey }, metaDefaults);
    return record;
  });
}
