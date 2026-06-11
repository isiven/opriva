// F1b — local/sandbox reporting engine for the 7 approved reports.
// Pure, side-effect-free, no browser APIs. Reads ONLY local/session records via
// existing selectors and canonical `meta.*` (never arbitrary row[i]). Never mutates
// RECORD_STORE or input arrays.
//
//   computeReport(reportKey, ctx, filters)  — pure core (testable with a synthetic ctx)
//   buildReport(reportKey, workspaceMode, filters) — store wrapper (gathers ctx)
//   REPORT_DEFS — the 7 report definitions
//
// Sample-vs-local rule (mirrors C10): when the relevant local source is empty the
// report returns clearly-labeled sample rows (hasLocalData=false).

import { RECORD_STORE } from './recordStore.js';
import { getLocalStoreRecords } from './recordSelectors.js';
import { daysUntil, calcRiskLevel } from '../utils/dates.js';
import { formatImportMoney } from '../importSandbox/importFormatting.js';

// ── tiny helpers (pure) ──────────────────────────────────────────────────────
function str(v) { return v == null ? '' : String(v); }
function dash(v) { var s = str(v).trim(); return s === '' ? '-' : s; }
function metaOf(rec) { return (rec && rec.meta) || {}; }

function ownerMissing(owner) {
  var o = str(owner).trim().toLowerCase();
  return o === '' || o === '-' || o === 'unassigned' || o === 'sin asignar' || o === 'n/a' || o === 'missing';
}

function typeLabel(moduleKey) {
  if (moduleKey === 'licenses') return 'License';
  if (moduleKey === 'hardware') return 'Hardware';
  if (moduleKey === 'contracts') return 'Contract';
  if (moduleKey === 'documents') return 'Document';
  return moduleKey || '-';
}

function recordName(rec) {
  var m = metaOf(rec);
  return m.displayName || m.productLicenseName || (Array.isArray(rec && rec.row) && rec.row[0]) || 'Record';
}

function moneyCell(value) {
  var s = str(value).trim();
  return s === '' ? '-' : formatImportMoney(value);
}

function riskOf(rec) {
  var m = metaOf(rec);
  return calcRiskLevel(m.expirationRenewalDate, m.alertPolicy, m.customReminderDays, m.businessCriticality);
}

function renewalRecords(ctx) {
  return [].concat(ctx.licenses || [], ctx.hardware || [], ctx.contracts || []);
}

// Record-level filters shared by the renewal-based reports.
function passesRecordFilters(rec, filters) {
  var m = metaOf(rec);
  if (filters.owner && str(m.owner).toLowerCase().indexOf(str(filters.owner).toLowerCase()) === -1) return false;
  if (filters.risk && riskOf(rec).toLowerCase() !== str(filters.risk).toLowerCase()) return false;
  if (filters.module) {
    var mod = str(filters.module).toLowerCase();
    if (str(m.moduleKey).toLowerCase().indexOf(mod) === -1 && typeLabel(m.moduleKey).toLowerCase().indexOf(mod) === -1) return false;
  }
  return true;
}

// Set of linked-record names (lowercased) referenced by local documents.
function documentLinkSet(ctx) {
  var set = {};
  (ctx.documents || []).forEach(function (doc) {
    var m = metaOf(doc);
    var name = str(m.linkedRecordName).trim().toLowerCase();
    if (name) set[name] = true;
  });
  return set;
}

