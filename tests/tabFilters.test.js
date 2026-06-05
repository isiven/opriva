// S2a — tests for the pure filter-tab predicate (node:test + node:assert/strict).
// rowPassesTab(row, tab, module, columns) resolves columns BY NAME, so tests use
// realistic per-module column layouts.

import test from 'node:test';
import assert from 'node:assert/strict';
import { rowPassesTab } from '../source/utils/tabFilters.js';

// Realistic column layouts (mirror the wrapper screens).
const HARDWARE_MSP = ['Asset','Type','Client','Brand','Model','Serial','Warranty end','Support','Owner','Status','Risk','Action'];
const HARDWARE_IT  = ['Asset','Type','Brand','Model','Serial','Department','Provider','Warranty end','Approval status','Owner','Status','Risk','Action'];
const DOCUMENTS    = ['Document','Type','Linked record','Client','Uploaded by','Version','Access','Requirement','Status'];
const CONTRACTS_MSP= ['Contract','Type','Client','Provider / Distributor','Owner','Document','Renewal','Notice','Legal status','Next action','Risk'];
const LICENSES_MSP = ['License / Product','Client','Brand','Distributor','Quantity','Renewal','Value','Margin','Owner','Status','Action'];

// Build a row from a {column: value} map against a column layout.
function row(columns, map) {
  return columns.map(function (c) { return map[c] !== undefined ? map[c] : '-'; });
}

test("'All' always passes (any row, any module)", () => {
  assert.equal(rowPassesTab(row(HARDWARE_MSP, {}), 'All', 'Hardware', HARDWARE_MSP), true);
  assert.equal(rowPassesTab([], 'All', 'Documents', DOCUMENTS), true);
  assert.equal(rowPassesTab(row(LICENSES_MSP, { Owner: 'Maria Chen' }), 'All', 'Licenses', LICENSES_MSP), true);
});

test("falsy tab passes (treated as no filter)", () => {
  assert.equal(rowPassesTab(row(HARDWARE_MSP, {}), '', 'Hardware', HARDWARE_MSP), true);
  assert.equal(rowPassesTab(row(HARDWARE_MSP, {}), undefined, 'Hardware', HARDWARE_MSP), true);
});

test("'Unassigned' matches blank/dash/Unassigned owner only", () => {
  assert.equal(rowPassesTab(row(HARDWARE_MSP, { Owner: 'Unassigned' }), 'Unassigned', 'Hardware', HARDWARE_MSP), true);
  assert.equal(rowPassesTab(row(HARDWARE_MSP, { Owner: '-' }), 'Unassigned', 'Hardware', HARDWARE_MSP), true);
  assert.equal(rowPassesTab(row(HARDWARE_MSP, { Owner: '  unassigned  ' }), 'Unassigned', 'Hardware', HARDWARE_MSP), true); // casing/space
  assert.equal(rowPassesTab(row(HARDWARE_MSP, { Owner: 'Maria Chen' }), 'Unassigned', 'Hardware', HARDWARE_MSP), false);
});

test("'Expiring soon' / 'Warranty expiring' match Status ~ expir", () => {
  assert.equal(rowPassesTab(row(HARDWARE_MSP, { Status: 'Expiring soon' }), 'Expiring soon', 'Hardware', HARDWARE_MSP), true);
  assert.equal(rowPassesTab(row(HARDWARE_MSP, { Status: 'EXPIRING' }), 'Warranty expiring', 'Hardware', HARDWARE_MSP), true); // casing
  assert.equal(rowPassesTab(row(HARDWARE_MSP, { Status: 'Active' }), 'Expiring soon', 'Hardware', HARDWARE_MSP), false);
});

test("'High risk' matches Risk High/Critical only", () => {
  assert.equal(rowPassesTab(row(HARDWARE_MSP, { Risk: 'High' }), 'High risk', 'Hardware', HARDWARE_MSP), true);
  assert.equal(rowPassesTab(row(HARDWARE_MSP, { Risk: 'Critical' }), 'High risk', 'Hardware', HARDWARE_MSP), true);
  assert.equal(rowPassesTab(row(HARDWARE_MSP, { Risk: 'Low' }), 'High risk', 'Hardware', HARDWARE_MSP), false);
});

test("'Restricted' matches Access ~ restricted (Documents)", () => {
  assert.equal(rowPassesTab(row(DOCUMENTS, { Access: 'Restricted' }), 'Restricted', 'Documents', DOCUMENTS), true);
  assert.equal(rowPassesTab(row(DOCUMENTS, { Access: 'Internal' }), 'Restricted', 'Documents', DOCUMENTS), false);
});

