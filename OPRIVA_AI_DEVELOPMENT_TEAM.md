# OPRIVA AI DEVELOPMENT TEAM

## 1. Purpose

Opriva should be developed with a council of specialized AI reviewers, not a single generic coding agent. The product combines enterprise SaaS UX, IT procurement, renewal operations, security, import intelligence, controlled catalogs, backend readiness and workspace-specific workflows. Each major decision should be reviewed through the right expert lenses before code is changed.

This operating model defines the virtual AI development team that should support Opriva through Codex, Claude Code and future agent workflows.

## 2. Core Operating Principle

Before major product, data model, architecture, import, security or UX changes, use the right combination of Opriva skills or expert roles to inspect, plan, implement, validate and document.

The expected pattern is:

1. Inspect current files and behavior.
2. Use the relevant review lenses.
3. Identify product, architecture, security, UX and backend implications.
4. Propose a minimal implementation plan.
5. Wait for user approval when the change is broad or strategic.
6. Implement focused changes.
7. Validate with build and diff checks.
8. Commit only related files.
9. Update memory or documentation when a product decision changes.

## 3. Current Installed Skills

### opriva-software-architecture-auditor

Reviews Opriva architecture, App.jsx complexity, modularization risk, local store design, demo seed data boundaries, import helper extraction, state management and backend migration risk.

### opriva-backend-readiness-auditor

Reviews whether local/sandbox behavior requires backend support before corporate MVP. It focuses on persistence, auth, workspaces, roles, permissions, storage, import jobs, audit trail, alerts, AI retrieval, reports and controlled catalogs.

### opriva-import-data-model-auditor

Reviews import mapping, canonical fields, source detection, records-to-create selection, bulk defaults, enrichment, duplicate prevention, entity detection, sensitive contact context and promotion into first-class Opriva records.

### opriva-cio-it-director-reviewer

Reviews Opriva from the perspective of a CIO or IT Director, focusing on operational visibility, renewal control, ownership, budget exposure, asset lifecycle, leadership reporting and business continuity value.

### opriva-ciso-security-compliance-reviewer

Reviews authentication, permissions, tenant isolation, document security, evidence handling, audit trail, AI boundaries, import privacy, sensitive data exposure and corporate pilot security blockers.

### opriva-it-procurement-vendor-reviewer

Reviews procurement and vendor logic, including brand/manufacturer, distributor/provider, reseller/partner, quote, PO, invoice, license certificate, warranty, support coverage, renewal package and catalog governance.

### opriva-msp-integrator-operations-reviewer

Reviews MSP / Integrator workflows, including client records, account ownership, commercial renewals, margins, distributor workflows, support coverage sold to clients, sales handoff and renewal pipeline operations.

### opriva-enterprise-ux-reviewer

Reviews whether workflows feel serious, clear and enterprise-ready. It focuses on step count, user confidence, warnings, empty states, bulk-first workflows, exception handling and confirmation clarity.

### opriva-enterprise-visual-design-reviewer

Reviews visual quality for enterprise SaaS: layout polish, typography, spacing, density, drawer design, tables, dashboards, empty states and avoiding toy/demo-looking screens.

### opriva-design-system-auditor

Reviews design consistency across modules, reusable patterns, component behavior, information density, visual hierarchy, tables, forms, drawers, tabs and workspace-specific terminology.

### opriva-design-fundamentals-auditor

Reviews universal enterprise SaaS design fundamentals — typography, color and contrast, spatial design, motion discipline, interaction states, responsive design and UX writing — calibrated to Opriva's data-heavy tables, drawers, dashboards, import flows and both workspace modes. Pairs with the visual-design and design-system lenses; does not replace them. Seven-domain structure is inspired by `pbakaus/impeccable` (Apache 2.0); see `THIRD_PARTY_NOTICES.md`. The canonical lens lives at `skills/opriva-design-fundamentals-auditor/SKILL.md`; the `.claude/skills/` copy mirrors it for Claude Code project-scoped loading. Codex-specific mirrors (`.codex/`, `.agents/`) are deferred until the active Codex tooling's loading path is verified per §10.2 / §11.1.

### opriva-dashboard-ux-reviewer

