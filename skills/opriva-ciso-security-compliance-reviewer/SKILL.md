---
name: opriva-ciso-security-compliance-reviewer
description: Review Opriva from a CISO, security, and compliance perspective, including auth, tenant isolation, permissions, audit trail, document security, evidence, data exposure, AI boundaries, and local-only risk.
---

# Opriva CISO Security / Compliance Reviewer

## When To Use

Use this skill when reviewing security, compliance, permissions, document handling, auditability, tenant separation, AI knowledge access, evidence controls, or corporate MVP readiness.

## Opriva-Specific Rules

- Opriva is currently local/sandbox design validation.
- Local/session state is not acceptable for corporate security or compliance testing.
- Backend is mandatory for auth, tenant isolation, roles, permissions, secure document storage, audit trail, alerts, and AI knowledge retrieval.
- Real client files must never be committed.
- `private-samples/` must remain ignored. `sample-data/` may contain demo/anonymized files only.
- Activity must become a persistent audit trail.
- Missing Evidence must be derived from document policy and linked records, not manually maintained.
- AI assistant behavior must respect permissions and workspace boundaries in corporate MVP.
- Imported contact names and emails are sensitive relationship data. They must not be imported blindly, logged, documented, or exposed to AI without permission boundaries.
- Bulk import entity creation must be approval-based, permission-aware and auditable, especially for contacts and external organizations.

## Review Checklist

- Authentication and session model gaps.
- Workspace/tenant isolation risks.
- Role-based access control and least privilege.
- Document metadata, file storage, secure URLs, retention, and scanning needs.
- Evidence requirements and Missing Evidence derivation.
- Audit trail coverage for create/edit/import/link/upload/task/status events.
- Data exposure through local files, logs, browser state, or AI context.
- Import handling for contact names, contact emails, billing/legal/technical contacts, and whether they require review before Contact creation/linking.
- Entity creation/linking during import and whether clients, contacts, providers, brands, products, relationships and activity events are created with audit trail and permissions.
- Alerting for critical expirations and compliance deadlines.
- Security implications of import uploads and mapping previews.
- Corporate pilot blockers.

## Required Output Format

1. Executive summary
2. What is working
3. Risks / gaps
4. Recommended changes
5. Backend implications
6. MSP / Integrator implications
7. Internal IT implications
8. Suggested Codex implementation prompt, if action is needed

