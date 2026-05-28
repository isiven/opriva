# Opriva Project Memory

## 1. Project Overview

Opriva is an enterprise SaaS platform for IT Asset & Renewal Intelligence. It helps teams understand what expires, what it costs not to act, who owns the work, and which renewals or approvals need attention.

The main app currently lives in `source/App.jsx`.

## 2. Current State

The app is a single-file React prototype that is compatible with the current runtime. `source/App.jsx` contains the application shell, workspace mode behavior, screens, mock data, component definitions, and injected styles.

The root entrypoint is `index.html`, which loads `source/main.jsx`. `source/main.jsx` exposes `React` and `ReactDOM` on `window`, then dynamically imports `source/App.jsx`.

Current stable state after commits `a05ce1d` and `745585a`:

- `BACKEND_READINESS_AUDIT.md` exists and is committed. It audits the current local/sandbox implementation and defines what must migrate to backend/database/storage/auth/permissions before a corporate MVP.
- The local Excel Import Sandbox is implemented and committed. It is a local/session validation feature only, not the final backend import engine.
- The Import Sandbox changed `source/App.jsx`, `package.json`, and `package-lock.json`, and added the `xlsx` dependency for browser-side Excel parsing.
- The build passed after the import sandbox implementation.
- `git diff --check` passed after the import sandbox implementation.
- The git working tree was clean after commit `745585a`.
- The official import template is available at `templates/OPRIVA_IMPORT_TEMPLATE.xlsx` and `public/templates/OPRIVA_IMPORT_TEMPLATE.xlsx`.

Opriva remains in design + local/sandbox functional validation. Local/session state is acceptable for UX and product logic testing, but corporate MVP readiness requires backend support for persistence, users, workspaces, roles, permissions, documents, imports, alerts, audit trail, AI knowledge, storage and enterprise testing.

## 3. Design Direction

Opriva should feel like a focused enterprise SaaS operations tool: dense, clear, quiet, and built for repeated use. The design should prioritize readable tables, accountable actions, risk triage, workspace context, and executive-ready renewal intelligence.

Do not redesign the product surface without a separate design decision.

## 4. Product Decisions

- Keep the app as a single-file prototype for now.
- Keep the current runtime compatibility model.
- Keep `source/App.jsx` as the main app surface until a planned component split is approved.
- Keep workspace mode as the core product switch.
- Keep sidebar label overrides visual only.
- Do not change internal routing ids as part of label cleanup.

## 5. Workspace Modes

Supported workspace modes:

- `MSP / Integrator`
- `Internal IT`
- `Hybrid`
- `Custom`

The Topbar includes a temporary Mode selector. Internal IT uses `Grupo Regency Workspace`. MSP / Integrator uses `Nextcom MSP Workspace`.

## 6. Internal IT Model

Internal IT represents a company managing its own IT estate. Its commercial model is:

`Brand + Provider + Department + Budget / Approval / Risk`

Use this model for Internal IT dashboards, renewal forecasts, vendor intelligence, attention workflows, and department views.

## 7. MSP / Integrator Model

MSP / Integrator represents a provider managing multiple client accounts and renewals. Its commercial model is:

`Client + Brand + Product + Distributor + Value + Margin + Owner + Action`

Use this model for MSP dashboards, vendor intelligence, renewal worklists, and client-facing operational queues.

## 8. Sidebar Collapse Decision

The sidebar has expanded and collapsed modes. Collapsed mode uses icons and tooltips. The main layout adjusts when the sidebar is collapsed.

Do not break:

- `sidebarCollapsed`
- `.appSidebarCollapsed`
- sidebar icon visibility
- collapsed tooltips
- workspace margin adjustment

## 9. Dashboard MSP Decision

The MSP dashboard already uses:

`Client / Brand / Product / Distributor / Renewal / Value / Margin / Owner / Action`

This structure is correct and should remain the reference for MSP renewal intelligence.

## 10. Dashboard Internal IT Decision

The Internal IT dashboard already distinguishes Brand and Provider. It also tracks department impact and approval-oriented actions.

Internal IT dashboard language should remain tied to internal budget exposure, department impact, provider dependency, approval blockers, and risk.

## 11. Attention Center Internal IT Decision

The Internal IT Attention Center was refined for:

- Brand / Provider separation
- approval blockers
- missing evidence
- missing owners
- provider dependency
- department exposure

This is the expected direction for Internal IT triage.

## 12. Brand / Provider / Distributor Commercial Relationship Model

Do not mix Brand, Provider, Distributor, Client, and Department.

- Brand: the technology brand or manufacturer in use or sold.
- Provider: the supplier, reseller, service provider, or implementer serving an Internal IT organization.
- Distributor: the upstream distributor or wholesaler used by an MSP / Integrator.
- Client: the end customer served by an MSP / Integrator.
- Department: the internal business area in an Internal IT organization.

Internal IT Vendors use Brand / Provider.
MSP Vendors use Brand / Distributor.

## 13. Runtime Compatibility Facts

- `source/main.jsx` imports React and ReactDOM Client.
- `source/main.jsx` assigns `window.React` and `window.ReactDOM`.
- `source/main.jsx` uses dynamic `import('./App.jsx')` so those globals exist before `App.jsx` executes.
- `source/App.jsx` mounts itself with `ReactDOM.createRoot(document.getElementById('root')).render(<App />);`.
- `index.html` provides `<div id="root"></div>`.

Do not change the runtime for now.

## 14. What Not To Touch

Do not touch without an explicit implementation phase:

- `source/App.jsx`
- runtime boot order
- `ReactDOM.createRoot(...)`
- `workspaceMode`
- sidebar collapse behavior
- Floating Opriva AI
- internal route ids
- Topbar Mode selector — **temporary design control, do not remove without explicit approval. Final workspaceMode configuration lives in Settings → Company → Operating Model.**
- Dashboard MSP column model
- Dashboard Internal IT Brand / Provider model

## 14a. Tasks as Execution Layer

Tasks is the execution layer for Opriva. Attention Center identifies blockers and risks; Tasks tracks assigned work to resolve them. MSP tasks focus on client follow-up, distributor quotes and commercial ownership. Internal IT tasks focus on department owners, approvals, budget reviews, provider quotes and evidence requests.

Each task should clearly communicate why it exists (Source), what impact it carries (Impact) and what action should happen next (Action). Tasks columns include Source and Impact so the list view functions as an operational queue, not just a to-do list.

## 14b. Settings → Operating Model Source of Truth

`Settings → Company → Operating Model` is the declared source of truth for `workspaceMode`. Workspace Mode is selected during onboarding/registration as part of workspace setup. Settings → Operating Model is the administrative surface for reviewing or adjusting that configuration. The topbar Mode selector remains a temporary design preview control and must not be treated as the production workflow.

The following structures inside `SettingsGroupPanel` must be kept in sync with the commercial model:

- `terminologyPreview` — entity labels per workspace mode
- `navigationPreview` — navigation items per workspace mode
- `importTemplatePreview` — import field order per workspace mode
- `selectedModeExplanation` — mode description per workspace mode

Hooks must remain before any conditional returns in React components. React error #300 must not appear. The app must not show a white screen.

## 14c. Reports as Distribution Layer

Reports is Opriva's executive distribution layer. It packages Dashboard KPIs, Attention Center risks, Data Import completeness and Tasks execution status into outputs for leadership, finance, account management and compliance.

## 14e. Documents as Evidence Layer

Documents is Opriva's evidence layer. It tracks required documents, signed contracts, quotes, warranty proof, approval forms, versions and access status. Missing required evidence feeds Attention Center, Tasks and Reports.

## 14h. Enterprise Table Rule

Every major Opriva table must be configurable by the user. Users should be able to show/hide columns, reorder columns, apply filters, save views, perform bulk actions and export data. In the MVP, this behavior can be represented visually through controls such as Configure columns, Saved view, Filters and Bulk actions. Full persistence and advanced table customization are Phase 2.

Columns should not be considered fixed forever. The default table view should be optimized for the selected workspace mode, but users should eventually be able to adapt the table to their operational needs.

Applies to: Dashboard queues, Attention Center, Departments, Renewals Forecast, Licenses, Hardware, Contracts, Documents, Tasks, Reports, Data Import validation tables.

