# Opriva Project Memory

## 1. Project Overview

Opriva is an enterprise SaaS platform for IT Asset & Renewal Intelligence. It helps teams understand what expires, what it costs not to act, who owns the work, and which renewals or approvals need attention.

The main app currently lives in `source/App.jsx`.

## 2. Current State

The app is a single-file React prototype that is compatible with the current runtime. `source/App.jsx` contains the application shell, workspace mode behavior, screens, mock data, component definitions, and injected styles.

The root entrypoint is `index.html`, which loads `source/main.jsx`. `source/main.jsx` exposes `React` and `ReactDOM` on `window`, then dynamically imports `source/App.jsx`.

## 3. Design Direction

Opriva should feel like a focused enterprise SaaS operations tool: dense, clear, quiet, and built for repeated use. The design should prioritize readable tables, accountable actions, risk triage, workspace context, and executive-ready renewal intelligence.

Do not redesign the product surface without a separate design decision.

## 4. Product Decisions

- Keep the app as a single-file prototype for now.
- Keep the current runtime compatibility model.
- Keep `source/App.jsx` as the main app surface until a planned component split is approved.
- Keep workspace mode as the core product switch.
- Keep sidebar label overrides visual only.
- Do not change internal routing ids as part of label cleanup.

## 5. Workspace Modes

Supported workspace modes:

- `MSP / Integrator`
- `Internal IT`
- `Hybrid`
- `Custom`

The Topbar includes a temporary Mode selector. Internal IT uses `Grupo Regency Workspace`. MSP / Integrator uses `Nextcom MSP Workspace`.

## 6. Internal IT Model

Internal IT represents a company managing its own IT estate. Its commercial model is:

`Brand + Provider + Department + Budget / Approval / Risk`

Use this model for Internal IT dashboards, renewal forecasts, vendor intelligence, attention workflows, and department views.

## 7. MSP / Integrator Model

MSP / Integrator represents a provider managing multiple client accounts and renewals. Its commercial model is:

`Client + Brand + Product + Distributor + Value + Margin + Owner + Action`

Use this model for MSP dashboards, vendor intelligence, renewal worklists, and client-facing operational queues.

## 8. Sidebar Collapse Decision

The sidebar has expanded and collapsed modes. Collapsed mode uses icons and tooltips. The main layout adjusts when the sidebar is collapsed.

Do not break:

- `sidebarCollapsed`
- `.appSidebarCollapsed`
- sidebar icon visibility
- collapsed tooltips
- workspace margin adjustment

## 9. Dashboard MSP Decision

The MSP dashboard already uses:

`Client / Brand / Product / Distributor / Renewal / Value / Margin / Owner / Action`

This structure is correct and should remain the reference for MSP renewal intelligence.

## 10. Dashboard Internal IT Decision

The Internal IT dashboard already distinguishes Brand and Provider. It also tracks department impact and approval-oriented actions.

Internal IT dashboard language should remain tied to internal budget exposure, department impact, provider dependency, approval blockers, and risk.

## 11. Attention Center Internal IT Decision

The Internal IT Attention Center was refined for:

- Brand / Provider separation
- approval blockers
- missing evidence
- missing owners
- provider dependency
- department exposure

This is the expected direction for Internal IT triage.

## 12. Brand / Provider / Distributor Commercial Relationship Model

Do not mix Brand, Provider, Distributor, Client, and Department.

- Brand: the technology brand or manufacturer in use or sold.
- Provider: the supplier, reseller, service provider, or implementer serving an Internal IT organization.
- Distributor: the upstream distributor or wholesaler used by an MSP / Integrator.
- Client: the end customer served by an MSP / Integrator.
- Department: the internal business area in an Internal IT organization.

Internal IT Vendors use Brand / Provider.
MSP Vendors use Brand / Distributor.

## 13. Runtime Compatibility Facts

- `source/main.jsx` imports React and ReactDOM Client.
- `source/main.jsx` assigns `window.React` and `window.ReactDOM`.
- `source/main.jsx` uses dynamic `import('./App.jsx')` so those globals exist before `App.jsx` executes.
- `source/App.jsx` mounts itself with `ReactDOM.createRoot(document.getElementById('root')).render(<App />);`.
- `index.html` provides `<div id="root"></div>`.

Do not change the runtime for now.

## 14. What Not To Touch

Do not touch without an explicit implementation phase:

- `source/App.jsx`
- runtime boot order
- `ReactDOM.createRoot(...)`
- `workspaceMode`
- sidebar collapse behavior
- Floating Opriva AI
- internal route ids
- Topbar Mode selector — **temporary design control, do not remove without explicit approval. Final workspaceMode configuration lives in Settings → Company → Operating Model.**
- Dashboard MSP column model
- Dashboard Internal IT Brand / Provider model

## 14a. Tasks as Execution Layer

