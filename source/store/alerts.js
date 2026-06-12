// F2a — Local Alerts Sandbox engine. Pure `computeAlerts` + store-backed getters +
// in-memory session state (seen / resolved / snoozed). No backend, no browser APIs.
// Never mutates RECORD_STORE or input arrays. Stable, deterministic alert IDs so
// session state survives recomputes. Badge counts ONLY real local records
// (getLocalStoreRecords excludes demo seeds) — an empty session yields 0.

import { RECORD_STORE } from './recordStore.js';
import { getLocalStoreRecords } from './recordSelectors.js';
import { daysUntil, calcRiskLevel } from '../utils/dates.js';

// ── session state: alertId -> { seen, resolved, snoozed } ─────────────────────
var ALERT_STATE = {};
export function resetAlertState() { ALERT_STATE = {}; } // test/util only
function stateFor(id) { return ALERT_STATE[id] || {}; }
function setState(id, patch) { ALERT_STATE[id] = Object.assign({}, ALERT_STATE[id], patch); }
export function markSeen(id) { if (id) setState(id, { seen: true }); }
export function resolveAlert(id) { if (id) setState(id, { resolved: true }); }
export function snoozeAlert(id) { if (id) setState(id, { snoozed: true }); }
export function reopenAlert(id) { if (id) setState(id, { resolved: false, snoozed: false }); }

