// F3a — pure task filtering / grouping helpers for the Tasks screen.
// Operates on task display records shaped { id, row, meta }, using the fixed task
// column layout (only column 1's label differs by workspace; positions are stable):
//   0 Task · 1 Client/Department/Company · 2 Record · 3 Source · 4 Impact ·
//   5 Owner · 6 Priority · 7 Due · 8 Status · 9 Action
// No React, no store, no mutation of inputs.

import { daysUntil } from './dates.js';

export const TASK_FIELD = { title: 0, clientDept: 1, record: 2, source: 3, impact: 4, owner: 5, priority: 6, due: 7, status: 8, action: 9 };
export const TASK_STATUS_COLUMNS = ['To do', 'In progress', 'Blocked', 'Done'];

function str(v) { return v == null ? '' : String(v); }
function cell(rec, i) { var r = rec && rec.row; return Array.isArray(r) && r[i] != null ? String(r[i]) : ''; }

// Map any status string to a canonical board bucket.
export function normalizeStatus(s) {
  var v = str(s).toLowerCase();
  if (v.indexOf('progress') >= 0 || v === 'doing' || v === 'active') return 'In progress';
  if (v.indexOf('block') >= 0 || v.indexOf('wait') >= 0 || v.indexOf('hold') >= 0 || v.indexOf('escalat') >= 0) return 'Blocked';
  if (v.indexOf('done') >= 0 || v.indexOf('complete') >= 0 || v.indexOf('closed') >= 0 || v.indexOf('resolved') >= 0) return 'Done';
  return 'To do';
}
export function isDone(s) { return normalizeStatus(s) === 'Done'; }

// Overdue = due date in the past AND not done.
export function isOverdue(rec) {
  var d = daysUntil(cell(rec, TASK_FIELD.due));
  return d !== null && d < 0 && !isDone(cell(rec, TASK_FIELD.status));
}

// Free-text search across title, owner, status, record, priority, client/dept.
export function matchesSearch(rec, query) {
  var q = str(query).trim().toLowerCase();
  if (!q) return true;
  return [TASK_FIELD.title, TASK_FIELD.owner, TASK_FIELD.status, TASK_FIELD.record, TASK_FIELD.priority, TASK_FIELD.clientDept]
    .some(function (i) { return cell(rec, i).toLowerCase().indexOf(q) >= 0; });
}

// Structured filters: { status, priority, owner, linkedRecord, due }.
//   status   -> normalized bucket equality
//   priority -> case-insensitive equality
//   owner / linkedRecord -> case-insensitive substring
//   due -> 'overdue' | 'upcoming'
export function matchesFilters(rec, filters) {
  var f = filters || {};
  if (f.status && normalizeStatus(cell(rec, TASK_FIELD.status)) !== f.status) return false;
  if (f.priority && cell(rec, TASK_FIELD.priority).toLowerCase() !== str(f.priority).toLowerCase()) return false;
  if (f.owner && cell(rec, TASK_FIELD.owner).toLowerCase().indexOf(str(f.owner).toLowerCase()) < 0) return false;
  if (f.linkedRecord && cell(rec, TASK_FIELD.record).toLowerCase().indexOf(str(f.linkedRecord).toLowerCase()) < 0) return false;
  if (f.due === 'overdue' && !isOverdue(rec)) return false;
  if (f.due === 'upcoming') { var d = daysUntil(cell(rec, TASK_FIELD.due)); if (!(d !== null && d >= 0)) return false; }
  return true;
}

// View predicate: 'mine' (owner contains sessionOwner) | 'overdue' | else all.
export function matchesView(rec, view, sessionOwner) {
  if (view === 'mine') return cell(rec, TASK_FIELD.owner).toLowerCase().indexOf(str(sessionOwner).toLowerCase()) >= 0;
  if (view === 'overdue') return isOverdue(rec);
  return true;
}

/**
 * Filter task records by search + structured filters + view (AND). Pure.
 * @param {Array} records  display records { id, row, meta }
 * @param {{search?:string,filters?:object,view?:string,sessionOwner?:string}} opts
 */
export function filterTasks(records, opts) {
  var o = opts || {};
  return (Array.isArray(records) ? records : []).filter(function (rec) {
    return matchesSearch(rec, o.search) && matchesFilters(rec, o.filters) && matchesView(rec, o.view, o.sessionOwner);
  });
}

// Group records into the canonical status columns (To do / In progress / Blocked / Done).
export function groupTasksByStatus(records) {
  var groups = {};
  TASK_STATUS_COLUMNS.forEach(function (s) { groups[s] = []; });
  (Array.isArray(records) ? records : []).forEach(function (rec) {
    var bucket = normalizeStatus(cell(rec, TASK_FIELD.status));
    (groups[bucket] || (groups[bucket] = [])).push(rec);
  });
  return groups;
}

// Distinct, sorted non-empty values for a column (e.g. owners) — for filter selects.
export function distinctTaskValues(records, fieldIndex) {
  var seen = {};
  (Array.isArray(records) ? records : []).forEach(function (rec) {
    var v = cell(rec, fieldIndex).trim();
    if (v && v !== '-') seen[v] = true;
  });
  return Object.keys(seen).sort();
}
