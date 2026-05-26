# BACKEND ARCHITECTURE PLAN — Opriva

## 1. Purpose

This document translates Opriva's current local/sandbox product into a future backend-backed corporate MVP architecture.

Opriva has validated a meaningful amount of product direction in the frontend: workspace modes, record drawers, documents, tasks, relationships, support coverage, local import mapping, enrichment, and first-class local records through `RECORD_STORE`. That is useful for design and product validation, but it is not enough for enterprise or corporate testing.

The purpose of this plan is to define the backend architecture areas, database model, APIs, security controls, import pipeline, document storage model, audit model, alert model, and implementation phases needed before Opriva can be used with real corporate data.

This is an architecture and planning document only. It does not implement backend code.

## 2. Current State

Opriva is currently in local/sandbox design validation.

Current implementation facts:

- Local/session state is used for UX and product logic validation.
- `RECORD_STORE` simulates a central local store for records created manually or through the local import sandbox.
- Imported records are promoted into local first-class records so they can appear in relevant modules during the current session.
- Mock data remains available and should become demo seed data rather than the long-term source of truth.
- The frontend validates workflows such as records, drawers, relationships, documents, tasks, activity, support coverage, imports, mapping, enrichment, and workspace terminology.
- Backend persistence is not implemented yet.
- Authentication, tenant isolation, role-based permissions, secure storage, real import jobs, audit trail, alert scheduling, AI retrieval governance, and reporting data services are not implemented yet.

The current frontend state is acceptable for validating product direction, but not for corporate MVP use with real customer data.

## 3. Architecture Principles

### Backend is mandatory for corporate MVP

Corporate MVP requires persistence, security, multi-user access, file storage, auditability, import history, alerting, and permissions. These cannot be solved by frontend state.

### Frontend local state is not production persistence

Local/session state can validate UX and product logic, but it must not be treated as a source of truth for enterprise workflows.

### Opriva must be model-driven, not spreadsheet-driven

Imports must map uploaded data into Opriva canonical records. Opriva should not blindly import every Excel column. AI or rule-based mapping can suggest mappings, but the user approves them.

### Data must be canonical and workspace-scoped

Every record must belong to a workspace. Every query must enforce workspace scope. Custom fields may extend the model, but they must not replace canonical fields.

### Repeated business values must be controlled catalogs

Brand / Manufacturer, Product / License Name, Distributor / Provider, Vendor / Provider, Reseller / Partner, Client / Department, Owner, Alert Policy, Document Type, Contract Type, Support Coverage Type, License Term, Currency, Country and reusable business classifications should be backed by controlled catalogs. Forms and imports should use select/search/create behavior, normalize new values, detect similar existing values, and require user approval before creating new catalog records.

Backend catalogs must support normalized keys, unique constraints, aliases/synonyms, duplicate prevention, merge/deactivate flows, audit history, and explicit workspace-scoped versus global catalog rules.

### Every enterprise action must be permission-aware

Viewing, creating, editing, importing, exporting, attaching documents, assigning tasks, changing settings, and using AI must be governed by server-side permissions.

### Activity must become audit trail

Activity is currently a local UX concept. In the backend architecture it must become an append-only audit trail with actor, timestamp, workspace, record scope, event type, and structured metadata.

### Documents require secure storage

Documents are not only UI metadata. Enterprise Opriva needs object storage, file metadata, access policies, secure URLs, retention rules, upload auditing, and later virus scanning/versioning.

### AI must respect permissions

AI can help with import mapping, renewal explanations, risk summaries, and knowledge retrieval. It must not access or summarize data outside the user's workspace and permission scope. AI-generated actions require user approval.

### MSP / Integrator and Internal IT modes must be supported

The backend must support both operating models without mixing terminology or commercial logic:

- MSP / Integrator: Client, Distributor, Annual Value, Vendor Cost, Margin, Renewal Owner.
- Internal IT: Department, Provider, Annual Cost, Cost Center, Approval Status, Business Criticality, IT Owner / Budget Owner.

## 4. Proposed Backend Architecture

The future Opriva backend should be organized as a practical SaaS architecture:

```text
Frontend app
  -> API layer
  -> Authentication provider
  -> Relational database
  -> Object storage
  -> Background worker / job scheduler
  -> Notification service
  -> AI retrieval layer
  -> Audit/event system
  -> Optional analytics/reporting layer
```

### Frontend app

The current React/Vite app remains the user interface. Over time, it should call backend APIs instead of relying on `RECORD_STORE` and mock arrays.

### API layer

The API layer owns validation, permissions, record creation, relationships, imports, tasks, documents, alerts, and reporting queries.

### Authentication provider

Authentication should provide login, sessions, user identity, workspace membership, and eventually SSO/MFA readiness.

### Relational database

Opriva's core model is relational: workspaces, users, clients/departments, products, licenses, hardware, contracts, support coverage, documents, tasks, relationships, imports, alerts, and activity events.

### Object storage

Document files and import files should be stored in object storage. Database records should store metadata and storage pointers, not file bytes.

### Background worker / job scheduler

Workers should process import files, scheduled alert calculations, notification delivery, report exports, and later AI indexing.

### Notification service

Notifications should support in-app alerts first, then email and other channels later.

### AI retrieval layer

The AI layer should retrieve product knowledge, workspace data, import context, and record context through permission-aware retrieval.

### Audit/event system