## 14g. Hardware as Physical Asset Layer

Hardware is Opriva's physical asset layer. Warranties live inside Hardware as warranty end date, support coverage and renewal status. Contracts can link to hardware or licenses. Warranties as a standalone module remain Phase 2.

Hardware detail views, asset lifecycle history, location/rack fields and bidirectional links to Contracts/Documents are Phase 2. Brand Intelligence / Provider Intelligence also remains a Phase 2 analytics candidate.

## 14f. Licenses — Per-Record License Portfolio

Licenses must represent per-record license/product inventory. Brand / Provider / Distributor Intelligence is valuable but should become a Phase 2 analytics or portfolio intelligence view, not the primary Licenses screen.

`MspVendorIntelligenceScreen` and `VendorIntelligenceScreen` are preserved in code as Phase 2 candidates for a future Brand Intelligence / Portfolio Intelligence / Analytics view. They are not connected to any active route.

## 14d. Contracts as Obligation and Evidence Layer

Contracts tracks counterparty obligations, notice periods, document evidence and approval blockers. In MSP / Integrator it surfaces client/provider contract risk and commercial renewal actions. In Internal IT it surfaces department/provider exposure, approval gaps and evidence requirements.

## 15. Core Record + Related Tabs + Workspace Policies Model

This section documents the approved product architecture for record creation, related-tab management, document handling, license logic, renewal workflows, and the document policy model. Do not implement these decisions unless explicitly requested. This section is the authoritative product reference.

---

### 15.1 Core Record Creation

Opriva follows a **core-record + related-tabs model**.

Creation forms should remain minimal. They should only capture the required information needed to create the base record.

The initial creation form must **not** include:
- computed fields
- analytics fields
- relationship fields
- document workflow fields
- task fields
- activity / history fields
- renewal workflow stages
- manually selected expiration statuses

Relationships, documents, tasks, and activity should be managed **after record creation** through the record drawer tabs.

The record drawer must include these tabs:
1. **Overview** — summary, renewal/expiration, commercial fields, notes, record setup guidance
2. **Relationships** — link contracts, licenses, hardware, support agreements
3. **Documents** — attach and view evidence linked to this record
4. **Tasks** — create and track follow-up actions for this record
5. **Activity** — generated history, workflow events, audit trail

---

### 15.2 Fields That Should Not Be Manually Entered

Opriva must not ask users to manually enter values that can be calculated, inherited, derived from policy, or generated from workflow actions.

**Fields that must be calculated or derived — never user-entered:**

| Field | Derived from |
|---|---|
| System Status | Expiration Date + Alert Policy |
| Days to Expiration | Expiration Date vs today |
| Alert Status | Alert Policy threshold |
| Margin $ | Sale Price − Vendor Cost |
| Margin % | Margin $ ÷ Sale Price |
| Validity Status | Document policy + dates |
| Evidence Gap | Document policy + attached docs |
| Renewal Stage | Workflow events and actions |
| Risk signals | Calculated — unless a clear override model is approved |

These values should be calculated in the background and surfaced in:
- tables
- record drawer insights
- dashboards
- reports
- Attention Center
- AI summaries

---

### 15.3 License Record Logic

A **License record** is not the same as a Renewal Opportunity or Renewal Workflow. The base License form tracks what is being managed, not how it will be renewed.

**MSP / Integrator license creation form fields:**

Required:
- License / Product
- Client
- Expiration / Renewal Date
- Renewal Owner
- Alert Policy
- Quantity / Seats
- Distributor / Provider
- Sale Price / Annual Value
- Vendor Cost

Optional:
- Start Date
- License Term
- Notes

**System calculates (never user-entered):**
- Brand — from selected product
- System Status — from Expiration Date + Alert Policy
- Days to Expiration — from Expiration Date vs today
- Margin $ — from Sale Price − Vendor Cost
- Margin % — from Margin $ ÷ Sale Price

**Internal IT license creation form fields:**

Required:
- License / Product
- Department
- Expiration / Renewal Date
- IT Owner / Budget Owner
- Alert Policy
- Quantity / Seats
- Provider
- Annual Cost
- Cost Center
- Approval Status
- Business Criticality

Optional:
- Notes

**Internal IT must not show commercial resale margin fields:**
- Sale Price (as a resale price)
- Vendor Cost (as a resale cost)
- Margin $
- Margin %

---

### 15.4 Expiration Status Logic

Expiration-related status must **not** be manually selected by the user.

**User enters:**
- Expiration / Renewal Date
- Alert Policy

**Opriva calculates:**

| Condition | Status |
|---|---|
| No expiration date entered | Pending date |
| Expiration date is in the past | Expired |
| Inside alert window | Expiring soon |
| Outside alert window | Active |

---

### 15.5 Renewal Workflow Logic

**Renewal Stage must not appear in the initial License creation form.**

Renewal Stage belongs to a future renewal workflow that is generated when the item enters its alert / renewal window.

**Potential renewal workflow stages (future, not yet implemented):**
- Not started
- Quote needed
- Quote requested
- Proposal sent
- Waiting for client
- Approved
- Renewed
- Cancelled / Lost

These stages must be driven by actions, tasks, documents, and workflow events — not manually selected during initial license creation.

---

### 15.6 Record Creation Flow

The creation form should stay simple. The **post-creation flow** should allow users to complete the record immediately without restarting from scratch.

**Approved flow:**
1. Fill in core creation form
2. Save record
3. Automatically open the record drawer
4. Show a **Record Setup / Complete Setup** section in the Overview tab
5. Guide the user to complete the record through the correct tabs:
   - Attach document → Documents tab
   - Link contract / license / hardware / support → Relationships tab
   - Create follow-up task → Tasks tab
   - View generated history → Activity tab

Contracts, documents, tasks, and workflow history must not be placed inside the initial creation form.

---

### 15.7 Document Management Model

Opriva must not use one generic document status for all documents.

Document logic must be governed by workspace-level policies, module policies, and document type policies.

**A document may be:**
- attached to one specific record
- attached to a package / renewal bundle
- linked to multiple specific records inside a package

**Documents work in two contexts simultaneously:**
- as global records in the **Documents module**
- as attached evidence inside the **Documents tab** of any record drawer

When a document is attached from a record drawer, it should eventually:
- create a document record in the Documents module
- link to `selectedRecord.moduleKey`
- link to `selectedRecord.id`
- store `linkedRecordName`
- appear in the record's Documents tab
- appear in the global Documents module

---

### 15.8 Attach Document MVP Form

The MVP Attach Document form should be simple.

**Required fields:**
- Document Name
- Document Type
- Uploaded By

**Optional fields (currently visible):**
- File Name / Reference
- Requirement
- Access
- Version
- Effective Date
- Expiration Date
- Notes

> **Note:** The approved minimal form (per product decision) should eventually show only the three required fields plus Notes in the basic view. The remaining optional fields (File Name / Reference, Requirement, Access, Version, Effective Date, Expiration Date) are candidates for an "Advanced / More options" section once the policy engine is in place. The current form exposes them while policies are not yet implemented.

**Do not show in the basic Attach Document form:**
- Status (generic)
- Review Status
- Signature Status
- Validity Status
- Missing Evidence

These concepts must be handled by policies, inherited values, role permissions, document history, or future advanced settings.

**Internal behavior:**
- When a document is attached, `status` is set internally to `'Attached'`
- This value is never shown in the form
- Document state beyond "Attached" derives from policies and workflow, not manual selection

---

### 15.9 Document Type Taxonomy

Vendor-issued license proof must be standardized under one document type:

**`License Entitlement`**

License Entitlement includes:
- license certificates
- entitlement documents
- vendor licensing confirmations
- software rights evidence
- license keys / rights documents
- similar vendor-issued proof of purchased software rights

**Do not use separate selectable types for:**
- License Certificate
- Entitlement Document

**Approved MVP document type list:**
- Vendor Quote
- Client Proposal
- Purchase Order
- Invoice
- License Entitlement
- Signed Contract
- Warranty Document
- Support Evidence
- Compliance Evidence
- Legal Document
- Other

