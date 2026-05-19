# Opriva Design Baton

## 1. Visual Principles

Opriva should look and behave like an enterprise SaaS operations platform, not a marketing site. The interface should be structured, calm, information-dense, and optimized for scanning renewal risk, ownership, approvals, and next actions.

Use the current app as the source of truth. Do not invent a new product or a new visual system.

## 2. Enterprise SaaS Tone

The product tone is operational, precise, and executive-ready. Copy should help users decide what to review, assign, approve, renew, or escalate.

Avoid decorative language. Prefer practical language tied to records, renewals, risk, budget, owners, departments, providers, distributors, and actions.

## 3. Color Direction

Keep the current restrained enterprise palette:

- deep navy sidebar
- white and soft gray work surfaces
- teal/green operational highlights
- blue for primary action emphasis
- warm tones for warnings and risk states

Do not introduce a new palette or broad gradient treatment without a separate design decision.

## 4. Typography / Hierarchy Direction

Keep hierarchy compact and work-focused:

- screen headers should identify the current operational surface
- tables and panels should use small, readable labels
- badges should remain concise
- actions should stay short and direct

Avoid oversized marketing-style type inside operational screens.

## 5. Sidebar Shell Rules

The sidebar is a core shell element.

- It has expanded and collapsed modes.
- Collapsed mode uses icons and tooltips.
- Sidebar label overrides are visual only.
- Do not change route ids to match display labels.
- Do not break `sidebarCollapsed` or `.appSidebarCollapsed`.

Internal IT may display `Departments` and `Renewals Forecast`, but routing remains tied to existing internal page ids.

## 6. Topbar Rules

The Topbar owns workspace context and fast actions.

- Keep the Mode selector visible.
- Keep workspace labels tied to mode.
- `MSP / Integrator` uses `Nextcom MSP Workspace`.
- `Internal IT` uses `Grupo Regency Workspace`.
- Keep Search, New, Alerts, and avatar behavior visually stable.

Do not remove the temporary Mode selector until there is an approved replacement.

## 7. Dashboard Rules

Dashboards are operational command surfaces.

MSP / Integrator dashboard must preserve:

`Client / Brand / Product / Distributor / Renewal / Value / Margin / Owner / Action`

Internal IT dashboard must preserve:

`Brand / Provider / Department / Budget / Approval / Risk`

Do not collapse Brand, Provider, Distributor, Client, or Department into generic "vendor" language.

## 8. Table Rules

Tables are the primary product surface.

- Prioritize readability over decoration.
- Keep actions visible.
- Preserve horizontal scrolling where needed.
- Use badges for risk/status, not arbitrary final-column values.
- On mobile, table-card behavior needs labels for custom table cells.
- Do not hide critical business context to make a table fit.

For MSP tables, include Client and Distributor when relevant.
For Internal IT tables, include Department and Provider when relevant.

## 8a. Enterprise Table Rule

Every major Opriva table must be configurable by the user. Users should be able to show/hide columns, reorder columns, apply filters, save views, perform bulk actions and export data. In the MVP, this behavior can be represented visually through controls such as Configure columns, Saved view, Filters and Bulk actions. Full persistence and advanced table customization are Phase 2.

Columns should not be considered fixed forever. The default table view should be optimized for the selected workspace mode, but users should eventually be able to adapt the table to their operational needs.

Applies to:
- Dashboard queues
- Attention Center
- Departments
- Renewals Forecast
- Licenses
- Hardware
- Contracts
- Documents
- Tasks
- Reports
- Data Import validation tables

## 9. AI Insight Rules

Opriva AI should support prioritization, not dominate the screen.

- Floating Opriva AI stays bottom right.
- AI insights should be concise and contextual.
- AI actions should map to review, assign, request, approve, forecast, or escalate.
- Keep AI language grounded in the active workspace mode.

Do not break the Floating Opriva AI button or drawer.

## 10. Workspace Terminology Rules

Terminology must respect commercial relationships:

- Brand: technology brand or manufacturer.
- Provider: Internal IT supplier, reseller, provider, or implementer.
- Distributor: MSP upstream distributor or wholesaler.
- Client: MSP / Integrator end customer.
- Department: Internal IT business area.

Internal IT:

`Brand + Provider + Department + Budget / Approval / Risk`

MSP / Integrator:

`Client + Brand + Product + Distributor + Value + Margin + Owner + Action`

## 11. Do-Not-Redesign Rule

Do not redesign the app while doing terminology, documentation, or healthcheck work.

Do not change:

- layout
- runtime
- routing
- shell structure
- sidebar collapse
- Topbar Mode selector
- Floating Opriva AI
- dashboard commercial models

Any visual redesign should be proposed separately, scoped explicitly, and validated against the current app.

