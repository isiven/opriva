# Opriva Critical-to-Advantage Roadmap

> **Master execution document.** Converts the critical gaps found in the global
> Opriva audit into a prioritized roadmap where each gap, built correctly,
> becomes a competitive advantage.
>
> **Honest status (do not overstate):** Opriva is **not production-ready and not
> corporate-pilot-ready today.** It is a high-fidelity **local prototype**: all
> runtime state is React in-memory (≈89 `useState` hooks + a module-level
> `RECORD_STORE` singleton). There is **no persistence, no authentication, no
> RBAC, no tenant isolation, no file storage, and no real audit trail** in
> execution. A page refresh loses all data. The product/UX design and the
> written specifications are strong; the running infrastructure is not.
>
> The critical points below are **not cosmetic defects** — they are the
> **differentiation backlog**. Each one, built with intent (not merely patched),
> turns into a reason to buy. But persistence, auth, RBAC, tenant isolation and
> file storage are **non-optional**: they are the line between "impressive demo"
> and "sellable product." The critical→advantage conversion happens **in the
> backend**, not in more local UI.
>
> Source: Opriva Full Product & Architecture Audit and the Critical-to-Advantage
> analysis generated on 2026-06-01. Cross-references: `BACKEND_READINESS_AUDIT.md`,
> `BACKEND_ARCHITECTURE_PLAN.md`, `CANONICAL_DATA_MODEL_SPEC.md`, `MEMORY.md §23`.

---

## 1. Executive Summary

- **Opriva is strong where it is hard to be strong**: product, UX, conceptual
  data model and documentation. The "what to build" is largely solved (2600+
  lines of specs). That is a real competitive moat.
- **Opriva is weak where it is expensive to be weak**: backend, persistence,
  auth, RBAC, audit trail — all in React in-memory state. None of it exists in
  execution today.
- **Thesis of this roadmap**: every critical gap is a **latent differentiator**
  if built with intent. Example: import is not debt — it is **import
  intelligence** that is commercializable.
- **Differentiator #1 (procurement/renewals)**: few tools cleanly join
  license↔hardware↔contract↔coverage↔document↔renewal with dual-mode MSP/IT.
  Opriva already modeled it.
- **Differentiator #2 (model-driven import)**: mapping to a canonical model +
  dedup + entity staging + coverage inference = a high barrier vs competitors
  that import raw CSV.
- **Differentiator #3 (evidence + audit)**: if the audit trail is born
  append-only and documents are governed evidence, Opriva sells **compliance**,
  not just tracking.
- **Main risk**: continuing to accumulate local UI on top of a 7,400-line
  monolith without a backend → debt that delays the pilot without reducing the
  real risk.
- **Credibility risk**: demonstrating to a corporate client on volatile state =
  live data loss = commercial death. Never do it.
- **Key conversion**: workspace mode (today a visual toggle) → **real tenant
  isolation** = from "demo with two views" to "secure multi-client platform."
- **General recommendation**: **push/PR now → short local consolidation (1 week)
  → start Backend Phase 1.** The marginal value of more local UI is low; the
  value of persistence+auth is what unlocks sales.

---

## 2. Critical Points Inventory

