---
name: opriva-import-data-model-auditor
description: Review Opriva import, mapping, enrichment, duplicate prevention, workspace-aware target selection, canonical field mapping, and promotion of imported rows into first-class Opriva records.
---

# Opriva Import Data Model Auditor

## When To Use

Use this skill when reviewing Data Import, Excel parsing, mapping heuristics, import target selection, enrichment UX, duplicate prevention, normalized preview, or RECORD_STORE promotion.

## Opriva-Specific Rules

- Import must be model-driven, not spreadsheet-driven.
- Do not blindly import every Excel column.
- Uploaded data must map to Opriva canonical fields.
- AI can suggest mappings, but users approve.
- User must confirm or override import target before final import.
- Mapping must consider workspace mode, detected source, and selected import target.
- Import enrichment should be bulk-first and exception-based.
- Imported records must become first-class Opriva records in the central local store during sandbox testing.
- Unmapped columns should be reviewed, skipped, mapped to Notes, or mapped to a canonical field.
- Backend corporate MVP requires import jobs, history, permissions, audit trail, and persistent records.

## Review Checklist

- Source detection and user-confirmed import target.
- Workspace-specific mapping for MSP / Integrator and Internal IT.
- Canonical field coverage for client/department, brand/manufacturer, product/license, provider/distributor, reseller/partner, quantity, dates, contract, PO/order, value, cost, status, support, serial, warranty, notes.
- Skipped/calculated columns and user visibility.
- Bulk defaults for brand, product, owner, alert policy, and provider/distributor.
- Row-level exception review and edit/enrichment.
- Duplicate prevention key and session behavior.
- Promotion into `RECORD_STORE` and visibility in modules after confirmation.
- Dashboard, Reports, Assets & Renewals, Companies / Clients, Licenses, Hardware, Contracts, drawers, activity events.
- Local sandbox honesty and backend readiness notes.

## Required Output Format

1. Executive summary
2. What is working
3. Risks / gaps
4. Recommended changes
5. Backend implications
6. MSP / Integrator implications
7. Internal IT implications
8. Suggested Codex implementation prompt, if action is needed

