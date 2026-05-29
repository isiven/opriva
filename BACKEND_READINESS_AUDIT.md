# Opriva Backend Readiness Audit

Date: 2026-05-25

## 1. Purpose of the audit

This audit documents what currently works in Opriva as design/local sandbox behavior and what must migrate to a real backend before corporate MVP testing.

Opriva is validating product logic for IT Asset & Renewal Intelligence: workspace modes, canonical records, imports, support coverage, documents, relationships, tasks, activity and AI-assisted workflows. The current local implementation is useful for UX validation, but it is not enterprise-ready until persistence, security, storage, permissions, auditability and multi-user behavior exist.

## 2. Current project stage

Opriva is currently in design plus local/sandbox functional validation.

Current stable context:

- Official import template exists at `templates/OPRIVA_IMPORT_TEMPLATE.xlsx`.
- Public downloadable template exists at `public/templates/OPRIVA_IMPORT_TEMPLATE.xlsx`.
- Data Import shows two paths:
  - Path A: AI-assisted mapping.
  - Path B: Official Opriva Template.
- Existing documentation includes `USER_GUIDE.md`, `AI_KNOWLEDGE_BASE.md` and `OPRIVA_IMPORT_TEMPLATE_SPEC.md`.
- Import mappings are documented for Trend Micro, Veeam, Microsoft CSP and QNAP Hardware.
- `.gitignore` must keep `.claude/` and `private-samples/` ignored.

The current implementation may use local/session state to validate UX, navigation and product behavior. That is acceptable for this stage.

## 3. Backend-readiness principle

Local/session state is allowed only for prototype validation.

Any feature that handles persistence, security, collaboration, real files, imports, alerts, roles, permissions, audit trail, AI knowledge, enterprise reporting or corporate data must be backed by a real backend/database/storage/auth layer before corporate MVP.

Opriva must not treat frontend state as the source of truth for enterprise workflows.

## 4. Backend requirement summary

Backend is mandatory for:

- User authentication and sessions.
- Workspace and tenant isolation.
- Role-based permissions.
- Persistent canonical records.
- Real relationships between records.
- Support Coverage as related contract/coverage records.
- Documents metadata and secure file storage.
- Document policies and Missing Evidence detection.
- Import jobs, import files, mappings and row-level audit.
- Calculated/derived fields and scheduled recalculation.
- Alerts and notifications.
- Activity as a durable audit trail.
- AI knowledge retrieval and AI assistant governance.
- Search, filtering, saved views and table preferences.
- Dashboards and reports over persistent data.
- Workspace-mode-specific rules for MSP / Integrator and Internal IT.
- Admin configuration and custom fields.

## 5. Current local/sandbox features reviewed

| Feature | Current sandbox behavior | Backend need |
|---|---|---|
| Record drawer | Overview, Relationships, Documents, Tasks and Activity tabs validate the core record model. | Persistent record identity, tab data, permissions and audit. |
| Documents Vault upload document | Document flows validate metadata and document taxonomy. | Real file upload, secure storage, document metadata and access policies. |
| Drawer Documents attach document | User can attach document metadata from a record context. | Backend-backed documents, file objects and document links. |
| Local file picker | Browser file selection validates UX. | Upload endpoint, storage pointer, virus scanning and secure URLs. |
| Unified document taxonomy | Product taxonomy is defined for quotes, invoices, contracts, certificates and evidence. | Controlled vocabulary and workspace policy enforcement. |
| Support Coverage from Licenses and Hardware | Support Coverage can be created from record context. | Persistent support coverage contract/coverage records and relationships. |
| Support Coverage creates Contract record | Product logic treats coverage as a renewable contract-like record. | Contracts/support coverage persistence, covered record links and activity. |
| Contracts Coverage Details | Contracts can show covered record context. | Queryable coverage relationship and permission-aware navigation. |
| Navigable relationships | UI supports Open contract, Open covered record and Open linked record. | Backend relationship graph with referential integrity. |
| Drawer tasks | Tasks can be created from a record drawer. | Persistent tasks linked to source records and assignees. |
| Global Tasks | Global task creation requires Linked Record. | Task service, linked record validation and global queue persistence. |
| Activity | Activity tab validates audit UX. | Append-only persistent audit trail. |
| Data Import | Import UX validates two paths and mapping/preview concepts. | Import job engine, file storage, mapping approval and durable created records. |
| Official Import Template | Template is available for download. | Template recognition, validation and backend import handling. |
| Configure Columns | Local table preferences validate UX. | Saved views and user/workspace preferences. |
| Advanced Filters | Local filters validate UX. | Saved filters, indexed queries and permission-aware filtering. |
| Workspace mode | Topbar mode validates MSP / Integrator and Internal IT terminology. | Workspace configuration persisted in backend. |

