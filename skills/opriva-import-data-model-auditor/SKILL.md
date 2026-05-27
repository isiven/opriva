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
- Catalog-controlled import fields must map to existing catalog values where possible, not arbitrary strings.
- AI can suggest catalog matches or new catalog values, but users approve.
- Contact fields from imports are sensitive relationship data. They should default to Review, not automatic import, and should become candidate Contact records/links only after user approval.
- Import should detect all meaningful entities, not only the selected asset type, and stage canonical record/catalog creation before confirmation.
- Imported records must become first-class Opriva records in the central local store during sandbox testing.
- Unmapped columns should be reviewed, skipped, mapped to Notes, or mapped to a canonical field.
- Backend corporate MVP requires import jobs, history, permissions, audit trail, and persistent records.
- Backend corporate MVP also requires catalog tables, normalized keys, aliases/synonyms, duplicate prevention, merge/deactivate flows, and audit history.

## Review Checklist

- Source detection and user-confirmed import target.
- Workspace-specific mapping for MSP / Integrator and Internal IT.
- Canonical field coverage for client/department, brand/manufacturer, product/license, provider/distributor, reseller/partner, quantity, dates, contract, PO/order, value, cost, status, support, serial, warranty, notes.
- Skipped/calculated columns and user visibility.
- Contact-related headers such as License Contact, Technical Contact, Billing Contact, Renewal Contact, Legal Contact, Contact Email, and Email; ensure they are reviewed as sensitive contact context.
- Preservation of contact context in sandbox metadata without blindly creating contacts or assigning internal Owner.
- Entity detection for Client / Company, Department, Contact, Brand / Manufacturer, Product / SKU, Vendor / Provider, Distributor, Reseller / Partner, License, Hardware Asset, Contract, Support Coverage, Renewal Package / Bundle, Document Metadata, Task, Relationship and Activity Event.
- Normalized entity matching and whether new entities are staged for user approval instead of created silently.
- Relationship creation preview for license-client, license-brand/product, provider/distributor, contract/support coverage, contact links and package grouping.
- Bulk defaults for brand, product, owner, alert policy, and provider/distributor.
- Whether bulk defaults use catalog-controlled values instead of unrestricted free text.
- Whether Brand / Manufacturer, Product / License Name, Distributor / Provider, Vendor / Provider, Reseller / Partner, Client / Department, Owner, Alert Policy, Document Type, Contract Type, Support Coverage Type, License Term, Currency, Country, and reusable classifications are implemented as catalogs.
- Select/search/create behavior for catalog-controlled fields.
- Normalization and duplicate detection before creating new catalog values.
- Whether imports can accidentally create duplicate brands, products, providers, clients/departments, owners, policies, document types, contract types, currencies, or countries.
- Workspace-mode meaning of catalog values in MSP / Integrator versus Internal IT.
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