Reviews dashboard quality, executive usefulness, dashboard density, chart/table clarity, KPI meaning, renewal risk visibility and the distinction between MSP / Integrator and Internal IT leadership needs.

## 4. Recommended Additional Expert Roles

These roles may become future skills, Claude Code subagents or Codex guidance files.

- Product Architect
- Backend Architect
- Database / Catalog Governance Architect
- QA / Playwright Tester
- Git / Release Manager
- AI Governance Reviewer
- Documentation / PRD Writer
- Commercial Strategy Reviewer
- Implementation Planner

## 5. Expert Role Responsibilities

### Product Architect

**Purpose:** Protect Opriva's product direction and make sure features fit the master record model.

**What it reviews:** Product scope, module boundaries, workspace-mode differences, feature sequencing, whether a feature belongs in creation forms, drawers, dashboards, reports or backend workflows.

**When to use it:** Before adding new modules, changing record creation, changing import flows, changing workspace behavior or introducing workflow concepts.

**Required output:** Product fit, risks, recommended product behavior, what not to build yet and acceptance criteria.

**Risks it should catch:** Overbuilding, mixing workflow stages into core records, confusing License with Renewal Opportunity, putting relationships/documents/tasks into creation forms, and building frontend-only features that imply production readiness.

**Opriva-specific rules:** Opriva is model-driven. Core records, relationships, tasks, documents, support coverage, activity and import jobs are separate concepts.

### Backend Architect

**Purpose:** Translate the validated sandbox into a backend-backed corporate MVP architecture.

**What it reviews:** API boundaries, database tables, import jobs, storage, permissions, audit events, background jobs, alerts, search and reporting data.

**When to use it:** Before backend implementation, persistence decisions, auth/storage selection, import job planning or alert scheduler design.

**Required output:** Backend architecture, proposed entities, API groups, migration plan, risk table and phased implementation sequence.

**Risks it should catch:** Persisting UI-shaped data, missing tenant isolation, weak audit trail, insecure file handling, non-transactional import, and AI access outside permissions.

**Opriva-specific rules:** Backend is mandatory before corporate MVP. Local state is not production persistence.

### Database / Catalog Governance Architect

**Purpose:** Ensure repeated business-critical values are controlled catalogs, not unrestricted free text.

**What it reviews:** Brand, product, client/department, provider, distributor, reseller, owner, alert policy, document type, contract type, support coverage type, license term, currency, country and reusable classifications.

**When to use it:** Before import mapping changes, form field changes, catalog creation, duplicate handling, backend schema planning or bulk defaults.

**Required output:** Catalog ownership, normalized keys, aliases/synonyms, duplicate prevention, merge/deactivate rules, workspace/global scope and audit requirements.

**Risks it should catch:** Duplicate catalog values, free-text drift, unapproved AI-created values, wrong workspace scope and untraceable catalog merges.

**Opriva-specific rules:** Controlled catalog values must support select/search/create behavior, user approval, normalization and backend audit history.

### QA / Playwright Tester

**Purpose:** Validate critical Opriva workflows through browser-level testing.

**What it reviews:** Local app loading, navigation, Data Import flow, New Record, Configure Columns, Advanced Filters, drawer open/close, tab switching, record setup, forms and responsive layout.

**When to use it:** After frontend changes, drawer changes, import UX changes, table changes, routing-sensitive changes or visual layout updates.

**Required output:** Test plan, tested flows, pass/fail findings, screenshots if useful, defects and reproduction steps.

**Risks it should catch:** Runtime crashes, broken local host, invisible imported records, broken drawer hydration, layout overlap, nonworking buttons and misleading UI states.

**Opriva-specific rules:** Do not claim workflow success from build alone when UI behavior changed. Use browser validation when practical.

### Git / Release Manager

**Purpose:** Keep the repository stable, clean and safe to share.

**What it reviews:** Working tree state, staged files, commit boundaries, validation output, private file safety, package changes and release notes.

**When to use it:** Before commits, pushes, release checkpoints or when multiple unrelated changes are present.

**Required output:** Files to stage, files to leave pending, validation results, commit message, final status and residual risk.

**Risks it should catch:** Committing private samples, mixing unrelated changes, package-lock drift, missing build validation and accidental app code changes in documentation commits.

