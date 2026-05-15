# Opriva App Healthcheck

Checked: App.jsx, main.jsx, DESIGN.md, workspace memory/context.
Scope: inspection only. No app source changes were made.

## Executive status

**Health: Needs attention**

The app source is currently a valid-looking React/Vite component file, but it does **not** render in the Open CoDesign preview runtime because `App.jsx` starts with an ES module import. The current `App.jsx` also appears to have regressed from several recently approved Opriva UI decisions in branding, topbar, Dashboard copy, sidebar labeling, and Attention Center content.

## Blocking runtime issue

- **Preview runtime failure:** `Cannot use import statement outside a module`
- **Location:** `App.jsx:1`
- **Cause:** `App.jsx` begins with `import React from 'react';`, while the current Open CoDesign single-file preview runtime evaluates `App.jsx` without module support and expects host-provided `React` / `ReactDOM` globals.
- **Impact:** The preview cannot render until the entry strategy is aligned.

## Source compatibility note

`main.jsx` is a standard Vite entry that imports `App.jsx`. This suggests the workspace is split between two runtime expectations:

1. **Vite module mode:** `App.jsx` can import React and export a component.
2. **Open CoDesign single-file preview mode:** `App.jsx` should avoid imports/exports and use the host-provided React mounting pattern.

The current file mixes these expectations: it imports React at the top and also directly mounts itself at the bottom.

## Product and UI regressions found

These are not syntax blockers, but they conflict with the current DESIGN.md / workspace memory decisions.

### Branding and shell

- Sidebar mark currently renders as a generic `OP` gradient square, not the restored Opriva eye/C-style mark.
- Sidebar brand name currently appears as `OPRIVA` in excessive uppercase.
- Sidebar subtitle currently reads `Opriva Workspace`, not `IT Asset & Renewal Intelligence`.
- Topbar currently shows a search button, `9 alerts`, and avatar only; it does not show the approved `Banisi Workspace` context or active page label.
- The alert control uses text `9 alerts`, which is specifically disliked in the workspace memory.

### Sidebar labeling

- The Manage group still shows `Expirations` instead of the approved visible label `Assets & Renewals`.

### Dashboard

- Dashboard still uses older KPI language: `Critical items`, `Renewal exposure`, `Missing owners`, `Data completeness`.
- Primary action still reads `Create record` instead of `Review exposure`.
- The Dashboard metadata line is missing.
- Dashboard structure/content does not match the approved English Financial Exposure Command Center state.

### Attention Center

- Eyebrow remains `Alerts and escalations`, not `Operational Issue Center`.
- Subtitle remains generic alerts/escalations language.
- Actions still read `Bulk assign` and `Create escalation`.
- Summary cards and AI Insight bar are missing.
- Tabs remain older labels such as `Open alerts` and `Missing documents`.
- Table remains older columns: `Alert`, `Severity`, `Company`, `Recommended action`, `Owner`.
- Issue groups are still titled `Severity groups` with older example rows.

### Floating AI behavior risk

- `TWEAK_DEFAULTS.allowCursorFollow` is currently `true`.
- `FloatingAgentButton` moves the wrapper in response to pointer movement.
- This conflicts with the documented preference that the floating AI button/container should not follow the mouse; only internal logo motion should react.

## Recommended next fixes

1. **Choose preview target mode** before editing:
   - If preserving Open CoDesign preview compatibility, remove module import/export assumptions from `App.jsx` and rely on global React/ReactDOM.
   - If targeting strict Vite only, remove the direct `ReactDOM.createRoot(...)` mount from `App.jsx` and export the component for `main.jsx`.
2. Restore Opriva sidebar branding and Banisi Workspace topbar context.
3. Restore the approved Dashboard Financial Exposure Command Center copy.
4. Restore the refined Attention Center operational issue center content.
5. Disable floating container cursor-follow behavior while preserving the Opriva AI Agent mark interaction.

## Verification performed

- Workspace inspected: yes.
- DESIGN.md reviewed: yes.
- `App.jsx` reviewed: yes.
- `main.jsx` reviewed: yes.
- Preview attempted: failed with one console/runtime error.
- Final verification attempted on `App.jsx`: failed with `Cannot use import statement outside a module`.

## Files changed

- Created `healthcheck.md` only.
- No changes were made to `App.jsx`, routing, settings, Dashboard, Attention Center, Data Import, sidebar, topbar, or the floating AI agent.
