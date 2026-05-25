# CANONICAL DATA MODEL SPEC — Opriva

## 1. Purpose

Opriva must be model-driven, not spreadsheet-driven.

This document defines Opriva's canonical entities, fields, relationships, calculated fields, import behavior and workspace-mode differences. It should guide future UI, import, dashboard, reporting, backend and AI work.

The current local/sandbox app validates product behavior through `RECORD_STORE`, mock/demo seed data, local import flows and record drawer interactions. The future backend must persist the same canonical model rather than preserving arbitrary spreadsheet columns or frontend-only row shapes.

## 2. Core Principles

- Canonical records are the source of truth.
- Imported Excel rows must become canonical records after user approval.
- Imported records must not remain isolated spreadsheet rows.
- Mock data should only be demo seed data.
- Calculated fields must not be manual fields.
- Support Coverage is a related contract/coverage record, not a text field inside License or Hardware.
- Tasks are operational entities linked to records, not a simple Next Action field.
- Activity is audit trail.
- Relationships are first-class, typed and navigable.
- MSP / Integrator and Internal IT must both be supported without mixing terminology.
- Custom fields may extend the model but must not replace canonical fields.
- AI can suggest mappings and actions, but users approve.
- Backend persistence, auth, permissions and audit are required before corporate MVP.

## 3. Workspace Modes

Opriva supports multiple workspace modes, but the two primary models are MSP / Integrator and Internal IT.

### MSP / Integrator

MSP / Integrator represents a provider, reseller or integrator managing renewals and assets for external clients.

| Concept | MSP / Integrator meaning |
|---|---|
| Client vs Department | Client is the primary ownership entity. |
| Account owner vs Internal owner | Renewal Owner or Account Owner owns commercial follow-up. |
| Sale price vs Internal cost | Sale Price / Annual Value is customer-facing revenue. |
| Margin vs Budget impact | Margin is calculated from Sale Price / Annual Value minus Vendor Cost. |
| Provider / Distributor / Vendor | Brand is the manufacturer; Distributor is upstream supplier; Provider/Reseller/Partner can represent delivery or sales channel. |
| Support Coverage | Coverage can be sold to clients, sourced through a provider/distributor and linked to licenses or hardware. |
| Reports and dashboards | Focus on client renewal exposure, margin risk, distributor blockers, owner gaps and follow-up urgency. |

### Internal IT

Internal IT represents an organization managing its own internal technology estate.

| Concept | Internal IT meaning |
|---|---|
| Client vs Department | Department is the primary ownership entity. |
| Account owner vs Internal owner | IT Owner / Budget Owner owns renewal, approval or operational responsibility. |
| Sale price vs Internal cost | Annual Cost is spend or budget impact. |
| Margin vs Budget impact | Margin is not relevant; cost center, approval and business criticality matter. |
| Provider / Distributor / Vendor | Brand is the manufacturer; Provider is supplier, reseller, implementer or service provider. |
| Support Coverage | Coverage protects operational continuity, SLA, warranty or support obligations. |
| Reports and dashboards | Focus on department exposure, provider dependency, approval blockers, missing evidence, budget impact and continuity risk. |

## 4. Canonical Entities

### Workspace

**Purpose:** Tenant and configuration boundary for all Opriva data.

**Required fields:** Name, operating model, status.

**Optional fields:** Locale, default alert policy, enabled modules, branding, settings.

**Calculated fields:** Record counts, risk summaries, renewal exposure, usage metrics.

**Relationships:** Has users, members, roles, records, imports, documents, tasks, activity events and settings.

**Workspace-mode notes:** Operating model determines terminology and default field behavior.

**Import mapping notes:** Imports must always resolve into a workspace.

**Backend requirements:** Tenant isolation, workspace-scoped permissions, settings persistence.

### User

**Purpose:** Authenticated person using Opriva.

**Required fields:** Email, display name, status.

**Optional fields:** Avatar, job title, phone, locale, notification preferences.