Every important enterprise action should generate an activity/audit event.

### Optional analytics/reporting layer

Basic MVP reports can query the relational database. Larger customer deployments may eventually need materialized views, background aggregations, or a separate analytics layer.

### Possible backend stack options

This plan does not choose a final vendor. Stack selection should be made separately.

Candidate options:

- Supabase/Postgres: fast path for auth, database, storage, policies, and edge functions.
- Postgres + custom API: strong control and portability.
- Firebase: fast auth/realtime path but less natural for relational canonical data.
- Next.js API: useful if the frontend moves into a fullstack Next.js app.
- FastAPI: strong Python API option, especially if import parsing/AI workflows grow.
- Node/Express: straightforward JavaScript backend option.

Final selection should consider team skills, hosting, auth needs, storage, import processing, AI retrieval, and corporate security requirements.

## 5. Core Backend Domains

### Authentication

**Purpose:** Secure user access and session identity.

**Main entities:** users, sessions, auth identities.

**Key fields:** email, name, auth provider id, status, last login, MFA status later.

**Relationships:** users join workspaces through workspace memberships.

**Backend requirements:** secure login, logout, session validation, account status, optional SSO/MFA later.

**MVP priority:** Critical.

### Workspaces / Tenants

**Purpose:** Isolate customer data and workspace-specific settings.

**Main entities:** workspaces, workspace settings.

**Key fields:** name, operating model, status, locale, default alert policy, created at.

**Relationships:** workspaces own records, files, imports, tasks, roles, saved views, and settings.

**Backend requirements:** strict tenant isolation in every API query and storage access.

**MVP priority:** Critical.

### Users and Memberships

**Purpose:** Connect users to workspaces and roles.

**Main entities:** users, workspace_members.

**Key fields:** workspace id, user id, role id, membership status.

**Relationships:** workspace members create records, own tasks, upload documents, and appear in audit events.

**Backend requirements:** invite/join/remove users, assign roles, enforce access.

**MVP priority:** Critical.

### Roles and Permissions

**Purpose:** Control who can view, create, edit, delete, import, export, approve, and administer data.

**Main entities:** roles, permissions, role_permissions.

**Key fields:** role name, resource, action, scope.

**Relationships:** roles are assigned through workspace memberships.

**Backend requirements:** server-side permission checks for records, documents, imports, reports, AI, and settings.

**MVP priority:** Critical.

### Clients / Departments

**Purpose:** Represent the primary ownership entity depending on workspace mode.

**Main entities:** clients_departments.

**Key fields:** workspace id, record type, name, country, contact name, contact email, owner id, notes.

**Relationships:** linked to licenses, hardware, contracts, renewal packages, tasks, reports, and imports.

**Backend requirements:** support both MSP clients and Internal IT departments in one canonical table or two specialized tables with a shared interface.

**MVP priority:** Critical.

### Vendors / Providers

**Purpose:** Track suppliers, providers, distributors, resellers, and partners.

**Main entities:** vendors_providers.

**Key fields:** workspace id, name, type, country, contact, normalized name, notes.

**Relationships:** linked to licenses, hardware, contracts, documents, import mappings, and reports.

**Backend requirements:** normalization, deduplication, mode-specific labeling, and later catalog enrichment.

**MVP priority:** High.

### Brands / Manufacturers

**Purpose:** Represent technology brands and manufacturers separately from providers/distributors.

**Main entities:** brands.

**Key fields:** name, normalized name, category, website, notes.

**Relationships:** products belong to brands; licenses/hardware/contracts reference brands.

**Backend requirements:** consistent brand normalization during import and record creation.

**MVP priority:** High.

### Products / Catalogs

**Purpose:** Track products, licenses, services, warranties, support plans, and hardware models.

**Main entities:** products.

**Key fields:** brand id, product name, product type, entitlement metric, default term, default provider/distributor, lifecycle status.

**Relationships:** licenses and hardware reference products.

**Backend requirements:** catalog-backed forms, autofill, normalization, and import mapping support.

**MVP priority:** High.

### Controlled Catalogs

**Purpose:** Provide normalized, reusable values for business-critical fields so Opriva does not fragment reporting, imports, dashboards or AI context through free-text variants.

**Main entities:** catalog values may be implemented through specialized tables such as `brands`, `products`, `vendors_providers`, `clients_departments`, `document_types`, `contract_types`, `support_coverage_types`, `alert_policies`, `currencies`, `countries`, and optional reusable classification tables.

**Key fields:** workspace id when workspace-scoped, global flag when shared, display name, normalized key, type/category, aliases/synonyms, status, created_by, merged_into_id, deactivated_at.

**Relationships:** referenced by licenses, hardware, contracts, support coverage, documents, tasks, imports, reports, saved views and AI context.

**Backend requirements:** select/search/create APIs, duplicate-like match detection, normalization rules, uniqueness constraints, alias/synonym resolution, merge/deactivate workflows, and audit events for catalog changes.

**MVP priority:** High.

### Licenses

**Purpose:** Track software licenses, subscriptions, entitlements, expiration dates, ownership, value/cost, and renewal context.

**Main entities:** licenses.

**Key fields:** workspace id, client/department id, product id, brand id, provider/distributor id, quantity, entitlement metric, start date, expiration date, alert policy id, owner id, annual value, vendor cost, annual cost, notes, source status, source reference.