> **Note:** Current implementation uses `Quote` and `Purchase Order`. `Vendor Quote` and `Client Proposal` are the approved direction and should replace `Quote` when the form is next updated.

---

### 15.10 Requirement Logic

Requirement must **not** be manually selected every time a user attaches a document.

Requirement must be determined by **document policies**, not manual user input.

**Example policy for MSP / Renewal Package:**

| Document Type | Requirement |
|---|---|
| Vendor Quote | Required |
| Client Proposal | Required |
| Purchase Order | Requested |
| License Entitlement | Required |
| Invoice | Optional |

A document is only considered **missing** if:
- a policy says it is Required, **and**
- no document matching that requirement exists for the record

If a document type is not required by policy, it must not be treated as missing.

---

### 15.11 Access Logic

Access must **not** be manually selected in the basic Attach Document form.

Document visibility must be controlled centrally by roles, permissions, workspace policies, and document type policies.

**Default access by document type (reference):**

| Document Type | Default visibility |
|---|---|
| Invoice | Finance / Admin |
| Signed Contract | Legal / Admin / Manager |
| Client Proposal | Sales / Manager |
| License Entitlement | Sales / Support / Admin |
| Compliance Evidence | Compliance / Security / Admin |

Per-document access overrides are Phase 2 / admin-only advanced settings.

---

### 15.12 Version Logic

Version must **not** be a standard visible field in the MVP Attach Document form.

Opriva is not primarily a CRM-style document versioning system. The attached document generally represents the latest / current relevant version.

If version tracking is needed, it must be handled through:
- Activity
- Document History
- Advanced Document Management (Phase 2)

---

### 15.13 Document Date / Validity Logic

Effective Date and Expiration Date must **not** appear as generic required fields in the basic Attach Document form.

Document validity must be policy-driven.

**A document may derive validity from:**

| Document Type | Validity source |
|---|---|
| License Entitlement | Inherits from linked license record |
| Warranty Document | Inherits from linked hardware warranty / support end date |
| Signed Contract | Inherits or exposes contract start / end dates |
| Vendor Quote | Own "Valid Until" date |
| Invoice | No validity date needed |
| Purchase Order | No validity date needed |
| Compliance Evidence | Own expiration date |

Only document types with independent validity should expose date fields, and only based on workspace-level document policy configuration.

---

### 15.14 Document Policies

Opriva must support a **Document Policy engine** governing:
- workspace
- module
- document type
- record type
- package type
- role

**A Document Policy should eventually define:**
- Required? (yes / no / conditional)
- Review required?
- Approval required?
- Signature required?
- Has own validity date?
- Inherits validity from linked record?
- Default access level?
- Applies to: record, package, or multiple records?

This policy engine does not need to be implemented immediately. This section defines the correct product direction.

---

### 15.15 Package / Renewal Bundle Model

Opriva must support the reality that many business transactions contain **multiple licenses, products, contracts, and documents**.

Real deals frequently include multiple licenses or products under one proposal or renewal package. Vendors may issue one entitlement / licensing document with multiple pages or line items covering different licenses.

**Opriva must support a parent grouping concept such as:**
- Deal
- Renewal Package
- Bundle

**A package can group:**
- multiple licenses
- hardware assets
- support agreements
- contracts
- documents (quotes, invoices, purchase orders, entitlements)
- tasks
- activity events

**Documents must be attachable to:**
1. One specific record
2. An entire package / renewal group
3. Multiple selected records inside the same package

Package / multi-record linking UI is Phase 2. The concept must be defined now so that the data model and document linking architecture does not need to be reconstructed later.

---

### 15.16 Custom Fields Roadmap

Controlled custom fields are part of the **MVP roadmap**, but must be implemented only after core workspace-specific forms are stabilized.

**MVP custom fields must allow admins to add fields per module with controlled types:**
- text
- number
- date
- dropdown
- currency
- checkbox
- URL
- long text

**Custom fields must extend core modules but must not replace:**
- required core fields
- calculated fields
- expiration logic
- alert policies
- relationship models
- document policy logic

**Phase 2 custom field capabilities:**
- formulas
- conditional fields
- field-level permissions
- workflow automation
- AI interpretation of custom fields

---

### 15.17 Implementation Guidance

Do not implement the decisions in this section immediately unless explicitly requested.

These decisions document the **approved architecture and product direction**. Implementation happens in controlled phases with explicit approval per step.

---

### 15.18 Support Coverage / Support Contracts

Support Coverage must be modeled as a **renewable contract / coverage layer**, not as free text inside a License or Hardware record.

#### Core decision

When adding a License or Hardware item, the user should be able to optionally add or enable support coverage. If enabled, Opriva should create or link a related Contract / Support Coverage record automatically and connect it to the covered License or Hardware through a relationship.

Do not model support as a simple text field called "Support Coverage" inside Hardware or Licenses.

#### What Support Coverage may cover

- one license
- one hardware asset
- multiple licenses
- multiple hardware assets
- a renewal package / bundle

#### Support Coverage record fields

A Support Coverage record should have its own:

| Field | Notes |
|---|---|
| Name | descriptive name of the support agreement |
| Type | e.g. Support Contract, Maintenance Agreement, SLA, Care Pack |
| Provider | the support provider or vendor |
| Start Date | coverage start |
| End / Expiration Date | coverage end — drives alert and renewal logic |
| Owner | assigned owner responsible for renewal |
| Alert Policy | drives expiration warnings |
| Value / Cost | annual or total cost of support |
| Documents | linked evidence (e.g. support contract PDF, SLA document) |
| Tasks | follow-up actions for renewal or escalation |
| Activity History | generated history of changes, renewals, and events |

#### How support is added

The License and Hardware creation forms must remain simple. Support coverage should be added through:

1. An optional **"Add support coverage"** action during record setup (post-save Complete Setup flow)
2. The **Relationships tab** of the record drawer
3. Or the **post-save Complete Setup** guided flow

#### Where support contracts appear

Support contracts must appear in the **Contracts module** and must be linked to covered assets using a relationship model equivalent to `asset_contracts`:

| Relationship field | Description |
|---|---|
| Contract / support record | the support contract |
| Covered asset record | the linked license or hardware item |
| Coverage type | e.g. Full support, Limited, SLA-only |
| Coverage dates | start and end dates |
| Notes | any coverage-specific notes |

---

## 16. Next Steps

### Backend Readiness Warning

The next major milestone should not be adding unlimited front-end-only features. The next major milestone is preparing the backend foundation required for corporate MVP readiness.

Backend foundation includes:

- Authentication
- Workspaces / tenants
- Roles and permissions
- Persistent canonical records
- Secure document storage
- Import jobs and import history
- Alert scheduler and notifications
- Activity/audit trail
- AI knowledge retrieval with permissions
- Reporting/dashboard data layer

Safe Phase 1 candidates:

- Normalize visible terminology only.
- Replace old or generic copy that conflicts with Opriva.
- Align Internal IT wording around Brand / Provider / Department / Budget / Approval / Risk.
- Align MSP wording around Client / Brand / Product / Distributor / Value / Margin / Owner / Action.
- Add `data-label` support to custom responsive tables in a controlled pass.

Medium-risk Phase 2 candidates:

- Separate workspace mock data.
- ~~Improve Command Palette labels by workspace while preserving route ids.~~ **Completed 2026-05-19.**
- Consolidate duplicated style layers after visual regression checks.
- Departments currently groups Brands & Providers in one column. Phase 2 should separate Brand and Provider into structured fields once mock data is normalized.

Later:

- Plan a component split only after the current single-file prototype is stable and validated.

---

### MVP Roadmap (approved product decisions, not yet fully implemented)

The following items are architecturally approved and should be implemented only when explicitly requested:

- Core record + related-tabs model (Overview, Relationships, Documents, Tasks, Activity)
- Workspace-specific creation forms (MSP vs Internal IT field sets per module)
- Simple Attach Document form (Document Name, Document Type, Uploaded By + optional fields only)
- License Entitlement document type standardization (replaces License Certificate + Entitlement Document)
- RECORD_STORE / record identity foundation (module-level mutable store for cross-tab linking)
- Package / Bundle / Renewal Bundle concept defined and documented
- Support Coverage creation/linking from License and Hardware drawer setup
- Controlled custom fields per module — after core workspace-specific forms stabilize
- Local Excel Import Sandbox in Data Import: `.xlsx` / `.xls` upload, sheet parsing, sheet selection, source detection, header mapping, canonical field mapping, skipped/calculated column handling, row normalization, target module detection, normalized record preview, and confirmed local/session creation into `RECORD_STORE`.
- Import sandbox records are preserved during local mock refresh when `meta.source === 'importSandbox'`.

