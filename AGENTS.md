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

## 18. Form Field Architecture Rule

Opriva's create and edit forms must stay consistent across Licenses, Hardware, Contracts, Documents, Support Coverage and Tasks. When modules share a concept, the field must use the same order, control type and (workspace-aware) label.

### Standard field order

Name / Identity → Type → Client / Department → Brand / Manufacturer → Provider / Distributor → Owner → Quantity / Serial / File → Money / Value / Cost → Key Dates → Alert Policy → Optional / Advanced metadata → Notes.

### Control type

- Searchable combobox (per §17): Client / Department, Owner, License / Product, Brand / Manufacturer, Provider / Distributor, Reseller / Partner, Location, Cost Center, Linked Record, Uploaded by, and Support / Coverage Name when catalog-backed.
- Simple `<select>` (closed enums): Alert Policy, License Term, Approval Status, Business Criticality, Risk Level, Renewal Stage, Hardware Type, Contract Type, Coverage Type, Notice Period, Task Priority, Task Status, Task Type, Document Type, Import Scope Mode.

### Required vs Optional

Required universally: identity / name, client / department where applicable, owner, key date. MSP / Integrator may also require sale / value and vendor cost for margin. Internal IT may also require cost center, approval status and business criticality for governance. Secondary metadata (model, location, notice period, custom reminders, notes) belongs in Optional / Advanced.

### Computed fields

Margin, Days to Expiration, System Status and similar derived values must never be manual inputs. Risk Level is a candidate for derivation and must be reviewed, not assumed to be free user entry.

### Preserve intentional workspace differences

Do not unify: Client vs Department; Renewal / commercial Owner vs IT Owner / Budget Owner / Custodian; Sale + Vendor Cost + Margin vs Annual Cost + Cost Center + Approval + Criticality; Distributor / Provider vs Provider. These are MSP / Integrator vs Internal IT product signal.

### Renderer and label safety

- Do not add more one-off form renderers; prefer field specs consumed by shared renderers, and make future renderers respect flags such as `useSearchableSelect`.
- Do not rename existing labels or keys casually. `buildNewRow`, import mapping (`IMPORT_CANONICAL_FIELDS`, `importMapping.js`), detail / edit drawers, prefill and filter specs may depend on exact labels and keys. Any label or key change requires a full impact audit first.

### Phased rollout

F1a document architecture (this rule + `MEMORY.md §23`); F1b remove dead `NEW_RECORD_FIELDS` code where safe; F1c refactor Tasks into field specs; F2 continue SearchableSelect rollout in New Record forms; F3 extend SearchableSelect to Edit / Preview renderers; F4 future backend / catalog integration.

See `MEMORY.md §23` for the full Form Field Architecture / Form Consistency Model, including shared vs module-specific fields and detailed rationale. Both documents must stay in sync.

## 19. Honest Sandbox / Demo Mode Rule

Permanent operational rule for Claude Code, Codex and all Opriva reviewers. Applies
to all UI, copy, audits, PRs, demos and product decisions until the corporate
backend exists. Product decision record lives in `MEMORY.md §25`; both must stay in
sync. Grounded in AUDIT-1.

Opriva must never generate a false sense of production while it is local/sandbox.

- **Sandbox framing.** Until real backend (auth, tenant/workspaces, RBAC,
  persistence, secure file storage, `relationships` table, append-only
  `activity_events`, import jobs, alert jobs), present every local feature as
  sandbox / demo / preview where applicable. Never sell or demo local/session
  state as production.
- **Label mock data.** Mock/sample/hardcoded data on visible surfaces (dashboards,
  Attention Center, Reports, KPI cards, forecasts) must be labeled **sample / demo
  data** and must not read as live metrics.
- **Future actions must not look functional.** Unimplemented actions must be
  `disabled` or marked **Coming soon / Backend required / Preview**. Reuse the
  honest pattern (`disabled` + `aria-disabled` + tooltip) from the REL-2b
  Relationships buttons and the "Rollback (backend)" import control.
- **Enterprise claims wait for backend.** Audit log, RBAC, permissions,
  workspace-scoped access, secure document storage, AI approval workflows,
  encrypted file storage, tenant isolation, automated alerts and scheduled reports
  must wait for backend or be marked backend-required. Do not state them as active.
- **Opriva AI is Preview while scripted.** Label it Preview / Demo Assistant /
  scripted sample responses. Do not present it as a real LLM or autonomous agent;
  its quick actions must not appear to execute real autonomous work.
- **Activity is session activity.** Local Activity is session / sandbox activity,
  not a real audit trail. The real audit trail is append-only `activity_events` in
  the backend, distinct from the `relationships` table.
- **Documents upload is not secure storage.** Sandbox upload/attach is
  local/metadata-only; make clear that secure storage requires backend.