**Calculated fields:** Last active, open tasks count, assigned risk exposure.

**Relationships:** Has workspace memberships, owns records/tasks, uploads documents, performs activity events.

**Workspace-mode notes:** Same user can belong to multiple workspaces with different modes.

**Import mapping notes:** Imported owner names may match or create pending user references later.

**Backend requirements:** Auth identity, session management, user status and audit identity.

### Workspace Member

**Purpose:** Connects a user to a workspace and role.

**Required fields:** Workspace, user, role, status.

**Optional fields:** Invitation metadata, joined date, team.

**Calculated fields:** Effective permissions.

**Relationships:** Belongs to workspace, user and role.

**Workspace-mode notes:** Permissions may vary by workspace mode and module visibility.

**Import mapping notes:** Imported owner names should map to members when possible.

**Backend requirements:** Role enforcement, membership lifecycle, invitation handling.

### Client / Department

**Purpose:** Primary ownership entity for records.

**Required fields:** Record type, name.

**Optional fields:** Country, contact name, contact email, owner, business unit, cost center, notes.

**Calculated fields:** Renewal exposure, open tasks, missing evidence count, upcoming expirations.

**Relationships:** Has many licenses, hardware assets, contracts, support coverages, documents, tasks, packages and activity events.

**Workspace-mode notes:** MSP uses Client. Internal IT uses Department.

**Import mapping notes:** Source columns may include Customer, Customer Name, Cliente, Client, Department or Departamento.

**Backend requirements:** Workspace-scoped deduplication, ownership, relationships and reporting rollups.

### Contact

**Purpose:** Person associated with a client, department, provider, distributor or partner.

**Required fields:** Name, related entity.

**Optional fields:** Email, phone, role, notes, primary flag.

**Calculated fields:** None initially.

**Relationships:** Belongs to client/department or vendor/provider/distributor/reseller.

**Workspace-mode notes:** MSP contacts may be client stakeholders; Internal IT contacts may be department approvers or provider contacts.

**Import mapping notes:** Contact fields may appear in client/department sheets or vendor files.

**Backend requirements:** Permissioned contact storage and future CRM-style linking.

### Vendor / Provider

**Purpose:** Supplier, provider, implementer or vendor entity.

**Required fields:** Name, type.

**Optional fields:** Country, contact info, normalized name, website, notes.

**Calculated fields:** Provider concentration, coverage exposure, renewal exposure.

**Relationships:** Supplies products, contracts, support coverage, documents and packages.

**Workspace-mode notes:** Internal IT primarily uses Provider. MSP may use Provider for service/delivery partner but Distributor for upstream supply.

**Import mapping notes:** Source columns may include Provider, Partner, Vendor, Supplier or reseller-style labels.

**Backend requirements:** Normalization, deduplication, permissioned records and reporting links.

### Distributor

**Purpose:** Upstream supplier or wholesaler in MSP / Integrator mode.

**Required fields:** Name.

**Optional fields:** Contact info, country, normalized name, account owner, notes.

**Calculated fields:** Quote blocker counts, distributor dependency, margin exposure by distributor.

**Relationships:** Linked to licenses, contracts, support coverage, packages and documents.

**Workspace-mode notes:** Distributor is MSP-specific. Internal IT should use Provider instead.

**Import mapping notes:** Source columns may include Distributor, Distribuidor, Upstream Supplier or wholesaler names.

**Backend requirements:** May share storage with vendors/providers using a type field, but UI terminology must stay workspace-correct.

### Reseller / Partner

**Purpose:** Intermediate sales, delivery or partner entity when distinct from provider/distributor.

**Required fields:** Name.

**Optional fields:** Type, contact details, country, notes.

**Calculated fields:** Partner exposure, relationship counts.

**Relationships:** May be linked to imported licenses, renewal packages, contracts and documents.

**Workspace-mode notes:** More common in MSP/import contexts, but can appear in Internal IT procurement chains.

**Import mapping notes:** Source columns may include Reseller, Partner, OC Partner or channel partner.