| ID | Critical point | Sev | Module | Risk if not fixed | Opportunity if fixed |
|---|---|---|---|---|---|
| C1 | No persistence (in-memory) | P0 | All | Total loss on refresh | "Your data is always safe" — trust base |
| C2 | No auth / users | P0 | Platform | No multiuser, no pilot | Login + identity = enterprise entry |
| C3 | No server-side RBAC | P0 | Security | Uncontrolled access | Role-based permissions = CISO sale |
| C4 | Workspace = toggle, not tenant | P0 | Workspace | Cross-client leakage | Isolated multi-tenant = scalable MSP |
| C5 | File bytes not stored | P0 | Documents | Documents don't really exist | Secure evidence vault |
| C6 | Positional `row[]` data model | P0 | Data model | Fragile, not migratable | Named model = stable API |
| C7 | Activity is not a real audit trail | P1 | Activity | No reliable evidence | Append-only audit = compliance |
| C8 | Import does not persist | P1 | Import | Import "is lost" | Auditable import jobs = trust |
| C9 | No alerts / jobs / email | P1 | Alerts | No proactive value | Renewal alerts = reason to buy |
| C10 | `riskLevel` manual | P1 | Licenses | Inconsistent analytics | Derived risk = intelligence |
| C11 | `App.jsx` 7,403 lines | P1 | Architecture | Unmaintainable | Modular = team velocity |
| C12 | Dashboard over mock data | P1 | Dashboard | False metrics | Real KPIs = executive decisions |
| C13 | No catalog staging (`allowCreate=false`) | P2 | Catalogs | Rigid catalogs | Governed catalog management |
| C14 | Renewal Packages not implemented | P2 | Product | Missing bundle use case | Co-term / package deals |
| C15 | Reports prototype only | P2 | Reports | No executive output | Board-ready reporting |
| C16 | Partial focus management | P2 | A11y | Accessibility barriers | WCAG = enterprise requirement |
| C17 | Preview drawer without SearchableSelect | P2 | Forms | Create↔import inconsistency | Total consistency |
| C18 | No file scan / template validation | P1 | Import/Sec | Malicious content | Secure import |
| C19 | 158 inline colors, no tokens | P3 | UX | Visual inconsistency | Design system |
| C20 | Dead code (`relatedContracts`, fallback) | P3 | Debt | Confusion | Clean codebase |
| C21 | Saved views/filters do not persist | P2 | UX | No preferences | Personalization |
| C22 | No retention / PII policy | P1 | Security | Legal risk | GDPR-ready compliance |

---

## 3. Critical-to-Advantage Map

Format: problem → why it matters → conversion to advantage → resulting feature →
client impact → priority → technical dependency.

- **Backend/persistence (C1)**: in-memory → refresh loses everything →
  **reliable persistence** → "single source of truth that is never lost" → base
  trust → **P0** → DB.
- **Auth/users (C2)**: nobody logs in → no multiuser → **identity +
  collaboration** → login, invitations, real ownership → teams work together →
  **P0** → auth provider.
- **RBAC (C3)**: client-only logic → bypassable → **verified role-based
  permissions** → admin/ops/finance/viewer roles → CISO/IT-director sale →
  **P0** → backend middleware.
- **Tenant isolation (C4)**: workspace is a toggle → potential leakage →
  **multi-tenant isolation** → one MSP manages N clients without contamination →
  MSP scalability = market → **P0** → tenant column + API scoping.
- **File storage (C5)**: metadata only → empty documents → **secure evidence
  vault** → upload + signed URLs + scan → "centralized proof of
  license/warranty" → **P0** → object storage.
- **Audit trail (C7)**: mutable, fake actor → not evidence → **immutable
  append-only audit** → "who changed what and when" → compliance/forensics →
  **P1** → events table.
- **Import persistence (C8)**: volatile import → not auditable → **durable
  import jobs** → history of each import + conceptual rollback → trust in bulk
  ops → **P1** → import_jobs/rows.
- **Alerts/email (C9)**: visual only → no proactivity → **proactive renewal
  intelligence** → "Opriva warns you 90/60/30 days before" → **reason #1 to
  buy** → **P1** → cron jobs + email.
- **Controlled catalogs (C13)**: allowCreate=false → rigid → **catalog
  governance** → create-with-approval + aliases + dedup → clean data at scale →
  **P2** → catalog tables + RBAC.
- **Duplicate detection (C8/data)**: keys exist but don't persist → **reliable
  dedup** → "Opriva detects the duplicate before creating it" → data quality →
  **P1** → reuse `importDuplicates.js` in backend.
- **Positional model (C6)**: `row[]` fragile → not migratable → **named model**
  → clean API, typed fields → foundation of everything else → **P0** → part of
  persistence.
- **App.jsx monolith (C11)**: 7,400 lines → slow to change → **modular
  architecture** → team scales, fewer bugs → roadmap velocity → **P1** →
  incremental refactor.
- **SearchableSelect/governance (C13)**: combobox without create → **governed
  searchable catalog** → search + create-approved in one control → consistent
  premium UX → **P2** → backend catalog.
- **Derived riskLevel (C10)**: manual input → inconsistent → **calculated risk
  score** → "objective risk by expiration+coverage+evidence" → differentiating
  intelligence → **P1** → formula + data.
- **Dashboard KPIs (C12)**: mock → false → **real live KPIs** → real exposure,
  margin, renewals → executive decision → **P1** → backend data.