// ── report definitions ───────────────────────────────────────────────────────
export const REPORT_DEFS = [
  {
    key: 'renewal-exposure',
    title: 'Renewal Exposure Report',
    columns: ['Record', 'Type', 'Owner', 'Client / Department', 'Provider / Vendor', 'Renewal date', 'Value', 'Risk'],
    hasData: function (ctx) { return renewalRecords(ctx).length > 0; },
    build: function (ctx, filters) {
      return renewalRecords(ctx)
        .filter(function (rec) { return passesRecordFilters(rec, filters); })
        .map(function (rec) {
          var m = metaOf(rec);
          return [
            recordName(rec), typeLabel(m.moduleKey), dash(m.owner), dash(m.clientDepartment),
            dash(m.providerDistributor || m.brandManufacturer), dash(m.expirationRenewalDate),
            moneyCell(m.commercialValue), riskOf(rec),
          ];
        });
    },
    sample: [
      ['Microsoft 365 Enterprise', 'License', 'Ana Ruiz', 'Grupo Regency', 'Licencias Online', '2026-06-30', '$142,000', 'High'],
      ['Dell PowerEdge R750', 'Hardware', 'Unassigned', 'Banisi', 'Dell Direct', '2026-07-18', '$22,400', 'Medium'],
    ],
  },
  {
    key: 'expiring-soon',
    title: 'Expiring Soon Report',
    columns: ['Record', 'Type', 'Owner', 'Renewal date', 'Days left', 'Risk'],
    hasData: function (ctx) { return renewalRecords(ctx).length > 0; },
    build: function (ctx, filters) {
      var win = filters.windowDays;
      var limit = (win === 'all') ? null : (parseInt(win, 10) || 90);
      return renewalRecords(ctx)
        .filter(function (rec) { return passesRecordFilters(rec, filters); })
        .map(function (rec) { return { rec: rec, days: daysUntil(metaOf(rec).expirationRenewalDate) }; })
        .filter(function (x) { return x.days !== null && x.days >= 0 && (limit === null || x.days <= limit); })
        .sort(function (a, b) { return a.days - b.days; })
        .map(function (x) {
          var m = metaOf(x.rec);
          return [recordName(x.rec), typeLabel(m.moduleKey), dash(m.owner), dash(m.expirationRenewalDate), x.days + ' days', riskOf(x.rec)];
        });
    },
    sample: [
      ['SSL Wildcard Certificate', 'Contract', 'Unassigned', '2026-05-23', '9 days', 'Critical'],
      ['Trend Micro Vision One', 'License', 'María Chen', '2026-05-26', '12 days', 'High'],
    ],
  },
  {
    key: 'missing-owners',
    title: 'Missing Owners Report',
    columns: ['Record', 'Type', 'Client / Department', 'Renewal date', 'Value'],
    hasData: function (ctx) { return renewalRecords(ctx).length > 0; },
    build: function (ctx, filters) {
      return renewalRecords(ctx)
        .filter(function (rec) { return passesRecordFilters(rec, filters) && ownerMissing(metaOf(rec).owner); })
        .map(function (rec) {
          var m = metaOf(rec);
          return [recordName(rec), typeLabel(m.moduleKey), dash(m.clientDepartment), dash(m.expirationRenewalDate), moneyCell(m.commercialValue)];
        });
    },
    sample: [
      ['Wildcard SSL Certificate', 'Contract', 'Grupo Regency', '2026-05-23', '$3,200'],
      ['Trend Micro Vision One', 'License', 'Banisi', '2026-05-26', '$42,800'],
    ],
  },
  {
    key: 'missing-evidence',
    title: 'Missing Evidence / Documents Report',
    columns: ['Record', 'Type', 'Owner', 'Renewal date', 'Has document?'],
    hasData: function (ctx) { return renewalRecords(ctx).length > 0; },
    build: function (ctx, filters) {
      var links = documentLinkSet(ctx);
      return renewalRecords(ctx)
        .filter(function (rec) { return passesRecordFilters(rec, filters); })
        .filter(function (rec) { return !links[recordName(rec).toLowerCase()]; })
        .map(function (rec) {
          var m = metaOf(rec);
          return [recordName(rec), typeLabel(m.moduleKey), dash(m.owner), dash(m.expirationRenewalDate), 'No'];
        });
    },
    sample: [
      ['Oracle POS Support', 'Contract', 'Unassigned', '2026-07-18', 'No'],
      ['Fortinet Firewall Warranty', 'Hardware', 'Luis Mora', '2026-07-05', 'No'],
    ],
  },
  {
    key: 'tasks',
    title: 'Tasks Report',
    columns: ['Task', 'Status', 'Due date', 'Owner', 'Linked record'],
    hasData: function (ctx) { return (ctx.tasks || []).length > 0; },
    build: function (ctx, filters) {
      return (ctx.tasks || [])
        .filter(function (t) {
          if (filters.owner && str(t.owner).toLowerCase().indexOf(str(filters.owner).toLowerCase()) === -1) return false;
          if (filters.status && str(t.status).toLowerCase() !== str(filters.status).toLowerCase()) return false;
          return true;
        })
        .map(function (t) {
          return [dash(t.title), dash(t.status), dash(t.dueDate), dash(t.owner), dash(t.sourceRecordName || t.linkedRecordName)];
        });
    },
    sample: [
      ['Send Trend Micro renewal quote', 'Open', '2026-05-20', 'María Chen', 'Trend Micro Vision One'],
      ['Confirm budget owner', 'Blocked', '2026-06-01', 'Unassigned', 'Oracle POS Support'],
    ],
  },
  {
    key: 'activity-session',
    title: 'Activity Session Report',
    columns: ['Record', 'Module', 'Event', 'Timestamp', 'Actor'],
    hasData: function (ctx) { return (ctx.activity || []).length > 0; },
    build: function (ctx, filters) {
      return (ctx.activity || [])
        .filter(function (a) {
          if (filters.module && str(a.sourceModule).toLowerCase().indexOf(str(filters.module).toLowerCase()) === -1) return false;
          return true;
        })
        .map(function (a) {
          return [dash(a.sourceRecordName), dash(a.sourceModule), dash(a.title || a.eventType), dash(a.createdAt), dash(a.actor)];
        });
    },
    sample: [
      ['Microsoft 365 Enterprise', 'licenses', 'Record created', '2026-06-04T10:12:00.000Z', 'Current user'],
      ['Dell PowerEdge R750', 'hardware', 'Support coverage added', '2026-06-04T10:15:00.000Z', 'Current user'],
    ],
  },
  {
    key: 'import-results',
    title: 'Import Results Report',
    columns: ['Module', 'Records imported', 'Source', 'Session'],
    hasData: function (ctx) {
      return ['licenses', 'hardware', 'contracts', 'documents'].some(function (k) {
        return (ctx[k] || []).some(function (rec) { return metaOf(rec).source === 'importSandbox'; });
      });
    },
    build: function (ctx) {
      return ['licenses', 'hardware', 'contracts', 'documents']
        .map(function (k) {
          var n = (ctx[k] || []).filter(function (rec) { return metaOf(rec).source === 'importSandbox'; }).length;
          return { module: typeLabel(k), n: n };
        })
        .filter(function (x) { return x.n > 0; })
        .map(function (x) { return [x.module, String(x.n), 'importSandbox', 'Current session']; });
    },
    sample: [
      ['License', '12', 'importSandbox', 'Current session'],
      ['Hardware', '5', 'importSandbox', 'Current session'],
    ],
  },
];