### Phase 2 Roadmap (deferred, do not implement yet)

- Full document policy engine (workspace → module → document type → record type → role)
- Package / multi-record linking UI (attach documents to bundles or multiple records)
- Document review / approval / signature workflow states
- Advanced per-document access overrides
- Document version history and activity-driven document audit trail
- Activity-driven renewal workflow stages (Quote needed → Proposal sent → Approved → Renewed)
- Custom field formulas, conditional fields, field-level permissions and workflow automation
- Advanced custom logic and AI interpretation of custom fields
- Multi-asset support coverage management (one contract covering multiple assets)
- Support coverage renewal workflows
- Support coverage compliance and SLA tracking
- Backend-backed import engine with persistent import jobs, import files, import mappings, import rows, validation, preview, import history and confirmed durable record creation.
- Automated PDF parsing and PO/OC matching for Trend Micro entitlement imports.
- Real AI-powered column detection and canonical field mapping in Data Import. Current import sandbox uses local/browser rule-based mapping only.
- Template recognition on upload: detect Official Opriva Template and bypass AI mapping step, proceeding directly to import preview.

## 20. Official Opriva Import Template

This section documents the approved structure and product decisions for the Official Opriva Import Template. The template is an optional structured workbook customers can use to prepare clean data in Opriva's canonical format before uploading. Full specification lives in `OPRIVA_IMPORT_TEMPLATE_SPEC.md`.

---

### 20.1 Two Import Paths

Opriva supports two coexisting data import paths:

| Path | Input | Description |
|---|---|---|
| **Path A — AI-Assisted Guided Mapping** | Any Excel, CSV, or PDF | AI suggests column mappings; user reviews and approves before records are created |
| **Path B — Official Opriva Template** | Official Opriva Template (.xlsx) | Data already in canonical format; Opriva validates, previews, and imports directly |

Both paths produce the same canonical records. Path B skips the AI mapping step. Neither path creates records without user confirmation of an import preview.

Current stable implementation:

- Path A is represented in the Data Import screen as AI-assisted mapping preview. For now, it uses a local/browser rule-based mapping assistant and writes confirmed records into local/session `RECORD_STORE`.
- Path B is represented through the downloadable official workbook at `/templates/OPRIVA_IMPORT_TEMPLATE.xlsx`.
- Users can either use the official Opriva template or upload their own Excel file and use AI-assisted mapping.
- Backend import jobs, backend import history, durable record creation and server-side template recognition are still required before corporate MVP.

Data handling rules:

- Real client files must not be committed to GitHub.
- `private-samples/` is for real local test files only and must remain ignored.
- `sample-data/` may contain demo or anonymized files only.

---

### 20.2 Template Workbook Structure

The Official Template is a multi-sheet Excel workbook with these sheets in order:

1. Instructions
2. Clients / Departments
3. Renewal Packages
4. Licenses
5. Hardware
6. Contracts / Support Coverage
7. Documents
8. Tasks
9. Custom Fields

Empty sheets are skipped at import. The first row of each data sheet is a frozen header row. No merged cells. No formulas.

---

### 20.3 Reference System

Records are linked across sheets using plain-text reference identifiers defined by the user:

- **Package Reference** — links Licenses, Hardware, Contracts, Documents to a parent Renewal Package
- **License Reference / Hardware Reference / Contract Reference** — module-level record identifiers used as link targets
- **Linked Record Reference** — used by Documents and Tasks to point to any record in any module
- **Covered Record Reference** — used by Support Coverage contracts to identify the covered License or Hardware asset

References must be unique within their sheet and consistent across sheets (case-sensitive match).

---

### 20.4 Fields Excluded from the Template

These fields are calculated or derived by Opriva and must never appear as fillable columns in any import template or import flow:

- System Status (from Expiration Date + Alert Policy)
- Days to Expiration (from Expiration Date vs. today)
- Risk (from expiration, coverage, ownership analysis)
- Margin $ and Margin % (from Sale Price − Vendor Cost)
- Renewal Stage (from workflow events)
- Missing Evidence (from document policy engine)
- Validity Status (from document policy + dates)
- Alert Status (from Alert Policy threshold)

---

### 20.5 Validation Rules Summary

| Rule type | Description |
|---|---|
| Required fields | Each module has required fields; rows missing them are flagged in preview |
| Reference integrity | Package Reference, Covered Record Reference, Linked Record Reference must resolve to existing rows |
| Client / Department match | Must match a Name in the Clients / Departments sheet |
| Date format | Must be `YYYY-MM-DD`; invalid dates are flagged |
| Controlled vocabulary | Document Type, Contract Type, Coverage Type, Alert Policy, Priority, Status accept only defined values |
| Unique references | Two rows in the same sheet cannot share a Reference value |

---

### 20.6 Import Preview Requirement

Every import — both Path A and Path B — must produce a preview step before records are committed. Preview must show: valid rows to be created, flagged rows with errors, and module-level creation summary. No records are written until the user confirms.

---

### 20.7 Future Template Generation (Phase 2)

When implemented, template download should:
- Produce a workspace-tailored workbook filtered by mode (MSP or Internal IT) and enabled modules
- Include custom field columns for the workspace's defined custom fields
- Use Excel data validation dropdowns for controlled vocabulary columns
- Pre-fill workspace alert policy defaults
- Include an Instructions sheet personalized with workspace name, mode, and terminology
- Be available from Data Import → "Download Opriva Template" and from Settings → Company → Import Templates
- Include a template version marker so Opriva can recognize uploads as Official Template files and bypass the AI mapping step

---

### 20.8 Workspace Mode Behavior

| Mode | Template behavior |
|---|---|
| MSP / Integrator | Clients sheet. Distributor, Annual Value, Vendor Cost in Licenses. No Internal IT-only fields. |
| Internal IT | Departments sheet. Cost Center, Approval Status, Business Criticality in Licenses. No MSP-only margin fields. |
| Hybrid | All columns with mode annotations. |

---

## 19. Guided Import Mapping Model

This section documents the approved philosophy and product decision for all Opriva data import flows. It applies to Excel, CSV, and PDF sources.

Current implementation status: Opriva now includes a local Excel Import Sandbox for `.xlsx` / `.xls` files. The sandbox validates UX and import logic in the browser using local/session state. It does not replace the future backend import engine.

---

### 19.1 Core Decision: Opriva Imports Into Its Own Model

Opriva must not blindly replicate the structure of uploaded source files. Source files (Excel registers, CSV exports, PDF entitlements) may contain:

- Columns that are unnecessary in Opriva's model
- Columns that duplicate other fields
- Columns with non-canonical names, formats, or values
- Columns that belong in metadata or notes, not core fields
- Fields that represent calculated or derived values in Opriva

**Opriva imports data into its own product model — not into a reproduction of the source spreadsheet.**

Every import flow must transform source data into Opriva's canonical records: Clients, Renewal Packages, Licenses, Hardware, Contracts, Documents, Support Coverage, Tasks.

Opriva should not blindly import every Excel column. Uploaded Excel data must be mapped into Opriva canonical fields. Calculated or derived columns such as Status, Days to Expiration, Risk, Margin, Renewal Stage and Missing Evidence should be skipped or recalculated by Opriva, not imported as user-entered truth.

---

### 19.2 Guided Column-Mapping Step

Every import flow must include a guided column-mapping step where the user can:

- See which source columns were detected
- Choose which columns to import (and which to skip)
- Map each source column to an Opriva canonical field
- Set default values for missing required fields
- Create custom fields only when no canonical field exists
- Preview draft records before committing
- Approve the final mapping before records are created

This step is not optional. Every import — regardless of file type — must pass through the mapping review before records are written.

---

### 19.3 AI-Assisted Mapping

