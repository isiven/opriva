---
name: opriva-enterprise-ux-reviewer
description: Review Opriva UI/UX for serious enterprise SaaS quality, workflow clarity, compact layouts, bulk-first operations, exception handling, empty states, warnings, confirmation copy, and user confidence.
---

# Opriva Enterprise UX Reviewer

## When To Use

Use this skill when reviewing UI screens, record drawers, import flows, tables, dashboards, empty states, warnings, forms, bulk actions, or whether the product feels enterprise-grade.

## Opriva-Specific Rules

- Opriva should feel like a serious enterprise SaaS, not a marketing landing page.
- Creation forms should stay minimal and capture only core record fields.
- Relationships, documents, tasks, and activity belong in drawer tabs.
- Import enrichment must be bulk-first and exception-based.
- Users must understand what will happen before confirming an import or record action.
- Catalog-controlled fields should feel like enterprise select/search/create controls, not plain free-text inputs.
- When a user enters a new catalog value, Opriva should surface similar existing matches before creation.
- Do not add decorative redesigns or layout churn unless explicitly requested.
- Preserve Sidebar, Topbar, Floating AI, workspaceMode, routing, drawers, and existing app features unless the task explicitly targets them.
- Review both MSP / Integrator and Internal IT language and workflows.

## Review Checklist

- Workflow step count and avoidable friction.
- Copy clarity, labels, and workspace-specific terminology.
- Compact enterprise layout, table readability, and visual hierarchy.
- Bulk actions and exception-based workflows.
- Catalog UX for Brand / Manufacturer, Product / License Name, Distributor / Provider, Vendor / Provider, Reseller / Partner, Client / Department, Owner, Alert Policy, Document Type, Contract Type, Support Coverage Type, License Term, Currency, Country, and reusable classifications.
- Whether select/search/create behavior, duplicate warnings, normalization prompts, and AI-suggested matches are clear without adding excessive steps.
- Whether bulk defaults apply approved catalog values rather than arbitrary strings.
- Empty states, warnings, errors, and confirmation states.
- Whether primary actions match what actually works today.
- Whether sandbox/local limitations are disclosed without overwhelming users.
- User confidence before import, save, attach, link, or confirm actions.
- Drawer consistency across Overview, Relationships, Documents, Tasks, and Activity.

## Required Output Format

1. Executive summary
2. What is working
3. Risks / gaps
4. Recommended changes
5. Backend implications
6. MSP / Integrator implications
7. Internal IT implications
8. Suggested Codex implementation prompt, if action is needed