## 6. Critical backend domains

### Authentication

Corporate MVP requires secure login, session management, account status, password/SSO readiness and eventually MFA. No corporate data should be accessible without authentication.

### Workspaces / tenant separation

Every record, file, import, task, activity event and setting must belong to a workspace. Tenant isolation must be enforced in API queries and storage access.

### Roles and permissions

Opriva needs role-based access control for modules, records, documents, imports, reports, settings and admin actions. Permissions must be enforced server-side.

### Core canonical records

Licenses, Hardware, Contracts, Documents, Tasks, Clients/Departments, Support Coverage and Renewal Packages must be stored as canonical backend records. Opriva must not store arbitrary spreadsheet-shaped data as the product model.

### Relationships

Relationships visible in the UI must be navigable and backend-backed. A relationship should be a typed link between two records or between a package and records.

### Support Coverage

Support Coverage is not a text field inside Licenses or Hardware. It is a related contract/coverage record with its own provider, dates, owner, value, alert policy and lifecycle.

### Tasks

Tasks are not a simple Next Action field. They are operational entities linked to source records, assigned to users, tracked by status and visible in both drawer and global task contexts.

### Documents and file storage

Documents require secure storage and document metadata. The backend needs a metadata table, file object table, storage provider, secure URLs, file validation and access rules.

### Document policies and Missing Evidence

Missing Evidence should be derived from required document policies, linked documents and record state. It should not be a manually entered status.

### Import engine

Opriva import must be model-driven, not spreadsheet-driven. The backend should handle upload, parsing, mapping, validation, preview, confirmation, record creation and audit.

### Official Opriva Import Template

The official template is optional. Users may also upload their own Excel and use AI-assisted mapping. Template uploads should be recognized by structure and validated against the canonical model.

### Calculated and derived fields

Status, Days to Expiration, Risk, Margin, Renewal Stage and Missing Evidence must be calculated or derived, not manually entered fields.

### Alerts and notifications

Expiration, warranty and support coverage alerts require scheduled backend jobs and notification delivery. Future channels may include in-app, email and WhatsApp.

### Activity / audit trail

Activity must become a true audit trail. It should store actor, timestamp, workspace, source record, related record, event type and structured metadata.

### AI knowledge and AI assistant

AI knowledge must be versioned, governed and retrieved securely. AI can suggest mappings and actions, but user approval remains required for record creation or workflow changes.

### Search, filtering and table preferences

Search and filters must operate over persisted data with permissions. Saved views, saved filters and column preferences should be backend-backed.

### Dashboards and reports

Dashboards and reports must query persistent records, documents, tasks, imports and alerts. Export/report jobs require audit and access controls.

### Workspace modes: MSP / Integrator and Internal IT

Backend must support mode-specific terminology and rules:

| MSP / Integrator | Internal IT |
|---|---|
| Client | Department |
| Distributor | Provider |
| Annual Value | Annual Cost / Budget |
| Vendor Cost / Margin | Cost Center / Approval / Risk |
| Account Owner / Renewal Owner | IT Owner / Budget Owner |
| Commercial renewal follow-up | Operational continuity and governance |

### Admin configuration

Settings, operating model, module visibility, policies and defaults must persist by workspace and be admin-controlled.

### Custom fields

Custom fields should be defined by workspace/module and stored separately from core canonical fields. They should not replace the canonical model.

## 7. Recommended backend architecture areas