- **Reports (C15)**: prototype → **board-ready reporting** → scheduled PDF/Excel
  export → C-level deliverable → **P2** → report engine.
- **Activity history (C7)**: see audit trail above.
- **Security/CISO (C3/C22)**: local → risk → **sellable security posture** →
  isolation+RBAC+audit+encryption → unlocks enterprise → **P0/P1** → backend.
- **Accessibility (C16)**: partial focus → **WCAG-compliant** → focus-trap,
  contrast, keyboard → requirement for public tenders/enterprise → **P2** → UI.
- **Form consistency (C17)**: native Preview drawer → **total create/edit/import
  consistency** → same experience everywhere → perceived polish → **P2** →
  renderer unify.
- **Templates/validation (C18)**: no validation → **secure, guided import** →
  structure validation + scan → confidence in bulk → **P1** → backend import.
- **Local-state (C1)**: see persistence.
- **Sandbox/demo logic (C20)**: mock intertwined → **clear demo/real
  separation** → seed only in dev → clean product → **P3** → environment flag.

---

## 4. P0 Must-Fix Before Corporate Pilot

These five gate the corporate pilot. **Without them, a real corporate pilot is
not possible.** Everything else is secondary to these.

| Item | Today | Must exist | Recommended implementation | Backend | Risk | Commercial advantage |
|---|---|---|---|---|---|---|
| **Persistence + named model** | `RECORD_STORE` in-memory, `row[]` | DB with typed records, stable IDs | Postgres + API layer; migrate row[]→object as part of this work | Yes | high | "Reliable data" |
| **Auth** | none | login, session, identity | Managed auth provider | Yes | medium | Enterprise entry |
| **RBAC** | client-side | server-side checks per endpoint | roles/permissions + middleware | Yes | high | CISO sale |
| **Tenant isolation** | UI toggle | workspace = tenant boundary | tenant_id everywhere + API/DB scoping | Yes | high | Multi-client MSP |
| **File storage** | metadata | bytes in object store + signed URLs + scan | storage + document_links | Yes | high | Evidence vault |

---

## 5. P1 Must-Fix Before Serious MVP

Necessary for a serious MVP, though not a complete enterprise pilot:

- **Append-only audit trail** (C7): immutable events with verified actor.
- **Import persistence** (C8): durable jobs/files/mappings/rows + dedup in backend.
- **Alerts + email** (C9): expiration jobs + notifications — the proactive value
  is the reason for daily use.
- **Derived riskLevel** (C10): remove manual input, calculate it.
- **Real dashboard KPIs** (C12): feed from backend data.
- **App.jsx modularization** (C11): extract Import engine + Screens (reduces
  regression risk).
- **File scan / template validation** (C18): import security.
- **PII/retention policy** (C22): minimum viable compliance.

---

## 6. P2 Product Differentiators

Improvements that make Opriva competitive:

- **Import intelligence**: AI mapping + dedup + entity staging + coverage
  inference (already prototyped) → "onboarding in minutes, not weeks."
- **Renewal Packages / co-term** (C14): license+hardware+support bundles with a
  common date → premium MSP use case.
- **Vendor/procurement intelligence**: brand/provider/distributor/reseller +
  margin + quotes/PO/invoice as evidence → differentiator in the procurement
  segment.
- **Document Evidence Center**: missing-evidence signals + document policies →
  "compliance dashboard."
- **Governed AI assistant**: retrieval with permissions + mapping/risk
  suggestions → assistant that respects tenant boundaries.
- **Board-ready reporting** (C15): scheduled exposure/margin/renewals export.
- **Role-based dashboards**: CIO (budget/risk) vs MSP (margin/pipeline).
- **Catalog governance** (C13): create-with-approval, aliases, merge/deactivate.
- **Compliance/audit**: audit trail + retention + access logs as a sellable
  feature.

---

## 7. Backend Foundation Plan

Already specified in `BACKEND_READINESS_AUDIT.md §9-10` and
`BACKEND_ARCHITECTURE_PLAN.md`. Synthesis:

- **Entities/tables**: workspaces, users, workspace_members, roles, permissions,
  clients, departments, products, licenses, hardware_assets, contracts,
  support_coverage, documents, file_objects, document_links, tasks,
  activity_events, relationships, renewal_packages, package_items,
  import_jobs/files/mappings/rows, custom_fields, alert_policies, notifications,
  saved_views/filters, settings.
