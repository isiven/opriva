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
- `opriva-design-fundamentals-auditor` — universal enterprise design fundamentals
  (typography, color/contrast, spatial, motion, interaction, responsive, UX writing)
  calibrated to Opriva's data-heavy screens. Pairs with the visual/UX/design-system
  lenses; inspired by `pbakaus/impeccable` (Apache 2.0) — see `THIRD_PARTY_NOTICES.md`.
- `opriva-dashboard-ux-reviewer` — dashboard usefulness, KPI meaning, renewal risk
  visibility, MSP vs Internal IT leadership needs.

See `OPRIVA_AI_DEVELOPMENT_TEAM.md` §6 for recommended lens combinations by task type.

These lenses are advisory and support inspection, planning, implementation and
validation. They do not override explicit user instructions, file-safety rules or
validation requirements.

---

## 5. Cross-Agent Skill Parity (Claude Code ↔ Codex)

Opriva is developed across Claude Code and Codex. Any external design, UX, taste
or methodology skill adapted for Claude Code must also be adapted — or clearly
planned — for Codex, and vice versa, to avoid drift between agents.

When the user states that work is continuing in Codex, remind them to replicate
or adapt approved Claude Code skills for Codex parity before proceeding with
non-trivial work.

Three external design-skill sources are currently under research only (no install,
no adapt approved): `emilkowalski/skill`, `pbakaus/impeccable` (Apache 2.0) and
`Leonxlnx/taste-skill` (MIT). The canonical record — sources, formats, licenses,
likely Codex target locations (`.codex/`, `.agents/`, the existing `skills/`
directory, `AGENTS.md`) and the parity rule — lives in
`OPRIVA_AI_DEVELOPMENT_TEAM.md` §10.1–§10.2 and §11.1. See also `AGENTS.md` §14.

---

# Opriva Agent Operational Rules

> Operational agent rules for Claude Code / Codex sessions. Appended by the
> agent-infrastructure setup. These complement (do not replace) the §1–§5
> guidance-loader sections above.

## Proyecto

Opriva: SaaS de IT/vendor asset management para dos workspace modes:

- MSP / Integrator
- Internal IT

Repo: isiven/opriva
Stack: React + Vite, con arquitectura actual todavía concentrada principalmente en `source/App.jsx`.

## Regla A1 — Leer antes de hacer

Al iniciar cualquier sesión:

1. Leer `CLAUDE.md`.
2. Leer `MEMORY.md` si existe.
3. Leer `OPRIVA_CRITICAL_TO_ADVANTAGE_ROADMAP.md` si existe.
4. Listar `tasks/`.
5. Ejecutar:
   ```bash
   git branch --show-current
   git status --short
   git log --oneline -8
   ```

No asumir que una tarea está pendiente solo porque exista un archivo viejo. Verificar el estado real del código y git.

## Regla A2 — Flujo de trabajo

Para cualquier cambio:

1. Audit read-only primero.
2. Reportar plan y riesgos.
3. Esperar aprobación de Isaac.
4. Implementar una sola fase pequeña.
5. Ejecutar:
   ```bash
   npm run build
   git diff --check
   git status --short
   ```
6. Reportar QA.
7. Esperar aprobación para commit.
8. No hacer push/PR/merge salvo instrucción explícita.

## Regla A3 — Scope

No tocar archivos fuera de scope.
Especialmente:

- No modificar `source/App.jsx` en tareas de infraestructura.
- No tocar import/coverage si la tarea es de forms.
- No tocar backend inexistente.
- No instalar dependencias sin aprobación.
- No crear `.env`.

## Regla A4 — Reviewers

Aplicar reviewers relevantes:

- `architecture-reviewer`
- `backend-readiness-reviewer`
- `enterprise-ux-reviewer`
- `workspace-mode-reviewer`
- `import-data-model-reviewer`
- `accessibility-reviewer`
- `it-procurement-vendor-management-reviewer`
- `ciso-security-reviewer`

No usar todos siempre. Usar los relevantes a la fase.

## Regla A5 — Estado actual de Forms

No repetir como pendientes:

- CORE-3: Brand/Vendor searchable + Brand en License MSP.
- CORE-2: License MSP provider key unificada.
- Forms-fix-1: Edit License MSP reconstruye Vendor Cost.
- Core-4a: Tasks context-aware.
- Core-4b: Documents context-aware.

Siguiente fase recomendada:

- CORE-4c audit: Documents linked record persistence.

## Regla A6 — Local sandbox

Mientras no exista backend real:

- No usar datos reales de clientes.
- El banner Local Sandbox debe permanecer visible.
- No vender esto como production-ready.
- No hacer pilotos corporativos con datos reales.

## Regla A7 — Backend foundation

El siguiente gran salto del proyecto no es más UI local, sino:

- Auth
- Workspaces como tenant real
- RBAC
- Persistencia
- File storage
- Audit trail
- Import jobs
- Alerts/email jobs

Ver `OPRIVA_CRITICAL_TO_ADVANTAGE_ROADMAP.md`.

## Regla A8 — Notificación opcional

Después de crear un PR, se puede ejecutar:

```bash
python scripts/notify.py \
  --task "NOMBRE_DEL_TASK" \
  --pr "URL_DEL_PR" \
  --summary "Resumen corto" \
  --status "QA pasó · build limpio"
```

Si falla la notificación, reportar error pero no bloquear el PR.