test("'Auto-renewal' matches an 'auto' marker across renewal-ish columns", () => {
  assert.equal(rowPassesTab(row(CONTRACTS_MSP, { 'Next action': 'Auto-renew' }), 'Auto-renewal', 'Contracts', CONTRACTS_MSP), true);
  assert.equal(rowPassesTab(row(CONTRACTS_MSP, { Renewal: 'Auto-renews May 2' }), 'Auto-renewal', 'Contracts', CONTRACTS_MSP), true);
  assert.equal(rowPassesTab(row(CONTRACTS_MSP, { 'Next action': 'Review contract', Renewal: 'May 2, 2026' }), 'Auto-renewal', 'Contracts', CONTRACTS_MSP), false);
});

test("'Notice period' requires a non-blank Notice", () => {
  assert.equal(rowPassesTab(row(CONTRACTS_MSP, { Notice: '30 days' }), 'Notice period', 'Contracts', CONTRACTS_MSP), true);
  assert.equal(rowPassesTab(row(CONTRACTS_MSP, { Notice: '-' }), 'Notice period', 'Contracts', CONTRACTS_MSP), false);
});

test("'Linked records' requires a non-blank Linked record (Documents)", () => {
  assert.equal(rowPassesTab(row(DOCUMENTS, { 'Linked record': 'Banisi — M365' }), 'Linked records', 'Documents', DOCUMENTS), true);
  assert.equal(rowPassesTab(row(DOCUMENTS, { 'Linked record': '-' }), 'Linked records', 'Documents', DOCUMENTS), false);
});

test("'Support coverage' matches Type ~ support coverage (Contracts)", () => {
  assert.equal(rowPassesTab(row(CONTRACTS_MSP, { Type: 'Support Coverage' }), 'Support coverage', 'Contracts', CONTRACTS_MSP), true);
  assert.equal(rowPassesTab(row(CONTRACTS_MSP, { Type: 'License' }), 'Support coverage', 'Contracts', CONTRACTS_MSP), false);
});

test("'Required missing' = required AND not satisfied (Documents)", () => {
  assert.equal(rowPassesTab(row(DOCUMENTS, { Requirement: 'Required', Status: 'Missing' }), 'Required missing', 'Documents', DOCUMENTS), true);
  assert.equal(rowPassesTab(row(DOCUMENTS, { Requirement: 'Optional', Status: 'Complete' }), 'Required missing', 'Documents', DOCUMENTS), false);
  assert.equal(rowPassesTab(row(DOCUMENTS, { Requirement: 'Required', Status: 'Complete' }), 'Required missing', 'Documents', DOCUMENTS), false);
});

test("'CIO approval needed' matches approval/pending/needed/review", () => {
  assert.equal(rowPassesTab(row(HARDWARE_IT, { 'Approval status': 'Approval needed' }), 'CIO approval needed', 'Hardware', HARDWARE_IT), true);
  assert.equal(rowPassesTab(row(HARDWARE_IT, { 'Approval status': 'Pending' }), 'CIO approval needed', 'Hardware', HARDWARE_IT), true);
  assert.equal(rowPassesTab(row(HARDWARE_IT, { 'Approval status': 'Approved' }), 'CIO approval needed', 'Hardware', HARDWARE_IT), false);
});

// ── Decision A: no-op true when the needed column does not exist ──
test("weak tabs are no-op true when the column is absent (Decision A)", () => {
  // Licenses MSP has no 'Document' column -> 'Missing document' must not hide rows.
  assert.equal(rowPassesTab(row(LICENSES_MSP, { Owner: 'Maria Chen' }), 'Missing document', 'Licenses', LICENSES_MSP), true);
  // Licenses MSP has no 'Risk' column -> 'High margin risk' is no-op.
  assert.equal(rowPassesTab(row(LICENSES_MSP, {}), 'High margin risk', 'Licenses', LICENSES_MSP), true);
  // Hardware IT has no 'Support' column -> 'Missing support' is no-op.
  assert.equal(rowPassesTab(row(HARDWARE_IT, { Owner: 'Ana Ruiz' }), 'Missing support', 'Hardware', HARDWARE_IT), true);
});

test("unknown tab is no-op true (never hides everything)", () => {
  assert.equal(rowPassesTab(row(HARDWARE_MSP, {}), 'Totally unknown tab', 'Hardware', HARDWARE_MSP), true);
});

// ── Robustness ──
test("handles empty row and missing columns without throwing", () => {
  assert.equal(rowPassesTab([], 'Expiring soon', 'Hardware', HARDWARE_MSP), false); // no Status value -> not expiring
  assert.equal(rowPassesTab([], 'Unassigned', 'Hardware', HARDWARE_MSP), true);      // blank owner -> missing
  assert.equal(rowPassesTab(row(HARDWARE_MSP, {}), 'Restricted', 'Hardware', HARDWARE_MSP), true); // no Access col in Hardware -> no-op
  assert.equal(rowPassesTab(undefined, 'High risk', 'Hardware', HARDWARE_MSP), false); // undefined row -> Risk blank
  assert.equal(rowPassesTab(row(HARDWARE_MSP, { Risk: '  high  ' }), 'High risk', 'Hardware', HARDWARE_MSP), true); // casing/space
});