**Backend requirements:** Normalization and optional linkage to vendor/provider table.

### Brand / Manufacturer

**Purpose:** Technology brand or manufacturer.

**Required fields:** Name.

**Optional fields:** Category, normalized name, website, notes.

**Calculated fields:** Brand exposure, upcoming renewals, missing evidence by brand.

**Relationships:** Owns products; linked to licenses, hardware, contracts and packages.

**Workspace-mode notes:** Brand is used in both MSP and Internal IT.

**Import mapping notes:** Source columns may include Brand, Manufacturer, Vendor Name, Offer Brand or inferred product brand.

**Backend requirements:** Normalized catalog and deduplication.

### Product / SKU

**Purpose:** Product, license, subscription, support plan, SKU or hardware model.

**Required fields:** Name, product type.

**Optional fields:** Brand, SKU, entitlement metric, default term, default provider/distributor, category, notes.

**Calculated fields:** Product exposure, renewal counts, margin/cost rollups.

**Relationships:** Belongs to brand; used by licenses, hardware, contracts and packages.

**Workspace-mode notes:** MSP products may drive value/margin. Internal IT products drive cost/criticality.

**Import mapping notes:** Source columns may include Product, Offer Name, Offer Friendly Name, License, Licencia or product/service names.

**Backend requirements:** Catalog-backed forms, import normalization and product autofill.

### License

**Purpose:** Track software licenses, subscriptions and entitlements.

**Required fields:** License / Product, Client / Department, Expiration / Renewal Date, Owner, Alert Policy.

**Optional fields:** Brand, Provider / Distributor, Reseller / Partner, Quantity / Seats, Entitlement Metric, Start Date, License Term, Annual Value / Annual Cost, Vendor Cost, Contract Number, PO / Order Reference, Source Status / Vendor Status, Source Reference, Notes.

**Calculated fields:** System Status, Days to Expiration, Alert Status, Risk, Margin, Missing Evidence.

**Relationships:** Belongs to client/department; references product/brand/provider/distributor; may have support coverage, contracts, documents, tasks, package links, relationships and activity.

**Workspace-mode notes:** MSP uses Annual Value, Vendor Cost and Margin. Internal IT uses Annual Cost, Cost Center, Approval Status and Business Criticality.

**Import mapping notes:** License imports must map source rows to canonical license fields and skip calculated fields.

**Backend requirements:** Persistent records, calculated status, relationship support, document links, alert generation and import traceability.

### Hardware Asset

**Purpose:** Track physical IT assets, warranty dates and support context.

**Required fields:** Asset Name, Client / Department.

**Optional fields:** Asset Type, Brand, Product/Model, Serial Number, Provider, Purchase Date, Warranty End Date, Owner / Custodian, Location, Asset Value, Alert Policy, Notes.

**Calculated fields:** System Status, Days to Expiration, Alert Status, Risk, Missing Evidence.

**Relationships:** Belongs to client/department; linked to brand/product/provider; may have support coverage, contracts, documents, tasks, packages and activity.

**Workspace-mode notes:** MSP hardware may be sold/managed for clients. Internal IT hardware belongs to departments and locations.

**Import mapping notes:** Hardware imports may come from sales exports, serial registers or warranty exports. Components may need review.

**Backend requirements:** Serial deduplication, warranty tracking, support coverage links, document evidence and alerting.

### Contract

**Purpose:** Track commercial agreements, legal obligations, renewals, approvals and support contracts.

**Required fields:** Contract / Coverage Name, Contract Type, Client / Department, End Date.

**Optional fields:** Contract Reference, Package Reference, Provider, Counterparty, Coverage Type, Start Date, Notice Period, Owner, Alert Policy, Annual Value / Annual Cost, Approval Status, Notes.

**Calculated fields:** System Status, Days to Expiration, Alert Status, Notice Risk, Missing Evidence.

**Relationships:** May cover licenses, hardware, support coverage, packages and documents; has tasks and activity.