**Opriva-specific rules:** Never commit real client files. Keep private-samples ignored. Keep commits focused.

### AI Governance Reviewer

**Purpose:** Ensure AI features respect user approval, permissions, auditability and product boundaries.

**What it reviews:** AI mapping suggestions, catalog match suggestions, AI summaries, AI actions, retrieval scope, query logs and permission boundaries.

**When to use it:** Before AI assistant behavior, AI import mapping, AI risk scoring, AI recommendations or AI knowledge retrieval changes.

**Required output:** AI boundary review, user approval requirements, audit needs, privacy risks and backend implications.

**Risks it should catch:** AI creating records without approval, AI seeing unauthorized data, AI making irreversible changes, unlogged AI actions and over-trusting AI-generated mappings.

**Opriva-specific rules:** AI suggests; users approve. AI must distinguish confirmed records from suggestions.

### Documentation / PRD Writer

**Purpose:** Keep Opriva's product and technical decisions explicit, stable and usable by future agents.

**What it reviews:** MEMORY.md, backend plans, canonical model specs, import specs, user guide, knowledge base, PRDs and implementation briefs.

**When to use it:** After important product decisions, architecture plans, import changes, backend decisions or UX direction changes.

**Required output:** Updated documentation, decision summary, open questions and next recommended action.

**Risks it should catch:** Undocumented product decisions, stale memory, unclear backend warnings, ambiguous terminology and drift between code and docs.

**Opriva-specific rules:** Documentation must distinguish local/sandbox validation from corporate-MVP backend requirements.

### Commercial Strategy Reviewer

**Purpose:** Ensure Opriva supports real MSP / Integrator commercial renewal operations.

**What it reviews:** Renewal value, vendor cost, margin, client exposure, distributor/provider flow, renewal packages, quotes, POs, invoices, support coverage and handoff to operations.

**When to use it:** Before MSP workflow changes, procurement fields, renewal package behavior, dashboard metrics or commercial reports.

**Required output:** Commercial value review, missing workflow pieces, reporting needs and field/model recommendations.

**Risks it should catch:** Missing margin context, unclear sale price versus vendor cost, confused distributor/provider/reseller meanings, and renewal packages that do not map to actual sales operations.

**Opriva-specific rules:** MSP / Integrator mode is client and commercial-renewal oriented. Internal IT should not inherit MSP margin logic.

### Implementation Planner

**Purpose:** Convert approved product direction into safe, minimal implementation steps.

**What it reviews:** File impact, dependency risk, migration order, test plan, rollback path and commit sequence.

**When to use it:** Before any meaningful code change, especially in App.jsx, import sandbox, RECORD_STORE, drawer logic or forms.

**Required output:** Step-by-step plan, files affected, validations, what not to touch and suggested commit messages.

**Risks it should catch:** Overbroad refactors, moving too many pieces at once, breaking existing features and mixing documentation with behavior changes.

**Opriva-specific rules:** Prefer minimal safe changes. Do not redesign or add backend unless explicitly requested.

## 6. Skill Combinations By Task Type

### A. Import / Bulk Upload Changes

Use:

- opriva-import-data-model-auditor
- opriva-it-procurement-vendor-reviewer
- opriva-enterprise-ux-reviewer
- opriva-ciso-security-compliance-reviewer
- opriva-backend-readiness-auditor

Primary checks: model-driven import, records-to-create selection, sensitive contact handling, bulk defaults, entity detection, controlled catalogs, canonical record creation, user approval and backend import job implications.

### B. Backend Planning

Use:

- opriva-backend-readiness-auditor
- opriva-software-architecture-auditor
- opriva-ciso-security-compliance-reviewer
- opriva-import-data-model-auditor

Primary checks: database boundaries, tenant isolation, RBAC, storage, import jobs, audit trail, alert jobs, AI retrieval permissions and migration from local sandbox.

### C. UI / Screen Design

Use:

- opriva-design-fundamentals-auditor
- opriva-enterprise-ux-reviewer
- opriva-enterprise-visual-design-reviewer
- opriva-design-system-auditor
- opriva-dashboard-ux-reviewer if dashboard-related

