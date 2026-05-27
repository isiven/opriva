# CLAUDE.md — Opriva Project Guidance Loader

This file makes Claude Code automatically load Opriva's project guidance at the
start of every session. Opriva has enough product, data-model, import, security
and backend-readiness complexity that a single generic coding pass is not enough.
Read and follow the authoritative guidance below before doing significant work.

---

## 1. Authoritative Guidance Files

Opriva's authoritative guidance lives in these files. Read them as needed and
treat them as the source of truth for how to work in this repository:

- **`AGENTS.md`** — Primary always-on project rules. **Read this first.**
- **`OPRIVA_DEVELOPMENT_METHODOLOGY.md`** — The development methodology to follow
  (inspect → plan → minimal change → verify → commit; authority hierarchy).
- **`OPRIVA_AI_DEVELOPMENT_TEAM.md`** — The virtual AI reviewer team / expert-role
  operating model. Use for major decisions and skill selection.
- **`skills/`** — Opriva review lenses (one `SKILL.md` per lens). Use when requested
  or when a task calls for a specific lens (see §4).
- **`MEMORY.md`** — Project memory: product decisions, history, roadmap.
- **`INTELLIGENT_BULK_UPLOAD_DESIGN.md`** — Import / bulk-upload design and rules.
- **`CANONICAL_DATA_MODEL_SPEC.md`** — Canonical record model and field definitions.
- **`BACKEND_ARCHITECTURE_PLAN.md`** — Planned backend architecture for corporate MVP.
- **`BACKEND_READINESS_AUDIT.md`** — What must move from local/sandbox to backend.

Supporting docs (read when relevant): `USER_GUIDE.md`, `AI_KNOWLEDGE_BASE.md`,
`OPRIVA_IMPORT_TEMPLATE_SPEC.md`, `IMPORT_MAPPING_*.md`, `DESIGN.md`.

---

## 2. How Claude Code Must Work in This Repository

- **Read `AGENTS.md` first**, then follow `OPRIVA_DEVELOPMENT_METHODOLOGY.md`.
- **Use `OPRIVA_AI_DEVELOPMENT_TEAM.md`** for major product, architecture, backend,
  import, security, UX, data-model, catalog, dashboard or workflow decisions.
- **Use the relevant Opriva skills / review lenses** (from `skills/`) for audits and
  implementation planning, especially for strategic changes.
- **Inspect before implementing.** Report what exists, the affected files, risks and
  likely failure points before changing anything.
- **When asked for inspect-only:** never modify files, never write code, never commit.
  Report first.
- **Before any commit involving code:** run `npm run build` and `git diff --check`.
  Also run `git status --short` and confirm the working tree is clean or explained.
- **Keep commits focused.** Stage only related files. Do not mix refactor, behavior
  and documentation unless intentionally related.
- **Never include `private-samples/`** (real client files) in any commit. Never commit
  `.env`, keys, credentials, or real customer exports.
- **Never install external repositories, plugins, MCP servers, hooks or dependencies
  without explicit user approval.** External skills/methodologies may be researched
  only and treated as supply-chain inputs; adapt useful patterns into Opriva-specific
  guidance instead of installing them.

---

## 3. Core Opriva Rules (Non-Negotiable)

- **Local / sandbox now.** Local/session state is for UX and product-logic validation
  only — never treated as production-ready behavior.
- **Backend is required later for corporate MVP.** Do not add backend, database,
  storage, auth, API routes or persistence unless explicitly requested. When a feature
  implies persistence/auth/permissions/storage/audit, document it as backend-required.
- **Import must be model-driven, not spreadsheet-driven.** Do not blindly import every
  column. Map source data into Opriva canonical fields. AI suggests; the user approves
  and confirms the import target. Imported records become first-class canonical records.
- **Controlled catalogs are mandatory** for repeated, business-critical values.
- **No unrestricted free text** for repeated business entities — including Brand /
  Manufacturer, Product / License Name, Distributor / Provider, Vendor / Provider,
  Reseller / Partner, Client / Department, Owner, Alert Policy, Document Type,
  Contract Type, Support Coverage Type, License Term, Currency and Country.
- **Entity detection / staging is required during import.** Detect and stage clients,
  contacts, brands, products, providers, distributors, resellers, records and
  relationships; match against existing values; require user approval before creation.
- **Sensitive contacts / emails require review.** Treat them as sensitive relationship
  context. Do not import or auto-create them blindly.
- **Assets & Renewals is the unified renewal worklist** — a projection of any canonical
  record with a renewal, expiration, warranty, support, certificate or contract date.
- **MSP / Integrator and Internal IT must both be considered** on every relevant
  product, data, UI, import and reporting change. They are not interchangeable.

Additional model rules (see `AGENTS.md` §5 and `MEMORY.md`): Support Coverage is a
related contract/coverage record (not a text field); Tasks are linked operational
entities; Activity must become an audit trail; Relationships must be navigable;
Status, Days to Expiration, Risk, Margin, Renewal Stage and Missing Evidence are
calculated/derived, never manual fields.

---

## 4. Opriva Review Lenses (`skills/`)

The `SKILL.md` files under `skills/` are **Opriva review lenses**, not external or
auto-installed capabilities. Use them when requested, or when a task matches a lens:

- `opriva-software-architecture-auditor` — architecture, modularity, local store,
  App.jsx complexity, backend migration risk.
- `opriva-backend-readiness-auditor` — what must move from local/sandbox to backend.
- `opriva-import-data-model-auditor` — model-driven import, mapping, duplicate
  prevention, entity detection, canonical promotion.
- `opriva-cio-it-director-reviewer` — operational visibility, renewal control, budget,
  risk, leadership reporting.
- `opriva-ciso-security-compliance-reviewer` — auth, permissions, tenant isolation,
  document security, audit trail, AI boundaries, local-only risk.
- `opriva-it-procurement-vendor-reviewer` — brand/provider/distributor/reseller,
  quotes, POs, invoices, warranties, support coverage, catalog governance.
- `opriva-msp-integrator-operations-reviewer` — clients, account ownership, renewal
  pipeline, margins, distributor workflows, sales-to-operations handoff.
- `opriva-enterprise-ux-reviewer` — enterprise quality, clarity, bulk-first workflows,
  empty states, warnings, confirmation confidence.
- `opriva-enterprise-visual-design-reviewer` — layout polish, typography, density,
  drawers, tables, dashboards.
- `opriva-design-system-auditor` — design consistency, reusable patterns, hierarchy,
  workspace-specific terminology.
- `opriva-dashboard-ux-reviewer` — dashboard usefulness, KPI meaning, renewal risk
  visibility, MSP vs Internal IT leadership needs.

See `OPRIVA_AI_DEVELOPMENT_TEAM.md` §6 for recommended lens combinations by task type.

These lenses are advisory and support inspection, planning, implementation and
validation. They do not override explicit user instructions, file-safety rules or
validation requirements.
