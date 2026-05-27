---
name: opriva-software-architecture-auditor
description: Review Opriva architecture, maintainability, central local store strategy, mock data boundaries, component complexity, and readiness to evolve from local sandbox to backend-backed corporate MVP.
---

# Opriva Software Architecture Auditor

## When To Use

Use this skill when reviewing Opriva code structure, `source/App.jsx` complexity, state management, module boundaries, import/store integration, mock data usage, or backend migration risk.

## Opriva-Specific Rules

- Opriva is currently local/sandbox design validation, not corporate-MVP ready.
- Do not add backend unless explicitly requested.
- Local/session state is acceptable only for UX and product logic validation.
- Mock data should become optional demo seed data, not the source of truth.
- Imported/manual records should become first-class records in the central local store during sandbox testing.
- Catalog-controlled fields should not be implemented as scattered free-text state; sandbox code may simulate catalogs locally, but backend MVP requires real catalog tables and constraints.
- Every relevant change must be reviewed for MSP / Integrator and Internal IT.
- Do not delete mock arrays or split major files without explicit approval.
- Before committing code changes, run `npm run build` and `git diff --check`.

## Review Checklist

- `source/App.jsx` size, complexity, and risk hotspots.
- Component boundaries and whether a proposed split is low risk.
- Central data store behavior and whether modules prefer local records with demo fallback.
- Mock data vs demo seed data boundaries.
- Selector/projection helpers and duplicated transformation logic.
- State ownership and cross-module data flow.
- Catalog-controlled field architecture: shared selectors/options, select/search/create behavior, normalization, duplicate detection, and avoiding duplicated catalog logic.
- Risk of imports or forms creating duplicate Brand, Product, Provider, Distributor, Reseller/Partner, Client/Department, Owner, Alert Policy, Document Type, Contract Type, Support Coverage Type, License Term, Currency, Country, or classification values.
- Import sandbox promotion into canonical local records.
- Record drawer, relationships, tasks, documents, and activity coupling.
- Backend migration friction and data model drift.
- Maintainability risks from hidden side effects or reset effects.

## Required Output Format

1. Executive summary
2. What is working
3. Risks / gaps
4. Recommended changes
5. Backend implications
6. MSP / Integrator implications
7. Internal IT implications
8. Suggested Codex implementation prompt, if action is needed