The Opriva AI should assist the mapping step by:

- Detecting the likely meaning of each source column from its name, sample values, and context
- Suggesting the best matching Opriva canonical field for each source column
- Identifying the join key between related files (e.g., `OC Partner` = `PO Number`)
- Flagging duplicate or redundant columns
- Flagging columns that represent calculated values in Opriva (should be skipped or noted)
- Detecting missing required fields and suggesting defaults
- Recommending what record type each row should become (Client, License, Package, Contract, Document, Support Coverage, Task)
- Warning when source data does not cleanly match Opriva's model
- Suggesting transformations (e.g., date format normalization, currency stripping)

**AI suggestions are advisory only.** The user must review and approve all mappings. Nothing is imported automatically without user confirmation.

The current local sandbox implements rule-based "AI-assisted mapping preview" behavior only. Real AI mapping and backend-backed import jobs remain required before corporate MVP.

---

### 19.4 Confirmed Import Promotion

Imported records must be promoted into the central Opriva canonical data model after user approval. Imported data should not remain as isolated spreadsheet rows.

Once confirmed, imported records must behave like first-class Opriva records and be available across modules, drawers, relationships, documents, tasks, activity, dashboards, reports, alerts, search and AI context.

In sandbox/local mode, imported records must be added to the central local store and appear in relevant modules such as Companies/Clients, Licenses, Assets & Renewals, Contracts, Dashboard/Reports and record drawers where applicable.

In sandbox/local mode this can be simulated through `RECORD_STORE`, but corporate MVP requires backend persistence, audit trail and permissions.

---

### 19.4A Import Entity Detection and Canonical Creation

Bulk import must detect all meaningful business entities in uploaded files, not only the selected asset type. Detected entities include Client / Company, Department, Contact, Contact Email, Brand / Manufacturer, Product / SKU, Vendor / Provider, Distributor, Reseller / Partner, License, Hardware Asset, Contract, Support Coverage, Renewal Package / Bundle, Document Metadata, Task, Relationship and Activity Event.

For every detected entity, Opriva should normalize and match against existing canonical records or controlled catalogs using case-insensitive matching, trimmed/collapsed spaces and safe punctuation tolerance. Existing matches should be reused. New values should be staged as new canonical records or catalog values and require user approval before creation.

Sensitive contact names, emails, addresses, phone numbers and similar fields must be treated as sensitive relationship data. They should be marked for review and eventually create or link Contact records with explicit approval, permissions and audit history. They must not be imported blindly as license, contract or package free text.

In local sandbox mode, Opriva can simulate this through `RECORD_STORE`, metadata, entity counts, duplicate warnings and relationship staging. Corporate MVP requires backend tables, transactions, permissions, import jobs, contact handling, relationship creation and audit trail.

---

### 19.5 Import Preview and Enrichment

Import preview must show final Opriva records before creation, not only technical row/mapping data. Users must be able to review, enrich and correct imported records before confirming. Warnings should be grouped and actionable instead of repeated as long text per row.

The preview should show business-facing record context such as client/department, brand/product, expiration date, target module, issues and creation action. Technical row details can remain available behind a secondary "View raw row details" control.

---

### 19.6 Bulk-first Import Enrichment

Import enrichment should be bulk-first and exception-based. Opriva should let users apply common values such as Brand, Product, Owner and Alert Policy to all or selected imported records, edit important fields efficiently, and only require row-level review for exceptions.

This avoids forcing users to review every imported row manually while keeping the user in control of mappings, enrichment and final import approval.

---

### 19.7 Controlled Catalog Fields

Opriva must use controlled catalogs for repeated and business-critical fields, not unrestricted free text. Controlled catalog fields include Brand / Manufacturer, Product / License Name, Distributor / Provider, Vendor / Provider, Reseller / Partner, Client / Department, Owner, Alert Policy, Document Type, Contract Type, Support Coverage Type, License Term, Currency, Country and reusable business classifications.

Catalog-controlled fields should use select/search/create behavior. New values should be normalized before creation, checked against similar existing values, and created only after the user confirms that no existing value should be reused. AI may suggest catalog matches, but the user approves.

Imports should map incoming values to existing catalog records where possible. Bulk defaults should apply catalog-controlled values instead of arbitrary strings. If a new brand, product, provider, distributor, reseller, client/department, owner or policy appears during import, Opriva should flag possible duplicates and ask whether to use an existing catalog value or create a new one.

The local sandbox may simulate this behavior with local lists and duplicate warnings. Corporate MVP requires backend catalog tables, normalized keys, aliases/synonyms, unique constraints, merge/deactivate flows, workspace-scoped versus global catalog rules, and audit history for catalog changes.

---

### 19.8 Columns That Should Be Skipped by Default

These source column types should be suggested as "skip" by default during mapping, unless the user explicitly chooses to map them:

| Column pattern | Reason to skip |
|---|---|
| Calculated values (e.g., margin, status, days remaining) | Opriva calculates these — importing them would override the correct derived value |
| Workspace identity fields (e.g., Reventa / Reseller = Nextcom) | These represent the workspace operator, not a data field |
| Internal system IDs with no Opriva equivalent | May be stored as metadata in Notes if relevant |
| Duplicate fields (same data in two columns) | Only one canonical field should be populated |
| Empty or always-null columns | No data to import |

---

### 19.5 Custom Field Creation Rule

Custom fields should be created only when:

- A source column carries real business value that does not fit any Opriva canonical field
- The user explicitly requests it during the mapping step
- The field type is appropriate (text, number, date, dropdown, currency, checkbox, URL, long text)

Custom fields must never be used to import:
- Calculated values
- Derived status fields
- Fields that belong to the document model, not the record model
- Fields that belong in the Activity or notes layer

---

### 19.6 Trend Micro Import Mapping (Specific Application)

The Trend Micro data set confirms these mapping decisions:

| Source column | Opriva field | Decision |
|---|---|---|
| `# Registro` | Package Reference | Import as reference metadata |
| `# OC` | Nextcom Order Number | Import as reference metadata |
| `OC Partner` | TM PO Number | Import — **join key to PDF** |
| `Cliente` | Client | Import → canonical field |
| `# Legal de Fac.` | Distributor Invoice Number | Import as reference metadata (blank in current data) |
| `Reventa` | Reseller | **Skip** — this is the workspace identity (Nextcom) |
| `Distribuidor` | Distributor | Import → canonical field |
| `Licencias` | Quantity / Seats | Import → canonical field (base count) |
| `Vencimiento Licencia` | Expiration / Renewal Date | Import → canonical field |
| `Fecha factura` | Invoice Date | Import as metadata / notes |
| `Monto Total` | Annual Value / Sale Price | Import → canonical field |

PDF columns shared across all pages (Customer Name, Reseller, TM Program Number, TM Reference Number, PO Number, Order Type, Start Date, End Date) are attached at the package level.

PDF per-page columns (Product Name, SKU, Volume) populate individual License records.

---

### 19.7 Hardware and Component Import Model

When importing hardware or equipment sales data (e.g., QNAP NAS sales exports, device registers, sales reports), the import assistant must:

1. **Detect grouped customers** — sales exports are often grouped by customer name appearing as a section header row with all other columns blank. The customer value must be inherited by all following rows until the next customer header.

2. **Distinguish main asset rows from component rows** — a single sale typically includes a primary hardware unit plus related components (drives, rails, expansion cards, cables). Main asset rows have transaction dates, invoice numbers, and product details. Component rows carry only product and serial data, inheriting context from the parent row.

3. **Classify component rows by item type** — the `Clase de artículo` (or equivalent) field drives whether a row becomes a Hardware record, a linked component record, or a note on the parent asset.

4. **Group components under the parent asset** — components sold on the same invoice as the main hardware unit should be presented to the user as a grouped decision: create linked Hardware records per component, or add as notes on the parent.

5. **Detect and validate multi-value serial fields** — the Serial/serial number column may contain multiple serials in one cell (newline or space separated). Count detected serials and compare to Quantity. Flag mismatches for user review.

6. **Extract warranty signals from description fields** — warranty text embedded in product descriptions (e.g., "Garantía de hardware QNAP 3 años") should be detected, surfaced to the user, and used to suggest Support Coverage records with calculated end dates.

