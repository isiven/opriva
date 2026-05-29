---
name: opriva-workspace-mode-reviewer
description: Review Opriva changes for correct MSP / Integrator and Internal IT behavior, terminology, data separation, defaults, filters, forms, imports, reports, dashboards, and workspaceMode-specific risks.
---

# Opriva Workspace Mode Reviewer

## When To Use

Use this skill for any Opriva feature, UI, import, report, dashboard, form, table, filter, default, or workflow that may behave differently in MSP / Integrator and Internal IT modes.

## Review Checklist

- Determine whether the change applies to MSP / Integrator, Internal IT, or both.
- Verify labels and copy match the active mode.
- MSP / Integrator should use client/account/reseller/commercial ownership language.
- Internal IT should use department/business unit/location/internal owner language.
- Confirm logic does not mix client concepts with department concepts.
- Check defaults, filters, tables, forms, imports, reports, and dashboards for correct `workspaceMode` behavior.
- Look for hardcoded assumptions that support only one mode.
- Identify where behavior, required fields, columns, or summaries should differ by mode.
- Check for data-crossing risks between clients, departments, accounts, or business units.
- Decide whether the feature should be documented as shared behavior or workspace-specific behavior.

## Required Output Format

1. Workspace modes affected
2. Findings
3. Required changes
4. MSP / Integrator implications
5. Internal IT implications
6. Remaining risks