**Relationships:** linked to documents, tasks, contracts, support coverage, renewal packages, activity events, and imports.

**Backend requirements:** calculated status, days to expiration, margin, risk, missing evidence, and alert events.

**MVP priority:** Critical.

### Hardware

**Purpose:** Track physical assets, warranties, support coverage, serials, locations, ownership, and lifecycle dates.

**Main entities:** hardware_assets.

**Key fields:** workspace id, client/department id, brand id, product/model, serial number, type, provider id, purchase date, warranty end date, owner id, location, notes.

**Relationships:** linked to contracts, support coverage, documents, tasks, renewal packages, and activity.

**Backend requirements:** warranty expiration calculations, support coverage links, duplicate serial handling, and import support.

**MVP priority:** High.

### Contracts

**Purpose:** Track commercial agreements, legal/support obligations, notice periods, counterparties, dates, values, and evidence.

**Main entities:** contracts.

**Key fields:** workspace id, contract name, contract type, counterparty id, client/department id, start date, end date, renewal date, notice period, value/cost, owner id, approval status, notes.

**Relationships:** contracts can cover licenses, hardware, support coverage, packages, documents, tasks, and activity events.

**Backend requirements:** contract lifecycle, notice alerts, document evidence, and relationship graph.

**MVP priority:** Critical.

### Support Coverage

**Purpose:** Model support/warranty coverage as a related contract/coverage record, not as a text field inside License or Hardware.

**Main entities:** support_coverages or contracts with `contract_type = support_coverage`.

**Key fields:** covered record id/type, provider id, coverage type, start date, end date, SLA, support level, value/cost, owner id, alert policy id, notes.

**Relationships:** covers one license/hardware in MVP; may cover multiple records or packages later.

**Backend requirements:** coverage-to-record relationship, expiration alerts, evidence requirements, and activity events.

**MVP priority:** High.

### Renewal Packages / Deals / Bundles

**Purpose:** Group related licenses, hardware, contracts, documents, and tasks under one commercial or renewal package.

**Main entities:** renewal_packages, package_items.

**Key fields:** package reference, name, client/department id, brand id, provider/distributor id, PO/order reference, invoice reference, start date, expiration date, total value, owner id, alert policy id, status, notes.

**Relationships:** packages contain licenses, hardware, contracts, documents, and tasks.

**Backend requirements:** package import, package-level dashboarding, package relationships, and package activity.

**MVP priority:** Medium.

### Documents

**Purpose:** Track document metadata and evidence records.

**Main entities:** documents, file_objects, document_links, document_types, document_policies.

**Key fields:** document name, type, status, uploaded by, uploaded at, file object id, workspace id, validity dates, notes.

**Relationships:** documents can link to one record, multiple records, or a renewal package.

**Backend requirements:** secure metadata, file storage, document links, document policy evaluation, audit events, and access control.

**MVP priority:** Critical.

### Tasks

**Purpose:** Track operational work linked to records.

**Main entities:** tasks, task_links.

**Key fields:** title, description, status, priority, due date, assigned to, created by, source, impact, workspace id.

**Relationships:** tasks link to licenses, hardware, contracts, documents, clients/departments, packages, and imports.

**Backend requirements:** assignment, status changes, due dates, permissions, notifications, and activity events.

**MVP priority:** High.

### Relationships

**Purpose:** Store navigable typed links between records.

**Main entities:** relationships.

**Key fields:** source record type/id, target record type/id, relationship type, created by, created at, notes.

**Relationships:** every core record can link to other records.

**Backend requirements:** referential integrity, permission-aware traversal, activity events.

**MVP priority:** Critical.

### Activity / Audit Trail

**Purpose:** Provide durable, append-only enterprise auditability.

**Main entities:** activity_events.

**Key fields:** workspace id, actor id, event type, source record type/id, related record type/id, timestamp, metadata, before/after values where appropriate.

**Relationships:** activity events belong to records, imports, documents, tasks, relationships, and users.

**Backend requirements:** append-only storage, queryable timelines, permission-aware visibility.

**MVP priority:** Critical.

### Import Jobs

**Purpose:** Move upload, mapping, preview, validation, confirmation, and creation into a durable backend workflow.

**Main entities:** import_jobs, import_files, import_mappings, import_results, import_rows.

**Key fields:** file name, sheet name, detected source, selected target, mapping status, row counts, error counts, created record ids, actor id, timestamps.

**Relationships:** import jobs create canonical records and activity events.

**Backend requirements:** file upload, parsing, mapping approval, row staging, duplicate detection, confirmation, rollback/error reporting.

**MVP priority:** Critical.

### Alert Policies and Notifications

**Purpose:** Calculate and deliver expiration, renewal, evidence, approval, and task reminders.

**Main entities:** alert_policies, alert_events, notifications.

**Key fields:** policy name, reminder days, channels, status, due date, acknowledged by, acknowledged at.

**Relationships:** policies attach to records or workspaces; alert events create notifications and tasks.

**Backend requirements:** scheduled jobs, recalculation, notification delivery, acknowledgement, escalation.

**MVP priority:** High.

### Reports and Dashboards

**Purpose:** Provide leadership, finance, operations, compliance, and account management visibility.

**Main entities:** reporting queries, report definitions, saved report exports later.

**Key fields:** workspace id, report type, filters, generated by, generated at, export metadata.

**Relationships:** reports aggregate records, tasks, documents, imports, alerts, and activity.

