// F1b — tests for the local reporting engine (node:test + node:assert/strict).
// Most cases use the pure `computeReport(reportKey, ctx, filters)` with a synthetic
// ctx (no RECORD_STORE mutation). A few `buildReport` cases exercise the store wrapper.

import test from 'node:test';
import assert from 'node:assert/strict';
import { REPORT_DEFS, computeReport, buildReport } from '../source/store/reports.js';
import { formatImportMoney } from '../source/importSandbox/importFormatting.js';
import { RECORD_STORE } from '../source/store/recordStore.js';

function dateOffset(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Build a canonical record (licenses/hardware/contracts/documents).
function rec(moduleKey, meta) {
  return { id: 'x-' + Math.random().toString(36).slice(2), row: [meta.displayName || 'Record'], meta: Object.assign({ moduleKey }, meta) };
}
function ctxOf(over) {
  return Object.assign(
    { workspaceMode: 'MSP / Integrator', licenses: [], hardware: [], contracts: [], documents: [], tasks: [], activity: [] },
    over || {}
  );
}

test('REPORT_DEFS contains the 7 approved reports', () => {
  assert.equal(REPORT_DEFS.length, 7);
  assert.deepEqual(REPORT_DEFS.map((d) => d.key), [
    'renewal-exposure', 'expiring-soon', 'missing-owners', 'missing-evidence',
    'tasks', 'activity-session', 'import-results',
  ]);
  REPORT_DEFS.forEach((d) => {
    assert.ok(d.title && Array.isArray(d.columns) && d.columns.length > 0);
    assert.ok(Array.isArray(d.sample) && d.sample.length > 0);
  });
});

test('unknown key falls back to a safe default (renewal-exposure)', () => {
  const r = computeReport('does-not-exist', ctxOf(), {});
  assert.equal(r.key, 'renewal-exposure');
});

test('no local data -> sample rows, hasLocalData false, sample caption (all 7)', () => {
  REPORT_DEFS.forEach((d) => {
    const r = computeReport(d.key, ctxOf(), {});
    assert.equal(r.hasLocalData, false, d.key);
    assert.equal(r.caption, 'Sample data — not live reports.', d.key);
    assert.ok(r.rows.length > 0, d.key);
    assert.equal(r.count, r.rows.length, d.key);
    assert.deepEqual(r.columns, d.columns, d.key);
  });
});

test('Renewal Exposure: rows from local records with canonical values', () => {
  const ctx = ctxOf({
    licenses: [rec('licenses', { displayName: 'Microsoft 365', owner: 'Ana Ruiz', clientDepartment: 'Grupo Regency', providerDistributor: 'Licencias Online', expirationRenewalDate: dateOffset(60), commercialValue: '142000' })],
    hardware: [rec('hardware', { displayName: 'Dell R750', owner: 'Unassigned', clientDepartment: 'Banisi', brandManufacturer: 'Dell', expirationRenewalDate: dateOffset(18), commercialValue: '22400' })],
  });
  const r = computeReport('renewal-exposure', ctx, {});
  assert.equal(r.hasLocalData, true);
  assert.equal(r.caption, 'Local session report — not persisted.');
  assert.equal(r.rows.length, 2);
  assert.equal(r.rows[0][0], 'Microsoft 365');
  assert.equal(r.rows[0][1], 'License');
  assert.equal(r.rows[0][2], 'Ana Ruiz');
  assert.equal(r.rows[0][6], formatImportMoney('142000')); // Value formatted
  assert.equal(r.rows[1][1], 'Hardware');
  assert.equal(r.rows[1][4], 'Dell'); // provider falls back to brand
});

test('Expiring Soon: windowDays filters and excludes overdue / no-date', () => {
  const ctx = ctxOf({
    licenses: [
      rec('licenses', { displayName: 'L20', expirationRenewalDate: dateOffset(20) }),
      rec('licenses', { displayName: 'L45', expirationRenewalDate: dateOffset(45) }),
      rec('licenses', { displayName: 'L80', expirationRenewalDate: dateOffset(80) }),
      rec('licenses', { displayName: 'Lover', expirationRenewalDate: dateOffset(-5) }), // overdue
      rec('licenses', { displayName: 'Lnodate' }), // no date
    ],
  });
  assert.equal(computeReport('expiring-soon', ctx, { windowDays: 30 }).rows.length, 1);
  assert.equal(computeReport('expiring-soon', ctx, { windowDays: 60 }).rows.length, 2);
  assert.equal(computeReport('expiring-soon', ctx, { windowDays: 90 }).rows.length, 3);
  assert.equal(computeReport('expiring-soon', ctx, { windowDays: 'all' }).rows.length, 3);
  // sorted ascending by days left
  assert.equal(computeReport('expiring-soon', ctx, { windowDays: 90 }).rows[0][0], 'L20');
  assert.equal(computeReport('expiring-soon', ctx, {}).rows.length, 3); // default window 90
});

test('Missing Owners: detects blank / Unassigned / Sin asignar / dash', () => {
  const ctx = ctxOf({
    contracts: [
      rec('contracts', { displayName: 'C-blank', owner: '' }),
      rec('contracts', { displayName: 'C-unassigned', owner: 'Unassigned' }),
      rec('contracts', { displayName: 'C-sinasignar', owner: 'Sin asignar' }),
      rec('contracts', { displayName: 'C-dash', owner: '-' }),
      rec('contracts', { displayName: 'C-owned', owner: 'Ana Ruiz' }),
    ],
  });
  const r = computeReport('missing-owners', ctx, {});
  assert.equal(r.rows.length, 4);
  assert.ok(!r.rows.some((row) => row[0] === 'C-owned'));
});

test('Missing Evidence: excludes records that have a linked document', () => {
  const ctx = ctxOf({
    licenses: [rec('licenses', { displayName: 'Rec A' }), rec('licenses', { displayName: 'Rec B' })],
    documents: [rec('documents', { displayName: 'Contract A.pdf', linkedRecordName: 'Rec A' })],
  });
  const r = computeReport('missing-evidence', ctx, {});
  assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0][0], 'Rec B');
  assert.equal(r.rows[0][4], 'No');
});