- **Relationships**: real foreign keys + typed `relationships` table (today
  UI-only).
- **File storage**: object store + signed URLs + checksum + scan status.
- **Audit events**: append-only, actor from the session token, immutable.
- **Import jobs**: persisted state machine (upload→parse→map→validate→preview→confirm).
- **Notifications**: in-app + email + future channels.
- **RBAC**: roles per workspace, grants per resource/action, check on every
  endpoint.
- **Tenant model**: workspace = tenant; `workspace_id` on every table; mandatory
  scoping.
- **APIs**: CRUD per entity + auth + import + file + search/filter + reports
  (full list in `BACKEND_READINESS_AUDIT.md §10`).
- **Background jobs**: expiration alerts, file scans, report generation.

---

## 8. UI / UX Consolidation Plan

Without accumulating more debt:

- **Forms**: unify the 3 renderers (New/Edit/Preview) into one spec-driven
  renderer (resolves C17).
- **Drawers/modals**: focus-trap + consistent Escape (C16).
- **SearchableSelect**: already solid; prepare an `allowCreate` prop for future
  staging (without activating it).
- **Empty states**: already exist; connect them to real cases.
- **Trust indicators**: add a visible "Sandbox — data not persistent" banner
  (operational honesty is **critical**).
- **Import confidence**: already good (severity + gating); keep it.
- **DO NOT**: new modules, new screens, new local fields.

---

## 9. Security & Compliance Plan

Turn security into a sellable advantage:

- **Tenant isolation**: scoping at API/DB/storage level (not just UI).
- **RBAC**: server-side, per endpoint, with enterprise roles
  (admin/ops/finance/viewer).
- **Audit logs**: append-only, immutable, exportable → forensic evidence.
- **File scanning**: antivirus/malware on upload.
- **Document permissions**: access governed by role + restricted docs.
- **Encryption**: at-rest (DB+storage) and in-transit.
- **PII handling**: classify contact fields; minimization; no PII in logs.
- **Retention**: policies configurable per workspace.
- **Admin controls**: management of users/roles/policies.
- **Honest banner**: while it remains local, clearly mark that it is NOT safe for
  real data.

---

## 10. Data Model Hardening Plan

How to move from local prototype to a robust model:

- **row[] → named fields**: the foundational change; each record is
  `{field: value}` typed.
- **Stable IDs**: backend UUIDs, not `Date.now()+random`.
- **Foreign keys**: real client_id, owner_id, product_id.
- **Relationships**: navigable typed table.
- **Duplicate keys**: port `importDuplicates.js` to a backend constraint/check.
- **Controlled catalogs**: per-catalog tables with normalization.
- **Aliases**: "Banisi" = "Banisí" = "Banisi " → one canonical id.
- **Merge/deactivate**: management of catalog entries.
- **Import reconciliation**: matching against the existing catalog + staging of
  new entities.

---

## 11. Recommended Roadmap

| Phase | Objective | Deliverables | Do NOT do yet | Required QA | Done when |
|---|---|---|---|---|---|
| **Now / Local consolidation** | Back up + clean | Push/PR; derive riskLevel; extract Import engine; dead code; focus-trap; sandbox banner | New modules; allowCreate; backend | build + per-module QA on localhost | PR merged, monolith reduced, basic a11y |
| **Backend Foundation** | Persistence + identity | DB, auth, workspaces=tenant, RBAC, named model, core API | Advanced reports; AI retrieval; custom fields | API tests + tenant isolation + RBAC | records persist, login works, tenants isolated |
| **Corporate MVP** | Real pilot | File storage, durable import, append-only audit, alerts+email, real dashboard | Public beta; billing | E2E import with real file; basic pen-test | one real client can use it without data loss |
| **Beta SaaS** | Multi-client | Onboarding, saved views, reports, catalog governance, multichannel notifications | Enterprise features (SSO, SCIM) | load + security + UX | several productive workspaces |
| **Enterprise-ready** | Enterprise sale | SSO/SAML, SCIM, retention, compliance certs, SLA | — | external audit, WCAG AA | tender requirements met |

---

## 12. Top 20 Next Actions

