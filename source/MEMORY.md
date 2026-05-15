---
schemaVersion: 1
scope: workspace
updatedAt: "2026-05-15T00:51:25.268Z"
workspaceName: "COREXI"
---

# Project Memory

## Project Overview
- Opriva Tenant App MVP: customer-facing multitenant enterprise SaaS workspace for IT Asset & Renewal Intelligence.
- Covers asset/renewal management, licenses, contracts, warranties, services, alerts, tasks, documents, reports, imports, settings, Global Search, contextual Opriva AI assistance, and scalable managed-record data architecture.
- Excludes the Super Admin Portal.
- Target users include IT, finance, procurement, legal/compliance, operations, and IT integrators/MSPs managing client renewals.

## Current State
- `DESIGN.md` exists and remains the authoritative design-system baton.
- Current design title: React Preview Runtime Fix.
- `App.jsx` is the active source.
- Latest scoped runtime repair resolved the blank preview caused by `assetsRenewalsStyles` being undefined.
- `App.jsx` is structurally complete and now verifies cleanly:
  - Preview ok: 184 nodes, 0 console errors, 0 asset errors.
  - Final verification: no syntactic or runtime issues detected.
  - File ends with `ReactDOM.createRoot(...)`.
- Repair was intentionally minimal: added a safe `assetsRenewalsStyles` definition as an empty CSS string near the Assets & Renewals component.
- No pages or shell elements were intentionally changed during the runtime repair.
- Current Assets & Renewals content appears to include the previously interrupted worklist update; future edits should inspect before changing and avoid assuming it is final.
- Verified labels/branding to preserve:
  - Sidebar brand subtitle: “IT Asset & Renewal Intelligence”.
  - Sidebar visible navigation label: “Assets & Renewals” while preserving existing route/page behavior.
  - Brand name: Opriva.
  - Topbar workspace: “Banisi Workspace”.
  - Search bar, alert bell, MC avatar, sidebar, topbar, and floating Opriva AI agent should remain unchanged.
- Demo/default toast notifications must not appear on load.

## Artifacts
- `App.jsx` — React visual prototype/source; active source, currently compiling/rendering after the minimal `assetsRenewalsStyles` runtime fix.
- `main.jsx` — React/Vite entry file; may be less relevant when host preview expects single-file mounting.
- `DESIGN.md` — authoritative design-system baton; use as the only source of truth for stable visual-system implementation.
- `healthcheck.md` — prior healthcheck report.
- `App-codesign-standalone-rescue.jsx` — rescue-style standalone source candidate.
- `references/App-rescue-stable-before-attention.jsx` — stable reference candidate.
- `corexi-data-architecture.md` — product/data architecture handoff.
- `global-search-ux-audit.md` — UX audit of Global Search.
- `Imagen corporativa/logo-horizontal-dark.svg` and related logo SVGs — official Opriva brand assets.
- `Imagen corporativa/brand-kit.html` — older corporate brand reference; supporting context only.

## Design Direction
- Serious, premium enterprise SaaS interface: clean, calm, corporate, spacious, modern, scalable, desktop-first, and less generic/AI-generated.
- Product positioning: “IT Asset & Renewal Intelligence”.
- Dashboard direction: Financial Exposure Command Center focused on renewal risk, value at risk, ownership gaps, recommended action, and urgent renewal records.
- Attention Center direction: operational issue center for critical renewals, missing owners, evidence gaps, approval blockers, and next actions.
- Assets & Renewals intended direction: main operational renewal worklist for assets, licenses, contracts, warranties, SaaS subscriptions, and certificates, prioritized by urgency, value, ownership, status, and recommended action.
- App default language is English for now; future language behavior should be controlled from Settings > Company > Localization.
- Opriva product identity should be stable and corporate; Opriva AI Agent identity should be minimal and used only for the floating assistant.

## User Feedback
- User strongly prefers scoped changes only; do not redesign, refactor, regenerate, rewrite, or add complex functionality unless explicitly requested.
- User repeatedly requests changes to only the named page/component and to preserve routing, sidebar, topbar, Settings, Search, other pages, and Opriva AI floating agent behavior.
- User explicitly requested not to continue incomplete generation automatically after WebSocket interruption and not to modify files before reporting current state.
- User wants the product ready for mid-market and enterprise SaaS sales.
- User rejected generic logos, old Corexi marks, “Opriva Workspace”/“Northwind Operations” topbar labels, topbar AI, noisy controls, and mixed English/Spanish Dashboard language.
- User dislikes narrow, crowded, or clipped tables; Recommended Action visibility and full dates are important.