**Workspace-mode notes:** MSP contracts may represent client/provider commercial agreements. Internal IT contracts represent internal obligations, approvals and provider exposure.

**Import mapping notes:** Contract imports must preserve contract number, support coverage type and covered record reference when available.

**Backend requirements:** Contract lifecycle, relationship graph, notice alerts and evidence policies.

### Support Coverage

**Purpose:** Model support, SLA, warranty extension or maintenance coverage as its own related coverage record.

**Required fields:** Coverage Name, Covered Record, Coverage Type, Provider, Coverage End Date.

**Optional fields:** Start Date, Support Level, SLA, Owner, Alert Policy, Annual Value / Annual Cost, Notes.

**Calculated fields:** System Status, Days to Expiration, Alert Status, Coverage Risk, Missing Evidence.

**Relationships:** Covers a license or hardware asset in MVP; may cover multiple records/packages later; linked to contract, documents, tasks and activity.

**Workspace-mode notes:** MSP coverage can be sold to clients. Internal IT coverage protects operational continuity.

**Import mapping notes:** Official template uses Contracts / Support Coverage sheet with Covered Record Reference.

**Backend requirements:** Persistent coverage table or specialized contract type, typed relationship to covered records and alert logic.

### Renewal Package / Deal / Bundle

**Purpose:** Group licenses, hardware, contracts, documents, POs, invoices and tasks under one renewal or commercial package.

**Required fields:** Package Reference, Package Name, Client / Department.

**Optional fields:** Brand / Vendor, Provider / Distributor, PO / Order Reference, Invoice Reference, Start Date, Expiration / Renewal Date, Total Value, Owner, Alert Policy, Notes.

**Calculated fields:** Package Status, total exposure, margin, missing evidence, task completion, risk.

**Relationships:** Has many package items; links to licenses, hardware, contracts, documents, tasks and activity.

**Workspace-mode notes:** MSP packages represent client deals/renewals. Internal IT packages may represent procurement bundles or renewal cycles.

**Import mapping notes:** Package imports can preview package records even if full package modeling is deferred.

**Backend requirements:** Package table, package item links, rollups, import support and reporting.

### Document

**Purpose:** Store document metadata and evidence context.

**Required fields:** Document Name, Document Type.

**Optional fields:** Document Reference, File Name, Uploaded By, Valid From, Valid Until, Status, Notes.

**Calculated fields:** Validity Status, Missing Evidence contribution, expiration/retention flags.

**Relationships:** Linked to one or many records through Document Link; belongs to file object in backend; has activity events.

**Workspace-mode notes:** MSP documents include quotes, client proposals, POs, invoices and entitlements. Internal IT documents include approvals, contracts, evidence and compliance documents.

**Import mapping notes:** Template imports document metadata only. Actual files require upload.

**Backend requirements:** Secure file storage, metadata, access control, document links, audit events and policies.

### Document Link

**Purpose:** Link documents to records or packages.

**Required fields:** Document, linked record type, linked record id.

**Optional fields:** Link type, notes, created by.

**Calculated fields:** None initially.

**Relationships:** Connects a document to licenses, hardware, contracts, support coverage, packages, clients/departments or tasks.

**Workspace-mode notes:** Same model for both workspace modes.

**Import mapping notes:** Uses Linked Record Reference and Package Reference.

**Backend requirements:** Permission-aware relationship and audit events.

### Task

**Purpose:** Operational work item linked to records.

**Required fields:** Task Title, linked record, owner or assignee.

**Optional fields:** Task Type, Due Date, Priority, Status, Source, Impact, Notes.

**Calculated fields:** Overdue status, SLA status, escalation status.

**Relationships:** Must link to at least one record; can link to packages, imports, documents and activity events.

**Workspace-mode notes:** MSP tasks focus on quotes, owners, client follow-up and commercial action. Internal IT tasks focus on approvals, budget owners, evidence and provider follow-up.

**Import mapping notes:** Task imports use Linked Record Reference when available.