test('Tasks: reads the real { id, row, meta } task shape (F2a hotfix)', () => {
  const ctx = ctxOf({
    tasks: [{ id: 'task-1', row: ['Send quote'], meta: { title: 'Send quote', status: 'Open', dueDate: '2026-05-20', owner: 'María Chen', sourceRecordName: 'Trend Micro' } }],
  });
  const r = computeReport('tasks', ctx, {});
  assert.equal(r.hasLocalData, true);
  assert.deepEqual(r.rows[0], ['Send quote', 'Open', '2026-05-20', 'María Chen', 'Trend Micro']);
});

test('Activity Session: rows from activity events', () => {
  const ctx = ctxOf({
    activity: [{ sourceRecordName: 'Microsoft 365', sourceModule: 'licenses', title: 'Record created', createdAt: '2026-06-04T10:12:00.000Z', actor: 'Current user' }],
  });
  const r = computeReport('activity-session', ctx, {});
  assert.deepEqual(r.rows[0], ['Microsoft 365', 'licenses', 'Record created', '2026-06-04T10:12:00.000Z', 'Current user']);
});

test('Import Results: groups importSandbox records by module', () => {
  const ctx = ctxOf({
    licenses: [rec('licenses', { source: 'importSandbox' }), rec('licenses', { source: 'importSandbox' })],
    hardware: [rec('hardware', { source: 'importSandbox' })],
    contracts: [rec('contracts', { source: 'userCreated' })], // not an import -> excluded
  });
  const r = computeReport('import-results', ctx, {});
  assert.equal(r.hasLocalData, true);
  assert.deepEqual(r.rows, [
    ['License', '2', 'importSandbox', 'Current session'],
    ['Hardware', '1', 'importSandbox', 'Current session'],
  ]);
});

test('filters: owner / risk / module on Renewal Exposure', () => {
  const ctx = ctxOf({
    licenses: [rec('licenses', { displayName: 'L1', owner: 'Ana Ruiz', expirationRenewalDate: dateOffset(5) })],   // Critical
    hardware: [rec('hardware', { displayName: 'H1', owner: 'Luis Mora', expirationRenewalDate: dateOffset(200) })], // Low
  });
  assert.equal(computeReport('renewal-exposure', ctx, { owner: 'ana' }).rows.length, 1);
  assert.equal(computeReport('renewal-exposure', ctx, { risk: 'Critical' }).rows.length, 1);
  assert.equal(computeReport('renewal-exposure', ctx, { module: 'license' }).rows.length, 1);
  assert.equal(computeReport('renewal-exposure', ctx, { module: 'license' }).rows[0][0], 'L1');
});

test('computeReport does not mutate input ctx arrays', () => {
  const ctx = ctxOf({
    licenses: [rec('licenses', { displayName: 'L', owner: '', expirationRenewalDate: dateOffset(10), commercialValue: '100' })],
    tasks: [{ title: 'T', status: 'Open' }],
  });
  const beforeLic = ctx.licenses.length;
  const beforeTasks = ctx.tasks.length;
  computeReport('renewal-exposure', ctx, {});
  computeReport('missing-owners', ctx, {});
  computeReport('tasks', ctx, {});
  assert.equal(ctx.licenses.length, beforeLic);
  assert.equal(ctx.tasks.length, beforeTasks);
});

// ── buildReport store wrapper (RECORD_STORE injection, with cleanup) ──
test('buildReport reads RECORD_STORE (tasks) and is workspace-scoped', () => {
  const savedTasks = RECORD_STORE.tasks;
  try {
    RECORD_STORE.tasks = [
      { id: 'task-a', row: ['WS task'], meta: { title: 'WS task', status: 'Open', dueDate: '2026-05-20', owner: 'Maria', sourceRecordName: 'Lic', workspaceMode: 'MSP / Integrator' } },
      { id: 'task-b', row: ['Other WS'], meta: { title: 'Other WS', status: 'Open', workspaceMode: 'Internal IT' } },
    ];
    const r = buildReport('tasks', 'MSP / Integrator', {});
    assert.equal(r.hasLocalData, true);
    assert.equal(r.rows.length, 1);
    assert.equal(r.rows[0][0], 'WS task');
  } finally {
    RECORD_STORE.tasks = savedTasks;
  }
});

test('buildReport with empty store -> sample (hasLocalData false)', () => {
  const savedTasks = RECORD_STORE.tasks;
  try {
    RECORD_STORE.tasks = [];
    const r = buildReport('tasks', 'MSP / Integrator', {});
    assert.equal(r.hasLocalData, false);
    assert.equal(r.caption, 'Sample data — not live reports.');
    assert.ok(r.rows.length > 0);
  } finally {
    RECORD_STORE.tasks = savedTasks;
  }
});
