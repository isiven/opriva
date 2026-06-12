// F2a — tests for the local alerts engine (node:test + node:assert/strict).
// Pure type detection via computeAlerts(ctx); badge/state via the store getters
// with RECORD_STORE injection (reset in finally + resetAlertState between tests).

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAlerts, getOpenAlerts, getResolvedAlerts, getAlertBadgeCount,
  markSeen, resolveAlert, snoozeAlert, reopenAlert, resetAlertState,
} from '../source/store/alerts.js';
import { RECORD_STORE } from '../source/store/recordStore.js';

function dateOffset(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function rec(moduleKey, meta) {
  return { id: meta.id || ('x-' + Math.random().toString(36).slice(2)), row: [meta.displayName || 'Record'], meta: Object.assign({ moduleKey }, meta) };
}
function ctxOf(over) {
  return Object.assign({ workspaceMode: 'MSP / Integrator', licenses: [], hardware: [], contracts: [], documents: [], tasks: [] }, over || {});
}
function typesOf(alerts) { return alerts.map((a) => a.type); }

test('expired: record past its date -> critical expired alert', () => {
  const a = computeAlerts(ctxOf({ licenses: [rec('licenses', { displayName: 'L', owner: 'Ana', expirationRenewalDate: dateOffset(-5) })] }), 'MSP / Integrator');
  const expired = a.find((x) => x.type === 'expired');
  assert.ok(expired);
  assert.equal(expired.severity, 'critical');
  assert.equal(expired.recordName, 'L');
});

test('expiring <=30: high (>7) and critical (<=7)', () => {
  const a30 = computeAlerts(ctxOf({ licenses: [rec('licenses', { displayName: 'L30', owner: 'Ana', expirationRenewalDate: dateOffset(20) })] }), 'MSP / Integrator');
  assert.equal(a30.find((x) => x.type === 'expiring30').severity, 'high');
  const a7 = computeAlerts(ctxOf({ licenses: [rec('licenses', { displayName: 'L7', owner: 'Ana', expirationRenewalDate: dateOffset(5) })] }), 'MSP / Integrator');
  assert.equal(a7.find((x) => x.type === 'expiring30').severity, 'critical');
});

test('due soon 31-90 days -> medium dueSoon alert', () => {
  const a = computeAlerts(ctxOf({ contracts: [rec('contracts', { displayName: 'C', owner: 'Ana', expirationRenewalDate: dateOffset(60) })] }), 'MSP / Integrator');
  const due = a.find((x) => x.type === 'dueSoon');
  assert.ok(due);
  assert.equal(due.severity, 'medium');
});

test('missing owner -> missingOwner alert', () => {
  const a = computeAlerts(ctxOf({ hardware: [rec('hardware', { displayName: 'H', owner: 'Unassigned', expirationRenewalDate: dateOffset(200) })] }), 'MSP / Integrator');
  assert.ok(a.some((x) => x.type === 'missingOwner'));
});

test('critical/high risk (no near date) -> risk alert', () => {
  const crit = computeAlerts(ctxOf({ licenses: [rec('licenses', { displayName: 'LC', owner: 'Ana', businessCriticality: 'Critical' })] }), 'MSP / Integrator');
  const r = crit.find((x) => x.type === 'risk');
  assert.ok(r);
  assert.equal(r.severity, 'critical');
  const high = computeAlerts(ctxOf({ licenses: [rec('licenses', { displayName: 'LH', owner: 'Ana', businessCriticality: 'High' })] }), 'MSP / Integrator');
  assert.equal(high.find((x) => x.type === 'risk').severity, 'high');
});

test('overdue task read via task.meta (not flat)', () => {
  const task = { id: 'task-1', row: ['T'], meta: { title: 'Renew SSL', status: 'Open', dueDate: dateOffset(-3), workspaceMode: 'MSP / Integrator' } };
  const a = computeAlerts(ctxOf({ tasks: [task] }), 'MSP / Integrator');
  const od = a.find((x) => x.type === 'overdueTask');
  assert.ok(od);
  assert.equal(od.severity, 'high');
  assert.equal(od.recordName, 'Renew SSL');
  // done task -> no alert
  const doneTask = { id: 'task-2', row: ['T2'], meta: { title: 'Done', status: 'Closed', dueDate: dateOffset(-3) } };
  assert.equal(computeAlerts(ctxOf({ tasks: [doneTask] }), 'MSP / Integrator').length, 0);
});

test('missing evidence: only when no linked document', () => {
  const withoutDoc = computeAlerts(ctxOf({ licenses: [rec('licenses', { displayName: 'NoDoc', owner: 'Ana', expirationRenewalDate: dateOffset(200) })] }), 'MSP / Integrator');
  assert.ok(withoutDoc.some((x) => x.type === 'missingEvidence'));
  const withDoc = computeAlerts(ctxOf({
    licenses: [rec('licenses', { displayName: 'HasDoc', owner: 'Ana', expirationRenewalDate: dateOffset(200) })],
    documents: [rec('documents', { displayName: 'Doc.pdf', linkedRecordName: 'HasDoc' })],
  }), 'MSP / Integrator');
  assert.ok(!withDoc.some((x) => x.type === 'missingEvidence'));
});

test('stable IDs across recomputes', () => {
  const ctx = ctxOf({ licenses: [rec('licenses', { id: 'lic-9', displayName: 'L', owner: 'Ana', expirationRenewalDate: dateOffset(-1) })] });
  const a1 = computeAlerts(ctx, 'MSP / Integrator');
  const a2 = computeAlerts(ctx, 'MSP / Integrator');
  assert.equal(a1[0].id, a2[0].id);
  assert.equal(a1[0].id, 'expired:lic-9');
});

test('empty ctx returns []', () => {
  assert.deepEqual(computeAlerts(ctxOf(), 'MSP / Integrator'), []);
  assert.deepEqual(computeAlerts(undefined, 'MSP / Integrator'), []);
});

test('computeAlerts does not mutate input ctx arrays', () => {
  const ctx = ctxOf({ licenses: [rec('licenses', { displayName: 'L', owner: '', expirationRenewalDate: dateOffset(-1) })] });
  const before = ctx.licenses.length;
  computeAlerts(ctx, 'MSP / Integrator');
  assert.equal(ctx.licenses.length, before);
});

// ── store-backed getters + session state (RECORD_STORE injection) ──
function withStore(licenses, documents, tasks, fn) {
  const saved = { l: RECORD_STORE.licenses, d: RECORD_STORE.documents, t: RECORD_STORE.tasks };
  resetAlertState();
  try {
    RECORD_STORE.licenses = licenses || [];
    RECORD_STORE.documents = documents || [];
    RECORD_STORE.tasks = tasks || [];
    fn();
  } finally {
    RECORD_STORE.licenses = saved.l; RECORD_STORE.documents = saved.d; RECORD_STORE.tasks = saved.t;
    resetAlertState();
  }
}
// One local license expiring in 10 days, owner present, WITH linked doc -> exactly 1 alert.
function singleAlertLicense(workspaceMode) {
  return [{ id: 'lic-1', row: ['Solo'], meta: { source: 'importSandbox', workspaceMode, moduleKey: 'licenses', displayName: 'Solo', owner: 'Ana', expirationRenewalDate: dateOffset(10) } }];
}
function linkDoc(workspaceMode) {
  return [{ id: 'doc-1', row: ['Doc'], meta: { source: 'importSandbox', workspaceMode, moduleKey: 'documents', displayName: 'Doc', linkedRecordName: 'Solo' } }];
}

test('badge counts only real local records (empty session -> 0)', () => {
  withStore([], [], [], () => {
    assert.equal(getAlertBadgeCount('MSP / Integrator'), 0);
    assert.equal(getOpenAlerts('MSP / Integrator').length, 0);
  });
});

test('markSeen lowers the badge', () => {
  withStore(singleAlertLicense('MSP / Integrator'), linkDoc('MSP / Integrator'), [], () => {
    assert.equal(getAlertBadgeCount('MSP / Integrator'), 1);
    const id = getOpenAlerts('MSP / Integrator')[0].id;
    markSeen(id);
    assert.equal(getAlertBadgeCount('MSP / Integrator'), 0);
    assert.equal(getOpenAlerts('MSP / Integrator').length, 1); // still open, just seen
  });
});

test('resolve removes from open and appears in resolved', () => {
  withStore(singleAlertLicense('MSP / Integrator'), linkDoc('MSP / Integrator'), [], () => {
    const id = getOpenAlerts('MSP / Integrator')[0].id;
    resolveAlert(id);
    assert.equal(getOpenAlerts('MSP / Integrator').length, 0);
    assert.equal(getAlertBadgeCount('MSP / Integrator'), 0);
    assert.equal(getResolvedAlerts('MSP / Integrator').length, 1);
    reopenAlert(id);
    assert.equal(getOpenAlerts('MSP / Integrator').length, 1);
  });
});

test('snooze hides the alert from open + badge', () => {
  withStore(singleAlertLicense('MSP / Integrator'), linkDoc('MSP / Integrator'), [], () => {
    const id = getOpenAlerts('MSP / Integrator')[0].id;
    snoozeAlert(id);
    assert.equal(getOpenAlerts('MSP / Integrator').length, 0);
    assert.equal(getAlertBadgeCount('MSP / Integrator'), 0);
  });
});

test('workspace scoping: alerts only for the active workspace', () => {
  const msp = singleAlertLicense('MSP / Integrator');
  const it = [{ id: 'lic-it', row: ['ITLic'], meta: { source: 'importSandbox', workspaceMode: 'Internal IT', moduleKey: 'licenses', displayName: 'ITLic', owner: 'Ana', expirationRenewalDate: dateOffset(10) } }];
  withStore(msp.concat(it), linkDoc('MSP / Integrator'), [], () => {
    assert.equal(getOpenAlerts('MSP / Integrator')[0].recordName, 'Solo');
    assert.ok(getOpenAlerts('Internal IT').every((a) => a.recordName !== 'Solo'));
  });
});

test('getters do not mutate RECORD_STORE', () => {
  withStore(singleAlertLicense('MSP / Integrator'), [], [], () => {
    const before = RECORD_STORE.licenses.length;
    getLocalAlertsLen();
    function getLocalAlertsLen() { getOpenAlerts('MSP / Integrator'); getAlertBadgeCount('MSP / Integrator'); }
    assert.equal(RECORD_STORE.licenses.length, before);
  });
});