**Backend requirements:** Persistent tasks, assignments, due dates, notifications and audit events.

### Relationship

**Purpose:** Typed navigable connection between two records.

**Required fields:** Source record, target record, relationship type.

**Optional fields:** Notes, created by.

**Calculated fields:** Relationship counts, coverage completeness.

**Relationships:** Connects any supported canonical records.

**Workspace-mode notes:** Same model, different terminology.

**Import mapping notes:** Relationships can be created from package references, covered record references and linked record references.

**Backend requirements:** Referential integrity, permission-aware traversal and activity events.

### Activity Event

**Purpose:** System-generated audit event.

**Required fields:** Workspace, event type, actor, timestamp.

**Optional fields:** Source record, related record, metadata, before/after values.

**Calculated fields:** None; it is generated from system actions.

**Relationships:** Belongs to workspace, actor and source/related records.

**Workspace-mode notes:** Same event model; messages should use workspace terminology.

**Import mapping notes:** Imports create events for import started, mapping approved, import completed and record created.

**Backend requirements:** Append-only persistent audit trail.

### Import Job

**Purpose:** Durable workflow for file import.

**Required fields:** Workspace, file, status, created by.

**Optional fields:** Detected source, selected target, sheet name, row counts, warnings, completed at.

**Calculated fields:** Valid row count, skipped count, duplicate risk count, created record count.

**Relationships:** Has files, mappings, results, created records and activity events.

**Workspace-mode notes:** Mapping and validation depend on workspace mode.

**Import mapping notes:** This is the parent of import mapping and results.

**Backend requirements:** File storage, row staging, mapping approval, preview, confirmation, audit and error history.

### Import Mapping

**Purpose:** Approved mapping from source columns to canonical fields.

**Required fields:** Import job, source column, target field, action.

**Optional fields:** Sample value, confidence, user override flag, notes.

**Calculated fields:** Mapping confidence and validation warnings.

**Relationships:** Belongs to import job.

**Workspace-mode notes:** Same source column may map differently by mode and target.

**Import mapping notes:** Actions include Import, Skip, Review and Calculated by Opriva.

**Backend requirements:** Persistent mapping approval and auditability.

### Alert Policy

**Purpose:** Define reminder timing and alert behavior.

**Required fields:** Name, reminder days.

**Optional fields:** Channels, default flag, workspace scope, active flag.

**Calculated fields:** Next alert date per record.

**Relationships:** Applies to workspace and records.

**Workspace-mode notes:** Same policy structure; alert messages differ by mode.

**Import mapping notes:** Source values may map to Workspace default, 90/60/30, 60/30/7, 30/7/1 or Custom.

**Backend requirements:** Scheduler integration and notification generation.

### Alert Event

**Purpose:** Generated alert instance for a record.

**Required fields:** Record, alert type, due date, status.

**Optional fields:** Acknowledged by, acknowledged at, escalation level.

**Calculated fields:** Severity and urgency.

**Relationships:** Belongs to record, user/workspace and notifications.

**Workspace-mode notes:** MSP alerts may focus on client and margin; Internal IT alerts may focus on department, approval and continuity.

**Import mapping notes:** Not imported manually.

**Backend requirements:** Generated by scheduler, persisted and audited.

### Notification

**Purpose:** Deliver alert/task/report events to users.

**Required fields:** User, workspace, message, status.

**Optional fields:** Channel, related alert, related task, read at.

**Calculated fields:** Unread counts.

**Relationships:** Belongs to user and may link to alerts/tasks/records.

**Workspace-mode notes:** Same model.

**Import mapping notes:** Not imported manually.

**Backend requirements:** Delivery, acknowledgement and audit.

### Saved View

**Purpose:** Persist table columns, filters, sort and layout preferences.

**Required fields:** Workspace, module, name, owner.

**Optional fields:** Columns, sort, filters, visibility, default flag.

**Calculated fields:** None.

**Relationships:** Belongs to user or workspace.

