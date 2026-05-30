# Opriva Project Instructions

## 1. Project Identity

Opriva is a local/sandbox webapp currently in design and functional validation.
It is not yet corporate-MVP ready. Backend development will be mandatory before enterprise or corporate pilot testing.

## 2. Current Development Mode

Local/session state is allowed only for UX and product logic validation.
Do not add backend, database, storage, auth, API routes, or persistence unless explicitly requested.
Do not treat local state, mock data, or browser-session records as production-ready behavior.

## 3. Backend Readiness Rule

Any feature requiring persistence, authentication, users, workspaces, roles, permissions, documents, imports, alerts, audit trail, AI knowledge, storage, or enterprise testing must be documented as backend-required before corporate MVP.

When adding or changing such a feature in sandbox mode, preserve a clear note that corporate MVP requires backend/database/storage/auth support.

## 4. Import Rules

Opriva import must be model-driven, not spreadsheet-driven.
Do not blindly import every Excel column.
Uploaded data must be mapped into Opriva canonical fields.
AI can suggest mappings, but the user approves.
The user must confirm or override the import target before final import.
Import enrichment must be bulk-first and exception-based.
Imported records must become first-class Opriva records after confirmation.
In sandbox mode, imported records must enter the central local store and appear in relevant modules.
Future corporate MVP requires backend import jobs, import history, permissions, and audit trail.

## 5. Data Model Rules

Support Coverage is a related contract/coverage record, not a text field inside License or Hardware.
Tasks are operational entities linked to records, not a simple Next Action field.
Activity must become a true audit trail.
Relationships must be navigable.
Status, Days to Expiration, Risk, Margin, Renewal Stage, and Missing Evidence are calculated or derived, not manual fields.
Custom fields extend the model but do not replace canonical fields.
Repeated and business-critical values must be controlled catalogs, not unrestricted free text. This includes Brand / Manufacturer, Product / License Name, Distributor / Provider, Vendor / Provider, Reseller / Partner, Client / Department, Owner, Alert Policy, Document Type, Contract Type, Support Coverage Type, License Term, Currency, Country, and reusable business classifications.
Catalog-controlled fields should use select/search/create behavior, normalize new values, detect duplicate-like entries, prompt users to use existing matches, and require user approval for AI-suggested matches.
Sandbox implementations may simulate catalog behavior locally, but corporate MVP requires backend catalog tables, normalized keys, aliases/synonyms, unique constraints, merge/deactivate flows, and audit history.

## 6. Workspace Mode Rule

Every relevant product, data, UI, import, and reporting change must be reviewed for both workspace modes:

- MSP / Integrator
- Internal IT

Do not assume one workspace mode covers the other. MSP / Integrator is client/commercial-renewal oriented. Internal IT is department/budget/approval/operational-risk oriented.

## 7. Mock Data Rule

Mock data should become optional demo seed data only.
Mock data must not be treated as the source of truth.
Imported/manual local records should drive modules where possible.
Backend persistence will later replace the local store.
Do not delete mock arrays unless explicitly requested and validated against all affected modules.

## 8. File Safety Rule

Never commit real client files.
`private-samples/` is for real local test files only and must remain ignored.
`sample-data/` may contain demo or anonymized data only.
Do not commit `.env`, keys, private PDFs, real Excel files, credentials, customer exports, or sensitive documents.
Official templates under `templates/` and `public/templates/` may be committed when they contain no real customer data.

## 9. Git and Validation Rules

Before committing code changes:

- run `npm run build`
- run `git diff --check`
- stage only related files
- keep commits focused
- report the commit hash and final `git status`

Do not include unrelated files in a commit. Do not commit generated private artifacts or local tooling folders.

## 10. Documentation Update Rule

When an important product or implementation decision is made, update `MEMORY.md` or the appropriate project documentation.
Documentation must distinguish current local/sandbox behavior from future backend-required corporate MVP behavior.

## 11. Recommended Review Lenses

Use these review lenses when a task calls for deeper Opriva judgment:

- Software Architecture Auditor: codebase architecture, modularity, state, mock/demo boundaries, central local store strategy, and backend migration risk.
- CIO / IT Director Reviewer: operational visibility, renewal control, ownership, budget/cost visibility, risk, reporting, and business continuity value.
- CISO / Security & Compliance Reviewer: authentication, permissions, tenant isolation, document security, evidence, audit trail, AI boundaries, and local-only risk.
- IT Procurement / Vendor Management Reviewer: brand/manufacturer, provider, distributor, reseller/partner, quote, PO, invoice, license certificate, warranties, costs, and support coverage.
- MSP / Integrator Operations Reviewer: clients, account owners, renewal pipeline, margins, distributor workflows, support coverage sold to clients, and sales-to-operations handoff.
- Enterprise UX Reviewer: serious enterprise SaaS quality, copy clarity, compact layouts, bulk-first workflows, empty states, warnings, and confirmation confidence.
- Backend Readiness Auditor: what must move from local/session sandbox to backend before corporate MVP.
- Import & Canonical Data Model Auditor: model-driven import, target selection, mapping quality, unmapped columns, enrichment, duplicate prevention, and promotion into the central local store.

