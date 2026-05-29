# OPRIVA DEVELOPMENT METHODOLOGY

## 1. Purpose

Opriva uses a project-specific development methodology, not a generic external agent framework. External methodologies can provide useful ideas, but Opriva's product rules, data model, import model, security constraints, backend-readiness requirements and workspace-mode logic are specific enough that generic coding-agent workflows must be adapted before use.

This document defines the Opriva methodology for Codex, Claude Code and future AI-assisted development.

## 2. Authority Hierarchy

When instructions conflict, use this authority order:

1. User instructions
2. `AGENTS.md`
3. `OPRIVA_AI_DEVELOPMENT_TEAM.md`
4. Opriva skills
5. Opriva documentation
6. External methodologies only as references

External frameworks, repositories, skills, hooks or prompts never override Opriva-specific rules unless the user explicitly approves a change.

## 3. Inspect Before Implement

Before implementation:

- Inspect the current code or documentation first.
- Report what exists today.
- Identify risks, affected files and likely failure points.
- Check whether the task is product, UX, import, backend, security, architecture or documentation work.
- Use the relevant Opriva skills or review lenses for major changes.
- Do not modify files until the implementation plan is clear and, for broad changes, approved.

This is especially important for:

- Data Import and canonical mapping.
- `RECORD_STORE` and local store behavior.
- New Record forms.
- Drawer behavior.
- Workspace mode behavior.
- Controlled catalogs.
- Documents, tasks, relationships and activity.
- Backend-readiness and security-sensitive changes.

## 4. Plan Before Coding

Every important change should include:

- Objective
- Files likely affected
- Current behavior
- Proposed behavior
- Risks
- Backend implications
- MSP / Integrator implications
- Internal IT implications
- Security and privacy implications
- Validation steps
- Suggested commit message

Planning should stay practical. It should identify the smallest safe change rather than invent a large redesign.

## 5. Minimal Change Principle

Implement the smallest safe change that solves the approved objective.

Rules:

- Do not combine refactor, product behavior and documentation unless they are intentionally related.
- Do not redesign the app when the task is a logic or data-model fix.
- Do not modify routes, Sidebar, Topbar, Floating AI, workspace mode, `RECORD_STORE`, Configure Columns, Advanced Filters or drawer behavior unless the task requires it.
- Do not add backend, persistence, storage, auth, APIs, dependencies or import engines unless explicitly requested.
- Keep commits focused and reversible.
- Keep sandbox behavior clearly labeled as sandbox behavior.

## 6. Verification Before Completion

Before saying a task is done:

- Run `npm run build` for code changes.
- Run `git diff --check`.
- Run `git status --short`.
- Confirm no `private-samples/` files are included.
- Confirm package files are unchanged unless expected.
- Confirm application code is unchanged for documentation-only tasks.
- Confirm behavior was tested or describe what was not tested.
- Confirm any remaining working tree changes are intentional and explained.

For UI behavior changes, build alone is not enough when browser validation is practical. Use local browser testing or Playwright-style verification when the change affects visible workflows.

## 7. Systematic Debugging

When something breaks:

1. Capture the exact error.
2. Identify recent commits and current pending changes.
3. Reproduce the failure.
4. Isolate the file, line, component or helper involved.
5. Find the root cause.
6. Apply the smallest safe fix.
7. Validate with build and targeted runtime checks.
8. Do not randomly refactor.
9. Do not continue feature work until the app is running again.

This applies to local host crashes, build failures, JSX syntax errors, broken imports, bad module extraction, import sandbox failures and drawer/form regressions.

## 8. Code Review Checklist

Before committing code, check:

- Behavior is unchanged or intentionally changed.
- The change is scoped to the requested task.
- No unrelated files are staged.
- No private data is present.
- No backend was added unless explicitly requested.
- Package files changed only if expected.
- Controlled catalog fields are not treated as unrestricted free text.
- Import remains model-driven, not spreadsheet-driven.
- Sensitive contact and personal data require review.
- Imported records become canonical records where applicable.
- Activity/audit implications are documented when relevant.
- MSP / Integrator and Internal IT implications were considered.
- `npm run build` passed for code changes.
- `git diff --check` passed.