**Workspace-mode notes:** Default views differ by mode.

**Import mapping notes:** Not imported in MVP.

**Backend requirements:** User/workspace preferences and permission-aware sharing.

### Custom Field Definition

**Purpose:** Define workspace-specific extensions to canonical modules.

**Required fields:** Workspace, module, field name, field type.

**Optional fields:** Options, required flag, help text, display order.

**Calculated fields:** None.

**Relationships:** Has custom field values.

**Workspace-mode notes:** Custom fields may differ by mode but should not replace canonical model fields.

**Import mapping notes:** Official template custom fields sheet can map values to definitions.

**Backend requirements:** Validation, display and query support.

### Custom Field Value

**Purpose:** Store a custom field value for a specific record.

**Required fields:** Custom field definition, record, value.

**Optional fields:** Source, notes.

**Calculated fields:** None.

**Relationships:** Belongs to custom field definition and record.

**Workspace-mode notes:** Same model.

**Import mapping notes:** Imported through Custom Fields sheet or mapped as custom field when approved.

**Backend requirements:** Permissioned storage and reporting/search support.

### AI Knowledge Source

**Purpose:** Govern product/workspace knowledge available to AI.

**Required fields:** Source type, source reference, workspace scope, status.

**Optional fields:** Version, indexed at, owner, notes.

**Calculated fields:** Embedding/index metadata later.

**Relationships:** May reference docs, records, import specs, policies or product docs.

**Workspace-mode notes:** AI responses must use current workspace terminology.

**Import mapping notes:** Import mapping documents can be AI knowledge sources.

**Backend requirements:** Permission-aware retrieval and query logging.

## 5. Field Classification

### User-entered fields

These fields are directly entered or selected by users:

- Name fields
- Client / Department
- Product / License
- Provider / Distributor
- Quantity / Seats
- Expiration / Renewal Date
- Owner
- Alert Policy
- Contract Type
- Document Type
- Task Title
- Due Date
- Priority
- Notes

### Imported fields

These fields may arrive from Excel or another source and are mapped into canonical fields:

- Client / Department
- Product / License Name
- Brand / Manufacturer
- Provider / Distributor
- Reseller / Partner
- Quantity / Seats
- Start Date
- Expiration / Renewal Date
- Contract Number
- PO / Order Reference
- Source Status / Vendor Status
- Serial Number
- Warranty End Date
- Annual Value / Annual Cost
- Vendor Cost
- Invoice Date / Billing Reference
- Notes

### Derived/calculated fields

These are calculated or derived, not manual:

- Status
- Days to Expiration
- Risk
- Margin
- Renewal Stage
- Missing Evidence
- Alert Status
- System Status
- Notice Risk
- Coverage Risk
- Validity Status
- Overdue Status

### System-generated fields

These are generated by Opriva:

- Record id
- Created at
- Updated at
- Created by
- Updated by
- Imported at
- Import job id
- Activity event id
- File object id
- Relationship id
- Document link id

### Backend-only fields

These fields should exist in the backend but should not be edited directly by normal users:

- Workspace id
- Tenant scope
- Permission metadata
- Auth provider id
- Storage object key
- File checksum
- Audit metadata
- AI query log metadata
- Import processing status
- Background job ids

## 6. Key Relationships

- Client/Department has many Licenses.
- Client/Department has many Hardware Assets.
- Client/Department has many Contracts.
- Client/Department has many Renewal Packages.
- Vendor/Provider supplies Products.
- Distributor supplies Products or renewals in MSP / Integrator mode.
- Brand/Manufacturer owns Products.
- Product may appear in many Licenses.
- License may have Support Coverage.
- Hardware may have Support Coverage.
- Contract may cover multiple records.
- Support Coverage covers one License or Hardware record in MVP.
- Support Coverage may cover multiple records/packages in Phase 2.
- Renewal Package may group Licenses, Hardware, Contracts, Documents, POs, Invoices and Tasks.
- Documents may link to one or many records.
- Tasks must link to at least one record.
- Relationships connect canonical records through typed links.
- Activity Events belong to records and users.
- Import Jobs create canonical records.
- Alert Events belong to records and can create Notifications.
- Saved Views belong to users or workspaces.
- Custom Field Values belong to canonical records.