**Backend requirements:** permission-aware aggregate queries, saved reports later, export audit.

**MVP priority:** High.

### Search and Saved Views

**Purpose:** Search records and preserve user table preferences.

**Main entities:** saved_views, saved_filters, search index later.

**Key fields:** user id, workspace id, module, columns, filters, sort, visibility, name.

**Relationships:** saved views belong to users or workspaces.

**Backend requirements:** saved preferences, indexed search, permission-aware filtering.

**MVP priority:** Medium.

### AI Knowledge and Retrieval

**Purpose:** Provide safe AI assistance grounded in product knowledge and permissioned workspace data.

**Main entities:** ai_knowledge_sources, ai_query_logs, retrieval permissions.

**Key fields:** source type, source version, workspace scope, user id, query, response metadata, cited sources, created at.

**Relationships:** AI queries may reference records, imports, documents, tasks, and knowledge documents.

**Backend requirements:** permission-aware retrieval, query logging, source governance, approval workflows for actions.

**MVP priority:** Medium.

### Custom Fields

**Purpose:** Allow workspace-specific extensions without corrupting the canonical model.

**Main entities:** custom_field_definitions, custom_field_values.

**Key fields:** workspace id, module, field name, type, required flag, options, value.

**Relationships:** values attach to canonical records.

**Backend requirements:** validation, query support, import mapping support, and reporting support.

**MVP priority:** Medium.

### Billing / Subscriptions later

**Purpose:** Manage commercial SaaS subscriptions for Opriva customers.

**Main entities:** billing_accounts, subscriptions, invoices later.

**Key fields:** plan, status, seats, billing contact, provider customer id.

**Relationships:** billing belongs to workspace/account.

**Backend requirements:** only after product/corporate MVP direction is clearer.

**MVP priority:** Low for corporate pilot; later for commercial launch.

## 6. Suggested Database Model — First Draft

This is a first draft. Names may change during final backend design.

| Table / Entity | Purpose | Key fields | Relationships |
|---|---|---|---|
| `workspaces` | Tenant/workspace container | id, name, operating_model, status, default_alert_policy_id, created_at | Owns nearly all records |
| `users` | User identity | id, email, name, auth_provider_id, status, created_at | Member of workspaces |
| `workspace_members` | User membership | id, workspace_id, user_id, role_id, status | Links users to roles/workspaces |
| `roles` | Workspace roles | id, workspace_id, name, description | Has permissions |
| `permissions` | Permission grants | id, role_id, resource, action, scope | Enforced by API |
| `clients_departments` | MSP clients or Internal IT departments | id, workspace_id, record_type, name, owner_id, contact fields, notes | Linked to records/packages |
| `vendors_providers` | Providers, distributors, resellers, suppliers | id, workspace_id, type, name, normalized_name, contact fields | Linked to records/imports |
| `brands` | Technology brands/manufacturers | id, workspace_id/global_scope, name, normalized_key, category, status | Linked to products/records |
| `products` | Product/catalog records | id, workspace_id, brand_id, name, normalized_key, product_type, default_term, entitlement_metric | Used by licenses/hardware |
| `catalog_aliases` | Alias/synonym values for catalogs | id, workspace_id, catalog_type, catalog_record_id, alias_value, normalized_alias | Resolves import/free-text variants |
| `catalog_change_events` | Catalog audit history | id, workspace_id, catalog_type, catalog_record_id, actor_id, event_type, metadata, created_at | Tracks create/merge/deactivate/alias changes |
| `licenses` | Software/subscription records | id, workspace_id, client_department_id, product_id, brand_id, provider_id, quantity, expiration_date, owner_id, values, alert_policy_id, notes | Linked to docs/tasks/contracts/packages |
| `hardware_assets` | Physical assets | id, workspace_id, client_department_id, brand_id, product_id, serial_number, warranty_end_date, owner_id, notes | Linked to docs/tasks/contracts/packages |
| `contracts` | Agreements and obligations | id, workspace_id, contract_type, counterparty_id, start_date, end_date, renewal_date, value, owner_id, approval_status | Linked to records/docs/tasks |
| `support_coverages` | Support/warranty coverage records | id, workspace_id, provider_id, covered_record_type, covered_record_id, start_date, end_date, support_level, alert_policy_id | Covers license/hardware in MVP |
| `renewal_packages` | Deal/package groupings | id, workspace_id, package_reference, name, client_department_id, total_value, owner_id, status | Contains package items |
| `package_items` | Package membership | id, package_id, record_type, record_id | Links package to records |
| `documents` | Document metadata | id, workspace_id, document_type_id, name, status, uploaded_by, file_object_id, notes | Linked through document_links |
| `document_links` | Document-to-record links | id, document_id, record_type, record_id, link_type | Allows multiple linked records |
| `document_types` | Document taxonomy | id, workspace_id, name, category, required_default | Used by policies/imports |
| `document_policies` | Required evidence policies | id, workspace_id, module, condition, required_document_type_id | Drives Missing Evidence |
| `tasks` | Operational tasks | id, workspace_id, title, status, priority, due_date, assigned_to, created_by, source, impact | Linked through task_links |
| `task_links` | Task-to-record links | id, task_id, record_type, record_id | Supports global and drawer tasks |
| `relationships` | Typed record links | id, workspace_id, source_type, source_id, target_type, target_id, relationship_type | Navigable graph |
| `activity_events` | Append-only audit events | id, workspace_id, actor_id, event_type, source_type, source_id, related_type, related_id, metadata, created_at | Record timelines/audit |
| `import_jobs` | Import workflow | id, workspace_id, status, detected_source, selected_target, created_by, created_at, completed_at | Owns files/mappings/results |
| `import_files` | Uploaded import files | id, import_job_id, file_object_id, file_name, sheet_count, checksum | Stored in object storage |
| `import_mappings` | Approved mappings | id, import_job_id, source_column, target_field, action, sample_value | Used to normalize rows |
| `import_results` | Import results | id, import_job_id, row_number, status, target_module, created_record_type, created_record_id, errors | Audit of outcomes |
| `alert_policies` | Alert rules | id, workspace_id, name, reminder_days, channels, is_default | Applies to records |
| `alert_events` | Generated alerts | id, workspace_id, record_type, record_id, alert_type, due_date, status | Creates notifications/tasks |
| `notifications` | User notifications | id, workspace_id, user_id, alert_event_id, channel, status, read_at | Delivery/acknowledgement |
| `saved_views` | Table preferences | id, workspace_id, user_id, module, name, columns, sort, visibility | Configure columns/saved views |
| `custom_field_definitions` | Custom field schema | id, workspace_id, module, name, type, options, required | Extends canonical model |
| `custom_field_values` | Custom values | id, field_definition_id, record_type, record_id, value | Values for custom fields |
| `ai_knowledge_sources` | AI knowledge index sources | id, workspace_id, source_type, source_ref, version, status | Retrieval context |
| `ai_query_logs` | AI usage log | id, workspace_id, user_id, query, response_summary, source_refs, created_at | Governance/audit |

