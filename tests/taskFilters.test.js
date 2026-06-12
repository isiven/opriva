// F3a — tests for pure task filtering helpers (node:test + node:assert/strict).

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TASK_FIELD, TASK_STATUS_COLUMNS, normalizeStatus, isDone, isOverdue,
  matchesSearch, matchesFilters, matchesView, filterTasks, groupTasksByStatus, distinctTaskValues,
} from '../source/utils/taskFilters.js';

function dateOffset(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
// Build a task record from named fields (row order matches the task columns).
function task(o) {
  const row = [];
  row[TASK_FIELD.title] = o.title || 'Task';
  row[TASK_FIELD.clientDept] = o.clientDept || '-';
  row[TASK_FIELD.record] = o.record || '-';
  row[TASK_FIELD.source] = o.source || 'licenses';
  row[TASK_FIELD.impact] = o.impact || '-';
  row[TASK_FIELD.owner] = o.owner || 'Unassigned';
  row[TASK_FIELD.priority] = o.priority || 'Medium';
  row[TASK_FIELD.due] = o.due || '';
  row[TASK_FIELD.status] = o.status || 'Open';
  row[TASK_FIELD.action] = 'Open task';
  return { id: o.id || 'task-' + Math.random().toString(36).slice(2), row, meta: o.meta || null };
}

test('normalizeStatus maps to canonical buckets', () => {
  assert.equal(normalizeStatus('Open'), 'To do');
  assert.equal(normalizeStatus('In progress'), 'In progress');
  assert.equal(normalizeStatus('Waiting legal'), 'Blocked');
  assert.equal(normalizeStatus('Blocked'), 'Blocked');
  assert.equal(normalizeStatus('Escalated'), 'Blocked');
  assert.equal(normalizeStatus('Done'), 'Done');
  assert.equal(normalizeStatus('Completed'), 'Done');
  assert.equal(normalizeStatus(''), 'To do');
  assert.deepEqual(TASK_STATUS_COLUMNS, ['To do', 'In progress', 'Blocked', 'Done']);
});

test('isOverdue: past due + not done', () => {
  assert.equal(isOverdue(task({ due: dateOffset(-2), status: 'Open' })), true);
  assert.equal(isOverdue(task({ due: dateOffset(-2), status: 'Done' })), false); // done -> not overdue
  assert.equal(isOverdue(task({ due: dateOffset(5), status: 'Open' })), false);   // future
  assert.equal(isOverdue(task({ status: 'Open' })), false);                        // no due
  assert.equal(isDone(task({ status: 'Completed' }).row[TASK_FIELD.status]), true);
});

test('matchesSearch over title/owner/status/record/priority', () => {
  const t = task({ title: 'Renew SSL', owner: 'María Chen', status: 'Blocked', record: 'Grupo Regency', priority: 'Critical' });
  assert.equal(matchesSearch(t, ''), true);
  assert.equal(matchesSearch(t, 'ssl'), true);        // title
  assert.equal(matchesSearch(t, 'maría'), true);      // owner
  assert.equal(matchesSearch(t, 'blocked'), true);    // status
  assert.equal(matchesSearch(t, 'regency'), true);    // record
  assert.equal(matchesSearch(t, 'critical'), true);   // priority
  assert.equal(matchesSearch(t, 'zzz'), false);
});

test('matchesFilters: status / priority / owner / linkedRecord / due', () => {
  const t = task({ status: 'In progress', priority: 'High', owner: 'Luis Mora', record: 'Banisi', due: dateOffset(-1) });
  assert.equal(matchesFilters(t, { status: 'In progress' }), true);
  assert.equal(matchesFilters(t, { status: 'Done' }), false);
  assert.equal(matchesFilters(t, { priority: 'high' }), true);
  assert.equal(matchesFilters(t, { owner: 'luis' }), true);
  assert.equal(matchesFilters(t, { linkedRecord: 'banisi' }), true);
  assert.equal(matchesFilters(t, { due: 'overdue' }), true);
  assert.equal(matchesFilters(t, { due: 'upcoming' }), false);
  assert.equal(matchesFilters(t, {}), true);
});

test('matchesView: mine / overdue / list', () => {
  const mine = task({ owner: 'María Chen' });
  assert.equal(matchesView(mine, 'mine', 'María Chen'), true);
  assert.equal(matchesView(task({ owner: 'Luis' }), 'mine', 'María Chen'), false);
  assert.equal(matchesView(task({ due: dateOffset(-1), status: 'Open' }), 'overdue'), true);
  assert.equal(matchesView(task({ due: dateOffset(5) }), 'overdue'), false);
  assert.equal(matchesView(task({}), 'list'), true);
});

test('filterTasks combines search + filters + view as AND', () => {
  const recs = [
    task({ title: 'A', owner: 'María Chen', status: 'Open', priority: 'High' }),
    task({ title: 'B', owner: 'Luis', status: 'Open', priority: 'High' }),
    task({ title: 'C', owner: 'María Chen', status: 'Done', priority: 'Low' }),
  ];
  const r = filterTasks(recs, { search: '', filters: { status: 'To do', priority: 'High' }, view: 'mine', sessionOwner: 'María Chen' });
  assert.equal(r.length, 1);
  assert.equal(r[0].row[TASK_FIELD.title], 'A');
});

test('groupTasksByStatus buckets into canonical columns', () => {
  const g = groupTasksByStatus([
    task({ title: 'a', status: 'Open' }),
    task({ title: 'b', status: 'In progress' }),
    task({ title: 'c', status: 'Waiting legal' }),
    task({ title: 'd', status: 'Done' }),
  ]);
  assert.equal(g['To do'].length, 1);
  assert.equal(g['In progress'].length, 1);
  assert.equal(g['Blocked'].length, 1);
  assert.equal(g['Done'].length, 1);
});

test('distinctTaskValues returns sorted unique owners', () => {
  const owners = distinctTaskValues([task({ owner: 'Luis' }), task({ owner: 'Ana' }), task({ owner: 'Luis' }), task({ owner: '-' })], TASK_FIELD.owner);
  assert.deepEqual(owners, ['Ana', 'Luis']);
});

test('filterTasks does not mutate input', () => {
  const recs = [task({ title: 'A', status: 'Open' }), task({ title: 'B', status: 'Done' })];
  const len = recs.length;
  filterTasks(recs, { filters: { status: 'Done' } });
  groupTasksByStatus(recs);
  assert.equal(recs.length, len);
  assert.equal(recs[0].row[TASK_FIELD.title], 'A');
});

test('non-array / empty inputs are safe', () => {
  assert.deepEqual(filterTasks(undefined, {}), []);
  assert.deepEqual(distinctTaskValues(null, 5), []);
  const g = groupTasksByStatus([]);
  assert.deepEqual(g['To do'], []);
});
