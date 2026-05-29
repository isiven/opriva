---
name: opriva-design-fundamentals-auditor
description: Audit Opriva screens against universal enterprise SaaS design fundamentals (typography, color and contrast, spatial design, motion discipline, interaction states, responsive design, UX writing) calibrated to data-heavy tables, drawers, dashboards, and import flows across MSP / Integrator and Internal IT.
---

# Opriva Design Fundamentals Auditor

## When To Use

Use this skill when reviewing the visual and interaction quality of Opriva screens against universal enterprise SaaS design fundamentals: typography, color and contrast, spatial design, motion discipline, interaction states, responsive design and UX writing. Use it alongside `opriva-enterprise-visual-design-reviewer`, `opriva-design-system-auditor` and `opriva-enterprise-ux-reviewer`, not as a replacement. This lens supplies universal design vocabulary; the existing lenses keep their Opriva-specific authority.

## Opriva-Specific Rules

- Opriva should feel like serious enterprise SaaS: dense, quiet, restrained, accountable.
- Do not introduce a new visual language. Calibrate principles to Opriva's existing tokens, drawer rhythm, table density and teal accent usage.
- Preserve Sidebar, Topbar, Floating AI, routing, workspaceMode, drawers, Configure Columns, Advanced Filters and existing record drawer behavior.
- Calibrate every recommendation to data-heavy screens (tables, dashboards, drawers, import preview), not consumer/marketing UI.
- MSP / Integrator and Internal IT must both be considered: terminology, density, status semantics and required fields differ across workspace modes.
- Do not override Opriva product rules, data-model rules, import rules, backend-readiness rules or security/compliance rules from `AGENTS.md`, `OPRIVA_AI_DEVELOPMENT_TEAM.md` or `OPRIVA_DEVELOPMENT_METHODOLOGY.md`.
- Adapt principles into Opriva-flavored guidance; do not propose decorative redesigns.

## Review Checklist

### 1. Typography

- Limited type scale (one family + a small set of sizes/weights). No ad-hoc font sizes per screen.
- Data-table line-height tightened (≈ 1.2–1.35) for density, not airy 1.5–1.6 marketing rhythm.
- Tabular numerals (`font-variant-numeric: tabular-nums`) on currency, quantity, days-to-expiration, margin and other numeric columns so values align vertically.
- Predictable weight hierarchy: regular for body, semibold for primary labels, bold reserved for KPIs and section titles. Avoid stacking three weights in one block.
- No oversized hero headings inside record drawers, tables or import flows.
- Consistent letter-spacing — avoid loose tracking on dense rows.
- Avoid decorative or display fonts on data screens. Prefer one humanist sans for legibility at small sizes.

### 2. Color And Contrast

