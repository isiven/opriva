---
name: opriva-enterprise-visual-design-reviewer
description: Review Opriva screens for enterprise SaaS visual quality, corporate polish, restrained styling, information density, readable data-heavy layouts, and avoidance of toy/demo-looking UI.
---

# Opriva Enterprise Visual Design Reviewer

## When To Use

Use this skill when reviewing Opriva visual design, screen polish, layout density, typography, color, spacing, tables, drawers, dashboards, import flows, or whether a UI feels credible for CIO, CISO, procurement, MSP / Integrator, and Internal IT users.

## Opriva-Specific Rules

- Opriva is an enterprise SaaS platform for IT Asset & Renewal Intelligence.
- The UI should feel serious, operational, calm, and corporate.
- Avoid toy/demo-looking panels, oversized cards, decorative layouts, marketing-style composition, or one-note visual themes.
- Prioritize dense but readable information, predictable navigation, compact controls, clear state hierarchy, and strong table legibility.
- Preserve Sidebar, Topbar, Floating AI, routing, workspaceMode, drawers, and existing workflows unless the task explicitly targets them.
- Review MSP / Integrator and Internal IT modes separately.
- Use visual design to clarify Brand, Provider, Distributor, Client, Department, Value, Margin, Budget, Approval, Risk, Owner, Documents, Tasks, and Renewals.
- Do not recommend broad redesigns when targeted refinements can solve the problem.

## Review Checklist

- Overall enterprise credibility and corporate polish.
- Typography scale, weight, contrast, line length, and hierarchy.
- Spacing rhythm, panel density, whitespace, and scroll burden.
- Color restraint, semantic status colors, teal accent use, and contrast.
- Table readability, sticky/scannable columns, compact cells, numeric alignment, and truncation.
- Drawer header/body clarity, tab density, empty states, and action placement.
- Dashboard KPI hierarchy, chart/table balance, and executive readability.
- Import flow clarity, mapping table density, warnings, summary cards, and confirmation states.
- Consistency across Licenses, Hardware, Contracts, Documents, Tasks, Reports, Dashboard, Attention Center, and Data Import.
- Avoidance of demo artifacts, placeholder-heavy states, disconnected buttons, or visually dominant inactive actions.

## Risks / Gaps To Look For

- UI appears like a prototype rather than a corporate SaaS product.
- Every field is shown with equal visual weight.
- Cards are oversized for operational data.
- Tables are too wide, too sparse, or hard to scan.
- Status badges, warnings, and action buttons compete visually.
- Empty states sit too low or waste drawer space.
- Import review exposes too much technical detail as the primary view.
- MSP commercial language and Internal IT operational language visually blur together.
- Color or typography choices reduce perceived trust.

## Required Output Format

1. Executive summary
2. What is visually strong
3. Risks / gaps
4. Recommended visual refinements
5. Module-specific notes
6. MSP / Integrator implications
7. Internal IT implications
8. Suggested implementation prompt, if action is needed

## Suggested Implementation Prompt Format

Use this format when recommending a Codex implementation:

```text
Refine [screen/component] visual design only.

Do not change routes, Sidebar, Topbar, Floating AI, workspaceMode, data model, backend, or business logic.

Objective:
[specific visual/design outcome]

Scope:
- Files/components likely affected:
- Visual elements to change:
- Visual elements not to touch:

Acceptance criteria:
- [compact, testable criteria]
- npm run build passes
- git diff --check passes
```