| # | Prio | Action | Why | Advantage created | Risk | Effort | Dependencies | Reviewers |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | Push + PR current branch | remote backup | continuity | low | XS | — | — |
| 2 | P1 | Derive riskLevel | rule §5 | objective risk | low | S | — | data-model |
| 3 | P1 | Extract Import engine from App.jsx | monolith | maintainability | medium | M | — | architecture |
| 4 | P3 | Clean dead code | clarity | clean codebase | low | XS | — | architecture |
| 5 | P2 | Focus-trap drawers/modals | a11y | WCAG | low | S | — | accessibility |
| 6 | P0 | "Sandbox not persistent" banner | honesty | trust/security | low | XS | — | ciso, ux |
| 7 | P0 | Backend: auth + session | identity | enterprise login | high | L | infra | backend, ciso |
| 8 | P0 | Backend: workspace=tenant + scoping | isolation | multi-client MSP | high | L | #7 | backend, ciso, workspace |
| 9 | P0 | Backend: server-side RBAC | security | CISO sale | high | L | #7,#8 | ciso, backend |
| 10 | P0 | Persistence + row[]→named | base of all | reliable data | high | XL | #7,#8 | architecture, data-model |
| 11 | P0 | Secure file storage | real documents | evidence vault | high | L | #10 | ciso, backend |
| 12 | P1 | Append-only audit | compliance | evidence | medium | M | #10 | ciso |
| 13 | P1 | Persistent import jobs | auditable bulk | import trust | high | L | #10 | import-data-model |
| 14 | P1 | Alerts + email jobs | proactivity | reason to buy | medium | M | #10 | backend, cio |
| 15 | P1 | Real dashboard KPIs | decisions | executive | medium | M | #10 | dashboard, cio |
| 16 | P2 | Backend catalog governance | clean data | scale | medium | M | #10,#9 | procurement, data-model |
| 17 | P2 | Renewal Packages | bundle | premium MSP | medium | M | #10 | procurement, msp |
| 18 | P2 | Board-ready reports | C-level output | enterprise | medium | M | #15 | cio, dashboard |
| 19 | P2 | Unify renderers (Preview F3b) | consistency | polish | medium | S | — | ux, forms |
| 20 | P3 | Design tokens (158 hex) | visual consistency | design system | low | M | — | visual-design |

---

## 13. What We Should Stop Doing

- ❌ **Adding more features/fields/modules locally** — diminishing marginal value
  on a monolith without a backend.
- ❌ **Polishing local UI that will be rewritten** when connecting the backend
  (do not invest in the disposable).
- ❌ **Migrating row[]→object in isolation from the persistence work** — double
  work.
- ❌ **Treating the sandbox as demonstrable to clients with real data** — risk of
  live data loss.
- ❌ **Repeated audits/QA without progress** — we already have a clear diagnosis;
  execute, don't re-diagnose.
- ❌ **Re-sending duplicate prompts/commits** — consumes credits without
  progress.
- ❌ **Building alerts/reports/email on the client** — they require server-side
  jobs; doing it locally is throwaway.
- ❌ **Installing external orchestrators** (Ruflo etc.) — already audited,
  invasive.

---

## 14. Final Recommendation

- **Stay local?** Only for **scoped P1 consolidation** (actions #1-#6): push,
  riskLevel, extract Import engine, dead code, focus-trap, banner. **Not** for
  new features.
- **When to push/PR?** **Now** (action #1). 7 stable commits, green build, clean
  tree. Without a remote backup it is the cheapest risk to eliminate.
- **When to start backend?** **Immediately after consolidation** (≤1 week). It is
  the only path to the pilot and all the design is already written.
- **Exact phase now**: **(1) Push + PR → (2) Local consolidation sprint, 1 week →
  (3) Backend Phase 1 (auth + tenant + RBAC + persistence)**.

**Honest verdict**: Opriva has a **class-A product on class-F infrastructure**.
The critical points are not embarrassing defects — they are the **differentiation
backlog**: each one, built well, is a reason to buy. But they are **not optional
or cosmetic**: persistence, auth, RBAC, tenant and file storage are the line
between "impressive demo" and "sellable product." The critical→advantage
conversion is real, but it happens **in the backend**, not in more local UI.

---

*This is a planning document. No application code, backend, dependencies or
configuration are created or changed by writing it. Opriva remains a local /
sandbox prototype until the Backend Foundation phase is executed.*