These lenses are advisory. They do not override explicit user instructions, file safety rules, or validation requirements.

## 12. Codex Reviewer Usage Rules

Before any meaningful product, UX, architecture, data model, backend-readiness, security, procurement, or import work, Codex must check which local Opriva reviewer skills apply and use them as lenses before or after implementation.

Reviewer aliases:

- architecture-reviewer -> `skills/opriva-software-architecture-auditor/SKILL.md`
- enterprise-ux-reviewer -> `skills/opriva-enterprise-ux-reviewer/SKILL.md`
- enterprise-visual-design-reviewer -> `skills/opriva-enterprise-visual-design-reviewer/SKILL.md`
- backend-readiness-reviewer -> `skills/opriva-backend-readiness-auditor/SKILL.md`
- import-data-model-reviewer -> `skills/opriva-import-data-model-auditor/SKILL.md`
- workspace-mode-reviewer -> `skills/opriva-workspace-mode-reviewer/SKILL.md`
- ciso-security-reviewer -> `skills/opriva-ciso-security-compliance-reviewer/SKILL.md`
- cio-it-director-reviewer -> `skills/opriva-cio-it-director-reviewer/SKILL.md`
- it-procurement-vendor-management-reviewer -> `skills/opriva-it-procurement-vendor-reviewer/SKILL.md`
- accessibility-reviewer -> `skills/opriva-accessibility-reviewer/SKILL.md`

Application rules:

- For UI changes: use enterprise-ux-reviewer, enterprise-visual-design-reviewer, accessibility-reviewer, and workspace-mode-reviewer.
- For import, bulk upload, mapping, catalogs, or data normalization: use import-data-model-reviewer, backend-readiness-reviewer, workspace-mode-reviewer, and architecture-reviewer.
- For security, permissions, roles, audit trail, documents, storage, or sensitive data: use ciso-security-reviewer, backend-readiness-reviewer, and architecture-reviewer.
- For business workflows involving vendors, licenses, renewals, support coverage, warranties, contracts, or procurement: use cio-it-director-reviewer and it-procurement-vendor-management-reviewer.
- For any feature that affects both MSP / Integrator and Internal IT: use workspace-mode-reviewer.
- Do not install, clone, or fetch external skills automatically.
- External skills may only be reviewed or adapted after explicit approval.
- Prefer local Opriva-specific reviewer skills and checklists.

## 13. AI Development Team Operating Model

Use `OPRIVA_AI_DEVELOPMENT_TEAM.md` as the operating model for major Opriva work. Before significant product, architecture, backend, import, security, UX, data model, catalog, dashboard, or workflow changes, select the appropriate Opriva skills or expert-role lenses from that document to inspect, plan, implement, validate, and document the change.

Do not treat a single generic coding pass as enough for strategic Opriva changes. Use the specialized review model to catch product, MSP / Integrator, Internal IT, security, backend-readiness, import, procurement, UX, and data-model risks before implementation.

## 14. Development Methodology

Use `OPRIVA_DEVELOPMENT_METHODOLOGY.md` as the project methodology for Codex and Claude Code work. It defines Opriva's inspect-before-implement, plan-before-coding, minimal-change, systematic-debugging, verification-before-completion, code-review, and finish-task discipline.

External agent methodologies may be researched as references, but do not install, clone, run scripts, configure hooks, add dependencies, or import external skill behavior without explicit user approval. Adapt useful patterns into Opriva-specific guidance instead.

## 15. Cross-Agent Skill Parity (Claude Code ↔ Codex)

Opriva is developed across multiple AI agents. Any external design, UX, taste or methodology skill adapted for one agent must also be adapted — or clearly planned — for the other supported agents, so the project does not drift between Claude Code and Codex sessions.

When the user states that work is continuing in Codex, remind the user to replicate or adapt approved Claude Code skills for Codex parity before proceeding with non-trivial work.

Three external design-skill sources are currently under research only (no install, no adapt approved): see `OPRIVA_AI_DEVELOPMENT_TEAM.md` §10.1 for the full source list, formats, licenses and Codex-compatibility status. The cross-agent parity rule lives in §10.2, and the likely Codex target locations to inspect before any adaptation (`.codex/`, `.agents/`, the existing `skills/` directory, `AGENTS.md`) are documented there.

## 16. Helper Text Rule

When modifying any Opriva UI — especially Data Import, Mapping, Validation, Preview, Confirm, Documents, Coverage and Dashboards — apply progressive guidance.

### Do not add long permanent texts without justification

Educational content cannot live as a wall of text on the screen. If the explanation is more than one short sentence, it must be:

- Wrapped in `<details>` / dismissible / tooltip / collapsed by default; or
- Moved to an Opriva AI surface (Ask Opriva button, AI side panel, contextual chat); or
- Triggered on demand, not on render.