function findDef(reportKey) {
  for (var i = 0; i < REPORT_DEFS.length; i++) {
    if (REPORT_DEFS[i].key === reportKey) return REPORT_DEFS[i];
  }
  return REPORT_DEFS[0]; // unknown key -> safe default (renewal-exposure)
}

/**
 * Pure report builder. Takes a context of local record arrays and returns the
 * report shape. No store access, no mutation.
 * @param {string} reportKey
 * @param {{workspaceMode?:string,licenses?:Array,hardware?:Array,contracts?:Array,documents?:Array,tasks?:Array,activity?:Array}} ctx
 * @param {object} [filters]
 * @returns {{key:string,title:string,columns:Array<string>,rows:Array<Array>,hasLocalData:boolean,count:number,caption:string}}
 */
export function computeReport(reportKey, ctx, filters) {
  var c = ctx || {};
  var f = filters || {};
  var def = findDef(reportKey);
  var hasLocalData = !!def.hasData(c);
  var rows = hasLocalData
    ? def.build(c, f)
    : def.sample.map(function (r) { return r.slice(); });
  return {
    key: def.key,
    title: def.title,
    columns: def.columns.slice(),
    rows: rows,
    hasLocalData: hasLocalData,
    count: rows.length,
    caption: hasLocalData ? 'Local session report — not persisted.' : 'Sample data — not live reports.',
  };
}

// Gather local/session records for a workspace (store wrapper, no mutation).
function gather(workspaceMode) {
  function byWorkspace(arr) {
    return (Array.isArray(arr) ? arr : []).filter(function (x) {
      return x && (!x.workspaceMode || x.workspaceMode === workspaceMode);
    });
  }
  return {
    workspaceMode: workspaceMode,
    licenses: getLocalStoreRecords('licenses', workspaceMode),
    hardware: getLocalStoreRecords('hardware', workspaceMode),
    contracts: getLocalStoreRecords('contracts', workspaceMode),
    documents: getLocalStoreRecords('documents', workspaceMode),
    tasks: byWorkspace(RECORD_STORE.tasks),
    activity: byWorkspace(RECORD_STORE.activity),
  };
}

/**
 * Store-backed report builder used by the UI. Reads local/session records for the
 * workspace and delegates to computeReport.
 */
export function buildReport(reportKey, workspaceMode, filters) {
  return computeReport(reportKey, gather(workspaceMode), filters || {});
}
