---
name: opriva-backend-readiness-auditor
description: Review whether Opriva local/session sandbox features require backend, database, auth, storage, permissions, import jobs, alerts, audit trail, AI retrieval, or reporting data layers before corporate MVP.
---

# Opriva Backend Readiness Auditor

## When To Use

Use this skill when assessing whether a feature can remain local for design validation or must be backend-backed before corporate MVP, pilot testing, or enterprise use.

## Opriva-Specific Rules

- Opriva is currently local/sandbox design validation.
- Backend is mandatory before corporate MVP.
- Do not add backend unless explicitly requested; document backend requirements instead.
- Any feature involving persistence, auth, users, workspaces, roles, permissions, documents, imports, alerts, audit trail, AI knowledge, storage, reporting, or enterprise testing must be marked backend-required.
- Activity must become persistent audit trail.
- Documents require secure storage, metadata, links, permissions, retention, and secure access.
- Imported records must become first-class records; future implementation requires import jobs/history and permissions.
- Controlled catalogs are backend-required for repeated/business-critical entities and policies: brand, product, provider, distributor, reseller/partner, client/department, owner, alert policy, document type, contract type, support coverage type, license term, currency, country, and reusable classifications.
- Catalog backend must support normalized keys, unique constraints, aliases/synonyms, duplicate prevention, merge/deactivate flows, workspace-scoped versus global catalogs, and audit history.
- Backend import must support entity detection, matching, staged creation, relationship creation and audit for all meaningful entities found in uploaded files.

## Review Checklist

- Database tables/entities required.
- Auth, users, workspaces, tenants, roles, and permissions.
- Persistent canonical records for clients/departments, licenses, hardware, contracts, support coverage, documents, tasks, relationships, activities, imports, alerts, and settings.
- Catalog tables for controlled fields and whether current local forms/imports still treat them as free text.
- Select/search/create flows, normalization rules, duplicate checks, aliases/synonyms, merge/deactivate workflows, and catalog change audit events.
- MSP / Integrator versus Internal IT differences in catalog meaning and workspace scope.
- File storage, document links, document policies, and Missing Evidence.
- Import jobs, import files, mappings, rows, preview, confirmation, and history.
- Entity detection/matching tables or services for clients/departments, contacts, brands, products, providers/distributors/resellers, contracts, support coverage, renewal packages, document metadata, tasks and relationships.
- Approval and audit trail for creating or linking detected entities during import.
- Alerts/background jobs and notification delivery.
- Audit trail event model.
- AI retrieval, knowledge permissions, and workspace isolation.
- Reporting/dashboard data layer and saved views/filters.
- Corporate MVP blockers.

## Required Output Format

1. Executive summary
2. What is working
3. Risks / gaps
4. Recommended changes
5. Backend implications
6. MSP / Integrator implications
7. Internal IT implications
8. Suggested Codex implementation prompt, if action is needed