Primary checks: enterprise quality, density, clarity, layout consistency, table readability, drawer behavior, empty states, warnings, design fundamentals (typography, color, spacing, motion, interaction, responsive, UX writing) and confidence before confirmation.

### D. Data Model / Catalog Changes

Use:

- opriva-import-data-model-auditor
- opriva-it-procurement-vendor-reviewer
- opriva-backend-readiness-auditor
- opriva-ciso-security-compliance-reviewer

Primary checks: canonical fields, controlled catalogs, duplicate detection, normalization, aliases, merge/deactivate flows, audit, workspace scope and sensitive data handling.

### E. MSP / Integrator Workflow

Use:

- opriva-msp-integrator-operations-reviewer
- opriva-it-procurement-vendor-reviewer
- opriva-cio-it-director-reviewer
- opriva-enterprise-ux-reviewer

Primary checks: client workflow, account owner, renewal pipeline, distributor/provider logic, sale price, vendor cost, margin, quotes, POs, invoices, support coverage and operational handoff.

### F. Internal IT Workflow

Use:

- opriva-cio-it-director-reviewer
- opriva-ciso-security-compliance-reviewer
- opriva-backend-readiness-auditor
- opriva-enterprise-ux-reviewer

Primary checks: department ownership, IT/budget owner, cost center, annual cost, approval status, business criticality, operational continuity, evidence and leadership reporting.

### G. Security / Privacy / Compliance

Use:

- opriva-ciso-security-compliance-reviewer
- opriva-backend-readiness-auditor
- opriva-software-architecture-auditor

Primary checks: auth, RBAC, tenant isolation, document security, import privacy, sensitive contacts, audit trail, AI permission boundaries and no real files in GitHub.

### H. Architecture / Modularization

Use:

- opriva-software-architecture-auditor
- opriva-backend-readiness-auditor
- opriva-design-system-auditor if UI components are affected

Primary checks: extraction safety, dependency boundaries, local store behavior, App.jsx complexity, demo seed data, import sandbox helpers, drawer components and rollback strategy.

## 7. Standard Workflow For Any Important Change

1. Inspect only.
2. Report gaps.
3. Propose plan.
4. Get user approval for broad or risky changes.
5. Implement the smallest safe change.
6. Run `npm run build`.
7. Run `git diff --check`.
8. Manually test or use browser/Playwright if UI behavior changed.
9. Commit focused changes only.
10. Update `MEMORY.md` or the proper documentation if a product decision changed.

## 8. Output Template For Audits

Use this structure for serious Opriva reviews:

1. Executive summary
2. What works
3. Gaps
4. Risks
5. Recommended implementation plan
6. Backend implications
7. MSP / Integrator implications
8. Internal IT implications
9. Security implications
10. Files likely affected
11. Suggested Codex prompt
12. Suggested commit message

## 9. Rules The Team Must Enforce

- Opriva is local/sandbox now.
- Backend is required later for corporate MVP.
- Import must be model-driven, not spreadsheet-driven.
- Imported records must become canonical Opriva records.
- Controlled catalogs are mandatory for repeated business entities.
- Repeated business entities must not be unrestricted free text.
- Entity detection and staging is required during import.
- Sensitive contact fields require review and must not be imported blindly.
- Activity must become audit trail.
- Documents require secure storage later.
- AI suggestions require user approval.
- Real private files must never be committed to GitHub.
- MSP / Integrator and Internal IT must both be considered.

## 10. External Skill / Repository Strategy

External GitHub skills, MCPs and agent workflows can be useful, but they are supply-chain inputs. They should be reviewed before installation or adaptation.

Potential sources:

- Anthropic official skills
- Trail of Bits skills
- Playwright / Playwright MCP
- Awesome Agent Skills
- Supabase skills later
- Product/PM workflow skills

Rules:

- Do not install blindly.
- Inspect license, scripts, commands and instructions first.
- Check for downloads, external commands, credential handling and destructive behavior.
- Adapt useful patterns into Opriva-specific skills instead of copying generic behavior blindly.
- Keep Opriva rules authoritative when external skills conflict.

### 10.1 External Design-Skill Sources Currently Under Research

The following external repositories are under research as possible sources of design / UX / "taste" guidance for Opriva. Research only — no installation, cloning, script execution, MCP configuration, hook configuration, dependency addition or adaptation has been approved.