// ── helpers (pure) ────────────────────────────────────────────────────────────
function str(v) { return v == null ? '' : String(v); }
function metaOf(rec) { return (rec && rec.meta) || {}; }
function ownerMissing(owner) {
  var o = str(owner).trim().toLowerCase();
  return o === '' || o === '-' || o === 'unassigned' || o === 'sin asignar' || o === 'n/a' || o === 'missing';
}
function typeLabel(moduleKey) {
  if (moduleKey === 'licenses') return 'License';
  if (moduleKey === 'hardware') return 'Hardware';
  if (moduleKey === 'contracts') return 'Contract';
  if (moduleKey === 'tasks') return 'Task';
  return moduleKey || '-';
}
function recordName(rec) {
  var m = metaOf(rec);
  return m.displayName || m.productLicenseName || (Array.isArray(rec && rec.row) && rec.row[0]) || 'Record';
}
function slug(s) { return str(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
function renewalRecords(ctx) { return [].concat(ctx.licenses || [], ctx.hardware || [], ctx.contracts || []); }
function documentLinkSet(ctx) {
  var set = {};
  (ctx.documents || []).forEach(function (doc) {
    var name = str(metaOf(doc).linkedRecordName).trim().toLowerCase();
    if (name) set[name] = true;
  });
  return set;
}
function isDoneStatus(status) {
  var s = str(status).toLowerCase();
  return s === 'done' || s === 'complete' || s === 'completed' || s === 'closed' || s === 'resolved';
}

/**
 * Pure: build the raw alert list from a context of local record arrays.
 * @param {{licenses?:Array,hardware?:Array,contracts?:Array,documents?:Array,tasks?:Array}} ctx
 * @param {string} workspaceMode
 * @returns {Array<object>} alert objects (without session state attached)
 */
export function computeAlerts(ctx, workspaceMode) {
  var c = ctx || {};
  var alerts = [];
  var links = documentLinkSet(c);

  renewalRecords(c).forEach(function (rec) {
    var m = metaOf(rec);
    var name = recordName(rec);
    var rid = rec && rec.id ? rec.id : slug(name);
    var rtype = typeLabel(m.moduleKey);
    var owner = str(m.owner) || 'Unassigned';
    var dept = str(m.clientDepartment);
    var days = daysUntil(m.expirationRenewalDate);
    var risk = calcRiskLevel(m.expirationRenewalDate, m.alertPolicy, m.customReminderDays, m.businessCriticality);

    function base(type, severity, title, detail) {
      return {
        id: type + ':' + rid, type: type, severity: severity, title: title, detail: detail,
        module: m.moduleKey, recordId: rid, recordName: name, recordType: rtype,
        owner: owner, clientOrDept: dept, dueDate: m.expirationRenewalDate || null,
        daysLeft: days, workspaceMode: workspaceMode,
      };
    }

    // urgency — one per record (most relevant bucket)
    if (days !== null && days < 0) {
      alerts.push(base('expired', 'critical', name + ' has expired', Math.abs(days) + ' days overdue · ' + rtype));
    } else if (days !== null && days <= 30) {
      alerts.push(base('expiring30', days <= 7 ? 'critical' : 'high', name + ' expires in ' + days + ' days', rtype + ' · renewal due soon'));
    } else if (days !== null && days <= 90) {
      alerts.push(base('dueSoon', 'medium', name + ' due in ' + days + ' days', rtype + ' · within 90 days'));
    } else if (risk === 'Critical' || risk === 'High') {
      alerts.push(base('risk', risk === 'Critical' ? 'critical' : 'high', name + ' is ' + risk.toLowerCase() + ' risk', rtype + ' · ' + risk + ' criticality'));
    }

    // ownership
    if (ownerMissing(m.owner)) {
      alerts.push(base('missingOwner', 'medium', name + ' has no owner', rtype + ' · assign a responsible owner'));
    }

    // evidence (honest local signal: no linked document)
    if (!links[name.toLowerCase()]) {
      alerts.push(base('missingEvidence', 'low', name + ' has no linked document', rtype + ' · evidence missing'));
    }
  });

  // overdue tasks — RECORD_STORE.tasks is shaped { id, row, meta }; read t.meta.*
  (c.tasks || []).forEach(function (t) {
    var tm = (t && t.meta) || t || {};
    var d = daysUntil(tm.dueDate);
    if (d !== null && d < 0 && !isDoneStatus(tm.status)) {
      var tname = tm.title || 'Task';
      var tid = t && t.id ? t.id : slug(tname);
      alerts.push({
        id: 'overdueTask:' + tid, type: 'overdueTask', severity: 'high',
        title: 'Overdue task: ' + tname, detail: Math.abs(d) + ' days overdue · ' + (tm.status || 'Open'),
        module: 'tasks', recordId: tid, recordName: tname, recordType: 'Task',
        owner: str(tm.owner) || 'Unassigned', clientOrDept: str(tm.sourceClientOrDepartment),
        dueDate: tm.dueDate || null, daysLeft: d, workspaceMode: workspaceMode,
      });
    }
  });

  return alerts;
}

var SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 };
function sortAlerts(a, b) {
  var s = (SEVERITY_RANK[a.severity] != null ? SEVERITY_RANK[a.severity] : 9) - (SEVERITY_RANK[b.severity] != null ? SEVERITY_RANK[b.severity] : 9);
  if (s !== 0) return s;
  var ad = a.daysLeft == null ? 99999 : a.daysLeft;
  var bd = b.daysLeft == null ? 99999 : b.daysLeft;
  return ad - bd;
}

function withState(alerts) {
  return alerts.map(function (a) {
    var st = stateFor(a.id);
    return Object.assign({}, a, { seen: !!st.seen, resolved: !!st.resolved, snoozed: !!st.snoozed });
  });
}

// ── store-backed getters (read local/session records, no mutation) ────────────
function gather(workspaceMode) {
  return {
    workspaceMode: workspaceMode,
    licenses: getLocalStoreRecords('licenses', workspaceMode),
    hardware: getLocalStoreRecords('hardware', workspaceMode),
    contracts: getLocalStoreRecords('contracts', workspaceMode),
    documents: getLocalStoreRecords('documents', workspaceMode),
    tasks: (Array.isArray(RECORD_STORE.tasks) ? RECORD_STORE.tasks : []).filter(function (t) {
      var wm = t && t.meta && t.meta.workspaceMode;
      return !wm || wm === workspaceMode;
    }),
  };
}

/** All alerts for the workspace, with session state attached, severity-sorted. */
export function getLocalAlerts(workspaceMode) {
  return withState(computeAlerts(gather(workspaceMode), workspaceMode)).sort(sortAlerts);
}
/** Open alerts (not resolved, not snoozed). */
export function getOpenAlerts(workspaceMode) {
  return getLocalAlerts(workspaceMode).filter(function (a) { return !a.resolved && !a.snoozed; });
}
/** Resolved alerts (for the Resolved tab). */
export function getResolvedAlerts(workspaceMode) {
  return getLocalAlerts(workspaceMode).filter(function (a) { return a.resolved; });
}
/** Badge = open, not snoozed, not yet seen. Only real local records (no demo seeds). */
export function getAlertBadgeCount(workspaceMode) {
  return getLocalAlerts(workspaceMode).filter(function (a) { return !a.resolved && !a.snoozed && !a.seen; }).length;
}