- Restrained palette: neutral surface scale + one accent (Opriva's teal). Status colors (success / warning / error / info) are semantic, not decorative.
- WCAG AA minimum: body text 4.5:1, large text and UI components 3:1. Status badges and risk pills must hold contrast on every background they appear on.
- Reserve color for meaning: row state (selected, hover), status, risk, owner attention. Do not use color to decorate data cells.
- Avoid full-row tinted backgrounds; prefer a left status border or a discrete badge to indicate state without compromising readability.
- Calculated/derived values (Status, Margin, Days to Expiration, Risk) must use consistent semantic tones across modules.
- Dark/light mode (if added later) must preserve the same semantic intent and contrast guarantees.
- No gradient fills on data rows; reserve gradients for empty-state illustrations and confirmation moments.

### 3. Spatial Design

- One spacing scale (e.g. 4 / 8 / 12 / 16 / 24 / 32). Reject one-off pixel values.
- Table cell padding stays compact (≈ 8–12 px vertical) so 12+ rows fit on a typical viewport without scroll.
- Section rhythm is predictable: toolbar → table → footer share consistent gaps across modules.
- Drawer body uses a tighter inner rhythm than landing surfaces; drawer header has a stable height across record types.
- Form fields align to a single grid; labels and inputs share a consistent vertical rhythm. Avoid sprawling two-column forms unless data is logically paired.
- Empty states have generous but bounded vertical breathing room — they explain, not fill.
- Cards used for repeated items only, never as decorative nested containers. Avoid card-in-card.

### 4. Motion Discipline

- Motion is purposeful, minimal and fast (≈ 150–250 ms): drawer open/close, dropdown reveal, toast, tab switch.
- No spring / bounce / elastic curves on data tables, badges or row actions. Standard ease-out for reveals; ease-in for dismissals.
- No decorative loops, ambient animations or hover-triggered scale on dense rows.
- Respect `prefers-reduced-motion`: animations downgrade to instant transitions.
- Skeleton loaders only when network-bound content needs predictable placement; otherwise prefer a quiet inline spinner.
- Status changes and counter increments may animate subtly (≈ 120 ms) to convey freshness; do not loop.

### 5. Interaction States

- Every interactive element provides: default, hover, focus-visible, active, disabled and loading. None may be missing.
- Focus indicators must be clearly visible (≥ 3:1 contrast) and consistent across buttons, inputs, selects, tabs and row actions.
- Row click vs row action: choose one model per table and apply it across all modules (Opriva's pattern is row click opens drawer; the action column triggers explicit actions).
- Destructive actions (delete, discard import, remove relationship) require confirm + an explicit verb in the confirmation copy.
- Disabled controls explain why on hover/focus when the reason is not obvious from context.
- Inline edits and inline validation messages appear close to the field, not in a distant toast.
- Drag / select / resize behaviors are predictable across tables and Configure Columns; avoid surprising secondary interactions.

### 6. Responsive Design

- Primary breakpoints: desktop ≥ 1280 (data-heavy default), tablet ≈ 1024 (compressed but still data-first), narrow ≤ 768 (card-stack / drawer-first).
- Tables degrade to a labeled card stack on narrow widths (Opriva's `data-label` pattern). Tables must not overflow horizontally without an explicit affordance.
- Drawers go full-screen below tablet width; never trap content under the keyboard on mobile.
- Toolbars and filter chips wrap predictably; they do not introduce surprise horizontal scroll.
- Sidebar and Topbar adapt to viewport without breaking layout contracts (collapsed mode, density adjustments).
- Density may tighten on narrow widths but must keep target sizes accessible (≥ 32 px touch targets).
- Configure Columns and Advanced Filters remain usable at every breakpoint.

### 7. UX Writing

- Labels are nouns (`Renewal`, `Owner`, `Status`). Buttons are verbs in the user's voice (`Confirm import`, `Attach document`, `Add support coverage`).
- Destructive copy names the noun (`Delete license`, `Remove relationship`), never just `Delete`.
- Empty states explain why nothing is shown and offer the next concrete action.
- Error messages are actionable, specific and workspace-aware. Avoid `Something went wrong` — name the field, file, row or constraint.
- Status labels are stable across modules: `Pending date`, `Expiring soon`, `Expired`, `Active`, `Pending review`, `Missing evidence`. Do not invent synonyms per screen.
- Terminology respects workspace mode: MSP / Integrator uses Client / Distributor / Sale Price / Margin; Internal IT uses Department / Provider / Annual Cost / Approval / Budget. Do not leak MSP wording into Internal IT screens or vice versa.
- Sandbox/local limitations are disclosed without overwhelming users (one-line inline notice, not modal pop-ups).

### Opriva Surfaces To Apply All Seven Domains To

- Tables (Licenses, Hardware, Contracts, Documents, Tasks, Assets & Renewals, Dashboard priority queues).
- Record drawers (Overview / Relationships / Documents / Tasks / Activity tabs).
- Dashboards (KPI cards, insight bars, priority queues, renewal forecast).
- Import flow (mapping table, defaults panel, preview table, summary metrics, review drawer, confirm result).
- Filters (Configure Columns, Advanced Filters, saved views).
- Empty states and zero-data screens.
- Onboarding and first-time setup (Operating Model, workspace-mode preview, terminology preview).

## Risks / Gaps To Look For

- Ad-hoc inline styles that diverge from the spacing or type scale.
- Mixed line-heights or non-tabular numerals in numeric columns.
- Status colors used as decoration on non-status cells.
- Decorative motion on data rows or KPI cards.
- Missing focus-visible or insufficient contrast on focus indicators.
- Buttons named for the system (`Submit`) rather than for user intent (`Confirm import`).
- Workspace terminology drift (MSP labels appearing in Internal IT screens or vice versa).
- Tables that overflow horizontally without an explicit affordance or card-stack fallback.
- Drawer or modal copy that fails to name the noun in destructive actions.

## Required Output Format

1. Executive summary
2. What is working
3. Risks / gaps
4. Recommended changes
5. Backend implications
6. MSP / Integrator implications
7. Internal IT implications
8. Suggested implementation prompt, if action is needed

---

## Attribution

The seven-domain structure of this lens (typography, color and contrast, spatial design, motion design, interaction design, responsive design and UX writing) is inspired by **pbakaus/impeccable** (https://github.com/pbakaus/impeccable), licensed under the **Apache License 2.0**.

This lens does not copy impeccable's text. The vocabulary above has been rewritten in Opriva's voice and calibrated to enterprise SaaS — specifically to Opriva's data-heavy screens, drawer/table rhythm, restrained palette, MSP / Integrator vs Internal IT workspace modes and shell-preservation rules.

No part of pbakaus/impeccable has been installed, cloned, executed or registered as a Claude Code, Codex, Cursor, Gemini or MCP skill. Opriva remains the authoritative source. See `THIRD_PARTY_NOTICES.md` and `OPRIVA_AI_DEVELOPMENT_TEAM.md` §10.1–§10.2 for the broader research and parity record.