- **Confirmed imports are not persistent.** Real import becomes persistent import
  jobs with history and audit trail in the backend.
- **Keep using the review team.** Every important change keeps using the Opriva
  agent/reviewer team (Product Manager senior, Enterprise SaaS Architect, Backend
  Readiness Auditor, CIO / IT Director, CISO / Security Auditor, IT Procurement /
  Vendor Management, Enterprise UX Auditor, Data Model / Import Architect, QA /
  Regression Auditor, Accessibility Auditor, Technical Debt / Refactor Auditor).

The UI changes that enforce this rule land in the
`cleanup/pre-backend-product-simplification` phase (subphases C1–C8); the
table-projection vs derivation-engine alignment (C10) touches logic and is deferred
to its own branch after the backend spike. See `MEMORY.md §25` for the full rule.

## 20. Functional Completion Before Backend

Permanent strategic criterion for the pre-backend phase. Extends §19. Product
decision record lives in `MEMORY.md §26`; both must stay in sync.

Before backend, Opriva must be honest (per §19) **and** functional in local/sandbox
wherever reasonable. The pre-backend goal is not to disable or hide everything
incomplete — it is to finish every reasonable local/sandbox capability **without
faking production**, and reserve disabled / Coming soon / Backend required only for
what truly needs backend.

**Decision rule — apply before disabling anything.** Before marking an action as
`disabled`, Coming soon or Backend required, answer: *"Is there a useful
local/sandbox version we can implement now without faking production?"*

- **If yes:** propose and (when safe) build the local version with honest copy.
  Never promise persistence, real security, real scheduling, multi-user, a real
  audit trail or real AI. Implement only if safe and architecturally non-breaking.
- **If no:** mark Coming soon / Backend required / Preview and explain why.

**Mandatory classification.** Classify every pending item as: **A** local/sandbox
now · **B** partial local/sandbox · **C** backend required · **D** hide/remove.

**Class C (do not fake locally):** auth, tenant isolation, RBAC, durable
persistence, secure document storage, scheduled reports + delivery, append-only
immutable audit trail, background jobs, real/autonomous AI, email notifications,
import job history/rollback, catalog governance, persistent saved views,
server-side search/filter at scale.

**Review team.** Every important decision is reviewed with the full Opriva
agent/reviewer team (see §13 / `MEMORY.md §26.6`).

Recommended next subphases (reframed: complete-local-where-feasible, disable only
true-backend): C4 Activity honest naming → C10 Dashboard derivation → C3b Reports
local → C6 functional filters/columns → C1b Opriva AI rule-based local → C5
Documents sandbox → C8 security-claims honest → C7 dead-code cleanup. See
`MEMORY.md §26` for the full criterion.

## 21. Mandatory Agent-Review Section

Every important Opriva audit, product/architecture/backend decision, or relevant
implementation report must explicitly include a **"Revisión por agentes"** section.
Reaffirms and operationalizes §13 (AI Development Team) and `MEMORY.md §26.6` — the
review must be *visible in the report*, not just implied.

**When the full 11-reviewer table is required** (audits; product, architecture,
backend, security, data-model and enterprise-UX decisions; imports; documents;
relationships; permissions; dashboards; reports; AI assistant; any change to
product architecture or business logic):

```
Revisión por agentes

| Revisor | Aprueba | Preocupa | Recomienda | ¿Bloquea? |
|---|---|---|---|---|
| Product Manager senior | ... | ... | ... | Sí/No |
| Enterprise SaaS Architect | ... | ... | ... | Sí/No |
| Backend Readiness Auditor | ... | ... | ... | Sí/No |
| CIO / IT Director | ... | ... | ... | Sí/No |
| CISO / Security Auditor | ... | ... | ... | Sí/No |
| IT Procurement / Vendor Management | ... | ... | ... | Sí/No |
| Enterprise UX Auditor | ... | ... | ... | Sí/No |
| Data Model / Import Architect | ... | ... | ... | Sí/No |
| QA / Regression Auditor | ... | ... | ... | Sí/No |
| Accessibility Auditor | ... | ... | ... | Sí/No |
| Technical Debt / Refactor Auditor | ... | ... | ... | Sí/No |

Veredicto del panel: Procede / Procede con condiciones / Bloqueado
```

**When a proportional review is acceptable** (mechanical / low-risk tasks: push,
commit, PR-readiness, simple housekeeping, minor docs-only changes): use a
condensed review (only the relevant reviewers + panel verdict) or state
**"No aplica revisión completa por ser tarea mecánica."**

**Blocking rule.** If any reviewer blocks (`¿Bloquea? = Sí`), do not implement until
the block is resolved or Isaac explicitly approves. Record the block and the
resolution in the report.

See `MEMORY.md §26.6` and `AGENTS.md §13` for the reviewer roster and operating model.