## 7. API Areas

### Auth/session

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/session`
- `POST /auth/refresh`

### Workspace

- `GET /workspaces`
- `POST /workspaces`
- `GET /workspaces/:workspaceId`
- `PATCH /workspaces/:workspaceId`
- `GET /workspaces/:workspaceId/members`
- `POST /workspaces/:workspaceId/invitations`

### Records

- `GET /workspaces/:workspaceId/licenses`
- `POST /workspaces/:workspaceId/licenses`
- `GET /workspaces/:workspaceId/licenses/:id`
- `PATCH /workspaces/:workspaceId/licenses/:id`
- Equivalent CRUD for hardware, contracts, clients/departments, vendors/providers, brands, products, and renewal packages.

### Relationships

- `GET /workspaces/:workspaceId/records/:recordType/:recordId/relationships`
- `POST /workspaces/:workspaceId/relationships`
- `DELETE /workspaces/:workspaceId/relationships/:id`

### Documents

- `POST /workspaces/:workspaceId/documents/upload-url`
- `POST /workspaces/:workspaceId/documents`
- `GET /workspaces/:workspaceId/documents`
- `GET /workspaces/:workspaceId/documents/:id`
- `POST /workspaces/:workspaceId/documents/:id/links`
- `DELETE /workspaces/:workspaceId/document-links/:id`

### Tasks

- `GET /workspaces/:workspaceId/tasks`
- `POST /workspaces/:workspaceId/tasks`
- `PATCH /workspaces/:workspaceId/tasks/:id`
- `POST /workspaces/:workspaceId/tasks/:id/links`

### Import

- `POST /workspaces/:workspaceId/import-jobs`
- `POST /workspaces/:workspaceId/import-jobs/:id/files`
- `POST /workspaces/:workspaceId/import-jobs/:id/parse`
- `POST /workspaces/:workspaceId/import-jobs/:id/mappings`
- `POST /workspaces/:workspaceId/import-jobs/:id/preview`
- `POST /workspaces/:workspaceId/import-jobs/:id/confirm`
- `GET /workspaces/:workspaceId/import-jobs/:id/results`

### Alerts

- `GET /workspaces/:workspaceId/alert-policies`
- `POST /workspaces/:workspaceId/alert-policies`
- `GET /workspaces/:workspaceId/alert-events`
- `POST /workspaces/:workspaceId/alert-events/:id/acknowledge`

### Reports

- `GET /workspaces/:workspaceId/reports/dashboard`
- `GET /workspaces/:workspaceId/reports/renewal-exposure`
- `GET /workspaces/:workspaceId/reports/missing-evidence`
- `POST /workspaces/:workspaceId/reports/export`

### Search

- `GET /workspaces/:workspaceId/search`
- `GET /workspaces/:workspaceId/saved-views`
- `POST /workspaces/:workspaceId/saved-views`
- `GET /workspaces/:workspaceId/saved-filters`
- `POST /workspaces/:workspaceId/saved-filters`

### AI

- `POST /workspaces/:workspaceId/ai/query`
- `POST /workspaces/:workspaceId/ai/import-mapping-suggestion`
- `POST /workspaces/:workspaceId/ai/renewal-summary`
- `GET /workspaces/:workspaceId/ai/query-logs`

### Admin/settings

- `GET /workspaces/:workspaceId/settings`
- `PATCH /workspaces/:workspaceId/settings`
- `GET /workspaces/:workspaceId/roles`
- `POST /workspaces/:workspaceId/roles`
- `PATCH /workspaces/:workspaceId/roles/:id`

## 8. Import Backend Architecture

The current local import sandbox should migrate to a durable backend import workflow.

Backend import flow:

1. User uploads an Excel file.
2. Backend creates an `import_job`.
3. Backend stores the uploaded file as an `import_file`.
4. Worker parses workbook sheets and rows.
5. Backend detects source type where possible.
6. Backend suggests mappings from source columns to Opriva canonical fields.
7. User confirms or overrides import target.
8. User approves mappings.
9. User reviews and enriches normalized records.
10. User applies bulk defaults where appropriate.
11. Backend detects duplicates and required-field gaps.
12. Backend generates a preview.
13. User confirms import.
14. Backend creates canonical records.
15. Backend creates clients, vendors/providers, brands, and products if approved by the user or policy.
16. Backend creates relationships and package links where supported.
17. Backend writes activity/audit events.
18. Backend stores import results, warnings, errors, and created record ids.

Both import paths must be supported:

- AI-assisted mapping: flexible upload, mapping suggestions, user approval.
- Official Opriva Template: structure-aware parsing, reduced mapping, preview and confirmation.

Core rule:

Imported records must become first-class canonical records, not isolated spreadsheet rows.

Backend import requirements:

- Store original file metadata.
- Keep approved mappings.
- Keep row-level import results.
- Preserve errors and skipped rows.
- Track who approved the import.
- Support duplicate detection.
- Map controlled catalog fields to existing catalog records where possible.
- Flag similar catalog matches before creating new clients/departments, brands, products, providers, distributors, resellers/partners, owners, policies, document types, contract types, support coverage types, currencies or countries.
- Preserve catalog match decisions, aliases/synonyms and created catalog ids in import history.
- Support rollback strategy or correction workflow later.
- Never import every spreadsheet column blindly.
- Allow unmapped columns to be skipped, mapped to Notes, or mapped to a canonical/custom field.

## 9. Document Storage Architecture

Opriva documents require both metadata and secure file storage.

### Object storage

Files should be stored in an object storage provider such as Supabase Storage, S3-compatible storage, Firebase Storage, or another selected provider.

### Metadata database

The `documents` table stores document name, type, status, dates, uploader, workspace, and file object reference. The `file_objects` concept stores the physical storage key, content type, size, checksum, scan status, and access URL generation metadata.

### Document links to multiple records

The `document_links` table allows one document to be linked to one or many records, including licenses, hardware, contracts, support coverage, tasks, clients/departments, and renewal packages.

### Document policies

Document policies define which document types are required for a record type or condition. Missing Evidence should be calculated from those policies and linked documents.

### Missing evidence calculation

Missing Evidence is derived, not manually entered. It should evaluate:

- record type
- workspace mode
- required document policies
- linked documents
- document validity dates
- document status

### Access control

Document access must enforce workspace scope and permissions. Users should not receive storage URLs unless they have permission to view the document.

### Audit events

Upload, attach, detach, view/download, replace, delete, and policy changes should generate activity/audit events.

### Versioning later

Document versioning is valuable but not required for the first backend MVP. The basic MVP should support secure upload, metadata, links, access control, and audit events first.

## 10. Alert and Notification Architecture

Alerts should be generated by backend calculations and background jobs.

### Alert policies

Alert policies can exist at workspace default and record level. Examples:

- Workspace default
- 90 / 60 / 30 days
- 60 / 30 / 7 days
- 30 / 7 / 1 days
- Custom

### Expiration calculations

Backend should calculate:

- System Status
- Days to Expiration
- Alert Status
- Renewal window
- Notice period risk
- Missing owner risk
- Missing evidence risk

### Background scheduler

A scheduled worker should recalculate upcoming expirations, warranties, contracts, support coverage, tasks, and document policy gaps.

### Notification delivery

Initial MVP can support in-app notifications. Email can follow. WhatsApp or other channels are later.

### Escalations

Escalations should support conditions such as unassigned owner, high-value record, critical department/client, approaching expiration, or missing evidence.

### Acknowledgements

Users should be able to acknowledge alerts, which should be recorded as audit events.

### Optional task generation

Task generation from alerts should be user- or policy-controlled. Opriva should not create operational tasks silently without clear rules.

## 11. Activity / Audit Trail Architecture

Activity must become a persistent append-only audit trail.

Core event fields:

- workspace id
- actor id
- event type
- source record type
- source record id
- related record type
- related record id
- timestamp
- structured metadata
- before/after metadata where appropriate

Important event types:

- record created
- record edited
- record deleted or archived
- document uploaded
- document attached
- document detached
- support coverage added
- task created
- task assigned
- task completed
- import started
- import mapped
- import confirmed
- import completed
- relationship linked
- relationship removed
- status recalculated
- alert generated
- alert acknowledged
- AI query executed
- AI suggestion accepted

Audit data should be immutable or append-only. Corrections should create new events rather than overwriting the audit trail.

## 12. AI Architecture

AI in Opriva should be permission-aware, explainable, and approval-based.

### Permission boundaries

AI must not access records, documents, imports, tasks, reports, or knowledge outside the user's workspace and permissions.

### Product knowledge base

Static product guidance such as `MEMORY.md`, `USER_GUIDE.md`, import specs, and policy docs can become AI knowledge sources.

### Workspace data retrieval

AI retrieval should query only allowed workspace records. Retrieval should respect module permissions, document access rules, and record-level visibility if introduced later.

### Import mapping assistant

AI can suggest source detection, import target, column mappings, field enrichment, duplicate risk, and data cleanup recommendations. User approval remains required.

### Risk explanations

AI can explain renewal risk, missing evidence, provider concentration, owner gaps, approval blockers, and margin exposure based on backend-calculated data.

### Renewal summaries

AI can summarize upcoming renewals by client, department, owner, provider, brand, value, and risk.

### Query logs

AI queries should be logged with user, workspace, timestamp, high-level source references, and action outcomes.

### Approval required before AI actions

AI should not create, edit, delete, import, assign, or notify without explicit user approval and permission checks.

## 13. Workspace Mode Implications

### MSP / Integrator mode

**Ownership meaning:** Ownership usually means account owner, renewal owner, commercial owner, or operations owner for a client account.

**Financial fields:** Annual Value, Vendor Cost, Margin, Margin %, and commercial exposure are central.

**Client vs Department logic:** Client is the primary customer entity. Departments may exist as client-side metadata later, but they are not the primary ownership entity.

**Vendor/provider logic:** Brand is the manufacturer. Distributor is the upstream supplier. Provider/reseller/partner may represent the service or delivery partner depending on workflow.

**Reports and dashboards:** Should focus on client renewal exposure, margin at risk, distributor quote blockers, owner gaps, high-value renewals, and follow-up urgency.

**Support Coverage behavior:** Support coverage may be sold to clients, sourced from a distributor/provider, and linked to licenses or hardware. It should support commercial renewal tracking.

### Internal IT mode

**Ownership meaning:** Ownership usually means IT Owner, Budget Owner, department owner, or approval owner.

**Financial fields:** Annual Cost, Cost Center, Budget Owner, Approval Status, and business criticality are central.

**Client vs Department logic:** Department is the primary ownership entity. Client language should not be used.

**Vendor/provider logic:** Brand is the technology manufacturer. Provider is the supplier, reseller, service provider, or implementer used by the organization.

**Reports and dashboards:** Should focus on department exposure, provider dependency, budget impact, approval blockers, operational continuity, missing evidence, and critical expirations.

**Support Coverage behavior:** Support coverage protects internal continuity and should link to licenses, hardware, contracts, departments, and evidence documents.

## 14. Migration From Local Sandbox

### `RECORD_STORE` to database tables

The current `RECORD_STORE` should map to backend tables:

- `licenses` -> `licenses`
- `hardware` -> `hardware_assets`
- `contracts` -> `contracts` and `support_coverages`
- `clients` -> `clients_departments`
- `documents` -> `documents`, `file_objects`, `document_links`
- `tasks` -> `tasks`, `task_links`
- `activity` -> `activity_events`

### Mock data to demo seed data

Mock arrays should become optional demo seed data. Demo seed data should be clearly separated from real workspace data.

### Local import records to import jobs

Local import state should become `import_jobs`, `import_files`, `import_mappings`, `import_results`, and canonical records created after confirmation.

### Local activity to audit events

Local activity entries should become append-only `activity_events`.

### Local documents to storage

Local file picker behavior should become upload endpoints, object storage, file metadata, secure URL generation, and document links.

### Local tasks to backend tasks

Drawer and global tasks should create persistent `tasks` linked through `task_links`.

### Local relationships to relationship table

Navigable relationships should become typed rows in `relationships`.

## 15. MVP Backend Implementation Phases

### Phase 1: Backend foundation

**Goal:** Establish secure workspace-backed backend foundation.

**Scope:**

- Auth/session
- Workspaces
- Users
- Workspace memberships
- Roles and permissions
- Base API structure
- Audit event writer foundation

**Not included:**

- Full import engine
- Full document storage
- AI retrieval
- Advanced reports

**Validation criteria:**

- Users can log in.
- Users can access only their workspace.
- Role checks are enforced server-side.
- Basic audit events can be written.

### Phase 2: Core records and relationships

**Goal:** Persist canonical Opriva records.

**Scope:**

- Clients/departments
- Brands
- Vendors/providers
- Products
- Licenses
- Hardware
- Contracts
- Support Coverage
- Relationships
- Tasks basics

**Not included:**

- Real file storage
- Complex import jobs
- Advanced alerts

**Validation criteria:**

- Records persist after refresh.
- Records can be created, edited, opened, and linked.
- Relationships are navigable and permission-aware.

### Phase 3: Documents and storage

**Goal:** Support real document evidence.

**Scope:**

- Object storage
- Document metadata
- Document links
- Document types
- Document policies basics
- Secure download URLs
- Document audit events

**Not included:**

- Versioning
- Advanced retention
- Advanced DLP

**Validation criteria:**

- Users can upload and link documents securely.
- Unauthorized users cannot access documents.
- Missing Evidence can be calculated from policies and links.

### Phase 4: Import engine

**Goal:** Move import from sandbox to durable backend jobs.

**Scope:**

- Import jobs
- Import files
- Workbook parsing
- Source detection
- Mapping suggestions
- Target confirmation
- Mapping approval
- Review/enrichment
- Bulk defaults
- Duplicate checks
- Confirmation
- Canonical record creation
- Import results/audit

**Not included:**

- PDF parsing unless explicitly selected.
- Autonomous AI imports.

**Validation criteria:**

- Uploaded files are stored.
- Imports have durable job history.
- Approved imports create canonical records.
- Errors and skipped rows are visible.

### Phase 5: Alerts, tasks and audit

**Goal:** Make operational execution reliable.

**Scope:**

- Alert policies
- Scheduled expiration checks
- Alert events
- In-app notifications
- Task generation rules
- Persistent audit timelines

**Not included:**

- Complex external notification channels unless approved.

**Validation criteria:**

- Upcoming expirations generate alerts.
- Alerts can be acknowledged.
- Tasks and activity persist and remain linked.

### Phase 6: Reports, search and AI

**Goal:** Add scalable intelligence and retrieval.

**Scope:**

- Dashboard/report APIs
- Search/indexing
- Saved views
- Saved filters
- AI knowledge sources
- Permission-aware AI retrieval
- AI query logs

**Not included:**

- Autonomous AI actions.
- Advanced BI warehouse unless needed.

**Validation criteria:**

- Reports reflect real persisted data.
- Search respects permissions.
- AI answers only from allowed context.

### Phase 7: Hardening for corporate pilot

**Goal:** Prepare for real corporate pilot testing.

**Scope:**

- Security review
- Data retention rules
- Backup and restore
- Monitoring/logging
- Error handling
- Access review
- Import/file handling policies
- Pilot onboarding checklist

**Not included:**

- Broad enterprise customization beyond pilot needs.

**Validation criteria:**

- Real customer pilot can run without committing files to GitHub.
- Users, roles, records, imports, documents, audit, and alerts are reliable.
- Security boundaries are documented and tested.

## 16. Security Requirements

### Authentication

All corporate MVP users must authenticate. Anonymous access to workspace data is not acceptable.

### Workspace isolation

Every query, mutation, file operation, import job, notification, report, AI retrieval, and saved view must be scoped to a workspace.

### RBAC

Role-based access control must be enforced server-side. Frontend hiding is not security.

### Document access

Document URLs must be permission-checked and time-limited where possible. File metadata and downloads must be audited.

### Secure file handling

The backend should validate file size, extension, content type, checksum, and storage path. Virus scanning can follow after the basic MVP but should be planned.

### Audit logs

Important actions must write audit events. Audit events should be append-only.

### Import file handling

Import files may contain sensitive customer data. They must be stored securely, scoped to workspace, and retained according to policy.

### AI permission boundaries

AI must use permission-aware retrieval and should log queries. AI must not leak data across workspaces.

### No real client files in GitHub

Real client Excel files, PDFs, quotes, invoices, contracts, credentials, or private data must never be committed. `private-samples/` remains for local real test files and must remain ignored. `sample-data/` may contain demo or anonymized data only.

## 17. Open Decisions

These decisions are not finalized:

- Backend stack.
- Auth provider.
- Storage provider.
- Database hosting.
- API framework.
- AI retrieval architecture.
- Billing provider.
- Email/notification provider.
- Search/indexing approach.
- Whether Support Coverage is a separate table or specialized contract type in MVP.
- Whether clients and departments share one table or use separate tables with a shared interface.
- Whether reports use direct SQL queries, materialized views, or a later analytics layer.
- Import rollback/correction strategy.
- File retention policy.
- Corporate pilot hosting environment.

## 18. Risks

| Risk | Severity | Why it matters | Mitigation |
|---|---|---|---|
| Continuing frontend-only features too long | High | Increases migration complexity and false MVP confidence | Prioritize backend plan and canonical data model |
| No auth/tenant isolation | Critical | Blocks real customer use | Implement backend foundation first |
| No secure document storage | Critical | Documents are sensitive evidence | Add object storage, metadata, links, permissions |
| Import without durable history | High | Corporate imports need traceability and error review | Build import jobs, files, mappings, results |
| Mixed mock/local data | Medium | Can confuse testing and reporting | Make mock data explicit demo seed data |
| `App.jsx` monolith | High | High regression risk during backend migration | Extract modules gradually after plan approval |
| AI without permission boundaries | Critical | Risk of cross-workspace data leakage | Add permission-aware retrieval and query logs |
| Calculated fields stored manually | Medium | Data can become inconsistent | Calculate status, margin, risk, missing evidence server-side |
| Weak duplicate detection | Medium | Imports can pollute customer data | Add duplicate keys and review workflow |
| No audit trail | Critical | Enterprise accountability gap | Append-only activity events |
| No alert scheduler | High | Expiration intelligence is incomplete | Add background jobs and notification events |
| Real files committed accidentally | Critical | Data exposure risk | Keep private-samples ignored and enforce file policy |

## 19. Next Recommended Actions

1. Review and approve backend architecture direction.
2. Create `CANONICAL_DATA_MODEL_SPEC.md`.
3. Create `IMPORT_BACKEND_SPEC.md`.
4. Create `DOCUMENT_STORAGE_SPEC.md`.
5. Create `AUTH_RBAC_SPEC.md`.
6. Choose backend stack.
7. Create backend implementation roadmap.

Recommended order:

1. Approve this plan.
2. Define canonical data model.
3. Define auth/RBAC and workspace isolation.
4. Define document storage and import backend details.
5. Select stack.
6. Start backend foundation implementation.

## 20. Final Recommendation

Opriva should not continue adding unlimited frontend-only features without this backend plan. The local sandbox has achieved enough validation to justify planning the backend foundation before corporate MVP testing.

The next major milestone should be backend architecture approval, canonical data model definition, and backend foundation planning. This will allow Opriva to preserve the validated product direction while moving toward persistent, secure, permission-aware, corporate-testable infrastructure.