## 7. Import Mapping Model

Opriva import maps external data into canonical fields. It does not preserve arbitrary spreadsheet shape as the product model.

### Source detection

Opriva should inspect file headers, sheet names and sample values to identify source type, such as Microsoft CSP, Veeam Renewal Export, Hardware Sales Export, Commercial Renewal Package or Official Opriva Template.

### User-confirmed import target

Opriva may suggest an import target, but the user confirms or overrides it before import. Targets include Licenses, Hardware, Contracts / Support Coverage, Renewal Package, Clients / Departments, Vendors / Providers, Documents Metadata, Tasks and Mixed / Multiple record types.

### Mapping suggestions

Opriva suggests source-column-to-canonical-field mappings using rules and eventually AI. Suggestions consider workspace mode, detected source and selected import target.

### User approval

Mappings are not final until the user approves them. Users can import, skip, review or remap columns.

### Bulk defaults

Users should be able to apply common values such as Brand, Product, Owner, Alert Policy and Provider / Distributor to many records at once. Defaults should not overwrite row-specific values unless the user explicitly chooses to overwrite.

### Review/enrich records

Before creation, users should review the records Opriva will create. Preview should show business-friendly records, not only technical row data.

### Duplicate detection

Duplicate detection should compare a reasonable key such as:

- Client / Department
- Brand / Product
- Expiration date
- Contract number
- PO / Order Reference
- Provider / Distributor
- Serial number for hardware

### Creation of canonical records

After confirmation, imported rows become canonical records. They may create related client/department, brand, product, vendor/provider or package records only when approved or allowed by policy.

### Activity event creation

Imports should create activity events for import started, mapping approved, import confirmed, record created and import completed.

### Import history

Backend MVP must persist import jobs, files, mappings, row results, warnings, errors and created record ids.

Core rule:

Imported records must not remain isolated spreadsheet rows.

## 8. Document Model

Document types:

- Quote
- Purchase Order
- Invoice
- License Certificate
- Entitlement Document
- Signed Contract
- Warranty Document
- Support Policy
- Evidence File
- Other

Opriva may also use more specific labels in the UI or import template, such as Vendor Quote, Client Proposal, License Entitlement, Support Evidence, Compliance Evidence and Legal Document. These should map into the canonical document taxonomy.

Documents require secure storage later. The current local file picker and metadata behavior are sandbox-only.

Document metadata belongs in the database:

- Document Name
- Document Type
- File Name
- Uploaded By
- Uploaded At
- Status
- Linked records
- Notes

Documents can link to multiple records through Document Links.

Missing Evidence is policy-driven. It is derived from document policies, required document types, linked documents, document validity and record state. Users should not manually enter Missing Evidence as a field.

## 9. Task Model

Tasks are entities.

Tasks must be linked to records. A global task should still reference a license, hardware asset, contract, document, client/department, package or import.

Core task fields:

- Task Title
- Task Type
- Owner / Assignee
- Due Date
- Priority
- Status
- Source
- Impact
- Linked Record
- Notes

Tasks can be created manually. Later, tasks may be generated by alerts, workflows, import findings, missing evidence, approval blockers or AI-suggested actions.

Tasks are not a simple Next Action field. Next Action may appear as a summary or recommendation, but the operational work must exist as a task entity when assigned or tracked.

## 10. Activity / Audit Trail Model

Activity is system-generated.

It records:

- imports
- record creation
- record edits
- tasks
- document uploads
- document links
- relationships
- support coverage creation
- alerts
- status recalculations
- AI queries or accepted suggestions

Backend MVP requires persistent audit trail with:

- actor
- timestamp
- workspace
- source record
- related record
- event type
- structured metadata
- before/after values where appropriate