Opriva needs these backend areas:

- Auth and user management.
- Workspace/tenant service.
- RBAC/permissions service.
- Core records API.
- Relationship API.
- Document metadata API.
- File storage service.
- Task API.
- Activity/audit service.
- Import job service.
- Alert/notification worker.
- Search/filter API.
- Saved views/preferences API.
- Admin settings API.
- AI knowledge retrieval service.
- Reporting/export service.

## 8. Backend migration matrix

| Area | Can stay local now | Must be backend for corporate MVP |
|---|---:|---:|
| Visual drawer tabs | Yes | No |
| Record identity | Temporary | Yes |
| Licenses/Hardware/Contracts data | Temporary | Yes |
| Documents metadata | Temporary | Yes |
| File bytes/storage | No | Yes |
| Support Coverage | Temporary | Yes |
| Relationships | Temporary | Yes |
| Tasks | Temporary | Yes |
| Activity | Temporary | Yes |
| Import mapping UI | Yes | Backend job required |
| Import created records | Temporary | Yes |
| Official template download | Yes | Template validation/import required |
| Workspace mode UI | Yes | Workspace setting required |
| Configure Columns | Yes | Saved views required |
| Advanced Filters | Yes | Saved filters/server query required |
| AI assistant copy/knowledge | Yes | Governed retrieval required |
| Alerts | Prototype only | Yes |
| Reports | Prototype only | Yes |

## 9. Suggested backend data model — first draft

Core tables/entities:

- `workspaces`: tenant, name, operating model, status, settings.
- `users`: identity, email, name, auth provider ID, status.
- `workspace_members`: workspace/user membership and role.
- `roles`: workspace roles.
- `permissions`: role grants by resource/action.
- `clients`: MSP client organizations.
- `departments`: Internal IT departments/business areas.
- `products`: product/brand catalog.
- `licenses`: license records with product, client/department, provider/distributor, quantity, expiration date, owner, value/cost fields and alert policy.
- `hardware_assets`: physical assets with brand, model, serial, warranty end, owner, provider and client/department.
- `contracts`: agreements, legal/support contracts and renewal obligations.
- `support_coverage`: coverage records linked to license/hardware/contracts.
- `documents`: document metadata.
- `file_objects`: storage pointer, file metadata, checksum and scan status.
- `document_links`: document-to-record/package links.
- `tasks`: operational tasks linked to records.
- `activity_events`: append-only audit/activity events.
- `relationships`: typed links between records.
- `renewal_packages`: package/bundle records.
- `package_items`: records included in a package.
- `import_jobs`: import workflow state.
- `import_files`: uploaded import files.
- `import_mappings`: approved column mappings.
- `import_rows`: raw/normalized row staging and results.
- `custom_fields`: workspace-defined field definitions.
- `custom_field_values`: values for custom fields.
- `alert_policies`: workspace and record-level alert rules.
- `notifications`: generated in-app/email/future-channel notifications.
- `saved_views`: table column/sort preferences.
- `saved_filters`: reusable filter definitions.
- `settings`: admin and workspace policy settings.

## 10. Backend API areas needed

Required API areas:

- Auth/session endpoints.
- Workspace and membership endpoints.
- Role/permission endpoints.
- Client/department CRUD.
- License CRUD.
- Hardware CRUD.
- Contract/support coverage CRUD.
- Relationship create/list/delete.
- Document metadata CRUD.
- File upload/download/signing endpoints.
- Task CRUD and assignment endpoints.
- Activity/audit read endpoints and append-only event writer.
- Import job create/upload/parse/map/validate/preview/confirm endpoints.
- Alert policy CRUD.
- Notification read/update endpoints.
- Search and filter endpoints.
- Saved views and saved filters endpoints.
- Settings/admin endpoints.
- AI knowledge retrieval and mapping suggestion endpoints.
- Reports/export endpoints.

## 11. Corporate MVP readiness checklist

