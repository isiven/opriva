// C10b — Dashboard derivation (local/session metrics).
// Computes Dashboard KPI metrics from local/session records only, using the
// existing derivation engine. Reads CANONICAL meta fields (record.meta.*),
// never positional row[i]. No persistence, no backend, no sample data here —
// the caller decides sample-vs-derived based on `hasLocalData`.

import { getLocalStoreRecords } from './recordSelectors.js';
import { daysUntil, calcRiskLevel } from '../utils/dates.js';
import { calcMargin } from '../utils/money.js';
import { importMoney } from '../importSandbox/importFormatting.js';

// Parse a money value the same way the rest of the app does (strip $ / commas).
function money(value) {
  var n = parseFloat(importMoney(value));
  return isNaN(n) ? 0 : n;
}

// Owner is "missing" when blank, '-', or the Unassigned sentinel.
function ownerMissing(owner) {
  var o = String(owner == null ? '' : owner).trim().toLowerCase();
  return o === '' || o === '-' || o === 'unassigned';
}

/**
 * Pure metrics aggregator — testable without RECORD_STORE.
 *
 * @param {Array<{id?:string,row?:Array,meta?:object}>} records  local records
 * @param {string} workspaceMode  'MSP / Integrator' | 'Internal IT'
 * @returns {{
 *   workspaceMode:string, hasLocalData:boolean, recordCount:number,
 *   totalExposure:number, exposure90d:number, expiringSoon30:number,
 *   criticalCount:number, missingOwners:number, marginAtRisk:number
 * }}
 *
 * Metric definitions (all from canonical meta):
 *   totalExposure  — sum of meta.commercialValue across all records.
 *   exposure90d    — sum of meta.commercialValue for records expiring in 0..90 days.
 *   expiringSoon30 — count of records expiring in 0..30 days (not yet overdue).
 *   criticalCount  — count of records whose derived risk is 'Critical'
 *                    (calcRiskLevel; includes overdue, <=7 days, or Critical criticality).
 *   missingOwners  — count of records with no assigned owner.
 *   marginAtRisk   — sum of margin dollars (calcMargin) for records expiring in 0..90 days.
 */
export function computeDashboardMetrics(records, workspaceMode) {
  var list = Array.isArray(records) ? records : [];
  var metrics = {
    workspaceMode: workspaceMode,
    hasLocalData: list.length > 0,
    recordCount: list.length,
    totalExposure: 0,
    exposure90d: 0,
    expiringSoon30: 0,
    criticalCount: 0,
    missingOwners: 0,
    marginAtRisk: 0,
  };

  list.forEach(function(rec) {
    var meta = (rec && rec.meta) || {};
    var value = money(meta.commercialValue);
    var days = daysUntil(meta.expirationRenewalDate);
    var risk = calcRiskLevel(
      meta.expirationRenewalDate,
      meta.alertPolicy,
      meta.customReminderDays,
      meta.businessCriticality
    );
    var within90 = days !== null && days >= 0 && days <= 90;

    metrics.totalExposure += value;
    if (within90) metrics.exposure90d += value;
    if (days !== null && days >= 0 && days <= 30) metrics.expiringSoon30 += 1;
    if (risk === 'Critical') metrics.criticalCount += 1;
    if (ownerMissing(meta.owner)) metrics.missingOwners += 1;

    if (within90) {
      var m = calcMargin(meta.commercialValue, meta.vendorCost);
      if (m.marginDollar !== '') metrics.marginAtRisk += parseFloat(m.marginDollar);
    }
  });

  return metrics;
}

/**
 * Wrapper: reads local (non-demo, workspace-scoped) records across the
 * renewal-bearing modules and computes their metrics. Demo seed records are
 * excluded by getLocalStoreRecords, so an empty workspace yields
 * hasLocalData === false (caller then shows sample data).
 */
export function getDashboardMetrics(workspaceMode) {
  var records = []
    .concat(getLocalStoreRecords('licenses', workspaceMode))
    .concat(getLocalStoreRecords('hardware', workspaceMode))
    .concat(getLocalStoreRecords('contracts', workspaceMode));
  return computeDashboardMetrics(records, workspaceMode);
}