Activity should be append-only. Corrections should create new activity events rather than rewriting history.

## 11. Alert Model

Alert policies are configurable.

Common policies:

- Workspace default
- 90 / 60 / 30 days
- 60 / 30 / 7 days
- 30 / 7 / 1 days
- Custom

Alerts are derived from dates and policies. They should evaluate:

- Expiration / Renewal Date
- Warranty End Date
- Contract End Date
- Notice Period
- Alert Policy
- Owner assignment
- Missing evidence
- Business criticality
- Value or cost exposure

Alert events are generated by backend scheduler later.

Alert Status is not manual. It should be derived from current date, record date fields and alert policy.

## 12. Reporting and Dashboard Model

Dashboards and reports should derive from canonical records, not mock rows.

Reporting inputs:

- Expiration dates
- Warranty dates
- Contract end dates
- Values/costs
- Vendor costs
- Calculated margin
- Owners
- Vendors/providers/distributors
- Brands
- Risks
- Missing evidence
- Tasks
- Renewal stages
- Alert events
- Import completeness
- Activity events

MSP reports should focus on client renewal exposure, margin at risk, distributor blockers, owner gaps, quote status and commercial follow-up.

Internal IT reports should focus on department exposure, provider dependency, budget impact, approval blockers, operational continuity and evidence gaps.

## 13. AI Context Model

AI should use canonical records.

AI must respect permissions. It should not retrieve, summarize or act on data outside the user's workspace and role permissions.

AI should distinguish confirmed data from suggestions:

- Confirmed canonical records
- Imported but pending review records
- Suggested mappings
- AI-generated recommendations
- User-approved actions

AI should help with:

- import mapping
- source detection
- target recommendation
- unmapped column explanation
- bulk enrichment suggestions
- risk explanations
- renewal summaries
- missing evidence explanations
- task recommendations

AI actions must require user approval before records, tasks, documents, imports, relationships or notifications are created or changed.

## 14. MVP Data Model Scope

### MVP

The corporate MVP data model should include:

- Workspaces
- Users
- Roles/permissions
- Clients/departments
- Vendors/providers
- Brands/products
- Licenses
- Hardware
- Contracts/support coverage
- Documents metadata
- Document links
- Tasks
- Relationships
- Activity
- Import jobs
- Import mappings/results
- Alert policies
- Basic notifications
- Saved views/saved filters basics

### Later

Later phases can include:

- Advanced custom fields
- Advanced workflow automation
- AI actions
- Advanced formulas
- Billing
- Deep integrations
- Advanced catalog enrichment
- Full renewal package automation
- Document versioning
- Virus scanning/DLP
- Advanced search indexing
- External notification channels

## 15. Open Questions

- Should clients and departments live in one `clients_departments` table or separate tables with a shared interface?
- Should Support Coverage be its own table or a specialized Contract type for MVP?
- What is the exact distinction between Vendor, Provider, Distributor, Reseller and Partner in backend storage?
- Should Renewal Package be implemented before or after core Licenses/Contracts backend persistence?
- What fields are required for Internal IT license creation in backend MVP?
- What fields are required for MSP license creation in backend MVP?
- What document types are canonical versus UI aliases?
- What duplicate detection rules should block creation versus warn only?
- How should Opriva handle imported owner names that do not match users?
- Should AI-generated suggestions be stored as separate recommendation records?
- What is the retention policy for import files?
- What is the retention policy for documents?
- Which notification channels are required for first corporate pilot?
- What role set is required for MVP: Admin, Manager, Contributor, Viewer, or more?
- What search/indexing approach is needed for corporate MVP scale?
- What backend stack will be selected?

## 16. Final Recommendation

This canonical model should guide all future UI, import, backend and reporting work.

Before adding more broad frontend-only features, Opriva should align implementation around these canonical entities and relationships. The local sandbox can continue to validate UX, but corporate MVP work should migrate toward this canonical model backed by database persistence, secure storage, permissions, import jobs, alerts and audit trail.