| Source | Format | Topic | License | Multi-agent native? |
|---|---|---|---|---|
| https://github.com/emilkowalski/skill | `skills/emil-design-eng/` directory; spec not yet detailed in README | UI design & engineering principles (curated from author's blog) | Not visible in README | Not stated |
| https://github.com/pbakaus/impeccable | `SKILL.md` spec with 7 domain reference files (typography, color-and-contrast, spatial-design, motion-design, interaction-design, responsive-design, ux-writing); ships `.claude/`, `.cursor/`, `.agents/`, `.gemini/`, `.impeccable/` directories; 23 commands; optional CLI (`npx impeccable detect`) | Frontend design quality and anti-pattern detection | Apache 2.0 | Yes — Claude, Cursor, Codex-style `.agents/`, Gemini |
| https://github.com/Leonxlnx/taste-skill | Portable `SKILL.md` files; install via `npx skills add` CLI | Frontend "taste" / anti-slop layout, typography, motion, spacing | MIT | Yes — Cursor, Claude Code, Codex |

Until explicitly approved by the user, do not download bundles, run any `npx` or `skill.sh` commands, copy these directories into the repo, or modify settings to register these skills.

### 10.2 Cross-Agent Skill Parity (Claude Code ↔ Codex)

Opriva is developed across multiple AI agents (Claude Code today, Codex when work continues there, future agents). External design, UX, taste or methodology skills that are adapted into Opriva for one agent **must** also be adapted — or have a clearly planned equivalent — for the other supported agents. Single-agent skill installs create drift between sessions, contributors and tools and must be avoided.

Likely Codex target locations to inspect **before** any future adaptation (do not create yet, verify what the Codex tooling in use actually reads):

- `.codex/` or `.agents/` style directories, if supported by the Codex tooling
- The existing project-wide `skills/` directory as the canonical `SKILL.md` home (already used by Opriva review lenses)
- `AGENTS.md` references — Codex reads `AGENTS.md` as primary always-on guidance

Rule the assistant must enforce:

- When the user states that Opriva work is continuing in Codex, the assistant must remind the user to replicate or adapt any approved Claude Code skills (including any future adoption of the §10.1 sources) into Codex-equivalent guidance before proceeding with non-trivial work.

Until cross-agent parity is planned, no design-skill adoption should be approved for a single agent in isolation.

## 11. Claude Code Equivalent

When continuing Opriva work in Claude Code, create equivalent project guidance:

- `CLAUDE.md` for always-on Opriva rules.
- Claude Code skills for each Opriva expert role.
- Subagents for product, architecture, security, UX, backend readiness, procurement and QA.
- Hooks or commands for validation workflows such as build, diff check and status.
- Commands for common safe workflows such as review-only audits, import checks, UI validation and focused commits.

Claude Code guidance should preserve the same Opriva rules: local/sandbox now, backend later, no private files, model-driven import, controlled catalogs, sensitive contact review, workspace-mode review and focused commits.

### 11.1 Codex Equivalent

When Opriva work continues in Codex, equivalent project guidance must be in place:

- `AGENTS.md` is already the primary Codex always-on guidance.
- Each Opriva review lens / expert role should have a Codex-compatible equivalent (likely under a Codex-recognized skills directory such as `.codex/` or `.agents/`, or by ensuring the existing `skills/SKILL.md` files are loadable by the Codex tooling in use). Inspect what the active Codex tooling reads before creating anything.
- Validation workflows (`npm run build`, `git diff --check`, `git status --short`, focused commits) must hold identical authority in Codex sessions.
- All Opriva non-negotiables apply identically: local/sandbox now, backend later, no private files, model-driven import, controlled catalogs, sensitive contact review, workspace-mode review and focused commits.

See §10.2 for the cross-agent parity rule. Any approved adaptation of an external design/UX/taste skill into Claude Code triggers a planning obligation for the same skill in Codex.

## 12. Final Recommendation

Opriva should always be developed through this specialized AI expert team model. The project has enough product, data, security, import and backend complexity that generic coding assistance is not sufficient. The right AI reviewers should be selected before major work, and every implementation should remain focused, validated and documented.