## 9. Finish-Branch / Finish-Task Checklist

Before finishing a task:

- Build passes when code changed.
- Diff check passes.
- Commits are focused.
- Final `git status --short` is clean or clearly explained.
- Documentation is updated if a product decision changed.
- Private samples, credentials and real client files are not committed.
- The next step is documented when useful.
- Any remaining risk or untested behavior is stated plainly.

## 10. Opriva-Specific Non-Negotiables

- Opriva is local/sandbox now.
- Backend is required for corporate MVP.
- Local/session state is allowed only for UX and product logic validation.
- Import must be model-driven, not spreadsheet-driven.
- Imported records must become canonical Opriva records after approval.
- Controlled catalogs are mandatory for repeated business entities.
- Repeated business entities must not be unrestricted free text.
- Entity detection and staging is required during import.
- Sensitive contact fields require review.
- AI suggests; users approve.
- Activity must become an audit trail.
- Documents require secure backend storage later.
- Support Coverage is a related contract/coverage record, not a text field.
- Tasks are operational entities linked to records, not a Next Action field.
- Relationships must be navigable.
- Assets & Renewals is the unified renewal worklist.
- MSP / Integrator and Internal IT must both be considered.
- No private samples or real client files in Git.

## 11. External Skill / Repository Policy

External repositories may be researched only unless the user explicitly approves installation, cloning or execution.

Rules:

- Do not install external skills without explicit approval.
- Do not clone external repositories without explicit approval.
- Do not run external scripts, hooks, installers, setup commands or executable files without explicit approval.
- Do not install MCP servers or dependencies without explicit approval.
- Treat external skills and methodologies as supply-chain inputs.
- Inspect license, scripts, hooks, commands and instructions before adoption.
- Adapt useful patterns into Opriva-specific guidance.
- Do not allow external tools or skills to access, expose or commit `private-samples/` or real client data.

External methodologies can inspire Opriva, but Opriva's own rules remain authoritative.

### 11.1 Cross-Agent Skill Parity (Claude Code ↔ Codex)

Opriva is developed across multiple AI agents. Any external design, UX, taste or methodology skill approved and adapted for one agent (e.g., Claude Code) must also be adapted — or have a clearly planned equivalent — for the other supported agents (e.g., Codex). This prevents drift between sessions, contributors and tools.

The canonical record of external design-skill sources currently under research, the cross-agent parity rule, the rule that the assistant must remind the user about Codex parity when they say work is continuing in Codex, and the likely Codex target locations all live in `OPRIVA_AI_DEVELOPMENT_TEAM.md` §10.1–§10.2 and §11.1.

## 12. Recommended Use With Codex And Claude Code

Use precise prompts that match the desired workflow:

- Inspect only: ask Codex or Claude Code to inspect and report without editing files.
- Audit with skills: name the Opriva skills or review lenses to apply.
- Propose plan: request an implementation plan, files affected, risks and validation.
- Implement minimal change: explicitly list what may and may not be changed.
- Validate: request `npm run build`, `git diff --check` and targeted runtime checks.
- Commit: provide exact files and commit message, and require final `git status`.

Recommended prompt patterns:

- "Inspect only and report. Do not modify files."
- "Use the import-data-model and backend-readiness lenses."
- "Implement only the smallest safe fix."
- "Do not modify routes, Sidebar, Topbar, Floating AI or workspaceMode."
- "Run build and diff check. Do not commit yet."
- "Stage only these files and commit with this message."
- "When I say I am continuing in Codex, remind me to replicate or adapt approved Claude Code skills for Codex parity before proceeding."

## 13. Final Recommendation

Opriva should develop through its own specialized methodology and AI Development Team. External ideas can be useful after review, but Opriva should not install or inherit generic agent frameworks blindly.

The safest path is to keep Opriva's methodology explicit, domain-specific, security-aware, backend-ready and disciplined around focused commits.