Tasks is the execution layer for Opriva. Attention Center identifies blockers and risks; Tasks tracks assigned work to resolve them. MSP tasks focus on client follow-up, distributor quotes and commercial ownership. Internal IT tasks focus on department owners, approvals, budget reviews, provider quotes and evidence requests.

Each task should clearly communicate why it exists (Source), what impact it carries (Impact) and what action should happen next (Action). Tasks columns include Source and Impact so the list view functions as an operational queue, not just a to-do list.

## 14b. Settings → Operating Model Source of Truth

`Settings → Company → Operating Model` is the declared source of truth for `workspaceMode`. Workspace Mode is selected during onboarding/registration as part of workspace setup. Settings → Operating Model is the administrative surface for reviewing or adjusting that configuration. The topbar Mode selector remains a temporary design preview control and must not be treated as the production workflow.

The following structures inside `SettingsGroupPanel` must be kept in sync with the commercial model:

- `terminologyPreview` — entity labels per workspace mode
- `navigationPreview` — navigation items per workspace mode
- `importTemplatePreview` — import field order per workspace mode
- `selectedModeExplanation` — mode description per workspace mode

Hooks must remain before any conditional returns in React components. React error #300 must not appear. The app must not show a white screen.

## 14c. Reports as Distribution Layer

Reports is Opriva's executive distribution layer. It packages Dashboard KPIs, Attention Center risks, Data Import completeness and Tasks execution status into outputs for leadership, finance, account management and compliance.

## 15. Next Steps

Safe Phase 1 candidates:

- Normalize visible terminology only.
- Replace old or generic copy that conflicts with Opriva.
- Align Internal IT wording around Brand / Provider / Department / Budget / Approval / Risk.
- Align MSP wording around Client / Brand / Product / Distributor / Value / Margin / Owner / Action.
- Add `data-label` support to custom responsive tables in a controlled pass.

Medium-risk Phase 2 candidates:

- Separate workspace mock data.
- ~~Improve Command Palette labels by workspace while preserving route ids.~~ **Completed 2026-05-19.**
- Consolidate duplicated style layers after visual regression checks.
- Departments currently groups Brands & Providers in one column. Phase 2 should separate Brand and Provider into structured fields once mock data is normalized.

Later:

- Plan a component split only after the current single-file prototype is stable and validated.

## 16. Recent History

- Repository cloned and inspected on branch `audit/opriva-healthcheck`.
- `MEMORY.md` and `DESIGN.md` were not present before this documentation phase.
- Audit confirmed `source/App.jsx` contains `workspaceMode`, `sidebarCollapsed`, `Internal IT`, `MSP / Integrator`, and the current `ReactDOM.createRoot(...)` mount.
- Audit confirmed the current branch is intended for healthcheck and documentation work.
- 2026-05-19: Fase 1A terminology cleanup applied: legacy Corexi AI copy replaced with Opriva AI, Internal IT supplier/vendor terminology normalized toward Provider where safe, and MSP import template terminology aligned toward Distributor. No layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI changes.
- 2026-05-19: Fase 1B cleanup removed confirmed unused mocks/components without changing runtime, layout, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Fase 1C Data Import workspace-aware copy and mock data applied. Data Import now distinguishes MSP client/brand/product/distributor/margin import language from Internal IT brand/provider/department/approval language without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: MSP Attention Center refined into a commercial renewal operations view for MSP / Integrator. MSP now uses client, brand/product, distributor, value, margin, owner, quote blocker and follow-up terminology while preserving Internal IT behavior and shell/runtime stability.
- 2026-05-19: Search / Command Palette made workspace-aware. Placeholder, quick actions, AI suggestions and page labels now adapt to MSP / Integrator, Internal IT, Hybrid and Custom without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Settings → Operating Model refined as the declared workspaceMode source of truth. Terminology, navigation and import previews now reflect MSP / Integrator, Internal IT, Hybrid and Custom commercial models without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Settings Operating Model preview clarified for real user comprehension. The preview now explains operating logic, sidebar navigation and import template structure per workspace mode instead of showing abstract label mappings.
- 2026-05-19: Departments Internal IT terminology refined. Ambiguous Vendor wording was replaced with Brands & Providers in the Internal IT Departments screen across subtitle, toolbar, AI Insight, table headers and detail cards without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Tasks made workspace-aware. Column labels, subtitle, toolbar placeholder, mock task rows and kanban cards now adapt to MSP / Integrator and Internal IT without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Tasks execution context improved. Tasks now include Source, Impact and task-specific Action columns so MSP and Internal IT work queues better reflect Opriva's operational execution layer. Kanban secondary lines now show impact context instead of priority label. No layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI changes.
- 2026-05-19: MSP Tasks execution copy refined. Source, impact and kanban context were tightened to make client renewal tasks more operational without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Reports made workspace-aware. Report templates, export center labels and scheduled/generated report rows now adapt to MSP / Integrator and Internal IT without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