### Always inline and visible (critical surfaces)

These cannot be hidden, dismissed or moved to AI — they prevent incorrect import or destructive action:

- Confirm-blocking reasons (critical issue counts, missing-column gate, etc.)
- Missing required ownership (Client / Department / Owner)
- Critical validation errors (W3 severity = critical)
- Duplicate or data-integrity warnings
- Security / PII warnings (Contact Email, Vendor Cost, Custom Fields safety)
- Documents metadata-only warning (files are uploaded separately)

### Compactable or move to Opriva AI (educational surfaces)

These should be designed as compactable from day one:

- "What is Coverage?" (warranty / support / maintenance explanation)
- "Which template should I use?" (MSP / Internal IT / Canonical)
- "How do I map this column?" (mapping suggestions context)
- "Why is this row suggested?" (inference basis for coverage suggestions)
- Sandbox / local-state caveats
- Vendor-specific guidance (Microsoft CSP, Veeam, Cisco SmartNet, HPE Care Pack, Fortinet, VMware, distributor reports)

### Progressive disclosure pattern

- **Inline and always visible**: critical
- **Tooltip / cell comment / dismissible banner**: educational, short
- **Opriva AI / Help / Ask Opriva button**: educational, long or context-dependent

### MVP exception

While Opriva is in local / sandbox testing, more educational helper text is allowed to validate user understanding. Every helper added during MVP must still be structured so it can be compacted later without breaking the surrounding layout — single conditional, no internal state, easy to swap to tooltip or Opriva AI link.

See `MEMORY.md §21` for the full Progressive Guidance Model product decision and the long-term Guidance Mode setting (Guided, Compact, Expert, Ask Opriva AI). Both documents must stay in sync.

## 17. Controlled Catalog and Searchable Combobox Rule

When modifying forms, drawers, imports, mappings, templates, documents, coverage, tasks or dashboards — and any other surface that asks the user to pick a value — apply the following rule.

### Review before adding any input

For each field, ask: does this value represent an entity backed by a controlled catalog or a future database table?

- If yes, and the catalog can grow per workspace, vendor or industry → use a **searchable combobox / autocomplete selector**.
- If no, and the values are a small closed enum that does not grow → a plain `<select>` is acceptable.
- Never accept silent free text for a critical entity.

### Always searchable combobox

Apply searchable combobox to (at minimum) Linked Record, Owner, Client / Account, Department / Business Unit, Brand / Manufacturer, Product / License, Provider / Vendor, Distributor, Reseller / Partner, Location, Cost Center, Alert Policy, Document Type, Coverage Type, Support Level, Country, Currency, and any other catalog-managed entity. See `MEMORY.md §22` for the full list and rationale.

### May remain simple `<select>`

Closed small enums that are stable by design: Coverage Kind, Asset Type, Approval Status, Business Criticality, Priority, Task Status, Renewal Stage, Risk Level, Notice Period, Billing Cycle, Entitlement Metric, Field Type, Relationship Type, Suggestion Basis, Record Type, Import Scope Mode.

### "Create new" behavior

- MVP / local: simulated. New value is added to the local / session catalog so the user can complete the form.
- Backend: permission-aware. "Create new" is gated by role (workspace admin, ops / procurement admin, finance admin, etc.). The UI must be designed so a future permission check can hide the affordance without redesign.
- Duplicate detection must run before create — case-insensitive and accent-insensitive, reusing `normalizeImportText` or equivalent.

### Import behavior

- Imports must match source values against the existing catalog before treating them as new entities.
- Unmatched values become **suggested / new entities for review** in the import preview — never created silently.
- Possible duplicates ("Banisi" vs "Banisi " vs "Banisí") must show a warning before create.
- The user must explicitly approve, edit, merge into an existing entity, or skip each staged entity.

### Accessibility

- ARIA combobox pattern is mandatory: `role="combobox" aria-expanded aria-controls aria-activedescendant` on the input, `role="listbox"` on the popup, `role="option" aria-selected` on each item.
- Keyboard navigation must work: Up / Down to move, Enter to select, Escape to close, Home / End to jump, type-to-search.
- Do not rely solely on the mouse. Touch users on small catalogs may degrade gracefully to a native `<select>`.

### Free text is not allowed for critical entities

Storing a critical entity as silent free text in a record meta or column is forbidden. The catalog owns the identity. Free text remains acceptable only for instance-specific labels (Asset Name, Notes) and for primary identifiers (Serial Number) that are deduplicated at write time.

### Do not over-migrate

Do not replace small closed enums with a combobox where a simple `<select>` is clearer and faster. The rule targets entities that grow; it does not target every dropdown.

See `MEMORY.md §22` for the full Searchable Combobox / Controlled Catalog Model product decision, the per-field categorisation, MVP vs commercial backend behavior, and the six-phase implementation plan (S1 primitive, S2 entity fields, S3 controlled catalogs, S4 import integration, S5 duplicate / alias detection, S6 backend RBAC and audit). Both documents must stay in sync.