- Users can log in.
- Workspaces are isolated.
- Roles and permissions exist.
- Records persist after refresh.
- Documents are stored securely.
- Document metadata is queryable.
- Relationships are backend-backed and navigable.
- Support Coverage is persisted as related coverage/contract records.
- Tasks are persisted and linked to records.
- Activity/audit events persist.
- Imports create durable records only after user approval.
- Import files, mappings and row outcomes are auditable.
- Calculated fields are computed consistently.
- Alerts can be generated by backend jobs.
- Saved views and filters persist.
- Workspace mode is stored in workspace settings.
- Real client files are never committed to GitHub.
- `private-samples/` remains ignored.
- `sample-data/` contains only demo or anonymized files.

## 12. Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Local state used with real customer data | Data loss and credibility risk | Move corporate tests to backend-backed environment only. |
| Missing tenant isolation | Cross-customer data leakage | Enforce workspace scoping at API/database/storage layers. |
| Frontend-only permissions | Unauthorized data access | Server-side RBAC checks on every endpoint. |
| Files stored without security | Sensitive document exposure | Use object storage, signed URLs, scanning and access policies. |
| Import blindly mirrors Excel columns | Polluted product model | Enforce canonical mapping and user approval. |
| Relationships remain UI-only | Broken navigation and reporting | Store typed relationships and validate targets. |
| Activity remains local | No audit trail | Append events server-side. |
| Status/risk/margin entered manually | Inconsistent analytics | Compute derived fields from source data and policies. |
| Real samples committed | Data breach | Keep `private-samples/` ignored; use anonymized `sample-data/` only. |

## 13. Recommended implementation phases

### Phase 0 — Current local sandbox

Continue using local/session state only for UX validation and product logic testing.

### Phase 1 — Backend foundation

Implement authentication, workspaces, users, roles, permissions and workspace settings.

### Phase 2 — Core records persistence

Persist clients/departments, licenses, hardware, contracts, support coverage, relationships and tasks.

### Phase 3 — Documents and storage

Implement documents metadata, file objects, secure upload/download, document links and access policies.

### Phase 4 — Import engine

Implement import jobs, upload, parsing, mapping approval, validation, normalized preview and confirmed record creation.

### Phase 5 — Activity, alerts and notifications

Persist audit events, scheduled expiration jobs, alert policies and notifications.

### Phase 6 — Enterprise AI, search and reporting

Implement governed AI knowledge retrieval, AI mapping assistance, search, saved views, reporting and exports.

## 14. What can remain front-end/local for now

- Visual layout validation.
- Drawer/tab interaction validation.
- Workspace-mode copy and terminology testing.
- Local mapping UI proof of concept.
- Demo-only mock data.
- Non-sensitive sample files in `sample-data/`.
- Static docs and product decision records.
- Official template download.

## 15. What must not remain front-end/local for corporate MVP

- Authentication.
- Tenant/workspace isolation.
- Permissions.
- Real records.
- Real documents and file bytes.
- Support Coverage records.
- Relationships.
- Tasks and assignments.
- Activity/audit events.
- Import jobs and imported records.
- Alerts and notifications.
- Admin settings.
- Saved views and filters.
- AI knowledge retrieval.
- Reports and exports.
- Any real customer data.

## 16. Repository and data handling notes

- Real client files must not be committed to GitHub.
- `private-samples/` is for real local test files only and must remain ignored.
- `private-samples/**/*.xlsx`, `private-samples/**/*.xls` and `private-samples/**/*.pdf` must remain ignored.
- `sample-data/` may contain demo or anonymized files only.
- Official templates are allowed in Git:
  - `templates/OPRIVA_IMPORT_TEMPLATE.xlsx`
  - `public/templates/OPRIVA_IMPORT_TEMPLATE.xlsx`
- Backend migration should use anonymized fixtures for tests.

## 17. Final conclusion

Opriva has a strong local sandbox for validating the product model, especially the distinction between MSP / Integrator and Internal IT, the record drawer architecture, Support Coverage, documents, tasks, activity and model-driven imports.

The product is not corporate-MVP-ready until backend persistence, auth, permissions, storage, import jobs, audit trail and alerts are implemented. The next practical step is to convert this audit into a backend architecture plan that defines schema, APIs, storage, auth, permissions and phased implementation sequencing.
