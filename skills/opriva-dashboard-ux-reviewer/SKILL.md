---
name: opriva-dashboard-ux-reviewer
description: Review Opriva dashboards, reports, priority queues, renewal forecasts, KPI cards, and executive/operational views for enterprise UX clarity across CIO, CISO, procurement, MSP / Integrator, and Internal IT workflows.
---

# Opriva Dashboard UX Reviewer

## When To Use

Use this skill when reviewing Opriva Dashboard, Reports, Attention Center, Assets & Renewals, Renewals Forecast, KPI cards, AI insight bars, priority queues, tables, executive summaries, or whether dashboards communicate renewal risk and operational action clearly.

## Opriva-Specific Rules

- Dashboards must communicate actionable IT Asset & Renewal Intelligence, not decorative metrics.
- MSP / Integrator dashboards should emphasize Client, Brand, Product, Distributor, Renewal, Value, Margin, Owner, Action, and commercial risk.
- Internal IT dashboards should emphasize Brand, Provider, Department, Budget / Approval / Risk, evidence, owner, and operational continuity.
- CIO users need leadership-level exposure, ownership, risk, budget and upcoming decisions.
- CISO users need security/compliance exposure, missing evidence, critical expirations and audit confidence.
- Procurement users need provider/distributor/brand/product clarity, contract/support coverage, PO/invoice/evidence context and renewal leverage.
- Dashboards should derive from canonical/local records where possible; mock data should be fallback demo seed data only.
- Do not recommend backend-only dashboard features as local implementation unless explicitly requested.

## Review Checklist

- KPI cards: relevance, hierarchy, terminology, values, status tone, and whether each implies an action.
- AI insight bars: concise insight, confidence, data source clarity, and useful next actions.
- Priority queues: columns, row density, sorting/filtering affordances, action clarity, and owner visibility.
- Assets & Renewals / Renewals Forecast: whether it acts as a unified renewal worklist.
- Reports: whether imported/local records affect useful summaries without overclaiming.
- Workspace-mode differences: MSP commercial pipeline vs Internal IT operational governance.
- Data source honesty: local sandbox, imported records, demo fallback, backend limitations.
- Table legibility: value/margin/date/status/owner/action columns.
- Empty states and no-data states.
- Whether dashboards help decide what to do next today.

## Risks / Gaps To Look For

- KPIs are impressive but not actionable.
- Dashboards use static mock data while local records exist.
- MSP and Internal IT dashboards share columns that should differ.
- Margin/value/budget/risk are mixed incorrectly across workspace modes.
- Renewal packages, support coverage, hardware warranties, certificates and licenses are not unified in the renewal worklist.
- AI insight copy sounds confident without real data support.
- Reports imply backend persistence or generated exports that are not implemented.
- Imported records do not affect dashboard/report views enough to validate the product.

## Required Output Format

1. Executive summary
2. What is working
3. Dashboard / report UX risks
4. Data model and source-of-truth gaps
5. Recommended improvements
6. Backend implications
7. MSP / Integrator implications
8. Internal IT implications
9. Suggested implementation prompt, if action is needed

## Suggested Implementation Prompt Format

Use this format when recommending implementation:

```text
Improve [Dashboard/Reports/Assets & Renewals/Attention Center] UX.

Do not change routes, Sidebar, Topbar, Floating AI, workspaceMode, backend, import parsing, or unrelated modules.

Objective:
[specific dashboard or reporting outcome]

Scope:
- Affected files/components:
- Data source to use:
- Workspace modes to validate:

Acceptance criteria:
- MSP / Integrator terminology is correct
- Internal IT terminology is correct
- Local/imported records are represented honestly where applicable
- Demo data remains fallback only
- npm run build passes
- git diff --check passes
```