7. **Exclude report artifacts** — header rows (title, company name, date range) and footer rows (e.g., QuickBooks export timestamps) must be detected and excluded automatically.

These patterns apply to any hardware or equipment sales export regardless of vendor — QNAP, Dell, HPE, Cisco, Seagate, or any other. The QNAP sales report is the canonical real-world example. See `IMPORT_MAPPING_QNAP_HARDWARE.md` for full field mapping and examples.

---

### 19.9 Record Type Inference

When the AI reviews source data during import, it should recommend the best Opriva record type for each row or document:

| Source pattern | Recommended Opriva record |
|---|---|
| Commercial deal row with client, distributor, expiry, value | Renewal Package / License record |
| Vendor-issued entitlement PDF | License Entitlement document |
| One page of a multi-page entitlement PDF | License line item |
| Hardware device with serial, model, warranty | Hardware record |
| Commercial agreement with notice period | Contract |
| Quote, PO, invoice | Document (of the appropriate type) |
| Coverage with its own end date and provider | Support Coverage |
| Follow-up action tied to a record | Task |

---

### 19.10 User Controls Final Approval

The user always retains final control over:

- Which columns are imported or skipped
- How each column is mapped
- Whether a custom field is created
- What default values are applied
- Which records are created vs. discarded after preview
- Whether the import proceeds

AI mapping suggestions are displayed as recommendations with a confidence indicator. Users can accept, adjust, or reject each suggestion individually before confirming the import.

---

### 19.11 Import Duplicate Detection (Record-Type-Specific Keys)

Import duplicate detection is record-type specific and implemented in the local sandbox (commit `1e16a13`). Logic lives in `source/importSandbox/importDuplicates.js` and is wired into `withImportRecordMeta`, the preview duplicate check (`buildImportPreview`) and the confirm-time insert (`insertImportedRecords`).

- `meta.duplicateKeys` is the real source of duplicate detection. Each imported record carries an array of namespaced, record-type-specific keys; two records are duplicates when they share any key.
- `meta.importKey` remains only as a backward-compatible legacy fallback. It is still written to every record but is used only when comparing against an existing stored record that has no `duplicateKeys`.

Implemented keys:

| Record type | Primary key | Fallback / variant |
|---|---|---|
| Licenses | client/department + brand/product + expiration date | CSP variant adds order reference (client + product + end date + order reference) |
| Hardware | serial number when available | client + model/product + (order reference or purchase date) |
| Contracts | contract number + end date | client + provider + support/contract type + renewal/end date |

Rules:

- Sparse/weak keys are not emitted — a key is only produced when its required discriminating fields are present, so a single shared field (e.g. client alone) can never trigger a false duplicate.
- Serial values that are empty or `-` are ignored for the hardware serial key; such rows fall back to the client + model + reference/date key.
- Certificates and Renewal Package keys are defined as dormant placeholders and currently produce no keys; they are reserved for when those modules go live.

Handling follows Option A: Opriva flags duplicate risk in the preview and Import Summary, and the existing confirm-time duplicate skip behavior is preserved. Strict flag-only duplicate handling with row-level include/exclude remains a future UX task. Full duplicate handling, persistence and audit remain backend-required for corporate MVP. Detailed design lives in `INTELLIGENT_BULK_UPLOAD_DESIGN.md` §11.

---

## 18. Trend Micro Import Model

This section documents the approved data model for importing Trend Micro renewal data into Opriva. It is derived from real Nextcom commercial records (`Datos.xlsx`) and a Trend Micro Entitlement Certificate PDF (`TM LICENSE -MI0008223.pdf`). Detailed field mapping lives in `IMPORT_MAPPING_TREND_MICRO.md`.

---

### 18.1 Excel Row → Renewal Package / Deal

Each row in the Nextcom commercial renewal register (`Datos.xlsx`) represents one commercial deal — a single order for one end client covering one renewal or purchase cycle. In Opriva, each Excel row maps to a **Renewal Package / Deal**.

Key Excel columns and their Opriva equivalents:

| Excel Column | Opriva Field |
|---|---|
| `# Registro` | Package reference / internal record ID |
| `# OC` | Nextcom order number |
| `OC Partner` | **Trend Micro PO Number** (primary join key to PDF) |
| `Cliente` | Client |
| `# Legal de Fac.` | Distributor invoice number (reference field) |
| `Reventa` | Reseller (workspace identity — not a separate field) |
| `Distribuidor` | Distributor |
| `Licencias` | Quantity / Seats (base platform license count) |
| `Vencimiento Licencia` | Expiration / Renewal Date |
| `Fecha factura` | Invoice Date (metadata / notes field) |
| `Monto Total` | Annual Value / Sale Price |

---

### 18.2 PDF File → License Entitlement Document

A Trend Micro Entitlement Certificate PDF represents vendor-issued proof of purchased software rights for all products in one order. In Opriva it is stored as a single **License Entitlement** document and linked to the parent Renewal Package and to each License record created from the PDF pages.

One License Entitlement document may cover multiple License records. This is correct behavior — the document is the source of truth for the entire order.

---

### 18.3 PDF Page → License Line Item

Each page of a Trend Micro Entitlement Certificate PDF covers one product SKU. All pages in a PDF share the same Customer, Reseller, TM Program Number, TM Reference Number, PO Number, Order Type, Start Date, and End Date. Only the product name, SKU, and volume differ per page.

In Opriva, each PDF page maps to one **License record** linked to the parent Renewal Package.

Key PDF fields and their Opriva equivalents:

| PDF Field | Opriva Field |
|---|---|
| Product Name (page header) | License / Product |
| `Customer Name` | Client |
| `Customer No.` | Client Reference (metadata) |
| `SKU` | SKU / Part Number (reference field) |
| `TM Program Number` | TM Program Reference (metadata) |
| `TM Reference Number` | TM Order Reference (metadata) |
| `PO Number` | Trend Micro PO Number (**join key to Excel `OC Partner`**) |
| `Order Type` | Order Type (metadata) |
| `Volume` | Quantity / Seats |
| `Start Date` | License Start Date (metadata) |
| `End Date` | Expiration / Renewal Date |

---

### 18.4 Join Key

The reliable join key between the Excel commercial record and the PDF entitlement certificate is:

**`OC Partner` (Excel) = `PO Number` (PDF)**

Example: Banisi row in Excel (`OC Partner = TRM-STD-966300`) matches all 6 pages of the Banisi entitlement PDF (`PO Number = TRM-STD-966300`).

For MSP-cycle rows (e.g., `OC Partner = MSP 2026-04`), no external entitlement PDF exists. These represent Nextcom's own managed service seat pool.

---

### 18.5 Package Contents

A Renewal Package in Opriva may contain:

- Multiple License line items (one per product SKU)
- One or more License Entitlement documents
- Vendor Quote
- Client Proposal
- Purchase Order
- Invoice
- Support Coverage records
- Tasks
- Activity

---

### 18.6 Trend Micro Support Logic

#### Manufacturer support included with active maintenance

Trend Micro business products with active maintenance include access to Trend Micro customer support. This is stated on every Entitlement Certificate page and is not a separate contract.

In Opriva, this should be represented as an **included / derived Support Coverage** record tied to the license validity:
- Provider: Trend Micro
- Coverage End Date: same as the license Expiration / Renewal Date
- Coverage Type: Manufacturer Support
- Note: Included with active maintenance — not a separately purchased service

This coverage expires when the license expires. Its status is driven automatically by Opriva's expiration logic.

#### Nextcom-managed support and SLA

If Nextcom provides its own managed support service, SLA, Gold/Silver/Bronze support tier, or other service coverage for a client, this must be modeled as a **separate Support Coverage contract** in Opriva with its own:
- Renewal date (independent from the Trend Micro license expiry)
- Provider: Nextcom Systems Inc.
- Coverage owner: the Nextcom account manager
- Annual value: Nextcom's service charge
- Alert policy: independent renewal timeline

This record appears in the Contracts module as a Support Coverage contract and in the originating record's Relationships tab.

---

### 18.7 MVP Import Approach

For MVP, import remains manual or mapping-based:

1. Create a Renewal Package / License record from the Excel row.
2. Create individual License records for each PDF page / SKU.
3. Attach the PDF as a License Entitlement document linked to the package and each line item.
4. Add Trend Micro manufacturer support as derived Support Coverage on each license.
5. Add Nextcom SLA / managed support as a separate Support Coverage contract if applicable.
6. Create follow-up tasks (quote request, renewal confirmation, document upload).

---

### 18.8 Phase 2 Import Automation

Phase 2 should include:

- Automatic PDF parsing (extract all fields from each Entitlement Certificate page)
- Match PO Number (PDF) to OC Partner (Excel) to link entitlements to packages automatically
- Auto-create License line items from matched PDF pages
- Detect missing entitlements (License records with no attached License Entitlement document)
- Detect volume mismatches between Excel `Licencias` and PDF volumes
- Detect upcoming renewals and apply alert policies at import time
- Suggest a default task set per package based on Order Type and days to expiration

---

## 17. Recent History

- Repository cloned and inspected on branch `audit/opriva-healthcheck`.
- `MEMORY.md` and `DESIGN.md` were not present before this documentation phase.
- Audit confirmed `source/App.jsx` contains `workspaceMode`, `sidebarCollapsed`, `Internal IT`, `MSP / Integrator`, and the current `ReactDOM.createRoot(...)` mount.
- Audit confirmed the current branch is intended for healthcheck and documentation work.
- 2026-05-19: Fase 1A terminology cleanup applied: legacy Corexi AI copy replaced with Opriva AI, Internal IT supplier/vendor terminology normalized toward Provider where safe, and MSP import template terminology aligned toward Distributor. No layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI changes.
- 2026-05-19: Fase 1B cleanup removed confirmed unused mocks/components without changing runtime, layout, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Fase 1C Data Import workspace-aware copy and mock data applied. Data Import now distinguishes MSP client/brand/product/distributor/margin import language from Internal IT brand/provider/department/approval language without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: MSP Attention Center refined into a commercial renewal operations view for MSP / Integrator. MSP now uses client, brand/product, distributor, value, margin, owner, quote blocker and follow-up terminology while preserving Internal IT behavior and shell/runtime stability.
- 2026-05-19: Search / Command Palette made workspace-aware. Placeholder, quick actions, AI suggestions and page labels now adapt to MSP / Integrator, Internal IT, Hybrid and Custom without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Settings → Operating Model refined as the declared workspaceMode source of truth. Terminology, navigation and import previews now reflect MSP / Integrator, Internal IT, Hybrid and Custom commercial models without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Settings Operating Model preview clarified for real user comprehension. The preview now explains operating logic, sidebar navigation and import template structure per workspace mode instead of showing abstract label mappings.
- 2026-05-19: Departments Internal IT terminology refined. Ambiguous Vendor wording was replaced with Brands & Providers in the Internal IT Departments screen across subtitle, toolbar, AI Insight, table headers and detail cards without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Tasks made workspace-aware. Column labels, subtitle, toolbar placeholder, mock task rows and kanban cards now adapt to MSP / Integrator and Internal IT without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Tasks execution context improved. Tasks now include Source, Impact and task-specific Action columns so MSP and Internal IT work queues better reflect Opriva's operational execution layer. Kanban secondary lines now show impact context instead of priority label. No layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI changes.
- 2026-05-19: MSP Tasks execution copy refined. Source, impact and kanban context were tightened to make client renewal tasks more operational without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Reports made workspace-aware. Report templates, export center labels and scheduled/generated report rows now adapt to MSP / Integrator and Internal IT without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Contracts made workspace-aware. Contract columns, tabs, AI Insight, toolbar copy and mock rows now adapt to MSP / Integrator and Internal IT without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Documents made workspace-aware. Document columns, tabs, AI Insight, toolbar copy and mock rows now adapt to MSP / Integrator and Internal IT without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Enterprise Table Rule added. All major Opriva tables should support configurable columns, filters, saved views, bulk actions and export behavior. MVP may represent these controls visually while full persistence is deferred to Phase 2.
- 2026-05-19: Hardware module added as a first-class sidebar route. Hardware tracks physical IT assets, serials, models, warranty end dates, support coverage, ownership, approval status and renewal actions across MSP / Integrator and Internal IT workspaces without changing runtime, layout, topbar, Floating AI or existing routes.
- 2026-05-19: Licenses route corrected to render a true workspace-aware License Portfolio. MSP / Integrator now shows client license records with brand, distributor, value, margin and owner context. Internal IT now shows internal license records with brand, provider, department, approval status and owner context. Previous Brand Intelligence screens were preserved in code as Phase 2 candidates but disconnected from the Licenses route.
- 2026-05-21: Tabbed record drawer implemented. RECORD_STORE established as module-level mutable store. Licenses creation form improved. Attach Document feature added to drawer Documents tab with sessionDocs state dual-written to RECORD_STORE.documents. normalizeDocumentRecords guard prevents document overwrite on DocumentsScreen mount. handleEditField, formatComputedField, and computed-field read-only guard added. Floating AI suppression injected when drawer is open.
- 2026-05-21: Document type taxonomy standardized. "License Certificate" replaced by "License Entitlement" in ATTACH_DOC_FIELDS. License Entitlement covers vendor-issued license proof including certificates, entitlement docs, licensing confirmations, and software rights evidence.
- 2026-05-21: Attach Document form simplified per approved document policy decision. Generic required "Status" field removed. Internal status defaults to 'Attached' on save. Two new optional date fields added: Effective Date and Expiration Date. Document card in drawer no longer shows a status Badge (always 'Attached' = no signal); expiration date is shown if entered.
- 2026-05-21: Master BRIEF updated. Section 15 "Core Record + Related Tabs + Workspace Policies Model" added to MEMORY.md documenting 17 approved product architecture decisions covering: core record creation model, fields that must not be manually entered, License record logic (MSP vs Internal IT), expiration status logic, renewal workflow logic, record creation flow, document management model, Attach Document MVP form, document type taxonomy, requirement logic, access logic, version logic, document date/validity logic, document policy engine direction, package/renewal bundle model, custom fields roadmap, and implementation guidance. MVP and Phase 2 roadmap sections added to Next Steps. No application code modified.
- 2026-05-21: Attach Document form simplified to MVP minimum per MEMORY.md §15.8. Visible fields reduced to Document Name (req), Document Type (req), Uploaded By (req), Notes (optional). Removed from visible form: File Name / Reference, Requirement, Access, Version, Effective Date, Expiration Date. Internal defaults set on save: status='Attached', requirement='Optional', access='Internal'. OPTIONAL section divider removed. Document object shape and RECORD_STORE.documents write unchanged.
- 2026-05-21: MEMORY.md updated. §15.18 "Support Coverage / Support Contracts" added under Section 15. Decision: Support Coverage must be modeled as a renewable contract/coverage layer — not free text inside License or Hardware. Defines Support Coverage record fields, what it may cover, how it is added (drawer setup / Relationships tab / Complete Setup flow), and relationship model to covered assets via Contracts module. MVP roadmap updated: Support Coverage creation/linking from License and Hardware drawer setup. Phase 2 roadmap updated: multi-asset support coverage management, support coverage renewal workflows, support coverage compliance and SLA tracking. No application code modified.
- 2026-05-22: IMPORT_MAPPING_TREND_MICRO.md created. Defines how Nextcom's Trend Micro renewal data (Datos.xlsx + TM LICENSE PDF) maps to Opriva records. Covers Excel-to-package mapping, PDF-to-license-line-item mapping, License Entitlement document model, package structure, support coverage logic (manufacturer vs. Nextcom SLA), MVP manual import steps, and Phase 2 automation roadmap. No application code modified.
- 2026-05-22: IMPORT_MAPPING_QNAP_HARDWARE.md created. Documents QNAP hardware sales export mapping: grouped customer structure, main hardware rows vs. component rows, Brand:Model parsing, multi-value serial validation, warranty extraction from description field, component grouping logic, fast mapping UX, MVP import procedure, Phase 2 automation targets, 4 example normalized records. No application code modified.
- 2026-05-22: MEMORY.md §19 updated. §19.7 "Hardware and Component Import Model" added as universal pattern for grouped hardware/equipment sales files. §19.7 Record Type Inference renumbered §19.9, §19.8 User Controls renumbered §19.10. USER_GUIDE.md and AI_KNOWLEDGE_BASE.md updated with hardware import guidance. No application code modified.
- 2026-05-22: MEMORY.md §19 "Guided Import Mapping Model" added. Core decision: Opriva imports into its own product model, not a replica of the source file. Every import must include a guided column-mapping step with AI-assisted field suggestions, user approval, skip recommendations for calculated/identity columns, custom field creation rule, and record type inference. §18 Trend Micro specific application updated with skip recommendation for Reventa column. MVP Roadmap updated: guided column-mapping step added. Phase 2 Roadmap updated: automated PDF parsing, AI column detection. MEMORY.md, USER_GUIDE.md, AI_KNOWLEDGE_BASE.md updated. No application code modified.
- 2026-05-22: MEMORY.md §18 "Trend Micro Import Model" added. Documents approved import model: Excel row = Renewal Package, PDF page = License line item, PDF file = License Entitlement document, OC Partner/PO Number join key, manufacturer support as derived coverage, Nextcom SLA as separate Support Coverage contract, MVP manual approach, Phase 2 automation targets. MEMORY.md, USER_GUIDE.md, and AI_KNOWLEDGE_BASE.md updated. No application code modified.
- 2026-05-22: OPRIVA_IMPORT_TEMPLATE_SPEC.md created. Defines the Official Opriva Import Template as Path B alongside AI-assisted Path A. Documents 9-sheet workbook structure (Instructions, Clients/Departments, Renewal Packages, Licenses, Hardware, Contracts/Support Coverage, Documents, Tasks, Custom Fields), reference system (Package Reference, Linked Record Reference, Covered Record Reference), all column definitions with required/optional status, controlled vocabulary, validation rules, import preview requirement, and Phase 2 template generation roadmap. MEMORY.md §20 added. USER_GUIDE.md §11 and §12 updated. AI_KNOWLEDGE_BASE.md updated. No application code modified.
- 2026-05-25: BACKEND_READINESS_AUDIT.md committed in `a05ce1d`. The audit documents current local/sandbox functionality and defines backend/database/storage/auth/permissions requirements for corporate MVP readiness. Key conclusion: local/session state is acceptable for UX and product logic testing, but corporate MVP requires backend support for persistence, users, workspaces, roles, permissions, documents, imports, alerts, audit trail, AI knowledge, storage and enterprise testing.
- 2026-05-25: Local Excel Import Sandbox committed in `745585a`. Data Import now supports local `.xlsx` / `.xls` upload, sheet parsing, sheet selection, source detection, header mapping, canonical field mapping, skipped/calculated column handling, row normalization, target module detection, normalized record preview and confirmed local/session creation into `RECORD_STORE`. Imported session records are preserved during mock refresh when `meta.source === 'importSandbox'`. The `xlsx` dependency was added in `package.json` / `package-lock.json`. Build and `git diff --check` passed, and the working tree was clean after the commit. This remains a local sandbox validation feature, not the future backend import engine.
- 2026-05-26: Controlled catalog product decision documented. Brand / Manufacturer, Product / License Name, Distributor / Provider, Vendor / Provider, Reseller / Partner, Client / Department, Owner, Alert Policy, Document Type, Contract Type, Support Coverage Type, License Term, Currency, Country and reusable business classifications should use select/search/create catalog behavior instead of unrestricted free text. Imports and bulk defaults should map to existing catalog values where possible, AI suggestions require user approval, and corporate MVP requires backend catalog tables, normalized keys, aliases/synonyms, duplicate prevention, merge/deactivate flows and audit history.
- 2026-05-27: Import entity detection product decision documented. Bulk upload should detect clients/departments, contacts, brands, products, providers/distributors/resellers, licenses, hardware, contracts/support coverage, renewal packages, documents, tasks, relationships and activity events, then match or stage canonical entities before import confirmation. Local sandbox may simulate entity counts, metadata and relationship staging; corporate MVP requires backend persistence, permissions, contact handling, relationship creation and audit trail.
- 2026-05-27: Record-type-specific import duplicate keys implemented (commit `1e16a13`). `source/importSandbox/importDuplicates.js` added with `buildDuplicateKeys`, `isDuplicateByKeys`, `addKeysToSet` and `matchesExistingRecord`. `meta.duplicateKeys` is now the real source of duplicate detection (preview duplicate-risk flag + confirm-time skip); `meta.importKey` is retained only as a backward-compatible legacy fallback for stored records without `duplicateKeys`. Keys: Licenses = client/department + brand/product + expiration (CSP variant adds order reference); Hardware = serial number primary, fallback client + model/product + order reference or purchase date; Contracts = contract number + end date, fallback client + provider + support/contract type + renewal/end date. Sparse/weak keys are not emitted; empty or `-` serials are ignored; Certificates and Renewal Package keys are dormant. Handling follows Option A (flag in preview, preserve confirm-time skip); strict flag-only handling with row-level include/exclude remains a future UX task. MEMORY.md §19.11 and INTELLIGENT_BULK_UPLOAD_DESIGN.md §11 updated. No application code modified in this documentation pass.
- 2026-05-27: Cross-agent skill parity rule documented. External design/UX/taste skills adapted into Opriva for one AI agent (Claude Code or Codex) must also be adapted — or have a clearly planned equivalent — for the other supported agents to prevent drift between sessions, contributors and tools. Three external design-skill sources are under research only (no install, no clone, no `npx`/`skill.sh` execution, no settings registration approved): `emilkowalski/skill` (license not visible), `pbakaus/impeccable` (Apache 2.0; ships `.claude/`/`.cursor/`/`.agents/`/`.gemini/` directories; optional `npx impeccable detect` CLI), `Leonxlnx/taste-skill` (MIT; portable SKILL.md files; install via `npx skills add` CLI). Likely Codex target locations to inspect before any future adaptation: `.codex/` or `.agents/` style directories if supported by the active Codex tooling, the existing `skills/` SKILL.md home, and `AGENTS.md`. New rule: when the user states that work is continuing in Codex, the assistant must remind the user to replicate or adapt any approved Claude Code skills for Codex parity before proceeding with non-trivial work. Documentation updates: `AGENTS.md` §14, `CLAUDE.md` §5, `OPRIVA_AI_DEVELOPMENT_TEAM.md` §10.1–§10.2 and §11.1, `OPRIVA_DEVELOPMENT_METHODOLOGY.md` §11.1 and §12 (prompt patterns), `MEMORY.md` (this entry). No application code modified; no external skills installed; no dependencies added; no hooks or MCP configured.
- 2026-05-27: Phase 1 external design-skill adoption — added one new Opriva lens `opriva-design-fundamentals-auditor` (mirrored under `skills/` and `.claude/skills/`) covering typography, color and contrast, spatial design, motion discipline, interaction states, responsive design and UX writing — calibrated to Opriva enterprise SaaS, data-heavy tables/drawers/dashboards/import flows, MSP / Integrator and Internal IT. Seven-domain structure is inspired by `pbakaus/impeccable` (Apache 2.0); no impeccable code was installed, cloned, executed or registered (no `npx`, no `.claude/`/`.cursor/`/`.agents/`/`.gemini/` directories adopted, no MCP, no hooks, no dependencies). Attribution recorded at the bottom of the new lens file and in new repo-root `THIRD_PARTY_NOTICES.md`. Lens registered in `OPRIVA_AI_DEVELOPMENT_TEAM.md` §3 and added to the §6.C "UI / Screen Design" lens combination, and in `CLAUDE.md` §4. Codex parity (per `OPRIVA_AI_DEVELOPMENT_TEAM.md` §10.2 / §11.1): the canonical lens lives at `skills/opriva-design-fundamentals-auditor/SKILL.md`; the `.claude/skills/` copy mirrors it for Claude Code project-scoped loading; Codex-specific mirrors (`.codex/`, `.agents/`) deferred until the active Codex tooling's loading path is verified. `Leonxlnx/taste-skill` (MIT) and `emilkowalski/skill` (license not visible) remain deferred to later phases. No application code modified.