## Decisions
- Current product name in UI: Opriva.
- Current topbar workspace label: “Banisi Workspace”.
- Sidebar groups remain: Overview, Manage, Work, Admin.
- Sidebar route/page behavior for Expirations is preserved while visible label is “Assets & Renewals”.
- Dashboard order is KPI cards, full-width AI Risk Summary, full-width Priority action queue.
- Attention Center uses MVP operational issue language.
- Attention workflow table combines Issue and Record into one compact context column.
- Lower Attention section is titled “Issue groups”.
- Settings main hub uses six directory groups: Company, Access, Data, Automation, AI Operator, Governance.
- AI access is a fixed bottom-right floating Opriva Agent button, not a topbar AI button.
- Defensive frontend handling is required: safe initials, labels, fallbacks, optional chaining, array validation, and no unsafe `.split()` on unknown values.

## Open Questions
- Whether the current Assets & Renewals page content should be accepted as the intended worklist update or revised in a future scoped pass.
- Whether future runtime changes should target strict standard Vite module entry only or preserve Open CoDesign single-file preview compatibility.
- Whether future iterations should split the prototype into route-level screens/components or remain as a single-file visual prototype.
- How to implement tenant-configurable language behavior in Settings > Company > Localization.
- Whether “Assets & Renewals” should become canonical across all content, not only the sidebar label.
- Whether the Dashboard Priority action queue should still remove the `Type` column in a future scoped Dashboard-only pass.

## Next Steps
- Before any edit, inspect `App.jsx` and read `DESIGN.md`.
- Keep runtime clean: preview should remain at 0 console errors.
- If continuing Assets & Renewals work, modify only that page/component and preserve routing, sidebar, topbar, Dashboard, Attention Center, Search, Companies/Clients, Licenses, Contracts, Documents, Tasks, Reports, Data Import, Settings, and Opriva AI floating agent.
- Preserve Opriva/Banisi branding and avoid generic icons or tenant label regressions.
- Confirm no invalid metadata, markdown fences, pasted JSON, duplicate action rendering, or non-JSX text exists in `App.jsx` after edits.

## Promotion Candidates For DESIGN.md
- Assets & Renewals as the main operational renewal worklist for tracked records, expiry urgency, financial value, owner, status, and recommended action.
- Dashboard standard: Financial Exposure Command Center with KPI cards, AI Risk Summary, and Priority action queue.
- Product descriptor: “IT Asset & Renewal Intelligence”.
- Sidebar visible module label candidate: “Assets & Renewals” for the existing Expirations route.
- Product/AI identity separation: product contexts use Opriva logo/mark; floating assistant uses Opriva AI Agent mark only.
- Attention Center standard: operational issue center for critical renewals, missing owners, missing evidence, pending approvals, and financial exposure.
- Attention workflow table standard: Issue / Record, Vendor, Impact, Due, Owner, Recommended action, Status.

## Recent History
- 2026-05-12: Replaced starter shell with full Tenant App MVP prototype and created `DESIGN.md`.
- 2026-05-13: Replaced topbar AI button with floating bottom-right Opriva Agent trigger and compact Opriva AI drawer.
- 2026-05-13: Redesigned Settings into a minimal enterprise configuration directory hub.
- 2026-05-14: Fixed invalid EDITMODE JSON/runtime issue in `App.jsx`; preview verified successfully.
- 2026-05-14: Updated Dashboard into an English Financial Exposure Command Center.
- 2026-05-14: Restored global Opriva branding plus Banisi Workspace topbar context.
- 2026-05-14: Refined Dashboard layout and Priority action queue readability; verified clean preview/runtime.
- 2026-05-14: Refined Attention Center top section, workflow table, compact Issue / Record layout, and Issue groups; verified clean preview/runtime.
- 2026-05-15: After interrupted Assets & Renewals work, inspected current state only; preview failed because `assetsRenewalsStyles` was undefined.
- 2026-05-15: Added a minimal safe `assetsRenewalsStyles` definition only; preview and final verification now pass cleanly.