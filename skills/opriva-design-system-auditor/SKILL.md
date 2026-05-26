---
name: opriva-design-system-auditor
description: Audit Opriva for design-system consistency across components, tokens, tables, drawers, controls, spacing, statuses, workspace terminology, and reusable enterprise UI patterns.
---

# Opriva Design System Auditor

## When To Use

Use this skill when reviewing or planning Opriva design-system work: shared visual rules, reusable components, controls, typography, spacing, tokens, tables, badges, drawers, forms, import UI, dashboard patterns, and consistency between MSP / Integrator and Internal IT modes.

## Opriva-Specific Rules

- Opriva is currently a local/sandbox webapp, but design decisions should prepare for a corporate MVP.
- Do not invent a new visual language unless explicitly requested.
- Prefer extracting and standardizing existing successful patterns before redesigning.
- Preserve established shell behavior: Sidebar, Topbar, Floating AI, routing, workspaceMode, record drawers, and table workflows.
- Cards should be used for repeated items, modals, compact panels, or framed tools, not as decorative nested containers.
- Tables, drawers, toolbars, tabs, badges, buttons, inputs, and status messages should have consistent treatment.
- Internal IT and MSP / Integrator may use different terminology, but should share the same design-system foundation.
- Calculated fields, warnings, review states, missing evidence, approvals, margin, risk, and renewal status need consistent semantic styling.

## Review Checklist

- Global typography hierarchy and repeated heading patterns.
- Color tokens, status tones, warning/error/success/info patterns, and teal accent usage.
- Button hierarchy: primary, secondary, row action, icon/action, disabled.
- Form controls: inputs, selects, toggles, file pickers, validation messages.
- Tables: header styling, cell density, action cells, badges, numeric/value cells, scroll behavior.
- Drawer components: header, tabs, overview sections, relationship/doc/task/activity layouts.
- Dashboard components: KPI cards, insight bars, priority queues, forecast/renewal tables.
- Import components: path cards, mapping table, defaults panel, preview table, warnings, result summary.
- Empty states and loading/error/success states.
- Workspace terminology rules and label consistency.
- Opportunities to extract repeated inline styles into reusable classes/components later.

## Risks / Gaps To Look For

- Inline styles diverge across similar UI blocks.
- Badges or statuses use inconsistent text/tone.
- Tabs and buttons feel different across modules.
- Table action patterns vary by screen.
- Similar panels use different title/helper/body spacing.
- Drawer tabs and body sections do not share a stable rhythm.
- Import flow uses technical structure that does not match the rest of Opriva.
- Design-system cleanup accidentally changes behavior or layout contracts.

## Required Output Format

1. Executive summary
2. What is consistent today
3. Design-system inconsistencies
4. Recommended standardization tasks
5. Components/patterns to extract later
6. Risks and regression areas
7. MSP / Integrator implications
8. Internal IT implications
9. Suggested implementation prompt, if action is needed

## Suggested Implementation Prompt Format

Use this format when recommending implementation:

```text
Standardize [design-system pattern] in Opriva.

Do not change behavior, routes, workspaceMode, backend, data model, Sidebar, Topbar, Floating AI, or record creation/import logic.

Scope:
- Affected files/components:
- Existing patterns to preserve:
- Patterns to standardize:

Acceptance criteria:
- Visual output remains consistent across MSP / Integrator and Internal IT
- No feature behavior changes
- npm run build passes
- git diff --check passes
```
